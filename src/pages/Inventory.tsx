import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { Plus, CreditCard as Edit2, Trash2, Search, Filter, Package, AlertCircle, CheckCircle, Clock, X, MessageCircle, ChevronDown, ChevronUp, Camera } from 'lucide-react';
import { InventoryCommentSection } from '../components/InventoryCommentSection';
import { PhotoGallery } from '../components/PhotoGallery';

interface Part {
  id: string;
  nom: string;
  categorie: string;
  etat_actuel: string;
  action_prevue: string;
  priorite: string;
  est_commande: boolean;
  prix_estime: number | null;
  fournisseur_prevu: string | null;
  reference: string | null;
  notes: string | null;
  date_demontage: string | null;
  created_at: string;
  piece_commandee_id: string | null;
  photos: string[] | null;
}

interface PurchasedPiece {
  id: string;
  nom: string;
  categorie: string;
  etat: string;
  prix: number;
  fournisseur: string | null;
  date_achat: string;
  date_installation: string | null;
  notes: string | null;
}

export function Inventory() {
  const { user, isAdmin } = useAuth();
  const [parts, setParts] = useState<Part[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPart, setEditingPart] = useState<Part | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategorie, setFilterCategorie] = useState('all');
  const [filterAction, setFilterAction] = useState('all');
  const [filterPriorite, setFilterPriorite] = useState('all');
  const [expandedPartId, setExpandedPartId] = useState<string | null>(null);
  const [showPhotosPartId, setShowPhotosPartId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    nom: '',
    categorie: 'moteur',
    etat_actuel: 'à_vérifier',
    action_prevue: 'rien',
    priorite: 'moyenne',
    est_commande: false,
    prix_estime: '',
    fournisseur_prevu: '',
    reference: '',
    notes: '',
    date_demontage: new Date().toISOString().split('T')[0],
  });

  const categories = [
    'moteur',
    'carrosserie',
    'électrique',
    'transmission',
    'freinage',
    'suspension',
    'roues',
    'échappement',
    'carburant',
    'direction',
    'accessoires',
    'autre',
  ];

  useEffect(() => {
    loadParts();
  }, []);

  const loadParts = async () => {
    try {
      const { data, error } = await supabase
        .from('scooter_parts_inventory')
        .select(`
          *,
          piece_commandee:pieces!scooter_parts_inventory_piece_commandee_id_fkey(
            id,
            nom,
            categorie,
            etat,
            prix,
            fournisseur,
            date_achat,
            date_installation,
            notes
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setParts(data || []);
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      alert('Vous devez être connecté');
      return;
    }

    try {
      const partData = {
        nom: formData.nom,
        categorie: formData.categorie,
        etat_actuel: formData.etat_actuel,
        action_prevue: formData.action_prevue,
        priorite: formData.priorite,
        est_commande: formData.est_commande,
        prix_estime: formData.prix_estime ? parseFloat(formData.prix_estime) : null,
        fournisseur_prevu: formData.fournisseur_prevu || null,
        reference: formData.reference || null,
        notes: formData.notes || null,
        date_demontage: formData.date_demontage || null,
        user_id: user.id,
      };

      if (editingPart) {
        const { error } = await supabase
          .from('scooter_parts_inventory')
          .update(partData)
          .eq('id', editingPart.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('scooter_parts_inventory')
          .insert([partData]);

        if (error) throw error;
      }

      resetForm();
      setShowModal(false);
      loadParts();
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de l\'enregistrement');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer cette pièce ?')) return;

    try {
      const { error } = await supabase
        .from('scooter_parts_inventory')
        .delete()
        .eq('id', id);

      if (error) throw error;
      loadParts();
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const handleEdit = (part: Part) => {
    setEditingPart(part);
    setFormData({
      nom: part.nom,
      categorie: part.categorie,
      etat_actuel: part.etat_actuel,
      action_prevue: part.action_prevue,
      priorite: part.priorite,
      est_commande: part.est_commande,
      prix_estime: part.prix_estime?.toString() || '',
      fournisseur_prevu: part.fournisseur_prevu || '',
      reference: part.reference || '',
      notes: part.notes || '',
      date_demontage: part.date_demontage || '',
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setEditingPart(null);
    setFormData({
      nom: '',
      categorie: 'moteur',
      etat_actuel: 'à_vérifier',
      action_prevue: 'rien',
      priorite: 'moyenne',
      est_commande: false,
      prix_estime: '',
      fournisseur_prevu: '',
      reference: '',
      notes: '',
      date_demontage: new Date().toISOString().split('T')[0],
    });
  };

  const filteredParts = parts.filter(part => {
    const matchesSearch = part.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         part.reference?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategorie = filterCategorie === 'all' || part.categorie === filterCategorie;
    const matchesAction = filterAction === 'all' || part.action_prevue === filterAction;
    const matchesPriorite = filterPriorite === 'all' || part.priorite === filterPriorite;

    return matchesSearch && matchesCategorie && matchesAction && matchesPriorite;
  });

  const getEtatColor = (etat: string) => {
    switch (etat) {
      case 'bon': return 'bg-green-100 text-green-800';
      case 'usé': return 'bg-yellow-100 text-yellow-800';
      case 'cassé': return 'bg-red-100 text-red-800';
      case 'manquant': return 'bg-gray-100 text-gray-800';
      case 'à_vérifier': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPrioriteColor = (priorite: string) => {
    switch (priorite) {
      case 'haute': return 'bg-red-100 text-red-800';
      case 'moyenne': return 'bg-orange-100 text-orange-800';
      case 'basse': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const stats = {
    total: parts.length,
    aCommander: parts.filter(p => p.action_prevue === 'commander' && !p.est_commande).length,
    aRenover: parts.filter(p => p.action_prevue === 'rénover').length,
    commande: parts.filter(p => p.est_commande).length,
    coutTotal: parts.reduce((sum, p) => sum + (p.prix_estime || 0), 0),
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <Package className="h-12 w-12 text-amber-600 animate-pulse mx-auto mb-4" />
        <p className="text-amber-700">Chargement...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-amber-900 font-serif">Inventaire Démontage</h2>
          <p className="text-amber-700 mt-1">État des lieux des pièces du scooter</p>
        </div>

        {isAdmin && (
          <button
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
            className="bg-amber-600 text-white px-6 py-3 rounded-lg hover:bg-amber-700 transition-colors flex items-center space-x-2 shadow-md"
          >
            <Plus className="h-5 w-5" />
            <span>Ajouter une pièce</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-md border-l-4 border-blue-500">
          <p className="text-gray-600 text-sm">Total pièces</p>
          <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-md border-l-4 border-orange-500">
          <p className="text-gray-600 text-sm">À commander</p>
          <p className="text-2xl font-bold text-gray-900">{stats.aCommander}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-md border-l-4 border-purple-500">
          <p className="text-gray-600 text-sm">À rénover</p>
          <p className="text-2xl font-bold text-gray-900">{stats.aRenover}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-md border-l-4 border-green-500">
          <p className="text-gray-600 text-sm">Commandées</p>
          <p className="text-2xl font-bold text-gray-900">{stats.commande}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-md border-l-4 border-amber-500">
          <p className="text-gray-600 text-sm">Coût estimé</p>
          <p className="text-2xl font-bold text-gray-900">{stats.coutTotal.toFixed(2)}€</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Rechercher..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            />
          </div>

          <select
            value={filterCategorie}
            onChange={(e) => setFilterCategorie(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          >
            <option value="all">Toutes catégories</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          <select
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          >
            <option value="all">Toutes actions</option>
            <option value="commander">Commander</option>
            <option value="remplacer">Remplacer</option>
            <option value="rénover">Rénover</option>
            <option value="nettoyer">Nettoyer</option>
            <option value="rien">Rien</option>
          </select>

          <select
            value={filterPriorite}
            onChange={(e) => setFilterPriorite(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          >
            <option value="all">Toutes priorités</option>
            <option value="haute">Haute</option>
            <option value="moyenne">Moyenne</option>
            <option value="basse">Basse</option>
          </select>
        </div>

        <div className="space-y-4">
          {filteredParts.length === 0 ? (
            <p className="text-center text-gray-500 py-8">Aucune pièce trouvée</p>
          ) : (
            filteredParts.map((part) => (
              <div key={part.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{part.nom}</h3>
                        <div className="flex flex-wrap gap-2 mt-2">
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-amber-100 text-amber-800">
                            {part.categorie}
                          </span>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getEtatColor(part.etat_actuel)}`}>
                            {part.etat_actuel}
                          </span>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPrioriteColor(part.priorite)}`}>
                            Priorité {part.priorite}
                          </span>
                          {part.est_commande && (
                            <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                              Commandée
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-3 text-sm text-gray-600">
                      {part.action_prevue !== 'rien' && (
                        <p><span className="font-medium">Action:</span> {part.action_prevue}</p>
                      )}
                      {part.prix_estime && (
                        <p><span className="font-medium">Prix estimé:</span> {part.prix_estime}€</p>
                      )}
                      {part.reference && (
                        <p><span className="font-medium">Référence:</span> {part.reference}</p>
                      )}
                      {part.fournisseur_prevu && (
                        <p><span className="font-medium">Fournisseur:</span> {part.fournisseur_prevu}</p>
                      )}
                      {part.date_demontage && (
                        <p><span className="font-medium">Démonté le:</span> {new Date(part.date_demontage).toLocaleDateString('fr-FR')}</p>
                      )}
                    </div>

                    {part.notes && (
                      <p className="mt-2 text-sm text-gray-700 bg-gray-50 p-2 rounded">
                        {part.notes}
                      </p>
                    )}

                    {(part as any).piece_commandee && (
                      <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                        <p className="text-sm font-semibold text-green-900 mb-2">Pièce commandée</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-green-800">
                          <p><span className="font-medium">Prix réel:</span> {(part as any).piece_commandee.prix}€</p>
                          {(part as any).piece_commandee.fournisseur && (
                            <p><span className="font-medium">Fournisseur:</span> {(part as any).piece_commandee.fournisseur}</p>
                          )}
                          <p><span className="font-medium">Acheté le:</span> {new Date((part as any).piece_commandee.date_achat).toLocaleDateString('fr-FR')}</p>
                          <p><span className="font-medium">État:</span> {(part as any).piece_commandee.etat}</p>
                          {(part as any).piece_commandee.date_installation && (
                            <p className="col-span-2"><span className="font-medium">Installé le:</span> {new Date((part as any).piece_commandee.date_installation).toLocaleDateString('fr-FR')}</p>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="mt-4 pt-4 border-t border-gray-200 space-y-3">
                      <button
                        onClick={() => setShowPhotosPartId(showPhotosPartId === part.id ? null : part.id)}
                        className="flex items-center space-x-2 text-amber-600 hover:text-amber-700 font-medium transition-colors"
                      >
                        <Camera className="h-4 w-4" />
                        <span>Photos {part.photos && part.photos.length > 0 && `(${part.photos.length})`}</span>
                        {showPhotosPartId === part.id ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </button>

                      {showPhotosPartId === part.id && (
                        <div className="mt-4 pl-6">
                          <PhotoGallery
                            photos={part.photos || []}
                            partId={part.id}
                            onPhotosUpdate={(newPhotos) => {
                              setParts(parts.map(p =>
                                p.id === part.id ? { ...p, photos: newPhotos } : p
                              ));
                            }}
                            canEdit={isAdmin}
                          />
                        </div>
                      )}

                      <button
                        onClick={() => setExpandedPartId(expandedPartId === part.id ? null : part.id)}
                        className="flex items-center space-x-2 text-amber-600 hover:text-amber-700 font-medium transition-colors"
                      >
                        <MessageCircle className="h-4 w-4" />
                        <span>Commentaires</span>
                        {expandedPartId === part.id ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </button>

                      {expandedPartId === part.id && (
                        <div className="mt-4">
                          <InventoryCommentSection partId={part.id} partName={part.nom} />
                        </div>
                      )}
                    </div>
                  </div>

                  {isAdmin && (
                    <div className="flex md:flex-col gap-2">
                      <button
                        onClick={() => handleEdit(part)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Edit2 className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(part.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-2xl font-bold text-gray-900">
                  {editingPart ? 'Modifier la pièce' : 'Ajouter une pièce'}
                </h3>
                <button
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nom de la pièce *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.nom}
                    onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Catégorie *
                    </label>
                    <select
                      required
                      value={formData.categorie}
                      onChange={(e) => setFormData({ ...formData, categorie: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    >
                      {categories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      État actuel *
                    </label>
                    <select
                      required
                      value={formData.etat_actuel}
                      onChange={(e) => setFormData({ ...formData, etat_actuel: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    >
                      <option value="bon">Bon</option>
                      <option value="usé">Usé</option>
                      <option value="cassé">Cassé</option>
                      <option value="manquant">Manquant</option>
                      <option value="à_vérifier">À vérifier</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Action prévue *
                    </label>
                    <select
                      required
                      value={formData.action_prevue}
                      onChange={(e) => setFormData({ ...formData, action_prevue: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    >
                      <option value="commander">Commander</option>
                      <option value="remplacer">Remplacer</option>
                      <option value="rénover">Rénover</option>
                      <option value="nettoyer">Nettoyer</option>
                      <option value="rien">Rien</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Priorité *
                    </label>
                    <select
                      required
                      value={formData.priorite}
                      onChange={(e) => setFormData({ ...formData, priorite: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    >
                      <option value="haute">Haute</option>
                      <option value="moyenne">Moyenne</option>
                      <option value="basse">Basse</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Prix estimé (€)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.prix_estime}
                      onChange={(e) => setFormData({ ...formData, prix_estime: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Date de démontage
                    </label>
                    <input
                      type="date"
                      value={formData.date_demontage}
                      onChange={(e) => setFormData({ ...formData, date_demontage: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Référence
                    </label>
                    <input
                      type="text"
                      value={formData.reference}
                      onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Fournisseur prévu
                    </label>
                    <input
                      type="text"
                      value={formData.fournisseur_prevu}
                      onChange={(e) => setFormData({ ...formData, fournisseur_prevu: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.est_commande}
                      onChange={(e) => setFormData({ ...formData, est_commande: e.target.checked })}
                      className="rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                    />
                    <span className="text-sm font-medium text-gray-700">Déjà commandée</span>
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes
                  </label>
                  <textarea
                    rows={3}
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      resetForm();
                    }}
                    className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
                  >
                    {editingPart ? 'Modifier' : 'Ajouter'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
