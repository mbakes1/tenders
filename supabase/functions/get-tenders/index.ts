const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface GetTendersRequest {
  page?: number;
  limit?: number;
  openOnly?: boolean;
  search?: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('Fetching tenders from database...');
    
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const { createClient } = await import('npm:@supabase/supabase-js@2');
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Parse request body to get parameters
    const requestBody: GetTendersRequest = await req.json();
    const page = requestBody.page || 1;
    const limit = requestBody.limit || 1000;
    const openOnly = requestBody.openOnly !== false; // Default to true
    const searchQuery = requestBody.search || '';
    
    console.log('Request parameters:', { page, limit, openOnly, searchQuery });
    
    // Calculate offset
    const offset = (page - 1) * limit;
    
    // Handle search queries using the search_tenders RPC function
    if (searchQuery.trim()) {
      console.log(`Performing search for: "${searchQuery}"`);
      
      const { data: searchResults, error: searchError } = await supabase
        .rpc('search_tenders', {
          search_term: searchQuery.trim(),
          limit_count: limit,
          offset_count: offset
        });
      
      if (searchError) {
        console.error('Search function error:', searchError);
        throw new Error(`Search failed: ${searchError.message}`);
      }
      
      // Get total count for search results by running the same search without limit
      const { data: countResults, error: countError } = await supabase
        .rpc('search_tenders', {
          search_term: searchQuery.trim(),
          limit_count: 999999, // Large number to get all results for counting
          offset_count: 0
        });
      
      const totalSearchResults = countResults?.length || 0;
      
      // Get general statistics
      const { data: stats } = await supabase.rpc('get_tender_stats');
      
      const result = {
        success: true,
        tenders: searchResults || [],
        pagination: {
          page,
          limit,
          total: totalSearchResults,
          totalPages: Math.ceil(totalSearchResults / limit)
        },
        stats: stats?.[0] || {
          total_tenders: 0,
          open_tenders: 0,
          closing_soon: 0,
          last_updated: null
        },
        lastUpdated: new Date().toISOString()
      };
      
      console.log(`Search returned ${searchResults?.length || 0} results for "${searchQuery}" (total: ${totalSearchResults})`);
      
      return new Response(
        JSON.stringify(result),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      );
    }
    
    // Build standard query for non-search requests
    let query = supabase
      .from('tenders')
      .select('*, view_count', { count: 'exact' });
    
    // Filter for open tenders only if requested
    if (openOnly) {
      query = query.gt('close_date', new Date().toISOString());
    }
    
    // Order by close date (most urgent first for open tenders)
    query = query
      .order('close_date', { ascending: true, nullsLast: true })
      .range(offset, offset + limit - 1);
    
    const { data: tenders, error, count } = await query;
    
    if (error) {
      throw new Error(`Database query failed: ${error.message}`);
    }
    
    // Get statistics
    const { data: stats } = await supabase
      .rpc('get_tender_stats');
    
    const result = {
      success: true,
      tenders: tenders || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      },
      stats: stats?.[0] || {
        total_tenders: 0,
        open_tenders: 0,
        closing_soon: 0,
        last_updated: null
      },
      lastUpdated: new Date().toISOString()
    };
    
    console.log(`Returned ${tenders?.length || 0} tenders (page ${page}/${result.pagination.totalPages})`);
    
    return new Response(
      JSON.stringify(result),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  } catch (error) {
    console.error('Error in get-tenders function:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message,
        tenders: [],
        pagination: { page: 1, limit: 1000, total: 0, totalPages: 0 },
        stats: { total_tenders: 0, open_tenders: 0, closing_soon: 0, last_updated: null }
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  }
})