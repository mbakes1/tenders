/*
  # Add tender view tracking

  1. New Tables
    - `tender_views`
      - `id` (uuid, primary key)
      - `tender_ocid` (text, references tenders.ocid)
      - `viewer_ip` (text) - IP address for basic spam prevention
      - `user_agent` (text) - Browser info for analytics
      - `user_id` (uuid, optional) - If user is authenticated
      - `created_at` (timestamptz)

  2. View Aggregation
    - Add `view_count` column to tenders table
    - Create function to increment view count
    - Create function to get view statistics

  3. Security
    - Enable RLS on tender_views table
    - Allow public read access to view counts
    - Prevent view spam with IP/time constraints

  4. Indexes
    - Index on tender_ocid for fast lookups
    - Index on viewer_ip and created_at for spam prevention
*/

-- Add view_count column to tenders table
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tenders' AND column_name = 'view_count') THEN
    ALTER TABLE tenders ADD COLUMN view_count integer DEFAULT 0;
  END IF;
END $$;

-- Create tender_views table for detailed tracking
CREATE TABLE IF NOT EXISTS tender_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tender_ocid text REFERENCES tenders(ocid) ON DELETE CASCADE NOT NULL,
  viewer_ip text,
  user_agent text,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE tender_views ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access to view data
CREATE POLICY "Allow public read access to tender views"
  ON tender_views
  FOR SELECT
  TO public
  USING (true);

-- Create policy for service role to manage view data
CREATE POLICY "Allow service role to manage tender views"
  ON tender_views
  FOR ALL
  TO service_role
  USING (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_tender_views_ocid ON tender_views(tender_ocid);
CREATE INDEX IF NOT EXISTS idx_tender_views_ip_time ON tender_views(viewer_ip, created_at);
CREATE INDEX IF NOT EXISTS idx_tender_views_created_at ON tender_views(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tenders_view_count ON tenders(view_count DESC);

-- Function to safely increment view count with spam prevention
CREATE OR REPLACE FUNCTION increment_tender_view(
  p_tender_ocid text,
  p_viewer_ip text DEFAULT NULL,
  p_user_agent text DEFAULT NULL,
  p_user_id uuid DEFAULT NULL
)
RETURNS boolean AS $$
DECLARE
  recent_view_exists boolean := false;
  view_recorded boolean := false;
BEGIN
  -- Check if this IP has viewed this tender in the last hour (spam prevention)
  IF p_viewer_ip IS NOT NULL THEN
    SELECT EXISTS (
      SELECT 1 FROM tender_views 
      WHERE tender_ocid = p_tender_ocid 
        AND viewer_ip = p_viewer_ip 
        AND created_at > (CURRENT_TIMESTAMP - interval '1 hour')
    ) INTO recent_view_exists;
  END IF;
  
  -- If no recent view from this IP, record the view
  IF NOT recent_view_exists THEN
    -- Insert view record
    INSERT INTO tender_views (tender_ocid, viewer_ip, user_agent, user_id)
    VALUES (p_tender_ocid, p_viewer_ip, p_user_agent, p_user_id);
    
    -- Update tender view count
    UPDATE tenders 
    SET view_count = COALESCE(view_count, 0) + 1
    WHERE ocid = p_tender_ocid;
    
    view_recorded := true;
  END IF;
  
  RETURN view_recorded;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get view statistics for a tender
CREATE OR REPLACE FUNCTION get_tender_view_stats(p_tender_ocid text)
RETURNS TABLE(
  total_views bigint,
  unique_viewers bigint,
  views_today bigint,
  views_this_week bigint
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) as total_views,
    COUNT(DISTINCT viewer_ip) as unique_viewers,
    COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE) as views_today,
    COUNT(*) FILTER (WHERE created_at >= (CURRENT_DATE - interval '7 days')) as views_this_week
  FROM tender_views
  WHERE tender_ocid = p_tender_ocid;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to get popular tenders by view count
CREATE OR REPLACE FUNCTION get_popular_tenders(
  limit_count integer DEFAULT 10,
  days_back integer DEFAULT 7
)
RETURNS TABLE(
  ocid text,
  title text,
  view_count bigint,
  recent_views bigint
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.ocid,
    t.title,
    t.view_count::bigint,
    COUNT(tv.id) as recent_views
  FROM tenders t
  LEFT JOIN tender_views tv ON t.ocid = tv.tender_ocid 
    AND tv.created_at >= (CURRENT_TIMESTAMP - (days_back || ' days')::interval)
  WHERE t.close_date > CURRENT_TIMESTAMP
  GROUP BY t.ocid, t.title, t.view_count
  ORDER BY t.view_count DESC, recent_views DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql STABLE;

-- Update existing tenders to have 0 view count if NULL
UPDATE tenders SET view_count = 0 WHERE view_count IS NULL;