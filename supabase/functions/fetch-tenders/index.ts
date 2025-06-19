const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface TenderRelease {
  ocid: string;
  tender?: {
    title?: string;
    description?: string;
    tenderPeriod?: {
      endDate?: string;
      startDate?: string;
    };
    mainProcurementCategory?: string;
    status?: string;
  };
  buyer?: {
    name?: string;
  };
}

const isOpenTender = (release: TenderRelease): boolean => {
  // Check if tender has a future close date
  if (!release.tender?.tenderPeriod?.endDate) return false;
  
  const endDate = new Date(release.tender.tenderPeriod.endDate);
  const now = new Date();
  
  // Only include tenders that close in the future
  return endDate > now;
};

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

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('Starting comprehensive tender fetch...');
    
    // Expand date range significantly to capture all possible open tenders
    const now = new Date();
    const dateFrom = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]; // 1 year back
    const dateTo = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]; // 1 year forward
    
    console.log(`Fetching tenders from ${dateFrom} to ${dateTo}`);
    
    let allTenders: TenderRelease[] = [];
    let pageNumber = 1;
    let hasMoreData = true;
    let consecutiveEmptyPages = 0;
    const maxConsecutiveEmpty = 5; // Increased tolerance for empty pages
    const maxPages = 500; // Significantly increased to process more data
    const pageSize = 1000; // Maximum page size
    
    // Track performance
    const startTime = Date.now();
    const maxExecutionTime = 80000; // Increased to 80 seconds for more processing time
    
    while (hasMoreData && pageNumber <= maxPages && consecutiveEmptyPages < maxConsecutiveEmpty) {
      // Check execution time to prevent timeout
      if (Date.now() - startTime > maxExecutionTime) {
        console.log('Approaching execution time limit, stopping fetch');
        break;
      }
      
      try {
        console.log(`Fetching page ${pageNumber}/${maxPages}... (${allTenders.length} records so far)`);
        
        const data = await fetchTendersFromAPI(dateFrom, dateTo, pageNumber, pageSize);
        
        if (data.releases && data.releases.length > 0) {
          allTenders = allTenders.concat(data.releases);
          console.log(`Page ${pageNumber}: +${data.releases.length} releases (Total: ${allTenders.length})`);
          consecutiveEmptyPages = 0;
          
          // If we got less than the page size, we're likely at the end
          if (data.releases.length < pageSize) {
            console.log(`Page ${pageNumber} returned ${data.releases.length} items, likely reached end of data`);
            // Don't immediately stop - there might be more data in subsequent pages
            consecutiveEmptyPages++;
          }
        } else {
          console.log(`Page ${pageNumber}: No releases found`);
          consecutiveEmptyPages++;
        }
        
        pageNumber++;
        
        // Reduced delay for faster processing
        if (hasMoreData && pageNumber <= maxPages) {
          await new Promise(resolve => setTimeout(resolve, 10));
        }
        
      } catch (error) {
        console.error(`Error fetching page ${pageNumber}:`, error);
        consecutiveEmptyPages++;
        pageNumber++;
        
        // More resilient error handling - continue unless we hit too many consecutive errors
        if (consecutiveEmptyPages >= 10) {
          console.log('Too many consecutive errors, stopping fetch');
          break;
        }
      }
    }
    
    const fetchDuration = Date.now() - startTime;
    console.log(`Fetch completed in ${fetchDuration}ms. Total tenders fetched: ${allTenders.length}`);
    
    // Filter for open tenders
    const openTenders = allTenders.filter(isOpenTender);
    console.log(`Open tenders after date filtering: ${openTenders.length}`);
    
    // Sort by close date (earliest closing first - most urgent)
    const sortedOpenTenders = openTenders.sort((a, b) => {
      const dateA = new Date(a.tender?.tenderPeriod?.endDate || '');
      const dateB = new Date(b.tender?.tenderPeriod?.endDate || '');
      return dateA.getTime() - dateB.getTime();
    });
    
    // Create simplified tender objects for efficient transfer
    const simplifiedTenders = sortedOpenTenders.map(tender => ({
      ocid: tender.ocid,
      title: tender.tender?.title || 'Untitled Tender',
      description: tender.tender?.description || '',
      category: tender.tender?.mainProcurementCategory || '',
      closeDate: tender.tender?.tenderPeriod?.endDate || '',
      buyer: tender.buyer?.name || '',
      // Keep full data for detail page
      fullData: tender
    }));
    
    const result = {
      lastUpdated: new Date().toISOString(),
      totalFetched: allTenders.length,
      openTenders: openTenders.length,
      tenders: simplifiedTenders,
      dateRange: { from: dateFrom, to: dateTo },
      fetchStats: {
        pagesProcessed: pageNumber - 1,
        maxPagesReached: pageNumber - 1 >= maxPages,
        consecutiveEmptyPages: consecutiveEmptyPages,
        executionTimeMs: fetchDuration,
        stoppedReason: pageNumber - 1 >= maxPages ? 'maxPages' : 
                      consecutiveEmptyPages >= maxConsecutiveEmpty ? 'noMoreData' :
                      Date.now() - startTime > maxExecutionTime ? 'timeout' : 'completed'
      }
    };
    
    console.log(`Returning ${simplifiedTenders.length} open tenders (${allTenders.length > 0 ? ((openTenders.length / allTenders.length) * 100).toFixed(1) : 0}% of total fetched)`);
    
    return new Response(
      JSON.stringify(result),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  } catch (error) {
    console.error('Critical error in fetch-tenders function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        lastUpdated: new Date().toISOString(),
        totalFetched: 0,
        openTenders: 0,
        tenders: [],
        fetchStats: {
          pagesProcessed: 0,
          maxPagesReached: false,
          consecutiveEmptyPages: 0,
          executionTimeMs: 0,
          stoppedReason: 'error'
        }
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  }
})