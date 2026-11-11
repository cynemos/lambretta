import { useState, useEffect, useCallback } from 'react';
import { supabase, type Comment } from '../lib/supabase';

type Result = { success: boolean; error?: string };
const erreur = (err: unknown, defaut: string): Result => ({
  success: false,
  error: err instanceof Error ? err.message : defaut,
});

// Commentaires de toute la timeline en une seule requête, rangés par publication.
// Avant : une requête par publication (59 pour afficher la timeline).
export function useAllComments() {
  const [byPublication, setByPublication] = useState<Record<string, Comment[]>>({});
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('comments')
        .select('*')
        .eq('is_approved', true)
        .order('created_at', { ascending: true });
      if (error) throw error;
      const map: Record<string, Comment[]> = {};
      for (const c of data ?? []) (map[c.publication_id] ??= []).push(c);
      setByPublication(map);
    } catch (err) {
      console.error('Erreur lors du chargement des commentaires:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const addComment = async (publicationId: string, authorName: string, content: string): Promise<Result> => {
    try {
      const { error } = await supabase.from('comments').insert([
        { publication_id: publicationId, author_name: authorName, author_email: '', content, is_approved: true },
      ]);
      if (error) throw error;
      await refresh();
      return { success: true };
    } catch (err) {
      return erreur(err, "Erreur lors de l'ajout du commentaire");
    }
  };

  const updateComment = async (commentId: string, content: string): Promise<Result> => {
    try {
      const { error } = await supabase.from('comments').update({ content }).eq('id', commentId);
      if (error) throw error;
      await refresh();
      return { success: true };
    } catch (err) {
      return erreur(err, 'Erreur lors de la modification');
    }
  };

  const deleteComment = async (commentId: string): Promise<Result> => {
    try {
      const { error } = await supabase.from('comments').delete().eq('id', commentId);
      if (error) throw error;
      await refresh();
      return { success: true };
    } catch (err) {
      return erreur(err, 'Erreur lors de la suppression');
    }
  };

  const commentsFor = (publicationId: string): Comment[] => byPublication[publicationId] ?? [];

  return { commentsFor, loading, addComment, updateComment, deleteComment };
}
