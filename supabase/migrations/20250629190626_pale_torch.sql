/*
  # Fix filter_tenders function to handle "All Provinces" and "All Industries"

  The current filter_tenders function doesn't properly handle the "All Provinces" and "All Industries"
  filter values sent from the frontend. This migration updates the function to treat these values
  as "no filter" conditions.
*/

-- Drop and recreate the filter_tenders function with proper handling of "All" values
DROP FUNCTION IF EXISTS filter_tenders(text, text, text, integer, integer);

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
        AND (p_province IS NULL OR p_province = '' OR p_province = 'All' OR p_province = 'All Provinces' OR t.province = p_province)
        AND (p_industry IS NULL OR p_industry = '' OR p_industry = 'All' OR p_industry = 'All Industries' OR t.industry_category = p_industry)
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
        AND (p_province IS NULL OR p_province = '' OR p_province = 'All' OR p_province = 'All Provinces' OR t.province = p_province)
        AND (p_industry IS NULL OR p_industry = '' OR p_industry = 'All' OR p_industry = 'All Industries' OR t.industry_category = p_industry)
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

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION filter_tenders(text, text, text, integer, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION filter_tenders(text, text, text, integer, integer) TO anon;
GRANT EXECUTE ON FUNCTION filter_tenders(text, text, text, integer, integer) TO service_role;