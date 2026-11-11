/*
  # Update Administrative Charges RLS Policies
  
  Allow public access to view charges, but restrict creation/deletion to admins
  
  1. New policies
    - Public users can view all charges (new)
    - Only admins can insert charges (replaces old policy)
    - Only admins can delete charges (replaces old policy)
    - Only admins can update charges (replaces old policy)
  
  2. Security
    - Removes user ownership restriction
    - Adds admin-only restrictions for modifications
*/

DROP POLICY IF EXISTS "Users can view their own administrative charges" ON administrative_charges;
DROP POLICY IF EXISTS "Users can create their own administrative charges" ON administrative_charges;
DROP POLICY IF EXISTS "Users can update their own administrative charges" ON administrative_charges;
DROP POLICY IF EXISTS "Users can delete their own administrative charges" ON administrative_charges;

CREATE POLICY "Anyone can view administrative charges"
  ON administrative_charges FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Only admins can insert administrative charges"
  ON administrative_charges FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

CREATE POLICY "Only admins can update administrative charges"
  ON administrative_charges FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

CREATE POLICY "Only admins can delete administrative charges"
  ON administrative_charges FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );
