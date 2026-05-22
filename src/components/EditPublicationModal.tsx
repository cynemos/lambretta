import React, { useState } from 'react';
import { Publication } from '../lib/supabase';
import { X, Save, Upload, Image, Video, MessageSquare, Loader2 } from 'lucide-react';

interface EditPublicationModalProps {
  publication?: Publication | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (commentaire: string, file?: File) => Promise<{ success: boolean; error?: string }>;
}

export function EditPublicationModal({ publication, isOpen, onClose, onSave }: EditPublicationModalProps) {
  // Retourner null si le modal est fermé ou publication non définie
  if (!isOpen || !publication) return null;

  const [commentaire, setCommentaire] = useState(publication?.commentaire || '');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type.startsWith('image/') || file.type.startsWith('video/')) {
        setSelectedFile(file);
        setMessage(null);
      } else {
        setMessage({ type: 'error', text: 'Seules les images et vidéos sont acceptées.' });
      }
    }
  };

  const handleSave = async () => {
    if (!commentaire.trim()) {
      setMessage({ type: 'error', text: 'Le commentaire ne peut pas être vide.' });
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      const result = await onSave(commentaire.trim(), selectedFile || undefined);

      if (result.success) {
        setMessage({ type: 'success', text: 'Publication modifiée avec succès !' });
        setTimeout(() => {
          onClose();
          setSelectedFile(null);
          setMessage(null);
        }, 1500);
      } else {
        setMessage({ type: 'error', text: result.error || 'Erreur lors de la modification.' });
      }
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: 'Erreur inattendue lors de la modification.' });
    }

    setSaving(false);
  };

  const getFileIcon = () => {
    if (!selectedFile) return <Upload className="h-6 w-6" />;
    return selectedFile.type.startsWith('image/') ? <Image className="h-6 w-6" /> : <Video className="h-6 w-6" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl border-4 border-amber-200 shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* En-tête */}
        <div className="bg-gradient-to-r from-amber-100 to-orange-100 px-6 py-4 border-b-2 border-amber-200 flex items-center justify-between">
          <h2 className="text-xl font-bold text-amber-900 font-serif">
            Modifier l'étape
          </h2>
          <button
            onClick={onClose}
            className="text-amber-700 hover:text-amber-900 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Média actuel */}
          <div>
            <h3 className="text-lg font-semibold text-amber-900 mb-3">Média actuel</h3>
            <div className="border-4 border-amber-200 rounded-lg overflow-hidden bg-amber-50 p-4">
              <div className="border-2 border-amber-200 rounded-lg overflow-hidden bg-white">
                {publication.media_type === 'image' ? (
                  <img
                    src={publication.media_url}
                    alt="Média actuel"
                    className="w-full h-48 object-cover"
                  />
                ) : publication.media_type === 'video' ? (
                  <video
                    src={publication.media_url}
                    className="w-full h-48 object-cover"
                    preload="metadata"
                  />
                ) : (
                  <p className="text-amber-700">Aucun média disponible</p>
                )}
              </div>
            </div>
          </div>

          {/* Nouveau fichier (optionnel) */}
          <div>
            <label htmlFor="file-input" className="block mb-4">
              <span className="text-lg font-semibold text-amber-900 mb-3 block">
                Remplacer le média (optionnel)
              </span>
              
              <div className={`border-3 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all ${
                selectedFile ? 'border-green-400 bg-green-50' : 'border-amber-300 bg-amber-50 hover:bg-amber-100'
              }`}>
                <div className={`flex flex-col items-center space-y-2 ${
                  selectedFile ? 'text-green-600' : 'text-amber-600'
                }`}>
                  {getFileIcon()}
                  {selectedFile ? (
                    <div>
                      <p className="font-medium">{selectedFile.name}</p>
                      <p className="text-sm opacity-75">{formatFileSize(selectedFile.size)}</p>
                    </div>
                  ) : (
                    <div>
                      <p className="font-medium">Cliquez pour sélectionner un nouveau fichier</p>
                      <p className="text-sm opacity-75">Laissez vide pour garder le média actuel</p>
                    </div>
                  )}
                </div>
              </div>
              
              <input
                id="file-input"
                type="file"
                accept="image/*,video/*"
                onChange={handleFileSelect}
                className="hidden"
              />
            </label>
          </div>

          {/* Commentaire */}
          <div>
            <label htmlFor="commentaire" className="block mb-4">
              <span className="text-lg font-semibold text-amber-900 mb-3 block flex items-center space-x-2">
                <MessageSquare className="h-5 w-5" />
                <span>Commentaire</span>
              </span>
              
              <textarea
                id="commentaire"
                value={commentaire}
                onChange={(e) => setCommentaire(e.target.value)}
                placeholder="Décrivez cette étape de la restauration..."
                className="w-full p-4 border-2 border-amber-200 rounded-lg resize-none focus:border-amber-400 focus:outline-none transition-colors"
                rows={4}
              />
            </label>
          </div>

          {/* Message de statut */}
          {message && (
            <div className={`p-4 rounded-lg border-2 flex items-center space-x-3 ${
              message.type === 'success' 
                ? 'bg-green-50 border-green-200 text-green-800'
                : 'bg-red-50 border-red-200 text-red-800'
            }`}>
              <p className="font-medium">{message.text}</p>
            </div>
          )}

          {/* Boutons */}
          <div className="flex space-x-4">
            <button
              onClick={handleSave}
              disabled={!commentaire.trim() || saving}
              className={`flex-1 py-3 px-6 rounded-lg font-bold transition-all flex items-center justify-center space-x-2 ${
                saving
                  ? 'bg-amber-300 text-amber-700 cursor-not-allowed'
                  : !commentaire.trim()
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-amber-400 to-orange-400 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-1'
              }`}
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Sauvegarde...</span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  <span>Sauvegarder</span>
                </>
              )}
            </button>

            <button
              onClick={onClose}
              disabled={saving}
              className="px-6 py-3 rounded-lg font-bold text-amber-700 border-2 border-amber-200 hover:bg-amber-50 transition-all"
            >
              Annuler
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
