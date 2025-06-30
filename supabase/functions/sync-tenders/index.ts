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

// Province mapping for data enrichment
const PROVINCE_KEYWORDS = {
  'Eastern Cape': ['eastern cape', 'ec', 'port elizabeth', 'east london', 'grahamstown', 'mthatha'],
  'Free State': ['free state', 'fs', 'bloemfontein', 'welkom', 'kroonstad'],
  'Gauteng': ['gauteng', 'gp', 'johannesburg', 'pretoria', 'soweto', 'sandton', 'midrand', 'centurion'],
  'KwaZulu-Natal': ['kwazulu-natal', 'kzn', 'durban', 'pietermaritzburg', 'newcastle', 'richards bay'],
  'Limpopo': ['limpopo', 'lp', 'polokwane', 'tzaneen', 'thohoyandou'],
  'Mpumalanga': ['mpumalanga', 'mp', 'nelspruit', 'witbank', 'secunda', 'emalahleni'],
  'Northern Cape': ['northern cape', 'nc', 'kimberley', 'upington', 'springbok'],
  'North West': ['north west', 'nw', 'mafikeng', 'potchefstroom', 'klerksdorp', 'rustenburg'],
  'Western Cape': ['western cape', 'wc', 'cape town', 'stellenbosch', 'paarl', 'george', 'worcester']
};

// Industry keywords for categorization
const INDUSTRY_KEYWORDS = {
  'Information Technology': [
    'it', 'software', 'hardware', 'ict', 'information technology', 'website', 'development',
    'computer', 'system', 'network', 'database', 'programming', 'digital', 'cyber', 'cloud'
  ],
  'Construction & Infrastructure': [
    'construction', 'building', 'civil', 'roads', 'infrastructure', 'maintenance',
    'renovation', 'repair', 'plumbing', 'electrical', 'roofing', 'painting'
  ],
  'Consulting Services': [
    'consulting', 'advisory', 'professional services', 'facilitation', 'strategy',
    'management consulting', 'business consulting', 'technical consulting'
  ],
  'Marketing & Communications': [
    'marketing', 'advertising', 'communication', 'media', 'brand', 'public relations',
    'social media', 'graphic design', 'printing', 'promotional'
  ],
  'Health & Medical': [
    'health', 'medical', 'hospital', 'pharmaceutical', 'ppe', 'healthcare',
    'clinic', 'nursing', 'medical equipment', 'laboratory'
  ],
  'Security Services': [
    'security', 'guarding', 'cctv', 'alarm', 'surveillance', 'access control',
    'security systems', 'patrol', 'monitoring'
  ],
  'Education & Training': [
    'education', 'training', 'learning', 'school', 'university', 'college',
    'workshop', 'course', 'curriculum', 'teaching'
  ],
  'Financial Services': [
    'financial', 'banking', 'insurance', 'accounting', 'audit', 'tax',
    'bookkeeping', 'payroll', 'financial management'
  ],
  'Transportation & Logistics': [
    'transport', 'logistics', 'delivery', 'freight', 'shipping', 'courier',
    'vehicle', 'fleet', 'distribution'
  ],
  'Energy & Utilities': [
    'energy', 'electricity', 'power', 'solar', 'renewable', 'utilities',
    'water', 'gas', 'fuel', 'generator'
  ],
  'Legal Services': [
    'legal', 'law', 'attorney', 'lawyer', 'litigation', 'compliance',
    'regulatory', 'legal advice'
  ]
};

function getProvinceFromLocation(tender: TenderRelease): string | null {
  // Check multiple location sources
  const locationSources = [
    tender.buyer?.address?.locality,
    tender.buyer?.address?.region,
    tender.buyer?.address?.streetAddress,
    tender.buyer?.name,
    tender.tender?.title,
    tender.tender?.description
  ].filter(Boolean);

  const searchText = locationSources.join(' ').toLowerCase();
  
  for (const [province, keywords] of Object.entries(PROVINCE_KEYWORDS)) {
    for (const keyword of keywords) {
      if (searchText.includes(keyword)) {
        return province;
      }
    }
  }
  
  return null;
}

function mapToIndustry(tender: TenderRelease): string {
  const searchText = `${tender.tender?.title || ''} ${tender.tender?.description || ''} ${tender.tender?.mainProcurementCategory || ''}`.toLowerCase();
  
  for (const [industry, keywords] of Object.entries(INDUSTRY_KEYWORDS)) {
    for (const keyword of keywords) {
      if (searchText.includes(keyword)) {
        return industry;
      }
    }
  }
  
  return 'Other';
}

const isOpenTender = (release: TenderRelease): boolean => {
  if (!release.tender?.tenderPeriod?.endDate) return false;
  
  const endDate = new Date(release.tender.tenderPeriod.endDate);
  const now = new Date();
  
  return endDate > now;
};

// Enhanced retry mechanism with exponential backoff
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const fetchWithRetry = async (
  url: string, 
  options: RequestInit = {}, 
  maxRetries: number = 3,
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
  const maxDelay = 30000; // Cap at 30 seconds
  
  return Math.min(exponentialDelay + jitter, maxDelay);
};

