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

// Enhanced retry mechanism with exponential backoff
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const fetchWithRetry = async (
  url: string, 
  options: RequestInit = {}, 
  maxRetries: number = 5, // More retries for full resync
  baseDelay: number = 1000
): Promise<Response> => {
  let lastError: Error;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      console.log(`API request attempt ${attempt + 1}/${maxRetries + 1}: ${url}`);
      
      const response = await fetch(url, {
        ...options,
        headers: {
          'User-Agent': 'Supabase-Edge-Function/1.0',
          'Accept': 'application/json',
          'Connection': 'keep-alive',
          ...options.headers
        }
      });

      // Handle different types of errors
      if (response.ok) {
        console.log(`✅ API request successful on attempt ${attempt + 1}`);
        return response;
      }

      // Determine if we should retry based on status code
      const shouldRetry = shouldRetryRequest(response.status, attempt, maxRetries);
      
      if (!shouldRetry) {
        throw new Error(`API request failed with status ${response.status}: ${response.statusText} (non-retryable)`);
      }

      console.warn(`⚠️ API request failed with status ${response.status} on attempt ${attempt + 1}, will retry...`);
      lastError = new Error(`API request failed: ${response.status} ${response.statusText}`);

    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown fetch error');
      
      // Don't retry on certain types of errors
      if (isNonRetryableError(lastError)) {
        console.error(`❌ Non-retryable error: ${lastError.message}`);
        throw lastError;
      }

      console.warn(`⚠️ API request error on attempt ${attempt + 1}: ${lastError.message}`);
    }

    // Don't wait after the last attempt
    if (attempt < maxRetries) {
      const delay = calculateBackoffDelay(attempt, baseDelay);
      console.log(`⏳ Waiting ${delay}ms before retry...`);
      await sleep(delay);
    }
  }

  console.error(`❌ All retry attempts exhausted for ${url}`);
  throw lastError;
};

const shouldRetryRequest = (statusCode: number, attempt: number, maxRetries: number): boolean => {
  // Don't retry client errors (4xx) except for specific cases
  if (statusCode >= 400 && statusCode < 500) {
    // Retry on rate limiting and request timeout
    return statusCode === 429 || statusCode === 408;
  }
  
  // Retry on server errors (5xx)
  if (statusCode >= 500) {
    return attempt < maxRetries;
  }
  
  return false;
};

const isNonRetryableError = (error: Error): boolean => {
  const message = error.message.toLowerCase();
  
  // Don't retry on DNS resolution errors, certificate errors, etc.
  return (
    message.includes('dns') ||
    message.includes('certificate') ||
    message.includes('ssl') ||
    message.includes('tls') ||
    message.includes('network error') && message.includes('permanent')
  );
};

const calculateBackoffDelay = (attempt: number, baseDelay: number): number => {
  // Exponential backoff with jitter
  const exponentialDelay = baseDelay * Math.pow(2, attempt);
  const jitter = Math.random() * 0.3 * exponentialDelay; // Add up to 30% jitter
  const maxDelay = 60000; // Cap at 60 seconds for full resync
  
  return Math.min(exponentialDelay + jitter, maxDelay);
};

