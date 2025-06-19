const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Helper function to truncate text to prevent record size issues
const truncateText = (text: string | null | undefined, maxLength: number): string => {
  if (!text) {
    return '';
  }
  if (text.length <= maxLength) {
    return text;
  }
  return text.substring(0, maxLength) + '...';
};

interface AlgoliaRecord {
  objectID: string;
  ocid: string;
  title: string;
  description: string;
  category: string;
  buyer: string;
  department: string;
  close_date: string;
  opening_date: string;
  bid_number: string;
  contact_person: string;
  contact_email: string;
  service_location: string;
  submission_method: string;
  special_conditions: string;
  // Searchable text fields
  searchable_text: string;
  // Numeric fields for filtering
  days_until_close: number;
  is_open: boolean;
  // Timestamps
  created_at: string;
  updated_at: string;
}

const calculateDaysUntilClose = (closeDate: string | null): number => {
  if (!closeDate) return -1;
  
  const close = new Date(closeDate);
  const now = new Date();
  const diffTime = close.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays;
};

const transformTenderToAlgoliaRecord = (tender: any): AlgoliaRecord => {
  const daysUntilClose = calculateDaysUntilClose(tender.close_date);
  
  const MAX_DESC_LENGTH = 5000; // Max length for description fields
  const MAX_OTHER_TEXT_LENGTH = 1000; // Max length for other long text fields

  const truncatedDescription = truncateText(tender.description, MAX_DESC_LENGTH);
  const truncatedBidDescription = truncateText(tender.bid_description, MAX_DESC_LENGTH);
  const truncatedSpecialConditions = truncateText(tender.special_conditions, MAX_OTHER_TEXT_LENGTH);

  // Create a searchable text string from the truncated fields to stay within limits
  const searchable_text = [
    tender.title,
    truncatedDescription,
    truncatedBidDescription,
    tender.category,
    tender.buyer,
    tender.department,
    tender.contact_person,
    tender.service_location,
    truncatedSpecialConditions,
    tender.bid_number,
    tender.reference_number
  ]
  .filter(field => field && typeof field === 'string')
  .join(' ')
  .toLowerCase();

  return {
    objectID: tender.ocid,
    ocid: tender.ocid,
    title: tender.title || '',
    description: truncatedDescription, // Use the truncated version
    category: tender.category || '',
    buyer: tender.buyer || '',
    department: tender.department || '',
    close_date: tender.close_date || '',
    opening_date: tender.opening_date || '',
    bid_number: tender.bid_number || '',
    contact_person: tender.contact_person || '',
    contact_email: tender.contact_email || '',
    service_location: tender.service_location || '',
    submission_method: tender.submission_method || '',
    special_conditions: truncatedSpecialConditions, // Use the truncated version
    searchable_text: searchable_text, // Use the newly created searchable text
    days_until_close: daysUntilClose,
    is_open: daysUntilClose > 0,
    created_at: tender.created_at || '',
    updated_at: tender.updated_at || ''
  };
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('🔍 Starting Algolia indexing process...');
    
    // Get environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const algoliaAppId = Deno.env.get('ALGOLIA_APP_ID');
    const algoliaAdminKey = Deno.env.get('ALGOLIA_ADMIN_KEY');
    const algoliaIndexName = Deno.env.get('ALGOLIA_INDEX_NAME') || 'tenders';
    
    if (!algoliaAppId || !algoliaAdminKey) {
      throw new Error('Algolia configuration missing. Please set ALGOLIA_APP_ID and ALGOLIA_ADMIN_KEY environment variables.');
    }

    // Initialize Supabase client
    const { createClient } = await import('npm:@supabase/supabase-js@2');
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Initialize Algolia client
    const { default: algoliasearch } = await import('npm:algoliasearch@4');
    const algoliaClient = algoliasearch(algoliaAppId, algoliaAdminKey);
    const index = algoliaClient.initIndex(algoliaIndexName);

    console.log(`📊 Fetching tenders from Supabase...`);
    
    // Fetch all tenders from Supabase (we'll index both open and closed for comprehensive search)
    const { data: tenders, error } = await supabase
      .from('tenders')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch tenders: ${error.message}`);
    }

    if (!tenders || tenders.length === 0) {
      console.log('⚠️ No tenders found in database');
      return new Response(
        JSON.stringify({
          success: true,
          message: 'No tenders to index',
          stats: { indexed: 0, total: 0 }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`🔄 Transforming ${tenders.length} tenders for Algolia...`);
    
    // Transform tenders to Algolia records
    const algoliaRecords: AlgoliaRecord[] = tenders.map(transformTenderToAlgoliaRecord);
    
    // Configure index settings for optimal search
    console.log('⚙️ Configuring Algolia index settings...');
    await index.setSettings({
      searchableAttributes: [
        'title',
        'description',
        'searchable_text',
        'buyer',
        'category',
        'department',
        'bid_number'
      ],
      attributesForFaceting: [
        'category',
        'buyer',
        'department',
        'is_open',
        'days_until_close'
      ],
      customRanking: [
        'asc(days_until_close)', // Prioritize tenders closing soon
        'desc(created_at)'       // Then by newest
      ],
      attributesToRetrieve: [
        'objectID',
        'ocid',
        'title',
        'description',
        'category',
        'buyer',
        'close_date',
        'opening_date',
        'days_until_close',
        'is_open'
      ],
      attributesToHighlight: [
        'title',
        'description',
        'buyer',
        'category'
      ],
      hitsPerPage: 24,
      maxValuesPerFacet: 100
    });

    // Index records in batches for better performance
    console.log(`📤 Indexing ${algoliaRecords.length} records to Algolia...`);
    
    const batchSize = 1000;
    let indexedCount = 0;
    
    for (let i = 0; i < algoliaRecords.length; i += batchSize) {
      const batch = algoliaRecords.slice(i, i + batchSize);
      
      try {
        await index.saveObjects(batch);
        indexedCount += batch.length;
        console.log(`✅ Indexed batch ${Math.floor(i/batchSize) + 1}: ${indexedCount}/${algoliaRecords.length} records`);
      } catch (batchError) {
        console.error(`❌ Failed to index batch ${Math.floor(i/batchSize) + 1}:`, batchError);
        throw batchError;
      }
      
      // Small delay between batches to avoid rate limits
      if (i + batchSize < algoliaRecords.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    console.log(`🎉 Successfully indexed ${indexedCount} tenders to Algolia`);

    const result = {
      success: true,
      message: 'Tenders successfully indexed to Algolia',
      stats: {
        total: tenders.length,
        indexed: indexedCount,
        openTenders: algoliaRecords.filter(r => r.is_open).length,
        indexName: algoliaIndexName
      },
      timestamp: new Date().toISOString()
    };

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Algolia indexing failed:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});