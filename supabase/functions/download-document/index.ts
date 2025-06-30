const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface DocumentRequest {
  url: string;
  filename?: string;
  format?: string;
}

// Enhanced retry mechanism for document downloads
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const fetchDocumentWithRetry = async (
  url: string, 
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<Response> => {
  let lastError: Error;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Document download attempt ${attempt + 1}/${maxRetries + 1}: ${url}`);
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'application/pdf,application/octet-stream,*/*',
          'Accept-Language': 'en-US,en;q=0.9',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
          'Connection': 'keep-alive'
        }
      });

      if (response.ok) {
        console.log(`✅ Document download successful on attempt ${attempt + 1}`);
        return response;
      }

      // Determine if we should retry based on status code
      const shouldRetry = shouldRetryDocumentRequest(response.status, attempt, maxRetries);
      
      if (!shouldRetry) {
        throw new Error(`Document download failed with status ${response.status}: ${response.statusText} (non-retryable)`);
      }

      console.warn(`⚠️ Document download failed with status ${response.status} on attempt ${attempt + 1}, will retry...`);
      lastError = new Error(`Document download failed: ${response.status} ${response.statusText}`);

    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown fetch error');
      
      // Don't retry on certain types of errors
      if (isNonRetryableDocumentError(lastError)) {
        console.error(`❌ Non-retryable document error: ${lastError.message}`);
        throw lastError;
      }

      console.warn(`⚠️ Document download error on attempt ${attempt + 1}: ${lastError.message}`);
    }

    // Don't wait after the last attempt
    if (attempt < maxRetries) {
      const delay = calculateDocumentBackoffDelay(attempt, baseDelay);
      console.log(`⏳ Waiting ${delay}ms before document retry...`);
      await sleep(delay);
    }
  }

  console.error(`❌ All document download retry attempts exhausted for ${url}`);
  throw lastError;
};

const shouldRetryDocumentRequest = (statusCode: number, attempt: number, maxRetries: number): boolean => {
  // Don't retry client errors (4xx) except for specific cases
  if (statusCode >= 400 && statusCode < 500) {
    // Retry on rate limiting, request timeout, and temporary unavailable
    return statusCode === 429 || statusCode === 408 || statusCode === 503;
  }
  
  // Retry on server errors (5xx)
  if (statusCode >= 500) {
    return attempt < maxRetries;
  }
  
  return false;
};

const isNonRetryableDocumentError = (error: Error): boolean => {
  const message = error.message.toLowerCase();
  
  // Don't retry on DNS resolution errors, certificate errors, etc.
  return (
    message.includes('dns') ||
    message.includes('certificate') ||
    message.includes('ssl') ||
    message.includes('tls') ||
    message.includes('network error') && message.includes('permanent') ||
    message.includes('not found') ||
    message.includes('forbidden')
  );
};

const calculateDocumentBackoffDelay = (attempt: number, baseDelay: number): number => {
  // Exponential backoff with jitter for document downloads
  const exponentialDelay = baseDelay * Math.pow(2, attempt);
  const jitter = Math.random() * 0.2 * exponentialDelay; // Add up to 20% jitter
  const maxDelay = 10000; // Cap at 10 seconds for document downloads
  
  return Math.min(exponentialDelay + jitter, maxDelay);
};

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

    // Fetch the document with enhanced retry mechanism
    const response = await fetchDocumentWithRetry(url, 3, 1000);

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
        error: error.message || 'Failed to download document',
        retryable: !isNonRetryableDocumentError(error instanceof Error ? error : new Error('Unknown error'))
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  }
});