import React from 'react';
import { useState, useMemo } from 'react';
import { usePublications } from '../hooks/usePublications';
import { useAuth } from '../hooks/useAuth';
import { useAllComments } from '../hooks/useComments';
import { useLikesSummary } from '../hooks/useLikes';
import { PublicationCard } from '../components/PublicationCard';
import { TimelineFilters } from '../components/TimelineFilters';
import { EditPublicationModal } from '../components/EditPublicationModal';
import CommentSection from '../components/CommentSection';
import { Camera, Loader2, Search } from 'lucide-react';
import { Publication } from '../lib/supabase';

export function Timeline() {
  const { isAdmin } = useAuth();
  const { publications, loading, error, updatePublication, deletePublication } = usePublications();
  // Commentaires et « j'aime » de toutes les publications : 2 requêtes au lieu de 2 par publication
  const comments = useAllComments();
  const likes = useLikesSummary();
  const [editingPublication, setEditingPublication] = React.useState<Publication | null>(null);
  const [deleteConfirm, setDeleteConfirm] = React.useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Date locale « AAAA-MM-JJ » (toISOString donnerait la date UTC, décalée d'un jour le soir)
  const toLocalDay = (iso: string) => {
    const d = new Date(iso);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  // Filtrer les publications
  const filteredPublications = useMemo(() => {
    let filtered = [...publications];

    // Filtrage par mots-clés
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(pub => 
        pub.commentaire.toLowerCase().includes(searchLower)
      );
    }

    // Filtrage par date de début
    if (dateFrom) {
      filtered = filtered.filter(pub => 
        toLocalDay(pub.created_at) >= dateFrom
      );
    }

    // Filtrage par date de fin
    if (dateTo) {
      filtered = filtered.filter(pub => 
        toLocalDay(pub.created_at) <= dateTo
      );
    }

    return filtered;
  }, [publications, searchTerm, dateFrom, dateTo]);

  const handleClearFilters = () => {
    setSearchTerm('');
    setDateFrom('');
    setDateTo('');
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <Loader2 className="h-8 w-8 text-amber-600 animate-spin mb-4" />
        <p className="text-amber-700 font-medium">
          Chargement des publications...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border-2 border-red-200 rounded-lg p-6 text-center">
        <p className="text-red-700 font-medium">
          Erreur lors du chargement : {error}
        </p>
      </div>
    );
  }

  const handleEdit = (publication: Publication) => {
    setEditingPublication(publication);
  };

  const handleSaveEdit = async (commentaire: string, file?: File) => {
    if (!editingPublication) return { success: false };
    
    const result = await updatePublication(editingPublication.id, commentaire, file);
    return result;
  };

  const handleDelete = (publicationId: string) => {
    setDeleteConfirm(publicationId);
  };

  const confirmDelete = async () => {
    if (!deleteConfirm) return;
    await deletePublication(deleteConfirm);
    setDeleteConfirm(null);
  };

  if (publications.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="bg-amber-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
          <Camera className="h-10 w-10 text-amber-600" />
        </div>
        <h2 className="text-2xl font-bold text-amber-900 mb-4 font-serif">
          Aucune publication pour le moment
        </h2>
        <p className="text-amber-700 max-w-md mx-auto">
          La restauration de la Lambretta LD125 n'a pas encore commencé. 
          Revenez bientôt pour suivre l'évolution !
        </p>
      </div>
    );
  }

  const hasActiveFilters = searchTerm || dateFrom || dateTo;
  const displayPublications = hasActiveFilters ? filteredPublications : publications;

  return (
    <>
      {/* En-tête */}
      <header className="mb-10 sm:mb-12">
        <h2 className="text-3xl sm:text-4xl font-bold text-amber-900 mb-6 font-serif text-center">
          Carnet de restauration
        </h2>
        {/* Lettre d'introduction */}
        <div className="max-w-2xl mx-auto bg-white/70 border-2 border-amber-200 rounded-xl shadow-sm px-5 py-6 sm:px-8 sm:py-8 text-amber-800 sm:text-lg leading-relaxed font-serif">
          <p className="font-bold text-amber-900 mb-3">Papa,</p>
          <div className="space-y-3">
            <p>Aujourd’hui, je commence un petit voyage avec toi… un voyage dans le temps, jusqu’à ces années où ton Lambretta LD125 t’emmenait partout et faisait briller tes yeux de jeunesse.</p>
            <p>Chaque étape de cette restauration n’est pas seulement un travail mécanique : c’est une manière de te faire revivre ces souvenirs, de te faire sentir chaque détail, chaque avancée, même à distance.</p>
            <p>À travers ce carnet, tu pourras suivre chaque moment, chaque photo, chaque vidéo… et partager avec moi cette passion et cette nostalgie.</p>
            <p>J’espère que, page après page, tu retrouveras un peu de cette magie et de cette liberté que ce scooter t’a offerte il y a tant d’années.</p>
          </div>
          <p className="mt-5 text-right italic">
            Avec tout mon amour,<br />
            <span className="font-bold not-italic text-amber-900">Cyril</span>
          </p>
        </div>
        <div className="w-24 h-1 bg-amber-300 mx-auto mt-8 rounded-full"></div>
      </header>

      {/* Filtres de recherche */}
      <TimelineFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        dateFrom={dateFrom}
        onDateFromChange={setDateFrom}
        dateTo={dateTo}
        onDateToChange={setDateTo}
        onClearFilters={handleClearFilters}
        resultsCount={filteredPublications.length}
        totalCount={publications.length}
      />

      {/* Message si aucun résultat */}
      {hasActiveFilters && filteredPublications.length === 0 && (
        <div className="text-center py-12 bg-amber-50 rounded-xl border-2 border-amber-200 mb-8">
          <div className="bg-amber-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <Search className="h-8 w-8 text-amber-600" />
          </div>
          <h3 className="text-xl font-bold text-amber-900 mb-2">
            Aucune étape trouvée
          </h3>
          <p className="text-amber-700 mb-4">
            Aucune publication ne correspond à vos critères de recherche.
          </p>
          <button
            onClick={handleClearFilters}
            className="text-amber-600 hover:text-amber-800 underline font-medium"
          >
            Effacer les filtres
          </button>
        </div>
      )}

      {/* Liste des publications */}
      {displayPublications.length > 0 && (
        <div className="space-y-8">
          {[...displayPublications]
          .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
          .map((publication) => (
            <div key={publication.id}>
              <PublicationCard 
                publication={publication}
                isAdmin={isAdmin}
                onEdit={handleEdit}
                onDelete={handleDelete}
                likesCount={likes.likeFor(publication.id).count}
                isLiked={likes.likeFor(publication.id).liked}
                likeBusy={likes.busy === publication.id}
                onToggleLike={() => likes.toggleLike(publication.id)}
              />
              <p className="text-amber-500 text-sm mt-1">
                {new Date(publication.created_at).toLocaleDateString('fr-FR', {
                  weekday: 'short',
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                })}
              </p>

              {/* 🔹 Affichage de la section des commentaires */}
              <CommentSection
                comments={comments.commentsFor(publication.id)}
                loading={comments.loading}
                onAdd={(name, content) => comments.addComment(publication.id, name, content)}
                onUpdate={comments.updateComment}
                onDelete={comments.deleteComment}
              />
            </div>
          ))}
        </div>
      )}

      {/* Statistiques */}
      {displayPublications.length > 0 && (
        <div className="mt-16 bg-amber-100 rounded-xl p-6 text-center border-2 border-amber-200">
          <h3 className="text-xl font-bold text-amber-900 mb-2 font-serif">
            Progression de la restauration
          </h3>
          <p className="text-amber-700">
            {hasActiveFilters ? (
              <>
                <span className="font-bold text-2xl">{filteredPublications.length}</span> étape{filteredPublications.length > 1 ? 's' : ''} 
                {filteredPublications.length !== publications.length && (
                  <span className="text-sm"> (sur {publications.length} au total)</span>
                )}
              </>
            ) : (
              <>
                <span className="font-bold text-2xl">{publications.length}</span> étape{publications.length > 1 ? 's' : ''} documentée{publications.length > 1 ? 's' : ''}
              </>
            )}
          </p>
        </div>
      )}

      {/* Modal d'édition */}
      <EditPublicationModal
        publication={editingPublication!}
        isOpen={!!editingPublication}
        onClose={() => setEditingPublication(null)}
        onSave={handleSaveEdit}
      />

      {/* Modal de confirmation de suppression */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl border-4 border-red-200 shadow-2xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-red-900 mb-4">
              Confirmer la suppression
            </h3>
            <p className="text-red-700 mb-6">
              Êtes-vous sûr de vouloir supprimer cette publication ? Cette action est irréversible.
            </p>
            <div className="flex space-x-4">
              <button
                onClick={confirmDelete}
                className="flex-1 bg-red-500 text-white py-2 px-4 rounded-lg font-bold hover:bg-red-600 transition-colors"
              >
                Supprimer
              </button>
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg font-bold hover:bg-gray-400 transition-colors"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
