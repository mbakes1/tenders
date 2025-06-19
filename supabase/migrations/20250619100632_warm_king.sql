/*
  # Add documents column to tenders table

  1. New Column
    - `documents` (jsonb) - stores array of document objects with name, type, size, description, url, mandatory fields

  2. Index
    - Add GIN index on documents column for efficient JSON queries
*/

-- Add documents column to store tender documents as JSON
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tenders' AND column_name = 'documents') THEN
    ALTER TABLE tenders ADD COLUMN documents jsonb;
  END IF;
END $$;

-- Create GIN index for efficient JSON queries on documents
CREATE INDEX IF NOT EXISTS idx_tenders_documents ON tenders USING GIN (documents);