const fetchTendersFromAPI = async (dateFrom: string, dateTo: string, pageNumber = 1, pageSize = 1000) => {
  const url = new URL('https://ocds-api.etenders.gov.za/api/OCDSReleases');
  url.searchParams.append('dateFrom', dateFrom);
  url.searchParams.append('dateTo', dateTo);
  url.searchParams.append('PageNumber', pageNumber.toString());
  url.searchParams.append('PageSize', pageSize.toString());

  console.log(`Fetching page ${pageNumber}: ${url.toString()}`);
  
  // Use enhanced retry mechanism with more retries for full resync
  const response = await fetchWithRetry(url.toString(), {}, 5, 1000);
  
  if (!response.ok) {
    throw new Error(`API request failed: ${response.status} ${response.statusText}`);
  }
  
  const data = await response.json();
  
  // Validate response structure
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid API response: expected JSON object');
  }
  
  return data;
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
    let consecutiveErrors = 0;
    let apiCallsMade = 0;
    const maxConsecutiveEmpty = 15;
    const maxConsecutiveErrors = 10; // Allow more errors for full resync
    const maxPages = 2000; // Higher limit for full re-sync
    const pageSize = 1000;
    
    // Track performance
    const startTime = Date.now();
    const maxExecutionTime = 180000; // 3 minutes for full re-sync
    
    // Fetch all tender data with enhanced error handling
    while (hasMoreData && pageNumber <= maxPages && consecutiveEmptyPages < maxConsecutiveEmpty && consecutiveErrors < maxConsecutiveErrors) {
      if (Date.now() - startTime > maxExecutionTime) {
        console.log('Approaching execution time limit, stopping fetch');
        break;
      }
      
      try {
        console.log(`Fetching page ${pageNumber}/${maxPages}... (${allTenders.length} records so far)`);
        
        const data = await fetchTendersFromAPI(dateFrom, dateTo, pageNumber, pageSize);
        apiCallsMade++;
        consecutiveErrors = 0; // Reset error counter on success
        
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
          await sleep(100);
        }
        
      } catch (error) {
        console.error(`Error fetching page ${pageNumber}:`, error);
        consecutiveErrors++;
        consecutiveEmptyPages++;
        pageNumber++;
        
        // Log detailed error information
        const errorDetails = {
          page: pageNumber - 1,
          error: error instanceof Error ? error.message : 'Unknown error',
          consecutiveErrors,
          timestamp: new Date().toISOString()
        };
        console.error('Detailed error info:', JSON.stringify(errorDetails));
        
        if (consecutiveErrors >= maxConsecutiveErrors) {
          console.log(`Too many consecutive errors (${consecutiveErrors}), stopping fetch`);
          break;
        }
        
        // Longer delay after errors
        await sleep(5000);
      }
    }
    
    const fetchDuration = Date.now() - startTime;
    console.log(`Fetch completed in ${fetchDuration}ms. Total tenders fetched: ${allTenders.length}, API calls made: ${apiCallsMade}, Consecutive errors: ${consecutiveErrors}`);
    
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
      await sleep(100);
    }
    
    // Count open tenders from database
    const { data: openTendersData, error: countError } = await supabase
      .from('tenders')
      .select('id', { count: 'exact' })
      .gt('close_date', new Date().toISOString());
    
    const openTendersCount = openTendersData?.length || 0;
    
    // Determine sync status based on results
    const syncStatus = consecutiveErrors >= maxConsecutiveErrors ? 'partial_failure' : 'completed';
    const stoppedReason = consecutiveErrors >= maxConsecutiveErrors 
      ? `Stopped due to ${consecutiveErrors} consecutive API errors`
      : null;
    
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
      success: syncStatus === 'completed',
      message: `Full re-sync ${syncStatus === 'completed' ? 'completed successfully' : 'completed with issues'}`,
      syncType: 'full_resync',
      syncStatus,
      stoppedReason,
      stats: {
        totalFetched: allTenders.length,
        openTenders: openTendersCount,
        successfulUpserts: successCount,
        errors: errorCount,
        pagesProcessed: pageNumber - 1,
        apiCallsMade,
        consecutiveErrors,
        executionTimeMs: Date.now() - startTime,
        dateRange: { from: dateFrom, to: dateTo },
        efficiency: {
          recordsPerApiCall: apiCallsMade > 0 ? Math.round(allTenders.length / apiCallsMade) : 0,
          recordsPerSecond: Math.round(allTenders.length / ((Date.now() - startTime) / 1000))
        }
      }
    };
    
    console.log(`Full re-sync ${syncStatus}: ${successCount} tenders stored, ${errorCount} errors, ${apiCallsMade} API calls, ${consecutiveErrors} consecutive errors`);
    
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
        syncStatus: 'failed',
        stats: {
          totalFetched: 0,
          openTenders: 0,
          successfulUpserts: 0,
          errors: 1,
          pagesProcessed: 0,
          apiCallsMade: 0,
          consecutiveErrors: 1,
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