import React from 'react';
import { Plus, FileText, Calendar, Users, Upload } from 'lucide-react';
import { useRouter } from '../../contexts/RouterContext';
import ImportButton from '../Import/ImportButton';

const QuickActions: React.FC = () => {
  const { navigate } = useRouter();

  const quickActions = [
    {
      title: 'Gestion Élèves',
      description: 'Gérer les élèves',
      icon: Users,
      color: 'blue',
      action: () => navigate('students')
    },
    {
      title: 'Nouveau Paiement',
      description: 'Enregistrer un paiement',
      icon: Plus,
      color: 'green',
      action: () => navigate('finance')
    },
    {
      title: 'Saisir Notes',
      description: 'Saisir des notes',
      icon: FileText,
      color: 'purple',
      action: () => navigate('academic')
    },
    {
      title: 'Emploi du Temps',
      description: 'Gérer les horaires',
      icon: Calendar,
      color: 'orange',
      action: () => navigate('schedule')
    }
  ];

  const getColorClasses = (color: string) => {
    const colorMap = {
      blue: 'bg-blue-50 text-blue-600 hover:bg-blue-100',
      green: 'bg-green-50 text-green-600 hover:bg-green-100',
      purple: 'bg-purple-50 text-purple-600 hover:bg-purple-100',
      orange: 'bg-orange-50 text-orange-600 hover:bg-orange-100'
    };
    return colorMap[color as keyof typeof colorMap] || colorMap.blue;
  };

  return (
    <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-gray-100">
      <h2 className="text-base sm:text-lg font-semibold text-gray-800 mb-4">Actions Rapides</h2>
      
      <div className="space-y-3">
        {quickActions.map((action, index) => {
          const Icon = action.icon;
          
          return (
            <button
              key={index}
              onClick={action.action}
              className={`w-full p-3 sm:p-4 rounded-lg transition-colors text-left ${getColorClasses(action.color)}`}
            >
              <div className="flex items-center space-x-2 sm:space-x-3">
                <Icon className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                <div>
                  <p className="text-sm sm:text-base font-medium">{action.title}</p>
                  <p className="text-xs sm:text-sm opacity-75">{action.description}</p>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <div className="mt-6 pt-6 border-t border-gray-100">
        <h3 className="text-sm font-medium text-gray-700 mb-3">Import en Masse</h3>
        <ImportButton 
          variant="secondary" 
          size="sm"
          className="w-full"
        />
      </div>

      <div className="mt-6 pt-6 border-t border-gray-100">
        <button onClick={() => navigate('settings')} className="w-full py-2 sm:py-3 px-4 bg-blue-600 text-white rounded-lg text-sm sm:text-base font-medium hover:bg-blue-700 transition-colors">
          Voir toutes les actions
        </button>
      </div>
    </div>
  );
};

export default QuickActions;