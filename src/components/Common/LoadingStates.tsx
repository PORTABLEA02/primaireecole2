import React from 'react';
import { RefreshCw, AlertCircle, Wifi, WifiOff } from 'lucide-react';

// Composant de skeleton pour les cartes
export const SkeletonCard: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`bg-white rounded-xl p-6 shadow-sm border border-gray-100 animate-pulse ${className}`}>
    <div className="flex items-center justify-between">
      <div className="space-y-2">
        <div className="h-4 bg-gray-200 rounded w-24"></div>
        <div className="h-8 bg-gray-200 rounded w-32"></div>
      </div>
      <div className="w-12 h-12 bg-gray-200 rounded-xl"></div>
    </div>
    <div className="mt-4 h-4 bg-gray-200 rounded w-20"></div>
  </div>
);

// Composant de skeleton pour les tableaux
export const SkeletonTable: React.FC<{ rows?: number; columns?: number }> = ({ 
  rows = 5, 
  columns = 4 
}) => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
    <div className="p-6 border-b border-gray-100">
      <div className="h-6 bg-gray-200 rounded w-48 animate-pulse"></div>
    </div>
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50">
          <tr>
            {Array.from({ length: columns }).map((_, index) => (
              <th key={index} className="px-6 py-3">
                <div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <tr key={rowIndex}>
              {Array.from({ length: columns }).map((_, colIndex) => (
                <td key={colIndex} className="px-6 py-4">
                  <div className="h-4 bg-gray-200 rounded w-full animate-pulse"></div>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

// Composant de skeleton pour les listes
export const SkeletonList: React.FC<{ items?: number }> = ({ items = 5 }) => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
    <div className="h-6 bg-gray-200 rounded w-32 mb-4 animate-pulse"></div>
    <div className="space-y-3">
      {Array.from({ length: items }).map((_, index) => (
        <div key={index} className="flex items-center space-x-3 p-3 animate-pulse">
          <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
          </div>
          <div className="h-6 bg-gray-200 rounded w-20"></div>
        </div>
      ))}
    </div>
  </div>
);

// Composant de chargement avec progression
export const ProgressLoader: React.FC<{
  progress: number;
  stage: string;
  className?: string;
}> = ({ progress, stage, className = '' }) => (
  <div className={`bg-white rounded-xl p-6 shadow-sm border border-gray-100 ${className}`}>
    <div className="text-center">
      <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <RefreshCw className="h-8 w-8 text-blue-600 animate-spin" />
      </div>
      <h3 className="text-lg font-semibold text-gray-800 mb-2">{stage}</h3>
      <div className="max-w-xs mx-auto">
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
    </div>
  </div>
);

// Composant d'erreur avec retry
export const ErrorState: React.FC<{
  error: string;
  onRetry: () => void;
  retryCount?: number;
  maxRetries?: number;
  className?: string;
}> = ({ error, onRetry, retryCount = 0, maxRetries = 3, className = '' }) => (
  <div className={`bg-white rounded-xl p-6 shadow-sm border border-gray-100 ${className}`}>
    <div className="text-center">
      <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <AlertCircle className="h-8 w-8 text-red-600" />
      </div>
      <h3 className="text-lg font-semibold text-gray-800 mb-2">Erreur de Chargement</h3>
      <p className="text-gray-600 mb-4">{error}</p>
      
      {retryCount > 0 && (
        <p className="text-sm text-gray-500 mb-4">
          Tentative {retryCount}/{maxRetries}
        </p>
      )}
      
      <div className="space-y-3">
        <button
          onClick={onRetry}
          disabled={retryCount >= maxRetries}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 mx-auto"
        >
          <RefreshCw className="h-4 w-4" />
          <span>Réessayer</span>
        </button>
        
        {retryCount >= maxRetries && (
          <p className="text-sm text-red-600">
            Nombre maximum de tentatives atteint. Veuillez vérifier votre connexion.
          </p>
        )}
      </div>
    </div>
  </div>
);

// Composant d'état vide
export const EmptyState: React.FC<{
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
    icon?: React.ComponentType<{ className?: string }>;
  };
  className?: string;
}> = ({ icon: Icon, title, description, action, className = '' }) => (
  <div className={`bg-white rounded-xl p-6 shadow-sm border border-gray-100 ${className}`}>
    <div className="text-center">
      <Icon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
      <h3 className="text-lg font-medium text-gray-800 mb-2">{title}</h3>
      <p className="text-gray-600 mb-4">{description}</p>
      
      {action && (
        <button
          onClick={action.onClick}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 mx-auto"
        >
          {action.icon && <action.icon className="h-5 w-5" />}
          <span>{action.label}</span>
        </button>
      )}
    </div>
  </div>
);

// Composant d'indicateur de connexion
export const ConnectionIndicator: React.FC = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

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

  if (isOnline) return null;

  return (
    <div className="fixed top-4 right-4 z-50 bg-red-600 text-white px-4 py-2 rounded-lg shadow-lg flex items-center space-x-2">
      <WifiOff className="h-4 w-4" />
      <span className="text-sm font-medium">Hors ligne</span>
    </div>
  );
};

// Composant de chargement inline
export const InlineLoader: React.FC<{
  size?: 'sm' | 'md' | 'lg';
  message?: string;
}> = ({ size = 'md', message }) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8'
  };

  return (
    <div className="flex items-center justify-center space-x-2">
      <RefreshCw className={`${sizeClasses[size]} text-blue-600 animate-spin`} />
      {message && (
        <span className="text-gray-600 text-sm">{message}</span>
      )}
    </div>
  );
};

// Composant de chargement de page complète
export const PageLoader: React.FC<{
  stage: string;
  progress: number;
}> = ({ stage, progress }) => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center">
    <div className="text-center">
      <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <RefreshCw className="h-10 w-10 text-blue-600 animate-spin" />
      </div>
      <h2 className="text-xl font-semibold text-gray-800 mb-2">{stage}</h2>
      <div className="max-w-sm mx-auto">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="text-gray-600">Chargement</span>
          <span className="font-medium text-blue-600">{Math.round(progress)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>
    </div>
  </div>
);