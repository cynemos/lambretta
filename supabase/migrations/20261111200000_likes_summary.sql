/*
  # « J'aime » de toute la timeline en une seule requête

  Avant : une requête like_status par publication (59 requêtes pour afficher la timeline).
  Après : likes_summary renvoie, pour chaque publication qui a au moins un « j'aime »,
  le nombre de « j'aime » et si le visiteur (identifié par son empreinte) l'a aimée.

  Comme like_status, la fonction lit la table likes avec ses propres droits (SECURITY DEFINER) :
  les empreintes des visiteurs ne sont jamais renvoyées. Ajout uniquement, rien n'est supprimé.
*/

CREATE OR REPLACE FUNCTION public.likes_summary(p_fingerprint text)
RETURNS TABLE (publication_id uuid, likes_count bigint, is_liked boolean)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT l.publication_id,
         count(*) AS likes_count,
         bool_or(l.user_fingerprint = p_fingerprint) AS is_liked
  FROM public.likes l
  GROUP BY l.publication_id;
$$;

REVOKE ALL ON FUNCTION public.likes_summary(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.likes_summary(text) TO anon, authenticated;
