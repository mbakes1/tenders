/*
  # Create tenders database schema

  1. New Tables
    - `tenders`
      - `id` (uuid, primary key)
      - `ocid` (text, unique)
      - `title` (text)
      - `description` (text)
      - `category` (text)
      - `close_date` (timestamptz)
      - `buyer` (text)
      - `full_data` (jsonb) - stores complete tender data
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `fetch_logs`
      - `id` (uuid, primary key)
      - `total_fetched` (integer)
      - `open_tenders` (integer)
      - `pages_processed` (integer)
      - `execution_time_ms` (integer)
      - `stopped_reason` (text)
      - `date_range_from` (date)
      - `date_range_to` (date)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on both tables
    - Add policies for public read access (since this is public tender data)
    - Add policies for service role to write data

  3. Indexes
    - Index on ocid for fast lookups
    - Index on close_date for filtering open tenders
    - Index on created_at for fetch logs
*/

-- Create tenders table
CREATE TABLE IF NOT EXISTS tenders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ocid text UNIQUE NOT NULL,
  title text,
  description text,
  category text,
  close_date timestamptz,
  buyer text,
  full_data jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create fetch logs table
CREATE TABLE IF NOT EXISTS fetch_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  total_fetched integer NOT NULL DEFAULT 0,
  open_tenders integer NOT NULL DEFAULT 0,
  pages_processed integer NOT NULL DEFAULT 0,
  execution_time_ms integer NOT NULL DEFAULT 0,
  stopped_reason text,
  date_range_from date,
  date_range_to date,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE tenders ENABLE ROW LEVEL SECURITY;
ALTER TABLE fetch_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access (tender data is public)
CREATE POLICY "Allow public read access to tenders"
  ON tenders
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public read access to fetch logs"
  ON fetch_logs
  FOR SELECT
  TO public
  USING (true);

-- Create policies for service role to manage data
CREATE POLICY "Allow service role to manage tenders"
  ON tenders
  FOR ALL
  TO service_role
  USING (true);

CREATE POLICY "Allow service role to manage fetch logs"
  ON fetch_logs
  FOR ALL
  TO service_role
  USING (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_tenders_ocid ON tenders(ocid);
CREATE INDEX IF NOT EXISTS idx_tenders_close_date ON tenders(close_date);
CREATE INDEX IF NOT EXISTS idx_tenders_created_at ON tenders(created_at);
CREATE INDEX IF NOT EXISTS idx_fetch_logs_created_at ON fetch_logs(created_at DESC);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_tenders_updated_at
  BEFORE UPDATE ON tenders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();