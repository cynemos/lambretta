/*
  # Système de J'aime pour les publications

  1. Nouvelles tables
    - `likes`
      - `id` (uuid, primary key)
      - `publication_id` (uuid, foreign key)
      - `user_fingerprint` (text) - Identifiant unique du visiteur
      - `created_at` (timestamp)

  2. Sécurité
    - Enable RLS sur la table `likes`
    - Politique de lecture publique
    - Politique d'écriture publique avec contrainte d'unicité
*/

-- Table des likes
CREATE TABLE IF NOT EXISTS likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  publication_id uuid NOT NULL REFERENCES publications(id) ON DELETE CASCADE,
  user_fingerprint text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(publication_id, user_fingerprint)
);

-- Index pour les performances
CREATE INDEX IF NOT EXISTS likes_publication_id_idx ON likes(publication_id);
CREATE INDEX IF NOT EXISTS likes_created_at_idx ON likes(created_at DESC);

-- Enable RLS
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;

-- Politique de lecture publique
CREATE POLICY "Lecture publique des likes"
  ON likes
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Politique d'écriture publique
CREATE POLICY "Écriture publique des likes"
  ON likes
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Politique de suppression publique (pour unlike)
CREATE POLICY "Suppression publique des likes"
  ON likes
  FOR DELETE
  TO anon, authenticated
  USING (true);
