import { useState, useEffect } from 'react';
import { supabase, type BasePurchase } from '../lib/supabase';

export function useBasePurchase() {
  const [basePurchase, setBasePurchase] = useState<BasePurchase | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBasePurchase = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('base_purchase')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      setBasePurchase(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBasePurchase();
  }, []);

  const addBasePurchase = async (purchaseData: Omit<BasePurchase, 'id' | 'created_at'>) => {
    try {
      const { error } = await supabase
        .from('base_purchase')
        .insert([purchaseData]);

      if (error) throw error;

      await fetchBasePurchase();
      return { success: true };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Erreur lors de l\'ajout',
      };
    }
  };

  const updateBasePurchase = async (purchaseId: string, purchaseData: Partial<BasePurchase>) => {
    try {
      const { error } = await supabase
        .from('base_purchase')
        .update(purchaseData)
        .eq('id', purchaseId);

      if (error) throw error;

      await fetchBasePurchase();
      return { success: true };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Erreur lors de la modification',
      };
    }
  };

  const deleteBasePurchase = async (purchaseId: string) => {
    try {
      const { error } = await supabase
        .from('base_purchase')
        .delete()
        .eq('id', purchaseId);

      if (error) throw error;

      await fetchBasePurchase();
      return { success: true };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Erreur lors de la suppression',
      };
    }
  };

  return {
    basePurchase,
    loading,
    error,
    addBasePurchase,
    updateBasePurchase,
    deleteBasePurchase,
    refreshBasePurchase: fetchBasePurchase,
  };
}
