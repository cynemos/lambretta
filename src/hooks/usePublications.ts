import { useState, useEffect } from 'react';
import { supabase, type Publication } from '../lib/supabase';

export function usePublications() {
  const [publications, setPublications] = useState<Publication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPublications = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('publications')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setPublications(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPublications();
  }, []);

  const addPublication = async (
    fileOrId: File | string,
    commentaire: string,
    userId: string,
    mediaType?: 'youtube'
  ) => {
    try {
      let media_url: string;
      let type: 'image' | 'video' | 'youtube';

      if (mediaType === 'youtube') {
        // fileOrId est l'ID YouTube
        media_url = fileOrId as string;
        type = 'youtube';
      } else {
        // fileOrId est un File
        const file = fileOrId as File;

        // Upload du fichier vers Supabase Storage
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;
        const filePath = `media/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('media')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        // Récupérer l'URL publique
        const { data: { publicUrl } } = supabase.storage
          .from('media')
          .getPublicUrl(filePath);

        media_url = publicUrl;
        type = file.type.startsWith('image/') ? 'image' : 'video';
      }

      // Ajouter l'entrée dans la base de données
      const { error: dbError } = await supabase
        .from('publications')
        .insert([
          {
            media_url,
            media_type: type,
            commentaire,
            user_id: userId,
          },
        ]);

      if (dbError) throw dbError;

      // Rafraîchir la liste
      await fetchPublications();

      return { success: true };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Erreur lors de l\'ajout',
      };
    }
  };

  const updatePublication = async (
    publicationId: string,
    commentaire: string,
    file?: File
  ) => {
    try {
      let updateData: any = { commentaire };

      // Si un nouveau fichier est fourni, l'uploader
      if (file) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;
        const filePath = `media/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('media')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        // Récupérer l'URL publique
        const { data: { publicUrl } } = supabase.storage
          .from('media')
          .getPublicUrl(filePath);

        // Déterminer le type de média
        const mediaType = file.type.startsWith('image/') ? 'image' : 'video';

        updateData.media_url = publicUrl;
        updateData.media_type = mediaType;
      }

      // Mettre à jour l'entrée dans la base de données
      const { error: dbError } = await supabase
        .from('publications')
        .update(updateData)
        .eq('id', publicationId);

      if (dbError) throw dbError;

      // Rafraîchir la liste
      await fetchPublications();
      
      return { success: true };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Erreur lors de la modification',
      };
    }
  };

  const deletePublication = async (publicationId: string) => {
    try {
      const { error } = await supabase
        .from('publications')
        .delete()
        .eq('id', publicationId);

      if (error) throw error;

      // Rafraîchir la liste
      await fetchPublications();
      
      return { success: true };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Erreur lors de la suppression',
      };
    }
  };
  return {
    publications,
    loading,
    error,
    addPublication,
    updatePublication,
    deletePublication,
    refreshPublications: fetchPublications,
  };
}
