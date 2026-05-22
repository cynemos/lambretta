import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface VehicleInfo {
  id: string;
  engine_serial_number: string | null;
  chassis_number: string | null;
  registration: string | null;
  manufacturing_year: number | null;
  manufacturing_location: string | null;
  current_state: string | null;
  created_at: string;
  updated_at: string;
}

export function useVehicleInfo() {
  const [vehicleInfo, setVehicleInfo] = useState<VehicleInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchVehicleInfo = async () => {
    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('vehicle_info')
        .select('*')
        .limit(1)
        .maybeSingle();

      if (fetchError) throw fetchError;
      setVehicleInfo(data);
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur lors du chargement';
      setError(message);
      console.error('Error fetching vehicle info:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVehicleInfo();
  }, []);

  const updateVehicleInfo = async (updates: Partial<VehicleInfo>) => {
    try {
      if (!vehicleInfo) {
        const { data, error: insertError } = await supabase
          .from('vehicle_info')
          .insert([updates])
          .select()
          .single();

        if (insertError) throw insertError;
        setVehicleInfo(data);
        return data;
      } else {
        const { data, error: updateError } = await supabase
          .from('vehicle_info')
          .update(updates)
          .eq('id', vehicleInfo.id)
          .select()
          .single();

        if (updateError) throw updateError;
        setVehicleInfo(data);
        return data;
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur lors de la mise à jour';
      setError(message);
      console.error('Error updating vehicle info:', err);
      throw err;
    }
  };

  return {
    vehicleInfo,
    loading,
    error,
    updateVehicleInfo,
    refreshVehicleInfo: fetchVehicleInfo
  };
}
