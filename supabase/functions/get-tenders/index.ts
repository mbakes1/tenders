const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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
    
    // Get query parameters
    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '1000');
    const openOnly = url.searchParams.get('openOnly') === 'true';
    
    // Calculate offset
    const offset = (page - 1) * limit;
    
    // Build query
    let query = supabase
      .from('tenders')
      .select('*', { count: 'exact' });
    
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