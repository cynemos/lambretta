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

export type LikeInfo = { count: number; liked: boolean };

// « J'aime » de toute la timeline en une seule requête (fonction likes_summary).
// La table likes n'est pas lisible directement : les empreintes restent privées.
export function useLikesSummary() {
  const [likes, setLikes] = useState<Record<string, LikeInfo>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const fingerprint = getUserFingerprint();

  const refresh = useCallback(async () => {
    const { data, error } = await supabase.rpc('likes_summary', { p_fingerprint: fingerprint });
    if (error) {
      console.error('Erreur lors du chargement des likes:', error);
      return;
    }
    const map: Record<string, LikeInfo> = {};
    for (const row of (data ?? []) as { publication_id: string; likes_count: number; is_liked: boolean }[]) {
      map[row.publication_id] = { count: Number(row.likes_count), liked: row.is_liked };
    }
    setLikes(map);
  }, [fingerprint]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const toggleLike = async (publicationId: string) => {
    if (busy) return;
    setBusy(publicationId);
    try {
      const { data: nowLiked, error } = await supabase.rpc('toggle_like', {
        p_publication_id: publicationId,
        p_fingerprint: fingerprint,
      });
      if (error) throw error;
      setLikes(prev => {
        const current = prev[publicationId] ?? { count: 0, liked: false };
        return {
          ...prev,
          [publicationId]: { liked: !!nowLiked, count: Math.max(0, current.count + (nowLiked ? 1 : -1)) },
        };
      });
    } catch (err) {
      console.error('Erreur lors du toggle like:', err);
      await refresh();
    } finally {
      setBusy(null);
    }
  };

  const likeFor = (publicationId: string): LikeInfo => likes[publicationId] ?? { count: 0, liked: false };

  return { likeFor, toggleLike, busy };
}
