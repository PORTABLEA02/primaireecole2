import { supabase } from '../lib/supabase';

export class TeacherService {
  // Obtenir tous les enseignants d'une école
  static async getTeachers(schoolId: string) {
    try {
      const { data, error } = await supabase
        .from('teachers')
        .select('*')
        .eq('school_id', schoolId)
        .order('last_name');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erreur lors du chargement des enseignants:', error);
      throw error;
    }
  }

  // Obtenir les affectations d'enseignants avec détails
  static async getTeacherAssignments(schoolId: string, academicYearId: string) {
    try {
      const { data, error } = await supabase
        .from('teacher_assignment_details')
        .select('*')
        .eq('school_id', schoolId)
        .eq('academic_year_id', academicYearId)
        .eq('is_active', true);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erreur lors du chargement des affectations:', error);
      throw error;
    }
  }

  // Créer un nouvel enseignant
  static async createTeacher(teacherData: {
    schoolId: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    address?: string;
    qualification?: string;
    experience?: string;
    specializations?: string[];
    hireDate?: string;
    emergencyContact?: string;
    performanceRating?: number;
  }) {
    try {
      const { data, error } = await supabase
        .from('teachers')
        .insert({
          school_id: teacherData.schoolId,
          first_name: teacherData.firstName,
          last_name: teacherData.lastName,
          email: teacherData.email,
          phone: teacherData.phone,
          address: teacherData.address,
          qualification: teacherData.qualification,
          experience: teacherData.experience,
          specializations: teacherData.specializations || [],
          hire_date: teacherData.hireDate,
          emergency_contact: teacherData.emergencyContact,
          performance_rating: teacherData.performanceRating || 4.0
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erreur lors de la création de l\'enseignant:', error);
      throw error;
    }
  }

  // Assigner un enseignant à une classe
  static async assignTeacherToClass(assignmentData: {
    teacherId: string;
    classId: string;
    schoolId: string;
    academicYearId: string;
    salaryAmount?: number;
    salaryCurrency?: string;
  }) {
    try {
      // Vérifier qu'il n'y a pas déjà une affectation active
      const { data: existing } = await supabase
        .from('teacher_class_assignments')
        .select('id')
        .eq('teacher_id', assignmentData.teacherId)
        .eq('academic_year_id', assignmentData.academicYearId)
        .eq('is_active', true)
        .single();

      if (existing) {
        throw new Error('Cet enseignant a déjà une classe assignée pour cette année');
      }

      const { data, error } = await supabase
        .from('teacher_class_assignments')
        .insert({
          teacher_id: assignmentData.teacherId,
          class_id: assignmentData.classId,
          school_id: assignmentData.schoolId,
          academic_year_id: assignmentData.academicYearId,
          salary_amount: assignmentData.salaryAmount,
          salary_currency: assignmentData.salaryCurrency || 'FCFA'
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erreur lors de l\'affectation:', error);
      throw error;
    }
  }

  // Changer l'affectation d'un enseignant
  static async changeTeacherAssignment(
    teacherId: string,
    newClassId: string,
    academicYearId: string,
    schoolId: string
  ) {
    try {
      // Désactiver l'affectation actuelle
      await supabase
        .from('teacher_class_assignments')
        .update({ is_active: false })
        .eq('teacher_id', teacherId)
        .eq('academic_year_id', academicYearId)
        .eq('is_active', true);

      // Créer la nouvelle affectation
      const { data, error } = await supabase
        .from('teacher_class_assignments')
        .insert({
          teacher_id: teacherId,
          class_id: newClassId,
          school_id: schoolId,
          academic_year_id: academicYearId
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erreur lors du changement d\'affectation:', error);
      throw error;
    }
  }

  // Mettre à jour un enseignant
  static async updateTeacher(teacherId: string, updates: Partial<any>) {
    try {
      const { data, error } = await supabase
        .from('teachers')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', teacherId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erreur lors de la mise à jour de l\'enseignant:', error);
      throw error;
    }
  }

  // Obtenir les enseignants disponibles (sans classe)
  static async getAvailableTeachers(schoolId: string, academicYearId: string) {
    try {
      const { data, error } = await supabase
        .from('teachers')
        .select(`
          *,
          assignment:teacher_class_assignments!left(id, is_active)
        `)
        .eq('school_id', schoolId)
        .eq('status', 'Actif')
        .is('assignment.id', null);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erreur lors du chargement des enseignants disponibles:', error);
      return [];
    }
  }

  // Obtenir l'emploi du temps d'un enseignant
  static async getTeacherSchedule(teacherId: string, academicYearId: string) {
    try {
      const { data, error } = await supabase
        .from('schedule_details')
        .select('*')
        .eq('teacher_id', teacherId)
        .eq('academic_year_id', academicYearId)
        .eq('is_active', true)
        .order('day_of_week')
        .order('start_time');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erreur lors du chargement de l\'emploi du temps:', error);
      return [];
    }
  }

  // Supprimer un enseignant (désactivation)
  static async deleteTeacher(teacherId: string) {
    try {
      const { error } = await supabase
        .from('teachers')
        .update({ status: 'Inactif' })
        .eq('id', teacherId);

      if (error) throw error;
    } catch (error) {
      console.error('Erreur lors de la suppression de l\'enseignant:', error);
      throw error;
    }
  }
}