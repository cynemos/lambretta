/*
  # Création de la table publications

  1. Nouvelle table
    - `publications`
      - `id` (uuid, clé primaire)
      - `created_at` (timestamp)
      - `media_url` (text, URL du fichier dans Supabase Storage)
      - `media_type` (text, 'image' ou 'video')
      - `commentaire` (text, description de l'étape)
      - `user_id` (uuid, référence à auth.users)

  2. Sécurité
    - Activer RLS sur `publications`
    - Politique de lecture pour tous (accès public)
    - Politique d'écriture pour les utilisateurs authentifiés uniquement
*/

CREATE TABLE IF NOT EXISTS publications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  media_url text NOT NULL,
  media_type text NOT NULL CHECK (media_type IN ('image', 'video')),
  commentaire text NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE
);

ALTER TABLE publications ENABLE ROW LEVEL SECURITY;

-- Politique pour permettre la lecture à tous (accès public)
CREATE POLICY "Lecture publique des publications"
  ON publications
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Politique pour permettre l'écriture aux utilisateurs authentifiés uniquement
CREATE POLICY "Écriture pour utilisateurs authentifiés"
  ON publications
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Index pour optimiser les requêtes par date
CREATE INDEX IF NOT EXISTS publications_created_at_idx ON publications(created_at DESC);
