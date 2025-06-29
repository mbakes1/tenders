const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface GetTendersRequest {
  page?: number;
  limit?: number;
  search?: string;
  province?: string;
  industry?: string;
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
    const limit = requestBody.limit || 24;
    const searchQuery = requestBody.search || '';
    const province = requestBody.province || 'All Provinces';
    const industry = requestBody.industry || 'All Industries';
    
    console.log('Request parameters:', { page, limit, searchQuery, province, industry });
    
    // Calculate offset
    const offset = (page - 1) * limit;
    
    // Use the new comprehensive filtering function
    const { data: results, error: filterError } = await supabase
      .rpc('filter_tenders', {
        p_search_term: searchQuery.trim(),
        p_province: province === 'All Provinces' ? null : province,
        p_industry: industry === 'All Industries' ? null : industry,
        p_limit: limit,
        p_offset: offset
      });
    
    if (filterError) {
      console.error('Filter function error:', filterError);
      throw new Error(`Database query failed: ${filterError.message}`);
    }

    const totalCount = results?.[0]?.total_count || 0;
    const tenders = results?.map(t => {
      const { total_count, ...tenderData } = t;
      return tenderData;
    }) || [];

    // Get general statistics
    const { data: stats } = await supabase.rpc('get_tender_stats');
    
    // Get available filter options
    const { data: filterOptions } = await supabase.rpc('get_filter_options');

    const result = {
      success: true,
      tenders: tenders,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit)
      },
      stats: stats?.[0] || {
        total_tenders: 0,
        open_tenders: 0,
        closing_soon: 0,
        last_updated: null
      },
      filters: {
        provinces: filterOptions?.[0]?.provinces || [],
        industries: filterOptions?.[0]?.industries || []
      },
      lastUpdated: new Date().toISOString()
    };
    
    console.log(`Returned ${tenders?.length || 0} tenders (page ${page}/${result.pagination.totalPages})`);
    console.log(`Filters applied: province=${province}, industry=${industry}, search="${searchQuery}"`);
    
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
        pagination: { page: 1, limit: 24, total: 0, totalPages: 0 },
        stats: { total_tenders: 0, open_tenders: 0, closing_soon: 0, last_updated: null },
        filters: { provinces: [], industries: [] }
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  }
})