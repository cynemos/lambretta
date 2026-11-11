/*
  # Créer le système d'inventaire de pièces de scooter

  1. Nouvelle table
    - `scooter_parts_inventory`
      - `id` (uuid, clé primaire)
      - `nom` (text, obligatoire) - Nom de la pièce
      - `categorie` (text, obligatoire) - Catégorie (moteur, carrosserie, électrique, transmission, freinage, roues, etc.)
      - `etat_actuel` (text, obligatoire) - État constaté (bon, usé, cassé, manquant, à_vérifier)
      - `action_prevue` (text, obligatoire) - Action à réaliser (commander, remplacer, rénover, nettoyer, rien)
      - `priorite` (text, obligatoire) - Priorité (haute, moyenne, basse)
      - `est_commande` (boolean, par défaut false) - Si la pièce est déjà commandée
      - `prix_estime` (numeric, optionnel) - Prix estimé pour l'achat/rénovation
      - `fournisseur_prevu` (text, optionnel) - Fournisseur envisagé
      - `reference` (text, optionnel) - Référence de la pièce
      - `notes` (text, optionnel) - Notes détaillées
      - `photos` (text[], optionnel) - URLs des photos de la pièce
      - `date_demontage` (date, optionnel) - Date du démontage
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
      - `user_id` (uuid, obligatoire)

  2. Sécurité
    - Activer RLS sur la table `scooter_parts_inventory`
    - Ajouter des politiques pour lecture publique et écriture authentifiée par utilisateur

  3. Index
    - Index sur `user_id` pour les performances
    - Index sur `categorie` pour le filtrage
    - Index sur `action_prevue` pour le filtrage
    - Index sur `priorite` pour le tri
    - Index sur `etat_actuel` pour le filtrage
*/

-- Créer la table scooter_parts_inventory
CREATE TABLE IF NOT EXISTS scooter_parts_inventory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nom text NOT NULL,
  categorie text NOT NULL,
  etat_actuel text NOT NULL CHECK (etat_actuel IN ('bon', 'usé', 'cassé', 'manquant', 'à_vérifier')),
  action_prevue text NOT NULL CHECK (action_prevue IN ('commander', 'remplacer', 'rénover', 'nettoyer', 'rien')),
  priorite text NOT NULL DEFAULT 'moyenne' CHECK (priorite IN ('haute', 'moyenne', 'basse')),
  est_commande boolean DEFAULT false,
  prix_estime numeric,
  fournisseur_prevu text,
  reference text,
  notes text,
  photos text[],
  date_demontage date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  user_id uuid NOT NULL
);

-- Activer RLS
ALTER TABLE scooter_parts_inventory ENABLE ROW LEVEL SECURITY;

-- Politique de lecture publique
CREATE POLICY "Enable read access for all users"
  ON scooter_parts_inventory
  FOR SELECT
  TO public
  USING (true);

-- Politique d'insertion pour utilisateurs authentifiés
CREATE POLICY "Enable insert for authenticated users only"
  ON scooter_parts_inventory
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Politique de mise à jour pour l'utilisateur propriétaire
CREATE POLICY "Enable update for users based on user_id"
  ON scooter_parts_inventory
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Politique de suppression pour l'utilisateur propriétaire
CREATE POLICY "Enable delete for users based on user_id"
  ON scooter_parts_inventory
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Index pour les performances
CREATE INDEX IF NOT EXISTS scooter_parts_inventory_user_id_idx ON scooter_parts_inventory (user_id);
CREATE INDEX IF NOT EXISTS scooter_parts_inventory_categorie_idx ON scooter_parts_inventory (categorie);
CREATE INDEX IF NOT EXISTS scooter_parts_inventory_action_prevue_idx ON scooter_parts_inventory (action_prevue);
CREATE INDEX IF NOT EXISTS scooter_parts_inventory_priorite_idx ON scooter_parts_inventory (priorite);
CREATE INDEX IF NOT EXISTS scooter_parts_inventory_etat_actuel_idx ON scooter_parts_inventory (etat_actuel);
CREATE INDEX IF NOT EXISTS scooter_parts_inventory_created_at_idx ON scooter_parts_inventory (created_at DESC);

-- Trigger pour mettre à jour automatiquement updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_scooter_parts_inventory_updated_at
  BEFORE UPDATE ON scooter_parts_inventory
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
