const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface TenderRelease {
  ocid: string;
  tender?: {
    id?: string;
    title?: string;
    description?: string;
    tenderPeriod?: {
      endDate?: string;
      startDate?: string;
    };
    mainProcurementCategory?: string;
    status?: string;
    procurementMethod?: string;
    procurementMethodDetails?: string;
    documents?: any[];
    items?: any[];
    value?: {
      amount?: number;
      currency?: string;
    };
  };
  buyer?: {
    name?: string;
    identifier?: {
      id?: string;
    };
    address?: any;
    contactPoint?: any;
  };
  planning?: any;
  parties?: any[];
  awards?: any[];
  contracts?: any[];
}

const fetchTendersFromAPI = async (dateFrom: string, dateTo: string, pageNumber = 1, pageSize = 1000) => {
  const url = new URL('https://ocds-api.etenders.gov.za/api/OCDSReleases');
  url.searchParams.append('dateFrom', dateFrom);
  url.searchParams.append('dateTo', dateTo);
  url.searchParams.append('PageNumber', pageNumber.toString());
  url.searchParams.append('PageSize', pageSize.toString());

  console.log(`Fetching page ${pageNumber}: ${url.toString()}`);
  
  const response = await fetch(url.toString(), {
    headers: {
      'User-Agent': 'Supabase-Edge-Function/1.0',
      'Accept': 'application/json'
    }
  });
  
  if (!response.ok) {
    throw new Error(`API request failed: ${response.status} ${response.statusText}`);
  }
  
  return await response.json();
};

