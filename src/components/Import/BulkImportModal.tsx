import React, { useState } from 'react';
import { X, Upload, FileSpreadsheet, Users, UserCheck, BookOpen, Download, AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';
import { useAuth } from '../Auth/AuthProvider';
import { ImportService } from '../../services/importService';
import { ActivityLogService } from '../../services/activityLogService';

interface BulkImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete: () => void;
}

type ImportType = 'students' | 'teachers' | 'subjects';

interface ImportResult {
  success: number;
  errors: Array<{
    row: number;
    field: string;
    message: string;
    data: any;
  }>;
  warnings: Array<{
    row: number;
    message: string;
    data: any;
  }>;
}

const BulkImportModal: React.FC<BulkImportModalProps> = ({
  isOpen,
  onClose,
  onImportComplete
}) => {
  const { userSchool, currentAcademicYear, user } = useAuth();
  const [activeTab, setActiveTab] = useState<ImportType>('students');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [step, setStep] = useState<'upload' | 'preview' | 'import' | 'result'>('upload');
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [validationErrors, setValidationErrors] = useState<any[]>([]);

  const importTypes = [
    {
      id: 'students' as ImportType,
      title: 'Inscription Élèves',
      description: 'Importer des élèves et les inscrire dans leurs classes',
      icon: Users,
      color: 'blue',
      templateFields: [
        'Prénom', 'Nom', 'Sexe', 'Date de naissance', 'Nationalité', 'Classe',
        'Email parent', 'Nom père', 'Téléphone père', 'Nom mère', 'Téléphone mère',
        'Adresse', 'Frais totaux', 'Paiement initial', 'Méthode paiement'
      ]
    },
    {
      id: 'teachers' as ImportType,
      title: 'Import Enseignants',
      description: 'Importer des enseignants avec leurs qualifications',
      icon: UserCheck,
      color: 'green',
      templateFields: [
        'Prénom', 'Nom', 'Email', 'Téléphone', 'Qualification', 'Expérience',
        'Spécialisations', 'Classe assignée', 'Salaire', 'Date embauche', 'Contact urgence'
      ]
    },
    {
      id: 'subjects' as ImportType,
      title: 'Import Matières',
      description: 'Importer des matières par classe et niveau',
      icon: BookOpen,
      color: 'purple',
      templateFields: [
        'Nom matière', 'Description', 'Coefficient', 'Niveaux concernés',
        'Type évaluation', 'Heures par semaine'
      ]
    }
  ];

  const currentImportType = importTypes.find(type => type.id === activeTab)!;

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type !== 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' && 
          file.type !== 'application/vnd.ms-excel' &&
          !file.name.endsWith('.xlsx') && 
          !file.name.endsWith('.xls')) {
        alert('Veuillez sélectionner un fichier Excel (.xlsx ou .xls)');
        return;
      }
      
      setSelectedFile(file);
      setStep('preview');
      parseExcelFile(file);
    }
  };

  const parseExcelFile = async (file: File) => {
    try {
      setImporting(true);
      
      // Utiliser le service d'import pour parser le fichier
      const parsedData = await ImportService.parseExcelFile(file, activeTab);
      
      // Valider les données
      const validation = await ImportService.validateImportData(parsedData, activeTab, userSchool?.id, currentAcademicYear?.id);
      
      setPreviewData(parsedData);
      setValidationErrors(validation.errors);
      
    } catch (error: any) {
      console.error('Erreur lors de l\'analyse du fichier:', error);
      alert(`Erreur lors de l'analyse du fichier: ${error.message}`);
      setStep('upload');
    } finally {
      setImporting(false);
    }
  };

  const startImport = async () => {
    if (!userSchool || !currentAcademicYear || !selectedFile) return;

    try {
      setImporting(true);
      setStep('import');

      let result: ImportResult;

      switch (activeTab) {
        case 'students':
          result = await ImportService.importStudents(
            previewData,
            userSchool.id,
            currentAcademicYear.id
          );
          break;
        case 'teachers':
          result = await ImportService.importTeachers(
            previewData,
            userSchool.id
          );
          break;
        case 'subjects':
          result = await ImportService.importSubjects(
            previewData,
            userSchool.id
          );
          break;
        default:
          throw new Error('Type d\'import non supporté');
      }

      setImportResult(result);
      setStep('result');

      // Logger l'activité
      await ActivityLogService.logActivity({
        schoolId: userSchool.id,
        userId: user?.id,
        action: 'BULK_IMPORT',
        entityType: activeTab,
        level: result.errors.length > 0 ? 'warning' : 'success',
        details: `Import en masse ${activeTab}: ${result.success} succès, ${result.errors.length} erreurs`
      });

    } catch (error: any) {
      console.error('Erreur lors de l\'import:', error);
      alert(`Erreur lors de l'import: ${error.message}`);
      setStep('preview');
    } finally {
      setImporting(false);
    }
  };

  const downloadTemplate = () => {
    ImportService.downloadTemplate(activeTab, currentImportType.templateFields);
  };

  const resetImport = () => {
    setSelectedFile(null);
    setPreviewData([]);
    setValidationErrors([]);
    setImportResult(null);
    setStep('upload');
  };

  const getColorClasses = (color: string) => {
    const colorMap = {
      blue: 'bg-blue-50 text-blue-600 border-blue-200',
      green: 'bg-green-50 text-green-600 border-green-200',
      purple: 'bg-purple-50 text-purple-600 border-purple-200'
    };
    return colorMap[color as keyof typeof colorMap] || colorMap.blue;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-7xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <Upload className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-800">Importation en Masse</h2>
                <p className="text-gray-600">Importer des données depuis des fichiers Excel</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex space-x-8 mt-6">
            {importTypes.map((type) => {
              const Icon = type.icon;
              return (
                <button
                  key={type.id}
                  onClick={() => {
                    setActiveTab(type.id);
                    resetImport();
                  }}
                  className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                    activeTab === type.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{type.title}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="p-6">
          {/* Step 1: Upload */}
          {step === 'upload' && (
            <div className="space-y-6">
              {/* Import Type Info */}
              <div className={`p-6 rounded-xl border-2 ${getColorClasses(currentImportType.color)}`}>
                <div className="flex items-center space-x-4 mb-4">
                  <currentImportType.icon className="h-8 w-8" />
                  <div>
                    <h3 className="text-xl font-semibold">{currentImportType.title}</h3>
                    <p className="opacity-75">{currentImportType.description}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium mb-3">Champs Requis dans le Fichier Excel:</h4>
                    <div className="grid grid-cols-1 gap-1">
                      {currentImportType.templateFields.map((field, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <span className="w-2 h-2 bg-current rounded-full opacity-60"></span>
                          <span className="text-sm">{field}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <button
                      onClick={downloadTemplate}
                      className="w-full px-4 py-3 bg-white border-2 border-current rounded-lg hover:bg-current hover:bg-opacity-10 transition-colors flex items-center justify-center space-x-2"
                    >
                      <Download className="h-5 w-5" />
                      <span>Télécharger le Modèle Excel</span>
                    </button>
                    
                    <div className="text-sm opacity-75">
                      <p><strong>Conseil:</strong> Utilisez le modèle Excel pour garantir la compatibilité des données.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* File Upload */}
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-blue-400 transition-colors">
                <FileSpreadsheet className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  Sélectionner le Fichier Excel
                </h3>
                <p className="text-gray-600 mb-4">
                  Glissez-déposez votre fichier Excel ici ou cliquez pour sélectionner
                </p>
                
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="excel-upload"
                />
                <label
                  htmlFor="excel-upload"
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer inline-flex items-center space-x-2"
                >
                  <Upload className="h-5 w-5" />
                  <span>Choisir un Fichier</span>
                </label>
                
                <p className="text-sm text-gray-500 mt-4">
                  Formats supportés: .xlsx, .xls • Taille max: 10 MB
                </p>
              </div>

              {/* Instructions spécifiques */}
              <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                <h4 className="font-medium text-yellow-800 mb-2">Instructions Importantes</h4>
                <ul className="text-sm text-yellow-700 space-y-1">
                  {activeTab === 'students' && (
                    <>
                      <li>• La première ligne doit contenir les en-têtes de colonnes</li>
                      <li>• Les classes doivent exister avant l'import des élèves</li>
                      <li>• Les dates doivent être au format JJ/MM/AAAA</li>
                      <li>• Au moins un contact parent (père ou mère) est obligatoire</li>
                      <li>• Les frais totaux seront calculés automatiquement si non spécifiés</li>
                    </>
                  )}
                  {activeTab === 'teachers' && (
                    <>
                      <li>• Les emails doivent être uniques dans le système</li>
                      <li>• Les spécialisations doivent être séparées par des virgules</li>
                      <li>• Les classes assignées doivent exister</li>
                      <li>• Les salaires doivent être en FCFA</li>
                    </>
                  )}
                  {activeTab === 'subjects' && (
                    <>
                      <li>• Les niveaux doivent être séparés par des virgules</li>
                      <li>• Les coefficients doivent être entre 1 et 5</li>
                      <li>• Les noms de matières doivent être uniques par école</li>
                    </>
                  )}
                </ul>
              </div>
            </div>
          )}

          {/* Step 2: Preview */}
          {step === 'preview' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">Aperçu des Données</h3>
                  <p className="text-gray-600">
                    {previewData.length} ligne(s) détectée(s) • {validationErrors.length} erreur(s)
                  </p>
                </div>
                
                <div className="flex items-center space-x-3">
                  <button
                    onClick={resetImport}
                    className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Changer Fichier
                  </button>
                  <button
                    onClick={startImport}
                    disabled={validationErrors.length > 0 || previewData.length === 0}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Lancer l'Import
                  </button>
                </div>
              </div>

              {/* Validation Errors */}
              {validationErrors.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-3">
                    <AlertCircle className="h-5 w-5 text-red-600" />
                    <h4 className="font-medium text-red-800">Erreurs de Validation</h4>
                  </div>
                  <div className="max-h-32 overflow-y-auto space-y-1">
                    {validationErrors.slice(0, 10).map((error, index) => (
                      <p key={index} className="text-sm text-red-700">
                        Ligne {error.row}: {error.message}
                      </p>
                    ))}
                    {validationErrors.length > 10 && (
                      <p className="text-sm text-red-600 font-medium">
                        ... et {validationErrors.length - 10} autres erreurs
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Preview Table */}
              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <div className="p-4 bg-gray-50 border-b border-gray-200">
                  <h4 className="font-medium text-gray-800">
                    Aperçu des {previewData.length} premières lignes
                  </h4>
                </div>
                
                <div className="overflow-x-auto max-h-96">
                  <table className="w-full">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Ligne</th>
                        {Object.keys(previewData[0] || {}).map(key => (
                          <th key={key} className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                            {key}
                          </th>
                        ))}
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {previewData.slice(0, 20).map((row, index) => {
                        const hasError = validationErrors.some(error => error.row === index + 1);
                        
                        return (
                          <tr key={index} className={`hover:bg-gray-50 ${hasError ? 'bg-red-50' : ''}`}>
                            <td className="px-4 py-2 text-sm font-medium text-gray-600">{index + 1}</td>
                            {Object.values(row).map((value: any, cellIndex) => (
                              <td key={cellIndex} className="px-4 py-2 text-sm text-gray-800">
                                {value?.toString() || '-'}
                              </td>
                            ))}
                            <td className="px-4 py-2">
                              {hasError ? (
                                <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs">
                                  Erreur
                                </span>
                              ) : (
                                <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">
                                  Valide
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Import Progress */}
          {step === 'import' && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <RefreshCw className="h-8 w-8 text-blue-600 animate-spin" />
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Import en Cours</h3>
                <p className="text-gray-600">
                  Traitement de {previewData.length} enregistrement(s)...
                </p>
              </div>

              <div className="max-w-md mx-auto">
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div className="bg-blue-600 h-3 rounded-full animate-pulse" style={{ width: '60%' }}></div>
                </div>
                <p className="text-center text-sm text-gray-600 mt-2">
                  Veuillez patienter, l'import peut prendre quelques minutes...
                </p>
              </div>
            </div>
          )}

          {/* Step 4: Results */}
          {step === 'result' && importResult && (
            <div className="space-y-6">
              <div className="text-center">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
                  importResult.errors.length === 0 ? 'bg-green-100' : 'bg-yellow-100'
                }`}>
                  {importResult.errors.length === 0 ? (
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  ) : (
                    <AlertCircle className="h-8 w-8 text-yellow-600" />
                  )}
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Import Terminé</h3>
                <p className="text-gray-600">
                  {importResult.success} enregistrement(s) importé(s) avec succès
                  {importResult.errors.length > 0 && `, ${importResult.errors.length} erreur(s)`}
                </p>
              </div>

              {/* Statistics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-green-50 p-6 rounded-lg text-center">
                  <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-green-800">{importResult.success}</p>
                  <p className="text-sm text-green-600">Succès</p>
                </div>

                <div className="bg-red-50 p-6 rounded-lg text-center">
                  <AlertCircle className="h-8 w-8 text-red-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-red-800">{importResult.errors.length}</p>
                  <p className="text-sm text-red-600">Erreurs</p>
                </div>

                <div className="bg-yellow-50 p-6 rounded-lg text-center">
                  <span className="text-2xl mb-2 block">⚠️</span>
                  <p className="text-2xl font-bold text-yellow-800">{importResult.warnings.length}</p>
                  <p className="text-sm text-yellow-600">Avertissements</p>
                </div>
              </div>

              {/* Errors Details */}
              {importResult.errors.length > 0 && (
                <div className="bg-white border border-red-200 rounded-lg">
                  <div className="p-4 bg-red-50 border-b border-red-200">
                    <h4 className="font-medium text-red-800">Détails des Erreurs</h4>
                  </div>
                  <div className="p-4 max-h-64 overflow-y-auto">
                    <div className="space-y-2">
                      {importResult.errors.map((error, index) => (
                        <div key={index} className="p-3 bg-red-50 rounded border border-red-200">
                          <p className="text-sm font-medium text-red-800">
                            Ligne {error.row}: {error.message}
                          </p>
                          {error.field && (
                            <p className="text-xs text-red-600 mt-1">
                              Champ: {error.field}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Warnings */}
              {importResult.warnings.length > 0 && (
                <div className="bg-white border border-yellow-200 rounded-lg">
                  <div className="p-4 bg-yellow-50 border-b border-yellow-200">
                    <h4 className="font-medium text-yellow-800">Avertissements</h4>
                  </div>
                  <div className="p-4 max-h-32 overflow-y-auto">
                    <div className="space-y-2">
                      {importResult.warnings.map((warning, index) => (
                        <div key={index} className="p-2 bg-yellow-50 rounded border border-yellow-200">
                          <p className="text-sm text-yellow-800">
                            Ligne {warning.row}: {warning.message}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-center space-x-4">
                <button
                  onClick={resetImport}
                  className="px-6 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Nouvel Import
                </button>
                <button
                  onClick={() => {
                    onImportComplete();
                    onClose();
                  }}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Terminer
                </button>
              </div>
            </div>
          )}

          {/* Loading State */}
          {importing && step !== 'import' && (
            <div className="fixed inset-0 bg-black bg-opacity-25 flex items-center justify-center z-10">
              <div className="bg-white p-6 rounded-lg shadow-lg">
                <div className="flex items-center space-x-3">
                  <RefreshCw className="h-5 w-5 text-blue-600 animate-spin" />
                  <span className="text-gray-700">Analyse du fichier en cours...</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500">
              {selectedFile && `Fichier: ${selectedFile.name} (${(selectedFile.size / 1024 / 1024).toFixed(2)} MB)`}
            </div>
            <div className="flex items-center space-x-3">
              {step !== 'upload' && step !== 'result' && (
                <button
                  onClick={resetImport}
                  className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Recommencer
                </button>
              )}
              <button
                onClick={onClose}
                className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BulkImportModal;