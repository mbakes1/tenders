/*
  # Algolia Integration Setup

  1. New Tables
    - `algolia_sync_logs`
      - `id` (uuid, primary key)
      - `total_indexed` (integer)
      - `success_count` (integer)
      - `error_count` (integer)
      - `execution_time_ms` (integer)
      - `index_name` (text)
      - `sync_status` (text)
      - `error_message` (text, nullable)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `algolia_sync_logs` table
    - Add policy for public read access to sync logs
    - Add policy for service role to manage sync logs

  3. Functions
    - Create function to get latest Algolia sync status
*/

-- Create algolia sync logs table
CREATE TABLE IF NOT EXISTS algolia_sync_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  total_indexed integer DEFAULT 0,
  success_count integer DEFAULT 0,
  error_count integer DEFAULT 0,
  execution_time_ms integer DEFAULT 0,
  index_name text DEFAULT 'tenders',
  sync_status text DEFAULT 'pending',
  error_message text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE algolia_sync_logs ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow public read access to algolia sync logs"
  ON algolia_sync_logs
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow service role to manage algolia sync logs"
  ON algolia_sync_logs
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_algolia_sync_logs_created_at ON algolia_sync_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_algolia_sync_logs_status ON algolia_sync_logs(sync_status);

-- Create function to get latest Algolia sync status
CREATE OR REPLACE FUNCTION get_latest_algolia_sync()
RETURNS TABLE (
  id uuid,
  total_indexed integer,
  success_count integer,
  error_count integer,
  execution_time_ms integer,
  index_name text,
  sync_status text,
  error_message text,
  created_at timestamptz
) 
LANGUAGE sql
STABLE
AS $$
  SELECT 
    id,
    total_indexed,
    success_count,
    error_count,
    execution_time_ms,
    index_name,
    sync_status,
    error_message,
    created_at
  FROM algolia_sync_logs
  ORDER BY created_at DESC
  LIMIT 1;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_latest_algolia_sync() TO authenticated;
GRANT EXECUTE ON FUNCTION get_latest_algolia_sync() TO service_role;
GRANT EXECUTE ON FUNCTION get_latest_algolia_sync() TO anon;