import React, { useState, useEffect } from 'react';
import { Upload, TrendingUp, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { ImportService } from '../../services/importService';
import { useAuth } from '../Auth/AuthProvider';
import { formatRelativeTime } from '../../utils/formatters';

const ImportStatsCard: React.FC = () => {
  const { userSchool } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (userSchool) {
      loadImportStats();
    }
  }, [userSchool]);

  const loadImportStats = async () => {
    if (!userSchool) return;

    try {
      setLoading(true);
      const importStats = await ImportService.getImportStats(userSchool.id, 30);
      setStats(importStats);
    } catch (error) {
      console.error('Erreur lors du chargement des statistiques d\'import:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !stats) {
    return (
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 animate-pulse">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 bg-gray-200 rounded-xl"></div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded w-32"></div>
            <div className="h-3 bg-gray-200 rounded w-24"></div>
          </div>
        </div>
        <div className="space-y-3">
          <div className="h-4 bg-gray-200 rounded"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
      <div className="flex items-center space-x-3 mb-4">
        <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
          <Upload className="h-5 w-5 text-green-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-800">Imports en Masse</h3>
          <p className="text-sm text-gray-600">Statistiques des 30 derniers jours</p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <p className="text-2xl font-bold text-blue-600">{stats.totalImports}</p>
            <p className="text-sm text-blue-600">Imports réalisés</p>
          </div>
          
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <CheckCircle className="h-6 w-6 text-green-600 mx-auto mb-1" />
            <p className="text-sm text-green-600">Dernière activité</p>
          </div>
        </div>

        {stats.lastImport && (
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Dernier import:</span>
              <span className="text-sm font-medium text-gray-800">
                {formatRelativeTime(stats.lastImport)}
              </span>
            </div>
          </div>
        )}

        {stats.recentImports.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-700">Imports Récents</h4>
            {stats.recentImports.slice(0, 3).map((importLog: any, index: number) => (
              <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm">
                <span className="text-gray-700">
                  {importLog.details?.split(':')[0] || 'Import'}
                </span>
                <span className="text-gray-500">
                  {formatRelativeTime(importLog.created_at)}
                </span>
              </div>
            ))}
          </div>
        )}

        {stats.totalImports === 0 && (
          <div className="text-center py-4">
            <Upload className="h-8 w-8 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-500">Aucun import réalisé</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImportStatsCard;