import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export interface InventoryComment {
  id: string;
  part_id: string;
  author_name: string;
  author_email: string | null;
  content: string;
  created_at: string;
  is_approved: boolean;
}

export function useInventoryComments(partId: string) {
  const [comments, setComments] = useState<InventoryComment[]>([]);
  const [loading, setLoading] = useState(true);

  const loadComments = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('inventory_comments')
        .select('*')
        .eq('part_id', partId)
        .eq('is_approved', true)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setComments(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des commentaires:', error);
    } finally {
      setLoading(false);
    }
  }, [partId]);

  useEffect(() => {
    loadComments();

    const channel = supabase
      .channel(`inventory_comments:${partId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'inventory_comments',
          filter: `part_id=eq.${partId}`,
        },
        () => {
          loadComments();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [partId, loadComments]);

  const addComment = async (authorName: string, content: string, authorEmail?: string) => {
    try {
      const { error } = await supabase
        .from('inventory_comments')
        .insert([
          {
            part_id: partId,
            author_name: authorName,
            author_email: authorEmail || null,
            content,
            is_approved: true,
          },
        ]);

      if (error) throw error;
      await loadComments();
      return true;
    } catch (error) {
      console.error('Erreur lors de l\'ajout du commentaire:', error);
      return false;
    }
  };

  const deleteComment = async (commentId: string) => {
    try {
      const { error } = await supabase
        .from('inventory_comments')
        .delete()
        .eq('id', commentId);

      if (error) throw error;
      await loadComments();
      return true;
    } catch (error) {
      console.error('Erreur lors de la suppression du commentaire:', error);
      return false;
    }
  };

  return {
    comments,
    loading,
    addComment,
    deleteComment,
  };
}
