/*
  # Sécurité : seul l'administrateur peut modifier le contenu

  Problème corrigé
    - Les inscriptions sont ouvertes : n'importe qui pouvait créer un compte et,
      avec les anciennes règles, publier, supprimer les commentaires, etc.
    - Les « j'aime » pouvaient être supprimés par n'importe qui.

  Principe
    - Lecture publique conservée sur tout le contenu (le site reste visible par la famille).
    - Écriture (ajout / modification / suppression) réservée aux profils is_admin = true.
    - Les visiteurs peuvent toujours commenter (avec des limites de taille).
    - Les « j'aime » passent par deux fonctions ; l'identifiant du visiteur n'est plus lisible
      par les autres, donc personne ne peut retirer le « j'aime » de quelqu'un d'autre.
    - Un utilisateur ne peut lire que son propre profil et ne peut jamais se donner is_admin.

  ATTENTION : cette migration SUPPRIME toutes les règles (policies) existantes des tables
  listées ci-dessous, y compris celles créées à la main, puis les recrée proprement.
  Faire une sauvegarde avant de l'appliquer.
*/

BEGIN;

-- 1. Fonction utilitaire : l'utilisateur courant est-il administrateur ?
--    SECURITY DEFINER pour lire profiles sans dépendre de ses propres règles.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND is_admin = true
  );
$$;

REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon, authenticated;

-- 2. Supprimer toutes les règles existantes sur les tables du site
DO $$
DECLARE
  pol record;
BEGIN
  FOR pol IN
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN (
        'publications', 'comments', 'likes', 'pieces', 'time_entries',
        'scooter_parts_inventory', 'inventory_comments', 'documents',
        'before_after', 'vehicle_info', 'owner_history', 'base_purchase',
        'administrative_charges', 'profiles'
      )
  LOOP
    EXECUTE format('DROP POLICY %I ON %I.%I', pol.policyname, pol.schemaname, pol.tablename);
  END LOOP;
END $$;

-- 3. Tables de contenu : lecture publique, écriture admin uniquement
DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'publications', 'pieces', 'time_entries', 'scooter_parts_inventory',
    'documents', 'before_after', 'vehicle_info', 'owner_history',
    'base_purchase', 'administrative_charges'
  ]
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('CREATE POLICY "Lecture publique" ON public.%I FOR SELECT TO anon, authenticated USING (true)', t);
    EXECUTE format('CREATE POLICY "Ajout admin" ON public.%I FOR INSERT TO authenticated WITH CHECK (public.is_admin())', t);
    EXECUTE format('CREATE POLICY "Modification admin" ON public.%I FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin())', t);
    EXECUTE format('CREATE POLICY "Suppression admin" ON public.%I FOR DELETE TO authenticated USING (public.is_admin())', t);
  END LOOP;
END $$;

-- 4. Commentaires (timeline et inventaire) : tout le monde lit et commente,
--    seul l'admin modère. Limites de taille contre le spam massif.
DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['comments', 'inventory_comments']
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('CREATE POLICY "Lecture des commentaires approuvés" ON public.%I FOR SELECT TO anon, authenticated USING (is_approved = true OR public.is_admin())', t);
    EXECUTE format($f$CREATE POLICY "Ajout public de commentaires" ON public.%I FOR INSERT TO anon, authenticated
      WITH CHECK (
        char_length(btrim(author_name)) BETWEEN 1 AND 80
        AND char_length(btrim(content)) BETWEEN 1 AND 2000
        AND (author_email IS NULL OR char_length(author_email) <= 200)
      )$f$, t);
    EXECUTE format('CREATE POLICY "Modération admin" ON public.%I FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin())', t);
    EXECUTE format('CREATE POLICY "Suppression admin" ON public.%I FOR DELETE TO authenticated USING (public.is_admin())', t);
  END LOOP;
END $$;

-- 5. Profils : chacun lit le sien, personne ne peut se rendre admin.
--    (Pour nommer un admin : UPDATE profiles SET is_admin = true WHERE id = '...'; en SQL, côté serveur.)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Lecture de son propre profil"
  ON public.profiles FOR SELECT TO authenticated
  USING (id = auth.uid() OR public.is_admin());

-- 6. « J'aime » : plus d'accès direct à la table, uniquement via deux fonctions.
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.likes FROM anon, authenticated;

-- Nombre de « j'aime » d'une publication et si ce visiteur a aimé
CREATE OR REPLACE FUNCTION public.like_status(p_publication_id uuid, p_fingerprint text)
RETURNS TABLE (likes_count bigint, is_liked boolean)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    (SELECT count(*) FROM public.likes WHERE publication_id = p_publication_id),
    EXISTS (
      SELECT 1 FROM public.likes
      WHERE publication_id = p_publication_id AND user_fingerprint = p_fingerprint
    );
$$;

-- Ajoute ou retire le « j'aime » de ce visiteur ; renvoie le nouvel état
CREATE OR REPLACE FUNCTION public.toggle_like(p_publication_id uuid, p_fingerprint text)
RETURNS boolean
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_fingerprint IS NULL OR char_length(p_fingerprint) NOT BETWEEN 10 AND 100 THEN
    RAISE EXCEPTION 'Identifiant visiteur invalide';
  END IF;

  DELETE FROM public.likes
  WHERE publication_id = p_publication_id AND user_fingerprint = p_fingerprint;

  IF FOUND THEN
    RETURN false;
  END IF;

  INSERT INTO public.likes (publication_id, user_fingerprint)
  VALUES (p_publication_id, p_fingerprint);
  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.like_status(uuid, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.toggle_like(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.like_status(uuid, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.toggle_like(uuid, text) TO anon, authenticated;

-- 7. Stockage des fichiers : lecture publique, envoi / modification / suppression admin.
--    On supprime d'abord les règles existantes qui concernent ces deux espaces.
DO $$
DECLARE
  pol record;
BEGIN
  FOR pol IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND (
        coalesce(qual, '') ~ '''(media|inventory-photos)'''
        OR coalesce(with_check, '') ~ '''(media|inventory-photos)'''
      )
  LOOP
    EXECUTE format('DROP POLICY %I ON storage.objects', pol.policyname);
  END LOOP;
END $$;

CREATE POLICY "Lambretta : lecture publique des fichiers"
  ON storage.objects FOR SELECT TO anon, authenticated
  USING (bucket_id IN ('media', 'inventory-photos'));

CREATE POLICY "Lambretta : envoi admin"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id IN ('media', 'inventory-photos') AND public.is_admin());

CREATE POLICY "Lambretta : modification admin"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id IN ('media', 'inventory-photos') AND public.is_admin())
  WITH CHECK (bucket_id IN ('media', 'inventory-photos') AND public.is_admin());

CREATE POLICY "Lambretta : suppression admin"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id IN ('media', 'inventory-photos') AND public.is_admin());

COMMIT;
