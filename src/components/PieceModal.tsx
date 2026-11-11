import React, { useState, useEffect } from 'react';
import type { Piece, PieceInput } from '../lib/supabase';
import { supabase } from '../lib/supabase';
import { X, Save, Package, Tag, Euro, Calendar, User, FileText, Loader2 } from 'lucide-react';

interface PieceModalProps {
  piece?: Piece | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (pieceData: PieceInput) => Promise<{ success: boolean; error?: string }>;
}

interface InventoryPart {
  id: string;
  nom: string;
  categorie: string;
  action_prevue: string;
}

const CATEGORIES = [
  'Moteur',
  'Transmission',
  'Carrosserie',
  'Électricité',
  'Freinage',
  'Suspension',
  'Roues/Pneus',
  'Accessoires',
  'Outils',
  'Consommables',
  'Frais administratifs',
  'Autre'
];

export function PieceModal({ piece, isOpen, onClose, onSave }: PieceModalProps) {
  const [formData, setFormData] = useState({
    nom: '',
    categorie: '',
    etat: 'neuve' as 'neuve' | 'occasion',
    prix: '',
    fournisseur: '',
    date_achat: new Date().toISOString().split('T')[0],
    date_installation: '',
    notes: '',
    inventory_part_id: '',
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [inventoryParts, setInventoryParts] = useState<InventoryPart[]>([]);

  useEffect(() => {
    if (isOpen) {
      loadInventoryParts();
    }

    if (piece) {
      setFormData({
        nom: piece.nom,
        categorie: piece.categorie,
        etat: piece.etat,
        prix: piece.prix.toString(),
        fournisseur: piece.fournisseur || '',
        date_achat: piece.date_achat,
        date_installation: piece.date_installation || '',
        notes: piece.notes || '',
        inventory_part_id: piece.inventory_part_id || '',
      });
    } else {
      setFormData({
        nom: '',
        categorie: '',
        etat: 'neuve',
        prix: '',
        fournisseur: '',
        date_achat: new Date().toISOString().split('T')[0],
        date_installation: '',
        notes: '',
        inventory_part_id: '',
      });
    }
    setMessage(null);
  }, [piece, isOpen]);

  const loadInventoryParts = async () => {
    try {
      const { data, error } = await supabase
        .from('scooter_parts_inventory')
        .select('id, nom, categorie, action_prevue')
        .eq('action_prevue', 'commander')
        .eq('est_commande', false)
        .order('nom');

      if (error) throw error;
      setInventoryParts(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des pièces d\'inventaire:', error);
    }
  };

  const handleInventoryPartSelect = (inventoryPartId: string) => {
    const selectedPart = inventoryParts.find(p => p.id === inventoryPartId);
    if (selectedPart) {
      setFormData({
        ...formData,
        inventory_part_id: inventoryPartId,
        nom: selectedPart.nom,
        categorie: selectedPart.categorie,
      });
    } else {
      setFormData({
        ...formData,
        inventory_part_id: '',
      });
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nom.trim() || !formData.categorie || !formData.prix) {
      setMessage({ type: 'error', text: 'Veuillez remplir tous les champs obligatoires.' });
      return;
    }

    setSaving(true);
    setMessage(null);

    const pieceData = {
      ...formData,
      prix: parseFloat(formData.prix),
      date_installation: formData.date_installation || null,
      fournisseur: formData.fournisseur || null,
      notes: formData.notes || null,
      inventory_part_id: formData.inventory_part_id || null,
    };

    const result = await onSave(pieceData);

    if (result.success) {
      setMessage({ type: 'success', text: piece ? 'Pièce modifiée avec succès !' : 'Pièce ajoutée avec succès !' });
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
            {piece ? 'Modifier la pièce' : 'Ajouter une pièce'}
          </h2>
          <button
            onClick={onClose}
            className="text-amber-700 hover:text-amber-900 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Lier à une pièce de l'inventaire */}
          {!piece && inventoryParts.length > 0 && (
            <div className="bg-amber-50 border-2 border-amber-200 rounded-lg p-4">
              <label className="block text-amber-900 font-semibold mb-2">
                <div className="flex items-center space-x-2">
                  <Package className="h-4 w-4" />
                  <span>Lier à une pièce de l'inventaire (optionnel)</span>
                </div>
              </label>
              <select
                value={formData.inventory_part_id}
                onChange={(e) => handleInventoryPartSelect(e.target.value)}
                className="w-full p-3 border-2 border-amber-200 rounded-lg focus:border-amber-400 focus:outline-none transition-colors bg-white"
              >
                <option value="">Aucune (créer une nouvelle pièce)</option>
                {inventoryParts.map(part => (
                  <option key={part.id} value={part.id}>
                    {part.nom} ({part.categorie})
                  </option>
                ))}
              </select>
              {formData.inventory_part_id && (
                <p className="text-sm text-amber-700 mt-2">
                  Cette pièce sera marquée comme commandée dans l'inventaire
                </p>
              )}
            </div>
          )}

          {/* Nom de la pièce */}
          <div>
            <label className="block text-amber-900 font-semibold mb-2">
              <div className="flex items-center space-x-2">
                <Package className="h-4 w-4" />
                <span>Nom de la pièce *</span>
              </div>
            </label>
            <input
              type="text"
              value={formData.nom}
              onChange={(e) => handleChange('nom', e.target.value)}
              placeholder="Ex: Piston, Carburateur, Phare avant..."
              className="w-full p-3 border-2 border-amber-200 rounded-lg focus:border-amber-400 focus:outline-none transition-colors"
              required
            />
          </div>

          {/* Catégorie et État */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-amber-900 font-semibold mb-2">
                <div className="flex items-center space-x-2">
                  <Tag className="h-4 w-4" />
                  <span>Catégorie *</span>
                </div>
              </label>
              <select
                value={formData.categorie}
                onChange={(e) => handleChange('categorie', e.target.value)}
                className="w-full p-3 border-2 border-amber-200 rounded-lg focus:border-amber-400 focus:outline-none transition-colors"
                required
              >
                <option value="">Sélectionner une catégorie</option>
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-amber-900 font-semibold mb-2">
                <span>État *</span>
              </label>
              <select
                value={formData.etat}
                onChange={(e) => handleChange('etat', e.target.value)}
                className="w-full p-3 border-2 border-amber-200 rounded-lg focus:border-amber-400 focus:outline-none transition-colors"
                required
              >
                <option value="neuve">Neuve</option>
                <option value="occasion">Occasion</option>
              </select>
            </div>
          </div>

          {/* Prix et Fournisseur */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-amber-900 font-semibold mb-2">
                <div className="flex items-center space-x-2">
                  <Euro className="h-4 w-4" />
                  <span>Prix (€) *</span>
                </div>
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.prix}
                onChange={(e) => handleChange('prix', e.target.value)}
                placeholder="0.00"
                className="w-full p-3 border-2 border-amber-200 rounded-lg focus:border-amber-400 focus:outline-none transition-colors"
                required
              />
            </div>

            <div>
              <label className="block text-amber-900 font-semibold mb-2">
                <div className="flex items-center space-x-2">
                  <User className="h-4 w-4" />
                  <span>Fournisseur</span>
                </div>
              </label>
              <input
                type="text"
                value={formData.fournisseur}
                onChange={(e) => handleChange('fournisseur', e.target.value)}
                placeholder="Ex: SIP Scootershop, eBay..."
                className="w-full p-3 border-2 border-amber-200 rounded-lg focus:border-amber-400 focus:outline-none transition-colors"
              />
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-amber-900 font-semibold mb-2">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4" />
                  <span>Date d'achat *</span>
                </div>
              </label>
              <input
                type="date"
                value={formData.date_achat}
                onChange={(e) => handleChange('date_achat', e.target.value)}
                className="w-full p-3 border-2 border-amber-200 rounded-lg focus:border-amber-400 focus:outline-none transition-colors"
                required
              />
            </div>

            <div>
              <label className="block text-amber-900 font-semibold mb-2">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4" />
                  <span>Date d'installation</span>
                </div>
              </label>
              <input
                type="date"
                value={formData.date_installation}
                onChange={(e) => handleChange('date_installation', e.target.value)}
                className="w-full p-3 border-2 border-amber-200 rounded-lg focus:border-amber-400 focus:outline-none transition-colors"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-amber-900 font-semibold mb-2">
              <div className="flex items-center space-x-2">
                <FileText className="h-4 w-4" />
                <span>Notes</span>
              </div>
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              placeholder="Remarques, références, état détaillé..."
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
                  <span>{piece ? 'Modifier' : 'Ajouter'}</span>
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
