/*
  # Création de la table base_purchase (achat du véhicule de base)

  1. Nouvelle table
    - `base_purchase` pour enregistrer l'achat du véhicule à restaurer
    - Champs : véhicule, prix, date, vendeur, état, notes
    
  2. Sécurité
    - Enable RLS sur la table `base_purchase`
    - Politiques pour permettre aux utilisateurs authentifiés de gérer leurs achats
*/

-- Supprimer la table si elle existe déjà
DROP TABLE IF EXISTS base_purchase;

-- Créer la table base_purchase
CREATE TABLE base_purchase (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now() NOT NULL,
  vehicle_name text NOT NULL,
  purchase_price numeric(10,2) NOT NULL,
  purchase_date date NOT NULL,
  seller_name text,
  seller_location text,
  vehicle_condition text,
  notes text,
  user_id uuid NOT NULL
);

-- Activer RLS
ALTER TABLE base_purchase ENABLE ROW LEVEL SECURITY;

-- Index pour améliorer les performances
CREATE INDEX base_purchase_user_id_idx ON base_purchase(user_id);
CREATE INDEX base_purchase_purchase_date_idx ON base_purchase(purchase_date DESC);

-- Politiques RLS simplifiées
CREATE POLICY "Enable read access for all users" ON base_purchase
  FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users only" ON base_purchase
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Enable update for users based on user_id" ON base_purchase
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Enable delete for users based on user_id" ON base_purchase
  FOR DELETE USING (auth.uid() = user_id);
