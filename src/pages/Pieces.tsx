import React, { useState } from 'react';
import { usePieces } from '../hooks/usePieces';
import { useBasePurchase } from '../hooks/useBasePurchase';
import { useAuth } from '../hooks/useAuth';
import { PieceModal } from '../components/PieceModal';
import { BasePurchaseModal } from '../components/BasePurchaseModal';
import { Package, Plus, CreditCard as Edit, Trash2, Euro, Calendar, BarChart3, Loader2, Filter, Search, CheckCircle, Clock, Car, FileText } from 'lucide-react';
import { Piece } from '../lib/supabase';

export function Pieces() {
  const { user } = useAuth();
  const { pieces, loading, error, addPiece, updatePiece, deletePiece, statistics } = usePieces();
  const { 
    basePurchase, 
    loading: basePurchaseLoading, 
    addBasePurchase, 
    updateBasePurchase, 
    deleteBasePurchase 
  } = useBasePurchase();
  const [editingPiece, setEditingPiece] = useState<Piece | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showBasePurchaseModal, setShowBasePurchaseModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState('');
  const [filterState, setFilterState] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const categories = [...new Set(pieces.map(p => p.categorie))].sort();
  
  const filteredPieces = pieces.filter(piece => {
    const matchesCategory = !filterCategory || piece.categorie === filterCategory;
    const matchesState = !filterState || piece.etat === filterState;
    const matchesSearch = !searchTerm || 
      piece.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      piece.fournisseur?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesCategory && matchesState && matchesSearch;
  });

  const handleAdd = () => {
    setEditingPiece(null);
    setShowModal(true);
  };

  const handleEdit = (piece: Piece) => {
    setEditingPiece(piece);
    setShowModal(true);
  };

  const handleSave = async (pieceData: any) => {
    if (!user) return { success: false, error: 'Non authentifié' };

    const dataWithUser = { ...pieceData, user_id: user.id };
    
    if (editingPiece) {
      return await updatePiece(editingPiece.id, dataWithUser);
    } else {
      return await addPiece(dataWithUser);
    }
  };

  const handleSaveBasePurchase = async (purchaseData: any) => {
    if (!user) return { success: false, error: 'Non authentifié' };

    const dataWithUser = { ...purchaseData, user_id: user.id };
    
    if (basePurchase) {
      return await updateBasePurchase(basePurchase.id, dataWithUser);
    } else {
      return await addBasePurchase(dataWithUser);
    }
  };

  const handleDelete = (pieceId: string) => {
    setDeleteConfirm(pieceId);
  };

  const confirmDelete = async () => {
    if (!deleteConfirm) return;
    
    await deletePiece(deleteConfirm);
    setDeleteConfirm(null);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('fr-FR').format(new Date(dateString));
  };

  if (loading || basePurchaseLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <Loader2 className="h-8 w-8 text-amber-600 animate-spin mb-4" />
        <p className="text-amber-700 font-medium">
          Chargement des pièces...
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
          Inventaire des Pièces
        </h2>
        <p className="text-amber-700">
          Suivi des pièces commandées et installées pour la restauration
        </p>
      </header>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        {/* Achat de la base */}
        <div className="bg-gradient-to-r from-blue-100 to-cyan-100 rounded-xl p-6 border-2 border-blue-200">
          <div className="flex items-center space-x-3">
            <Car className="h-8 w-8 text-blue-600" />
            <div>
              <p className="text-2xl font-bold text-blue-900">{formatPrice(statistics.baseCost)}</p>
              <p className="text-blue-700 text-sm">Achat véhicule</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-amber-100 to-orange-100 rounded-xl p-6 border-2 border-amber-200">
          <div className="flex items-center space-x-3">
            <Package className="h-8 w-8 text-amber-600" />
            <div>
              <p className="text-2xl font-bold text-amber-900">{statistics.totalPieces}</p>
              <p className="text-amber-700 text-sm">Pièces totales</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-orange-100 to-red-100 rounded-xl p-6 border-2 border-orange-200">
          <div className="flex items-center space-x-3">
            <Euro className="h-8 w-8 text-orange-600" />
            <div>
              <p className="text-2xl font-bold text-orange-900">{formatPrice(statistics.piecesCost)}</p>
              <p className="text-orange-700 text-sm">Coût pièces</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-100 to-pink-100 rounded-xl p-6 border-2 border-purple-200">
          <div className="flex items-center space-x-3">
            <FileText className="h-8 w-8 text-purple-600" />
            <div>
              <p className="text-2xl font-bold text-purple-900">{formatPrice(statistics.administrativeCost)}</p>
              <p className="text-purple-700 text-sm">Frais admin</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-100 to-emerald-100 rounded-xl p-6 border-2 border-green-200">
          <div className="flex items-center space-x-3">
            <Euro className="h-8 w-8 text-green-600" />
            <div>
              <p className="text-2xl font-bold text-green-900">{formatPrice(statistics.totalProjectCost)}</p>
              <p className="text-green-700 text-sm">Coût total</p>
            </div>
          </div>
        </div>
      </div>

      {/* Section achat de la base */}
      <div className="bg-white rounded-xl border-4 border-blue-200 p-6 mb-8 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-blue-900 flex items-center space-x-2">
            <Car className="h-5 w-5" />
            <span>Achat du véhicule de base</span>
          </h3>
          
          {user && (
            <button
              onClick={() => setShowBasePurchaseModal(true)}
              className="bg-gradient-to-r from-blue-400 to-cyan-400 text-white px-4 py-2 rounded-lg font-bold shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all flex items-center space-x-2"
            >
              {basePurchase ? <Edit className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
              <span>{basePurchase ? 'Modifier' : 'Enregistrer'}</span>
            </button>
          )}
        </div>
        
        {basePurchase ? (
          <div className="bg-blue-50 rounded-lg p-4 border-2 border-blue-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-blue-600 font-medium">Véhicule</p>
                <p className="text-blue-900 font-bold">{basePurchase.vehicle_name}</p>
              </div>
              <div>
                <p className="text-blue-600 font-medium">Prix d'achat</p>
                <p className="text-blue-900 font-bold">{formatPrice(basePurchase.purchase_price)}</p>
              </div>
              <div>
                <p className="text-blue-600 font-medium">Date d'achat</p>
                <p className="text-blue-900">{formatDate(basePurchase.purchase_date)}</p>
              </div>
              {basePurchase.seller_name && (
                <div>
                  <p className="text-blue-600 font-medium">Vendeur</p>
                  <p className="text-blue-900">{basePurchase.seller_name}</p>
                </div>
              )}
              {basePurchase.seller_location && (
                <div>
                  <p className="text-blue-600 font-medium">Lieu</p>
                  <p className="text-blue-900">{basePurchase.seller_location}</p>
                </div>
              )}
              {basePurchase.vehicle_condition && (
                <div>
                  <p className="text-blue-600 font-medium">État</p>
                  <p className="text-blue-900">{basePurchase.vehicle_condition}</p>
                </div>
              )}
            </div>
            {basePurchase.notes && (
              <div className="mt-3">
                <p className="text-blue-600 font-medium text-sm">Notes</p>
                <p className="text-blue-900 text-sm">{basePurchase.notes}</p>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8">
            <Car className="h-12 w-12 text-blue-300 mx-auto mb-4" />
            <p className="text-blue-700">
              {user ? 'Enregistrez les détails de l\'achat de votre véhicule' : 'Aucun achat de véhicule enregistré'}
            </p>
          </div>
        )}
      </div>

      {/* Statistiques par catégorie */}
      <div className="bg-white rounded-xl border-4 border-amber-200 p-6 mb-8 shadow-lg">
        <h3 className="text-xl font-bold text-amber-900 mb-4 flex items-center space-x-2">
          <BarChart3 className="h-5 w-5" />
          <span>Répartition par catégorie</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(statistics.byCategory).map(([category, stats]) => (
            <div key={category} className="bg-amber-50 rounded-lg p-4 border-2 border-amber-200">
              <h4 className="font-semibold text-amber-900">{category}</h4>
              <p className="text-amber-700 text-sm">{stats.count} pièce{stats.count > 1 ? 's' : ''}</p>
              <p className="text-amber-800 font-medium">{formatPrice(stats.cost)}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Contrôles */}
      <div className="bg-white rounded-xl border-4 border-amber-200 p-6 mb-6 shadow-lg">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          {/* Recherche et filtres */}
          <div className="flex flex-col md:flex-row gap-4 flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-amber-600" />
              <input
                type="text"
                placeholder="Rechercher une pièce..."
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

            <select
              value={filterState}
              onChange={(e) => setFilterState(e.target.value)}
              className="px-4 py-2 border-2 border-amber-200 rounded-lg focus:border-amber-400 focus:outline-none"
            >
              <option value="">Tous les états</option>
              <option value="neuve">Neuve</option>
              <option value="occasion">Occasion</option>
            </select>
          </div>

          {/* Bouton d'ajout */}
          {user && (
            <button
              onClick={handleAdd}
              className="bg-gradient-to-r from-amber-400 to-orange-400 text-white px-6 py-2 rounded-lg font-bold shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all flex items-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              <span>Ajouter une pièce</span>
            </button>
          )}
          
          {!user && (
            <div className="text-amber-700 text-sm italic">
              Mode lecture seule - Connectez-vous pour gérer les pièces
            </div>
          )}
        </div>
      </div>

      {/* Liste des pièces */}
      {filteredPieces.length === 0 ? (
        <div className="text-center py-16">
          <Package className="h-16 w-16 text-amber-300 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-amber-900 mb-2">
            {pieces.length === 0 ? 'Aucune pièce enregistrée' : 'Aucune pièce trouvée'}
          </h3>
          <p className="text-amber-700">
            {pieces.length === 0 
              ? 'Commencez par ajouter les premières pièces de votre restauration.'
              : 'Essayez de modifier vos critères de recherche.'
            }
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredPieces.map((piece) => (
            <div key={piece.id} className="bg-white rounded-xl border-4 border-amber-200 p-6 shadow-lg hover:shadow-xl transition-all">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${piece.date_installation ? 'bg-green-500' : 'bg-orange-500'}`}></div>
                  <h3 className="text-xl font-bold text-amber-900">{piece.nom}</h3>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    piece.etat === 'neuve' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {piece.etat}
                  </span>
                </div>

                {user && (
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleEdit(piece)}
                      className="p-2 text-amber-600 hover:text-amber-800 hover:bg-amber-100 rounded-lg transition-all"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(piece.id)}
                      className="p-2 text-red-600 hover:text-red-800 hover:bg-red-100 rounded-lg transition-all"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-amber-600 font-medium">Catégorie</p>
                  <p className="text-amber-900">{piece.categorie}</p>
                </div>
                <div>
                  <p className="text-amber-600 font-medium">Prix</p>
                  <p className="text-amber-900 font-bold">{formatPrice(piece.prix)}</p>
                </div>
                <div>
                  <p className="text-amber-600 font-medium">Date d'achat</p>
                  <p className="text-amber-900">{formatDate(piece.date_achat)}</p>
                </div>
                <div>
                  <p className="text-amber-600 font-medium">Installation</p>
                  <p className="text-amber-900">
                    {piece.date_installation ? formatDate(piece.date_installation) : 'En attente'}
                  </p>
                </div>
              </div>

              {piece.fournisseur && (
                <div className="mt-3">
                  <p className="text-amber-600 font-medium text-sm">Fournisseur</p>
                  <p className="text-amber-900 text-sm">{piece.fournisseur}</p>
                </div>
              )}

              {piece.notes && (
                <div className="mt-3">
                  <p className="text-amber-600 font-medium text-sm">Notes</p>
                  <p className="text-amber-900 text-sm">{piece.notes}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal d'ajout/édition */}
      <PieceModal
        piece={editingPiece}
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSave={handleSave}
      />

      {/* Modal d'achat de la base */}
      <BasePurchaseModal
        basePurchase={basePurchase}
        isOpen={showBasePurchaseModal}
        onClose={() => setShowBasePurchaseModal(false)}
        onSave={handleSaveBasePurchase}
      />

      {/* Modal de confirmation de suppression */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl border-4 border-red-200 shadow-2xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-red-900 mb-4">
              Confirmer la suppression
            </h3>
            <p className="text-red-700 mb-6">
              Êtes-vous sûr de vouloir supprimer cette pièce ? Cette action est irréversible.
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
