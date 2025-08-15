// Utilitaires pour optimiser les performances de chargement

export class PerformanceOptimizer {
  private static cache = new Map<string, any>();
  private static pendingRequests = new Map<string, Promise<any>>();

  // Debounce pour les recherches
  static debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
  ): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout;
    
    return (...args: Parameters<T>) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  }

  // Throttle pour les événements fréquents
  static throttle<T extends (...args: any[]) => any>(
    func: T,
    limit: number
  ): (...args: Parameters<T>) => void {
    let inThrottle: boolean;
    
    return (...args: Parameters<T>) => {
      if (!inThrottle) {
        func(...args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }

  // Mise en cache intelligente avec déduplication des requêtes
  static async memoizedRequest<T>(
    key: string,
    requestFn: () => Promise<T>,
    ttl: number = 5 * 60 * 1000 // 5 minutes par défaut
  ): Promise<T> {
    // Vérifier le cache
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < ttl) {
      return cached.data;
    }

    // Vérifier si une requête est déjà en cours
    const pendingRequest = this.pendingRequests.get(key);
    if (pendingRequest) {
      return pendingRequest;
    }

    // Créer et exécuter la requête
    const request = requestFn()
      .then(data => {
        // Mettre en cache
        this.cache.set(key, {
          data,
          timestamp: Date.now()
        });
        
        // Nettoyer les requêtes en cours
        this.pendingRequests.delete(key);
        
        return data;
      })
      .catch(error => {
        // Nettoyer les requêtes en cours même en cas d'erreur
        this.pendingRequests.delete(key);
        throw error;
      });

    // Stocker la requête en cours
    this.pendingRequests.set(key, request);
    
    return request;
  }

  // Préchargement intelligent basé sur les patterns d'usage
  static preloadByUsagePattern(
    userRole: string,
    currentRoute: string,
    preloadFunctions: Record<string, () => Promise<any>>
  ) {
    const patterns: Record<string, string[]> = {
      'Admin': ['students', 'teachers', 'classes', 'finance'],
      'Directeur': ['students', 'teachers', 'classes', 'academic'],
      'Secrétaire': ['students', 'classes'],
      'Enseignant': ['academic', 'students'],
      'Comptable': ['finance', 'students']
    };

    const routePatterns: Record<string, string[]> = {
      'dashboard': ['students', 'finance'],
      'students': ['classes', 'finance'],
      'teachers': ['classes'],
      'classes': ['teachers', 'students'],
      'finance': ['students'],
      'academic': ['students', 'classes']
    };

    // Combiner les patterns par rôle et route
    const toPreload = [
      ...(patterns[userRole] || []),
      ...(routePatterns[currentRoute] || [])
    ];

    // Précharger de manière asynchrone
    toPreload.forEach(key => {
      if (preloadFunctions[key]) {
        setTimeout(() => {
          preloadFunctions[key]().catch(() => {
            // Ignorer les erreurs de préchargement
          });
        }, Math.random() * 1000); // Étaler les requêtes
      }
    });
  }

  // Optimisation des images
  static preloadImage(src: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve();
      img.onerror = reject;
      img.src = src;
    });
  }

  // Lazy loading avec intersection observer
  static createLazyLoader(
    callback: () => void,
    options: IntersectionObserverInit = {}
  ): IntersectionObserver {
    return new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          callback();
        }
      });
    }, {
      rootMargin: '50px',
      threshold: 0.1,
      ...options
    });
  }

  // Optimisation des listes virtuelles
  static calculateVisibleItems(
    containerHeight: number,
    itemHeight: number,
    scrollTop: number,
    buffer: number = 5
  ) {
    const visibleCount = Math.ceil(containerHeight / itemHeight);
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - buffer);
    const endIndex = Math.min(startIndex + visibleCount + buffer * 2);

    return { startIndex, endIndex, visibleCount };
  }

  // Nettoyage automatique du cache
  static startCacheCleanup(interval: number = 10 * 60 * 1000) { // 10 minutes
    setInterval(() => {
      const now = Date.now();
      const maxAge = 30 * 60 * 1000; // 30 minutes

      this.cache.forEach((value, key) => {
        if (now - value.timestamp > maxAge) {
          this.cache.delete(key);
        }
      });
    }, interval);
  }

  // Mesure des performances
  static measurePerformance<T>(
    name: string,
    fn: () => Promise<T>
  ): Promise<T> {
    const start = performance.now();
    
    return fn().then(result => {
      const end = performance.now();
      const duration = end - start;
      
      console.log(`Performance [${name}]: ${duration.toFixed(2)}ms`);
      
      // Logger les performances lentes
      if (duration > 1000) {
        console.warn(`Slow operation detected [${name}]: ${duration.toFixed(2)}ms`);
      }
      
      return result;
    });
  }

  // Optimisation des requêtes batch
  static batchRequests<T>(
    requests: Array<() => Promise<T>>,
    batchSize: number = 5,
    delay: number = 100
  ): Promise<T[]> {
    return new Promise(async (resolve, reject) => {
      const results: T[] = [];
      const errors: any[] = [];

      for (let i = 0; i < requests.length; i += batchSize) {
        const batch = requests.slice(i, i + batchSize);
        
        try {
          const batchResults = await Promise.allSettled(
            batch.map(request => request())
          );

          batchResults.forEach(result => {
            if (result.status === 'fulfilled') {
              results.push(result.value);
            } else {
              errors.push(result.reason);
            }
          });

          // Délai entre les batches pour éviter la surcharge
          if (i + batchSize < requests.length) {
            await new Promise(resolve => setTimeout(resolve, delay));
          }
        } catch (error) {
          errors.push(error);
        }
      }

      if (errors.length > 0 && results.length === 0) {
        reject(errors[0]);
      } else {
        resolve(results);
      }
    });
  }

  // Détection de la vitesse de connexion
  static async detectConnectionSpeed(): Promise<'slow' | 'medium' | 'fast'> {
    if (!navigator.connection) {
      return 'medium'; // Valeur par défaut
    }

    const connection = (navigator as any).connection;
    const effectiveType = connection.effectiveType;

    switch (effectiveType) {
      case 'slow-2g':
      case '2g':
        return 'slow';
      case '3g':
        return 'medium';
      case '4g':
      default:
        return 'fast';
    }
  }

  // Adaptation du comportement selon la vitesse de connexion
  static async adaptToConnectionSpeed<T>(
    fastFn: () => Promise<T>,
    mediumFn: () => Promise<T>,
    slowFn: () => Promise<T>
  ): Promise<T> {
    const speed = await this.detectConnectionSpeed();
    
    switch (speed) {
      case 'slow':
        return slowFn();
      case 'medium':
        return mediumFn();
      case 'fast':
      default:
        return fastFn();
    }
  }

  // Préchargement conditionnel
  static conditionalPreload(
    condition: () => boolean,
    preloadFn: () => Promise<any>,
    delay: number = 1000
  ) {
    if (condition()) {
      setTimeout(() => {
        preloadFn().catch(() => {
          // Ignorer les erreurs de préchargement
        });
      }, delay);
    }
  }

  // Optimisation de la mémoire
  static limitCacheSize(maxSize: number = 100) {
    if (this.cache.size > maxSize) {
      // Supprimer les entrées les plus anciennes
      const entries = Array.from(this.cache.entries());
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
      
      const toDelete = entries.slice(0, entries.length - maxSize);
      toDelete.forEach(([key]) => this.cache.delete(key));
    }
  }
}

// Initialiser le nettoyage automatique du cache
PerformanceOptimizer.startCacheCleanup();