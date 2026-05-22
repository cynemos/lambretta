import { useState, useEffect } from 'react';
import { supabase, type BeforeAfter } from '../lib/supabase';

export function useBeforeAfter() {
  const [items, setItems] = useState<BeforeAfter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchItems = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('before_after')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setItems(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const addItem = async (
    title: string,
    description: string,
    beforeFile: File,
    afterFile: File,
    userId: string
  ) => {
    try {
      const beforeExt = beforeFile.name.split('.').pop();
      const afterExt = afterFile.name.split('.').pop();
      const beforePath = `before_after/${Date.now()}_before.${beforeExt}`;
      const afterPath = `before_after/${Date.now()}_after.${afterExt}`;

      const [beforeResult, afterResult] = await Promise.all([
        supabase.storage.from('media').upload(beforePath, beforeFile),
        supabase.storage.from('media').upload(afterPath, afterFile),
      ]);

      if (beforeResult.error) throw beforeResult.error;
      if (afterResult.error) throw afterResult.error;

      const { data: { publicUrl: beforeUrl } } = supabase.storage.from('media').getPublicUrl(beforePath);
      const { data: { publicUrl: afterUrl } } = supabase.storage.from('media').getPublicUrl(afterPath);

      const { error: dbError } = await supabase
        .from('before_after')
        .insert([
          {
            title,
            description,
            before_url: beforeUrl,
            after_url: afterUrl,
            user_id: userId,
          },
        ]);

      if (dbError) throw dbError;

      await fetchItems();
      return { success: true };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Erreur lors de l\'ajout',
      };
    }
  };

  const updateItem = async (
    itemId: string,
    title: string,
    description: string,
    beforeFile?: File,
    afterFile?: File
  ) => {
    try {
      const updateData: Record<string, string> = { title, description };

      if (beforeFile) {
        const beforeExt = beforeFile.name.split('.').pop();
        const beforePath = `before_after/${Date.now()}_before.${beforeExt}`;
        const { error: uploadError } = await supabase.storage.from('media').upload(beforePath, beforeFile);
        if (uploadError) throw uploadError;
        const { data: { publicUrl } } = supabase.storage.from('media').getPublicUrl(beforePath);
        updateData.before_url = publicUrl;
      }

      if (afterFile) {
        const afterExt = afterFile.name.split('.').pop();
        const afterPath = `before_after/${Date.now()}_after.${afterExt}`;
        const { error: uploadError } = await supabase.storage.from('media').upload(afterPath, afterFile);
        if (uploadError) throw uploadError;
        const { data: { publicUrl } } = supabase.storage.from('media').getPublicUrl(afterPath);
        updateData.after_url = publicUrl;
      }

      const { error: dbError } = await supabase
        .from('before_after')
        .update(updateData)
        .eq('id', itemId);

      if (dbError) throw dbError;

      await fetchItems();
      return { success: true };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Erreur lors de la modification',
      };
    }
  };

  const deleteItem = async (itemId: string) => {
    try {
      const { error } = await supabase
        .from('before_after')
        .delete()
        .eq('id', itemId);

      if (error) throw error;

      await fetchItems();
      return { success: true };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Erreur lors de la suppression',
      };
    }
  };

  return {
    items,
    loading,
    error,
    addItem,
    updateItem,
    deleteItem,
    refreshItems: fetchItems,
  };
}
