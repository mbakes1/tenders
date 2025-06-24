/*
  # Setup Admin Role Authentication

  1. Security Functions
    - `is_admin()` - SECURITY DEFINER function to check JWT app_metadata for admin role
    - Grants EXECUTE permissions to authenticated and service_role

  2. Admin RLS Policies
    - Add admin policies to tenders, fetch_logs, tender_views, and bookmarks tables
    - Grant full administrative privileges to users with admin role

  3. Security
    - Uses JWT app_metadata for role verification (cryptographically signed)
    - Centralized access control through is_admin() function
    - Cannot be tampered with by client-side code
*/

-- Create function to check if current user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean AS $$
BEGIN
  -- Check if user is authenticated
  IF auth.uid() IS NULL THEN
    RETURN false;
  END IF;
  
  -- Check if user has admin role in JWT app_metadata
  RETURN COALESCE(
    (auth.jwt() -> 'app_metadata' ->> 'role')::text = 'admin',
    false
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions on is_admin function
GRANT EXECUTE ON FUNCTION is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION is_admin() TO service_role;

-- Add admin policies for tenders table
CREATE POLICY "Allow admin full access to tenders"
  ON tenders
  FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- Add admin policies for fetch_logs table
CREATE POLICY "Allow admin full access to fetch logs"
  ON fetch_logs
  FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- Add admin policies for tender_views table
CREATE POLICY "Allow admin full access to tender views"
  ON tender_views
  FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- Add admin policies for bookmarks table
CREATE POLICY "Allow admin read access to all bookmarks"
  ON bookmarks
  FOR SELECT
  TO authenticated
  USING (is_admin());

-- Create admin helper functions for dashboard
CREATE OR REPLACE FUNCTION get_admin_stats()
RETURNS TABLE(
  total_users bigint,
  total_tenders bigint,
  open_tenders bigint,
  total_views bigint,
  total_bookmarks bigint,
  last_sync timestamptz,
  system_health text
) AS $$
BEGIN
  -- Only allow admins to access this function
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Access denied. Admin privileges required.';
  END IF;
  
  RETURN QUERY
  SELECT 
    (SELECT COUNT(*) FROM auth.users) as total_users,
    (SELECT COUNT(*) FROM tenders) as total_tenders,
    (SELECT COUNT(*) FROM tenders WHERE close_date > CURRENT_TIMESTAMP) as open_tenders,
    (SELECT COUNT(*) FROM tender_views) as total_views,
    (SELECT COUNT(*) FROM bookmarks) as total_bookmarks,
    (SELECT MAX(created_at) FROM fetch_logs) as last_sync,
    'healthy'::text as system_health;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions on admin stats function
GRANT EXECUTE ON FUNCTION get_admin_stats() TO authenticated;

-- Create function to get recent activity for admin dashboard
CREATE OR REPLACE FUNCTION get_recent_activity(limit_count integer DEFAULT 10)
RETURNS TABLE(
  activity_type text,
  description text,
  created_at timestamptz,
  details jsonb
) AS $$
BEGIN
  -- Only allow admins to access this function
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Access denied. Admin privileges required.';
  END IF;
  
  RETURN QUERY
  (
    SELECT 
      'tender_view'::text as activity_type,
      'Tender viewed: ' || t.title as description,
      tv.created_at,
      jsonb_build_object(
        'tender_ocid', tv.tender_ocid,
        'viewer_ip', tv.viewer_ip,
        'user_id', tv.user_id
      ) as details
    FROM tender_views tv
    JOIN tenders t ON tv.tender_ocid = t.ocid
    ORDER BY tv.created_at DESC
    LIMIT limit_count / 2
  )
  UNION ALL
  (
    SELECT 
      'bookmark'::text as activity_type,
      'Tender bookmarked: ' || t.title as description,
      b.created_at,
      jsonb_build_object(
        'tender_ocid', b.tender_ocid,
        'user_id', b.user_id
      ) as details
    FROM bookmarks b
    JOIN tenders t ON b.tender_ocid = t.ocid
    ORDER BY b.created_at DESC
    LIMIT limit_count / 2
  )
  ORDER BY created_at DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions on recent activity function
GRANT EXECUTE ON FUNCTION get_recent_activity(integer) TO authenticated;