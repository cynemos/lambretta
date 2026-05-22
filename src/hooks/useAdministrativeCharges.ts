import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface AdministrativeCharge {
  id: string;
  charge_type: 'FFVE' | 'ANTS' | 'immatriculation' | 'assurance' | 'autre';
  description: string;
  amount: number;
  date_charge: string;
  notes?: string;
  user_id: string;
  created_at: string;
}

export function useAdministrativeCharges() {
  const [charges, setCharges] = useState<AdministrativeCharge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadCharges();
  }, []);

  const loadCharges = async () => {
    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('administrative_charges')
        .select('*')
        .order('date_charge', { ascending: false });

      if (fetchError) throw fetchError;
      setCharges(data || []);
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur lors du chargement';
      setError(message);
      console.error('Error loading charges:', err);
    } finally {
      setLoading(false);
    }
  };

  const addCharge = async (charge: Omit<AdministrativeCharge, 'id' | 'created_at' | 'user_id'>) => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError) {
        throw new Error(`Erreur d'authentification: ${userError.message}`);
      }

      if (!user) {
        throw new Error('Vous devez être connecté pour ajouter une charge');
      }

      const { data, error: insertError } = await supabase
        .from('administrative_charges')
        .insert([{
          ...charge,
          user_id: user.id
        }])
        .select()
        .single();

      if (insertError) {
        throw insertError;
      }

      setCharges([data, ...charges]);
      setError(null);
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur lors de l\'ajout';
      setError(message);
      console.error('Error adding charge:', err);
      throw err;
    }
  };

  const updateCharge = async (id: string, updates: Partial<AdministrativeCharge>) => {
    try {
      const { data, error: updateError } = await supabase
        .from('administrative_charges')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (updateError) throw updateError;

      setCharges(charges.map(c => c.id === id ? data : c));
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur lors de la mise à jour';
      setError(message);
      throw err;
    }
  };

  const deleteCharge = async (id: string) => {
    try {
      const { error: deleteError } = await supabase
        .from('administrative_charges')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      setCharges(charges.filter(c => c.id !== id));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur lors de la suppression';
      setError(message);
      throw err;
    }
  };

  return {
    charges,
    loading,
    error,
    loadCharges,
    addCharge,
    updateCharge,
    deleteCharge
  };
}
