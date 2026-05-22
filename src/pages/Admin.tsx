import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { usePublications } from '../hooks/usePublications';
import { useBeforeAfter } from '../hooks/useBeforeAfter';
import {
  Upload,
  Image,
  Video,
  MessageSquare,
  Check,
  X,
  Loader2,
  Youtube,
  ArrowLeftRight,
  Camera,
} from 'lucide-react';

type AdminTab = 'timeline' | 'before-after';

export function Admin() {
  const { user } = useAuth();
  const { addPublication } = usePublications();
  const { items: beforeAfterItems, addItem: addBeforeAfter, loading: baLoading } = useBeforeAfter();

  const [activeTab, setActiveTab] = useState<AdminTab>('timeline');

  // Timeline form state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [commentaire, setCommentaire] = useState('');
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [mode, setMode] = useState<'file' | 'youtube'>('file');

  // Before/After form state
  const [baTitle, setBaTitle] = useState('');
  const [baDescription, setBaDescription] = useState('');
  const [baBeforeFile, setBaBeforeFile] = useState<File | null>(null);
  const [baAfterFile, setBaAfterFile] = useState<File | null>(null);
  const [baUploading, setBaUploading] = useState(false);
  const [baMessage, setBaMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // --- Timeline handlers ---
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

  const extractYoutubeId = (url: string): string | null => {
    const patterns = [
      /youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/,
      /youtu\.be\/([a-zA-Z0-9_-]{11})/,
      /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
      /^([a-zA-Z0-9_-]{11})$/,
    ];
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    return null;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!commentaire.trim() || !user) {
      setMessage({ type: 'error', text: 'Veuillez ajouter un commentaire.' });
      return;
    }
    if (mode === 'file' && !selectedFile) {
      setMessage({ type: 'error', text: 'Veuillez sélectionner un fichier.' });
      return;
    }
    if (mode === 'youtube' && !youtubeUrl.trim()) {
      setMessage({ type: 'error', text: 'Veuillez ajouter un lien YouTube.' });
      return;
    }
    if (mode === 'youtube') {
      const youtubeId = extractYoutubeId(youtubeUrl.trim());
      if (!youtubeId) {
        setMessage({ type: 'error', text: 'Lien YouTube invalide.' });
        return;
      }
    }

    setUploading(true);
    setMessage(null);

    let result;
    if (mode === 'file') {
      result = await addPublication(selectedFile!, commentaire.trim(), user.id);
    } else {
      const youtubeId = extractYoutubeId(youtubeUrl.trim())!;
      result = await addPublication(youtubeId, commentaire.trim(), user.id, 'youtube');
    }

    if (result.success) {
      setMessage({ type: 'success', text: 'Publication ajoutée avec succès !' });
      setSelectedFile(null);
      setYoutubeUrl('');
      setCommentaire('');
      const fileInput = document.getElementById('file-input') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    } else {
      setMessage({ type: 'error', text: result.error || 'Erreur lors de l\'ajout.' });
    }

    setUploading(false);
  };

  const getFileIcon = () => {
    if (!selectedFile) return <Upload className="h-8 w-8" />;
    return selectedFile.type.startsWith('image/') ? <Image className="h-8 w-8" /> : <Video className="h-8 w-8" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // --- Before/After handlers ---
  const handleBaBeforeSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setBaBeforeFile(file);
      setBaMessage(null);
    } else if (file) {
      setBaMessage({ type: 'error', text: 'Seules les images sont acceptées pour l\'avant/après.' });
    }
  };

  const handleBaAfterSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setBaAfterFile(file);
      setBaMessage(null);
    } else if (file) {
      setBaMessage({ type: 'error', text: 'Seules les images sont acceptées pour l\'avant/après.' });
    }
  };

  const handleBaSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!baTitle.trim() || !baBeforeFile || !baAfterFile || !user) {
      setBaMessage({ type: 'error', text: 'Veuillez remplir le titre et sélectionner les deux photos.' });
      return;
    }

    setBaUploading(true);
    setBaMessage(null);

    const result = await addBeforeAfter(baTitle.trim(), baDescription.trim(), baBeforeFile, baAfterFile, user.id);

    if (result.success) {
      setBaMessage({ type: 'success', text: 'Avant/après ajouté avec succès !' });
      setBaTitle('');
      setBaDescription('');
      setBaBeforeFile(null);
      setBaAfterFile(null);
      const beforeInput = document.getElementById('ba-before-input') as HTMLInputElement;
      const afterInput = document.getElementById('ba-after-input') as HTMLInputElement;
      if (beforeInput) beforeInput.value = '';
      if (afterInput) afterInput.value = '';
    } else {
      setBaMessage({ type: 'error', text: result.error || 'Erreur lors de l\'ajout.' });
    }

    setBaUploading(false);
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* En-tête */}
      <header className="text-center mb-8">
        <h2 className="text-3xl font-bold text-amber-900 mb-4 font-serif">
          Administration
        </h2>
        <p className="text-amber-700">
          Gérez le contenu de votre carnet de restauration
        </p>
      </header>

      {/* Onglets */}
      <div className="flex gap-3 mb-8">
        <button
          onClick={() => setActiveTab('timeline')}
          className={`flex-1 flex items-center justify-center space-x-2 px-4 py-3 rounded-xl font-bold transition-all ${
            activeTab === 'timeline'
              ? 'bg-amber-200 text-amber-900 shadow-md'
              : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
          }`}
        >
          <Camera className="h-5 w-5" />
          <span>Timeline</span>
        </button>
        <button
          onClick={() => setActiveTab('before-after')}
          className={`flex-1 flex items-center justify-center space-x-2 px-4 py-3 rounded-xl font-bold transition-all ${
            activeTab === 'before-after'
              ? 'bg-amber-200 text-amber-900 shadow-md'
              : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
          }`}
        >
          <ArrowLeftRight className="h-5 w-5" />
          <span>Avant/Après</span>
        </button>
      </div>

      {/* --- ONGLET TIMELINE --- */}
      {activeTab === 'timeline' && (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Sélecteur de mode */}
          <div className="bg-white rounded-xl border-4 border-amber-200 p-6 shadow-lg">
            <span className="text-lg font-semibold text-amber-900 mb-4 block">
              Type de contenu
            </span>
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => { setMode('file'); setYoutubeUrl(''); }}
                className={`flex-1 flex items-center justify-center space-x-2 px-4 py-3 rounded-lg font-semibold transition-all ${
                  mode === 'file'
                    ? 'bg-amber-200 text-amber-900 shadow-md'
                    : 'bg-amber-100 text-amber-700 hover:bg-amber-150'
                }`}
              >
                <Image className="h-5 w-5" />
                <span>Photo/Vidéo</span>
              </button>
              <button
                type="button"
                onClick={() => { setMode('youtube'); setSelectedFile(null); }}
                className={`flex-1 flex items-center justify-center space-x-2 px-4 py-3 rounded-lg font-semibold transition-all ${
                  mode === 'youtube'
                    ? 'bg-red-200 text-red-900 shadow-md'
                    : 'bg-red-100 text-red-700 hover:bg-red-150'
                }`}
              >
                <Youtube className="h-5 w-5" />
                <span>Vidéo YouTube</span>
              </button>
            </div>
          </div>

          {/* Sélection de fichier */}
          {mode === 'file' && (
            <div className="bg-white rounded-xl border-4 border-amber-200 p-6 shadow-lg">
              <label htmlFor="file-input" className="block mb-4">
                <span className="text-lg font-semibold text-amber-900 mb-3 block">
                  Photo ou vidéo de l'étape
                </span>
                <div className={`border-3 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all ${
                  selectedFile ? 'border-green-400 bg-green-50' : 'border-amber-300 bg-amber-50 hover:bg-amber-100'
                }`}>
                  <div className={`flex flex-col items-center space-y-3 ${
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
                        <p className="font-medium">Cliquez pour sélectionner un fichier</p>
                        <p className="text-sm opacity-75">Images et vidéos acceptées</p>
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
          )}

          {/* Lien YouTube */}
          {mode === 'youtube' && (
            <div className="bg-white rounded-xl border-4 border-red-200 p-6 shadow-lg">
              <label htmlFor="youtube-url" className="block">
                <span className="text-lg font-semibold text-red-900 mb-3 block flex items-center space-x-2">
                  <Youtube className="h-5 w-5" />
                  <span>Lien de la vidéo YouTube</span>
                </span>
                <input
                  id="youtube-url"
                  type="text"
                  value={youtubeUrl}
                  onChange={(e) => setYoutubeUrl(e.target.value)}
                  placeholder="https://youtube.com/watch?v=VIDEO_ID ou youtu.be/VIDEO_ID"
                  className="w-full p-4 border-2 border-red-200 rounded-lg focus:border-red-400 focus:outline-none transition-colors"
                />
                <p className="text-sm text-red-700 mt-2">
                  Copiez l'URL complète de la vidéo YouTube
                </p>
              </label>
            </div>
          )}

          {/* Commentaire */}
          <div className="bg-white rounded-xl border-4 border-amber-200 p-6 shadow-lg">
            <label htmlFor="commentaire" className="block mb-4">
              <span className="text-lg font-semibold text-amber-900 mb-3 block flex items-center space-x-2">
                <MessageSquare className="h-5 w-5" />
                <span>Commentaire sur cette étape</span>
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
              message.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'
            }`}>
              {message.type === 'success' ? <Check className="h-5 w-5 flex-shrink-0" /> : <X className="h-5 w-5 flex-shrink-0" />}
              <p className="font-medium">{message.text}</p>
            </div>
          )}

          {/* Bouton de soumission */}
          <button
            type="submit"
            disabled={
              (mode === 'file' && (!selectedFile || !commentaire.trim())) ||
              (mode === 'youtube' && (!youtubeUrl.trim() || !commentaire.trim())) ||
              uploading
            }
            className={`w-full py-4 px-6 rounded-xl font-bold text-lg transition-all flex items-center justify-center space-x-3 ${
              uploading
                ? 'bg-amber-300 text-amber-700 cursor-not-allowed'
                : (mode === 'file' && (!selectedFile || !commentaire.trim())) ||
                  (mode === 'youtube' && (!youtubeUrl.trim() || !commentaire.trim()))
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-amber-400 to-orange-400 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-1'
            }`}
          >
            {uploading ? (
              <><Loader2 className="h-5 w-5 animate-spin" /><span>Publication en cours...</span></>
            ) : (
              <><Upload className="h-5 w-5" /><span>Publier l'étape</span></>
            )}
          </button>
        </form>
      )}

      {/* --- ONGLET AVANT/APRÈS --- */}
      {activeTab === 'before-after' && (
        <div className="space-y-6">
          <form onSubmit={handleBaSubmit} className="space-y-6">
            {/* Titre */}
            <div className="bg-white rounded-xl border-4 border-amber-200 p-6 shadow-lg">
              <label className="block">
                <span className="text-lg font-semibold text-amber-900 mb-3 block">
                  Titre du avant/après
                </span>
                <input
                  type="text"
                  value={baTitle}
                  onChange={(e) => setBaTitle(e.target.value)}
                  placeholder="Ex: Restauration du carénage"
                  className="w-full p-4 border-2 border-amber-200 rounded-lg focus:border-amber-400 focus:outline-none transition-colors"
                />
              </label>
            </div>

            {/* Description */}
            <div className="bg-white rounded-xl border-4 border-amber-200 p-6 shadow-lg">
              <label className="block">
                <span className="text-lg font-semibold text-amber-900 mb-3 block">
                  Description (optionnel)
                </span>
                <textarea
                  value={baDescription}
                  onChange={(e) => setBaDescription(e.target.value)}
                  placeholder="Décrivez la transformation..."
                  className="w-full p-4 border-2 border-amber-200 rounded-lg resize-none focus:border-amber-400 focus:outline-none transition-colors"
                  rows={3}
                />
              </label>
            </div>

            {/* Photo AVANT */}
            <div className="bg-white rounded-xl border-4 border-red-200 p-6 shadow-lg">
              <label htmlFor="ba-before-input" className="block">
                <span className="text-lg font-semibold text-red-900 mb-3 block flex items-center space-x-2">
                  <Image className="h-5 w-5" />
                  <span>Photo AVANT</span>
                </span>
                <div className={`border-3 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all ${
                  baBeforeFile ? 'border-green-400 bg-green-50' : 'border-red-300 bg-red-50 hover:bg-red-100'
                }`}>
                  <div className={`flex flex-col items-center space-y-2 ${
                    baBeforeFile ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {baBeforeFile ? (
                      <div>
                        <p className="font-medium">{baBeforeFile.name}</p>
                        <p className="text-sm opacity-75">{formatFileSize(baBeforeFile.size)}</p>
                      </div>
                    ) : (
                      <div>
                        <p className="font-medium">Sélectionnez la photo "avant"</p>
                        <p className="text-sm opacity-75">Images uniquement</p>
                      </div>
                    )}
                  </div>
                </div>
                <input
                  id="ba-before-input"
                  type="file"
                  accept="image/*"
                  onChange={handleBaBeforeSelect}
                  className="hidden"
                />
              </label>
            </div>

            {/* Photo APRÈS */}
            <div className="bg-white rounded-xl border-4 border-emerald-200 p-6 shadow-lg">
              <label htmlFor="ba-after-input" className="block">
                <span className="text-lg font-semibold text-emerald-900 mb-3 block flex items-center space-x-2">
                  <Image className="h-5 w-5" />
                  <span>Photo APRÈS</span>
                </span>
                <div className={`border-3 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all ${
                  baAfterFile ? 'border-green-400 bg-green-50' : 'border-emerald-300 bg-emerald-50 hover:bg-emerald-100'
                }`}>
                  <div className={`flex flex-col items-center space-y-2 ${
                    baAfterFile ? 'text-green-600' : 'text-emerald-600'
                  }`}>
                    {baAfterFile ? (
                      <div>
                        <p className="font-medium">{baAfterFile.name}</p>
                        <p className="text-sm opacity-75">{formatFileSize(baAfterFile.size)}</p>
                      </div>
                    ) : (
                      <div>
                        <p className="font-medium">Sélectionnez la photo "après"</p>
                        <p className="text-sm opacity-75">Images uniquement</p>
                      </div>
                    )}
                  </div>
                </div>
                <input
                  id="ba-after-input"
                  type="file"
                  accept="image/*"
                  onChange={handleBaAfterSelect}
                  className="hidden"
                />
              </label>
            </div>

            {/* Message */}
            {baMessage && (
              <div className={`p-4 rounded-lg border-2 flex items-center space-x-3 ${
                baMessage.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'
              }`}>
                {baMessage.type === 'success' ? <Check className="h-5 w-5 flex-shrink-0" /> : <X className="h-5 w-5 flex-shrink-0" />}
                <p className="font-medium">{baMessage.text}</p>
              </div>
            )}

            {/* Bouton */}
            <button
              type="submit"
              disabled={!baTitle.trim() || !baBeforeFile || !baAfterFile || baUploading}
              className={`w-full py-4 px-6 rounded-xl font-bold text-lg transition-all flex items-center justify-center space-x-3 ${
                baUploading
                  ? 'bg-amber-300 text-amber-700 cursor-not-allowed'
                  : !baTitle.trim() || !baBeforeFile || !baAfterFile
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-amber-400 to-orange-400 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-1'
              }`}
            >
              {baUploading ? (
                <><Loader2 className="h-5 w-5 animate-spin" /><span>Upload en cours...</span></>
              ) : (
                <><ArrowLeftRight className="h-5 w-5" /><span>Ajouter l'avant/après</span></>
              )}
            </button>
          </form>

          {/* Liste des avant/après existants */}
          {beforeAfterItems.length > 0 && (
            <div className="bg-white rounded-xl border-4 border-amber-200 p-6 shadow-lg">
              <h3 className="text-lg font-bold text-amber-900 mb-4">
                Avant/après existants ({beforeAfterItems.length})
              </h3>
              <div className="space-y-3">
                {beforeAfterItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center space-x-3 p-3 bg-amber-50 rounded-lg border border-amber-200"
                  >
                    <div className="flex -space-x-2">
                      <img src={item.before_url} alt="" className="w-10 h-10 object-cover rounded border border-red-200" />
                      <img src={item.after_url} alt="" className="w-10 h-10 object-cover rounded border border-emerald-200" />
                    </div>
                    <span className="font-medium text-amber-900 flex-1 truncate">{item.title}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Conseils */}
      <div className="mt-8 bg-amber-100 rounded-xl p-6 border-2 border-amber-200">
        <h3 className="font-bold text-amber-900 mb-3">Conseils pour de belles publications</h3>
        <ul className="space-y-2 text-amber-800 text-sm">
          <li>• Prenez des photos nettes avec un bon éclairage</li>
          <li>• Décrivez précisément l'étape réalisée</li>
          <li>• Pour l'avant/après, prenez les photos sous le même angle</li>
          <li>• Les vidéos courtes sont idéales pour montrer les techniques</li>
        </ul>
      </div>
    </div>
  );
}
