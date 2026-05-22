import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { BarChart3, TrendingUp, Euro, Clock, Package, PieChart, Plus, Trash2, FileText } from 'lucide-react';
import { useAdministrativeCharges } from '../hooks/useAdministrativeCharges';
import { useAuth } from '../hooks/useAuth';
import { AdministrativeChargesModal } from '../components/AdministrativeChargesModal';

interface TimeEntry {
  id: string;
  category: string;
  duration_minutes: number;
  date: string;
}

interface Piece {
  id: string;
  categorie: string;
  prix: number;
  etat: 'neuve' | 'occasion';
  date_achat: string;
}

export function Statistics() {
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [pieces, setPieces] = useState<Piece[]>([]);
  const [loading, setLoading] = useState(true);
  const { charges, loading: chargesLoading, addCharge, deleteCharge } = useAdministrativeCharges();
  const { profile } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const isAdmin = profile?.is_admin ?? false;

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [timeResult, piecesResult] = await Promise.all([
        supabase.from('time_entries').select('*'),
        supabase.from('pieces').select('*')
      ]);

      if (timeResult.data) setTimeEntries(timeResult.data);
      if (piecesResult.data) setPieces(piecesResult.data);
    } catch (error) {
      console.error('Erreur chargement:', error);
    } finally {
      setLoading(false);
    }
  };

  const timeByCategory = timeEntries.reduce((acc, entry) => {
    acc[entry.category] = (acc[entry.category] || 0) + entry.duration_minutes;
    return acc;
  }, {} as Record<string, number>);

  const costByCategory = pieces.reduce((acc, piece) => {
    if (!acc[piece.categorie]) {
      acc[piece.categorie] = { total: 0, count: 0 };
    }
    acc[piece.categorie].total += piece.prix;
    acc[piece.categorie].count += 1;
    return acc;
  }, {} as Record<string, { total: number; count: number }>);

  const piecesByState = pieces.reduce((acc, piece) => {
    acc[piece.etat] = (acc[piece.etat] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const totalNewPieces = piecesByState['neuve'] || 0;
  const totalUsedPieces = piecesByState['occasion'] || 0;
  const totalPieces = totalNewPieces + totalUsedPieces;

  const budgetByMonth = pieces.reduce((acc, piece) => {
    const month = new Date(piece.date_achat).toLocaleDateString('fr-FR', { year: 'numeric', month: 'short' });
    acc[month] = (acc[month] || 0) + piece.prix;
    return acc;
  }, {} as Record<string, number>);

  const sortedMonths = Object.keys(budgetByMonth).sort((a, b) => {
    return new Date(a).getTime() - new Date(b).getTime();
  });

  let cumulativeBudget = 0;
  const cumulativeBudgetData = sortedMonths.map(month => {
    cumulativeBudget += budgetByMonth[month];
    return { month, amount: cumulativeBudget };
  });

  const maxTime = Math.max(...Object.values(timeByCategory));
  const maxCost = Math.max(...Object.values(costByCategory).map(c => c.total));
  const maxBudget = Math.max(...cumulativeBudgetData.map(d => d.amount));

  const totalTime = Object.values(timeByCategory).reduce((sum, time) => sum + time, 0);
  const totalCost = pieces.reduce((sum, piece) => sum + piece.prix, 0);

  if (loading) {
    return (
      <div className="text-center py-12">
        <BarChart3 className="h-12 w-12 text-amber-600 animate-pulse mx-auto mb-4" />
        <p className="text-amber-700">Chargement des statistiques...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-amber-900 font-serif">Statistiques Avancées</h2>
          <p className="text-amber-700 mt-1">Analyse détaillée du projet de restauration</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Temps total</p>
              <p className="text-3xl font-bold text-gray-900">{Math.round(totalTime / 60)}h</p>
              <p className="text-sm text-gray-500 mt-1">{totalTime} minutes</p>
            </div>
            <Clock className="h-12 w-12 text-blue-500 opacity-20" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Coût total pièces</p>
              <p className="text-3xl font-bold text-gray-900">{totalCost.toFixed(2)}€</p>
              <p className="text-sm text-gray-500 mt-1">{pieces.length} pièces</p>
            </div>
            <Euro className="h-12 w-12 text-green-500 opacity-20" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-amber-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Coût moyen/pièce</p>
              <p className="text-3xl font-bold text-gray-900">
                {pieces.length > 0 ? (totalCost / pieces.length).toFixed(2) : '0'}€
              </p>
              <p className="text-sm text-gray-500 mt-1">par pièce</p>
            </div>
            <Package className="h-12 w-12 text-amber-500 opacity-20" />
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-lg border-2 border-amber-200">
        <div className="flex items-center space-x-2 mb-6">
          <Clock className="h-6 w-6 text-amber-600" />
          <h3 className="text-xl font-bold text-gray-900">Temps passé par catégorie</h3>
        </div>
        <div className="space-y-4">
          {Object.entries(timeByCategory)
            .sort(([, a], [, b]) => b - a)
            .map(([category, minutes]) => (
              <div key={category}>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700 capitalize">{category}</span>
                  <span className="text-sm font-bold text-gray-900">
                    {Math.round(minutes / 60)}h {minutes % 60}min
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-blue-600 h-3 rounded-full transition-all duration-500"
                    style={{ width: `${(minutes / maxTime) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          {Object.keys(timeByCategory).length === 0 && (
            <p className="text-center text-gray-500 py-8">Aucune entrée de temps enregistrée</p>
          )}
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-lg border-2 border-amber-200">
        <div className="flex items-center space-x-2 mb-6">
          <Euro className="h-6 w-6 text-amber-600" />
          <h3 className="text-xl font-bold text-gray-900">Coût par catégorie de pièce</h3>
        </div>
        <div className="space-y-4">
          {Object.entries(costByCategory)
            .sort(([, a], [, b]) => b.total - a.total)
            .map(([category, { total, count }]) => (
              <div key={category}>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700">{category}</span>
                  <div className="text-right">
                    <span className="text-sm font-bold text-gray-900">{total.toFixed(2)}€</span>
                    <span className="text-xs text-gray-500 ml-2">
                      ({count} pièce{count > 1 ? 's' : ''}, moy: {(total / count).toFixed(2)}€)
                    </span>
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-green-600 h-3 rounded-full transition-all duration-500"
                    style={{ width: `${(total / maxCost) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          {Object.keys(costByCategory).length === 0 && (
            <p className="text-center text-gray-500 py-8">Aucune pièce enregistrée</p>
          )}
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-lg border-2 border-amber-200">
        <div className="flex items-center space-x-2 mb-6">
          <TrendingUp className="h-6 w-6 text-amber-600" />
          <h3 className="text-xl font-bold text-gray-900">Évolution du budget cumulé</h3>
        </div>
        <div className="space-y-4">
          {cumulativeBudgetData.map(({ month, amount }) => (
            <div key={month}>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700">{month}</span>
                <span className="text-sm font-bold text-gray-900">{amount.toFixed(2)}€</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-amber-600 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${(amount / maxBudget) * 100}%` }}
                />
              </div>
            </div>
          ))}
          {cumulativeBudgetData.length === 0 && (
            <p className="text-center text-gray-500 py-8">Aucune donnée budgétaire disponible</p>
          )}
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-lg border-2 border-amber-200">
        <div className="flex items-center space-x-2 mb-6">
          <PieChart className="h-6 w-6 text-amber-600" />
          <h3 className="text-xl font-bold text-gray-900">Ratio Pièces Neuves / Occasion</h3>
        </div>

        {totalPieces > 0 ? (
          <div className="space-y-6">
            <div className="flex items-center justify-center space-x-8">
              <div className="text-center">
                <div className="text-4xl font-bold text-green-600">{totalNewPieces}</div>
                <div className="text-sm text-gray-600 mt-1">Neuves</div>
                <div className="text-xs text-gray-500">
                  {((totalNewPieces / totalPieces) * 100).toFixed(1)}%
                </div>
              </div>

              <div className="text-4xl text-gray-400">/</div>

              <div className="text-center">
                <div className="text-4xl font-bold text-blue-600">{totalUsedPieces}</div>
                <div className="text-sm text-gray-600 mt-1">Occasion</div>
                <div className="text-xs text-gray-500">
                  {((totalUsedPieces / totalPieces) * 100).toFixed(1)}%
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="w-full bg-gray-200 rounded-full h-8 overflow-hidden flex">
                <div
                  className="bg-green-500 h-8 flex items-center justify-center text-white text-sm font-medium transition-all duration-500"
                  style={{ width: `${(totalNewPieces / totalPieces) * 100}%` }}
                >
                  {totalNewPieces > 0 && `${totalNewPieces} neuve${totalNewPieces > 1 ? 's' : ''}`}
                </div>
                <div
                  className="bg-blue-500 h-8 flex items-center justify-center text-white text-sm font-medium transition-all duration-500"
                  style={{ width: `${(totalUsedPieces / totalPieces) * 100}%` }}
                >
                  {totalUsedPieces > 0 && `${totalUsedPieces} occasion`}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-6">
              <div className="bg-green-50 p-4 rounded-lg border-2 border-green-200">
                <p className="text-sm text-gray-600 mb-1">Coût pièces neuves</p>
                <p className="text-2xl font-bold text-green-700">
                  {pieces
                    .filter(p => p.etat === 'neuve')
                    .reduce((sum, p) => sum + p.prix, 0)
                    .toFixed(2)}€
                </p>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg border-2 border-blue-200">
                <p className="text-sm text-gray-600 mb-1">Coût pièces occasion</p>
                <p className="text-2xl font-bold text-blue-700">
                  {pieces
                    .filter(p => p.etat === 'occasion')
                    .reduce((sum, p) => sum + p.prix, 0)
                    .toFixed(2)}€
                </p>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-center text-gray-500 py-8">Aucune pièce enregistrée</p>
        )}
      </div>

      <div className="bg-gradient-to-br from-slate-50 to-slate-100 p-6 rounded-lg shadow-lg border-2 border-slate-300">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <FileText className="h-6 w-6 text-slate-600" />
            <h3 className="text-xl font-bold text-gray-900">Charges Administratives</h3>
          </div>
          {isAdmin && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition"
            >
              <Plus className="h-4 w-4" />
              Ajouter
            </button>
          )}
        </div>

        <div className="text-sm text-gray-600 mb-4 p-3 bg-slate-200 rounded-lg">
          <p>Ces charges ne sont pas incluses dans le calcul du coût de restauration.</p>
        </div>

        {chargesLoading ? (
          <p className="text-center text-gray-500 py-8">Chargement...</p>
        ) : charges.length > 0 ? (
          <div className="space-y-3">
            {charges.map(charge => (
              <div key={charge.id} className="bg-white p-4 rounded-lg border border-slate-200 flex items-center justify-between hover:shadow-md transition">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="inline-block px-2 py-1 bg-slate-100 text-slate-700 text-xs font-medium rounded">
                      {charge.charge_type}
                    </span>
                    <span className="font-medium text-gray-900">{charge.description}</span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span>{new Date(charge.date_charge).toLocaleDateString('fr-FR')}</span>
                    {charge.notes && <span className="italic">({charge.notes})</span>}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-lg font-bold text-slate-700">{charge.amount.toFixed(2)}€</span>
                  {isAdmin && (
                    <button
                      onClick={() => deleteCharge(charge.id)}
                      className="p-2 text-gray-400 hover:text-red-600 transition"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
            <div className="bg-slate-100 p-4 rounded-lg border border-slate-200 mt-4">
              <p className="text-sm text-gray-700 mb-2">Total charges administratives</p>
              <p className="text-2xl font-bold text-slate-700">
                {charges.reduce((sum, c) => sum + c.amount, 0).toFixed(2)}€
              </p>
            </div>
          </div>
        ) : (
          <p className="text-center text-gray-500 py-8">Aucune charge enregistrée</p>
        )}
      </div>

      <AdministrativeChargesModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={addCharge}
      />
    </div>
  );
}
