/*
  # Lier l'inventaire aux pièces commandées

  1. Modifications
    - Ajouter une colonne `piece_commandee_id` dans `scooter_parts_inventory`
      - Référence vers la table `pieces`
      - Permet de lier une pièce de l'inventaire à une pièce commandée
    - Ajouter une colonne `inventory_part_id` dans `pieces`
      - Référence vers la table `scooter_parts_inventory`
      - Permet de savoir quelle pièce de l'inventaire correspond à cette commande

  2. Index
    - Index sur `piece_commandee_id` pour les performances
    - Index sur `inventory_part_id` pour les performances

  3. Notes
    - Cette relation permet de suivre quelles pièces démontées ont été remplacées par des pièces commandées
    - Une pièce de l'inventaire peut avoir une pièce commandée associée
    - Une pièce commandée peut être liée à une pièce de l'inventaire d'origine
*/

-- Ajouter la colonne piece_commandee_id dans scooter_parts_inventory
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'scooter_parts_inventory' AND column_name = 'piece_commandee_id'
  ) THEN
    ALTER TABLE scooter_parts_inventory
    ADD COLUMN piece_commandee_id uuid REFERENCES pieces(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Ajouter la colonne inventory_part_id dans pieces
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pieces' AND column_name = 'inventory_part_id'
  ) THEN
    ALTER TABLE pieces
    ADD COLUMN inventory_part_id uuid REFERENCES scooter_parts_inventory(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Index pour les performances
CREATE INDEX IF NOT EXISTS scooter_parts_inventory_piece_commandee_id_idx 
  ON scooter_parts_inventory (piece_commandee_id);

CREATE INDEX IF NOT EXISTS pieces_inventory_part_id_idx 
  ON pieces (inventory_part_id);
