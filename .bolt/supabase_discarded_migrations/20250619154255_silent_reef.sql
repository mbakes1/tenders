/*
  # Fix Invalid Database Indexes and Functions

  This migration fixes the database issues that are causing the edge functions to fail:

  1. Remove invalid indexes that use now() function in WHERE clauses
  2. Correct the get_tender_stats function to use updated_at instead of created_at
  3. Ensure all indexes are properly created without immutable function issues

  ## Changes Made
  - Drop problematic indexes that use now() in WHERE clauses
  - Recreate get_tender_stats function with correct logic
  - Add proper indexes for performance without immutable function issues
*/

-- Drop any existing problematic indexes
DROP INDEX IF EXISTS idx_tenders_status;

-- Drop and recreate the get_tender_stats function with correct logic
DROP FUNCTION IF EXISTS get_tender_stats();

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
    MAX(updated_at) as last_updated  -- Use updated_at instead of created_at
  FROM tenders;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_tender_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION get_tender_stats() TO service_role;
GRANT EXECUTE ON FUNCTION get_tender_stats() TO anon;

-- Ensure we have proper indexes for performance (without problematic WHERE clauses)
CREATE INDEX IF NOT EXISTS idx_tenders_close_date_performance 
ON tenders(close_date DESC NULLS LAST) 
WHERE close_date IS NOT NULL;

-- Add index for updated_at since we're now using it in stats
CREATE INDEX IF NOT EXISTS idx_tenders_updated_at 
ON tenders(updated_at DESC);

-- Ensure RLS is properly enabled
ALTER TABLE tenders ENABLE ROW LEVEL SECURITY;

-- Ensure policies exist for public access
DO $$
BEGIN
  -- Check if policy exists, if not create it
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'tenders' 
    AND policyname = 'Allow public read access to tenders'
  ) THEN
    CREATE POLICY "Allow public read access to tenders"
      ON tenders
      FOR SELECT
      TO public
      USING (true);
  END IF;
END $$;