/*
  # Création de la table des pièces

  1. Nouvelle table
    - `pieces`
      - `id` (uuid, clé primaire)
      - `nom` (text, nom de la pièce)
      - `categorie` (text, catégorie de la pièce)
      - `etat` (text, neuve ou occasion)
      - `prix` (decimal, prix d'achat)
      - `fournisseur` (text, nom du fournisseur)
      - `date_achat` (date, date d'achat)
      - `date_installation` (date, date d'installation optionnelle)
      - `notes` (text, notes optionnelles)
      - `created_at` (timestamp)
      - `user_id` (uuid, référence utilisateur)

  2. Sécurité
    - Activer RLS sur la table `pieces`
    - Politique de lecture publique
    - Politique d'écriture pour utilisateurs authentifiés
    - Politique de modification/suppression pour utilisateurs authentifiés
*/

CREATE TABLE IF NOT EXISTS pieces (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nom text NOT NULL,
  categorie text NOT NULL,
  etat text NOT NULL CHECK (etat IN ('neuve', 'occasion')),
  prix decimal(10,2) NOT NULL DEFAULT 0,
  fournisseur text,
  date_achat date NOT NULL DEFAULT CURRENT_DATE,
  date_installation date,
  notes text,
  created_at timestamptz DEFAULT now(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE
);

ALTER TABLE pieces ENABLE ROW LEVEL SECURITY;

-- Politique de lecture publique
CREATE POLICY "Lecture publique des pièces"
  ON pieces
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Politique d'insertion pour utilisateurs authentifiés
CREATE POLICY "Insertion des pièces pour utilisateurs authentifiés"
  ON pieces
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Politique de modification pour utilisateurs authentifiés
CREATE POLICY "Modification des pièces pour utilisateurs authentifiés"
  ON pieces
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Politique de suppression pour utilisateurs authentifiés
CREATE POLICY "Suppression des pièces pour utilisateurs authentifiés"
  ON pieces
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS pieces_categorie_idx ON pieces(categorie);
CREATE INDEX IF NOT EXISTS pieces_date_achat_idx ON pieces(date_achat DESC);
CREATE INDEX IF NOT EXISTS pieces_user_id_idx ON pieces(user_id);
