/*
  # Créer la table des commentaires pour l'inventaire

  1. Nouvelle table
    - `inventory_comments`
      - `id` (uuid, clé primaire)
      - `part_id` (uuid, obligatoire) - Référence vers scooter_parts_inventory
      - `author_name` (text, obligatoire) - Nom de l'auteur du commentaire
      - `author_email` (text, optionnel) - Email de l'auteur
      - `content` (text, obligatoire) - Contenu du commentaire
      - `created_at` (timestamp)
      - `is_approved` (boolean, par défaut true) - Si le commentaire est approuvé

  2. Sécurité
    - Activer RLS sur la table `inventory_comments`
    - Lecture publique pour tous
    - Insertion publique (pour permettre les commentaires sans connexion)
    - Mise à jour et suppression uniquement pour les utilisateurs authentifiés

  3. Index
    - Index sur `part_id` pour les performances
    - Index sur `created_at` pour le tri
*/

-- Créer la table inventory_comments
CREATE TABLE IF NOT EXISTS inventory_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  part_id uuid NOT NULL REFERENCES scooter_parts_inventory(id) ON DELETE CASCADE,
  author_name text NOT NULL,
  author_email text,
  content text NOT NULL,
  created_at timestamptz DEFAULT now(),
  is_approved boolean DEFAULT true
);

-- Activer RLS
ALTER TABLE inventory_comments ENABLE ROW LEVEL SECURITY;

-- Politique de lecture pour tous (uniquement les commentaires approuvés)
CREATE POLICY "Enable read access for approved comments"
  ON inventory_comments
  FOR SELECT
  TO public
  USING (is_approved = true);

-- Politique d'insertion pour tous (permettre les commentaires sans connexion)
CREATE POLICY "Enable insert for all users"
  ON inventory_comments
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Politique de mise à jour pour utilisateurs authentifiés uniquement
CREATE POLICY "Enable update for authenticated users only"
  ON inventory_comments
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Politique de suppression pour utilisateurs authentifiés uniquement
CREATE POLICY "Enable delete for authenticated users only"
  ON inventory_comments
  FOR DELETE
  TO authenticated
  USING (true);

-- Index pour les performances
CREATE INDEX IF NOT EXISTS inventory_comments_part_id_idx ON inventory_comments (part_id);
CREATE INDEX IF NOT EXISTS inventory_comments_created_at_idx ON inventory_comments (created_at DESC);
