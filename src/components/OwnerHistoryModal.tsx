import React, { useState } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { OwnerHistory } from '../hooks/useOwnerHistory';

interface OwnerHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (owner: Omit<OwnerHistory, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  onUpdate: (id: string, updates: Partial<OwnerHistory>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  owners: OwnerHistory[];
}

export function OwnerHistoryModal({
  isOpen,
  onClose,
  onAdd,
  onUpdate,
  onDelete,
  owners
}: OwnerHistoryModalProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    start_year: '',
    end_year: '',
    owner_name: '',
    owner_location: '',
    description: '',
    is_current: false
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const resetForm = () => {
    setFormData({
      start_year: '',
      end_year: '',
      owner_name: '',
      owner_location: '',
      description: '',
      is_current: false
    });
    setEditingId(null);
  };

  const handleEdit = (owner: OwnerHistory) => {
    setEditingId(owner.id);
    setFormData({
      start_year: owner.start_year.toString(),
      end_year: owner.end_year?.toString() || '',
      owner_name: owner.owner_name,
      owner_location: owner.owner_location || '',
      description: owner.description || '',
      is_current: owner.is_current
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.owner_name.trim() || !formData.start_year) {
      setError('Veuillez remplir les champs obligatoires');
      return;
    }

    try {
      setLoading(true);
      if (editingId) {
        await onUpdate(editingId, {
          start_year: parseInt(formData.start_year),
          end_year: formData.end_year ? parseInt(formData.end_year) : null,
          owner_name: formData.owner_name,
          owner_location: formData.owner_location || null,
          description: formData.description || null,
          is_current: formData.is_current
        });
      } else {
        const maxIndex = owners.length > 0 ? Math.max(...owners.map(o => o.order_index)) : -1;
        await onAdd({
          start_year: parseInt(formData.start_year),
          end_year: formData.end_year ? parseInt(formData.end_year) : null,
          owner_name: formData.owner_name,
          owner_location: formData.owner_location || null,
          description: formData.description || null,
          is_current: formData.is_current,
          order_index: maxIndex + 1
        });
      }
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la sauvegarde');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce propriétaire ?')) {
      try {
        await onDelete(id);
        resetForm();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur lors de la suppression');
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-amber-200 sticky top-0 bg-white">
          <h2 className="text-2xl font-bold text-amber-900">Historique des propriétaires</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-amber-100 rounded-lg transition"
          >
            <X className="h-5 w-5 text-amber-900" />
          </button>
        </div>

        <div className="p-6">
          {error && (
            <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4 text-red-700 mb-4">
              {error}
            </div>
          )}

          {/* Liste des propriétaires */}
          <div className="mb-8 space-y-3">
            {owners.map(owner => (
              <div
                key={owner.id}
                className={`border-2 rounded-lg p-4 ${
                  editingId === owner.id ? 'bg-amber-50 border-amber-400' : 'bg-white border-amber-200'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="font-bold text-amber-900">
                      {owner.start_year} - {owner.end_year || 'Aujourd\'hui'} : {owner.owner_name}
                    </p>
                    {owner.owner_location && (
                      <p className="text-amber-700 text-sm">{owner.owner_location}</p>
                    )}
                    {owner.description && (
                      <p className="text-amber-600 text-sm mt-1">{owner.description}</p>
                    )}
                  </div>
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => handleEdit(owner)}
                      className="px-3 py-1 bg-amber-100 text-amber-700 text-sm rounded hover:bg-amber-200 transition"
                    >
                      Éditer
                    </button>
                    <button
                      onClick={() => handleDelete(owner.id)}
                      className="p-2 text-red-600 hover:bg-red-100 rounded transition"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Formulaire */}
          <div className="border-t border-amber-200 pt-6">
            <h3 className="font-bold text-amber-900 mb-4">
              {editingId ? 'Modifier' : 'Ajouter'} un propriétaire
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-amber-900 font-medium mb-2">
                    Année de début *
                  </label>
                  <input
                    type="number"
                    name="start_year"
                    value={formData.start_year}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border-2 border-amber-200 rounded-lg focus:border-amber-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-amber-900 font-medium mb-2">
                    Année de fin
                  </label>
                  <input
                    type="number"
                    name="end_year"
                    value={formData.end_year}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border-2 border-amber-200 rounded-lg focus:border-amber-400 focus:outline-none"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-amber-900 font-medium mb-2">
                    Nom du propriétaire *
                  </label>
                  <input
                    type="text"
                    name="owner_name"
                    value={formData.owner_name}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border-2 border-amber-200 rounded-lg focus:border-amber-400 focus:outline-none"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-amber-900 font-medium mb-2">
                    Lieu / Localisation
                  </label>
                  <input
                    type="text"
                    name="owner_location"
                    value={formData.owner_location}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border-2 border-amber-200 rounded-lg focus:border-amber-400 focus:outline-none"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-amber-900 font-medium mb-2">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={3}
                    className="w-full px-4 py-2 border-2 border-amber-200 rounded-lg focus:border-amber-400 focus:outline-none"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="is_current"
                    name="is_current"
                    checked={formData.is_current}
                    onChange={handleChange}
                    className="w-4 h-4 border-amber-200 rounded"
                  />
                  <label htmlFor="is_current" className="text-amber-900">
                    Propriétaire actuel
                  </label>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-2 bg-amber-600 text-white py-2 px-4 rounded-lg font-bold hover:bg-amber-700 transition disabled:opacity-50"
                >
                  {editingId ? 'Mettre à jour' : <><Plus className="h-4 w-4" /> Ajouter</>}
                </button>
                {editingId && (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="bg-gray-300 text-gray-700 py-2 px-4 rounded-lg font-bold hover:bg-gray-400 transition"
                  >
                    Annuler
                  </button>
                )}
              </div>
            </form>
          </div>

          <div className="flex gap-4 pt-6 border-t border-amber-200 mt-6">
            <button
              onClick={onClose}
              className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg font-bold hover:bg-gray-400 transition"
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
