/*
  # Fix get_tender_stats function

  1. Function Updates
    - Remove reference to non-existent `view_count` column from get_tender_stats function
    - Update function to only use columns that exist in the current schema
    - Ensure function returns proper statistics based on available data

  2. Changes Made
    - Modified get_tender_stats function to remove view_count column reference
    - Function now returns: total_tenders, open_tenders, closing_soon, last_updated
    - All columns referenced now exist in the tenders table schema
*/

-- Drop the existing function if it exists
DROP FUNCTION IF EXISTS get_tender_stats();

-- Recreate the function without the view_count column
CREATE OR REPLACE FUNCTION get_tender_stats()
RETURNS TABLE (
  total_tenders bigint,
  open_tenders bigint,
  closing_soon bigint,
  last_updated timestamptz
) 
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (SELECT COUNT(*) FROM tenders)::bigint as total_tenders,
    (SELECT COUNT(*) FROM tenders WHERE close_date > NOW())::bigint as open_tenders,
    (SELECT COUNT(*) FROM tenders WHERE close_date > NOW() AND close_date <= NOW() + INTERVAL '7 days')::bigint as closing_soon,
    (SELECT MAX(updated_at) FROM tenders) as last_updated;
END;
$$;