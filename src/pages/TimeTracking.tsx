import React, { useState } from 'react';
import { useTimeTracking } from '../hooks/useTimeTracking';
import { useAuth } from '../hooks/useAuth';
import { TimeEntryModal } from '../components/TimeEntryModal';
import { Clock, Plus, CreditCard as Edit, Trash2, Calendar, BarChart3, Loader2, Filter, Search } from 'lucide-react';
import { TimeEntry } from '../lib/supabase';

export function TimeTracking() {
  const { user } = useAuth();
  const { timeEntries, loading, error, addTimeEntry, updateTimeEntry, deleteTimeEntry, statistics } = useTimeTracking();
  const [editingEntry, setEditingEntry] = useState<TimeEntry | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const categories = [...new Set(timeEntries.map(e => e.category))].sort();
  
  const filteredEntries = timeEntries.filter(entry => {
    const matchesCategory = !filterCategory || entry.category === filterCategory;
    const matchesSearch = !searchTerm || 
      entry.task_description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.notes?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesCategory && matchesSearch;
  });

  const handleAdd = () => {
    setEditingEntry(null);
    setShowModal(true);
  };

  const handleEdit = (entry: TimeEntry) => {
    setEditingEntry(entry);
    setShowModal(true);
  };

  const handleSave = async (entryData: any) => {
    if (!user) return { success: false, error: 'Non authentifié' };

    const dataWithUser = { ...entryData, user_id: user.id };
    
    if (editingEntry) {
      return await updateTimeEntry(editingEntry.id, dataWithUser);
    } else {
      return await addTimeEntry(dataWithUser);
    }
  };

  const handleDelete = (entryId: string) => {
    setDeleteConfirm(entryId);
  };

  const confirmDelete = async () => {
    if (!deleteConfirm) return;
    
    await deleteTimeEntry(deleteConfirm);
    setDeleteConfirm(null);
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h${mins > 0 ? ` ${mins}min` : ''}`;
    }
    return `${mins}min`;
  };

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(new Date(dateString));
  };

  const formatTime = (timeString?: string) => {
    if (!timeString) return '';
    return timeString.substring(0, 5); // HH:MM
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <Loader2 className="h-8 w-8 text-amber-600 animate-spin mb-4" />
        <p className="text-amber-700 font-medium">
          Chargement des sessions...
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

  return (
    <>
      {/* En-tête */}
      <header className="text-center mb-8">
        <h2 className="text-3xl font-bold text-amber-900 mb-4 font-serif">
          Suivi du Temps de Restauration
        </h2>
        <p className="text-amber-700">
          Enregistrement et analyse du temps passé sur la restauration
        </p>
      </header>

      {/* Statistiques globales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-gradient-to-r from-blue-100 to-cyan-100 rounded-xl p-6 border-2 border-blue-200">
          <div className="flex items-center space-x-3">
            <Clock className="h-8 w-8 text-blue-600" />
            <div>
              <p className="text-2xl font-bold text-blue-900">
                {statistics.totalHours}h{statistics.remainingMinutes > 0 && ` ${statistics.remainingMinutes}min`}
              </p>
              <p className="text-blue-700 text-sm">Temps total</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-100 to-emerald-100 rounded-xl p-6 border-2 border-green-200">
          <div className="flex items-center space-x-3">
            <Calendar className="h-8 w-8 text-green-600" />
            <div>
              <p className="text-2xl font-bold text-green-900">{statistics.totalSessions}</p>
              <p className="text-green-700 text-sm">Sessions</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-orange-100 to-red-100 rounded-xl p-6 border-2 border-orange-200">
          <div className="flex items-center space-x-3">
            <BarChart3 className="h-8 w-8 text-orange-600" />
            <div>
              <p className="text-2xl font-bold text-orange-900">
                {formatDuration(Math.round(statistics.averageSessionMinutes))}
              </p>
              <p className="text-orange-700 text-sm">Moyenne/session</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-100 to-pink-100 rounded-xl p-6 border-2 border-purple-200">
          <div className="flex items-center space-x-3">
            <Clock className="h-8 w-8 text-purple-600" />
            <div>
              <p className="text-2xl font-bold text-purple-900">
                {statistics.totalMinutes > 0 ? Math.round((statistics.totalMinutes / 60) / 30 * 100) / 100 : 0}
              </p>
              <p className="text-purple-700 text-sm">Semaines équiv.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Statistiques par catégorie */}
      {Object.keys(statistics.byCategory).length > 0 && (
        <div className="bg-white rounded-xl border-4 border-amber-200 p-6 mb-8 shadow-lg">
          <h3 className="text-xl font-bold text-amber-900 mb-4 flex items-center space-x-2">
            <BarChart3 className="h-5 w-5" />
            <span>Répartition par catégorie</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(statistics.byCategory).map(([category, stats]) => (
              <div key={category} className="bg-amber-50 rounded-lg p-4 border-2 border-amber-200">
                <h4 className="font-semibold text-amber-900">{category}</h4>
                <p className="text-amber-700 text-sm">{stats.count} session{stats.count > 1 ? 's' : ''}</p>
                <p className="text-amber-800 font-medium">{formatDuration(stats.minutes)}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Contrôles */}
      <div className="bg-white rounded-xl border-4 border-amber-200 p-6 mb-6 shadow-lg">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          {/* Recherche et filtres */}
          <div className="flex flex-col md:flex-row gap-4 flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-amber-600" />
              <input
                type="text"
                placeholder="Rechercher une session..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border-2 border-amber-200 rounded-lg focus:border-amber-400 focus:outline-none"
              />
            </div>

            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-4 py-2 border-2 border-amber-200 rounded-lg focus:border-amber-400 focus:outline-none"
            >
              <option value="">Toutes les catégories</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Bouton d'ajout */}
          {user && (
            <button
              onClick={handleAdd}
              className="bg-gradient-to-r from-amber-400 to-orange-400 text-white px-6 py-2 rounded-lg font-bold shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all flex items-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              <span>Ajouter une session</span>
            </button>
          )}
          
          {!user && (
            <div className="text-amber-700 text-sm italic">
              Mode lecture seule - Connectez-vous pour ajouter des sessions
            </div>
          )}
        </div>
      </div>

      {/* Liste des sessions */}
      {filteredEntries.length === 0 ? (
        <div className="text-center py-16">
          <Clock className="h-16 w-16 text-amber-300 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-amber-900 mb-2">
            {timeEntries.length === 0 ? 'Aucune session enregistrée' : 'Aucune session trouvée'}
          </h3>
          <p className="text-amber-700">
            {timeEntries.length === 0 
              ? 'Commencez par enregistrer votre première session de travail.'
              : 'Essayez de modifier vos critères de recherche.'
            }
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredEntries.map((entry) => (
            <div key={entry.id} className="bg-white rounded-xl border-4 border-amber-200 p-6 shadow-lg hover:shadow-xl transition-all">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-amber-400 rounded-full"></div>
                  <h3 className="text-lg font-bold text-amber-900">{entry.task_description}</h3>
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                    {entry.category}
                  </span>
                </div>

                {user && (
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleEdit(entry)}
                      className="p-2 text-amber-600 hover:text-amber-800 hover:bg-amber-100 rounded-lg transition-all"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(entry.id)}
                      className="p-2 text-red-600 hover:text-red-800 hover:bg-red-100 rounded-lg transition-all"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm mb-4">
                <div>
                  <p className="text-amber-600 font-medium">Date</p>
                  <p className="text-amber-900">{formatDate(entry.date)}</p>
                </div>
                <div>
                  <p className="text-amber-600 font-medium">Horaires</p>
                  <p className="text-amber-900">
                    {entry.start_time && entry.end_time 
                      ? `${formatTime(entry.start_time)} - ${formatTime(entry.end_time)}`
                      : 'Non spécifiés'
                    }
                  </p>
                </div>
                <div>
                  <p className="text-amber-600 font-medium">Durée</p>
                  <p className="text-amber-900 font-bold">{formatDuration(entry.duration_minutes)}</p>
                </div>
                <div>
                  <p className="text-amber-600 font-medium">Ajouté le</p>
                  <p className="text-amber-900">{new Date(entry.created_at).toLocaleDateString('fr-FR')}</p>
                </div>
              </div>

              {entry.notes && (
                <div className="bg-amber-50 rounded-lg p-3 border-2 border-amber-200">
                  <p className="text-amber-600 font-medium text-sm mb-1">Notes</p>
                  <p className="text-amber-900 text-sm">{entry.notes}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal d'ajout/édition */}
      <TimeEntryModal
        timeEntry={editingEntry}
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSave={handleSave}
      />

      {/* Modal de confirmation de suppression */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl border-4 border-red-200 shadow-2xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-red-900 mb-4">
              Confirmer la suppression
            </h3>
            <p className="text-red-700 mb-6">
              Êtes-vous sûr de vouloir supprimer cette session ? Cette action est irréversible.
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
