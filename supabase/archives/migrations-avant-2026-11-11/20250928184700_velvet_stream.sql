/*
  # Mise à jour de la table des commentaires

  1. Modifications
    - Rendre le champ email optionnel (nullable)
    - Permettre les commentaires sans email obligatoire

  2. Sécurité
    - Maintenir les politiques RLS existantes
    - Conserver la structure générale
*/

-- Rendre le champ email optionnel
ALTER TABLE comments ALTER COLUMN author_email DROP NOT NULL;
