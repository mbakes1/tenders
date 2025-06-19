const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// This function sets up a recurring timer to call the scheduler every 6 hours
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('🚀 Setting up automated tender sync scheduler...');
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    // Function to run the scheduler
    const runScheduler = async () => {
      try {
        console.log('⏰ Running scheduled sync at:', new Date().toISOString());
        
        const response = await fetch(`${supabaseUrl}/functions/v1/scheduler`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${supabaseServiceKey}`,
            'Content-Type': 'application/json',
          },
        });

        const result = await response.json();
        console.log('📊 Scheduled sync result:', result);
        
      } catch (error) {
        console.error('❌ Scheduled sync error:', error);
      }
    };

    // Run immediately on startup
    console.log('🔄 Running initial sync...');
    await runScheduler();

    // Set up recurring timer (every 6 hours = 6 * 60 * 60 * 1000 ms)
    const intervalId = setInterval(runScheduler, 6 * 60 * 60 * 1000);

    // Keep the function alive
    console.log('✅ Scheduler is now running. Will sync every 6 hours.');
    
    // Return success but keep the function running
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Automated scheduler is now active',
        nextSync: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(),
        interval: '6 hours'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )

  } catch (error) {
    console.error('❌ Failed to set up scheduler:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  }
})