import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Search, Filter, RefreshCw, Download } from 'lucide-react';
import { useOptimizedSearch, useOptimizedPagination } from '../../hooks/useOptimizedData';
import { SkeletonTable, EmptyState, InlineLoader } from './LoadingStates';

interface Column<T> {
  key: keyof T;
  label: string;
  render?: (value: any, item: T) => React.ReactNode;
  sortable?: boolean;
  searchable?: boolean;
  width?: string;
}

interface OptimizedDataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  onRefresh?: () => void;
  onExport?: () => void;
  pageSize?: number;
  searchPlaceholder?: string;
  emptyState?: {
    icon: React.ComponentType<{ className?: string }>;
    title: string;
    description: string;
    action?: {
      label: string;
      onClick: () => void;
    };
  };
  actions?: (item: T) => React.ReactNode;
  className?: string;
}

export function OptimizedDataTable<T extends Record<string, any>>({
  data,
  columns,
  isLoading = false,
  error = null,
  onRetry,
  onRefresh,
  onExport,
  pageSize = 50,
  searchPlaceholder = "Rechercher...",
  emptyState,
  actions,
  className = ''
}: OptimizedDataTableProps<T>) {
  const [sortConfig, setSortConfig] = useState<{
    key: keyof T | null;
    direction: 'asc' | 'desc';
  }>({ key: null, direction: 'asc' });

  // Recherche optimisée
  const searchableFields = useMemo(() => 
    columns.filter(col => col.searchable !== false).map(col => col.key),
    [columns]
  );

  const { searchTerm, setSearchTerm, filteredData, isSearching } = useOptimizedSearch(
    data,
    searchableFields
  );

  // Tri optimisé
  const sortedData = useMemo(() => {
    if (!sortConfig.key) return filteredData;

    return [...filteredData].sort((a, b) => {
      const aValue = a[sortConfig.key!];
      const bValue = b[sortConfig.key!];

      if (aValue === bValue) return 0;

      const comparison = aValue < bValue ? -1 : 1;
      return sortConfig.direction === 'desc' ? -comparison : comparison;
    });
  }, [filteredData, sortConfig]);

  // Pagination optimisée
  const {
    paginatedData,
    paginationInfo,
    goToPage,
    nextPage,
    previousPage
  } = useOptimizedPagination(sortedData, pageSize);

  // Fonction de tri
  const handleSort = (key: keyof T) => {
    const column = columns.find(col => col.key === key);
    if (!column?.sortable) return;

    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  // Rendu conditionnel pour les états de chargement et d'erreur
  if (isLoading && data.length === 0) {
    return <SkeletonTable rows={pageSize} columns={columns.length} />;
  }

  if (error && data.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-red-600 text-2xl">⚠️</span>
          </div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Erreur de Chargement</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Réessayer
            </button>
          )}
        </div>
      </div>
    );
  }

  if (data.length === 0 && !isLoading) {
    return emptyState ? (
      <EmptyState
        icon={emptyState.icon}
        title={emptyState.title}
        description={emptyState.description}
        action={emptyState.action}
      />
    ) : (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
        <p className="text-gray-500">Aucune donnée disponible</p>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden ${className}`}>
      {/* Header avec recherche et actions */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder={searchPlaceholder}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-64"
              />
              {isSearching && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <InlineLoader size="sm" />
                </div>
              )}
            </div>
            
            {searchTerm && (
              <div className="text-sm text-gray-500">
                {filteredData.length} résultat(s) sur {data.length}
              </div>
            )}
          </div>

          <div className="flex items-center space-x-2">
            {onRefresh && (
              <button
                onClick={onRefresh}
                disabled={isLoading}
                className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                title="Actualiser"
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
            )}
            
            {onExport && (
              <button
                onClick={onExport}
                className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors flex items-center space-x-2"
              >
                <Download className="h-4 w-4" />
                <span>Exporter</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              {columns.map((column) => (
                <th
                  key={String(column.key)}
                  onClick={() => column.sortable !== false && handleSort(column.key)}
                  className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase ${
                    column.sortable !== false ? 'cursor-pointer hover:bg-gray-100' : ''
                  } ${column.width || ''}`}
                >
                  <div className="flex items-center space-x-1">
                    <span>{column.label}</span>
                    {column.sortable !== false && sortConfig.key === column.key && (
                      <span className="text-blue-600">
                        {sortConfig.direction === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
              ))}
              {actions && (
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {paginatedData.map((item, index) => (
              <tr key={index} className="hover:bg-gray-50 transition-colors">
                {columns.map((column) => (
                  <td key={String(column.key)} className="px-6 py-4">
                    {column.render 
                      ? column.render(item[column.key], item)
                      : String(item[column.key] || '')
                    }
                  </td>
                ))}
                {actions && (
                  <td className="px-6 py-4">
                    {actions(item)}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {paginationInfo.totalPages > 1 && (
        <div className="p-6 border-t border-gray-100">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500">
              Affichage de {paginationInfo.startIndex} à {paginationInfo.endIndex} sur {paginationInfo.totalItems} résultats
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={previousPage}
                disabled={!paginationInfo.hasPreviousPage}
                className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              
              <div className="flex items-center space-x-1">
                {Array.from({ length: Math.min(5, paginationInfo.totalPages) }, (_, i) => {
                  const page = i + 1;
                  const isActive = page === paginationInfo.currentPage;
                  
                  return (
                    <button
                      key={page}
                      onClick={() => goToPage(page)}
                      className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-blue-600 text-white'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      {page}
                    </button>
                  );
                })}
                
                {paginationInfo.totalPages > 5 && (
                  <>
                    <span className="text-gray-400">...</span>
                    <button
                      onClick={() => goToPage(paginationInfo.totalPages)}
                      className="px-3 py-1 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
                    >
                      {paginationInfo.totalPages}
                    </button>
                  </>
                )}
              </div>
              
              <button
                onClick={nextPage}
                disabled={!paginationInfo.hasNextPage}
                className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Indicateur de chargement en cours */}
      {isLoading && data.length > 0 && (
        <div className="absolute top-0 left-0 right-0 bg-blue-600 h-1">
          <div className="bg-blue-400 h-1 animate-pulse"></div>
        </div>
      )}
    </div>
  );
}