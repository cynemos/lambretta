import { useState, useEffect } from 'react';
import { supabase, type Comment } from '../lib/supabase';

export function useComments(publicationId: string) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchComments = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('comments')
        .select('*')
        .eq('publication_id', publicationId)
        .eq('is_approved', true)
        .order('created_at', { ascending: true });

      if (error) throw error;

      setComments(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (publicationId) {
      fetchComments();
    }
  }, [publicationId]);

  const addComment = async (authorName: string, authorEmail: string, content: string) => {
    try {
      const { error } = await supabase
        .from('comments')
        .insert([
          {
            publication_id: publicationId,
            author_name: authorName,
            author_email: authorEmail || '',
            content: content,
            is_approved: true
          }
        ]);

      if (error) throw error;

      await fetchComments();
      return { success: true };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Erreur lors de l\'ajout du commentaire',
      };
    }
  };

  const updateComment = async (commentId: string, content: string) => {
    try {
      const { error } = await supabase
        .from('comments')
        .update({ content })
        .eq('id', commentId);

      if (error) throw error;

      await fetchComments();
      return { success: true };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Erreur lors de la modification',
      };
    }
  };
  const deleteComment = async (commentId: string) => {
    try {
      const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', commentId);

      if (error) throw error;

      await fetchComments();
      return { success: true };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Erreur lors de la suppression',
      };
    }
  };

  return {
    comments,
    loading,
    error,
    addComment,
    updateComment,
    deleteComment,
    refreshComments: fetchComments,
  };
}
