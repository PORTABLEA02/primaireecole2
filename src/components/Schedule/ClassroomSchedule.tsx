import React, { useState } from 'react';
import { MapPin, Users, Clock, AlertCircle } from 'lucide-react';
import { useAuth } from '../Auth/AuthProvider';
import { ClassroomService } from '../../services/classroomService';
import { ScheduleService } from '../../services/scheduleService';

const ClassroomSchedule: React.FC = () => {
  const { userSchool, currentAcademicYear } = useAuth();
  const [selectedRoom, setSelectedRoom] = useState('salle-12');
  const [classrooms, setClassrooms] = useState<any[]>([]);
  const [roomSchedule, setRoomSchedule] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Charger les données au montage
  React.useEffect(() => {
    if (userSchool && currentAcademicYear) {
      loadClassroomData();
    }
  }, [userSchool, currentAcademicYear]);

  // Charger les données des salles et leur emploi du temps
  React.useEffect(() => {
    if (selectedRoom && currentAcademicYear) {
      loadRoomSchedule();
    }
  }, [selectedRoom, currentAcademicYear]);

  const loadClassroomData = async () => {
    if (!userSchool) return;

    try {
      setLoading(true);
      const classroomsData = await ClassroomService.getClassrooms(userSchool.id);
      setClassrooms(classroomsData);
      
      // Sélectionner la première salle si aucune n'est sélectionnée
      if (!selectedRoom && classroomsData.length > 0) {
        setSelectedRoom(classroomsData[0].id);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des salles:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadRoomSchedule = async () => {
    if (!selectedRoom || !currentAcademicYear) return;

    try {
      setLoading(true);
      const scheduleData = await ScheduleService.getClassroomSchedule(selectedRoom, currentAcademicYear.id);
      
      // Mapper les données
      const mappedSchedule = scheduleData.map(slot => ({
        day: slot.day_name,
        time: `${slot.start_time}-${slot.end_time}`,
        subject: slot.subject_name,
        class: slot.class_name,
        teacher: `${slot.teacher_first_name} ${slot.teacher_last_name}`
      }));
      
      setRoomSchedule(mappedSchedule);
    } catch (error) {
      console.error('Erreur lors du chargement de l\'emploi du temps de la salle:', error);
    } finally {
      setLoading(false);
    }
  };

  const days = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi'];
  const timeSlots = ['08:00-10:00', '10:00-12:00', '12:00-14:00', '14:00-16:00', '16:00-18:00'];

  const currentRoom = classrooms.find(r => r.id === selectedRoom);
  const schedule = roomSchedule;

  const getScheduleForSlot = (day: string, timeSlot: string) => {
    return schedule.find(item => item.day === day && item.time === timeSlot);
  };

  const getSubjectColor = (subject: string) => {
    const colors = {
      'Mathématiques': 'bg-blue-100 text-blue-800 border-blue-200',
      'Français': 'bg-green-100 text-green-800 border-green-200',
      'Sciences': 'bg-purple-100 text-purple-800 border-purple-200',
      'Histoire': 'bg-orange-100 text-orange-800 border-orange-200',
      'Anglais': 'bg-pink-100 text-pink-800 border-pink-200',
      'Arts': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'Sport': 'bg-red-100 text-red-800 border-red-200'
    };
    return colors[subject as keyof typeof colors] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const occupancyRate = (schedule.length / (days.length * timeSlots.length)) * 100;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des données...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Room Selection */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <MapPin className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-800">Occupation des Salles</h2>
              <p className="text-gray-600">Gestion et planification des espaces</p>
            </div>
          </div>
          
          <select 
            value={selectedRoom}
            onChange={(e) => setSelectedRoom(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {classrooms.map(room => (
              <option key={room.id} value={room.id}>{room.name} ({room.type})</option>
            ))}
          </select>
        </div>
      </div>

      {/* Room Info */}
      {currentRoom && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Capacité</p>
                <p className="text-2xl font-bold text-gray-800">{currentRoom.capacity}</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-xl">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <div className="mt-2">
              <span className="text-sm text-gray-500">places</span>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Taux d'Occupation</p>
                <p className="text-2xl font-bold text-gray-800">{Math.round(occupancyRate)}%</p>
              </div>
              <div className="p-3 bg-green-50 rounded-xl">
                <Clock className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <div className="mt-2">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-green-600 h-2 rounded-full"
                  style={{ width: `${occupancyRate}%` }}
                ></div>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Cours/Semaine</p>
                <p className="text-2xl font-bold text-gray-800">{schedule.length}</p>
              </div>
              <div className="p-3 bg-purple-50 rounded-xl">
                <span className="text-2xl">📚</span>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Type</p>
                <p className="text-lg font-bold text-gray-800">{currentRoom.type}</p>
              </div>
              <div className="p-3 bg-orange-50 rounded-xl">
                <MapPin className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Equipment Info */}
      {currentRoom && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Équipements Disponibles</h3>
          <div className="flex flex-wrap gap-2">
            {(currentRoom.equipment || []).map((item, index) => (
              <span key={index} className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm">
                {item}
              </span>
            ))}
            {(!currentRoom.equipment || currentRoom.equipment.length === 0) && (
              <span className="text-gray-500 italic">Aucun équipement renseigné</span>
            )}
          </div>
        </div>
      )}

      {/* Schedule Grid */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-800">
              Planning - {currentRoom?.name}
            </h3>
            <div className="flex items-center space-x-4 text-sm text-gray-500">
              <span>Semaine du 14-18 Octobre 2024</span>
            </div>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-24">
                  Horaires
                </th>
                {days.map(day => (
                  <th key={day} className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                    {day}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {timeSlots.map((timeSlot, timeIndex) => (
                <tr key={timeIndex} className="hover:bg-gray-50">
                  <td className="px-4 py-4 text-sm font-medium text-gray-700 bg-gray-50">
                    {timeSlot}
                  </td>
                  {days.map(day => {
                    const scheduleItem = getScheduleForSlot(day, timeSlot);
                    
                    return (
                      <td key={day} className="px-2 py-2 text-center">
                        {timeSlot === '12:00-14:00' ? (
                          <div className="h-20 flex items-center justify-center bg-yellow-50 border-2 border-yellow-200 rounded-lg">
                            <span className="text-yellow-700 font-medium">Pause</span>
                          </div>
                        ) : scheduleItem ? (
                          <div className={`p-3 rounded-lg border-2 ${getSubjectColor(scheduleItem.subject)}`}>
                            <div className="font-medium text-sm mb-1">{scheduleItem.subject}</div>
                            <div className="text-xs opacity-75 mb-1">{scheduleItem.class}</div>
                            <div className="text-xs opacity-60">{scheduleItem.teacher}</div>
                          </div>
                        ) : (
                          <div className="h-20 flex items-center justify-center text-gray-300 border-2 border-dashed border-gray-200 rounded-lg">
                            <span className="text-sm">Libre</span>
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Room Utilization Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Utilisation par Jour</h3>
          
          <div className="space-y-3">
            {days.map(day => {
              const daySchedule = schedule.filter(item => item.day === day);
              const dayOccupancy = (daySchedule.length / timeSlots.length) * 100;
              
              return (
                <div key={day} className="flex items-center justify-between">
                  <span className="font-medium text-gray-800 w-20">{day}</span>
                  <div className="flex-1 mx-4">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${
                          dayOccupancy >= 80 ? 'bg-red-500' :
                          dayOccupancy >= 60 ? 'bg-yellow-500' : 'bg-green-500'
                        }`}
                        style={{ width: `${dayOccupancy}%` }}
                      ></div>
                    </div>
                  </div>
                  <span className="text-sm font-medium text-gray-600 w-12">
                    {Math.round(dayOccupancy)}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Alertes et Recommandations</h3>
          
          <div className="space-y-3">
            {occupancyRate > 80 && (
              <div className="p-3 border border-red-200 rounded-lg bg-red-50">
                <div className="flex items-start space-x-2">
                  <AlertCircle className="h-4 w-4 text-red-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-red-800">Salle surchargée</p>
                    <p className="text-sm text-red-600">Taux d'occupation élevé ({Math.round(occupancyRate)}%)</p>
                  </div>
                </div>
              </div>
            )}
            
            {occupancyRate < 40 && (
              <div className="p-3 border border-yellow-200 rounded-lg bg-yellow-50">
                <div className="flex items-start space-x-2">
                  <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-yellow-800">Sous-utilisation</p>
                    <p className="text-sm text-yellow-600">Possibilité d'optimiser l'usage de cette salle</p>
                  </div>
                </div>
              </div>
            )}
            
            {schedule.length === 0 && (
              <div className="p-3 border border-blue-200 rounded-lg bg-blue-50">
                <div className="flex items-start space-x-2">
                  <span className="text-blue-600 mt-0.5">💡</span>
                  <div>
                    <p className="font-medium text-blue-800">Salle disponible</p>
                    <p className="text-sm text-blue-600">
                      Cette salle est entièrement libre et peut être utilisée
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            <div className="p-3 border border-blue-200 rounded-lg bg-blue-50">
              <div className="flex items-start space-x-2">
                <span className="text-blue-600 mt-0.5">💡</span>
                <div>
                  <p className="font-medium text-blue-800">Suggestion</p>
                  <p className="text-sm text-blue-600">
                    Créneaux libres disponibles pour activités supplémentaires
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {classrooms.length === 0 && !loading && (
        <div className="text-center py-12">
          <MapPin className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-800 mb-2">Aucune salle configurée</h3>
          <p className="text-gray-600">Configurez des salles de classe dans les paramètres</p>
        </div>
      )}
    </div>
  );
};

export default ClassroomSchedule;