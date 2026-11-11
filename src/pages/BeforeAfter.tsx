import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useBeforeAfter } from '../hooks/useBeforeAfter';
import type { BeforeAfter } from '../lib/supabase';
import {
  Loader2,
  Trash2,
  ImageOff,
} from 'lucide-react';

export function BeforeAfter() {
  const { profile } = useAuth();
  const { items, loading, deleteItem } = useBeforeAfter();
  const [deleting, setDeleting] = useState<string | null>(null);

  const isAdmin = profile?.is_admin === true;

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer ce couple avant/après ?')) return;
    setDeleting(id);
    await deleteItem(id);
    setDeleting(null);
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
      <header className="text-center mb-10">
        <h2 className="text-3xl font-bold text-amber-900 mb-2 font-serif">
          Avant / Après
        </h2>
        <p className="text-amber-700">
          La transformation de la Lambretta, étape par étape
        </p>
      </header>

      {items.length === 0 ? (
        <div className="bg-white rounded-xl border-2 border-amber-200 p-12 text-center shadow-md">
          <ImageOff className="h-12 w-12 text-amber-400 mx-auto mb-4" />
          <p className="text-amber-700 font-medium text-lg">Aucun avant/après</p>
          <p className="text-amber-600 text-sm mt-1">
            Les photos apparaîtront ici une fois ajoutées par l'administrateur.
          </p>
        </div>
      ) : (
        <div className="space-y-10">
          {items.map((item) => (
            <article
              key={item.id}
              className="bg-white rounded-2xl border-2 border-amber-200 shadow-lg overflow-hidden"
            >
              {/* Titre */}
              <div className="px-6 pt-5 pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-amber-900 font-serif">
                      {item.title}
                    </h3>
                    {item.description && (
                      <p className="text-amber-700 text-sm mt-1 leading-relaxed">
                        {item.description}
                      </p>
                    )}
                  </div>

                  {isAdmin && (
                    <div className="flex items-center space-x-1 flex-shrink-0 ml-4">
                      <button
                        onClick={() => handleDelete(item.id)}
                        disabled={deleting === item.id}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all"
                        title="Supprimer"
                      >
                        {deleting === item.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Comparaison avant/après */}
              <div className="px-4 pb-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* Avant */}
                  <div className="relative group">
                    <div className="absolute top-3 left-3 z-10 bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-md uppercase tracking-wide">
                      Avant
                    </div>
                    <div className="border-2 border-red-200 rounded-xl overflow-hidden bg-red-50">
                      <img
                        loading="lazy"
                        decoding="async"
                        src={item.before_url}
                        alt={`${item.title} - Avant`}
                        className="w-full h-64 md:h-80 object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>
                  </div>

                  {/* Après */}
                  <div className="relative group">
                    <div className="absolute top-3 left-3 z-10 bg-emerald-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-md uppercase tracking-wide">
                      Après
                    </div>
                    <div className="border-2 border-emerald-200 rounded-xl overflow-hidden bg-emerald-50">
                      <img
                        loading="lazy"
                        decoding="async"
                        src={item.after_url}
                        alt={`${item.title} - Après`}
                        className="w-full h-64 md:h-80 object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>
                  </div>
                </div>

                {/* Flèche centrale (visible sur md+) */}
                <div className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none" style={{ marginTop: '-0.5rem' }}>
                </div>
              </div>

              {/* Barre décorative */}
              <div className="h-1.5 bg-gradient-to-r from-red-300 via-amber-300 to-emerald-300" />
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