const upsertTenderToDatabase = async (supabaseClient: any, tender: TenderRelease) => {
  try {
    const tenderData = {
      ocid: tender.ocid,
      title: tender.tender?.title || null,
      description: tender.tender?.description || null,
      category: tender.tender?.mainProcurementCategory || null,
      close_date: tender.tender?.tenderPeriod?.endDate || null,
      opening_date: tender.tender?.tenderPeriod?.startDate || null,
      buyer: tender.buyer?.name || null,
      full_data: tender,
      
      // Additional fields from the enhanced schema
      bid_number: tender.tender?.id || null,
      department: tender.buyer?.name || null,
      bid_description: tender.tender?.description || null,
      contact_person: tender.buyer?.contactPoint?.name || null,
      contact_email: tender.buyer?.contactPoint?.email || null,
      contact_tel: tender.buyer?.contactPoint?.telephone || null,
      contact_fax: tender.buyer?.contactPoint?.faxNumber || null,
      submission_method: tender.tender?.procurementMethod || null,
      documents: tender.tender?.documents || null,
      reference_number: tender.tender?.id || null,
      
      updated_at: new Date().toISOString()
    };

    const { error } = await supabaseClient
      .from('tenders')
      .upsert(tenderData, { 
        onConflict: 'ocid',
        ignoreDuplicates: false 
      });

    if (error) {
      console.error(`Error upserting tender ${tender.ocid}:`, error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error(`Error processing tender ${tender.ocid}:`, error);
    return false;
  }
};

// This function performs a comprehensive full re-sync (manual trigger only)
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('Starting FULL RE-SYNC of all tender data...');
    
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const { createClient } = await import('npm:@supabase/supabase-js@2');
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Full re-sync: maximum date range for complete data recovery
    const now = new Date();
    const dateFrom = new Date(now.getTime() - 1095 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]; // 3 years back
    const dateTo = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]; // 1 year forward
    
    console.log(`Full re-sync date range: ${dateFrom} to ${dateTo}`);
    
    let allTenders: TenderRelease[] = [];
    let pageNumber = 1;
    let hasMoreData = true;
    let consecutiveEmptyPages = 0;
    let apiCallsMade = 0;
    const maxConsecutiveEmpty = 15;
    const maxPages = 2000; // Higher limit for full re-sync
    const pageSize = 1000;
    
    // Track performance
    const startTime = Date.now();
    const maxExecutionTime = 180000; // 3 minutes for full re-sync
    
    // Fetch all tender data
    while (hasMoreData && pageNumber <= maxPages && consecutiveEmptyPages < maxConsecutiveEmpty) {
      if (Date.now() - startTime > maxExecutionTime) {
        console.log('Approaching execution time limit, stopping fetch');
        break;
      }
      
      try {
        console.log(`Fetching page ${pageNumber}/${maxPages}... (${allTenders.length} records so far)`);
        
        const data = await fetchTendersFromAPI(dateFrom, dateTo, pageNumber, pageSize);
        apiCallsMade++;
        
        if (data.releases && data.releases.length > 0) {
          allTenders = allTenders.concat(data.releases);
          console.log(`Page ${pageNumber}: +${data.releases.length} releases (Total: ${allTenders.length})`);
          consecutiveEmptyPages = 0;
          
          if (data.releases.length < pageSize) {
            consecutiveEmptyPages++;
          }
        } else {
          console.log(`Page ${pageNumber}: No releases found`);
          consecutiveEmptyPages++;
        }
        
        pageNumber++;
        
        // Small delay to prevent overwhelming the API
        if (hasMoreData && pageNumber <= maxPages) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        
      } catch (error) {
        console.error(`Error fetching page ${pageNumber}:`, error);
        consecutiveEmptyPages++;
        pageNumber++;
        
        if (consecutiveEmptyPages >= 20) {
          console.log('Too many consecutive errors, stopping fetch');
          break;
        }
      }
    }
    
    const fetchDuration = Date.now() - startTime;
    console.log(`Fetch completed in ${fetchDuration}ms. Total tenders fetched: ${allTenders.length}, API calls made: ${apiCallsMade}`);
    
    // Store all tenders in database
    console.log('Starting database sync...');
    let successCount = 0;
    let errorCount = 0;
    
    // Process in larger batches for full re-sync
    const batchSize = 100;
    for (let i = 0; i < allTenders.length; i += batchSize) {
      const batch = allTenders.slice(i, i + batchSize);
      
      const batchPromises = batch.map(tender => upsertTenderToDatabase(supabase, tender));
      const results = await Promise.all(batchPromises);
      
      successCount += results.filter(r => r).length;
      errorCount += results.filter(r => !r).length;
      
      console.log(`Processed batch ${Math.floor(i/batchSize) + 1}: ${successCount} success, ${errorCount} errors`);
      
      // Small delay between batches
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    // Count open tenders from database
    const { data: openTendersData, error: countError } = await supabase
      .from('tenders')
      .select('id', { count: 'exact' })
      .gt('close_date', new Date().toISOString());
    
    const openTendersCount = openTendersData?.length || 0;
    
    // Log the full re-sync operation
    const { data: logId, error: logError } = await supabase
      .rpc('update_sync_timestamp', {
        p_sync_type: 'full_resync',
        p_total_fetched: allTenders.length,
        p_open_tenders: openTendersCount,
        p_pages_processed: pageNumber - 1,
        p_execution_time_ms: Date.now() - startTime,
        p_api_calls_made: apiCallsMade,
        p_date_range_from: dateFrom,
        p_date_range_to: dateTo
      });
    
    if (logError) {
      console.error('Error logging sync operation:', logError);
    } else {
      console.log('Full re-sync operation logged with ID:', logId);
    }
    
    const result = {
      success: true,
      message: 'Full re-sync completed successfully',
      syncType: 'full_resync',
      stats: {
        totalFetched: allTenders.length,
        openTenders: openTendersCount,
        successfulUpserts: successCount,
        errors: errorCount,
        pagesProcessed: pageNumber - 1,
        apiCallsMade,
        executionTimeMs: Date.now() - startTime,
        dateRange: { from: dateFrom, to: dateTo },
        efficiency: {
          recordsPerApiCall: apiCallsMade > 0 ? Math.round(allTenders.length / apiCallsMade) : 0,
          recordsPerSecond: Math.round(allTenders.length / ((Date.now() - startTime) / 1000))
        }
      }
    };
    
    console.log(`Full re-sync completed: ${successCount} tenders stored, ${errorCount} errors, ${apiCallsMade} API calls`);
    
    return new Response(
      JSON.stringify(result),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  } catch (error) {
    console.error('Critical error in full-resync-tenders function:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message,
        syncType: 'full_resync',
        stats: {
          totalFetched: 0,
          openTenders: 0,
          successfulUpserts: 0,
          errors: 1,
          pagesProcessed: 0,
          apiCallsMade: 0,
          executionTimeMs: 0
        }
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  }
})