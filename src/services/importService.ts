import { supabase } from '../lib/supabase';
import { StudentService } from './studentService';
import { TeacherService } from './teacherService';
import { SubjectService } from './subjectService';
import { ClassService } from './classService';
import { PaymentService } from './paymentService';
import { ValidationService } from './validationService';
import * as XLSX from 'xlsx';

export class ImportService {
  // Parser un fichier Excel
  static async parseExcelFile(file: File, importType: string): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          
          // Prendre la première feuille
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          
          // Convertir en JSON
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
          
          if (jsonData.length < 2) {
            reject(new Error('Le fichier doit contenir au moins une ligne d\'en-têtes et une ligne de données'));
            return;
          }
          
          // Première ligne = en-têtes
          const headers = jsonData[0] as string[];
          
          // Convertir les données en objets
          const parsedData = jsonData.slice(1).map((row: any, index) => {
            const rowData: any = {};
            headers.forEach((header, headerIndex) => {
              rowData[header] = row[headerIndex] || '';
            });
            rowData._rowNumber = index + 2; // +2 car on commence à la ligne 2 (après en-têtes)
            return rowData;
          }).filter(row => {
            // Filtrer les lignes vides
            return Object.values(row).some(value => value && value.toString().trim() !== '');
          });
          
          resolve(parsedData);
        } catch (error) {
          reject(new Error('Erreur lors de la lecture du fichier Excel'));
        }
      };
      
      reader.onerror = () => reject(new Error('Erreur lors de la lecture du fichier'));
      reader.readAsArrayBuffer(file);
    });
  }

  // Valider les données d'import
  static async validateImportData(
    data: any[], 
    importType: string, 
    schoolId?: string, 
    academicYearId?: string
  ): Promise<{ isValid: boolean; errors: any[] }> {
    const errors: any[] = [];

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const rowNumber = row._rowNumber || i + 1;

      try {
        switch (importType) {
          case 'students':
            await this.validateStudentRow(row, rowNumber, errors, schoolId, academicYearId);
            break;
          case 'teachers':
            await this.validateTeacherRow(row, rowNumber, errors, schoolId);
            break;
          case 'subjects':
            await this.validateSubjectRow(row, rowNumber, errors, schoolId);
            break;
        }
      } catch (error) {
        errors.push({
          row: rowNumber,
          message: `Erreur de validation: ${error}`,
          data: row
        });
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Valider une ligne d'élève
  private static async validateStudentRow(
    row: any, 
    rowNumber: number, 
    errors: any[], 
    schoolId?: string, 
    academicYearId?: string
  ) {
    // Champs obligatoires
    const requiredFields = ['Prénom', 'Nom', 'Sexe', 'Date de naissance', 'Classe', 'Email parent'];
    
    for (const field of requiredFields) {
      if (!row[field] || row[field].toString().trim() === '') {
        errors.push({
          row: rowNumber,
          field,
          message: `Le champ "${field}" est obligatoire`,
          data: row
        });
      }
    }

    // Validation du sexe
    if (row['Sexe'] && !['Masculin', 'Féminin', 'M', 'F'].includes(row['Sexe'])) {
      errors.push({
        row: rowNumber,
        field: 'Sexe',
        message: 'Le sexe doit être "Masculin", "Féminin", "M" ou "F"',
        data: row
      });
    }

    // Validation de l'email
    if (row['Email parent'] && !ValidationService.isValidEmail(row['Email parent'])) {
      errors.push({
        row: rowNumber,
        field: 'Email parent',
        message: 'Format d\'email invalide',
        data: row
      });
    }

    // Validation de la date de naissance
    if (row['Date de naissance']) {
      const birthDate = this.parseDate(row['Date de naissance']);
      if (!birthDate) {
        errors.push({
          row: rowNumber,
          field: 'Date de naissance',
          message: 'Format de date invalide (utilisez JJ/MM/AAAA)',
          data: row
        });
      } else {
        const age = this.calculateAge(birthDate);
        if (age < 3 || age > 18) {
          errors.push({
            row: rowNumber,
            field: 'Date de naissance',
            message: 'L\'âge doit être entre 3 et 18 ans',
            data: row
          });
        }
      }
    }

    // Vérifier que la classe existe
    if (row['Classe'] && schoolId && academicYearId) {
      const { data: classExists } = await supabase
        .from('classes')
        .select('id')
        .eq('name', row['Classe'])
        .eq('school_id', schoolId)
        .eq('academic_year_id', academicYearId)
        .single();

      if (!classExists) {
        errors.push({
          row: rowNumber,
          field: 'Classe',
          message: `La classe "${row['Classe']}" n'existe pas`,
          data: row
        });
      }
    }

    // Au moins un contact parent
    if (!row['Téléphone père'] && !row['Téléphone mère']) {
      errors.push({
        row: rowNumber,
        field: 'Contact parent',
        message: 'Au moins un numéro de téléphone parent est requis',
        data: row
      });
    }
  }

  // Valider une ligne d'enseignant
  private static async validateTeacherRow(
    row: any, 
    rowNumber: number, 
    errors: any[], 
    schoolId?: string
  ) {
    const requiredFields = ['Prénom', 'Nom', 'Email', 'Qualification'];
    
    for (const field of requiredFields) {
      if (!row[field] || row[field].toString().trim() === '') {
        errors.push({
          row: rowNumber,
          field,
          message: `Le champ "${field}" est obligatoire`,
          data: row
        });
      }
    }

    // Validation de l'email
    if (row['Email'] && !ValidationService.isValidEmail(row['Email'])) {
      errors.push({
        row: rowNumber,
        field: 'Email',
        message: 'Format d\'email invalide',
        data: row
      });
    }

    // Vérifier l'unicité de l'email
    if (row['Email'] && schoolId) {
      const emailExists = await ValidationService.checkEmailUniqueness(row['Email'], schoolId);
      if (!emailExists) {
        errors.push({
          row: rowNumber,
          field: 'Email',
          message: 'Cette adresse email est déjà utilisée',
          data: row
        });
      }
    }

    // Validation du salaire
    if (row['Salaire'] && (isNaN(row['Salaire']) || row['Salaire'] < 50000 || row['Salaire'] > 1000000)) {
      errors.push({
        row: rowNumber,
        field: 'Salaire',
        message: 'Le salaire doit être entre 50,000 et 1,000,000 FCFA',
        data: row
      });
    }
  }

  // Valider une ligne de matière
  private static async validateSubjectRow(
    row: any, 
    rowNumber: number, 
    errors: any[], 
    schoolId?: string
  ) {
    const requiredFields = ['Nom matière', 'Coefficient'];
    
    for (const field of requiredFields) {
      if (!row[field] || row[field].toString().trim() === '') {
        errors.push({
          row: rowNumber,
          field,
          message: `Le champ "${field}" est obligatoire`,
          data: row
        });
      }
    }

    // Validation du coefficient
    if (row['Coefficient'] && (isNaN(row['Coefficient']) || row['Coefficient'] < 1 || row['Coefficient'] > 5)) {
      errors.push({
        row: rowNumber,
        field: 'Coefficient',
        message: 'Le coefficient doit être entre 1 et 5',
        data: row
      });
    }
  }

  // Importer des élèves
  static async importStudents(
    data: any[], 
    schoolId: string, 
    academicYearId: string
  ): Promise<{ success: number; errors: any[]; warnings: any[] }> {
    const results = { success: 0, errors: [], warnings: [] };

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const rowNumber = row._rowNumber || i + 1;

      try {
        // Préparer les données de l'élève
        const studentData = {
          schoolId,
          firstName: row['Prénom']?.toString().trim(),
          lastName: row['Nom']?.toString().trim(),
          gender: this.normalizeGender(row['Sexe']),
          dateOfBirth: this.parseDate(row['Date de naissance']),
          nationality: row['Nationalité'] || 'Béninoise',
          parentEmail: row['Email parent']?.toString().trim(),
          fatherName: row['Nom père']?.toString().trim(),
          fatherPhone: row['Téléphone père']?.toString().trim(),
          motherName: row['Nom mère']?.toString().trim(),
          motherPhone: row['Téléphone mère']?.toString().trim(),
          address: row['Adresse']?.toString().trim() || 'Adresse non renseignée',
          birthPlace: row['Lieu de naissance']?.toString().trim(),
          religion: row['Religion']?.toString().trim(),
          guardianType: row['Type tuteur']?.toString().trim() || 'Parents'
        };

        // Trouver la classe
        const { data: classData } = await supabase
          .from('classes')
          .select('id, level')
          .eq('name', row['Classe'])
          .eq('school_id', schoolId)
          .eq('academic_year_id', academicYearId)
          .single();

        if (!classData) {
          results.errors.push({
            row: rowNumber,
            field: 'Classe',
            message: `Classe "${row['Classe']}" non trouvée`,
            data: row
          });
          continue;
        }

        // Calculer les frais totaux
        const totalFees = row['Frais totaux'] ? 
          parseInt(row['Frais totaux']) : 
          await StudentService.calculateTotalFeesForLevel(schoolId, classData.level);

        // Préparer les données d'inscription
        const enrollmentData = {
          classId: classData.id,
          schoolId,
          academicYearId,
          totalFees,
          paidAmount: row['Paiement initial'] ? parseInt(row['Paiement initial']) : 0,
          paymentMethod: row['Méthode paiement']?.toString().trim(),
          mobileNumber: row['Numéro mobile']?.toString().trim(),
          notes: row['Notes']?.toString().trim()
        };

        // Créer l'élève avec inscription
        const { student, enrollment } = await StudentService.createStudentWithEnrollment(
          studentData,
          enrollmentData
        );

        // Enregistrer le paiement initial si spécifié
        if (enrollmentData.paidAmount > 0) {
          const paymentMethodData = await PaymentService.getPaymentMethodByName(
            schoolId, 
            enrollmentData.paymentMethod || 'Espèces'
          );

          await PaymentService.recordPayment({
            enrollmentId: enrollment.id,
            schoolId,
            academicYearId,
            amount: enrollmentData.paidAmount,
            paymentMethodId: paymentMethodData?.id,
            paymentType: 'Inscription',
            paymentDate: new Date().toISOString().split('T')[0],
            referenceNumber: `IMP-${Date.now()}-${i}`,
            notes: `Import en masse - ligne ${rowNumber}`
          });
        }

        results.success++;

      } catch (error: any) {
        results.errors.push({
          row: rowNumber,
          message: error.message || 'Erreur lors de la création de l\'élève',
          data: row
        });
      }
    }

    return results;
  }

  // Importer des enseignants
  static async importTeachers(
    data: any[], 
    schoolId: string
  ): Promise<{ success: number; errors: any[]; warnings: any[] }> {
    const results = { success: 0, errors: [], warnings: [] };

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const rowNumber = row._rowNumber || i + 1;

      try {
        // Préparer les données de l'enseignant
        const teacherData = {
          schoolId,
          firstName: row['Prénom']?.toString().trim(),
          lastName: row['Nom']?.toString().trim(),
          email: row['Email']?.toString().trim(),
          phone: row['Téléphone']?.toString().trim(),
          qualification: row['Qualification']?.toString().trim(),
          experience: row['Expérience']?.toString().trim(),
          specializations: row['Spécialisations'] ? 
            row['Spécialisations'].toString().split(',').map((s: string) => s.trim()) : [],
          hireDate: this.parseDate(row['Date embauche']),
          emergencyContact: row['Contact urgence']?.toString().trim(),
          address: row['Adresse']?.toString().trim(),
          performanceRating: row['Note performance'] ? parseFloat(row['Note performance']) : 4.0
        };

        // Créer l'enseignant
        const teacher = await TeacherService.createTeacher(teacherData);

        // Assigner à une classe si spécifié
        if (row['Classe assignée'] && row['Classe assignée'].toString().trim() !== '') {
          try {
            const { data: classData } = await supabase
              .from('classes')
              .select('id')
              .eq('name', row['Classe assignée'])
              .eq('school_id', schoolId)
              .single();

            if (classData) {
              await TeacherService.assignTeacherToClass({
                teacherId: teacher.id,
                classId: classData.id,
                schoolId,
                academicYearId: academicYearId || '',
                salaryAmount: row['Salaire'] ? parseInt(row['Salaire']) : 150000
              });
            } else {
              results.warnings.push({
                row: rowNumber,
                message: `Classe "${row['Classe assignée']}" non trouvée, enseignant créé sans affectation`,
                data: row
              });
            }
          } catch (assignError) {
            results.warnings.push({
              row: rowNumber,
              message: `Erreur lors de l'affectation à la classe: ${assignError}`,
              data: row
            });
          }
        }

        results.success++;

      } catch (error: any) {
        results.errors.push({
          row: rowNumber,
          message: error.message || 'Erreur lors de la création de l\'enseignant',
          data: row
        });
      }
    }

    return results;
  }

  // Importer des matières
  static async importSubjects(
    data: any[], 
    schoolId: string
  ): Promise<{ success: number; errors: any[]; warnings: any[] }> {
    const results = { success: 0, errors: [], warnings: [] };

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const rowNumber = row._rowNumber || i + 1;

      try {
        // Préparer les données de la matière
        const subjectData = {
          schoolId,
          name: row['Nom matière']?.toString().trim(),
          description: row['Description']?.toString().trim(),
          coefficient: row['Coefficient'] ? parseInt(row['Coefficient']) : 1,
          levels: row['Niveaux concernés'] ? 
            row['Niveaux concernés'].toString().split(',').map((l: string) => l.trim()) : []
        };

        // Vérifier l'unicité du nom
        const { data: existingSubject } = await supabase
          .from('subjects')
          .select('id')
          .eq('name', subjectData.name)
          .eq('school_id', schoolId)
          .single();

        if (existingSubject) {
          results.warnings.push({
            row: rowNumber,
            message: `La matière "${subjectData.name}" existe déjà`,
            data: row
          });
          continue;
        }

        // Créer la matière
        await SubjectService.createSubject(subjectData);
        results.success++;

      } catch (error: any) {
        results.errors.push({
          row: rowNumber,
          message: error.message || 'Erreur lors de la création de la matière',
          data: row
        });
      }
    }

    return results;
  }

  // Télécharger un modèle Excel
  static downloadTemplate(importType: string, fields: string[]) {
    // Créer un nouveau workbook
    const wb = XLSX.utils.book_new();
    
    // Créer les données d'exemple selon le type
    let sampleData: any[] = [];
    
    switch (importType) {
      case 'students':
        sampleData = [
          fields,
          [
            'Aminata', 'Traore', 'Féminin', '15/03/2013', 'Béninoise', 'CM2A',
            'parent@example.com', 'Moussa Traore', '+229 01 23 45 67', 'Fatoumata Kone', '+229 01 23 45 68',
            'Quartier Zongo, Cotonou', '450000', '100000', 'Espèces'
          ],
          [
            'Ibrahim', 'Kone', 'Masculin', '22/07/2012', 'Béninoise', 'CM2A',
            'kone.family@example.com', 'Sekou Kone', '+229 01 34 56 78', 'Mariam Diallo', '+229 01 34 56 79',
            'Quartier Akpakpa, Cotonou', '450000', '200000', 'Mobile Money'
          ]
        ];
        break;
        
      case 'teachers':
        sampleData = [
          fields,
          [
            'Moussa', 'Ouattara', 'moussa.ouattara@example.com', '+229 01 45 67 89',
            'Licence en Pédagogie', '8 ans', 'Mathématiques, Sciences', 'CM2A',
            '180000', '01/09/2024', '+229 01 45 67 90'
          ],
          [
            'Fatoumata', 'Coulibaly', 'fatoumata.coulibaly@example.com', '+229 01 56 78 90',
            'Master en Lettres', '5 ans', 'Français, Littérature', 'CE2B',
            '160000', '01/09/2024', '+229 01 56 78 91'
          ]
        ];
        break;
        
      case 'subjects':
        sampleData = [
          fields,
          [
            'Français', 'Langue française, lecture, écriture', '4', 'CI,CP,CE1,CE2,CM1,CM2'
          ],
          [
            'Mathématiques', 'Calcul, géométrie, résolution de problèmes', '4', 'CI,CP,CE1,CE2,CM1,CM2'
          ],
          [
            'Sciences Naturelles', 'Biologie, physique, chimie de base', '2', 'CE1,CE2,CM1,CM2'
          ]
        ];
        break;
    }
    
    // Créer la feuille de calcul
    const ws = XLSX.utils.aoa_to_sheet(sampleData);
    
    // Ajouter la feuille au workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Données');
    
    // Télécharger le fichier
    const fileName = `Modele_Import_${importType}_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
  }

  // Utilitaires
  private static parseDate(dateString: string): string | null {
    if (!dateString) return null;
    
    try {
      // Essayer différents formats
      const formats = [
        /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/, // JJ/MM/AAAA
        /^(\d{4})-(\d{1,2})-(\d{1,2})$/, // AAAA-MM-JJ
        /^(\d{1,2})-(\d{1,2})-(\d{4})$/, // JJ-MM-AAAA
      ];
      
      for (const format of formats) {
        const match = dateString.toString().match(format);
        if (match) {
          if (format === formats[0] || format === formats[2]) {
            // Format JJ/MM/AAAA ou JJ-MM-AAAA
            const [, day, month, year] = match;
            return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
          } else {
            // Format AAAA-MM-JJ
            return dateString.toString();
          }
        }
      }
      
      // Essayer de parser comme date Excel (nombre de jours depuis 1900)
      const excelDate = parseFloat(dateString.toString());
      if (!isNaN(excelDate) && excelDate > 0) {
        const date = new Date((excelDate - 25569) * 86400 * 1000);
        return date.toISOString().split('T')[0];
      }
      
      return null;
    } catch (error) {
      return null;
    }
  }

  private static normalizeGender(gender: string): 'Masculin' | 'Féminin' {
    const normalized = gender?.toString().toLowerCase().trim();
    if (normalized === 'm' || normalized === 'masculin' || normalized === 'homme' || normalized === 'garçon') {
      return 'Masculin';
    }
    if (normalized === 'f' || normalized === 'féminin' || normalized === 'femme' || normalized === 'fille') {
      return 'Féminin';
    }
    return 'Masculin'; // Valeur par défaut
  }

  private static calculateAge(birthDate: string): number {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
  }

  // Obtenir les statistiques d'import
  static async getImportStats(schoolId: string, days: number = 30) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data, error } = await supabase
        .from('activity_logs')
        .select('action, created_at, details')
        .eq('school_id', schoolId)
        .eq('action', 'BULK_IMPORT')
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;

      return {
        totalImports: data?.length || 0,
        recentImports: data || [],
        lastImport: data?.[0]?.created_at || null
      };
    } catch (error) {
      console.error('Erreur lors du chargement des statistiques d\'import:', error);
      return { totalImports: 0, recentImports: [], lastImport: null };
    }
  }
}