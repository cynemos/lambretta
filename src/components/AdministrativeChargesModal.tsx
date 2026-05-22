import React, { useState } from 'react';
import { X } from 'lucide-react';
import { AdministrativeCharge } from '../hooks/useAdministrativeCharges';

interface AdministrativeChargesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (charge: Omit<AdministrativeCharge, 'id' | 'created_at' | 'user_id'>) => Promise<void>;
}

const CHARGE_TYPES = [
  { value: 'FFVE', label: 'FFVE' },
  { value: 'ANTS', label: 'ANTS' },
  { value: 'immatriculation', label: 'Immatriculation' },
  { value: 'assurance', label: 'Assurance' },
  { value: 'autre', label: 'Autre' }
];

export function AdministrativeChargesModal({ isOpen, onClose, onSave }: AdministrativeChargesModalProps) {
  const [chargeType, setChargeType] = useState<'FFVE' | 'ANTS' | 'immatriculation' | 'assurance' | 'autre'>('autre');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [dateCharge, setDateCharge] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!description.trim() || !amount || !dateCharge) {
      setError('Veuillez remplir tous les champs obligatoires');
      return;
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Le montant doit être un nombre positif');
      return;
    }

    try {
      setLoading(true);
      await onSave({
        charge_type: chargeType,
        description: description.trim(),
        amount: parsedAmount,
        date_charge: dateCharge,
        notes: notes.trim() || undefined
      });
      resetForm();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de l\'ajout');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setChargeType('autre');
    setDescription('');
    setAmount('');
    setDateCharge(new Date().toISOString().split('T')[0]);
    setNotes('');
    setError('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Ajouter une charge administrative</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Type de charge
            </label>
            <select
              value={chargeType}
              onChange={(e) => setChargeType(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              {CHARGE_TYPES.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex: Certificat d'immatriculation"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Montant (€)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date
            </label>
            <input
              type="date"
              value={dateCharge}
              onChange={(e) => setDateCharge(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes (optionnel)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Remarques supplémentaires..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
              rows={3}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition disabled:opacity-50"
            >
              {loading ? 'Enregistrement...' : 'Ajouter'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
