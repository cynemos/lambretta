import { useState, useEffect } from 'react';
import { supabase, type Piece } from '../lib/supabase';
import { useBasePurchase } from './useBasePurchase';

export function usePieces() {
  const [pieces, setPieces] = useState<Piece[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [administrativeCharges, setAdministrativeCharges] = useState<any[]>([]);
  const { basePurchase } = useBasePurchase();

  const fetchPieces = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('pieces')
        .select('*')
        .order('date_achat', { ascending: false });

      if (error) throw error;

      setPieces(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const fetchAdministrativeCharges = async () => {
    try {
      const { data, error } = await supabase
        .from('administrative_charges')
        .select('*');

      if (error) throw error;

      setAdministrativeCharges(data || []);
    } catch (err) {
      console.error('Error fetching administrative charges:', err);
      setAdministrativeCharges([]);
    }
  };

  useEffect(() => {
    fetchPieces();
    fetchAdministrativeCharges();
  }, []);

  const addPiece = async (pieceData: Omit<Piece, 'id' | 'created_at'> & { inventory_part_id?: string | null }) => {
    try {
      const { inventory_part_id, ...restPieceData } = pieceData;

      const { data: newPiece, error } = await supabase
        .from('pieces')
        .insert([restPieceData])
        .select()
        .single();

      if (error) throw error;

      if (inventory_part_id && newPiece) {
        await supabase
          .from('scooter_parts_inventory')
          .update({
            est_commande: true,
            piece_commandee_id: newPiece.id
          })
          .eq('id', inventory_part_id);

        await supabase
          .from('pieces')
          .update({ inventory_part_id })
          .eq('id', newPiece.id);
      }

      await fetchPieces();
      return { success: true };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Erreur lors de l\'ajout',
      };
    }
  };

  const updatePiece = async (pieceId: string, pieceData: Partial<Piece>) => {
    try {
      const { error } = await supabase
        .from('pieces')
        .update(pieceData)
        .eq('id', pieceId);

      if (error) throw error;

      await fetchPieces();
      return { success: true };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Erreur lors de la modification',
      };
    }
  };

  const deletePiece = async (pieceId: string) => {
    try {
      const { error } = await supabase
        .from('pieces')
        .delete()
        .eq('id', pieceId);

      if (error) throw error;

      await fetchPieces();
      return { success: true };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Erreur lors de la suppression',
      };
    }
  };

  // Statistiques
  const getStatistics = () => {
    const totalPieces = pieces.length;

    // Séparer les coûts par type
    const piecesCost = pieces
      .filter(p => p.categorie !== 'Frais administratifs')
      .reduce((sum, piece) => sum + piece.prix, 0);

    const administrativeCostFromPieces = pieces
      .filter(p => p.categorie === 'Frais administratifs')
      .reduce((sum, piece) => sum + piece.prix, 0);

    const administrativeCostFromCharges = administrativeCharges
      .reduce((sum, charge) => sum + charge.amount, 0);

    const administrativeCost = administrativeCostFromPieces + administrativeCostFromCharges;

    const baseCost = basePurchase?.purchase_price || 0;
    const totalProjectCost = piecesCost + administrativeCost + baseCost;
    
    const byCategory = pieces.reduce((acc, piece) => {
      if (!acc[piece.categorie]) {
        acc[piece.categorie] = { count: 0, cost: 0 };
      }
      acc[piece.categorie].count++;
      acc[piece.categorie].cost += piece.prix;
      return acc;
    }, {} as Record<string, { count: number; cost: number }>);

    const byState = pieces.reduce((acc, piece) => {
      if (!acc[piece.etat]) {
        acc[piece.etat] = { count: 0, cost: 0 };
      }
      acc[piece.etat].count++;
      acc[piece.etat].cost += piece.prix;
      return acc;
    }, {} as Record<string, { count: number; cost: number }>);

    const installed = pieces.filter(p => p.date_installation).length;
    const pending = totalPieces - installed;

    return {
      totalPieces,
      piecesCost,
      administrativeCost,
      baseCost,
      totalProjectCost,
      byCategory,
      byState,
      installed,
      pending,
    };
  };

  return {
    pieces,
    loading,
    error,
    addPiece,
    updatePiece,
    deletePiece,
    refreshPieces: fetchPieces,
    statistics: getStatistics(),
  };
}
