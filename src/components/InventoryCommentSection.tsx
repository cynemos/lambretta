import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useInventoryComments } from '../hooks/useInventoryComments';
import { MessageCircle, Send, Trash2, User } from 'lucide-react';

interface InventoryCommentSectionProps {
  partId: string;
  partName: string;
}

export function InventoryCommentSection({ partId, partName }: InventoryCommentSectionProps) {
  const { user } = useAuth();
  const { comments, loading, addComment, deleteComment } = useInventoryComments(partId);
  const [showForm, setShowForm] = useState(false);
  const [authorName, setAuthorName] = useState(() => {
    return localStorage.getItem('inventory_comment_author_name') || '';
  });
  const [authorEmail, setAuthorEmail] = useState(() => {
    return localStorage.getItem('inventory_comment_author_email') || '';
  });
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!authorName.trim() || !content.trim()) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }

    setSubmitting(true);

    localStorage.setItem('inventory_comment_author_name', authorName);
    if (authorEmail) {
      localStorage.setItem('inventory_comment_author_email', authorEmail);
    }

    const success = await addComment(authorName, content, authorEmail);

    if (success) {
      setContent('');
      setShowForm(false);
    } else {
      alert('Erreur lors de l\'ajout du commentaire');
    }

    setSubmitting(false);
  };

  const handleDelete = async (commentId: string) => {
    if (!confirm('Supprimer ce commentaire ?')) return;
    await deleteComment(commentId);
  };

  if (loading) {
    return (
      <div className="text-center py-4">
        <p className="text-gray-500">Chargement des commentaires...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
          <MessageCircle className="h-5 w-5 text-amber-600" />
          <span>Commentaires ({comments.length})</span>
        </h4>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="text-sm text-amber-600 hover:text-amber-700 font-medium"
          >
            Ajouter un commentaire
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-amber-50 p-4 rounded-lg space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Votre nom *
              </label>
              <input
                type="text"
                required
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                placeholder="Ex: Papa"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email (optionnel)
              </label>
              <input
                type="email"
                value={authorEmail}
                onChange={(e) => setAuthorEmail(e.target.value)}
                placeholder="votre@email.com"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Votre commentaire *
            </label>
            <textarea
              required
              rows={3}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={`Commentaire sur ${partName}...`}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            />
          </div>

          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setContent('');
              }}
              disabled={submitting}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors flex items-center space-x-2 disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
              <span>{submitting ? 'Envoi...' : 'Envoyer'}</span>
            </button>
          </div>
        </form>
      )}

      <div className="space-y-3">
        {comments.length === 0 ? (
          <p className="text-center text-gray-500 py-4 text-sm">
            Aucun commentaire pour le moment
          </p>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <div className="bg-amber-100 p-1 rounded-full">
                      <User className="h-4 w-4 text-amber-600" />
                    </div>
                    <span className="font-semibold text-gray-900">{comment.author_name}</span>
                    <span className="text-xs text-gray-500">
                      {new Date(comment.created_at).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <p className="text-gray-700 whitespace-pre-wrap">{comment.content}</p>
                </div>

                {user && (
                  <button
                    onClick={() => handleDelete(comment.id)}
                    className="ml-2 p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                    title="Supprimer"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
