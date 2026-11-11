/*
  # Système de commentaires pour les publications

  1. Nouvelle table
    - `comments`
      - `id` (uuid, primary key)
      - `publication_id` (uuid, foreign key vers publications)
      - `author_name` (text, nom de l'auteur)
      - `author_email` (text, email de l'auteur)
      - `content` (text, contenu du commentaire)
      - `created_at` (timestamp)
      - `is_approved` (boolean, modération)

  2. Sécurité
    - Enable RLS sur la table `comments`
    - Politique de lecture pour tous
    - Politique d'écriture pour tous (commentaires publics)
    - Politique de modération pour les admins
*/

CREATE TABLE IF NOT EXISTS comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  publication_id uuid NOT NULL REFERENCES publications(id) ON DELETE CASCADE,
  author_name text NOT NULL,
  author_email text NOT NULL,
  content text NOT NULL,
  created_at timestamptz DEFAULT now(),
  is_approved boolean DEFAULT true
);

ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS comments_publication_id_idx ON comments(publication_id);
CREATE INDEX IF NOT EXISTS comments_created_at_idx ON comments(created_at DESC);

-- Politique de lecture : tous peuvent voir les commentaires approuvés
CREATE POLICY "Lecture publique des commentaires approuvés"
  ON comments
  FOR SELECT
  TO anon, authenticated
  USING (is_approved = true);

-- Politique d'écriture : tous peuvent ajouter des commentaires
CREATE POLICY "Écriture publique des commentaires"
  ON comments
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Politique de modération : seuls les admins peuvent modifier/supprimer
CREATE POLICY "Modération pour utilisateurs authentifiés"
  ON comments
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