const fetchTendersFromAPI = async (dateFrom: string, dateTo: string, pageNumber = 1, pageSize = 1000) => {
  const url = new URL('https://ocds-api.etenders.gov.za/api/OCDSReleases');
  url.searchParams.append('dateFrom', dateFrom);
  url.searchParams.append('dateTo', dateTo);
  url.searchParams.append('PageNumber', pageNumber.toString());
  url.searchParams.append('PageSize', pageSize.toString());

  console.log(`Fetching page ${pageNumber}: ${url.toString()}`);
  
  // Use enhanced retry mechanism
  const response = await fetchWithRetry(url.toString(), {}, 3, 1000);
  
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
    // Enhanced data enrichment
    const province = getProvinceFromLocation(tender);
    const industry = mapToIndustry(tender);

    const tenderData = {
      ocid: tender.ocid,
      title: tender.tender?.title || null,
      description: tender.tender?.description || null,
      category: tender.tender?.mainProcurementCategory || null,
      close_date: tender.tender?.tenderPeriod?.endDate || null,
      opening_date: tender.tender?.tenderPeriod?.startDate || null,
      buyer: tender.buyer?.name || null,
      full_data: tender,
      
      // Enhanced fields with enriched data
      province: province,
      industry_category: industry,
      
      // Existing fields
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
      service_location: tender.buyer?.address?.locality || tender.buyer?.address?.region || null,
      
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

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('Starting intelligent tender sync...');
    
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const { createClient } = await import('npm:@supabase/supabase-js@2');
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Check if we should do a full sync or incremental sync
    const { data: shouldFullSync, error: fullSyncCheckError } = await supabase
      .rpc('should_do_full_sync');
    
    if (fullSyncCheckError) {
      console.error('Error checking full sync requirement:', fullSyncCheckError);
    }
    
    const syncType = shouldFullSync ? 'full' : 'incremental';
    console.log(`Performing ${syncType} sync...`);
    
    let dateFrom: string;
    let dateTo: string;
    let maxPages: number;
    let maxExecutionTime: number;
    
    if (syncType === 'full') {
      // Full sync: comprehensive date range
      const now = new Date();
      dateFrom = new Date(now.getTime() - 730 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]; // 2 years back
      dateTo = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]; // 1 year forward
      maxPages = 1000;
      maxExecutionTime = 110000; // 110 seconds
      console.log(`Full sync: ${dateFrom} to ${dateTo}`);
    } else {
      // Incremental sync: only recent changes
      const { data: lastSyncTimestamp, error: lastSyncError } = await supabase
        .rpc('get_last_sync_timestamp');
      
      if (lastSyncError) {
        console.error('Error getting last sync timestamp:', lastSyncError);
        throw new Error('Failed to get last sync timestamp');
      }
      
      const lastSync = new Date(lastSyncTimestamp);
      const now = new Date();
      
      // Incremental sync from last sync time to 1 year in future
      dateFrom = lastSync.toISOString().split('T')[0];
      dateTo = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      maxPages = 50; // Much smaller for incremental
      maxExecutionTime = 30000; // 30 seconds
      console.log(`Incremental sync: ${dateFrom} to ${dateTo} (since last sync: ${lastSyncTimestamp})`);
    }
    
    let allTenders: TenderRelease[] = [];
    let pageNumber = 1;
    let hasMoreData = true;
    let consecutiveEmptyPages = 0;
    let consecutiveErrors = 0;
    let apiCallsMade = 0;
    const maxConsecutiveEmpty = syncType === 'full' ? 10 : 5;
    const maxConsecutiveErrors = 5; // New: limit consecutive errors
    const pageSize = 1000;
    
    // Track performance
    const startTime = Date.now();
    
    // Fetch tender data with appropriate limits based on sync type
    while (hasMoreData && pageNumber <= maxPages && consecutiveEmptyPages < maxConsecutiveEmpty && consecutiveErrors < maxConsecutiveErrors) {
      if (Date.now() - startTime > maxExecutionTime) {
        console.log(`Approaching execution time limit (${maxExecutionTime}ms), stopping fetch`);
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
        
        // Smaller delay for incremental sync
        const delay = syncType === 'full' ? 50 : 25;
        if (hasMoreData && pageNumber <= maxPages) {
          await sleep(delay);
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
        await sleep(2000);
      }
    }
    
    const fetchDuration = Date.now() - startTime;
    console.log(`Fetch completed in ${fetchDuration}ms. Total tenders fetched: ${allTenders.length}, API calls made: ${apiCallsMade}, Consecutive errors: ${consecutiveErrors}`);
    
    // Store all tenders in database
    console.log('Starting database sync...');
    let successCount = 0;
    let errorCount = 0;
    
    // Process in batches for better performance
    const batchSize = syncType === 'full' ? 50 : 25;
    for (let i = 0; i < allTenders.length; i += batchSize) {
      const batch = allTenders.slice(i, i + batchSize);
      
      const batchPromises = batch.map(tender => upsertTenderToDatabase(supabase, tender));
      const results = await Promise.all(batchPromises);
      
      successCount += results.filter(r => r).length;
      errorCount += results.filter(r => !r).length;
      
      console.log(`Processed batch ${Math.floor(i/batchSize) + 1}: ${successCount} success, ${errorCount} errors`);
      
      // Small delay between batches
      await sleep(50);
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
    
    // Log the sync operation using the new function
    const { data: logId, error: logError } = await supabase
      .rpc('update_sync_timestamp', {
        p_sync_type: syncType,
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
      console.log('Sync operation logged with ID:', logId);
    }
    
    const result = {
      success: syncStatus === 'completed',
      message: `${syncType} sync ${syncStatus === 'completed' ? 'completed successfully' : 'completed with issues'}`,
      syncType,
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
    
    console.log(`${syncType} sync ${syncStatus}: ${successCount} tenders stored, ${errorCount} errors, ${apiCallsMade} API calls, ${consecutiveErrors} consecutive errors`);
    
    return new Response(
      JSON.stringify(result),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  } catch (error) {
    console.error('Critical error in sync-tenders function:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message,
        syncType: 'unknown',
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