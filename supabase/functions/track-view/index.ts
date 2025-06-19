const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ViewTrackingRequest {
  tenderOcid: string;
  userAgent?: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const { createClient } = await import('npm:@supabase/supabase-js@2');
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get request data
    const { tenderOcid, userAgent }: ViewTrackingRequest = await req.json();
    
    if (!tenderOcid) {
      throw new Error('Tender OCID is required');
    }
    
    // Get client IP address
    const clientIP = req.headers.get('x-forwarded-for') || 
                    req.headers.get('x-real-ip') || 
                    'unknown';
    
    // Get user ID if authenticated
    const authHeader = req.headers.get('authorization');
    let userId = null;
    
    if (authHeader) {
      try {
        const { data: { user } } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
        userId = user?.id || null;
      } catch (error) {
        // User not authenticated, continue without user ID
        console.log('User not authenticated:', error);
      }
    }
    
    console.log(`Tracking view for tender ${tenderOcid} from IP ${clientIP}`);
    
    // Call the increment function
    const { data, error } = await supabase
      .rpc('increment_tender_view', {
        p_tender_ocid: tenderOcid,
        p_viewer_ip: clientIP,
        p_user_agent: userAgent || req.headers.get('user-agent'),
        p_user_id: userId
      });
    
    if (error) {
      console.error('Error tracking view:', error);
      throw error;
    }
    
    // Get updated view count
    const { data: tenderData, error: fetchError } = await supabase
      .from('tenders')
      .select('view_count')
      .eq('ocid', tenderOcid)
      .single();
    
    if (fetchError) {
      console.error('Error fetching updated view count:', fetchError);
    }
    
    const result = {
      success: true,
      viewRecorded: data,
      viewCount: tenderData?.view_count || 0,
      message: data ? 'View recorded successfully' : 'View already recorded recently'
    };
    
    console.log(`View tracking result:`, result);
    
    return new Response(
      JSON.stringify(result),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
    
  } catch (error) {
    console.error('Error in track-view function:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message,
        viewRecorded: false,
        viewCount: 0
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  }
})