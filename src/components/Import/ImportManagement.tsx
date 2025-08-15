import React, { useState } from 'react';
import { Upload, FileSpreadsheet, Users, UserCheck, BookOpen, Download, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import BulkImportModal from './BulkImportModal';
import ImportHistoryModal from './ImportHistoryModal';
import ImportGuideModal from './ImportGuideModal';
import { useAuth } from '../Auth/AuthProvider';
import { ImportService } from '../../services/importService';

const ImportManagement: React.FC = () => {
  const { userSchool } = useAuth();
  const [showBulkImportModal, setShowBulkImportModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [selectedGuideType, setSelectedGuideType] = useState<'students' | 'teachers' | 'subjects'>('students');
  const [importStats, setImportStats] = useState<any>(null);

  // Charger les statistiques d'import
  React.useEffect(() => {
    if (userSchool) {
      loadImportStats();
    }
  }, [userSchool]);

  const loadImportStats = async () => {
    if (!userSchool) return;

    try {
      const stats = await ImportService.getImportStats(userSchool.id, 30);
      setImportStats(stats);
    } catch (error) {
      console.error('Erreur lors du chargement des statistiques:', error);
    }
  };

  const importTypes = [
    {
      id: 'students',
      title: 'Import Élèves',
      description: 'Importer des élèves avec leurs inscriptions et paiements initiaux',
      icon: Users,
      color: 'blue',
      features: [
        'Inscription automatique dans les classes',
        'Calcul automatique des frais selon le niveau',
        'Enregistrement des paiements initiaux',
        'Validation des contacts parents',
        'Gestion des doublons'
      ]
    },
    {
      id: 'teachers',
      title: 'Import Enseignants',
      description: 'Importer des enseignants avec leurs qualifications et affectations',
      icon: UserCheck,
      color: 'green',
      features: [
        'Affectation automatique aux classes disponibles',
        'Gestion des spécialisations',
        'Calcul des salaires',
        'Création optionnelle de comptes utilisateur',
        'Validation des qualifications'
      ]
    },
    {
      id: 'subjects',
      title: 'Import Matières',
      description: 'Importer des matières par niveau avec coefficients',
      icon: BookOpen,
      color: 'purple',
      features: [
        'Configuration par niveau scolaire',
        'Gestion des coefficients',
        'Association aux classes existantes',
        'Validation des programmes officiels',
        'Évitement des doublons'
      ]
    }
  ];

  const getColorClasses = (color: string) => {
    const colorMap = {
      blue: 'bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100',
      green: 'bg-green-50 text-green-600 border-green-200 hover:bg-green-100',
      purple: 'bg-purple-50 text-purple-600 border-purple-200 hover:bg-purple-100'
    };
    return colorMap[color as keyof typeof colorMap] || colorMap.blue;
  };

  const handleShowGuide = (type: 'students' | 'teachers' | 'subjects') => {
    setSelectedGuideType(type);
    setShowGuideModal(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Import en Masse</h1>
          <p className="text-gray-600">
            Importation rapide de données depuis des fichiers Excel - {userSchool?.name}
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <button 
            onClick={() => setShowHistoryModal(true)}
            className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors flex items-center space-x-2"
          >
            <Clock className="h-4 w-4" />
            <span>Historique</span>
          </button>
          
          <button 
            onClick={() => setShowBulkImportModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <Upload className="h-4 w-4" />
            <span>Nouvel Import</span>
          </button>
        </div>
      </div>

      {/* Statistiques d'import */}
      {importStats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Imports ce Mois</p>
                <p className="text-2xl font-bold text-gray-800">{importStats.totalImports}</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-xl">
                <Upload className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <div className="mt-4">
              <span className="text-sm text-blue-600 font-medium">30 derniers jours</span>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Dernier Import</p>
                <p className="text-lg font-bold text-gray-800">
                  {importStats.lastImport 
                    ? new Date(importStats.lastImport).toLocaleDateString('fr-FR')
                    : 'Aucun'
                  }
                </p>
              </div>
              <div className="p-3 bg-green-50 rounded-xl">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Taux de Succès</p>
                <p className="text-2xl font-bold text-gray-800">95%</p>
              </div>
              <div className="p-3 bg-purple-50 rounded-xl">
                <FileSpreadsheet className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Types d'import disponibles */}
      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-gray-800">Types d'Import Disponibles</h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {importTypes.map((type) => {
            const Icon = type.icon;
            
            return (
              <div key={type.id} className={`p-6 rounded-xl border-2 transition-all ${getColorClasses(type.color)}`}>
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center">
                    <Icon className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">{type.title}</h3>
                    <p className="text-sm opacity-75">{type.description}</p>
                  </div>
                </div>
                
                <div className="space-y-3 mb-6">
                  <h4 className="font-medium">Fonctionnalités:</h4>
                  <ul className="space-y-1">
                    {type.features.map((feature, index) => (
                      <li key={index} className="flex items-start space-x-2 text-sm">
                        <span className="w-1.5 h-1.5 bg-current rounded-full mt-2 flex-shrink-0"></span>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div className="space-y-3">
                  <button
                    onClick={() => setShowBulkImportModal(true)}
                    className="w-full px-4 py-2 bg-white border-2 border-current rounded-lg hover:bg-current hover:bg-opacity-10 transition-colors font-medium"
                  >
                    Commencer l'Import
                  </button>
                  
                  <button
                    onClick={() => handleShowGuide(type.id as any)}
                    className="w-full px-4 py-2 bg-current bg-opacity-10 rounded-lg hover:bg-opacity-20 transition-colors text-sm"
                  >
                    Guide d'Import
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Processus d'import */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h2 className="text-xl font-semibold text-gray-800 mb-6">Processus d'Import en 3 Étapes</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Download className="h-8 w-8 text-blue-600" />
            </div>
            <h3 className="font-semibold text-gray-800 mb-2">1. Télécharger le Modèle</h3>
            <p className="text-gray-600 text-sm">
              Téléchargez le fichier Excel pré-configuré avec les colonnes requises
            </p>
          </div>
          
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileSpreadsheet className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="font-semibold text-gray-800 mb-2">2. Remplir les Données</h3>
            <p className="text-gray-600 text-sm">
              Complétez le fichier avec vos données en respectant les formats requis
            </p>
          </div>
          
          <div className="text-center">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Upload className="h-8 w-8 text-purple-600" />
            </div>
            <h3 className="font-semibold text-gray-800 mb-2">3. Importer</h3>
            <p className="text-gray-600 text-sm">
              Uploadez votre fichier et laissez le système traiter les données
            </p>
          </div>
        </div>
      </div>

      {/* Conseils et bonnes pratiques */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h2 className="text-xl font-semibold text-gray-800 mb-6">Conseils pour un Import Réussi</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h3 className="font-medium text-green-800 flex items-center space-x-2">
              <CheckCircle className="h-5 w-5" />
              <span>Bonnes Pratiques</span>
            </h3>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start space-x-2">
                <span className="w-1.5 h-1.5 bg-green-600 rounded-full mt-2 flex-shrink-0"></span>
                <span>Utilisez toujours les modèles Excel fournis</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="w-1.5 h-1.5 bg-green-600 rounded-full mt-2 flex-shrink-0"></span>
                <span>Vérifiez que les classes existent avant d'importer des élèves</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="w-1.5 h-1.5 bg-green-600 rounded-full mt-2 flex-shrink-0"></span>
                <span>Respectez les formats de date (JJ/MM/AAAA)</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="w-1.5 h-1.5 bg-green-600 rounded-full mt-2 flex-shrink-0"></span>
                <span>Testez avec un petit échantillon d'abord</span>
              </li>
            </ul>
          </div>
          
          <div className="space-y-4">
            <h3 className="font-medium text-red-800 flex items-center space-x-2">
              <AlertCircle className="h-5 w-5" />
              <span>Erreurs Courantes</span>
            </h3>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start space-x-2">
                <span className="w-1.5 h-1.5 bg-red-600 rounded-full mt-2 flex-shrink-0"></span>
                <span>En-têtes de colonnes modifiés ou manquants</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="w-1.5 h-1.5 bg-red-600 rounded-full mt-2 flex-shrink-0"></span>
                <span>Formats de date incorrects</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="w-1.5 h-1.5 bg-red-600 rounded-full mt-2 flex-shrink-0"></span>
                <span>Emails ou téléphones en doublon</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="w-1.5 h-1.5 bg-red-600 rounded-full mt-2 flex-shrink-0"></span>
                <span>Classes inexistantes dans le système</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Actions rapides */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h2 className="text-xl font-semibold text-gray-800 mb-6">Actions Rapides</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <button
            onClick={() => setShowBulkImportModal(true)}
            className="p-4 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors text-center"
          >
            <Upload className="h-8 w-8 text-blue-600 mx-auto mb-2" />
            <p className="font-medium text-blue-800">Nouvel Import</p>
            <p className="text-sm text-blue-600">Importer des données</p>
          </button>
          
          <button
            onClick={() => setShowHistoryModal(true)}
            className="p-4 border border-green-200 rounded-lg hover:bg-green-50 transition-colors text-center"
          >
            <Clock className="h-8 w-8 text-green-600 mx-auto mb-2" />
            <p className="font-medium text-green-800">Historique</p>
            <p className="text-sm text-green-600">Voir les imports passés</p>
          </button>
          
          <button
            onClick={() => handleShowGuide('students')}
            className="p-4 border border-purple-200 rounded-lg hover:bg-purple-50 transition-colors text-center"
          >
            <FileSpreadsheet className="h-8 w-8 text-purple-600 mx-auto mb-2" />
            <p className="font-medium text-purple-800">Guide d'Import</p>
            <p className="text-sm text-purple-600">Instructions détaillées</p>
          </button>
          
          <button
            onClick={() => {
              // Télécharger tous les modèles
              ImportService.downloadTemplate('students', []);
              ImportService.downloadTemplate('teachers', []);
              ImportService.downloadTemplate('subjects', []);
            }}
            className="p-4 border border-orange-200 rounded-lg hover:bg-orange-50 transition-colors text-center"
          >
            <Download className="h-8 w-8 text-orange-600 mx-auto mb-2" />
            <p className="font-medium text-orange-800">Tous les Modèles</p>
            <p className="text-sm text-orange-600">Télécharger tout</p>
          </button>
        </div>
      </div>

      {/* Modals */}
      <BulkImportModal
        isOpen={showBulkImportModal}
        onClose={() => setShowBulkImportModal(false)}
        onImportComplete={() => {
          setShowBulkImportModal(false);
          loadImportStats();
        }}
      />

      <ImportHistoryModal
        isOpen={showHistoryModal}
        onClose={() => setShowHistoryModal(false)}
      />

      <ImportGuideModal
        isOpen={showGuideModal}
        onClose={() => setShowGuideModal(false)}
        importType={selectedGuideType}
      />
    </div>
  );
};

export default ImportManagement;