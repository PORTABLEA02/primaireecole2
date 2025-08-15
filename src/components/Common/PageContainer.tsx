import React, { Suspense } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { ConnectionIndicator, PageLoader, ErrorState } from './LoadingStates';
import { usePageLoading } from '../../hooks/usePageLoading';

interface PageContainerProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  className?: string;
  showConnectionIndicator?: boolean;
}

const PageContainer: React.FC<PageContainerProps> = ({
  children,
  title,
  description,
  loading = false,
  error = null,
  onRetry,
  className = '',
  showConnectionIndicator = true
}) => {
  // Fallback pour les erreurs React
  const ErrorFallback = ({ error, resetErrorBoundary }: any) => (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <ErrorState
        error={error.message || 'Une erreur inattendue est survenue'}
        onRetry={resetErrorBoundary}
        className="max-w-md w-full"
      />
    </div>
  );

  // Fallback pour Suspense
  const SuspenseFallback = () => (
    <PageLoader stage="Chargement du composant..." progress={50} />
  );

  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <div className={`min-h-screen bg-gray-50 ${className}`}>
        {showConnectionIndicator && <ConnectionIndicator />}
        
        {/* Header de page */}
        {(title || description) && (
          <div className="bg-white border-b border-gray-200 px-6 py-4">
            {title && (
              <h1 className="text-2xl font-bold text-gray-800">{title}</h1>
            )}
            {description && (
              <p className="text-gray-600 mt-1">{description}</p>
            )}
          </div>
        )}

        {/* Contenu principal */}
        <div className="p-6">
          {error ? (
            <ErrorState
              error={error}
              onRetry={onRetry || (() => window.location.reload())}
            />
          ) : loading ? (
            <PageLoader stage="Chargement des données..." progress={75} />
          ) : (
            <Suspense fallback={<SuspenseFallback />}>
              {children}
            </Suspense>
          )}
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default PageContainer;