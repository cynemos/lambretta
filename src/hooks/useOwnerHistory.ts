import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface OwnerHistory {
  id: string;
  start_year: number;
  end_year: number | null;
  owner_name: string;
  owner_location: string | null;
  description: string | null;
  is_current: boolean;
  order_index: number;
  created_at: string;
  updated_at: string;
}

export function useOwnerHistory() {
  const [owners, setOwners] = useState<OwnerHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOwners = async () => {
    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('owner_history')
        .select('*')
        .order('order_index', { ascending: true });

      if (fetchError) throw fetchError;
      setOwners(data || []);
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur lors du chargement';
      setError(message);
      console.error('Error fetching owners:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOwners();
  }, []);

  const addOwner = async (owner: Omit<OwnerHistory, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error: insertError } = await supabase
        .from('owner_history')
        .insert([owner])
        .select()
        .single();

      if (insertError) {
        if (insertError.message && insertError.message.includes('permission denied')) {
          throw new Error('Vous n\'avez pas la permission de modifier l\'historique des propriétaires');
        }
        throw insertError;
      }
      setOwners([...owners, data]);
      setError(null);
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur lors de l\'ajout';
      setError(message);
      console.error('Error adding owner:', err);
      throw err;
    }
  };

  const updateOwner = async (id: string, updates: Partial<OwnerHistory>) => {
    try {
      const { data, error: updateError } = await supabase
        .from('owner_history')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (updateError) throw updateError;
      setOwners(owners.map(o => o.id === id ? data : o));
      setError(null);
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur lors de la mise à jour';
      setError(message);
      console.error('Error updating owner:', err);
      throw err;
    }
  };

  const deleteOwner = async (id: string) => {
    try {
      const { error: deleteError } = await supabase
        .from('owner_history')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;
      setOwners(owners.filter(o => o.id !== id));
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur lors de la suppression';
      setError(message);
      console.error('Error deleting owner:', err);
      throw err;
    }
  };

  return {
    owners,
    loading,
    error,
    addOwner,
    updateOwner,
    deleteOwner,
    refreshOwners: fetchOwners
  };
}
