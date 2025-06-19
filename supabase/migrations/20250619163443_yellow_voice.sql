/*
  # Fix bookmark insert policy

  1. Security Policy Fix
    - Drop the existing incorrect INSERT policy for bookmarks table
    - Create a new INSERT policy that properly uses auth.uid() instead of uid()
    - This will allow authenticated users to create bookmarks where their user_id matches their auth ID

  2. Changes
    - Remove policy "Users can create their own bookmarks" with incorrect uid() function
    - Add new policy "Users can create their own bookmarks" with correct auth.uid() function
*/

-- Drop the existing incorrect policy
DROP POLICY IF EXISTS "Users can create their own bookmarks" ON bookmarks;

-- Create the correct policy for INSERT operations
CREATE POLICY "Users can create their own bookmarks"
  ON bookmarks
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);