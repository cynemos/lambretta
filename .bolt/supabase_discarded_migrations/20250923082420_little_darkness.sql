/*
  # Create publications table for Lambretta restoration

  1. New Tables
    - `publications`
      - `id` (uuid, primary key)
      - `created_at` (timestamp with time zone)
      - `media_url` (text) - URL of the uploaded media file
      - `media_type` (text) - Type of media (image or video)
      - `commentaire` (text) - Comment describing the restoration step
      - `user_id` (uuid) - Reference to the user who created the publication

  2. Security
    - Enable RLS on `publications` table
    - Add policy for public read access
    - Add policy for authenticated users to insert their own publications

  3. Storage
    - References media files stored in Supabase Storage bucket 'media'
*/

-- Create publications table
CREATE TABLE IF NOT EXISTS publications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  media_url text NOT NULL,
  media_type text NOT NULL CHECK (media_type IN ('image', 'video')),
  commentaire text NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Enable RLS
ALTER TABLE publications ENABLE ROW LEVEL SECURITY;

-- Policy for public read access (anyone can view publications)
CREATE POLICY "Lecture publique des publications"
  ON publications
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Policy for authenticated users to insert their own publications
CREATE POLICY "Écriture pour utilisateurs authentifiés"
  ON publications
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create index for better performance on timeline queries
CREATE INDEX IF NOT EXISTS publications_created_at_idx 
  ON publications (created_at DESC);
