import { useState, useEffect } from 'react';
import { supabase, type Document } from '../lib/supabase';

export function useDocuments() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setDocuments(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const addDocument = async (
    title: string,
    category: 'facture' | 'doc_administratif',
    url: string,
    description: string,
    userId: string
  ) => {
    try {
      const { error: dbError } = await supabase
        .from('documents')
        .insert([
          {
            title,
            category,
            url,
            description,
            user_id: userId,
          },
        ]);

      if (dbError) throw dbError;

      await fetchDocuments();
      return { success: true };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Erreur lors de l\'ajout',
      };
    }
  };

  const updateDocument = async (
    documentId: string,
    title: string,
    category: 'facture' | 'doc_administratif',
    url: string,
    description: string
  ) => {
    try {
      const { error: dbError } = await supabase
        .from('documents')
        .update({ title, category, url, description })
        .eq('id', documentId);

      if (dbError) throw dbError;

      await fetchDocuments();
      return { success: true };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Erreur lors de la modification',
      };
    }
  };

  const deleteDocument = async (documentId: string) => {
    try {
      const { error } = await supabase
        .from('documents')
        .delete()
        .eq('id', documentId);

      if (error) throw error;

      await fetchDocuments();
      return { success: true };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Erreur lors de la suppression',
      };
    }
  };

  return {
    documents,
    loading,
    error,
    addDocument,
    updateDocument,
    deleteDocument,
    refreshDocuments: fetchDocuments,
  };
}
