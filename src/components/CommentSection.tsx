import React, { useState } from 'react';
import { MessageCircle, Send, Trash2, CreditCard as Edit, Check, X } from 'lucide-react';
import { useComments } from '../hooks/useComments';
import { useAuth } from '../hooks/useAuth';
import type { Comment } from '../lib/supabase';

interface CommentSectionProps {
  publicationId: string;
}

export default function CommentSection({ publicationId }: CommentSectionProps) {
  const { comments, loading, addComment, updateComment, deleteComment } = useComments(publicationId);
  const { profile } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [editingComment, setEditingComment] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [formData, setFormData] = useState({
    author_name: '',
    content: ''
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.author_name.trim() || !formData.content.trim()) return;

    setSubmitting(true);
    try {
      await addComment(
        formData.author_name.trim(),
        '',
        formData.content.trim()
      );
      setFormData({ author_name: '', content: '' });
      setShowForm(false);
    } catch (error) {
      console.error('Erreur lors de l\'ajout du commentaire:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (comment: Comment) => {
    setEditingComment(comment.id);
    setEditContent(comment.content);
  };

  const handleSaveEdit = async () => {
    if (!editContent.trim() || !editingComment) return;

    try {
      await updateComment(editingComment, editContent.trim());
      setEditingComment(null);
      setEditContent('');
    } catch (error) {
      console.error('Erreur lors de la modification:', error);
    }
  };

  const handleCancelEdit = () => {
    setEditingComment(null);
    setEditContent('');
  };
  const handleDelete = async (commentId: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce commentaire ?')) {
      await deleteComment(commentId);
    }
  };

  const getAvatarColor = (name: string) => {
    const colors = [
      'bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500',
      'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-teal-500'
    ];
    const index = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[index % colors.length];
  };

  // Fonction pour vérifier si l'utilisateur peut modifier un commentaire
  const canEditComment = () => {
    // Les admins peuvent modifier tous les commentaires
    if (profile?.is_admin) return true;
    
    // Les utilisateurs peuvent modifier leurs propres commentaires (basé sur le nom pour les visiteurs)
    // Dans un vrai système, on utiliserait l'ID utilisateur
    return false; // Pour l'instant, seuls les admins peuvent modifier
  };
  if (loading) {
    return (
      <div className="mt-4 p-3 bg-amber-50 rounded border">
        <div className="animate-pulse text-sm text-amber-600">Chargement des commentaires...</div>
      </div>
    );
  }

  return (
    <div className="mt-4">
      {/* En-tête avec compteur et bouton d'ajout */}
      {comments.length > 0 && (
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-medium text-amber-800 flex items-center gap-1">
            <MessageCircle className="h-3 w-3" />
            {comments.length} commentaire{comments.length > 1 ? 's' : ''}
          </h4>
        </div>
      )}

      {/* Liste des commentaires */}
      {comments.length > 0 && (
        <div className="space-y-2 mb-3">
          {comments.map((comment) => (
            <div key={comment.id} className="bg-amber-50 p-3 rounded border border-amber-200">
              <div className="flex items-start gap-2">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-medium ${getAvatarColor(comment.author_name)}`}>
                  {comment.author_name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-amber-800">{comment.author_name}</span>
                      <span className="text-xs text-amber-600">
                        {new Date(comment.created_at).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                    {profile?.is_admin && (
                      <div className="flex gap-1">
                        {canEditComment() && editingComment !== comment.id && (
                          <button
                            onClick={() => handleEdit(comment)}
                            className="text-amber-500 hover:text-amber-700 p-1"
                            title="Modifier le commentaire"
                          >
                            <Edit className="h-3 w-3" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(comment.id)}
                          className="text-red-500 hover:text-red-700 p-1"
                          title="Supprimer le commentaire"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    )}
                  </div>
                  
                  {editingComment === comment.id ? (
                    <div className="mt-1">
                      <textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        className="w-full px-2 py-1 text-xs border border-amber-300 rounded focus:outline-none focus:ring-1 focus:ring-amber-500 resize-none"
                        rows={2}
                      />
                      <div className="flex justify-end gap-1 mt-1">
                        <button
                          onClick={handleCancelEdit}
                          className="p-1 text-gray-500 hover:text-gray-700"
                          title="Annuler"
                        >
                          <X className="h-3 w-3" />
                        </button>
                        <button
                          onClick={handleSaveEdit}
                          className="p-1 text-green-500 hover:text-green-700"
                          title="Sauvegarder"
                          disabled={!editContent.trim()}
                        >
                          <Check className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  ) : (
                  <p className="text-xs text-amber-700 mt-1 leading-relaxed">{comment.content}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Bouton d'ajout de commentaire */}
      {!showForm && (
        <button
          onClick={() => setShowForm(true)}
          className="text-xs text-amber-600 hover:text-amber-800 underline"
        >
          Ajouter un commentaire
        </button>
      )}

      {/* Formulaire d'ajout */}
      {showForm && (
        <form onSubmit={handleSubmit} className="mt-3 p-3 bg-amber-50 rounded border border-amber-200">
          <div className="space-y-2">
            <input
              type="text"
              placeholder="Votre nom"
              value={formData.author_name}
              onChange={(e) => setFormData({ ...formData, author_name: e.target.value })}
              className="w-full px-2 py-1 text-xs border border-amber-300 rounded focus:outline-none focus:ring-1 focus:ring-amber-500"
              required
            />
            <textarea
              placeholder="Votre commentaire..."
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              className="w-full px-2 py-1 text-xs border border-amber-300 rounded focus:outline-none focus:ring-1 focus:ring-amber-500 resize-none"
              rows={2}
              required
            />
          </div>
          <div className="flex justify-end gap-2 mt-2">
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setFormData({ author_name: '', content: '' });
              }}
              className="px-2 py-1 text-xs text-amber-600 hover:text-amber-800"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={submitting || !formData.author_name.trim() || !formData.content.trim()}
              className="px-2 py-1 text-xs bg-amber-600 text-white rounded hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
            >
              {submitting ? (
                <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Send className="h-3 w-3" />
              )}
              {submitting ? 'Envoi...' : 'Envoyer'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
