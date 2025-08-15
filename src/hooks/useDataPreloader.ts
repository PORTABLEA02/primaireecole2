import { useEffect, useCallback } from 'react';
import { useAuth } from '../components/Auth/AuthProvider';
import { StudentService } from '../services/studentService';
import { TeacherService } from '../services/teacherService';
import { ClassService } from '../services/classService';
import { PaymentService } from '../services/paymentService';

interface PreloadConfig {
  preloadStudents?: boolean;
  preloadTeachers?: boolean;
  preloadClasses?: boolean;
  preloadPayments?: boolean;
  preloadOnIdle?: boolean;
  priority?: 'high' | 'medium' | 'low';
}

export const useDataPreloader = (config: PreloadConfig = {}) => {
  const {
    preloadStudents = true,
    preloadTeachers = true,
    preloadClasses = true,
    preloadPayments = false,
    preloadOnIdle = true,
    priority = 'medium'
  } = config;

  const { userSchool, currentAcademicYear, isAuthenticated } = useAuth();

  // Cache pour les données préchargées
  const preloadCache = new Map<string, { data: any; timestamp: number }>();

  // Fonction de préchargement
  const preloadData = useCallback(async () => {
    if (!isAuthenticated || !userSchool || !currentAcademicYear) return;

    const preloadPromises: Promise<any>[] = [];

    try {
      // Précharger les élèves
      if (preloadStudents) {
        preloadPromises.push(
          StudentService.getStudents(userSchool.id, currentAcademicYear.id)
            .then(data => {
              preloadCache.set('students', { data, timestamp: Date.now() });
              return data;
            })
            .catch(error => console.warn('Erreur préchargement élèves:', error))
        );
      }

      // Précharger les enseignants
      if (preloadTeachers) {
        preloadPromises.push(
          TeacherService.getTeachers(userSchool.id)
            .then(data => {
              preloadCache.set('teachers', { data, timestamp: Date.now() });
              return data;
            })
            .catch(error => console.warn('Erreur préchargement enseignants:', error))
        );
      }

      // Précharger les classes
      if (preloadClasses) {
        preloadPromises.push(
          ClassService.getClasses(userSchool.id, currentAcademicYear.id)
            .then(data => {
              preloadCache.set('classes', { data, timestamp: Date.now() });
              return data;
            })
            .catch(error => console.warn('Erreur préchargement classes:', error))
        );
      }

      // Précharger les paiements récents
      if (preloadPayments) {
        preloadPromises.push(
          PaymentService.getRecentPayments(userSchool.id, 20)
            .then(data => {
              preloadCache.set('payments', { data, timestamp: Date.now() });
              return data;
            })
            .catch(error => console.warn('Erreur préchargement paiements:', error))
        );
      }

      // Exécuter les préchargements selon la priorité
      if (priority === 'high') {
        await Promise.all(preloadPromises);
      } else if (priority === 'medium') {
        await Promise.allSettled(preloadPromises);
      } else {
        // Préchargement en arrière-plan pour priorité basse
        Promise.allSettled(preloadPromises);
      }

      console.log('Préchargement des données terminé');
    } catch (error) {
      console.error('Erreur lors du préchargement:', error);
    }
  }, [
    isAuthenticated,
    userSchool?.id,
    currentAcademicYear?.id,
    preloadStudents,
    preloadTeachers,
    preloadClasses,
    preloadPayments,
    priority
  ]);

  // Fonction pour obtenir les données préchargées
  const getPreloadedData = useCallback((key: string) => {
    const cached = preloadCache.get(key);
    if (!cached) return null;

    // Vérifier si les données ne sont pas trop anciennes (5 minutes)
    const isExpired = Date.now() - cached.timestamp > 5 * 60 * 1000;
    if (isExpired) {
      preloadCache.delete(key);
      return null;
    }

    return cached.data;
  }, []);

  // Précharger quand l'utilisateur est inactif
  useEffect(() => {
    if (!preloadOnIdle) return;

    let idleTimer: NodeJS.Timeout;
    let isIdle = false;

    const resetIdleTimer = () => {
      clearTimeout(idleTimer);
      isIdle = false;
      
      idleTimer = setTimeout(() => {
        isIdle = true;
        if (isAuthenticated && userSchool && currentAcademicYear) {
          console.log('Utilisateur inactif, préchargement des données...');
          preloadData();
        }
      }, 30000); // 30 secondes d'inactivité
    };

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    events.forEach(event => {
      document.addEventListener(event, resetIdleTimer, true);
    });

    resetIdleTimer();

    return () => {
      clearTimeout(idleTimer);
      events.forEach(event => {
        document.removeEventListener(event, resetIdleTimer, true);
      });
    };
  }, [preloadOnIdle, preloadData, isAuthenticated, userSchool, currentAcademicYear]);

  // Préchargement initial
  useEffect(() => {
    if (isAuthenticated && userSchool && currentAcademicYear) {
      // Délai pour éviter de surcharger au démarrage
      const timer = setTimeout(preloadData, 2000);
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, userSchool?.id, currentAcademicYear?.id, preloadData]);

  // Préchargement au survol des liens de navigation
  const preloadOnHover = useCallback((routeName: string) => {
    if (!isAuthenticated || !userSchool || !currentAcademicYear) return;

    // Précharger les données selon la route
    switch (routeName) {
      case 'students':
        if (!preloadCache.has('students')) {
          StudentService.getStudents(userSchool.id, currentAcademicYear.id)
            .then(data => preloadCache.set('students', { data, timestamp: Date.now() }))
            .catch(() => {});
        }
        break;
      case 'teachers':
        if (!preloadCache.has('teachers')) {
          TeacherService.getTeachers(userSchool.id)
            .then(data => preloadCache.set('teachers', { data, timestamp: Date.now() }))
            .catch(() => {});
        }
        break;
      case 'classes':
        if (!preloadCache.has('classes')) {
          ClassService.getClasses(userSchool.id, currentAcademicYear.id)
            .then(data => preloadCache.set('classes', { data, timestamp: Date.now() }))
            .catch(() => {});
        }
        break;
    }
  }, [isAuthenticated, userSchool?.id, currentAcademicYear?.id]);

  return {
    preloadData,
    getPreloadedData,
    preloadOnHover,
    clearCache: () => preloadCache.clear()
  };
};

// Hook pour précharger les données critiques
export const useCriticalDataPreloader = () => {
  const { userSchool, currentAcademicYear, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated || !userSchool || !currentAcademicYear) return;

    // Précharger immédiatement les données critiques
    const preloadCriticalData = async () => {
      try {
        // Données essentielles pour le dashboard
        const criticalPromises = [
          // Stats rapides
          StudentService.getStudentStats(userSchool.id, currentAcademicYear.id),
          // Paiements récents
          PaymentService.getRecentPayments(userSchool.id, 5),
          // Classes de base
          ClassService.getClasses(userSchool.id, currentAcademicYear.id)
        ];

        await Promise.allSettled(criticalPromises);
        console.log('Données critiques préchargées');
      } catch (error) {
        console.warn('Erreur lors du préchargement critique:', error);
      }
    };

    preloadCriticalData();
  }, [isAuthenticated, userSchool?.id, currentAcademicYear?.id]);
};