import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { VehicleInfo } from '../hooks/useVehicleInfo';

interface VehicleInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (info: Partial<VehicleInfo>) => Promise<void>;
  initialData?: VehicleInfo | null;
}

export function VehicleInfoModal({ isOpen, onClose, onSave, initialData }: VehicleInfoModalProps) {
  const [formData, setFormData] = useState({
    engine_serial_number: '',
    chassis_number: '',
    registration: '',
    manufacturing_year: '',
    manufacturing_location: '',
    current_state: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialData) {
      setFormData({
        engine_serial_number: initialData.engine_serial_number || '',
        chassis_number: initialData.chassis_number || '',
        registration: initialData.registration || '',
        manufacturing_year: initialData.manufacturing_year?.toString() || '',
        manufacturing_location: initialData.manufacturing_location || '',
        current_state: initialData.current_state || ''
      });
    }
  }, [initialData, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      setLoading(true);
      await onSave({
        engine_serial_number: formData.engine_serial_number || null,
        chassis_number: formData.chassis_number || null,
        registration: formData.registration || null,
        manufacturing_year: formData.manufacturing_year ? parseInt(formData.manufacturing_year) : null,
        manufacturing_location: formData.manufacturing_location || null,
        current_state: formData.current_state || null
      } as Partial<VehicleInfo>);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la sauvegarde');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-amber-200 sticky top-0 bg-white">
          <h2 className="text-2xl font-bold text-amber-900">Informations du véhicule</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-amber-100 rounded-lg transition"
          >
            <X className="h-5 w-5 text-amber-900" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4 text-red-700">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-amber-900 font-medium mb-2">
                Numéro de série moteur
              </label>
              <input
                type="text"
                name="engine_serial_number"
                value={formData.engine_serial_number}
                onChange={handleChange}
                className="w-full px-4 py-2 border-2 border-amber-200 rounded-lg focus:border-amber-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-amber-900 font-medium mb-2">
                Numéro de châssis
              </label>
              <input
                type="text"
                name="chassis_number"
                value={formData.chassis_number}
                onChange={handleChange}
                className="w-full px-4 py-2 border-2 border-amber-200 rounded-lg focus:border-amber-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-amber-900 font-medium mb-2">
                Immatriculation
              </label>
              <input
                type="text"
                name="registration"
                value={formData.registration}
                onChange={handleChange}
                className="w-full px-4 py-2 border-2 border-amber-200 rounded-lg focus:border-amber-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-amber-900 font-medium mb-2">
                Année de fabrication
              </label>
              <input
                type="number"
                name="manufacturing_year"
                value={formData.manufacturing_year}
                onChange={handleChange}
                className="w-full px-4 py-2 border-2 border-amber-200 rounded-lg focus:border-amber-400 focus:outline-none"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-amber-900 font-medium mb-2">
                Lieu de fabrication
              </label>
              <input
                type="text"
                name="manufacturing_location"
                value={formData.manufacturing_location}
                onChange={handleChange}
                className="w-full px-4 py-2 border-2 border-amber-200 rounded-lg focus:border-amber-400 focus:outline-none"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-amber-900 font-medium mb-2">
                État actuel
              </label>
              <textarea
                name="current_state"
                value={formData.current_state}
                onChange={handleChange}
                rows={3}
                className="w-full px-4 py-2 border-2 border-amber-200 rounded-lg focus:border-amber-400 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex gap-4 pt-4 border-t border-amber-200">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-amber-600 text-white py-2 px-4 rounded-lg font-bold hover:bg-amber-700 transition disabled:opacity-50"
            >
              {loading ? 'Sauvegarde...' : 'Sauvegarder'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg font-bold hover:bg-gray-400 transition"
            >
              Annuler
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
