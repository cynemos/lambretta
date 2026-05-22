/*
  # Create pieces table for parts management

  1. New Tables
    - `pieces`
      - `id` (uuid, primary key)
      - `nom` (text, part name)
      - `categorie` (text, category)
      - `etat` (text, condition: neuve/occasion)
      - `prix` (numeric, price)
      - `fournisseur` (text, supplier)
      - `date_achat` (date, purchase date)
      - `date_installation` (date, installation date)
      - `notes` (text, additional notes)
      - `user_id` (uuid, foreign key to auth.users)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `pieces` table
    - Add policies for CRUD operations
    - Read access for all users
    - Write access only for authenticated users on their own data
*/

CREATE TABLE IF NOT EXISTS public.pieces (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now() NOT NULL,
  nom text NOT NULL,
  categorie text NOT NULL,
  etat text NOT NULL CHECK (etat IN ('neuve', 'occasion')),
  prix numeric(10, 2) NOT NULL,
  fournisseur text,
  date_achat date NOT NULL,
  date_installation date,
  notes text,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Enable RLS
ALTER TABLE public.pieces ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Enable read access for all users" 
  ON public.pieces 
  FOR SELECT 
  USING (true);

CREATE POLICY "Enable insert for authenticated users only" 
  ON public.pieces 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Enable update for users based on user_id" 
  ON public.pieces 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Enable delete for users based on user_id" 
  ON public.pieces 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Index for better performance
CREATE INDEX IF NOT EXISTS pieces_date_achat_idx ON public.pieces (date_achat DESC);
CREATE INDEX IF NOT EXISTS pieces_categorie_idx ON public.pieces (categorie);
CREATE INDEX IF NOT EXISTS pieces_user_id_idx ON public.pieces (user_id);
