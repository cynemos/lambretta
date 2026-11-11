import React, { useState, useEffect } from 'react';
import type { BasePurchase, BasePurchaseInput } from '../lib/supabase';
import { X, Save, Car, Euro, Calendar, User, MapPin, FileText, Loader2 } from 'lucide-react';

interface BasePurchaseModalProps {
  basePurchase?: BasePurchase | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (purchaseData: BasePurchaseInput) => Promise<{ success: boolean; error?: string }>;
}

const VEHICLE_CONDITIONS = [
  'Excellent état',
  'Bon état général',
  'État moyen',
  'À restaurer partiellement',
  'À restaurer complètement',
  'Épave / Pièces détachées'
];

export function BasePurchaseModal({ basePurchase, isOpen, onClose, onSave }: BasePurchaseModalProps) {
  const [formData, setFormData] = useState({
    vehicle_name: 'Lambretta LD125',
    purchase_price: '',
    purchase_date: new Date().toISOString().split('T')[0],
    seller_name: '',
    seller_location: '',
    vehicle_condition: '',
    notes: '',
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (basePurchase) {
      setFormData({
        vehicle_name: basePurchase.vehicle_name,
        purchase_price: basePurchase.purchase_price.toString(),
        purchase_date: basePurchase.purchase_date,
        seller_name: basePurchase.seller_name || '',
        seller_location: basePurchase.seller_location || '',
        vehicle_condition: basePurchase.vehicle_condition || '',
        notes: basePurchase.notes || '',
      });
    } else {
      setFormData({
        vehicle_name: 'Lambretta LD125',
        purchase_price: '',
        purchase_date: new Date().toISOString().split('T')[0],
        seller_name: '',
        seller_location: '',
        vehicle_condition: '',
        notes: '',
      });
    }
    setMessage(null);
  }, [basePurchase, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.vehicle_name.trim() || !formData.purchase_price) {
      setMessage({ type: 'error', text: 'Veuillez remplir tous les champs obligatoires.' });
      return;
    }

    setSaving(true);
    setMessage(null);

    const purchaseData = {
      ...formData,
      purchase_price: parseFloat(formData.purchase_price),
      seller_name: formData.seller_name || null,
      seller_location: formData.seller_location || null,
      vehicle_condition: formData.vehicle_condition || null,
      notes: formData.notes || null,
    };

    const result = await onSave(purchaseData);

    if (result.success) {
      setMessage({ type: 'success', text: basePurchase ? 'Achat modifié avec succès !' : 'Achat enregistré avec succès !' });
      setTimeout(() => {
        onClose();
        setMessage(null);
      }, 1500);
    } else {
      setMessage({ type: 'error', text: result.error || 'Erreur lors de la sauvegarde.' });
    }

    setSaving(false);
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl border-4 border-amber-200 shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* En-tête */}
        <div className="bg-gradient-to-r from-amber-100 to-orange-100 px-6 py-4 border-b-2 border-amber-200 flex items-center justify-between">
          <h2 className="text-xl font-bold text-amber-900 font-serif">
            {basePurchase ? 'Modifier l\'achat du véhicule' : 'Enregistrer l\'achat du véhicule'}
          </h2>
          <button
            onClick={onClose}
            className="text-amber-700 hover:text-amber-900 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Nom du véhicule */}
          <div>
            <label className="block text-amber-900 font-semibold mb-2">
              <div className="flex items-center space-x-2">
                <Car className="h-4 w-4" />
                <span>Nom du véhicule *</span>
              </div>
            </label>
            <input
              type="text"
              value={formData.vehicle_name}
              onChange={(e) => handleChange('vehicle_name', e.target.value)}
              placeholder="Ex: Lambretta LD125, Vespa 150..."
              className="w-full p-3 border-2 border-amber-200 rounded-lg focus:border-amber-400 focus:outline-none transition-colors"
              required
            />
          </div>

          {/* Prix et Date */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-amber-900 font-semibold mb-2">
                <div className="flex items-center space-x-2">
                  <Euro className="h-4 w-4" />
                  <span>Prix d'achat (€) *</span>
                </div>
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.purchase_price}
                onChange={(e) => handleChange('purchase_price', e.target.value)}
                placeholder="0.00"
                className="w-full p-3 border-2 border-amber-200 rounded-lg focus:border-amber-400 focus:outline-none transition-colors"
                required
              />
            </div>

            <div>
              <label className="block text-amber-900 font-semibold mb-2">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4" />
                  <span>Date d'achat *</span>
                </div>
              </label>
              <input
                type="date"
                value={formData.purchase_date}
                onChange={(e) => handleChange('purchase_date', e.target.value)}
                className="w-full p-3 border-2 border-amber-200 rounded-lg focus:border-amber-400 focus:outline-none transition-colors"
                required
              />
            </div>
          </div>

          {/* Vendeur et Lieu */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-amber-900 font-semibold mb-2">
                <div className="flex items-center space-x-2">
                  <User className="h-4 w-4" />
                  <span>Nom du vendeur</span>
                </div>
              </label>
              <input
                type="text"
                value={formData.seller_name}
                onChange={(e) => handleChange('seller_name', e.target.value)}
                placeholder="Ex: M. Dupont, Garage Vintage..."
                className="w-full p-3 border-2 border-amber-200 rounded-lg focus:border-amber-400 focus:outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block text-amber-900 font-semibold mb-2">
                <div className="flex items-center space-x-2">
                  <MapPin className="h-4 w-4" />
                  <span>Lieu d'achat</span>
                </div>
              </label>
              <input
                type="text"
                value={formData.seller_location}
                onChange={(e) => handleChange('seller_location', e.target.value)}
                placeholder="Ex: Paris, Lyon, Le Bon Coin..."
                className="w-full p-3 border-2 border-amber-200 rounded-lg focus:border-amber-400 focus:outline-none transition-colors"
              />
            </div>
          </div>

          {/* État du véhicule */}
          <div>
            <label className="block text-amber-900 font-semibold mb-2">
              <span>État du véhicule à l'achat</span>
            </label>
            <select
              value={formData.vehicle_condition}
              onChange={(e) => handleChange('vehicle_condition', e.target.value)}
              className="w-full p-3 border-2 border-amber-200 rounded-lg focus:border-amber-400 focus:outline-none transition-colors"
            >
              <option value="">Sélectionner un état</option>
              {VEHICLE_CONDITIONS.map(condition => (
                <option key={condition} value={condition}>{condition}</option>
              ))}
            </select>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-amber-900 font-semibold mb-2">
              <div className="flex items-center space-x-2">
                <FileText className="h-4 w-4" />
                <span>Notes sur l'achat</span>
              </div>
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              placeholder="Circonstances de l'achat, état détaillé, accessoires inclus..."
              className="w-full p-3 border-2 border-amber-200 rounded-lg focus:border-amber-400 focus:outline-none transition-colors resize-none"
              rows={3}
            />
          </div>

          {/* Message de statut */}
          {message && (
            <div className={`p-4 rounded-lg border-2 flex items-center space-x-3 ${
              message.type === 'success' 
                ? 'bg-green-50 border-green-200 text-green-800'
                : 'bg-red-50 border-red-200 text-red-800'
            }`}>
              <p className="font-medium">{message.text}</p>
            </div>
          )}

          {/* Boutons */}
          <div className="flex space-x-4">
            <button
              type="submit"
              disabled={saving}
              className={`flex-1 py-3 px-6 rounded-lg font-bold transition-all flex items-center justify-center space-x-2 ${
                saving
                  ? 'bg-amber-300 text-amber-700 cursor-not-allowed'
                  : 'bg-gradient-to-r from-amber-400 to-orange-400 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-1'
              }`}
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Sauvegarde...</span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  <span>{basePurchase ? 'Modifier' : 'Enregistrer'}</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-6 py-3 rounded-lg font-bold text-amber-700 border-2 border-amber-200 hover:bg-amber-50 transition-all"
            >
              Annuler
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
