import React, { useState } from 'react';
import { X, Trash2, Upload, ZoomIn, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface PhotoGalleryProps {
  photos: string[];
  partId: string;
  onPhotosUpdate: (photos: string[]) => void;
  canEdit: boolean;
}

export function PhotoGallery({ photos, partId, onPhotosUpdate, canEdit }: PhotoGalleryProps) {
  const [uploading, setUploading] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      const newPhotoUrls: string[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileExt = file.name.split('.').pop();
        const fileName = `${partId}_${Date.now()}_${i}.${fileExt}`;
        const filePath = `${user.id}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('inventory-photos')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('inventory-photos')
          .getPublicUrl(filePath);

        newPhotoUrls.push(publicUrl);
      }

      const updatedPhotos = [...photos, ...newPhotoUrls];

      const { error: updateError } = await supabase
        .from('scooter_parts_inventory')
        .update({ photos: updatedPhotos })
        .eq('id', partId);

      if (updateError) throw updateError;

      onPhotosUpdate(updatedPhotos);
    } catch (error) {
      console.error('Erreur upload:', error);
      alert('Erreur lors de l\'upload des photos');
    } finally {
      setUploading(false);
      if (e.target) e.target.value = '';
    }
  };

  const handleDeletePhoto = async (photoUrl: string) => {
    if (!confirm('Supprimer cette photo ?')) return;

    setDeleting(photoUrl);

    try {
      const urlParts = photoUrl.split('/');
      const fileName = urlParts[urlParts.length - 1];
      const userId = urlParts[urlParts.length - 2];
      const filePath = `${userId}/${fileName}`;

      const { error: deleteError } = await supabase.storage
        .from('inventory-photos')
        .remove([filePath]);

      if (deleteError) throw deleteError;

      const updatedPhotos = photos.filter(p => p !== photoUrl);

      const { error: updateError } = await supabase
        .from('scooter_parts_inventory')
        .update({ photos: updatedPhotos })
        .eq('id', partId);

      if (updateError) throw updateError;

      onPhotosUpdate(updatedPhotos);
    } catch (error) {
      console.error('Erreur suppression:', error);
      alert('Erreur lors de la suppression de la photo');
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="space-y-4">
      {canEdit && (
        <div>
          <label className="flex items-center justify-center w-full px-4 py-3 border-2 border-dashed border-amber-300 rounded-lg cursor-pointer hover:border-amber-400 hover:bg-amber-50 transition-colors">
            <div className="flex items-center space-x-2 text-amber-700">
              {uploading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span className="font-medium">Upload en cours...</span>
                </>
              ) : (
                <>
                  <Upload className="h-5 w-5" />
                  <span className="font-medium">Ajouter des photos</span>
                </>
              )}
            </div>
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileSelect}
              disabled={uploading}
              className="hidden"
            />
          </label>
          <p className="text-xs text-gray-500 mt-1 text-center">
            JPG, PNG, WEBP, GIF - Max 5MB par fichier
          </p>
        </div>
      )}

      {photos && photos.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {photos.map((photo, index) => (
            <div key={index} className="relative group">
              <div className="aspect-square rounded-lg overflow-hidden bg-gray-100 border-2 border-amber-200">
                <img
                  loading="lazy"
                  decoding="async"
                  src={photo}
                  alt={`Photo ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100">
                <div className="flex gap-2">
                  <button
                    onClick={() => setSelectedPhoto(photo)}
                    className="p-2 bg-white rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <ZoomIn className="h-5 w-5 text-gray-700" />
                  </button>
                  {canEdit && (
                    <button
                      onClick={() => handleDeletePhoto(photo)}
                      disabled={deleting === photo}
                      className="p-2 bg-red-500 rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
                    >
                      {deleting === photo ? (
                        <Loader2 className="h-5 w-5 text-white animate-spin" />
                      ) : (
                        <Trash2 className="h-5 w-5 text-white" />
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          <p>Aucune photo pour le moment</p>
        </div>
      )}

      {selectedPhoto && (
        <div
          className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center p-4 z-50"
          onClick={() => setSelectedPhoto(null)}
        >
          <button
            onClick={() => setSelectedPhoto(null)}
            className="absolute top-4 right-4 p-2 bg-white rounded-full hover:bg-gray-100 transition-colors"
          >
            <X className="h-6 w-6 text-gray-700" />
          </button>
          <img
            src={selectedPhoto}
            alt="Photo agrandie"
            className="max-w-full max-h-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
