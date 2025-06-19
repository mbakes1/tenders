const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// This function will run automatically every 6 hours to sync tender data
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('🕐 Automated tender sync started at:', new Date().toISOString());
    
    // Get Supabase environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase configuration');
    }

    // Call the sync-tenders function
    const syncResponse = await fetch(`${supabaseUrl}/functions/v1/sync-tenders`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!syncResponse.ok) {
      const errorText = await syncResponse.text();
      throw new Error(`Sync function failed: ${syncResponse.status} ${errorText}`);
    }

    const syncResult = await syncResponse.json();
    
    if (!syncResult.success) {
      throw new Error(`Sync operation failed: ${syncResult.error}`);
    }

    console.log('✅ Automated sync completed successfully:', {
      totalFetched: syncResult.stats?.totalFetched || 0,
      openTenders: syncResult.stats?.openTenders || 0,
      executionTime: syncResult.stats?.executionTimeMs || 0
    });

    // Return success response
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Automated tender sync completed successfully',
        timestamp: new Date().toISOString(),
        stats: syncResult.stats
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )

  } catch (error) {
    console.error('❌ Automated sync failed:', error);
    
    // Log the error but don't fail completely - we want the scheduler to keep trying
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  }
})