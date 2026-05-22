import React from 'react';
import { Publication } from '../lib/supabase';
import { LikeButton } from './LikeButton';
import { Calendar, MessageSquare, CreditCard as Edit, Trash2 } from 'lucide-react';

interface PublicationCardProps {
  publication: Publication;
  isAdmin?: boolean;
  onEdit?: (publication: Publication) => void;
  onDelete?: (publicationId: string) => void;
}

export function PublicationCard({ publication, isAdmin, onEdit, onDelete }: PublicationCardProps) {
  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(dateString));
  };

  return (
    <article className="bg-white rounded-xl shadow-lg overflow-hidden border-4 border-amber-200 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
      {/* En-tête avec date */}
      <header className="bg-gradient-to-r from-amber-100 to-orange-100 px-6 py-4 border-b-2 border-amber-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-amber-800">
          <Calendar className="h-4 w-4" />
          <time className="font-medium text-sm">
            {formatDate(publication.created_at)}
          </time>
        </div>
          
          <div className="flex items-center space-x-2">
            {/* Bouton J'aime - toujours visible */}
            <LikeButton publicationId={publication.id} />
            
            {/* Boutons admin - seulement si admin */}
            {isAdmin && (
              <>
              <button
                onClick={() => onEdit?.(publication)}
                className="p-2 text-amber-600 hover:text-amber-800 hover:bg-amber-200 rounded-lg transition-all"
                title="Modifier"
              >
                <Edit className="h-4 w-4" />
              </button>
              <button
                onClick={() => onDelete?.(publication.id)}
                className="p-2 text-red-600 hover:text-red-800 hover:bg-red-100 rounded-lg transition-all"
                title="Supprimer"
              >
                <Trash2 className="h-4 w-4" />
              </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Média */}
      <div className="relative bg-amber-50 p-4">
        <div className="border-4 border-amber-200 rounded-lg overflow-hidden shadow-md bg-white">
          {publication.media_type === 'image' ? (
            <img
              src={publication.media_url}
              alt="Étape de restauration"
              className="w-full h-auto object-cover max-h-96"
            />
          ) : publication.media_type === 'youtube' ? (
            <div className="w-full aspect-video bg-black">
              <iframe
                width="100%"
                height="100%"
                src={`https://www.youtube.com/embed/${publication.media_url}`}
                title="Vidéo YouTube"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full"
              />
            </div>
          ) : (
            <video
              src={publication.media_url}
              controls
              className="w-full h-auto max-h-96"
              preload="metadata"
            >
              Votre navigateur ne supporte pas les vidéos.
            </video>
          )}
        </div>
      </div>

      {/* Commentaire */}
      <div className="px-6 py-5">
        <div className="flex items-start space-x-3">
          <MessageSquare className="h-5 w-5 text-amber-600 mt-1 flex-shrink-0" />
          <p className="text-amber-900 font-medium leading-relaxed">
            {publication.commentaire}
          </p>
        </div>
      </div>

      {/* Effet décoratif vintage */}
      <div className="h-2 bg-gradient-to-r from-amber-200 via-orange-200 to-amber-200"></div>
    </article>
  );
}
