import React from 'react';
import { X, FileSpreadsheet, Download, CheckCircle, AlertCircle, Info } from 'lucide-react';

interface ImportGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  importType: 'students' | 'teachers' | 'subjects';
}

const ImportGuideModal: React.FC<ImportGuideModalProps> = ({
  isOpen,
  onClose,
  importType
}) => {
  const guides = {
    students: {
      title: 'Guide d\'Import - Élèves',
      description: 'Instructions détaillées pour importer des élèves et leurs inscriptions',
      requiredFields: [
        { field: 'Prénom', type: 'Texte', description: 'Prénom de l\'élève', example: 'Aminata' },
        { field: 'Nom', type: 'Texte', description: 'Nom de famille', example: 'Traore' },
        { field: 'Sexe', type: 'Texte', description: 'Masculin/Féminin ou M/F', example: 'Féminin' },
        { field: 'Date de naissance', type: 'Date', description: 'Format JJ/MM/AAAA', example: '15/03/2013' },
        { field: 'Classe', type: 'Texte', description: 'Nom exact de la classe', example: 'CM2A' },
        { field: 'Email parent', type: 'Email', description: 'Email principal des parents', example: 'parent@example.com' }
      ],
      optionalFields: [
        { field: 'Nationalité', description: 'Nationalité de l\'élève', example: 'Béninoise' },
        { field: 'Nom père', description: 'Nom complet du père', example: 'Moussa Traore' },
        { field: 'Téléphone père', description: 'Numéro du père', example: '+229 01 23 45 67' },
        { field: 'Nom mère', description: 'Nom complet de la mère', example: 'Fatoumata Kone' },
        { field: 'Téléphone mère', description: 'Numéro de la mère', example: '+229 01 23 45 68' },
        { field: 'Adresse', description: 'Adresse complète', example: 'Quartier Zongo, Cotonou' },
        { field: 'Frais totaux', description: 'Montant en FCFA', example: '450000' },
        { field: 'Paiement initial', description: 'Montant déjà payé', example: '100000' }
      ],
      tips: [
        'Les classes doivent exister avant l\'import des élèves',
        'Au moins un contact parent (père ou mère) est obligatoire',
        'Les frais seront calculés automatiquement selon le niveau si non spécifiés',
        'Les dates doivent être au format JJ/MM/AAAA',
        'Les emails doivent être uniques dans le système'
      ]
    },
    teachers: {
      title: 'Guide d\'Import - Enseignants',
      description: 'Instructions pour importer des enseignants avec leurs qualifications',
      requiredFields: [
        { field: 'Prénom', type: 'Texte', description: 'Prénom de l\'enseignant', example: 'Moussa' },
        { field: 'Nom', type: 'Texte', description: 'Nom de famille', example: 'Ouattara' },
        { field: 'Email', type: 'Email', description: 'Adresse email unique', example: 'moussa.ouattara@example.com' },
        { field: 'Qualification', type: 'Texte', description: 'Diplôme principal', example: 'Licence en Pédagogie' }
      ],
      optionalFields: [
        { field: 'Téléphone', description: 'Numéro de téléphone', example: '+229 01 45 67 89' },
        { field: 'Expérience', description: 'Années d\'expérience', example: '8 ans' },
        { field: 'Spécialisations', description: 'Séparées par virgules', example: 'Mathématiques, Sciences' },
        { field: 'Classe assignée', description: 'Nom de la classe', example: 'CM2A' },
        { field: 'Salaire', description: 'Salaire mensuel en FCFA', example: '180000' },
        { field: 'Date embauche', description: 'Date d\'embauche', example: '01/09/2024' },
        { field: 'Contact urgence', description: 'Téléphone d\'urgence', example: '+229 01 45 67 90' }
      ],
      tips: [
        'Les emails doivent être uniques dans le système',
        'Les spécialisations doivent être séparées par des virgules',
        'Les classes assignées doivent exister dans le système',
        'Le salaire doit être entre 50,000 et 1,000,000 FCFA',
        'Un enseignant ne peut être assigné qu\'à une seule classe'
      ]
    },
    subjects: {
      title: 'Guide d\'Import - Matières',
      description: 'Instructions pour importer des matières par niveau',
      requiredFields: [
        { field: 'Nom matière', type: 'Texte', description: 'Nom de la matière', example: 'Français' },
        { field: 'Coefficient', type: 'Nombre', description: 'Coefficient (1-5)', example: '4' }
      ],
      optionalFields: [
        { field: 'Description', description: 'Description de la matière', example: 'Langue française, lecture, écriture' },
        { field: 'Niveaux concernés', description: 'Séparés par virgules', example: 'CI,CP,CE1,CE2,CM1,CM2' },
        { field: 'Heures par semaine', description: 'Nombre d\'heures', example: '6' }
      ],
      tips: [
        'Les noms de matières doivent être uniques par école',
        'Les coefficients doivent être entre 1 et 5',
        'Les niveaux doivent être séparés par des virgules',
        'Utilisez les niveaux standards: Maternelle, CI, CP, CE1, CE2, CM1, CM2'
      ]
    }
  };

  const currentGuide = guides[importType];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <FileSpreadsheet className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-800">{currentGuide.title}</h2>
                <p className="text-gray-600">{currentGuide.description}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-8">
          {/* Champs obligatoires */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <span>Champs Obligatoires</span>
            </h3>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-red-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-red-600 uppercase">Champ</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-red-600 uppercase">Type</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-red-600 uppercase">Description</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-red-600 uppercase">Exemple</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-red-100">
                  {currentGuide.requiredFields.map((field, index) => (
                    <tr key={index} className="hover:bg-red-50">
                      <td className="px-4 py-3 font-medium text-gray-800">{field.field}</td>
                      <td className="px-4 py-3 text-gray-600">{field.type}</td>
                      <td className="px-4 py-3 text-gray-600">{field.description}</td>
                      <td className="px-4 py-3 font-mono text-sm text-blue-600">{field.example}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Champs optionnels */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center space-x-2">
              <Info className="h-5 w-5 text-blue-600" />
              <span>Champs Optionnels</span>
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {currentGuide.optionalFields.map((field, index) => (
                <div key={index} className="p-4 border border-gray-200 rounded-lg">
                  <h4 className="font-medium text-gray-800 mb-1">{field.field}</h4>
                  <p className="text-sm text-gray-600 mb-2">{field.description}</p>
                  <p className="text-xs font-mono text-blue-600 bg-blue-50 px-2 py-1 rounded">
                    Exemple: {field.example}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Conseils et bonnes pratiques */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span>Conseils et Bonnes Pratiques</span>
            </h3>
            
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <ul className="space-y-2">
                {currentGuide.tips.map((tip, index) => (
                  <li key={index} className="flex items-start space-x-2">
                    <span className="w-2 h-2 bg-green-600 rounded-full mt-2 flex-shrink-0"></span>
                    <span className="text-sm text-green-800">{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Formats de données */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Formats de Données Acceptés</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h4 className="font-medium text-blue-800 mb-2">Dates</h4>
                <div className="text-sm text-blue-700 space-y-1">
                  <p>• JJ/MM/AAAA (15/03/2013)</p>
                  <p>• AAAA-MM-JJ (2013-03-15)</p>
                  <p>• Format Excel automatique</p>
                </div>
              </div>

              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <h4 className="font-medium text-green-800 mb-2">Téléphones</h4>
                <div className="text-sm text-green-700 space-y-1">
                  <p>• +229 01 23 45 67</p>
                  <p>• 01 23 45 67</p>
                  <p>• 22901234567</p>
                </div>
              </div>

              <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                <h4 className="font-medium text-purple-800 mb-2">Listes</h4>
                <div className="text-sm text-purple-700 space-y-1">
                  <p>• Séparées par virgules</p>
                  <p>• Espaces automatiquement supprimés</p>
                  <p>• Ex: Math, Sciences, Français</p>
                </div>
              </div>
            </div>
          </div>

          {/* Erreurs communes */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-orange-600" />
              <span>Erreurs Communes à Éviter</span>
            </h3>
            
            <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
              <ul className="space-y-2">
                <li className="flex items-start space-x-2">
                  <span className="w-2 h-2 bg-orange-600 rounded-full mt-2 flex-shrink-0"></span>
                  <span className="text-sm text-orange-800">
                    <strong>En-têtes incorrects:</strong> Respectez exactement les noms de colonnes du modèle
                  </span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="w-2 h-2 bg-orange-600 rounded-full mt-2 flex-shrink-0"></span>
                  <span className="text-sm text-orange-800">
                    <strong>Lignes vides:</strong> Supprimez les lignes vides entre les données
                  </span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="w-2 h-2 bg-orange-600 rounded-full mt-2 flex-shrink-0"></span>
                  <span className="text-sm text-orange-800">
                    <strong>Formats de date:</strong> Utilisez un format cohérent pour toutes les dates
                  </span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="w-2 h-2 bg-orange-600 rounded-full mt-2 flex-shrink-0"></span>
                  <span className="text-sm text-orange-800">
                    <strong>Caractères spéciaux:</strong> Évitez les caractères spéciaux dans les noms
                  </span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="w-2 h-2 bg-orange-600 rounded-full mt-2 flex-shrink-0"></span>
                  <span className="text-sm text-orange-800">
                    <strong>Doublons:</strong> Vérifiez qu'il n'y a pas de doublons dans vos données
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500">
              Consultez ce guide avant de préparer vos fichiers Excel
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => {
                  // Télécharger le guide en PDF (simulation)
                  alert('Téléchargement du guide PDF...');
                }}
                className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors flex items-center space-x-2"
              >
                <Download className="h-4 w-4" />
                <span>Guide PDF</span>
              </button>
              <button
                onClick={onClose}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Compris
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImportGuideModal;