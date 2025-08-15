import React, { useState, useEffect } from 'react';
import { Users, Plus, RefreshCw, AlertCircle, Upload } from 'lucide-react';
import AddStudentModal from './AddStudentModal';
import StudentDetailModal from './StudentDetailModal';
import TransferStudentModal from './TransferStudentModal';
import StudentInvoiceModal from './StudentInvoiceModal';
import StudentStatsCard from './StudentStatsCard';
import StudentFilters from './StudentFilters';
import StudentTable from './StudentTable';
import ImportButton from '../Import/ImportButton';
import { OptimizedDataTable } from '../Common/OptimizedDataTable';
import { useOptimizedData } from '../../hooks/useOptimizedData';
import SmartLoader from '../Common/SmartLoader';
import { SkeletonTable, EmptyState } from '../Common/LoadingStates';
import { useAuth } from '../Auth/AuthProvider';
import { StudentService } from '../../services/studentService';
import { PaymentService } from '../../services/paymentService';
import { ActivityLogService } from '../../services/activityLogService';
import { StudentHelpers } from '../../utils/studentHelpers';
import { PerformanceOptimizer } from '../../utils/performanceOptimizer';

interface Student {
  id: string;
  student_id: string;
  first_name: string;
  last_name: string;
  gender: 'Masculin' | 'Féminin';
  date_of_birth: string;
  nationality: string;
  parent_email: string;
  father_name?: string;
  father_phone?: string;
  mother_name?: string;
  mother_phone?: string;
  address: string;
  class_name: string;
  level: string;
  enrollment_date: string;
  payment_status: 'À jour' | 'En retard' | 'Partiel';
  outstanding_amount: number;
  total_fees: number;
  paid_amount: number;
  is_active: boolean;
}

