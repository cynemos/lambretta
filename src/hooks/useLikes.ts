import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

// Identifiant aléatoire du visiteur, gardé dans son navigateur
const getUserFingerprint = (): string => {
  let fingerprint = localStorage.getItem('user_fingerprint');
  if (!fingerprint) {
    fingerprint = `visitor_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
    localStorage.setItem('user_fingerprint', fingerprint);
  }
  return fingerprint;
};

// La table « likes » n'est plus accessible directement : tout passe par les
// fonctions like_status et toggle_like (voir la migration securite_admin).
export function useLikes(publicationId: string) {
  const [likesCount, setLikesCount] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [loading, setLoading] = useState(true);

  const userFingerprint = getUserFingerprint();

  const fetchLikes = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .rpc('like_status', { p_publication_id: publicationId, p_fingerprint: userFingerprint })
        .single<{ likes_count: number; is_liked: boolean }>();

      if (error) throw error;

      setLikesCount(Number(data?.likes_count ?? 0));
      setIsLiked(!!data?.is_liked);
    } catch (err) {
      console.error('Erreur lors du chargement des likes:', err);
    } finally {
      setLoading(false);
    }
  }, [publicationId, userFingerprint]);

  useEffect(() => {
    if (publicationId) {
      fetchLikes();
    }
  }, [publicationId, fetchLikes]);

  const toggleLike = async () => {
    try {
      const { data: nowLiked, error } = await supabase.rpc('toggle_like', {
        p_publication_id: publicationId,
        p_fingerprint: userFingerprint,
      });

      if (error) throw error;

      setIsLiked(!!nowLiked);
      setLikesCount(prev => Math.max(0, prev + (nowLiked ? 1 : -1)));
    } catch (err) {
      console.error('Erreur lors du toggle like:', err);
      await fetchLikes();
    }
  };

  return {
    likesCount,
    isLiked,
    loading,
    toggleLike,
    refreshLikes: fetchLikes,
  };
}
