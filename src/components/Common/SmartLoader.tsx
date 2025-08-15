import React, { useState, useEffect } from 'react';
import { RefreshCw, Wifi, WifiOff, AlertCircle, CheckCircle } from 'lucide-react';

interface SmartLoaderProps {
  isLoading: boolean;
  error?: string | null;
  progress?: number;
  stage?: string;
  retryCount?: number;
  maxRetries?: number;
  onRetry?: () => void;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  className?: string;
}

const SmartLoader: React.FC<SmartLoaderProps> = ({
  isLoading,
  error,
  progress = 0,
  stage = 'Chargement...',
  retryCount = 0,
  maxRetries = 3,
  onRetry,
  children,
  fallback,
  className = ''
}) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showDetailedError, setShowDetailedError] = useState(false);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Afficher le loader si en cours de chargement
  if (isLoading) {
    return (
      <div className={`${className}`}>
        {fallback || (
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <RefreshCw className="h-8 w-8 text-blue-600 animate-spin" />
              </div>
              
              <h3 className="text-lg font-semibold text-gray-800 mb-2">{stage}</h3>
              
              {progress > 0 && (
                <div className="max-w-xs mx-auto mb-4">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-gray-600">Progression</span>
                    <span className="font-medium text-blue-600">{Math.round(progress)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                </div>
              )}

              {retryCount > 0 && (
                <p className="text-sm text-gray-500">
                  Tentative {retryCount}/{maxRetries}
                </p>
              )}

              {!isOnline && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center justify-center space-x-2">
                    <WifiOff className="h-4 w-4 text-red-600" />
                    <span className="text-sm text-red-700">Connexion internet requise</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Afficher l'erreur si présente
  if (error) {
    return (
      <div className={`${className}`}>
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>
            
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              {!isOnline ? 'Connexion Requise' : 'Erreur de Chargement'}
            </h3>
            
            <p className="text-gray-600 mb-4">
              {!isOnline 
                ? 'Veuillez vérifier votre connexion internet'
                : showDetailedError 
                  ? error 
                  : 'Une erreur est survenue lors du chargement des données'
              }
            </p>

            {retryCount > 0 && retryCount < maxRetries && (
              <p className="text-sm text-gray-500 mb-4">
                Tentative {retryCount}/{maxRetries} - Nouvelle tentative automatique...
              </p>
            )}

            <div className="space-y-3">
              {onRetry && (
                <button
                  onClick={onRetry}
                  disabled={retryCount >= maxRetries}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 mx-auto"
                >
                  <RefreshCw className="h-4 w-4" />
                  <span>
                    {retryCount >= maxRetries ? 'Limite atteinte' : 'Réessayer'}
                  </span>
                </button>
              )}

              <button
                onClick={() => setShowDetailedError(!showDetailedError)}
                className="text-sm text-gray-500 hover:text-gray-700 underline"
              >
                {showDetailedError ? 'Masquer' : 'Voir'} les détails
              </button>

              {retryCount >= maxRetries && (
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    Si le problème persiste, veuillez contacter le support technique.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Afficher le contenu si tout va bien
  return (
    <div className={className}>
      {children}
    </div>
  );
};

// Composant pour les transitions fluides entre les états
export const SmartTransition: React.FC<{
  isLoading: boolean;
  error?: string | null;
  children: React.ReactNode;
  loadingComponent?: React.ReactNode;
  errorComponent?: React.ReactNode;
  className?: string;
}> = ({
  isLoading,
  error,
  children,
  loadingComponent,
  errorComponent,
  className = ''
}) => {
  const [showContent, setShowContent] = useState(!isLoading && !error);

  useEffect(() => {
    if (!isLoading && !error) {
      // Délai pour une transition fluide
      const timer = setTimeout(() => setShowContent(true), 100);
      return () => clearTimeout(timer);
    } else {
      setShowContent(false);
    }
  }, [isLoading, error]);

  return (
    <div className={`transition-all duration-300 ${className}`}>
      {isLoading && (loadingComponent || (
        <div className="opacity-75">
          <div className="animate-pulse">
            {children}
          </div>
        </div>
      ))}
      
      {error && (errorComponent || (
        <div className="text-center py-8">
          <AlertCircle className="h-8 w-8 text-red-600 mx-auto mb-2" />
          <p className="text-red-600">{error}</p>
        </div>
      ))}
      
      {showContent && !isLoading && !error && (
        <div className="animate-fade-in">
          {children}
        </div>
      )}
    </div>
  );
};

export default SmartLoader;