import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../components/Auth/AuthProvider';

interface PageLoadingState {
  isLoading: boolean;
  error: string | null;
  progress: number;
  stage: string;
  retryCount: number;
}

interface UsePageLoadingOptions {
  dependencies?: any[];
  enableCache?: boolean;
  cacheKey?: string;
  cacheDuration?: number; // en millisecondes
  retryAttempts?: number;
  retryDelay?: number;
  onSuccess?: (data: any) => void;
  onError?: (error: any) => void;
}

export const usePageLoading = <T>(
  loadFunction: () => Promise<T>,
  options: UsePageLoadingOptions = {}
) => {
  const {
    dependencies = [],
    enableCache = true,
    cacheKey,
    cacheDuration = 5 * 60 * 1000, // 5 minutes par défaut
    retryAttempts = 3,
    retryDelay = 1000,
    onSuccess,
    onError
  } = options;

  const { isAuthenticated } = useAuth();
  const [state, setState] = useState<PageLoadingState>({
    isLoading: false,
    error: null,
    progress: 0,
    stage: 'Initialisation...',
    retryCount: 0
  });

  const [data, setData] = useState<T | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const cacheRef = useRef<Map<string, { data: T; timestamp: number }>>(new Map());

  // Fonction pour obtenir les données du cache
  const getCachedData = useCallback((key: string): T | null => {
    if (!enableCache || !key) return null;
    
    const cached = cacheRef.current.get(key);
    if (!cached) return null;
    
    const isExpired = Date.now() - cached.timestamp > cacheDuration;
    if (isExpired) {
      cacheRef.current.delete(key);
      return null;
    }
    
    return cached.data;
  }, [enableCache, cacheDuration]);

  // Fonction pour mettre en cache
  const setCachedData = useCallback((key: string, data: T) => {
    if (!enableCache || !key) return;
    
    cacheRef.current.set(key, {
      data,
      timestamp: Date.now()
    });
  }, [enableCache]);

  // Fonction de chargement avec retry et cache
  const loadData = useCallback(async (retryCount = 0) => {
    // Vérifier le cache d'abord
    if (cacheKey) {
      const cachedData = getCachedData(cacheKey);
      if (cachedData) {
        setData(cachedData);
        setState(prev => ({ ...prev, isLoading: false, error: null }));
        onSuccess?.(cachedData);
        return;
      }
    }

    // Annuler la requête précédente si elle existe
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Créer un nouveau controller pour cette requête
    abortControllerRef.current = new AbortController();

    setState(prev => ({
      ...prev,
      isLoading: true,
      error: null,
      progress: 0,
      stage: 'Chargement des données...',
      retryCount
    }));

    try {
      // Simulation du progrès
      const progressInterval = setInterval(() => {
        setState(prev => ({
          ...prev,
          progress: Math.min(prev.progress + 10, 90)
        }));
      }, 200);

      // Exécuter la fonction de chargement
      const result = await loadFunction();

      // Nettoyer l'intervalle de progrès
      clearInterval(progressInterval);

      // Vérifier si la requête a été annulée
      if (abortControllerRef.current?.signal.aborted) {
        return;
      }

      // Mettre en cache si nécessaire
      if (cacheKey) {
        setCachedData(cacheKey, result);
      }

      // Mettre à jour l'état
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: null,
        progress: 100,
        stage: 'Terminé',
        retryCount: 0
      }));

      setData(result);
      onSuccess?.(result);

    } catch (error: any) {
      // Vérifier si la requête a été annulée
      if (abortControllerRef.current?.signal.aborted) {
        return;
      }

      console.error('Erreur lors du chargement:', error);

      // Retry logic
      if (retryCount < retryAttempts && !error.message?.includes('abort')) {
        setState(prev => ({
          ...prev,
          stage: `Nouvelle tentative (${retryCount + 1}/${retryAttempts})...`,
          retryCount: retryCount + 1
        }));

        setTimeout(() => {
          loadData(retryCount + 1);
        }, retryDelay * (retryCount + 1)); // Délai exponentiel
      } else {
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: error.message || 'Erreur lors du chargement',
          progress: 0,
          stage: 'Erreur'
        }));

        onError?.(error);
      }
    }
  }, [loadFunction, cacheKey, getCachedData, setCachedData, retryAttempts, retryDelay, onSuccess, onError]);

  // Fonction de retry manuelle
  const retry = useCallback(() => {
    loadData(0);
  }, [loadData]);

  // Fonction pour vider le cache
  const clearCache = useCallback(() => {
    if (cacheKey) {
      cacheRef.current.delete(cacheKey);
    }
  }, [cacheKey]);

  // Fonction pour rafraîchir les données
  const refresh = useCallback(() => {
    clearCache();
    loadData(0);
  }, [clearCache, loadData]);

  // Charger les données quand les dépendances changent
  useEffect(() => {
    if (isAuthenticated) {
      loadData(0);
    }

    // Cleanup function
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [isAuthenticated, ...dependencies]);

  // Nettoyer à la destruction du composant
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    data,
    isLoading: state.isLoading,
    error: state.error,
    progress: state.progress,
    stage: state.stage,
    retryCount: state.retryCount,
    retry,
    refresh,
    clearCache
  };
};

// Hook spécialisé pour les listes avec pagination
export const usePagedLoading = <T>(
  loadFunction: (page: number, pageSize: number) => Promise<{ data: T[]; hasMore: boolean; total: number }>,
  options: UsePageLoadingOptions & { pageSize?: number } = {}
) => {
  const { pageSize = 50, ...loadingOptions } = options;
  const [page, setPage] = useState(1);
  const [allData, setAllData] = useState<T[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [total, setTotal] = useState(0);

  const pagedLoadFunction = useCallback(async () => {
    const result = await loadFunction(page, pageSize);
    
    if (page === 1) {
      setAllData(result.data);
    } else {
      setAllData(prev => [...prev, ...result.data]);
    }
    
    setHasMore(result.hasMore);
    setTotal(result.total);
    
    return result;
  }, [loadFunction, page, pageSize]);

  const {
    isLoading,
    error,
    progress,
    stage,
    retry,
    refresh
  } = usePageLoading(pagedLoadFunction, {
    ...loadingOptions,
    dependencies: [page, ...loadingOptions.dependencies || []]
  });

  const loadMore = useCallback(() => {
    if (!isLoading && hasMore) {
      setPage(prev => prev + 1);
    }
  }, [isLoading, hasMore]);

  const reset = useCallback(() => {
    setPage(1);
    setAllData([]);
    setHasMore(true);
    setTotal(0);
  }, []);

  return {
    data: allData,
    isLoading,
    error,
    progress,
    stage,
    hasMore,
    total,
    currentPage: page,
    loadMore,
    retry,
    refresh,
    reset
  };
};