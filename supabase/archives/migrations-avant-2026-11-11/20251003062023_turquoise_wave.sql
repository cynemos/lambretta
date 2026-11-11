/*
  # Créer la table time_entries pour le suivi du temps

  1. Nouvelle table
    - `time_entries`
      - `id` (uuid, clé primaire)
      - `date` (date, obligatoire)
      - `start_time` (time, optionnel)
      - `end_time` (time, optionnel)
      - `duration_minutes` (integer, obligatoire)
      - `task_description` (text, obligatoire)
      - `category` (text, obligatoire)
      - `notes` (text, optionnel)
      - `created_at` (timestamp)
      - `user_id` (uuid, obligatoire)

  2. Sécurité
    - Activer RLS sur la table `time_entries`
    - Ajouter des politiques pour la lecture publique et l'écriture authentifiée

  3. Index
    - Index sur `user_id` pour les performances
    - Index sur `date` pour le tri
    - Index sur `created_at` pour l'historique
*/

-- Créer la table time_entries
CREATE TABLE IF NOT EXISTS time_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date NOT NULL,
  start_time time,
  end_time time,
  duration_minutes integer NOT NULL,
  task_description text NOT NULL,
  category text NOT NULL,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  user_id uuid NOT NULL
);

-- Activer RLS
ALTER TABLE time_entries ENABLE ROW LEVEL SECURITY;

-- Politiques RLS
CREATE POLICY "Enable read access for all users"
  ON time_entries
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Enable insert for authenticated users only"
  ON time_entries
  FOR INSERT
  TO public
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Enable update for users based on user_id"
  ON time_entries
  FOR UPDATE
  TO public
  USING (auth.uid() = user_id);

CREATE POLICY "Enable delete for users based on user_id"
  ON time_entries
  FOR DELETE
  TO public
  USING (auth.uid() = user_id);

-- Index pour les performances
CREATE INDEX IF NOT EXISTS time_entries_user_id_idx ON time_entries (user_id);
CREATE INDEX IF NOT EXISTS time_entries_date_idx ON time_entries (date DESC);
CREATE INDEX IF NOT EXISTS time_entries_created_at_idx ON time_entries (created_at DESC);
CREATE INDEX IF NOT EXISTS time_entries_category_idx ON time_entries (category);
