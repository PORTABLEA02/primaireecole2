import React, { useState, useEffect } from 'react';
import { X, UserPlus, User, Calendar, Phone, Mail, MapPin, DollarSign, CreditCard } from 'lucide-react';
import { useAuth } from '../Auth/AuthProvider';
import { StudentService } from '../../services/studentService';
import { PaymentService } from '../../services/paymentService';
import { FEES_BY_LEVEL, AGE_RANGES } from '../../utils/constants';

interface AddStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddStudent: (studentData: StudentData, enrollmentData: EnrollmentData) => void;
}

interface StudentData {
  firstName: string;
  lastName: string;
  gender: 'Masculin' | 'Féminin';
  dateOfBirth: string;
  nationality: string;
  birthPlace: string;
  religion?: string;
  motherTongue: string;
  fatherName: string;
  fatherPhone: string;
  fatherOccupation: string;
  motherName: string;
  motherPhone: string;
  motherOccupation: string;
  guardianType: string;
  numberOfSiblings: number;
  transportMode: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  emergencyContactRelation: string;
  parentEmail: string;
  address: string;
  medicalInfo?: string;
  allergies?: string;
  previousSchool?: string;
}

interface EnrollmentData {
  classId: string;
  className: string;
  totalFees: number;
  initialPayment: number;
  paymentType: 'Inscription' | 'Scolarité';
  paymentMethod: string;
  mobileNumber?: string;
  bankDetails?: string;
  notes?: string;
}

