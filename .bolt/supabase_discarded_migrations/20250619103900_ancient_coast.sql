/*
  # Comprehensive Tender Storage Migration

  1. Database Audit
    - Current schema already has comprehensive tender storage
    - Adding performance optimizations and helper functions
    - Ensuring all indexes are properly created

  2. Performance Enhancements
    - Add search indexes for full-text search
    - Add status-based indexes for filtering
    - Add helper functions for statistics

  3. Data Integrity
    - Maintain existing RLS policies
    - Preserve all existing data
*/

-- Add indexes for better query performance (safe to run multiple times)
CREATE INDEX IF NOT EXISTS idx_tenders_status ON tenders(close_date) WHERE close_date > now();
CREATE INDEX IF NOT EXISTS idx_tenders_title_search ON tenders USING gin(to_tsvector('english', title));
CREATE INDEX IF NOT EXISTS idx_tenders_description_search ON tenders USING gin(to_tsvector('english', description));
CREATE INDEX IF NOT EXISTS idx_tenders_buyer_search ON tenders USING gin(to_tsvector('english', buyer));

-- Add function to get tender statistics
CREATE OR REPLACE FUNCTION get_tender_stats()
RETURNS TABLE(
  total_tenders bigint,
  open_tenders bigint,
  closing_soon bigint,
  last_updated timestamptz
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) as total_tenders,
    COUNT(*) FILTER (WHERE close_date > now()) as open_tenders,
    COUNT(*) FILTER (WHERE close_date > now() AND close_date < (now() + interval '7 days')) as closing_soon,
    MAX(updated_at) as last_updated
  FROM tenders;
END;
$$ LANGUAGE plpgsql;

-- Add function to clean up old data (optional maintenance)
CREATE OR REPLACE FUNCTION cleanup_expired_tenders()
RETURNS void AS $$
BEGIN
  -- This function can be used for maintenance but doesn't delete data
  -- Just updates timestamps for housekeeping
  UPDATE tenders 
  SET updated_at = now()
  WHERE close_date < (now() - interval '30 days')
    AND close_date IS NOT NULL;
END;
$$ LANGUAGE plpgsql;