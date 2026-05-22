import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useDocuments } from '../hooks/useDocuments';
import type { Document } from '../lib/supabase';
import { FileText, Receipt, Plus, ExternalLink, Trash2, CreditCard as Edit, X, Check, Loader2, FolderOpen, Calendar } from 'lucide-react';

export function Documents() {
  const { user, profile } = useAuth();
  const { documents, loading, addDocument, updateDocument, deleteDocument } = useDocuments();
  const [showForm, setShowForm] = useState(false);
  const [editingDoc, setEditingDoc] = useState<Document | null>(null);
  const [activeCategory, setActiveCategory] = useState<'all' | 'facture' | 'doc_administratif'>('all');
  const [formTitle, setFormTitle] = useState('');
  const [formCategory, setFormCategory] = useState<'facture' | 'doc_administratif'>('facture');
  const [formUrl, setFormUrl] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const isAdmin = profile?.is_admin === true;

  const filteredDocuments = activeCategory === 'all'
    ? documents
    : documents.filter((d) => d.category === activeCategory);

  const factures = documents.filter((d) => d.category === 'facture');
  const docsAdmin = documents.filter((d) => d.category === 'doc_administratif');

  const resetForm = () => {
    setFormTitle('');
    setFormCategory('facture');
    setFormUrl('');
    setFormDescription('');
    setEditingDoc(null);
    setShowForm(false);
  };

  const openEditForm = (doc: Document) => {
    setFormTitle(doc.title);
    setFormCategory(doc.category);
    setFormUrl(doc.url);
    setFormDescription(doc.description);
    setEditingDoc(doc);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formTitle.trim() || !formUrl.trim() || !user) {
      setMessage({ type: 'error', text: 'Veuillez remplir le titre et le lien.' });
      return;
    }

    setSubmitting(true);
    setMessage(null);

    let result;
    if (editingDoc) {
      result = await updateDocument(
        editingDoc.id,
        formTitle.trim(),
        formCategory,
        formUrl.trim(),
        formDescription.trim()
      );
    } else {
      result = await addDocument(
        formTitle.trim(),
        formCategory,
        formUrl.trim(),
        formDescription.trim(),
        user.id
      );
    }

    if (result.success) {
      setMessage({
        type: 'success',
        text: editingDoc ? 'Document modifié avec succès !' : 'Document ajouté avec succès !',
      });
      resetForm();
    } else {
      setMessage({ type: 'error', text: result.error || 'Erreur lors de l\'ajout.' });
    }

    setSubmitting(false);
  };

  const handleDelete = async (docId: string) => {
    if (!confirm('Supprimer ce document ?')) return;

    const result = await deleteDocument(docId);
    if (result.success) {
      setMessage({ type: 'success', text: 'Document supprimé.' });
    } else {
      setMessage({ type: 'error', text: result.error || 'Erreur lors de la suppression.' });
    }
  };

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(new Date(dateString));
  };

  const getCategoryLabel = (category: string) => {
    return category === 'facture' ? 'Facture' : 'Document administratif';
  };

  const getCategoryIcon = (category: string) => {
    return category === 'facture' ? Receipt : FileText;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 text-amber-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* En-tête */}
      <header className="text-center mb-8">
        <h2 className="text-3xl font-bold text-amber-900 mb-2 font-serif">
          Documents
        </h2>
        <p className="text-amber-700">
          Factures et documents administratifs de la restauration
        </p>
      </header>

      {/* Statistiques rapides */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-white rounded-xl border-2 border-amber-200 p-4 text-center shadow-md">
          <Receipt className="h-6 w-6 text-amber-600 mx-auto mb-2" />
          <p className="text-2xl font-bold text-amber-900">{factures.length}</p>
          <p className="text-sm text-amber-700">Facture{factures.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="bg-white rounded-xl border-2 border-amber-200 p-4 text-center shadow-md">
          <FileText className="h-6 w-6 text-amber-600 mx-auto mb-2" />
          <p className="text-2xl font-bold text-amber-900">{docsAdmin.length}</p>
          <p className="text-sm text-amber-700">Doc{docsAdmin.length !== 1 ? 's' : ''} administratif{docsAdmin.length !== 1 ? 's' : ''}</p>
        </div>
      </div>

      {/* Bouton ajout admin */}
      {isAdmin && (
        <div className="mb-6">
          <button
            onClick={() => {
              resetForm();
              setShowForm(true);
            }}
            className="w-full py-3 px-6 bg-gradient-to-r from-amber-400 to-orange-400 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all flex items-center justify-center space-x-2"
          >
            <Plus className="h-5 w-5" />
            <span>Ajouter un document</span>
          </button>
        </div>
      )}

      {/* Formulaire d'ajout/modification */}
      {showForm && (
        <div className="bg-white rounded-xl border-4 border-amber-200 p-6 shadow-lg mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-amber-900">
              {editingDoc ? 'Modifier le document' : 'Nouveau document'}
            </h3>
            <button
              onClick={resetForm}
              className="p-2 text-amber-600 hover:bg-amber-100 rounded-lg transition-all"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-amber-900 mb-1">
                Titre du document
              </label>
              <input
                type="text"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                placeholder="Ex: Facture pièces moteur"
                className="w-full p-3 border-2 border-amber-200 rounded-lg focus:border-amber-400 focus:outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-amber-900 mb-1">
                Catégorie
              </label>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setFormCategory('facture')}
                  className={`flex-1 flex items-center justify-center space-x-2 px-4 py-3 rounded-lg font-medium transition-all ${
                    formCategory === 'facture'
                      ? 'bg-amber-200 text-amber-900 shadow-md'
                      : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                  }`}
                >
                  <Receipt className="h-4 w-4" />
                  <span>Facture</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFormCategory('doc_administratif')}
                  className={`flex-1 flex items-center justify-center space-x-2 px-4 py-3 rounded-lg font-medium transition-all ${
                    formCategory === 'doc_administratif'
                      ? 'bg-amber-200 text-amber-900 shadow-md'
                      : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                  }`}
                >
                  <FileText className="h-4 w-4" />
                  <span>Doc administratif</span>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-amber-900 mb-1">
                Lien Google Drive
              </label>
              <input
                type="url"
                value={formUrl}
                onChange={(e) => setFormUrl(e.target.value)}
                placeholder="https://drive.google.com/..."
                className="w-full p-3 border-2 border-amber-200 rounded-lg focus:border-amber-400 focus:outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-amber-900 mb-1">
                Description (optionnel)
              </label>
              <textarea
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="Description du document..."
                rows={3}
                className="w-full p-3 border-2 border-amber-200 rounded-lg resize-none focus:border-amber-400 focus:outline-none transition-colors"
              />
            </div>

            {/* Message */}
            {message && (
              <div
                className={`p-3 rounded-lg border-2 flex items-center space-x-2 text-sm ${
                  message.type === 'success'
                    ? 'bg-green-50 border-green-200 text-green-800'
                    : 'bg-red-50 border-red-200 text-red-800'
                }`}
              >
                {message.type === 'success' ? (
                  <Check className="h-4 w-4 flex-shrink-0" />
                ) : (
                  <X className="h-4 w-4 flex-shrink-0" />
                )}
                <p>{message.text}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting || !formTitle.trim() || !formUrl.trim()}
              className={`w-full py-3 px-6 rounded-xl font-bold transition-all flex items-center justify-center space-x-2 ${
                submitting || !formTitle.trim() || !formUrl.trim()
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-amber-400 to-orange-400 text-white shadow-lg hover:shadow-xl'
              }`}
            >
              {submitting ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Enregistrement...</span>
                </>
              ) : (
                <>
                  <Check className="h-5 w-5" />
                  <span>{editingDoc ? 'Modifier' : 'Ajouter'}</span>
                </>
              )}
            </button>
          </form>
        </div>
      )}

      {/* Filtres */}
      <div className="flex gap-2 mb-6">
        {[
          { key: 'all' as const, label: 'Tous', count: documents.length },
          { key: 'facture' as const, label: 'Factures', count: factures.length },
          { key: 'doc_administratif' as const, label: 'Docs administratifs', count: docsAdmin.length },
        ].map((filter) => (
          <button
            key={filter.key}
            onClick={() => setActiveCategory(filter.key)}
            className={`px-4 py-2 rounded-lg font-medium transition-all text-sm ${
              activeCategory === filter.key
                ? 'bg-amber-200 text-amber-900 shadow-md'
                : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
            }`}
          >
            {filter.label} ({filter.count})
          </button>
        ))}
      </div>

      {/* Liste des documents */}
      {filteredDocuments.length === 0 ? (
        <div className="bg-white rounded-xl border-2 border-amber-200 p-12 text-center shadow-md">
          <FolderOpen className="h-12 w-12 text-amber-400 mx-auto mb-4" />
          <p className="text-amber-700 font-medium text-lg">Aucun document</p>
          <p className="text-amber-600 text-sm mt-1">
            {isAdmin
              ? 'Ajoutez votre premier document en cliquant sur le bouton ci-dessus.'
              : 'Les documents apparaîtront ici une fois ajoutés par l\'administrateur.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredDocuments.map((doc) => {
            const CategoryIcon = getCategoryIcon(doc.category);
            return (
              <article
                key={doc.id}
                className="bg-white rounded-xl border-2 border-amber-200 shadow-md hover:shadow-lg transition-all overflow-hidden"
              >
                <div className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start space-x-4 flex-1 min-w-0">
                      <div
                        className={`p-2.5 rounded-lg flex-shrink-0 ${
                          doc.category === 'facture'
                            ? 'bg-amber-100'
                            : 'bg-orange-100'
                        }`}
                      >
                        <CategoryIcon
                          className={`h-5 w-5 ${
                            doc.category === 'facture'
                              ? 'text-amber-700'
                              : 'text-orange-700'
                          }`}
                        />
                      </div>

                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-amber-900 text-lg leading-tight">
                          {doc.title}
                        </h3>

                        <div className="flex items-center flex-wrap gap-2 mt-2">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                              doc.category === 'facture'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-orange-100 text-orange-800'
                            }`}
                          >
                            {getCategoryLabel(doc.category)}
                          </span>
                          <span className="flex items-center text-xs text-amber-600">
                            <Calendar className="h-3 w-3 mr-1" />
                            {formatDate(doc.created_at)}
                          </span>
                        </div>

                        {doc.description && (
                          <p className="text-amber-700 text-sm mt-2 leading-relaxed">
                            {doc.description}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-1 flex-shrink-0">
                      <a
                        href={doc.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2.5 bg-amber-100 text-amber-700 hover:bg-amber-200 rounded-lg transition-all"
                        title="Ouvrir le document"
                      >
                        <ExternalLink className="h-5 w-5" />
                      </a>

                      {isAdmin && (
                        <>
                          <button
                            onClick={() => openEditForm(doc)}
                            className="p-2.5 text-amber-600 hover:bg-amber-100 rounded-lg transition-all"
                            title="Modifier"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(doc.id)}
                            className="p-2.5 text-red-600 hover:bg-red-50 rounded-lg transition-all"
                            title="Supprimer"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="h-1 bg-gradient-to-r from-amber-200 via-orange-200 to-amber-200" />
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
