import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

// Générer un identifiant unique pour le visiteur
const getUserFingerprint = (): string => {
  let fingerprint = localStorage.getItem('user_fingerprint');
  if (!fingerprint) {
    fingerprint = `visitor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('user_fingerprint', fingerprint);
  }
  return fingerprint;
};

export function useLikes(publicationId: string) {
  const [likesCount, setLikesCount] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [loading, setLoading] = useState(true);

  const userFingerprint = getUserFingerprint();

  const fetchLikes = async () => {
    try {
      setLoading(true);
      
      // Compter le nombre total de likes
      const { count, error: countError } = await supabase
        .from('likes')
        .select('*', { count: 'exact', head: true })
        .eq('publication_id', publicationId);

      if (countError) throw countError;

      setLikesCount(count || 0);

      // Vérifier si l'utilisateur actuel a liké
      const { data, error: checkError } = await supabase
        .from('likes')
        .select('id')
        .eq('publication_id', publicationId)
        .eq('user_fingerprint', userFingerprint)
        .maybeSingle();

      if (checkError) {
        throw checkError;
      }

      setIsLiked(!!data);
    } catch (err) {
      console.error('Erreur lors du chargement des likes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (publicationId) {
      fetchLikes();
    }
  }, [publicationId]);

  const toggleLike = async () => {
    try {
      if (isLiked) {
        // Supprimer le like
        const { error } = await supabase
          .from('likes')
          .delete()
          .eq('publication_id', publicationId)
          .eq('user_fingerprint', userFingerprint);

        if (error) throw error;

        setIsLiked(false);
        setLikesCount(prev => Math.max(0, prev - 1));
      } else {
        // Ajouter le like
        const { error } = await supabase
          .from('likes')
          .insert([
            {
              publication_id: publicationId,
              user_fingerprint: userFingerprint,
            }
          ]);

        if (error) throw error;

        setIsLiked(true);
        setLikesCount(prev => prev + 1);
      }
    } catch (err) {
      console.error('Erreur lors du toggle like:', err);
      // Recharger les données en cas d'erreur
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
