import { supabase } from '../lib/supabase';
import { Student } from '../types/User';

export class StudentService {
  // Obtenir tous les élèves d'une école pour une année
  static async getStudents(schoolId: string, academicYearId: string) {
    try {
      const { data, error } = await supabase
        .from('enrollment_details')
        .select('*')
        .eq('school_id', schoolId)
        .eq('academic_year_id', academicYearId)
        .eq('is_active', true)
        .order('last_name');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erreur lors du chargement des élèves:', error);
      throw error;
    }
  }

  // Obtenir un élève par ID
  static async getStudentById(studentId: string) {
    try {
      const { data, error } = await supabase
        .from('students')
        .select(`
          *,
          enrollments:student_class_enrollments!inner(
            *,
            class:classes(name, level),
            academic_year:academic_years(name)
          )
        `)
        .eq('id', studentId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erreur lors du chargement de l\'élève:', error);
      throw error;
    }
  }

  // Créer un nouvel élève
  static async createStudent(studentData: {
    schoolId: string;
    firstName: string;
    lastName: string;
    gender: 'Masculin' | 'Féminin';
    dateOfBirth: string;
    birthPlace?: string;
    nationality?: string;
    religion?: string;
    bloodType?: string;
    motherTongue?: string;
    fatherName?: string;
    fatherPhone?: string;
    fatherOccupation?: string;
    motherName?: string;
    motherPhone?: string;
    motherOccupation?: string;
    guardianType?: string;
    numberOfSiblings?: number;
    transportMode?: string;
    medicalInfo?: string;
    allergies?: string;
    previousSchool?: string;
    emergencyContactName?: string;
    emergencyContactPhone?: string;
    emergencyContactRelation?: string;
    parentEmail: string;
    address: string;
  }) {
    try {
      const { data, error } = await supabase
        .from('students')
        .insert({
          school_id: studentData.schoolId,
          first_name: studentData.firstName,
          last_name: studentData.lastName,
          gender: studentData.gender,
          date_of_birth: studentData.dateOfBirth,
          birth_place: studentData.birthPlace,
          nationality: studentData.nationality || 'Malienne',
          religion: studentData.religion,
          blood_type: studentData.bloodType,
          mother_tongue: studentData.motherTongue || 'Bambara',
          father_name: studentData.fatherName,
          father_phone: studentData.fatherPhone,
          father_occupation: studentData.fatherOccupation,
          mother_name: studentData.motherName,
          mother_phone: studentData.motherPhone,
          mother_occupation: studentData.motherOccupation,
          guardian_type: studentData.guardianType || 'Parents',
          number_of_siblings: studentData.numberOfSiblings || 0,
          transport_mode: studentData.transportMode || 'À pied',
          medical_info: studentData.medicalInfo,
          allergies: studentData.allergies,
          previous_school: studentData.previousSchool,
          emergency_contact_name: studentData.emergencyContactName,
          emergency_contact_phone: studentData.emergencyContactPhone,
          emergency_contact_relation: studentData.emergencyContactRelation,
          parent_email: studentData.parentEmail,
          address: studentData.address
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erreur lors de la création de l\'élève:', error);
      throw error;
    }
  }

  // Inscrire un élève dans une classe
  static async enrollStudent(enrollmentData: {
    studentId: string;
    classId: string;
    schoolId: string;
    academicYearId: string;
    totalFees: number;
    paidAmount?: number;
    paymentMethod?: string;
    mobileNumber?: string;
    bankDetails?: string;
    notes?: string;
  }) {
    try {
      const { data, error } = await supabase
        .from('student_class_enrollments')
        .insert({
          student_id: enrollmentData.studentId,
          class_id: enrollmentData.classId,
          school_id: enrollmentData.schoolId,
          academic_year_id: enrollmentData.academicYearId,
          total_fees: enrollmentData.totalFees,
          paid_amount: enrollmentData.paidAmount || 0,
          payment_method: enrollmentData.paymentMethod,
          mobile_number: enrollmentData.mobileNumber,
          bank_details: enrollmentData.bankDetails,
          notes: enrollmentData.notes
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erreur lors de l\'inscription:', error);
      throw error;
    }
  }

  // Créer un élève avec inscription en une transaction
  static async createStudentWithEnrollment(
    studentData: any,
    enrollmentData: {
      classId: string;
      academicYearId: string;
      totalFees: number;
      paidAmount?: number;
      paymentMethod?: string;
      mobileNumber?: string;
      bankDetails?: string;
      notes?: string;
    }
  ) {
    try {
      // Créer l'élève
      const student = await this.createStudent(studentData);

      // Créer l'inscription
      const enrollment = await this.enrollStudent({
        studentId: student.id,
        schoolId: studentData.schoolId,
        ...enrollmentData
      });

      return { student, enrollment };
    } catch (error) {
      console.error('Erreur lors de la création avec inscription:', error);
      throw error;
    }
  }

  // Mettre à jour un élève
  static async updateStudent(studentId: string, updates: Partial<any>) {
    try {
      const { data, error } = await supabase
        .from('students')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', studentId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erreur lors de la mise à jour de l\'élève:', error);
      throw error;
    }
  }

  // Obtenir l'historique des paiements d'un élève
  static async getStudentPaymentHistory(enrollmentId: string) {
    try {
      const { data, error } = await supabase
        .from('payment_transactions')
        .select(`
          *,
          payment_method:payment_methods(name, type)
        `)
        .eq('enrollment_id', enrollmentId)
        .eq('status', 'Confirmé')
        .order('payment_date', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erreur lors du chargement de l\'historique:', error);
      return [];
    }
  }

  // Rechercher des élèves
  static async searchStudents(schoolId: string, academicYearId: string, searchTerm: string) {
    try {
      const { data, error } = await supabase
        .from('enrollment_details')
        .select('*')
        .eq('school_id', schoolId)
        .eq('academic_year_id', academicYearId)
        .eq('is_active', true)
        .or(`first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%,parent_email.ilike.%${searchTerm}%`)
        .order('last_name');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erreur lors de la recherche:', error);
      return [];
    }
  }

  // Obtenir les élèves par classe
  static async getStudentsByClass(classId: string, academicYearId: string) {
    try {
      const { data, error } = await supabase
        .from('enrollment_details')
        .select('*')
        .eq('class_id', classId)
        .eq('academic_year_id', academicYearId)
        .eq('is_active', true)
        .order('last_name');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erreur lors du chargement des élèves de la classe:', error);
      return [];
    }
  }

  // Transférer un élève vers une autre classe
  static async transferStudent(
    studentId: string,
    currentEnrollmentId: string,
    newClassId: string,
    academicYearId: string,
    schoolId: string
  ) {
    try {
      // Désactiver l'inscription actuelle
      await supabase
        .from('student_class_enrollments')
        .update({ is_active: false })
        .eq('id', currentEnrollmentId);

      // Créer une nouvelle inscription
      const { data, error } = await supabase
        .from('student_class_enrollments')
        .insert({
          student_id: studentId,
          class_id: newClassId,
          school_id: schoolId,
          academic_year_id: academicYearId,
          total_fees: 0, // À définir selon la nouvelle classe
          paid_amount: 0
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erreur lors du transfert:', error);
      throw error;
    }
  }

  // Mapper les données de la DB
  private static mapAcademicYearFromDB(dbYear: any): AcademicYear {
    return {
      id: dbYear.id,
      name: dbYear.name,
      startDate: dbYear.start_date,
      endDate: dbYear.end_date,
      isActive: dbYear.is_active,
      periods: dbYear.periods || [],
      holidays: dbYear.holidays || [],
      createdAt: dbYear.created_at,
      updatedAt: dbYear.updated_at
    };
  }
}