import { useEffect, useCallback } from 'react';
import { useAuth } from '../components/Auth/AuthProvider';
import { supabase } from '../lib/supabase';

export const useSessionManager = () => {
  const { refreshSession, logout, isAuthenticated } = useAuth();

  // Vérifier périodiquement la validité de la session
  const checkSessionValidity = useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Erreur lors de la vérification de session:', error);
        return;
      }

      if (!session) {
        console.log('Aucune session active trouvée');
        await logout();
        return;
      }

      // Vérifier si le token expire bientôt (dans les 5 prochaines minutes)
      const expiresAt = session.expires_at;
      if (expiresAt) {
        const now = Math.floor(Date.now() / 1000);
        const timeUntilExpiry = expiresAt - now;
        
        // Si le token expire dans moins de 5 minutes, le rafraîchir
        if (timeUntilExpiry < 300) {
          console.log('Token expire bientôt, rafraîchissement...');
          const refreshSuccess = await refreshSession();
          
          if (!refreshSuccess) {
            console.log('Échec du rafraîchissement, déconnexion...');
            await logout();
          }
        }
      }
    } catch (error) {
      console.error('Erreur lors de la vérification de session:', error);
    }
  }, [isAuthenticated, refreshSession, logout]);

  // Vérifier la session toutes les 2 minutes
  useEffect(() => {
    if (!isAuthenticated) return;

    const interval = setInterval(checkSessionValidity, 2 * 60 * 1000);
    
    // Vérification initiale
    checkSessionValidity();

    return () => clearInterval(interval);
  }, [isAuthenticated, checkSessionValidity]);

  // Gérer la visibilité de la page (rafraîchir quand l'utilisateur revient)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && isAuthenticated) {
        checkSessionValidity();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isAuthenticated, checkSessionValidity]);

  // Gérer la reconnexion réseau
  useEffect(() => {
    const handleOnline = () => {
      if (isAuthenticated) {
        console.log('Connexion réseau rétablie, vérification de session...');
        checkSessionValidity();
      }
    };

    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [isAuthenticated, checkSessionValidity]);

  return {
    checkSessionValidity,
    refreshSession
  };
};