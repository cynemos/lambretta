import { Search, Calendar, Filter, X } from 'lucide-react';

interface TimelineFiltersProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  dateFrom: string;
  onDateFromChange: (date: string) => void;
  dateTo: string;
  onDateToChange: (date: string) => void;
  onClearFilters: () => void;
  resultsCount: number;
  totalCount: number;
}

export function TimelineFilters({
  searchTerm,
  onSearchChange,
  dateFrom,
  onDateFromChange,
  dateTo,
  onDateToChange,
  onClearFilters,
  resultsCount,
  totalCount
}: TimelineFiltersProps) {
  const hasActiveFilters = searchTerm || dateFrom || dateTo;

  return (
    <div className="bg-white rounded-xl border-4 border-amber-200 p-6 mb-8 shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-amber-900 flex items-center space-x-2">
          <Filter className="h-5 w-5" />
          <span>Rechercher dans la timeline</span>
        </h3>
        
        {hasActiveFilters && (
          <button
            onClick={onClearFilters}
            className="flex items-center space-x-1 text-amber-600 hover:text-amber-800 text-sm"
          >
            <X className="h-4 w-4" />
            <span>Effacer les filtres</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Recherche par mots-clés */}
        <div className="md:col-span-1">
          <label className="block text-amber-900 font-medium mb-2">
            <div className="flex items-center space-x-2">
              <Search className="h-4 w-4" />
              <span>Mots-clés</span>
            </div>
          </label>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Rechercher dans les commentaires..."
            className="w-full p-3 border-2 border-amber-200 rounded-lg focus:border-amber-400 focus:outline-none transition-colors"
          />
        </div>

        {/* Date de début */}
        <div>
          <label className="block text-amber-900 font-medium mb-2">
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4" />
              <span>À partir du</span>
            </div>
          </label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => onDateFromChange(e.target.value)}
            className="w-full p-3 border-2 border-amber-200 rounded-lg focus:border-amber-400 focus:outline-none transition-colors"
          />
        </div>

        {/* Date de fin */}
        <div>
          <label className="block text-amber-900 font-medium mb-2">
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4" />
              <span>Jusqu'au</span>
            </div>
          </label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => onDateToChange(e.target.value)}
            className="w-full p-3 border-2 border-amber-200 rounded-lg focus:border-amber-400 focus:outline-none transition-colors"
          />
        </div>
      </div>

      {/* Résultats */}
      {hasActiveFilters && (
        <div className="mt-4 pt-4 border-t-2 border-amber-200">
          <p className="text-amber-700 text-sm">
            <span className="font-medium">{resultsCount}</span> étape{resultsCount > 1 ? 's' : ''} trouvée{resultsCount > 1 ? 's' : ''} 
            sur <span className="font-medium">{totalCount}</span> au total
          </p>
        </div>
      )}
    </div>
  );
}
