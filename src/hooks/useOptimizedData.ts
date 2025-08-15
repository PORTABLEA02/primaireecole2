import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../components/Auth/AuthProvider';
import { usePageLoading } from './usePageLoading';

interface DataCache<T> {
  data: T;
  timestamp: number;
  dependencies: string;
}

interface UseOptimizedDataOptions<T> {
  cacheKey: string;
  cacheDuration?: number;
  dependencies?: any[];
  transform?: (data: any) => T;
  filter?: (data: T) => T;
  sort?: (a: any, b: any) => number;
  enableRealTime?: boolean;
  onDataChange?: (data: T) => void;
}

export const useOptimizedData = <T>(
  loadFunction: () => Promise<T>,
  options: UseOptimizedDataOptions<T>
) => {
  const {
    cacheKey,
    cacheDuration = 5 * 60 * 1000, // 5 minutes
    dependencies = [],
    transform,
    filter,
    sort,
    enableRealTime = false,
    onDataChange
  } = options;

  const { userSchool, currentAcademicYear } = useAuth();
  const [cache, setCache] = useState<Map<string, DataCache<T>>>(new Map());

  // Créer une clé de cache unique basée sur les dépendances
  const fullCacheKey = useMemo(() => {
    const depString = JSON.stringify([
      userSchool?.id,
      currentAcademicYear?.id,
      ...dependencies
    ]);
    return `${cacheKey}_${btoa(depString).slice(0, 10)}`;
  }, [cacheKey, userSchool?.id, currentAcademicYear?.id, ...dependencies]);

  // Fonction de chargement optimisée
  const optimizedLoadFunction = useCallback(async (): Promise<T> => {
    // Vérifier le cache d'abord
    const cached = cache.get(fullCacheKey);
    if (cached && Date.now() - cached.timestamp < cacheDuration) {
      return cached.data;
    }

    // Charger les données
    let rawData = await loadFunction();

    // Appliquer les transformations
    if (transform) {
      rawData = transform(rawData);
    }

    if (filter) {
      rawData = filter(rawData);
    }

    if (sort && Array.isArray(rawData)) {
      (rawData as any[]).sort(sort);
    }

    // Mettre en cache
    setCache(prev => new Map(prev).set(fullCacheKey, {
      data: rawData,
      timestamp: Date.now(),
      dependencies: JSON.stringify(dependencies)
    }));

    // Notifier le changement
    if (onDataChange) {
      onDataChange(rawData);
    }

    return rawData;
  }, [loadFunction, transform, filter, sort, fullCacheKey, cacheDuration, dependencies, onDataChange]);

  // Utiliser le hook de chargement de page
  const {
    data,
    isLoading,
    error,
    progress,
    stage,
    retry,
    refresh
  } = usePageLoading(optimizedLoadFunction, {
    dependencies,
    enableCache: true,
    cacheKey: fullCacheKey,
    cacheDuration
  });

  // Fonction pour invalider le cache
  const invalidateCache = useCallback(() => {
    setCache(prev => {
      const newCache = new Map(prev);
      newCache.delete(fullCacheKey);
      return newCache;
    });
  }, [fullCacheKey]);

  // Fonction pour rafraîchir avec invalidation du cache
  const forceRefresh = useCallback(() => {
    invalidateCache();
    refresh();
  }, [invalidateCache, refresh]);

  // Nettoyage automatique du cache expiré
  useEffect(() => {
    const cleanupInterval = setInterval(() => {
      setCache(prev => {
        const newCache = new Map();
        const now = Date.now();
        
        prev.forEach((value, key) => {
          if (now - value.timestamp < cacheDuration) {
            newCache.set(key, value);
          }
        });
        
        return newCache;
      });
    }, 60000); // Nettoyer toutes les minutes

    return () => clearInterval(cleanupInterval);
  }, [cacheDuration]);

  // Mise à jour en temps réel (si activée)
  useEffect(() => {
    if (!enableRealTime || !data) return;

    // Ici vous pouvez implémenter la logique de mise à jour en temps réel
    // Par exemple, écouter les changements Supabase
    
    return () => {
      // Cleanup des listeners
    };
  }, [enableRealTime, data]);

  return {
    data,
    isLoading,
    error,
    progress,
    stage,
    retry,
    refresh,
    forceRefresh,
    invalidateCache,
    isCached: cache.has(fullCacheKey)
  };
};

// Hook pour la recherche optimisée
export const useOptimizedSearch = <T>(
  data: T[],
  searchFields: (keyof T)[],
  debounceMs: number = 300
) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

  // Debounce du terme de recherche
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [searchTerm, debounceMs]);

  // Filtrage optimisé avec useMemo
  const filteredData = useMemo(() => {
    if (!debouncedSearchTerm.trim()) return data;

    const searchLower = debouncedSearchTerm.toLowerCase();
    
    return data.filter(item => {
      return searchFields.some(field => {
        const value = item[field];
        if (typeof value === 'string') {
          return value.toLowerCase().includes(searchLower);
        }
        if (typeof value === 'number') {
          return value.toString().includes(searchLower);
        }
        return false;
      });
    });
  }, [data, debouncedSearchTerm, searchFields]);

  return {
    searchTerm,
    setSearchTerm,
    filteredData,
    isSearching: searchTerm !== debouncedSearchTerm
  };
};

// Hook pour la pagination optimisée
export const useOptimizedPagination = <T>(
  data: T[],
  pageSize: number = 50
) => {
  const [currentPage, setCurrentPage] = useState(1);

  // Calculer les données paginées
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return data.slice(startIndex, endIndex);
  }, [data, currentPage, pageSize]);

  // Calculer les informations de pagination
  const paginationInfo = useMemo(() => {
    const totalPages = Math.ceil(data.length / pageSize);
    const hasNextPage = currentPage < totalPages;
    const hasPreviousPage = currentPage > 1;
    
    return {
      totalItems: data.length,
      totalPages,
      currentPage,
      pageSize,
      hasNextPage,
      hasPreviousPage,
      startIndex: (currentPage - 1) * pageSize + 1,
      endIndex: Math.min(currentPage * pageSize, data.length)
    };
  }, [data.length, currentPage, pageSize]);

  // Fonctions de navigation
  const goToPage = useCallback((page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, paginationInfo.totalPages)));
  }, [paginationInfo.totalPages]);

  const nextPage = useCallback(() => {
    if (paginationInfo.hasNextPage) {
      setCurrentPage(prev => prev + 1);
    }
  }, [paginationInfo.hasNextPage]);

  const previousPage = useCallback(() => {
    if (paginationInfo.hasPreviousPage) {
      setCurrentPage(prev => prev - 1);
    }
  }, [paginationInfo.hasPreviousPage]);

  // Reset de la pagination quand les données changent
  useEffect(() => {
    setCurrentPage(1);
  }, [data.length]);

  return {
    paginatedData,
    paginationInfo,
    goToPage,
    nextPage,
    previousPage,
    setCurrentPage
  };
};