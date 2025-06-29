/*
  # Remove View Tracking System

  This migration removes all view tracking functionality from the database:
  
  1. Tables Removed
     - `tender_views` table and all its data
  
  2. Columns Removed  
     - `view_count` column from `tenders` table
  
  3. Functions Updated
     - Drop and recreate `get_admin_stats()` without view data
     - Drop and recreate `get_recent_activity()` without view activities
     - Remove all view tracking functions
  
  4. Cleanup
     - Remove all view-related indexes
     - Remove view-related constraints
*/

-- Drop the tender_views table completely
DROP TABLE IF EXISTS tender_views CASCADE;

-- Remove view_count column from tenders table
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tenders' AND column_name = 'view_count'
  ) THEN
    ALTER TABLE tenders DROP COLUMN view_count;
  END IF;
END $$;

-- Drop view tracking functions
DROP FUNCTION IF EXISTS increment_tender_view(text, text, text, uuid) CASCADE;
DROP FUNCTION IF EXISTS get_tender_view_stats(text) CASCADE;
DROP FUNCTION IF EXISTS get_popular_tenders(integer, integer) CASCADE;

-- Drop existing admin stats function completely before recreating
DROP FUNCTION IF EXISTS get_admin_stats() CASCADE;

-- Recreate admin stats function without view-related data
CREATE OR REPLACE FUNCTION get_admin_stats()
RETURNS TABLE (
  total_users bigint,
  total_tenders bigint,
  open_tenders bigint,
  total_bookmarks bigint,
  last_sync timestamp with time zone
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (SELECT COUNT(*) FROM auth.users) as total_users,
    (SELECT COUNT(*) FROM tenders) as total_tenders,
    (SELECT COUNT(*) FROM tenders WHERE close_date > NOW()) as open_tenders,
    (SELECT COUNT(*) FROM bookmarks) as total_bookmarks,
    (SELECT MAX(created_at) FROM fetch_logs) as last_sync;
END;
$$;

-- Drop existing recent activity function completely before recreating
DROP FUNCTION IF EXISTS get_recent_activity(integer) CASCADE;

-- Recreate recent activity function without view-related activities
CREATE OR REPLACE FUNCTION get_recent_activity(limit_count integer DEFAULT 10)
RETURNS TABLE (
  activity_type text,
  description text,
  created_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    'bookmark'::text as activity_type,
    'User bookmarked tender: ' || t.title as description,
    b.created_at
  FROM bookmarks b
  JOIN tenders t ON b.tender_ocid = t.ocid
  ORDER BY b.created_at DESC
  LIMIT limit_count;
END;
$$;

-- Remove any view-related indexes that might still exist
DROP INDEX IF EXISTS idx_tender_views_created_at;
DROP INDEX IF EXISTS idx_tender_views_date_range;
DROP INDEX IF EXISTS idx_tender_views_ip_time;
DROP INDEX IF EXISTS idx_tender_views_ocid;
DROP INDEX IF EXISTS idx_tender_views_user_id;
DROP INDEX IF EXISTS idx_tenders_view_count;

-- Clean up any remaining view-related constraints
DO $$
BEGIN
  -- Remove view count constraint if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'tenders_view_count_positive'
  ) THEN
    ALTER TABLE tenders DROP CONSTRAINT tenders_view_count_positive;
  END IF;
END $$;