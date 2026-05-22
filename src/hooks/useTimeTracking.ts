import { useState, useEffect } from 'react';
import { supabase, type TimeEntry } from '../lib/supabase';

export function useTimeTracking() {
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTimeEntries = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('time_entries')
        .select('*')
        .order('date', { ascending: false });

      if (error) throw error;

      setTimeEntries(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTimeEntries();
  }, []);

  const addTimeEntry = async (entryData: Omit<TimeEntry, 'id' | 'created_at'>) => {
    try {
      const { error } = await supabase
        .from('time_entries')
        .insert([entryData]);

      if (error) throw error;

      await fetchTimeEntries();
      return { success: true };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Erreur lors de l\'ajout',
      };
    }
  };

  const updateTimeEntry = async (entryId: string, entryData: Partial<TimeEntry>) => {
    try {
      const { error } = await supabase
        .from('time_entries')
        .update(entryData)
        .eq('id', entryId);

      if (error) throw error;

      await fetchTimeEntries();
      return { success: true };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Erreur lors de la modification',
      };
    }
  };

  const deleteTimeEntry = async (entryId: string) => {
    try {
      const { error } = await supabase
        .from('time_entries')
        .delete()
        .eq('id', entryId);

      if (error) throw error;

      await fetchTimeEntries();
      return { success: true };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Erreur lors de la suppression',
      };
    }
  };

  // Statistiques du temps
  const getTimeStatistics = () => {
    const totalMinutes = timeEntries.reduce((sum, entry) => sum + entry.duration_minutes, 0);
    const totalHours = Math.floor(totalMinutes / 60);
    const remainingMinutes = totalMinutes % 60;
    
    const byCategory = timeEntries.reduce((acc, entry) => {
      if (!acc[entry.category]) {
        acc[entry.category] = { count: 0, minutes: 0 };
      }
      acc[entry.category].count++;
      acc[entry.category].minutes += entry.duration_minutes;
      return acc;
    }, {} as Record<string, { count: number; minutes: number }>);

    const byMonth = timeEntries.reduce((acc, entry) => {
      const monthKey = entry.date.substring(0, 7); // YYYY-MM
      if (!acc[monthKey]) {
        acc[monthKey] = { count: 0, minutes: 0 };
      }
      acc[monthKey].count++;
      acc[monthKey].minutes += entry.duration_minutes;
      return acc;
    }, {} as Record<string, { count: number; minutes: number }>);

    const averageSessionMinutes = timeEntries.length > 0 ? totalMinutes / timeEntries.length : 0;
    const totalSessions = timeEntries.length;

    return {
      totalMinutes,
      totalHours,
      remainingMinutes,
      totalSessions,
      averageSessionMinutes,
      byCategory,
      byMonth,
    };
  };

  return {
    timeEntries,
    loading,
    error,
    addTimeEntry,
    updateTimeEntry,
    deleteTimeEntry,
    refreshTimeEntries: fetchTimeEntries,
    statistics: getTimeStatistics(),
  };
}
