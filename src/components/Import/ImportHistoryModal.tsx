import React, { useState, useEffect } from 'react';
import { X, Clock, FileSpreadsheet, CheckCircle, AlertCircle, Download, Eye, RefreshCw } from 'lucide-react';
import { ImportService } from '../../services/importService';
import { useAuth } from '../Auth/AuthProvider';
import { formatRelativeTime } from '../../utils/formatters';

interface ImportHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ImportLog {
  id: string;
  created_at: string;
  action: string;
  entity_type: string;
  details: string;
  level: 'success' | 'warning' | 'error';
  user: {
    name: string;
    role: string;
  };
}

const ImportHistoryModal: React.FC<ImportHistoryModalProps> = ({
  isOpen,
  onClose
}) => {
  const { userSchool } = useAuth();
  const [importHistory, setImportHistory] = useState<ImportLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('30');

  useEffect(() => {
    if (isOpen && userSchool) {
      loadImportHistory();
    }
  }, [isOpen, userSchool, selectedPeriod]);

  const loadImportHistory = async () => {
    if (!userSchool) return;

    try {
      setLoading(true);
      const stats = await ImportService.getImportStats(userSchool.id, parseInt(selectedPeriod));
      setImportHistory(stats.recentImports);
    } catch (error) {
      console.error('Erreur lors du chargement de l\'historique:', error);
    } finally {
      setLoading(false);
    }
  };

  const getImportTypeIcon = (entityType: string) => {
    switch (entityType) {
      case 'students': return '👥';
      case 'teachers': return '👨‍🏫';
      case 'subjects': return '📚';
      default: return '📄';
    }
  };

  const getImportTypeLabel = (entityType: string) => {
    switch (entityType) {
      case 'students': return 'Élèves';
      case 'teachers': return 'Enseignants';
      case 'subjects': return 'Matières';
      default: return 'Données';
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'success': return 'bg-green-50 text-green-700 border-green-200';
      case 'warning': return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'error': return 'bg-red-50 text-red-700 border-red-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'success': return CheckCircle;
      case 'warning': return AlertCircle;
      case 'error': return AlertCircle;
      default: return Clock;
    }
  };

  const parseImportDetails = (details: string) => {
    // Parser les détails pour extraire les statistiques
    const match = details.match(/(\d+) succès, (\d+) erreurs/);
    if (match) {
      return {
        success: parseInt(match[1]),
        errors: parseInt(match[2]),
        total: parseInt(match[1]) + parseInt(match[2])
      };
    }
    return null;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <Clock className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-800">Historique des Imports</h2>
                <p className="text-gray-600">Suivi des importations en masse réalisées</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={loadImportHistory}
                disabled={loading}
                className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
          </div>
        </div>

        <div className="p-6">
          {/* Filtres */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-800">Historique des Imports</h3>
              <p className="text-gray-600">{importHistory.length} import(s) trouvé(s)</p>
            </div>
            
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="7">7 derniers jours</option>
              <option value="30">30 derniers jours</option>
              <option value="90">90 derniers jours</option>
              <option value="365">Année complète</option>
            </select>
          </div>

          {/* Liste des imports */}
          {loading ? (
            <div className="text-center py-12">
              <RefreshCw className="h-8 w-8 text-blue-600 mx-auto mb-4 animate-spin" />
              <p className="text-gray-600">Chargement de l'historique...</p>
            </div>
          ) : importHistory.length > 0 ? (
            <div className="space-y-4">
              {importHistory.map((importLog) => {
                const LevelIcon = getLevelIcon(importLog.level);
                const stats = parseImportDetails(importLog.details);
                
                return (
                  <div key={importLog.id} className={`p-4 rounded-lg border-2 ${getLevelColor(importLog.level)}`}>
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4">
                        <div className="flex items-center space-x-2">
                          <span className="text-2xl">
                            {getImportTypeIcon(importLog.entity_type)}
                          </span>
                          <LevelIcon className="h-5 w-5" />
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h4 className="font-medium text-gray-800">
                              Import {getImportTypeLabel(importLog.entity_type)}
                            </h4>
                            <span className="text-sm text-gray-500">
                              par {importLog.user?.name || 'Utilisateur inconnu'}
                            </span>
                          </div>
                          
                          <p className="text-sm text-gray-700 mb-2">{importLog.details}</p>
                          
                          {stats && (
                            <div className="flex items-center space-x-4 text-sm">
                              <span className="text-green-600">
                                ✓ {stats.success} succès
                              </span>
                              {stats.errors > 0 && (
                                <span className="text-red-600">
                                  ✗ {stats.errors} erreurs
                                </span>
                              )}
                              <span className="text-gray-500">
                                Total: {stats.total}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <p className="text-sm text-gray-600">
                          {formatRelativeTime(importLog.created_at)}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(importLog.created_at).toLocaleDateString('fr-FR')}
                        </p>
                        
                        <div className="flex items-center space-x-2 mt-2">
                          <button
                            className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
                            title="Voir détails"
                          >
                            <Eye className="h-3 w-3" />
                          </button>
                          <button
                            className="p-1 text-green-600 hover:text-green-800 hover:bg-green-50 rounded transition-colors"
                            title="Télécharger rapport"
                          >
                            <Download className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <FileSpreadsheet className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-800 mb-2">Aucun Import Trouvé</h3>
              <p className="text-gray-600">
                Aucun import en masse n'a été réalisé dans les {selectedPeriod} derniers jours
              </p>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500">
              Historique des {selectedPeriod} derniers jours • {userSchool?.name}
            </div>
            <button
              onClick={onClose}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImportHistoryModal;