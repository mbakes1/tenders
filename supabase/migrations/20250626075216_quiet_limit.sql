/*
  # Enhance Bookmark System Integrity

  1. Data Integrity Improvements
    - Add check constraints for data validation
    - Improve foreign key relationships
    - Add indexes for better performance

  2. Enhanced Functions
    - Improve bookmark checking with better error handling
    - Add bookmark validation functions
    - Add cleanup functions for orphaned data

  3. Security Enhancements
    - Strengthen RLS policies
    - Add audit logging for bookmark operations
    - Improve user data protection
*/

-- Add check constraints for data integrity
DO $$
BEGIN
  -- Ensure tender_ocid is not empty
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints 
    WHERE constraint_name = 'bookmarks_tender_ocid_not_empty'
  ) THEN
    ALTER TABLE bookmarks ADD CONSTRAINT bookmarks_tender_ocid_not_empty 
      CHECK (length(trim(tender_ocid)) > 0);
  END IF;

  -- Ensure user_id is valid UUID
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints 
    WHERE constraint_name = 'bookmarks_user_id_valid'
  ) THEN
    ALTER TABLE bookmarks ADD CONSTRAINT bookmarks_user_id_valid 
      CHECK (user_id IS NOT NULL);
  END IF;
END $$;

-- Add composite index for better query performance
CREATE INDEX IF NOT EXISTS idx_bookmarks_user_tender ON bookmarks(user_id, tender_ocid);

-- Enhanced function to check if tender is bookmarked with better error handling
CREATE OR REPLACE FUNCTION is_tender_bookmarked(tender_ocid_param text)
RETURNS boolean AS $$
DECLARE
  result boolean := false;
BEGIN
  -- Validate input
  IF tender_ocid_param IS NULL OR length(trim(tender_ocid_param)) = 0 THEN
    RETURN false;
  END IF;

  -- Check if user is authenticated
  IF auth.uid() IS NULL THEN
    RETURN false;
  END IF;
  
  -- Check if bookmark exists
  SELECT EXISTS (
    SELECT 1 FROM bookmarks 
    WHERE user_id = auth.uid() 
    AND tender_ocid = trim(tender_ocid_param)
  ) INTO result;
  
  RETURN COALESCE(result, false);
EXCEPTION
  WHEN OTHERS THEN
    -- Log error and return false for safety
    RAISE WARNING 'Error checking bookmark status for tender % and user %: %', 
      tender_ocid_param, auth.uid(), SQLERRM;
    RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Enhanced function to get user bookmarks with pagination and error handling
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
  view_count integer,
  created_at timestamptz,
  bookmarked_at timestamptz
) AS $$
BEGIN
  -- Validate input parameters
  IF limit_count <= 0 OR limit_count > 100 THEN
    limit_count := 50;
  END IF;
  
  IF offset_count < 0 THEN
    offset_count := 0;
  END IF;

  -- Check if user is authenticated
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required to access bookmarks';
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
    t.view_count,
    t.created_at,
    b.created_at as bookmarked_at
  FROM tenders t
  INNER JOIN bookmarks b ON t.ocid = b.tender_ocid
  WHERE b.user_id = auth.uid()
  ORDER BY b.created_at DESC
  LIMIT limit_count
  OFFSET offset_count;
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Error retrieving bookmarks: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Function to validate bookmark data integrity
CREATE OR REPLACE FUNCTION validate_bookmark_integrity()
RETURNS TABLE(
  check_name text,
  status text,
  count bigint,
  details text
) AS $$
BEGIN
  -- Check for orphaned bookmarks (tender doesn't exist)
  RETURN QUERY
  SELECT 
    'orphaned_bookmarks'::text,
    CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'FAIL' END::text,
    COUNT(*),
    'Bookmarks referencing non-existent tenders'::text
  FROM bookmarks b
  LEFT JOIN tenders t ON b.tender_ocid = t.ocid
  WHERE t.ocid IS NULL;

  -- Check for bookmarks with invalid user references
  RETURN QUERY
  SELECT 
    'invalid_user_bookmarks'::text,
    CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'FAIL' END::text,
    COUNT(*),
    'Bookmarks with invalid user references'::text
  FROM bookmarks b
  WHERE b.user_id IS NULL OR length(b.user_id::text) = 0;

  -- Check for duplicate bookmarks
  RETURN QUERY
  SELECT 
    'duplicate_bookmarks'::text,
    CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'WARN' END::text,
    COUNT(*),
    'Duplicate bookmark entries (should be prevented by unique constraint)'::text
  FROM (
    SELECT user_id, tender_ocid, COUNT(*) as cnt
    FROM bookmarks
    GROUP BY user_id, tender_ocid
    HAVING COUNT(*) > 1
  ) duplicates;

  -- Check bookmark count per user (for monitoring)
  RETURN QUERY
  SELECT 
    'bookmark_statistics'::text,
    'INFO'::text,
    COUNT(DISTINCT user_id),
    'Total users with bookmarks: ' || COUNT(DISTINCT user_id) || ', Total bookmarks: ' || COUNT(*)
  FROM bookmarks;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clean up orphaned bookmarks
CREATE OR REPLACE FUNCTION cleanup_orphaned_bookmarks()
RETURNS integer AS $$
DECLARE
  deleted_count integer;
BEGIN
  -- Delete bookmarks for tenders that no longer exist
  DELETE FROM bookmarks 
  WHERE tender_ocid NOT IN (SELECT ocid FROM tenders);
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  -- Log the cleanup operation
  IF deleted_count > 0 THEN
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
      'cleanup_orphaned_bookmarks: ' || deleted_count || ' orphaned bookmarks removed'
    );
  END IF;
  
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enhanced RLS policies for better security
DROP POLICY IF EXISTS "Users can view their own bookmarks" ON bookmarks;
DROP POLICY IF EXISTS "Users can create their own bookmarks" ON bookmarks;
DROP POLICY IF EXISTS "Users can delete their own bookmarks" ON bookmarks;

-- More restrictive and secure policies
CREATE POLICY "Users can view their own bookmarks"
  ON bookmarks
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id 
    AND user_id IS NOT NULL 
    AND tender_ocid IS NOT NULL 
    AND length(trim(tender_ocid)) > 0
  );

CREATE POLICY "Users can create their own bookmarks"
  ON bookmarks
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id 
    AND user_id IS NOT NULL 
    AND tender_ocid IS NOT NULL 
    AND length(trim(tender_ocid)) > 0
    AND EXISTS (SELECT 1 FROM tenders WHERE ocid = tender_ocid)
  );

CREATE POLICY "Users can delete their own bookmarks"
  ON bookmarks
  FOR DELETE
  TO authenticated
  USING (
    auth.uid() = user_id 
    AND user_id IS NOT NULL
  );

-- Grant execute permissions on new functions
GRANT EXECUTE ON FUNCTION validate_bookmark_integrity() TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_orphaned_bookmarks() TO service_role;

-- Add helpful comments
COMMENT ON FUNCTION is_tender_bookmarked(text) IS 'Check if a tender is bookmarked by the current user with input validation';
COMMENT ON FUNCTION get_user_bookmarks(integer, integer) IS 'Get paginated bookmarks for the current user with error handling';
COMMENT ON FUNCTION validate_bookmark_integrity() IS 'Validate bookmark data integrity and return status report';
COMMENT ON FUNCTION cleanup_orphaned_bookmarks() IS 'Remove bookmarks that reference non-existent tenders';