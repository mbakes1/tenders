const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// This function runs automatically every 15 minutes for incremental sync
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('🕐 Automated incremental tender sync started at:', new Date().toISOString());
    
    // Get Supabase environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase configuration');
    }

    // Step 1: Perform incremental sync (this will automatically determine if full sync is needed)
    console.log('📊 Step 1: Running intelligent sync (incremental/full as needed)...');
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

    console.log(`✅ ${syncResult.syncType} sync completed successfully:`, {
      totalFetched: syncResult.stats?.totalFetched || 0,
      openTenders: syncResult.stats?.openTenders || 0,
      apiCalls: syncResult.stats?.apiCallsMade || 0,
      executionTime: syncResult.stats?.executionTimeMs || 0,
      efficiency: syncResult.stats?.efficiency || {}
    });

    // Step 2: Index tenders to Algolia (if configured)
    const algoliaAppId = Deno.env.get('ALGOLIA_APP_ID');
    const algoliaAdminKey = Deno.env.get('ALGOLIA_ADMIN_KEY');
    
    let algoliaResult = null;
    
    if (algoliaAppId && algoliaAdminKey) {
      console.log('🔍 Step 2: Indexing tenders to Algolia...');
      
      try {
        const algoliaResponse = await fetch(`${supabaseUrl}/functions/v1/index-tenders-to-algolia`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${supabaseServiceKey}`,
            'Content-Type': 'application/json',
          },
        });

        if (algoliaResponse.ok) {
          algoliaResult = await algoliaResponse.json();
          
          if (algoliaResult.success) {
            console.log('✅ Algolia indexing completed successfully:', {
              indexed: algoliaResult.stats?.indexed || 0,
              total: algoliaResult.stats?.total || 0
            });
          } else {
            console.warn('⚠️ Algolia indexing failed:', algoliaResult.error);
          }
        } else {
          console.warn('⚠️ Algolia indexing request failed:', algoliaResponse.status);
        }
      } catch (algoliaError) {
        console.warn('⚠️ Algolia indexing error:', algoliaError);
        // Don't fail the entire process if Algolia fails
      }
    } else {
      console.log('ℹ️ Algolia not configured, skipping search indexing');
    }

    // Return success response with enhanced metrics
    return new Response(
      JSON.stringify({
        success: true,
        message: `Automated ${syncResult.syncType} sync completed successfully`,
        timestamp: new Date().toISOString(),
        syncType: syncResult.syncType,
        stats: {
          database: syncResult.stats,
          algolia: algoliaResult?.stats || null
        },
        performance: {
          totalExecutionTime: Date.now() - new Date().getTime(),
          apiEfficiency: syncResult.stats?.efficiency || {},
          syncFrequency: syncResult.syncType === 'incremental' ? 'every 15 minutes' : 'weekly'
        }
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
        timestamp: new Date().toISOString(),
        syncType: 'unknown'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  }
})