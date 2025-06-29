/*
  # Fix search_tenders function

  1. Problem
    - The search_tenders function references a non-existent 'view_count' column
    - This causes the get-tenders Edge Function to fail when performing searches
    
  2. Solution
    - Update the search_tenders function to remove any reference to view_count
    - Ensure the function works with the actual tenders table schema
    
  3. Changes
    - Drop and recreate the search_tenders function without view_count references
    - Maintain all existing search functionality using available columns
*/

-- Drop the existing function if it exists
DROP FUNCTION IF EXISTS search_tenders(text, integer, integer);

-- Create the corrected search_tenders function
CREATE OR REPLACE FUNCTION search_tenders(
  search_term text,
  limit_count integer DEFAULT 24,
  offset_count integer DEFAULT 0
)
RETURNS TABLE (
  id uuid,
  ocid text,
  title text,
  description text,
  category text,
  close_date timestamptz,
  buyer text,
  full_data jsonb,
  created_at timestamptz,
  updated_at timestamptz,
  bid_number text,
  department text,
  bid_description text,
  service_location text,
  opening_date timestamptz,
  modified_date timestamptz,
  contact_person text,
  contact_email text,
  contact_tel text,
  contact_fax text,
  briefing_session boolean,
  compulsory_briefing boolean,
  briefing_date timestamptz,
  special_conditions text,
  submission_method text,
  submission_email text,
  file_size_limit text,
  required_format text,
  reference_number text,
  documents jsonb
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.id,
    t.ocid,
    t.title,
    t.description,
    t.category,
    t.close_date,
    t.buyer,
    t.full_data,
    t.created_at,
    t.updated_at,
    t.bid_number,
    t.department,
    t.bid_description,
    t.service_location,
    t.opening_date,
    t.modified_date,
    t.contact_person,
    t.contact_email,
    t.contact_tel,
    t.contact_fax,
    t.briefing_session,
    t.compulsory_briefing,
    t.briefing_date,
    t.special_conditions,
    t.submission_method,
    t.submission_email,
    t.file_size_limit,
    t.required_format,
    t.reference_number,
    t.documents
  FROM tenders t
  WHERE 
    (
      search_term = '' OR
      to_tsvector('english', 
        COALESCE(t.title, '') || ' ' ||
        COALESCE(t.description, '') || ' ' ||
        COALESCE(t.buyer, '') || ' ' ||
        COALESCE(t.department, '') || ' ' ||
        COALESCE(t.category, '') || ' ' ||
        COALESCE(t.bid_description, '')
      ) @@ plainto_tsquery('english', search_term)
    )
  ORDER BY 
    CASE 
      WHEN t.close_date IS NULL THEN 1
      WHEN t.close_date > NOW() THEN 0
      ELSE 2
    END,
    t.close_date ASC NULLS LAST,
    t.created_at DESC
  LIMIT limit_count
  OFFSET offset_count;
END;
$$;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION search_tenders(text, integer, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION search_tenders(text, integer, integer) TO anon;
GRANT EXECUTE ON FUNCTION search_tenders(text, integer, integer) TO service_role;