import React, { createContext, useContext, useState, useEffect } from 'react';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { supabase } from '../../lib/supabase';
import { User as UserType } from '../../types/User';

interface AuthContextType {
  user: UserType | null;
  supabaseUser: SupabaseUser | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<boolean>;
  logout: () => void;
  hasPermission: (permission: string) => boolean;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<UserType | null>(null);
  const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Vérifier la session existante
    checkSession();

    // Écouter les changements d'authentification
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          await loadUserProfile(session.user);
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setSupabaseUser(null);
          setIsAuthenticated(false);
        }
        setLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const checkSession = async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) throw error;
      
      if (session?.user) {
        await loadUserProfile(session.user);
      } else {
        setLoading(false);
      }
    } catch (error) {
      console.error('Erreur de vérification de session:', error);
      setError('Erreur de vérification de session');
      setLoading(false);
    }
  };

  const loadUserProfile = async (supabaseUser: SupabaseUser) => {
    try {
      const { data: profile, error } = await supabase
        .from('user_profiles')
        .select(`
          *,
          school:schools(*)
        `)
        .eq('id', supabaseUser.id)
        .single();

      if (error) {
        console.error('Erreur lors du chargement du profil:', error);
        setError('Profil utilisateur non trouvé');
        return;
      }

      // Mapper vers notre type User
      const userData: UserType = {
        id: profile.id,
        name: profile.name,
        email: profile.email,
        role: profile.role,
        permissions: profile.permissions || [],
        schoolId: profile.school_id,
        isActive: profile.is_active,
        createdDate: profile.created_at,
        lastLogin: profile.last_login
      };

      setUser(userData);
      setSupabaseUser(supabaseUser);
      setIsAuthenticated(true);
      setError(null);

      // Mettre à jour la dernière connexion
      await supabase
        .from('user_profiles')
        .update({ last_login: new Date().toISOString() })
        .eq('id', supabaseUser.id);

    } catch (error) {
      console.error('Erreur lors du chargement du profil:', error);
      setError('Erreur lors du chargement du profil utilisateur');
    }
  };

  const login = async (email: string, password: string, rememberMe: boolean = false): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        console.error('Erreur de connexion:', error);
        
        // Messages d'erreur personnalisés
        if (error.message.includes('Invalid login credentials')) {
          setError('Email ou mot de passe incorrect');
        } else if (error.message.includes('Email not confirmed')) {
          setError('Veuillez confirmer votre email avant de vous connecter');
        } else {
          setError(error.message);
        }
        
        return false;
      }

      if (data.user) {
        await loadUserProfile(data.user);
        return true;
      }

      return false;
    } catch (error: any) {
      console.error('Erreur lors de la connexion:', error);
      setError(error.message || 'Erreur de connexion');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setLoading(true);
      
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('Erreur de déconnexion:', error);
        setError('Erreur lors de la déconnexion');
      }

      setUser(null);
      setSupabaseUser(null);
      setIsAuthenticated(false);
    } catch (error: any) {
      console.error('Erreur lors de la déconnexion:', error);
      setError(error.message || 'Erreur de déconnexion');
    } finally {
      setLoading(false);
    }
  };

  const hasPermission = (permission: string): boolean => {
    if (!user) return false;
    if (user.permissions.includes('all')) return true;
    return user.permissions.includes(permission);
  };

  const value: AuthContextType = {
    user,
    supabaseUser,
    isAuthenticated,
    loading,
    login,
    logout,
    hasPermission,
    error
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};