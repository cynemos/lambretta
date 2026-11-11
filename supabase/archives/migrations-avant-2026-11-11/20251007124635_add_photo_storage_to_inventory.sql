/*
  # Ajouter le stockage de photos pour l'inventaire

  1. Modifications
    - Créer un bucket de stockage public pour les photos d'inventaire
    - La colonne `photos` existe déjà dans `scooter_parts_inventory` (text[])
    - Ajouter des politiques de stockage pour permettre l'upload et la lecture publique

  2. Sécurité
    - Lecture publique des photos (pour partage)
    - Upload uniquement pour utilisateurs authentifiés
    - Suppression uniquement pour utilisateurs authentifiés

  3. Notes
    - Les URLs des photos seront stockées dans la colonne `photos` existante
    - Format: ['https://...storage.../photo1.jpg', 'https://...storage.../photo2.jpg']
*/

-- Créer le bucket de stockage pour les photos d'inventaire
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'inventory-photos',
  'inventory-photos',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Supprimer les anciennes politiques si elles existent
DROP POLICY IF EXISTS "Public read access for inventory photos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload inventory photos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update their own inventory photos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete their own inventory photos" ON storage.objects;

-- Politique: Lecture publique des photos
CREATE POLICY "Public read access for inventory photos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'inventory-photos');

-- Politique: Upload pour utilisateurs authentifiés uniquement
CREATE POLICY "Authenticated users can upload inventory photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'inventory-photos' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Politique: Mise à jour pour utilisateurs authentifiés (leurs propres fichiers)
CREATE POLICY "Authenticated users can update their own inventory photos"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'inventory-photos' AND
  (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'inventory-photos' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Politique: Suppression pour utilisateurs authentifiés (leurs propres fichiers)
CREATE POLICY "Authenticated users can delete their own inventory photos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'inventory-photos' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
