const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface DocumentRequest {
  url: string;
  filename?: string;
  format?: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { url, filename = 'document', format = 'pdf' }: DocumentRequest = await req.json();
    
    if (!url) {
      throw new Error('Document URL is required');
    }

    console.log(`Downloading document from: ${url}`);

    // Fetch the document with proper headers to avoid the 500 error
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'application/pdf,application/octet-stream,*/*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    });

    if (!response.ok) {
      console.error(`Failed to fetch document: ${response.status} ${response.statusText}`);
      throw new Error(`Failed to fetch document: ${response.status} ${response.statusText}`);
    }

    // Get the content type from the response
    const contentType = response.headers.get('content-type') || `application/${format}`;
    
    // Get the document content
    const documentBuffer = await response.arrayBuffer();
    
    console.log(`Successfully downloaded document: ${documentBuffer.byteLength} bytes`);

    // Return the document with appropriate headers
    return new Response(documentBuffer, {
      headers: {
        ...corsHeaders,
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}.${format}"`,
        'Content-Length': documentBuffer.byteLength.toString(),
      },
    });

  } catch (error) {
    console.error('Error downloading document:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message || 'Failed to download document'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  }
});