/*
  # Incremental Sync Enhancement

  1. Enhanced fetch_logs table
    - Add `sync_type` column to distinguish between incremental and full syncs
    - Add `last_successful_sync` timestamp for tracking
    - Add `next_sync_from` timestamp for incremental sync planning
    - Add `sync_status` for better tracking

  2. New Functions
    - `get_last_sync_timestamp()` - Get the last successful sync timestamp
    - `update_sync_timestamp()` - Update the last sync timestamp
    - `should_do_full_sync()` - Determine if a full sync is needed

  3. Indexes
    - Add indexes for efficient sync timestamp queries
*/

-- Add new columns to fetch_logs table for incremental sync tracking
DO $$
BEGIN
  -- Add sync_type column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'fetch_logs' AND column_name = 'sync_type') THEN
    ALTER TABLE fetch_logs ADD COLUMN sync_type text DEFAULT 'incremental';
  END IF;
  
  -- Add sync_status column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'fetch_logs' AND column_name = 'sync_status') THEN
    ALTER TABLE fetch_logs ADD COLUMN sync_status text DEFAULT 'completed';
  END IF;
  
  -- Add last_successful_sync column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'fetch_logs' AND column_name = 'last_successful_sync') THEN
    ALTER TABLE fetch_logs ADD COLUMN last_successful_sync timestamptz;
  END IF;
  
  -- Add next_sync_from column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'fetch_logs' AND column_name = 'next_sync_from') THEN
    ALTER TABLE fetch_logs ADD COLUMN next_sync_from timestamptz;
  END IF;
  
  -- Add api_calls_made column to track API usage
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'fetch_logs' AND column_name = 'api_calls_made') THEN
    ALTER TABLE fetch_logs ADD COLUMN api_calls_made integer DEFAULT 0;
  END IF;
END $$;

-- Create indexes for efficient sync queries
CREATE INDEX IF NOT EXISTS idx_fetch_logs_sync_type ON fetch_logs(sync_type);
CREATE INDEX IF NOT EXISTS idx_fetch_logs_sync_status ON fetch_logs(sync_status);
CREATE INDEX IF NOT EXISTS idx_fetch_logs_last_successful_sync ON fetch_logs(last_successful_sync DESC);

-- Function to get the last successful sync timestamp
CREATE OR REPLACE FUNCTION get_last_sync_timestamp()
RETURNS timestamptz AS $$
DECLARE
  last_sync timestamptz;
BEGIN
  -- Get the most recent successful sync timestamp
  SELECT COALESCE(MAX(last_successful_sync), CURRENT_TIMESTAMP - interval '7 days')
  INTO last_sync
  FROM fetch_logs 
  WHERE sync_status = 'completed' 
    AND last_successful_sync IS NOT NULL;
  
  -- If no successful sync found, return 7 days ago as a safe default
  IF last_sync IS NULL THEN
    last_sync := CURRENT_TIMESTAMP - interval '7 days';
  END IF;
  
  RETURN last_sync;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to update sync timestamp after successful sync
CREATE OR REPLACE FUNCTION update_sync_timestamp(
  p_sync_type text,
  p_total_fetched integer,
  p_open_tenders integer,
  p_pages_processed integer,
  p_execution_time_ms integer,
  p_api_calls_made integer,
  p_date_range_from date,
  p_date_range_to date
)
RETURNS uuid AS $$
DECLARE
  log_id uuid;
BEGIN
  INSERT INTO fetch_logs (
    sync_type,
    sync_status,
    total_fetched,
    open_tenders,
    pages_processed,
    execution_time_ms,
    api_calls_made,
    date_range_from,
    date_range_to,
    last_successful_sync,
    next_sync_from,
    created_at
  ) VALUES (
    p_sync_type,
    'completed',
    p_total_fetched,
    p_open_tenders,
    p_pages_processed,
    p_execution_time_ms,
    p_api_calls_made,
    p_date_range_from,
    p_date_range_to,
    CURRENT_TIMESTAMP,
    CASE 
      WHEN p_sync_type = 'incremental' THEN CURRENT_TIMESTAMP
      ELSE CURRENT_TIMESTAMP - interval '1 hour' -- For full sync, set next sync to 1 hour ago to allow immediate incremental
    END,
    CURRENT_TIMESTAMP
  ) RETURNING id INTO log_id;
  
  RETURN log_id;
END;
$$ LANGUAGE plpgsql;

-- Function to determine if a full sync is needed
CREATE OR REPLACE FUNCTION should_do_full_sync()
RETURNS boolean AS $$
DECLARE
  last_full_sync timestamptz;
  days_since_full_sync integer;
BEGIN
  -- Get the most recent full sync
  SELECT MAX(last_successful_sync)
  INTO last_full_sync
  FROM fetch_logs 
  WHERE sync_type = 'full' 
    AND sync_status = 'completed';
  
  -- If no full sync found, we need one
  IF last_full_sync IS NULL THEN
    RETURN true;
  END IF;
  
  -- Calculate days since last full sync
  days_since_full_sync := EXTRACT(days FROM (CURRENT_TIMESTAMP - last_full_sync));
  
  -- Do full sync if it's been more than 7 days
  RETURN days_since_full_sync > 7;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to get sync statistics for monitoring
CREATE OR REPLACE FUNCTION get_sync_statistics()
RETURNS TABLE(
  total_syncs bigint,
  incremental_syncs bigint,
  full_syncs bigint,
  last_sync timestamptz,
  last_incremental_sync timestamptz,
  last_full_sync timestamptz,
  avg_execution_time_ms numeric,
  total_api_calls bigint,
  avg_records_per_sync numeric
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) as total_syncs,
    COUNT(*) FILTER (WHERE sync_type = 'incremental') as incremental_syncs,
    COUNT(*) FILTER (WHERE sync_type = 'full') as full_syncs,
    MAX(last_successful_sync) as last_sync,
    MAX(last_successful_sync) FILTER (WHERE sync_type = 'incremental') as last_incremental_sync,
    MAX(last_successful_sync) FILTER (WHERE sync_type = 'full') as last_full_sync,
    AVG(execution_time_ms) as avg_execution_time_ms,
    SUM(COALESCE(api_calls_made, 0)) as total_api_calls,
    AVG(total_fetched) as avg_records_per_sync
  FROM fetch_logs
  WHERE sync_status = 'completed'
    AND created_at >= CURRENT_TIMESTAMP - interval '30 days';
END;
$$ LANGUAGE plpgsql STABLE;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_last_sync_timestamp() TO service_role;
GRANT EXECUTE ON FUNCTION update_sync_timestamp(text, integer, integer, integer, integer, integer, date, date) TO service_role;
GRANT EXECUTE ON FUNCTION should_do_full_sync() TO service_role;
GRANT EXECUTE ON FUNCTION get_sync_statistics() TO service_role;