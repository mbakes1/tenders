/*
  # Fix bookmark INSERT RLS policy

  1. Security Changes
    - Drop the existing INSERT policy that uses incorrect `uid()` function
    - Create new INSERT policy using correct `auth.uid()` function
    - Ensure authenticated users can insert bookmarks for themselves

  The issue was that the policy was using `uid()` instead of `auth.uid()` which caused
  the row-level security violation when trying to insert new bookmarks.
*/

-- Drop the existing INSERT policy
DROP POLICY IF EXISTS "Users can create their own bookmarks" ON bookmarks;

-- Create the corrected INSERT policy using auth.uid()
CREATE POLICY "Users can create their own bookmarks"
  ON bookmarks
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);