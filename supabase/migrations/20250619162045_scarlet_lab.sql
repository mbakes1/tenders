/*
  # Add bookmarks functionality

  1. New Tables
    - `bookmarks`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `tender_ocid` (text, references tenders.ocid)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on bookmarks table
    - Add policies for users to manage their own bookmarks only

  3. Indexes
    - Index on user_id for fast user bookmark lookups
    - Index on tender_ocid for fast tender bookmark checks
    - Unique constraint on user_id + tender_ocid to prevent duplicates
*/

-- Create bookmarks table
CREATE TABLE IF NOT EXISTS bookmarks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  tender_ocid text REFERENCES tenders(ocid) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, tender_ocid)
);

-- Enable RLS
ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;

-- Create policies for users to manage their own bookmarks
CREATE POLICY "Users can view their own bookmarks"
  ON bookmarks
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own bookmarks"
  ON bookmarks
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own bookmarks"
  ON bookmarks
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_bookmarks_user_id ON bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_tender_ocid ON bookmarks(tender_ocid);
CREATE INDEX IF NOT EXISTS idx_bookmarks_created_at ON bookmarks(created_at DESC);

-- Create function to check if a tender is bookmarked by current user
CREATE OR REPLACE FUNCTION is_tender_bookmarked(tender_ocid_param text)
RETURNS boolean AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN false;
  END IF;
  
  RETURN EXISTS (
    SELECT 1 FROM bookmarks 
    WHERE user_id = auth.uid() 
    AND tender_ocid = tender_ocid_param
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get user's bookmarked tenders
CREATE OR REPLACE FUNCTION get_user_bookmarks(
  limit_count integer DEFAULT 50,
  offset_count integer DEFAULT 0
)
RETURNS TABLE(
  id uuid,
  ocid text,
  title text,
  description text,
  category text,
  close_date timestamptz,
  buyer text,
  department text,
  bid_number text,
  created_at timestamptz,
  bookmarked_at timestamptz
) AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN;
  END IF;
  
  RETURN QUERY
  SELECT 
    t.id,
    t.ocid,
    t.title,
    t.description,
    t.category,
    t.close_date,
    t.buyer,
    t.department,
    t.bid_number,
    t.created_at,
    b.created_at as bookmarked_at
  FROM tenders t
  INNER JOIN bookmarks b ON t.ocid = b.tender_ocid
  WHERE b.user_id = auth.uid()
  ORDER BY b.created_at DESC
  LIMIT limit_count
  OFFSET offset_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;