/*
  # Document Storage Enhancement

  1. New Tables
    - `document_cache`
      - `id` (uuid, primary key)
      - `tender_ocid` (text, foreign key reference)
      - `original_url` (text, the source URL)
      - `cached_url` (text, our stored version)
      - `filename` (text)
      - `file_size` (bigint)
      - `content_type` (text)
      - `document_type` (text)
      - `title` (text)
      - `description` (text)
      - `download_count` (integer, default 0)
      - `last_accessed` (timestamptz)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `document_cache` table
    - Add policy for public read access to cached documents
    - Add policy for service role to manage documents

  3. Indexes
    - Index on tender_ocid for fast lookups
    - Index on original_url for deduplication
    - Index on last_accessed for cleanup operations
*/

-- Create document cache table
CREATE TABLE IF NOT EXISTS document_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tender_ocid text NOT NULL,
  original_url text NOT NULL,
  cached_url text,
  filename text NOT NULL,
  file_size bigint DEFAULT 0,
  content_type text DEFAULT 'application/pdf',
  document_type text,
  title text,
  description text,
  download_count integer DEFAULT 0,
  last_accessed timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add foreign key constraint to tenders table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'document_cache_tender_ocid_fkey'
  ) THEN
    ALTER TABLE document_cache 
    ADD CONSTRAINT document_cache_tender_ocid_fkey 
    FOREIGN KEY (tender_ocid) REFERENCES tenders(ocid) ON DELETE CASCADE;
  END IF;
END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_document_cache_tender_ocid ON document_cache(tender_ocid);
CREATE INDEX IF NOT EXISTS idx_document_cache_original_url ON document_cache(original_url);
CREATE INDEX IF NOT EXISTS idx_document_cache_last_accessed ON document_cache(last_accessed DESC);
CREATE INDEX IF NOT EXISTS idx_document_cache_created_at ON document_cache(created_at DESC);

-- Enable RLS
ALTER TABLE document_cache ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow public read access to document cache"
  ON document_cache
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow service role to manage document cache"
  ON document_cache
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_document_cache_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_document_cache_updated_at
  BEFORE UPDATE ON document_cache
  FOR EACH ROW
  EXECUTE FUNCTION update_document_cache_updated_at();

-- Create function to increment download count
CREATE OR REPLACE FUNCTION increment_document_download(doc_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE document_cache 
  SET 
    download_count = download_count + 1,
    last_accessed = now()
  WHERE id = doc_id;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION increment_document_download(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION increment_document_download(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION increment_document_download(uuid) TO anon;