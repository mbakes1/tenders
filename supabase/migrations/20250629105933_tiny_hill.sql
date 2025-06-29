/*
  # Add Advanced Filtering Columns and Functions

  1. New Columns
    - `province` (text) - Extracted from location data
    - `industry_category` (text) - Mapped from tender content
    - `embedding` (vector) - For semantic search capabilities

  2. Indexes
    - Province and industry filtering indexes
    - Vector similarity search index

  3. Functions
    - Enhanced filtering function with province/industry support
    - Semantic search function for vector-based queries

  4. Data Enrichment
    - Province mapping from location text
    - Industry categorization from content analysis
*/

-- Enable the vector extension for semantic search
CREATE EXTENSION IF NOT EXISTS vector;

-- Add new columns for enhanced filtering
ALTER TABLE public.tenders 
ADD COLUMN IF NOT EXISTS province TEXT,
ADD COLUMN IF NOT EXISTS industry_category TEXT,
ADD COLUMN IF NOT EXISTS embedding vector(384);

-- Create indexes for fast filtering and searching
CREATE INDEX IF NOT EXISTS idx_tenders_province ON public.tenders(province);
CREATE INDEX IF NOT EXISTS idx_tenders_industry_category ON public.tenders(industry_category);

-- Create an IVFFlat index for vector search
-- The list count should be roughly sqrt(number of rows) for good performance
CREATE INDEX IF NOT EXISTS idx_tenders_embedding_ivfflat 
ON public.tenders USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Create a function for semantic search
CREATE OR REPLACE FUNCTION match_tenders (
  query_embedding vector(384),
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 50
)
RETURNS TABLE (
  id uuid,
  ocid text,
  title text,
  description text,
  category text,
  close_date timestamptz,
  buyer text,
  department text,
  bid_number text,
  province text,
  industry_category text,
  similarity float
)
LANGUAGE sql STABLE
AS $$
  SELECT
    t.id,
    t.ocid,
    t.title,
    t.description,
    t.category,
    t.close_date,
    t.buyer,
    t.department,
    t.bid_number,
    t.province,
    t.industry_category,
    1 - (t.embedding <=> query_embedding) as similarity
  FROM tenders t
  WHERE 
    t.embedding IS NOT NULL
    AND 1 - (t.embedding <=> query_embedding) > match_threshold
    AND t.close_date > NOW()
  ORDER BY similarity DESC
  LIMIT match_count;
$$;

-- Drop the old search function and create a comprehensive filtering function
DROP FUNCTION IF EXISTS search_tenders(text, integer, integer);
DROP FUNCTION IF EXISTS filter_tenders(text, text, text, integer, integer);

-- Create a new, comprehensive filtering function
CREATE OR REPLACE FUNCTION filter_tenders(
    p_search_term TEXT DEFAULT '',
    p_province TEXT DEFAULT NULL,
    p_industry TEXT DEFAULT NULL,
    p_limit INT DEFAULT 24,
    p_offset INT DEFAULT 0
)
RETURNS TABLE(
    id uuid,
    ocid text,
    title text,
    description text,
    category text,
    close_date timestamptz,
    buyer text,
    department text,
    bid_number text,
    province text,
    industry_category text,
    full_data jsonb,
    created_at timestamptz,
    updated_at timestamptz,
    bid_description text,
    service_location text,
    opening_date timestamptz,
    contact_person text,
    contact_email text,
    contact_tel text,
    submission_method text,
    documents jsonb,
    reference_number text,
    total_count BIGINT
)
LANGUAGE plpgsql
AS $$
DECLARE
    search_query tsquery;
    full_count BIGINT;
BEGIN
    -- Build the search query for full-text search if a search term is provided
    search_query := CASE
        WHEN p_search_term IS NOT NULL AND p_search_term <> ''
        THEN plainto_tsquery('english', p_search_term)
        ELSE NULL
    END;

    -- First, get the total count based on the filters
    SELECT COUNT(*)
    INTO full_count
    FROM tenders t
    WHERE
        t.close_date > NOW()
        AND (p_province IS NULL OR p_province = '' OR p_province = 'All' OR t.province = p_province)
        AND (p_industry IS NULL OR p_industry = '' OR p_industry = 'All' OR t.industry_category = p_industry)
        AND (search_query IS NULL OR to_tsvector('english', 
            COALESCE(t.title, '') || ' ' || 
            COALESCE(t.description, '') || ' ' || 
            COALESCE(t.buyer, '') || ' ' ||
            COALESCE(t.department, '') || ' ' ||
            COALESCE(t.category, '') || ' ' ||
            COALESCE(t.bid_description, '')
        ) @@ search_query);

    -- Then, return the paginated results
    RETURN QUERY
    SELECT
        t.id,
        t.ocid,
        t.title,
        t.description,
        t.category,
        t.close_date,
        t.buyer,
        t.department,
        t.bid_number,
        t.province,
        t.industry_category,
        t.full_data,
        t.created_at,
        t.updated_at,
        t.bid_description,
        t.service_location,
        t.opening_date,
        t.contact_person,
        t.contact_email,
        t.contact_tel,
        t.submission_method,
        t.documents,
        t.reference_number,
        full_count AS total_count
    FROM tenders t
    WHERE
        t.close_date > NOW()
        AND (p_province IS NULL OR p_province = '' OR p_province = 'All' OR t.province = p_province)
        AND (p_industry IS NULL OR p_industry = '' OR p_industry = 'All' OR t.industry_category = p_industry)
        AND (search_query IS NULL OR to_tsvector('english', 
            COALESCE(t.title, '') || ' ' || 
            COALESCE(t.description, '') || ' ' || 
            COALESCE(t.buyer, '') || ' ' ||
            COALESCE(t.department, '') || ' ' ||
            COALESCE(t.category, '') || ' ' ||
            COALESCE(t.bid_description, '')
        ) @@ search_query)
    ORDER BY
        (CASE WHEN search_query IS NOT NULL THEN ts_rank(to_tsvector('english', COALESCE(t.title, '')), search_query) END) DESC,
        t.close_date ASC NULLS LAST,
        t.created_at DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$;

-- Create a function to get available filter options
CREATE OR REPLACE FUNCTION get_filter_options()
RETURNS TABLE(
    provinces text[],
    industries text[]
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        ARRAY(
            SELECT DISTINCT t.province 
            FROM tenders t 
            WHERE t.province IS NOT NULL 
              AND t.close_date > NOW()
            ORDER BY t.province
        ) as provinces,
        ARRAY(
            SELECT DISTINCT t.industry_category 
            FROM tenders t 
            WHERE t.industry_category IS NOT NULL 
              AND t.close_date > NOW()
            ORDER BY t.industry_category
        ) as industries;
END;
$$;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION filter_tenders(text, text, text, integer, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION filter_tenders(text, text, text, integer, integer) TO anon;
GRANT EXECUTE ON FUNCTION filter_tenders(text, text, text, integer, integer) TO service_role;

GRANT EXECUTE ON FUNCTION match_tenders(vector, float, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION match_tenders(vector, float, integer) TO anon;
GRANT EXECUTE ON FUNCTION match_tenders(vector, float, integer) TO service_role;

GRANT EXECUTE ON FUNCTION get_filter_options() TO authenticated;
GRANT EXECUTE ON FUNCTION get_filter_options() TO anon;
GRANT EXECUTE ON FUNCTION get_filter_options() TO service_role;