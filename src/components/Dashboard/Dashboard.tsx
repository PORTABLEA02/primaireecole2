import React from 'react';
import { useAuth } from '../Auth/AuthProvider';
import { RefreshCw, AlertCircle, Users } from 'lucide-react';
import StatsCards from './StatsCards';
import RecentActivities from './RecentActivities';
import QuickActions from './QuickActions';
import AcademicOverview from './AcademicOverview';
import ImportStatsCard from '../Import/ImportStatsCard';
import { useOptimizedData } from '../../hooks/useOptimizedData';
import { useDataPreloader } from '../../hooks/useDataPreloader';
import SmartLoader from '../Common/SmartLoader';
import { SkeletonCard, EmptyState } from '../Common/LoadingStates';
import { StudentService } from '../../services/studentService';
import { PaymentService } from '../../services/paymentService';
import { DashboardService } from '../../services/dashboardService';

const Dashboard: React.FC = () => {
  const { userSchool, currentAcademicYear } = useAuth();
  
  // Préchargement des données critiques
  useDataPreloader({
    preloadStudents: true,
    preloadPayments: true,
    priority: 'high'
  });

  // Chargement optimisé des données du dashboard
  const {
    data: dashboardData,
    isLoading,
    error,
    refresh,
    progress,
    stage
  } = useOptimizedData(
    async () => {
      if (!userSchool || !currentAcademicYear) {
        throw new Error('Données de l\'école ou année scolaire manquantes');
      }

      // Charger les données en parallèle avec gestion d'erreur
      const [stats, recentPayments, activities] = await Promise.allSettled([
        DashboardService.getQuickStats(userSchool.id, currentAcademicYear.id),
        PaymentService.getRecentPayments(userSchool.id, 5),
        DashboardService.getRecentActivities(userSchool.id, 10)
      ]);

      return {
        stats: stats.status === 'fulfilled' ? stats.value : null,
        recentPayments: recentPayments.status === 'fulfilled' ? recentPayments.value : [],
        activities: activities.status === 'fulfilled' ? activities.value : []
      };
    },
    {
      cacheKey: 'dashboard',
      dependencies: [userSchool?.id, currentAcademicYear?.id],
      cacheDuration: 2 * 60 * 1000, // 2 minutes pour le dashboard
      transform: (data) => {
        // Transformer les données si nécessaire
        return data;
      }
    }
  );

  const handleRefresh = () => {
    refresh();
  };

  return (
    <SmartLoader
      isLoading={isLoading}
      error={error}
      progress={progress}
      stage={stage}
      onRetry={refresh}
      className="space-y-6"
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Tableau de Bord</h1>
            <p className="text-sm sm:text-base text-gray-600">
              {userSchool?.name} - Année scolaire {currentAcademicYear?.name || '2024-2025'}
            </p>
          </div>
          
          <button
            onClick={handleRefresh}
            disabled={isLoading}
            className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors flex items-center space-x-2 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Actualiser</span>
          </button>
        </div>

        {!userSchool && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <AlertCircle className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="font-medium text-yellow-800">Configuration requise</p>
                <p className="text-sm text-yellow-700">
                  Veuillez vous connecter pour accéder aux données de votre école.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Affichage conditionnel avec fallbacks */}
        {dashboardData ? (
          <StatsCards stats={dashboardData.stats} />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {Array.from({ length: 4 }).map((_, index) => (
              <SkeletonCard key={index} />
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 space-y-6">
            <AcademicOverview />
            <RecentActivities activities={dashboardData?.activities} />
          </div>
          
          <div className="space-y-6">
            <QuickActions />
            <ImportStatsCard />
          </div>
        </div>
      </div>
    </SmartLoader>
  );
};

export default Dashboard;