const AddStudentModal: React.FC<AddStudentModalProps> = ({
  isOpen,
  onClose,
  onAddStudent
}) => {
  const { userSchool, currentAcademicYear } = useAuth();
  const [step, setStep] = useState<'student' | 'enrollment' | 'payment' | 'confirmation'>('student');
  const [loading, setLoading] = useState(false);
  const [availableClasses, setAvailableClasses] = useState<any[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [feeTypes, setFeeTypes] = useState<any[]>([]);

  const [studentData, setStudentData] = useState<StudentData>({
    firstName: '',
    lastName: '',
    gender: 'Masculin',
    dateOfBirth: '',
    nationality: 'Béninoise',
    birthPlace: '',
    religion: '',
    motherTongue: 'Fon',
    fatherName: '',
    fatherPhone: '',
    fatherOccupation: '',
    motherName: '',
    motherPhone: '',
    motherOccupation: '',
    guardianType: 'Parents',
    numberOfSiblings: 0,
    transportMode: 'À pied',
    emergencyContactName: '',
    emergencyContactPhone: '',
    emergencyContactRelation: 'Père',
    parentEmail: '',
    address: '',
    medicalInfo: '',
    allergies: '',
    previousSchool: ''
  });

  const [enrollmentData, setEnrollmentData] = useState<EnrollmentData>({
    classId: '',
    className: '',
    totalFees: 0,
    initialPayment: 0,
    paymentType: 'Inscription',
    paymentMethod: 'Espèces',
    mobileNumber: '',
    bankDetails: '',
    notes: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Données spécifiques au Bénin
  const nationalities = ['Béninoise', 'Nigériane', 'Togolaise', 'Burkinabè', 'Ivoirienne', 'Ghanéenne', 'Autre'];
  const languages = ['Fon', 'Yoruba', 'Bariba', 'Dendi', 'Français', 'Autre'];
  const religions = ['Christianisme', 'Islam', 'Vodoun', 'Autre', 'Non spécifié'];
  const guardianTypes = ['Parents', 'Père seul', 'Mère seule', 'Grands-parents', 'Tuteur', 'Famille élargie'];
  const transportModes = ['À pied', 'Vélo', 'Moto-taxi', 'Transport familial', 'Transport scolaire'];
  const occupations = [
    'Agriculteur', 'Commerçant', 'Artisan', 'Fonctionnaire', 'Enseignant', 'Chauffeur',
    'Couturier/Couturière', 'Coiffeur/Coiffeuse', 'Mécanicien', 'Maçon', 'Ménagère',
    'Vendeur/Vendeuse', 'Pêcheur', 'Éleveur', 'Autre'
  ];

  // Charger les données nécessaires
  useEffect(() => {
    if (isOpen && userSchool && currentAcademicYear) {
      loadData();
    }
  }, [isOpen, userSchool, currentAcademicYear]);

  const loadData = async () => {
    if (!userSchool || !currentAcademicYear) return;

    try {
      setLoading(true);

      const [classesData, methodsData, feesData] = await Promise.all([
        StudentService.getAvailableClassesForEnrollment(userSchool.id, currentAcademicYear.id),
        PaymentService.getPaymentMethods(userSchool.id),
        loadFeeTypes()
      ]);

      setAvailableClasses(classesData);
      setPaymentMethods(methodsData);
      setFeeTypes(feesData);

    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadFeeTypes = async () => {
    if (!userSchool) return [];

    try {
      const { data, error } = await supabase
        .from('fee_types')
        .select('*')
        .eq('school_id', userSchool.id)
        .order('level')
        .order('name');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erreur lors du chargement des types de frais:', error);
      return [];
    }
  };

  const validateStep = (currentStep: string) => {
    const newErrors: Record<string, string> = {};

    if (currentStep === 'student') {
      if (!studentData.firstName.trim()) newErrors.firstName = 'Le prénom est requis';
      if (!studentData.lastName.trim()) newErrors.lastName = 'Le nom est requis';
      if (!studentData.dateOfBirth) newErrors.dateOfBirth = 'La date de naissance est requise';
      if (!studentData.parentEmail.trim()) newErrors.parentEmail = 'L\'email du parent est requis';
      if (!studentData.address.trim()) newErrors.address = 'L\'adresse est requise';
      if (!studentData.fatherPhone.trim() && !studentData.motherPhone.trim()) {
        newErrors.parentPhone = 'Au moins un numéro de téléphone parent est requis';
      }

      // Validation de l'âge
      if (studentData.dateOfBirth) {
        const age = calculateAge(studentData.dateOfBirth);
        if (age < 3 || age > 18) {
          newErrors.dateOfBirth = 'L\'âge doit être entre 3 et 18 ans';
        }
      }

      // Validation email
      if (studentData.parentEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(studentData.parentEmail)) {
        newErrors.parentEmail = 'Format d\'email invalide';
      }
    }

    if (currentStep === 'enrollment') {
      if (!enrollmentData.classId) newErrors.classId = 'Veuillez sélectionner une classe';
    }

    if (currentStep === 'payment') {
      if (enrollmentData.initialPayment > 0) {
        if (!enrollmentData.paymentMethod) newErrors.paymentMethod = 'Méthode de paiement requise';
        if (enrollmentData.paymentMethod === 'MTN Mobile Money' || enrollmentData.paymentMethod === 'Moov Money') {
          if (!enrollmentData.mobileNumber) newErrors.mobileNumber = 'Numéro de téléphone requis';
        }
        if (enrollmentData.paymentMethod === 'Virement Bancaire' && !enrollmentData.bankDetails) {
          newErrors.bankDetails = 'Détails bancaires requis';
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      if (step === 'student') setStep('enrollment');
      else if (step === 'enrollment') setStep('payment');
      else if (step === 'payment') setStep('confirmation');
    }
  };

  const handleBack = () => {
    if (step === 'enrollment') setStep('student');
    else if (step === 'payment') setStep('enrollment');
    else if (step === 'confirmation') setStep('payment');
  };

  const handleSubmit = () => {
    if (validateStep('payment')) {
      onAddStudent(studentData, enrollmentData);
      handleClose();
    }
  };

  const handleClose = () => {
    setStep('student');
    setStudentData({
      firstName: '',
      lastName: '',
      gender: 'Masculin',
      dateOfBirth: '',
      nationality: 'Béninoise',
      birthPlace: '',
      religion: '',
      motherTongue: 'Fon',
      fatherName: '',
      fatherPhone: '',
      fatherOccupation: '',
      motherName: '',
      motherPhone: '',
      motherOccupation: '',
      guardianType: 'Parents',
      numberOfSiblings: 0,
      transportMode: 'À pied',
      emergencyContactName: '',
      emergencyContactPhone: '',
      emergencyContactRelation: 'Père',
      parentEmail: '',
      address: '',
      medicalInfo: '',
      allergies: '',
      previousSchool: ''
    });
    setEnrollmentData({
      classId: '',
      className: '',
      totalFees: 0,
      initialPayment: 0,
      paymentType: 'Inscription',
      paymentMethod: 'Espèces',
      mobileNumber: '',
      bankDetails: '',
      notes: ''
    });
    setErrors({});
    onClose();
  };

  const calculateAge = (birthDate: string) => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
  };

  const handleClassSelect = (classId: string) => {
    const selectedClass = availableClasses.find(c => c.id === classId);
    if (selectedClass) {
      // Calculer les frais selon le niveau
      const levelFees = feeTypes.filter(fee => 
        fee.level === selectedClass.level || fee.level === 'Tous'
      );
      const totalFees = levelFees.reduce((sum, fee) => sum + fee.amount, 0);

      setEnrollmentData(prev => ({
        ...prev,
        classId,
        className: selectedClass.name,
        totalFees
      }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <UserPlus className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-800">Nouvel Élève</h2>
                <p className="text-gray-600">
                  {step === 'student' && 'Informations personnelles'}
                  {step === 'enrollment' && 'Inscription en classe'}
                  {step === 'payment' && 'Paiement initial'}
                  {step === 'confirmation' && 'Confirmation'}
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center space-x-4 mt-6">
            <div className={`flex items-center space-x-2 ${step === 'student' ? 'text-blue-600' : ['enrollment', 'payment', 'confirmation'].includes(step) ? 'text-green-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${step === 'student' ? 'bg-blue-100' : ['enrollment', 'payment', 'confirmation'].includes(step) ? 'bg-green-100' : 'bg-gray-100'}`}>
                1
              </div>
              <span className="text-sm font-medium">Élève</span>
            </div>
            <div className="flex-1 h-px bg-gray-200"></div>
            <div className={`flex items-center space-x-2 ${step === 'enrollment' ? 'text-blue-600' : ['payment', 'confirmation'].includes(step) ? 'text-green-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${step === 'enrollment' ? 'bg-blue-100' : ['payment', 'confirmation'].includes(step) ? 'bg-green-100' : 'bg-gray-100'}`}>
                2
              </div>
              <span className="text-sm font-medium">Inscription</span>
            </div>
            <div className="flex-1 h-px bg-gray-200"></div>
            <div className={`flex items-center space-x-2 ${step === 'payment' ? 'text-blue-600' : step === 'confirmation' ? 'text-green-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${step === 'payment' ? 'bg-blue-100' : step === 'confirmation' ? 'bg-green-100' : 'bg-gray-100'}`}>
                3
              </div>
              <span className="text-sm font-medium">Paiement</span>
            </div>
            <div className="flex-1 h-px bg-gray-200"></div>
            <div className={`flex items-center space-x-2 ${step === 'confirmation' ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${step === 'confirmation' ? 'bg-blue-100' : 'bg-gray-100'}`}>
                4
              </div>
              <span className="text-sm font-medium">Confirmation</span>
            </div>
          </div>
        </div>

        <div className="p-6">
          {/* Step 1: Student Information */}
          {step === 'student' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-800">Informations de l'Élève</h3>
              
              {/* Informations de base */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Prénom *
                  </label>
                  <input
                    type="text"
                    value={studentData.firstName}
                    onChange={(e) => setStudentData(prev => ({ ...prev, firstName: e.target.value }))}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.firstName ? 'border-red-300' : 'border-gray-200'
                    }`}
                  />
                  {errors.firstName && <p className="text-red-500 text-sm mt-1">{errors.firstName}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nom *
                  </label>
                  <input
                    type="text"
                    value={studentData.lastName}
                    onChange={(e) => setStudentData(prev => ({ ...prev, lastName: e.target.value }))}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.lastName ? 'border-red-300' : 'border-gray-200'
                    }`}
                  />
                  {errors.lastName && <p className="text-red-500 text-sm mt-1">{errors.lastName}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sexe *
                  </label>
                  <select
                    value={studentData.gender}
                    onChange={(e) => setStudentData(prev => ({ ...prev, gender: e.target.value as 'Masculin' | 'Féminin' }))}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="Masculin">Masculin</option>
                    <option value="Féminin">Féminin</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date de Naissance *
                  </label>
                  <input
                    type="date"
                    value={studentData.dateOfBirth}
                    onChange={(e) => setStudentData(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.dateOfBirth ? 'border-red-300' : 'border-gray-200'
                    }`}
                  />
                  {errors.dateOfBirth && <p className="text-red-500 text-sm mt-1">{errors.dateOfBirth}</p>}
                  {studentData.dateOfBirth && (
                    <p className="text-sm text-gray-500 mt-1">Âge: {calculateAge(studentData.dateOfBirth)} ans</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nationalité
                  </label>
                  <select
                    value={studentData.nationality}
                    onChange={(e) => setStudentData(prev => ({ ...prev, nationality: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {nationalities.map(nat => (
                      <option key={nat} value={nat}>{nat}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Lieu de Naissance
                  </label>
                  <input
                    type="text"
                    value={studentData.birthPlace}
                    onChange={(e) => setStudentData(prev => ({ ...prev, birthPlace: e.target.value }))}
                    placeholder="Ex: Cotonou, Porto-Novo..."
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Langue Maternelle
                  </label>
                  <select
                    value={studentData.motherTongue}
                    onChange={(e) => setStudentData(prev => ({ ...prev, motherTongue: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {languages.map(lang => (
                      <option key={lang} value={lang}>{lang}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Religion
                  </label>
                  <select
                    value={studentData.religion}
                    onChange={(e) => setStudentData(prev => ({ ...prev, religion: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Sélectionner</option>
                    {religions.map(rel => (
                      <option key={rel} value={rel}>{rel}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mode de Transport
                  </label>
                  <select
                    value={studentData.transportMode}
                    onChange={(e) => setStudentData(prev => ({ ...prev, transportMode: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {transportModes.map(mode => (
                      <option key={mode} value={mode}>{mode}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Contact famille */}
              <div className="p-4 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-blue-800 mb-3">Contact Famille</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Père */}
                  <div className="space-y-3">
                    <h5 className="font-medium text-blue-700">Père</h5>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nom complet</label>
                      <input
                        type="text"
                        value={studentData.fatherName}
                        onChange={(e) => setStudentData(prev => ({ ...prev, fatherName: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
                      <input
                        type="tel"
                        value={studentData.fatherPhone}
                        onChange={(e) => setStudentData(prev => ({ ...prev, fatherPhone: e.target.value }))}
                        placeholder="+229 XX XX XX XX"
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Profession</label>
                      <select
                        value={studentData.fatherOccupation}
                        onChange={(e) => setStudentData(prev => ({ ...prev, fatherOccupation: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Sélectionner</option>
                        {occupations.map(occ => (
                          <option key={occ} value={occ}>{occ}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Mère */}
                  <div className="space-y-3">
                    <h5 className="font-medium text-pink-700">Mère</h5>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nom complet</label>
                      <input
                        type="text"
                        value={studentData.motherName}
                        onChange={(e) => setStudentData(prev => ({ ...prev, motherName: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
                      <input
                        type="tel"
                        value={studentData.motherPhone}
                        onChange={(e) => setStudentData(prev => ({ ...prev, motherPhone: e.target.value }))}
                        placeholder="+229 XX XX XX XX"
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Profession</label>
                      <select
                        value={studentData.motherOccupation}
                        onChange={(e) => setStudentData(prev => ({ ...prev, motherOccupation: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Sélectionner</option>
                        {occupations.map(occ => (
                          <option key={occ} value={occ}>{occ}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {errors.parentPhone && (
                  <p className="text-red-500 text-sm mt-2">{errors.parentPhone}</p>
                )}
              </div>

              {/* Contact principal */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Mail className="h-4 w-4 inline mr-1" />
                    Email Principal *
                  </label>
                  <input
                    type="email"
                    value={studentData.parentEmail}
                    onChange={(e) => setStudentData(prev => ({ ...prev, parentEmail: e.target.value }))}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.parentEmail ? 'border-red-300' : 'border-gray-200'
                    }`}
                  />
                  {errors.parentEmail && <p className="text-red-500 text-sm mt-1">{errors.parentEmail}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Type de Tuteur
                  </label>
                  <select
                    value={studentData.guardianType}
                    onChange={(e) => setStudentData(prev => ({ ...prev, guardianType: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {guardianTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <MapPin className="h-4 w-4 inline mr-1" />
                  Adresse Complète *
                </label>
                <textarea
                  value={studentData.address}
                  onChange={(e) => setStudentData(prev => ({ ...prev, address: e.target.value }))}
                  rows={3}
                  placeholder="Quartier, rue, ville..."
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.address ? 'border-red-300' : 'border-gray-200'
                  }`}
                />
                {errors.address && <p className="text-red-500 text-sm mt-1">{errors.address}</p>}
              </div>

              {/* Contact d'urgence */}
              <div className="p-4 bg-red-50 rounded-lg">
                <h4 className="font-medium text-red-800 mb-3">Contact d'Urgence</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nom</label>
                    <input
                      type="text"
                      value={studentData.emergencyContactName}
                      onChange={(e) => setStudentData(prev => ({ ...prev, emergencyContactName: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
                    <input
                      type="tel"
                      value={studentData.emergencyContactPhone}
                      onChange={(e) => setStudentData(prev => ({ ...prev, emergencyContactPhone: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Relation</label>
                    <select
                      value={studentData.emergencyContactRelation}
                      onChange={(e) => setStudentData(prev => ({ ...prev, emergencyContactRelation: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="Père">Père</option>
                      <option value="Mère">Mère</option>
                      <option value="Grand-parent">Grand-parent</option>
                      <option value="Oncle/Tante">Oncle/Tante</option>
                      <option value="Tuteur">Tuteur</option>
                      <option value="Autre">Autre</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Class Enrollment */}
          {step === 'enrollment' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-800">Inscription en Classe</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {availableClasses.map((classItem) => {
                  const isSelected = enrollmentData.classId === classItem.id;
                  const availablePlaces = classItem.capacity - classItem.current_students;
                  const isFull = availablePlaces <= 0;
                  
                  return (
                    <div
                      key={classItem.id}
                      onClick={() => !isFull && handleClassSelect(classItem.id)}
                      className={`p-4 border-2 rounded-lg transition-all ${
                        isFull 
                          ? 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-60'
                          : isSelected
                            ? 'border-green-500 bg-green-50 cursor-pointer'
                            : 'border-gray-200 hover:border-green-300 hover:bg-green-50 cursor-pointer'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-medium text-gray-800">{classItem.name}</h4>
                          <p className="text-sm text-gray-600">{classItem.level}</p>
                        </div>
                        {isFull && (
                          <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-medium">
                            Complète
                          </span>
                        )}
                      </div>
                      
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Enseignant:</span>
                          <span className="font-medium">
                            {classItem.teacher_assignment?.teacher 
                              ? `${classItem.teacher_assignment.teacher.first_name} ${classItem.teacher_assignment.teacher.last_name}`
                              : 'Non assigné'
                            }
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Places:</span>
                          <span className={`font-medium ${availablePlaces > 5 ? 'text-green-600' : availablePlaces > 0 ? 'text-yellow-600' : 'text-red-600'}`}>
                            {availablePlaces} disponibles
                          </span>
                        </div>
                      </div>
                      
                      <div className="mt-3">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${
                              (classItem.current_students / classItem.capacity) >= 0.9 ? 'bg-red-500' :
                              (classItem.current_students / classItem.capacity) >= 0.75 ? 'bg-yellow-500' : 'bg-green-500'
                            }`}
                            style={{ width: `${(classItem.current_students / classItem.capacity) * 100}%` }}
                          ></div>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {classItem.current_students}/{classItem.capacity} élèves
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {errors.classId && (
                <p className="text-red-500 text-sm">{errors.classId}</p>
              )}

              {enrollmentData.classId && (
                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <h4 className="font-medium text-green-800 mb-2">Classe Sélectionnée</h4>
                  <div className="text-sm text-green-700">
                    <p><strong>Classe:</strong> {enrollmentData.className}</p>
                    <p><strong>Frais totaux:</strong> {enrollmentData.totalFees.toLocaleString()} FCFA</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Payment */}
          {step === 'payment' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-800">Paiement Initial (Optionnel)</h3>
              
              <div className="p-4 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-blue-800 mb-2">Frais de Scolarité</h4>
                <p className="text-sm text-blue-700">
                  Total à payer pour {enrollmentData.className}: <strong>{enrollmentData.totalFees.toLocaleString()} FCFA</strong>
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Type de Paiement
                  </label>
                  <select
                    value={enrollmentData.paymentType}
                    onChange={(e) => setEnrollmentData(prev => ({ ...prev, paymentType: e.target.value as any }))}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="Inscription">Frais d'inscription</option>
                    <option value="Scolarité">Acompte scolarité</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Montant (FCFA)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max={enrollmentData.totalFees}
                    step="1000"
                    value={enrollmentData.initialPayment}
                    onChange={(e) => setEnrollmentData(prev => ({ ...prev, initialPayment: parseInt(e.target.value) || 0 }))}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Laisser à 0 pour inscrire sans paiement initial
                  </p>
                </div>
              </div>

              {enrollmentData.initialPayment > 0 && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Méthode de Paiement *
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {paymentMethods.filter(m => m.is_enabled).map(method => {
                        const Icon = getPaymentMethodIcon(method.type);
                        const isSelected = enrollmentData.paymentMethod === method.name;
                        
                        return (
                          <div
                            key={method.id}
                            onClick={() => setEnrollmentData(prev => ({ ...prev, paymentMethod: method.name }))}
                            className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                              isSelected 
                                ? 'border-blue-500 bg-blue-50' 
                                : 'border-gray-200 hover:border-blue-300'
                            }`}
                          >
                            <div className="flex items-center space-x-3 mb-2">
                              <Icon className={`h-5 w-5 ${isSelected ? 'text-blue-600' : 'text-gray-400'}`} />
                              <span className={`font-medium ${isSelected ? 'text-blue-800' : 'text-gray-700'}`}>
                                {method.name}
                              </span>
                            </div>
                            {method.fees_percentage > 0 && (
                              <p className="text-xs text-gray-500">
                                Frais: {method.fees_percentage}%
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    {errors.paymentMethod && <p className="text-red-500 text-sm mt-1">{errors.paymentMethod}</p>}
                  </div>

                  {/* Champs spécifiques selon la méthode */}
                  {(enrollmentData.paymentMethod === 'MTN Mobile Money' || enrollmentData.paymentMethod === 'Moov Money') && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Numéro de Téléphone Mobile Money *
                      </label>
                      <input
                        type="tel"
                        value={enrollmentData.mobileNumber}
                        onChange={(e) => setEnrollmentData(prev => ({ ...prev, mobileNumber: e.target.value }))}
                        placeholder="+229 XX XX XX XX"
                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          errors.mobileNumber ? 'border-red-300' : 'border-gray-200'
                        }`}
                      />
                      {errors.mobileNumber && <p className="text-red-500 text-sm mt-1">{errors.mobileNumber}</p>}
                    </div>
                  )}

                  {enrollmentData.paymentMethod === 'Virement Bancaire' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Détails Bancaires *
                      </label>
                      <input
                        type="text"
                        value={enrollmentData.bankDetails}
                        onChange={(e) => setEnrollmentData(prev => ({ ...prev, bankDetails: e.target.value }))}
                        placeholder="Numéro de compte ou RIB"
                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          errors.bankDetails ? 'border-red-300' : 'border-gray-200'
                        }`}
                      />
                      {errors.bankDetails && <p className="text-red-500 text-sm mt-1">{errors.bankDetails}</p>}
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Notes (Optionnel)
                    </label>
                    <textarea
                      value={enrollmentData.notes}
                      onChange={(e) => setEnrollmentData(prev => ({ ...prev, notes: e.target.value }))}
                      rows={2}
                      placeholder="Commentaires sur le paiement..."
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </>
              )}
            </div>
          )}

          {/* Step 4: Confirmation */}
          {step === 'confirmation' && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <UserPlus className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Confirmation d'Inscription</h3>
                <p className="text-gray-600">Vérifiez les informations avant de confirmer</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-gray-800 mb-3">Informations de l'Élève</h4>
                  <div className="space-y-2 text-sm">
                    <p><strong>Nom complet:</strong> {studentData.firstName} {studentData.lastName}</p>
                    <p><strong>Date de naissance:</strong> {new Date(studentData.dateOfBirth).toLocaleDateString('fr-FR')}</p>
                    <p><strong>Âge:</strong> {calculateAge(studentData.dateOfBirth)} ans</p>
                    <p><strong>Sexe:</strong> {studentData.gender}</p>
                    <p><strong>Nationalité:</strong> {studentData.nationality}</p>
                    <p><strong>Langue maternelle:</strong> {studentData.motherTongue}</p>
                  </div>
                </div>

                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-medium text-blue-800 mb-3">Contact Famille</h4>
                  <div className="space-y-2 text-sm text-blue-700">
                    <p><strong>Père:</strong> {studentData.fatherName || 'Non renseigné'}</p>
                    <p><strong>Tél. père:</strong> {studentData.fatherPhone || 'Non renseigné'}</p>
                    <p><strong>Mère:</strong> {studentData.motherName || 'Non renseigné'}</p>
                    <p><strong>Tél. mère:</strong> {studentData.motherPhone || 'Non renseigné'}</p>
                    <p><strong>Email:</strong> {studentData.parentEmail}</p>
                    <p><strong>Adresse:</strong> {studentData.address}</p>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-green-50 rounded-lg">
                <h4 className="font-medium text-green-800 mb-3">Détails de l'Inscription</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-green-700">
                  <div>
                    <p><strong>Classe:</strong> {enrollmentData.className}</p>
                    <p><strong>Année scolaire:</strong> {currentAcademicYear?.name}</p>
                    <p><strong>Frais totaux:</strong> {enrollmentData.totalFees.toLocaleString()} FCFA</p>
                  </div>
                  <div>
                    {enrollmentData.initialPayment > 0 ? (
                      <>
                        <p><strong>Paiement initial:</strong> {enrollmentData.initialPayment.toLocaleString()} FCFA</p>
                        <p><strong>Type:</strong> {enrollmentData.paymentType}</p>
                        <p><strong>Méthode:</strong> {enrollmentData.paymentMethod}</p>
                        <p><strong>Reste à payer:</strong> {(enrollmentData.totalFees - enrollmentData.initialPayment).toLocaleString()} FCFA</p>
                      </>
                    ) : (
                      <p><strong>Paiement initial:</strong> Aucun (inscription sans paiement)</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="p-6 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              {step !== 'student' && (
                <button
                  onClick={handleBack}
                  className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Retour
                </button>
              )}
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={handleClose}
                className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Annuler
              </button>
              
              {step !== 'confirmation' ? (
                <button
                  onClick={handleNext}
                  disabled={loading}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  Suivant
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2 disabled:opacity-50"
                >
                  <UserPlus className="h-4 w-4" />
                  <span>Confirmer l'Inscription</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddStudentModal;