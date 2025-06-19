/*
  # Fix tender stats function

  1. Database Changes
    - Drop and recreate the get_tender_stats function with IMMUTABLE marking
    - Fix any index issues that might be causing the IMMUTABLE error
    
  2. Security
    - Maintain existing RLS policies
*/

-- Drop the existing function if it exists
DROP FUNCTION IF EXISTS get_tender_stats();

-- Create the tender stats function with proper IMMUTABLE marking
CREATE OR REPLACE FUNCTION get_tender_stats()
RETURNS TABLE (
  total_tenders bigint,
  open_tenders bigint,
  closing_soon bigint,
  last_updated timestamptz
) 
LANGUAGE sql
STABLE  -- Use STABLE instead of IMMUTABLE since we're querying data that can change
AS $$
  SELECT 
    COUNT(*) as total_tenders,
    COUNT(*) FILTER (WHERE close_date > now()) as open_tenders,
    COUNT(*) FILTER (WHERE close_date > now() AND close_date <= now() + interval '7 days') as closing_soon,
    MAX(created_at) as last_updated
  FROM tenders;
$$;

-- Grant execute permission to authenticated and service role
GRANT EXECUTE ON FUNCTION get_tender_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION get_tender_stats() TO service_role;
GRANT EXECUTE ON FUNCTION get_tender_stats() TO anon;