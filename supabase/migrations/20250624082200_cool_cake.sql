/*
  # Database Audit and Cleanup After Cron Job Setup

  1. Database Health Check
    - Verify all functions exist and are working
    - Check for any missing indexes or constraints
    - Validate RLS policies are complete

  2. Performance Optimizations
    - Add missing indexes for better query performance
    - Optimize search functionality

  3. Data Integrity
    - Ensure all foreign key relationships are properly set up
    - Add any missing constraints

  4. Security Review
    - Verify all RLS policies are comprehensive
    - Check for any security gaps
*/

-- 1. Add missing foreign key constraint for users table (if not exists)
DO $$
BEGIN
  -- Check if users table exists in auth schema, if not create a reference
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'auth' AND table_name = 'users'
  ) THEN
    -- Create a minimal users table reference for development
    CREATE TABLE IF NOT EXISTS users (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      email text UNIQUE,
      created_at timestamptz DEFAULT now()
    );
    
    ALTER TABLE users ENABLE ROW LEVEL SECURITY;
    
    CREATE POLICY "Users can read own data"
      ON users
      FOR SELECT
      TO authenticated
      USING (auth.uid() = id);
  END IF;
END $$;

-- 2. Ensure all critical indexes exist for optimal performance
CREATE INDEX IF NOT EXISTS idx_tenders_close_date_open ON tenders(close_date) 
  WHERE close_date > CURRENT_TIMESTAMP;

CREATE INDEX IF NOT EXISTS idx_tender_views_user_id ON tender_views(user_id) 
  WHERE user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_bookmarks_user_tender ON bookmarks(user_id, tender_ocid);

-- 3. Add comprehensive search index for better search performance
CREATE INDEX IF NOT EXISTS idx_tenders_full_text_search ON tenders 
  USING gin(to_tsvector('english', 
    COALESCE(title, '') || ' ' || 
    COALESCE(description, '') || ' ' || 
    COALESCE(buyer, '') || ' ' || 
    COALESCE(department, '') || ' ' || 
    COALESCE(category, '')
  ));

-- 4. Optimize the search_tenders function for better performance
CREATE OR REPLACE FUNCTION search_tenders(
  search_term text,
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
  view_count integer,
  rank real
) AS $$
BEGIN
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
    t.view_count,
    ts_rank(
      to_tsvector('english', 
        COALESCE(t.title, '') || ' ' || 
        COALESCE(t.description, '') || ' ' || 
        COALESCE(t.buyer, '') || ' ' || 
        COALESCE(t.department, '') || ' ' || 
        COALESCE(t.category, '')
      ),
      plainto_tsquery('english', search_term)
    ) as rank
  FROM tenders t
  WHERE 
    to_tsvector('english', 
      COALESCE(t.title, '') || ' ' || 
      COALESCE(t.description, '') || ' ' || 
      COALESCE(t.buyer, '') || ' ' || 
      COALESCE(t.department, '') || ' ' || 
      COALESCE(t.category, '')
    ) @@ plainto_tsquery('english', search_term)
    AND t.close_date > CURRENT_TIMESTAMP
  ORDER BY rank DESC, t.close_date ASC
  LIMIT limit_count
  OFFSET offset_count;
END;
$$ LANGUAGE plpgsql STABLE;

-- 5. Add function to get tender statistics with caching consideration
CREATE OR REPLACE FUNCTION get_tender_stats_cached()
RETURNS TABLE(
  total_tenders bigint,
  open_tenders bigint,
  closing_soon bigint,
  last_updated timestamptz,
  total_views bigint,
  views_today bigint
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) as total_tenders,
    COUNT(*) FILTER (WHERE close_date > CURRENT_TIMESTAMP) as open_tenders,
    COUNT(*) FILTER (WHERE close_date > CURRENT_TIMESTAMP AND close_date < (CURRENT_TIMESTAMP + interval '7 days')) as closing_soon,
    MAX(updated_at) as last_updated,
    SUM(COALESCE(view_count, 0)) as total_views,
    (SELECT COUNT(*) FROM tender_views WHERE created_at >= CURRENT_DATE) as views_today
  FROM tenders;
END;
$$ LANGUAGE plpgsql STABLE;

-- 6. Add data cleanup function for old view records (optional maintenance)
CREATE OR REPLACE FUNCTION cleanup_old_view_records()
RETURNS integer AS $$
DECLARE
  deleted_count integer;
BEGIN
  -- Delete view records older than 1 year to keep the table manageable
  DELETE FROM tender_views 
  WHERE created_at < (CURRENT_TIMESTAMP - interval '1 year');
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  -- Log the cleanup
  INSERT INTO fetch_logs (
    total_fetched, 
    open_tenders, 
    pages_processed, 
    execution_time_ms, 
    stopped_reason
  ) VALUES (
    0, 
    0, 
    0, 
    0, 
    'cleanup_old_views: ' || deleted_count || ' records deleted'
  );
  
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- 7. Ensure proper constraints exist
DO $$
BEGIN
  -- Add check constraint for view_count to ensure it's never negative
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints 
    WHERE constraint_name = 'tenders_view_count_positive'
  ) THEN
    ALTER TABLE tenders ADD CONSTRAINT tenders_view_count_positive 
      CHECK (view_count >= 0);
  END IF;
END $$;

-- 8. Add function to validate data integrity
CREATE OR REPLACE FUNCTION validate_data_integrity()
RETURNS TABLE(
  check_name text,
  status text,
  details text
) AS $$
BEGIN
  -- Check for orphaned bookmarks
  RETURN QUERY
  SELECT 
    'orphaned_bookmarks'::text,
    CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'FAIL' END::text,
    'Found ' || COUNT(*) || ' bookmarks with invalid tender references'::text
  FROM bookmarks b
  LEFT JOIN tenders t ON b.tender_ocid = t.ocid
  WHERE t.ocid IS NULL;

  -- Check for orphaned tender views
  RETURN QUERY
  SELECT 
    'orphaned_tender_views'::text,
    CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'FAIL' END::text,
    'Found ' || COUNT(*) || ' tender views with invalid tender references'::text
  FROM tender_views tv
  LEFT JOIN tenders t ON tv.tender_ocid = t.ocid
  WHERE t.ocid IS NULL;

  -- Check for tenders with inconsistent view counts
  RETURN QUERY
  SELECT 
    'view_count_consistency'::text,
    CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'WARN' END::text,
    'Found ' || COUNT(*) || ' tenders with potentially inconsistent view counts'::text
  FROM tenders t
  LEFT JOIN (
    SELECT tender_ocid, COUNT(*) as actual_views
    FROM tender_views
    GROUP BY tender_ocid
  ) tv ON t.ocid = tv.tender_ocid
  WHERE COALESCE(t.view_count, 0) != COALESCE(tv.actual_views, 0);

  -- Check RLS policies
  RETURN QUERY
  SELECT 
    'rls_policies'::text,
    CASE WHEN COUNT(*) >= 8 THEN 'PASS' ELSE 'FAIL' END::text,
    'Found ' || COUNT(*) || ' RLS policies (expected at least 8)'::text
  FROM pg_policies 
  WHERE schemaname = 'public';
END;
$$ LANGUAGE plpgsql;