const StudentManagement: React.FC = () => {
  const { userSchool, currentAcademicYear, user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [classFilter, setClassFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);

  // Chargement optimisé des données
  const {
    data: studentsData,
    isLoading,
    error,
    refresh,
    progress,
    stage
  } = useOptimizedData(
    async () => {
      if (!userSchool || !currentAcademicYear) {
        throw new Error('Données manquantes');
      }

      // Utiliser le système de cache et de déduplication
      const [students, stats] = await Promise.all([
        PerformanceOptimizer.memoizedRequest(
          `students_${userSchool.id}_${currentAcademicYear.id}`,
          () => StudentService.getStudents(userSchool.id, currentAcademicYear.id)
        ),
        PerformanceOptimizer.memoizedRequest(
          `student_stats_${userSchool.id}_${currentAcademicYear.id}`,
          () => StudentService.getStudentStats(userSchool.id, currentAcademicYear.id)
        )
      ]);

      return { students, stats };
    },
    {
      cacheKey: 'students_management',
      dependencies: [userSchool?.id, currentAcademicYear?.id],
      cacheDuration: 3 * 60 * 1000, // 3 minutes
      enableRealTime: true
    }
  );

  const students = studentsData?.students || [];
  const stats = studentsData?.stats;

  // Filtrer les élèves
  const filteredStudents = React.useMemo(() => {
    return students.filter(student => {
      const matchesSearch = `${student.first_name} ${student.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (student.father_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (student.mother_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (student.father_phone || '').includes(searchTerm) ||
                           (student.mother_phone || '').includes(searchTerm) ||
                           student.parent_email.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesClass = classFilter === 'all' || student.class_name === classFilter;
      const matchesStatus = statusFilter === 'all' || student.is_active.toString() === statusFilter;
      const matchesPayment = paymentFilter === 'all' || student.payment_status === paymentFilter;
      
      return matchesSearch && matchesClass && matchesStatus && matchesPayment;
    });
  }, [students, searchTerm, classFilter, statusFilter, paymentFilter]);

  // Obtenir les classes uniques pour le filtre
  const uniqueClasses = [...new Set(students.map(s => s.class_name))].sort();

  const getStatusColor = (isActive: boolean) => {
    return isActive 
      ? 'bg-green-50 text-green-700 border-green-200'
      : 'bg-red-50 text-red-700 border-red-200';
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'À jour': return 'bg-green-50 text-green-700';
      case 'En retard': return 'bg-red-50 text-red-700';
      case 'Partiel': return 'bg-yellow-50 text-yellow-700';
      default: return 'bg-gray-50 text-gray-700';
    }
  };

  const handleAddStudent = async (studentData: any, enrollmentData: any) => {
    if (!userSchool || !currentAcademicYear) return;

    try {
      // Créer l'élève et l'inscription
      const { student, enrollment } = await StudentService.createStudentWithEnrollment(
        studentData,
        enrollmentData
      );
      
      // Si un paiement initial est effectué, l'enregistrer
      if (enrollmentData.initialPayment > 0) {
        const referencePrefix = enrollmentData.paymentType === 'Inscription' ? 'INS' : 'SCO';
        await PaymentService.recordPayment({
          enrollmentId: enrollment.id,
          schoolId: userSchool.id,
          academicYearId: currentAcademicYear.id,
          amount: enrollmentData.initialPayment,
          paymentMethodId: enrollmentData.paymentMethodId || null,
          paymentType: enrollmentData.paymentType,
          paymentDate: new Date().toISOString().split('T')[0],
          referenceNumber: `${referencePrefix}-${Date.now()}`,
          mobileNumber: enrollmentData.mobileNumber,
          bankDetails: enrollmentData.bankDetails,
          notes: enrollmentData.notes,
          processedBy: user?.id
        });
        
        // Logger le paiement
        await ActivityLogService.logActivity({
          schoolId: userSchool.id,
          action: 'RECORD_INITIAL_PAYMENT',
          entityType: 'payment',
          level: 'success',
          details: `Paiement initial ${enrollmentData.paymentType} de ${enrollmentData.initialPayment.toLocaleString()} FCFA pour ${studentData.firstName} ${studentData.lastName}`
        });
      }
      
      // Recharger les données
      refresh();
      
      const message = enrollmentData.initialPayment > 0 
        ? `Élève inscrit avec succès ! Paiement initial ${enrollmentData.paymentType} de ${enrollmentData.initialPayment.toLocaleString()} FCFA enregistré.`
        : 'Élève inscrit avec succès !';
      alert(message);
    } catch (error: any) {
      console.error('Erreur lors de l\'ajout:', error);
      alert(`Erreur: ${error.message}`);
    }
  };

  const handleViewStudent = (student: Student) => {
    setSelectedStudent(student);
    setShowDetailModal(true);
  };

  const handleTransferStudent = (student: Student) => {
    setSelectedStudent(student);
    setShowTransferModal(true);
  };

  const handleWithdrawStudent = async (student: Student) => {
    const reason = prompt('Raison du retrait:');
    if (reason && confirm(`Êtes-vous sûr de vouloir retirer ${student.first_name} ${student.last_name} ?`)) {
      try {
        // Trouver l'inscription active
        const enrollment = students.find(s => s.student_id === student.student_id);
        if (enrollment) {
          await StudentService.withdrawStudent(enrollment.id, reason);
          refresh();
          alert('Élève retiré avec succès');
        }
      } catch (error: any) {
        alert(`Erreur: ${error.message}`);
      }
    }
  };

  const handlePrintInvoice = (student: Student) => {
    setSelectedStudent(student);
    setShowInvoiceModal(true);
  };
  const exportStudents = () => {
    const exportData = filteredStudents.map(student => 
      StudentHelpers.formatStudentForExport(student)
    );

    // Créer et télécharger le CSV
    const headers = Object.keys(exportData[0] || {});
    const csvContent = [
      headers.join(','),
      ...exportData.map(row => 
        headers.map(header => {
          const value = row[header as keyof typeof row];
          if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        }).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `eleves_${userSchool?.name}_${currentAcademicYear?.name}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Définir les colonnes pour le tableau optimisé
  const tableColumns = [
    {
      key: 'name' as keyof Student,
      label: 'Élève',
      render: (_, student: Student) => (
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
            <span className="text-blue-600 font-medium">
              {StudentHelpers.getInitials(student.first_name, student.last_name)}
            </span>
          </div>
          <div>
            <p className="font-medium text-gray-800">
              {StudentHelpers.formatFullName(student.first_name, student.last_name)}
            </p>
            <p className="text-sm text-gray-500">
              {student.gender} • {StudentHelpers.calculateAge(student.date_of_birth)} ans
            </p>
          </div>
        </div>
      ),
      searchable: true
    },
    {
      key: 'class_name' as keyof Student,
      label: 'Classe',
      render: (value: string, student: Student) => (
        <div>
          <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-medium">
            {value}
          </span>
          <p className="text-xs text-gray-500 mt-1">{student.level}</p>
        </div>
      ),
      searchable: true
    },
    {
      key: 'payment_status' as keyof Student,
      label: 'Paiement',
      render: (status: string, student: Student) => {
        const display = StudentHelpers.getPaymentStatusDisplay(status);
        const progress = StudentHelpers.calculatePaymentProgress(student.paid_amount, student.total_fees);
        
        return (
          <div className="space-y-2">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${display.className}`}>
              {status}
            </span>
            <div className="text-sm text-gray-600">
              {student.paid_amount.toLocaleString()}/{student.total_fees.toLocaleString()} FCFA
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1">
              <div 
                className={`h-1 rounded-full ${
                  progress === 100 ? 'bg-green-600' :
                  progress > 0 ? 'bg-yellow-600' : 'bg-red-600'
                }`}
                style={{ width: `${Math.min(progress, 100)}%` }}
              ></div>
            </div>
          </div>
        );
      }
    }
  ];

  return (
    <SmartLoader
      isLoading={isLoading}
      error={error}
      progress={progress}
      stage={stage}
      onRetry={refresh}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Gestion des Élèves</h1>
            <p className="text-gray-600">
              {userSchool?.name} - Année {currentAcademicYear?.name}
            </p>
          </div>
          
          <div className="flex items-center space-x-3">
            <ImportButton 
              onImportComplete={refresh}
              variant="secondary"
            />
            <button 
              onClick={() => setShowAddStudentModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              <span>Nouvel Élève</span>
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        {stats ? (
          <StudentStatsCard stats={stats} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 animate-pulse">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-24"></div>
                    <div className="h-8 bg-gray-200 rounded w-32"></div>
                  </div>
                  <div className="w-12 h-12 bg-gray-200 rounded-xl"></div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Search and Filters */}
        <StudentFilters
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          classFilter={classFilter}
          onClassFilterChange={setClassFilter}
          paymentFilter={paymentFilter}
          onPaymentFilterChange={setPaymentFilter}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          availableClasses={uniqueClasses}
          onRefresh={refresh}
          onExport={exportStudents}
        />

        {/* Table optimisée */}
        <OptimizedDataTable
          data={filteredStudents}
          columns={tableColumns}
          isLoading={isLoading}
          error={error}
          onRetry={refresh}
          onRefresh={refresh}
          onExport={exportStudents}
          searchPlaceholder="Rechercher par nom, parent, téléphone..."
          emptyState={{
            icon: Users,
            title: 'Aucun élève trouvé',
            description: 'Commencez par ajouter votre premier élève',
            action: {
              label: 'Ajouter un Élève',
              onClick: () => setShowAddStudentModal(true)
            }
          }}
          actions={(student) => (
            <div className="flex items-center space-x-2">
              <button 
                onClick={() => handleViewStudent(student)}
                className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
                title="Voir détails"
              >
                <Users className="h-4 w-4" />
              </button>
              <button 
                onClick={() => handleTransferStudent(student)}
                className="p-1 text-purple-600 hover:text-purple-800 hover:bg-purple-50 rounded transition-colors"
                title="Transférer"
              >
                <RefreshCw className="h-4 w-4" />
              </button>
            </div>
          )}
        />

        {/* Modals */}
        <AddStudentModal
          isOpen={showAddStudentModal}
          onClose={() => setShowAddStudentModal(false)}
          onAddStudent={handleAddStudent}
        />

        {selectedStudent && (
          <>
            <StudentDetailModal
              isOpen={showDetailModal}
              onClose={() => {
                setShowDetailModal(false);
                setSelectedStudent(null);
              }}
              student={selectedStudent}
              onUpdate={refresh}
            />

            <TransferStudentModal
              isOpen={showTransferModal}
              onClose={() => {
                setShowTransferModal(false);
                setSelectedStudent(null);
              }}
              student={selectedStudent}
              onTransfer={refresh}
            />

            <StudentInvoiceModal
              isOpen={showInvoiceModal}
              onClose={() => {
                setShowInvoiceModal(false);
                setSelectedStudent(null);
              }}
              student={selectedStudent}
            />
          </>
        )}
      </div>
    </SmartLoader>
  );
};

export default StudentManagement;