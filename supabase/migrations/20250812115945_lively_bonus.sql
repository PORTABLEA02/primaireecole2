/*
  # Insertion de données d'exemple pour le système de gestion scolaire

  1. École de démonstration
  2. Année scolaire active
  3. Utilisateurs de test
  4. Classes et enseignants
  5. Élèves et inscriptions
  6. Données financières

  Note: Les mots de passe par défaut sont 'password123' pour tous les comptes de test
*/

-- Insérer l'école de démonstration
INSERT INTO schools (
  id,
  name,
  address,
  phone,
  email,
  director,
  founded_year,
  student_capacity,
  motto,
  is_active,
  settings
) VALUES (
  'ecole-tech-moderne',
  'École Technique Moderne',
  'Quartier ACI 2000, Bamako, Mali',
  '+223 20 22 33 44',
  'contact@ecoletech.edu.ml',
  'Dr. Amadou Sanogo',
  '2010',
  1500,
  'Excellence, Innovation, Intégrité',
  true,
  '{
    "currency": "FCFA",
    "academicYear": "2024-2025",
    "periods": [
      {
        "id": "1",
        "name": "Trimestre 1",
        "startDate": "2024-10-01",
        "endDate": "2024-12-20",
        "type": "Trimestre"
      },
      {
        "id": "2", 
        "name": "Trimestre 2",
        "startDate": "2025-01-08",
        "endDate": "2025-03-28",
        "type": "Trimestre"
      },
      {
        "id": "3",
        "name": "Trimestre 3", 
        "startDate": "2025-04-07",
        "endDate": "2025-06-30",
        "type": "Trimestre"
      }
    ],
    "feeTypes": [
      {
        "id": "1",
        "name": "Frais de scolarité",
        "amount": 400000,
        "level": "CE2",
        "mandatory": true,
        "description": "Frais annuels de scolarité"
      }
    ],
    "paymentMethods": [
      {
        "id": "1",
        "name": "Espèces",
        "type": "cash",
        "enabled": true,
        "fees": 0,
        "config": {}
      }
    ],
    "lateFeePercentage": 5,
    "scholarshipPercentage": 10
  }'::jsonb
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  address = EXCLUDED.address,
  phone = EXCLUDED.phone,
  email = EXCLUDED.email,
  director = EXCLUDED.director,
  settings = EXCLUDED.settings;

-- Insérer l'année scolaire active
INSERT INTO academic_years (
  id,
  name,
  start_date,
  end_date,
  is_active,
  periods,
  holidays
) VALUES (
  'academic-year-2024-2025',
  '2024-2025',
  '2024-10-01',
  '2025-06-30',
  true,
  '[
    {
      "id": "1",
      "name": "Trimestre 1",
      "startDate": "2024-10-01",
      "endDate": "2024-12-20",
      "type": "Trimestre"
    },
    {
      "id": "2",
      "name": "Trimestre 2", 
      "startDate": "2025-01-08",
      "endDate": "2025-03-28",
      "type": "Trimestre"
    },
    {
      "id": "3",
      "name": "Trimestre 3",
      "startDate": "2025-04-07", 
      "endDate": "2025-06-30",
      "type": "Trimestre"
    }
  ]'::jsonb,
  '[
    {
      "id": "1",
      "name": "Vacances de Noël",
      "startDate": "2024-12-21",
      "endDate": "2025-01-07"
    },
    {
      "id": "2",
      "name": "Vacances de Pâques",
      "startDate": "2025-03-29",
      "endDate": "2025-04-06"
    }
  ]'::jsonb
) ON CONFLICT (name) DO UPDATE SET
  start_date = EXCLUDED.start_date,
  end_date = EXCLUDED.end_date,
  is_active = EXCLUDED.is_active,
  periods = EXCLUDED.periods,
  holidays = EXCLUDED.holidays;

-- Créer les utilisateurs de test dans auth.users (via SQL direct)
-- Note: En production, utilisez la fonction admin.create_user() ou l'interface Supabase

-- Insérer les profils utilisateurs (les utilisateurs auth doivent être créés manuellement)
INSERT INTO user_profiles (
  id,
  school_id,
  name,
  email,
  role,
  permissions,
  is_active
) VALUES 
  (
    '11111111-1111-1111-1111-111111111111',
    'ecole-tech-moderne',
    'Admin Principal',
    'admin@ecoletech.edu',
    'Admin',
    '["all"]'::jsonb,
    true
  ),
  (
    '22222222-2222-2222-2222-222222222222',
    'ecole-tech-moderne',
    'Dr. Amadou Sanogo',
    'directeur@ecoletech.edu',
    'Directeur',
    '["students", "teachers", "academic", "reports", "classes", "finance", "schedule"]'::jsonb,
    true
  ),
  (
    '33333333-3333-3333-3333-333333333333',
    'ecole-tech-moderne',
    'Mme Fatoumata Keita',
    'secretaire@ecoletech.edu',
    'Secrétaire',
    '["students", "classes"]'::jsonb,
    true
  ),
  (
    '44444444-4444-4444-4444-444444444444',
    'ecole-tech-moderne',
    'M. Ibrahim Coulibaly',
    'comptable@ecoletech.edu',
    'Comptable',
    '["finance", "reports"]'::jsonb,
    true
  )
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  role = EXCLUDED.role,
  permissions = EXCLUDED.permissions;

-- Insérer les salles de classe
INSERT INTO classrooms (
  id,
  school_id,
  name,
  capacity,
  type,
  equipment,
  floor,
  building
) VALUES 
  ('classroom-1', 'ecole-tech-moderne', 'Salle 1', 30, 'Classe Standard', '["Tableau", "Chaises", "Bureau"]'::jsonb, 1, 'Bâtiment A'),
  ('classroom-2', 'ecole-tech-moderne', 'Salle 2', 35, 'Classe Standard', '["Tableau", "Projecteur"]'::jsonb, 1, 'Bâtiment A'),
  ('classroom-3', 'ecole-tech-moderne', 'Salle 3', 25, 'Classe Standard', '["Tableau", "Matériel Maternelle"]'::jsonb, 1, 'Bâtiment B'),
  ('classroom-12', 'ecole-tech-moderne', 'Salle 12', 45, 'Classe Standard', '["Tableau", "Projecteur", "Ordinateur"]'::jsonb, 2, 'Bâtiment A'),
  ('labo-1', 'ecole-tech-moderne', 'Laboratoire 1', 30, 'Laboratoire', '["Équipement Scientifique", "Tableau", "Paillasses"]'::jsonb, 2, 'Bâtiment A')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  capacity = EXCLUDED.capacity,
  type = EXCLUDED.type,
  equipment = EXCLUDED.equipment;

-- Insérer les matières
INSERT INTO subjects (
  id,
  school_id,
  name,
  description,
  coefficient,
  levels
) VALUES 
  ('subject-francais', 'ecole-tech-moderne', 'Français', 'Langue française, lecture, écriture', 4, '["CI", "CP", "CE1", "CE2", "CM1", "CM2"]'::jsonb),
  ('subject-maths', 'ecole-tech-moderne', 'Mathématiques', 'Calcul, géométrie, résolution de problèmes', 4, '["CI", "CP", "CE1", "CE2", "CM1", "CM2"]'::jsonb),
  ('subject-sciences', 'ecole-tech-moderne', 'Sciences', 'Sciences naturelles, physique, chimie', 2, '["CE1", "CE2", "CM1", "CM2"]'::jsonb),
  ('subject-histoire', 'ecole-tech-moderne', 'Histoire-Géographie', 'Histoire du Mali et géographie', 2, '["CE1", "CE2", "CM1", "CM2"]'::jsonb),
  ('subject-civique', 'ecole-tech-moderne', 'Éducation Civique', 'Citoyenneté et valeurs civiques', 1, '["CI", "CP", "CE1", "CE2", "CM1", "CM2"]'::jsonb),
  ('subject-anglais', 'ecole-tech-moderne', 'Anglais', 'Langue anglaise de base', 2, '["CM1", "CM2"]'::jsonb),
  ('subject-eveil', 'ecole-tech-moderne', 'Éveil', 'Éveil sensoriel et cognitif', 1, '["Maternelle"]'::jsonb),
  ('subject-langage', 'ecole-tech-moderne', 'Langage', 'Développement du langage oral', 1, '["Maternelle"]'::jsonb)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  coefficient = EXCLUDED.coefficient,
  levels = EXCLUDED.levels;

-- Insérer les classes
INSERT INTO classes (
  id,
  school_id,
  academic_year_id,
  name,
  level,
  capacity,
  current_students,
  subjects
) VALUES 
  ('class-maternelle-1a', 'ecole-tech-moderne', 'academic-year-2024-2025', 'Maternelle 1A', 'Maternelle', 30, 25, '["Éveil", "Langage", "Graphisme", "Jeux éducatifs"]'::jsonb),
  ('class-ci-a', 'ecole-tech-moderne', 'academic-year-2024-2025', 'CI A', 'CI', 35, 32, '["Français", "Mathématiques", "Éveil Scientifique", "Éducation Civique"]'::jsonb),
  ('class-cp1', 'ecole-tech-moderne', 'academic-year-2024-2025', 'CP1', 'CP', 35, 30, '["Français", "Mathématiques", "Éveil Scientifique", "Éducation Civique", "Dessin"]'::jsonb),
  ('class-ce2b', 'ecole-tech-moderne', 'academic-year-2024-2025', 'CE2B', 'CE2', 40, 38, '["Français", "Mathématiques", "Histoire-Géographie", "Sciences", "Éducation Civique"]'::jsonb),
  ('class-cm2a', 'ecole-tech-moderne', 'academic-year-2024-2025', 'CM2A', 'CM2', 45, 42, '["Français", "Mathématiques", "Histoire-Géographie", "Sciences", "Éducation Civique", "Anglais"]'::jsonb)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  level = EXCLUDED.level,
  capacity = EXCLUDED.capacity,
  current_students = EXCLUDED.current_students,
  subjects = EXCLUDED.subjects;

-- Insérer les enseignants
INSERT INTO teachers (
  id,
  school_id,
  first_name,
  last_name,
  email,
  phone,
  address,
  qualification,
  experience,
  specializations,
  hire_date,
  emergency_contact,
  status,
  performance_rating
) VALUES 
  (
    'teacher-traore',
    'ecole-tech-moderne',
    'Moussa',
    'Traore',
    'mtraore@ecoletech.edu',
    '+223 70 11 22 33',
    'Quartier Hippodrome, Bamako',
    'Licence en Pédagogie',
    '8 ans',
    '["Mathématiques", "Sciences"]'::jsonb,
    '2016-09-01',
    '+223 65 44 33 22',
    'Actif',
    4.5
  ),
  (
    'teacher-kone',
    'ecole-tech-moderne',
    'Aminata',
    'Kone',
    'akone@ecoletech.edu',
    '+223 75 44 55 66',
    'Quartier ACI 2000, Bamako',
    'CAP Petite Enfance',
    '12 ans',
    '["Petite Enfance", "Psychologie Enfantine"]'::jsonb,
    '2012-09-01',
    '+223 70 55 44 33',
    'Actif',
    4.8
  ),
  (
    'teacher-sidibe',
    'ecole-tech-moderne',
    'Ibrahim',
    'Sidibe',
    'isidibe@ecoletech.edu',
    '+223 65 77 88 99',
    'Quartier Magnambougou, Bamako',
    'Licence en Lettres Modernes',
    '5 ans',
    '["Littérature", "Histoire"]'::jsonb,
    '2019-09-01',
    '+223 76 88 99 00',
    'Actif',
    4.2
  ),
  (
    'teacher-coulibaly',
    'ecole-tech-moderne',
    'Fatoumata',
    'Coulibaly',
    'fcoulibaly@ecoletech.edu',
    '+223 78 99 00 11',
    'Quartier Lafiabougou, Bamako',
    'Licence en Sciences de l''Éducation',
    '3 ans',
    '["Pédagogie", "Psychologie"]'::jsonb,
    '2021-09-01',
    '+223 65 11 22 33',
    'Actif',
    4.0
  ),
  (
    'teacher-ouattara',
    'ecole-tech-moderne',
    'Sekou',
    'Ouattara',
    'souattara@ecoletech.edu',
    '+223 70 33 44 55',
    'Quartier Badalabougou, Bamako',
    'Maîtrise en Sciences Naturelles',
    '15 ans',
    '["Sciences Naturelles", "Environnement"]'::jsonb,
    '2009-09-01',
    '+223 75 66 77 88',
    'Actif',
    4.7
  )
ON CONFLICT (id) DO UPDATE SET
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name,
  email = EXCLUDED.email,
  phone = EXCLUDED.phone,
  qualification = EXCLUDED.qualification,
  experience = EXCLUDED.experience,
  specializations = EXCLUDED.specializations;

-- Insérer les affectations enseignant-classe
INSERT INTO teacher_class_assignments (
  id,
  teacher_id,
  class_id,
  school_id,
  academic_year_id,
  salary_amount,
  salary_currency,
  assignment_date,
  is_active
) VALUES 
  ('assignment-1', 'teacher-kone', 'class-maternelle-1a', 'ecole-tech-moderne', 'academic-year-2024-2025', 160000, 'FCFA', '2024-09-01', true),
  ('assignment-2', 'teacher-traore', 'class-ci-a', 'ecole-tech-moderne', 'academic-year-2024-2025', 180000, 'FCFA', '2024-09-01', true),
  ('assignment-3', 'teacher-sidibe', 'class-ce2b', 'ecole-tech-moderne', 'academic-year-2024-2025', 170000, 'FCFA', '2024-09-01', true),
  ('assignment-4', 'teacher-ouattara', 'class-cm2a', 'ecole-tech-moderne', 'academic-year-2024-2025', 200000, 'FCFA', '2024-09-01', true)
ON CONFLICT (id) DO UPDATE SET
  salary_amount = EXCLUDED.salary_amount,
  is_active = EXCLUDED.is_active;

-- Insérer les affectations salle-classe
INSERT INTO classroom_class_assignments (
  id,
  classroom_id,
  class_id,
  school_id,
  academic_year_id,
  assignment_date,
  is_active
) VALUES 
  ('room-assignment-1', 'classroom-3', 'class-maternelle-1a', 'ecole-tech-moderne', 'academic-year-2024-2025', '2024-09-01', true),
  ('room-assignment-2', 'classroom-12', 'class-ci-a', 'ecole-tech-moderne', 'academic-year-2024-2025', '2024-09-01', true),
  ('room-assignment-3', 'classroom-2', 'class-ce2b', 'ecole-tech-moderne', 'academic-year-2024-2025', '2024-09-01', true),
  ('room-assignment-4', 'classroom-1', 'class-cm2a', 'ecole-tech-moderne', 'academic-year-2024-2025', '2024-09-01', true)
ON CONFLICT (id) DO UPDATE SET
  is_active = EXCLUDED.is_active;

-- Insérer quelques élèves d'exemple
INSERT INTO students (
  id,
  school_id,
  first_name,
  last_name,
  gender,
  date_of_birth,
  birth_place,
  nationality,
  mother_tongue,
  father_name,
  father_phone,
  father_occupation,
  mother_name,
  mother_phone,
  mother_occupation,
  guardian_type,
  number_of_siblings,
  transport_mode,
  emergency_contact_name,
  emergency_contact_phone,
  emergency_contact_relation,
  parent_email,
  address,
  status
) VALUES 
  (
    'student-1',
    'ecole-tech-moderne',
    'Kofi',
    'Mensah',
    'Masculin',
    '2013-05-15',
    'Bamako, Mali',
    'Malienne',
    'Bambara',
    'M. Kwame Mensah',
    '+223 70 11 22 33',
    'Commerçant',
    'Mme Ama Mensah',
    '+223 75 44 55 66',
    'Enseignante',
    'Parents',
    2,
    'Transport familial',
    'M. Kwame Mensah',
    '+223 70 11 22 33',
    'Père',
    'mensah.family@email.com',
    'Quartier Hippodrome, Bamako',
    'Actif'
  ),
  (
    'student-2',
    'ecole-tech-moderne',
    'Aminata',
    'Traore',
    'Féminin',
    '2014-08-22',
    'Sikasso, Mali',
    'Malienne',
    'Bambara',
    'M. Sekou Traore',
    '+223 65 77 88 99',
    'Agriculteur',
    'Mme Fatoumata Traore',
    '+223 78 99 00 11',
    'Commerçante',
    'Parents',
    3,
    'À pied',
    'Mme Fatoumata Traore',
    '+223 78 99 00 11',
    'Mère',
    'traore.aminata@email.com',
    'Quartier Magnambougou, Bamako',
    'Actif'
  ),
  (
    'student-3',
    'ecole-tech-moderne',
    'Ibrahim',
    'Kone',
    'Masculin',
    '2015-03-10',
    'Mopti, Mali',
    'Malienne',
    'Peul',
    'M. Amadou Kone',
    '+223 70 33 44 55',
    'Fonctionnaire',
    'Mme Mariam Kone',
    '+223 75 66 77 88',
    'Ménagère',
    'Parents',
    1,
    'Transport scolaire',
    'M. Amadou Kone',
    '+223 70 33 44 55',
    'Père',
    'kone.ibrahim@email.com',
    'Quartier ACI 2000, Bamako',
    'Actif'
  )
ON CONFLICT (id) DO UPDATE SET
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name,
  parent_email = EXCLUDED.parent_email;

-- Insérer les inscriptions
INSERT INTO student_class_enrollments (
  id,
  student_id,
  class_id,
  school_id,
  academic_year_id,
  enrollment_date,
  total_fees,
  paid_amount,
  payment_method,
  is_active
) VALUES 
  ('enrollment-1', 'student-1', 'class-cm2a', 'ecole-tech-moderne', 'academic-year-2024-2025', '2024-09-01', 450000, 450000, 'Espèces', true),
  ('enrollment-2', 'student-2', 'class-ce2b', 'ecole-tech-moderne', 'academic-year-2024-2025', '2024-09-01', 400000, 200000, 'Mobile Money', true),
  ('enrollment-3', 'student-3', 'class-ci-a', 'ecole-tech-moderne', 'academic-year-2024-2025', '2024-09-01', 350000, 100000, 'Virement Bancaire', true)
ON CONFLICT (id) DO UPDATE SET
  total_fees = EXCLUDED.total_fees,
  paid_amount = EXCLUDED.paid_amount;

-- Insérer les méthodes de paiement
INSERT INTO payment_methods (
  id,
  school_id,
  name,
  type,
  is_enabled,
  fees_percentage,
  config
) VALUES 
  ('payment-cash', 'ecole-tech-moderne', 'Espèces', 'cash', true, 0, '{}'::jsonb),
  ('payment-mobile', 'ecole-tech-moderne', 'Mobile Money', 'mobile', true, 1.5, '{"providers": ["Orange Money", "Moov Money"]}'::jsonb),
  ('payment-bank', 'ecole-tech-moderne', 'Virement Bancaire', 'bank', true, 0.5, '{"account": "ML033 1234 5678 9012 3456 789"}'::jsonb)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  is_enabled = EXCLUDED.is_enabled;

-- Insérer quelques transactions de paiement
INSERT INTO payment_transactions (
  id,
  enrollment_id,
  school_id,
  academic_year_id,
  amount,
  payment_method_id,
  payment_type,
  payment_date,
  reference_number,
  status,
  notes,
  processed_by
) VALUES 
  ('payment-1', 'enrollment-1', 'ecole-tech-moderne', 'academic-year-2024-2025', 450000, 'payment-cash', 'Scolarité', '2024-09-01', 'CASH-001', 'Confirmé', 'Paiement complet scolarité', '11111111-1111-1111-1111-111111111111'),
  ('payment-2', 'enrollment-2', 'ecole-tech-moderne', 'academic-year-2024-2025', 200000, 'payment-mobile', 'Scolarité', '2024-09-15', 'MM-002', 'Confirmé', 'Première tranche scolarité', '44444444-4444-4444-4444-444444444444'),
  ('payment-3', 'enrollment-3', 'ecole-tech-moderne', 'academic-year-2024-2025', 100000, 'payment-bank', 'Scolarité', '2024-10-01', 'BANK-003', 'Confirmé', 'Acompte scolarité', '44444444-4444-4444-4444-444444444444')
ON CONFLICT (id) DO UPDATE SET
  amount = EXCLUDED.amount,
  status = EXCLUDED.status;

-- Insérer les périodes d'évaluation
INSERT INTO grade_periods (
  id,
  school_id,
  academic_year_id,
  name,
  start_date,
  end_date,
  is_active
) VALUES 
  ('period-t1-2024', 'ecole-tech-moderne', 'academic-year-2024-2025', 'Trimestre 1', '2024-10-01', '2024-12-20', true),
  ('period-t2-2024', 'ecole-tech-moderne', 'academic-year-2024-2025', 'Trimestre 2', '2025-01-08', '2025-03-28', false),
  ('period-t3-2024', 'ecole-tech-moderne', 'academic-year-2024-2025', 'Trimestre 3', '2025-04-07', '2025-06-30', false)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  start_date = EXCLUDED.start_date,
  end_date = EXCLUDED.end_date;

-- Insérer quelques notes d'exemple
INSERT INTO grades (
  id,
  student_id,
  class_id,
  subject_id,
  teacher_id,
  school_id,
  academic_year_id,
  grade_period_id,
  grade_value,
  coefficient,
  evaluation_type,
  evaluation_title,
  evaluation_date,
  teacher_comment
) VALUES 
  ('grade-1', 'student-1', 'class-cm2a', 'subject-francais', 'teacher-ouattara', 'ecole-tech-moderne', 'academic-year-2024-2025', 'period-t1-2024', 16.5, 4, 'devoir', 'Devoir n°1', '2024-10-15', 'Excellent travail'),
  ('grade-2', 'student-1', 'class-cm2a', 'subject-maths', 'teacher-ouattara', 'ecole-tech-moderne', 'academic-year-2024-2025', 'period-t1-2024', 15.0, 4, 'devoir', 'Devoir n°1', '2024-10-12', 'Bon niveau'),
  ('grade-3', 'student-2', 'class-ce2b', 'subject-francais', 'teacher-sidibe', 'ecole-tech-moderne', 'academic-year-2024-2025', 'period-t1-2024', 14.5, 4, 'devoir', 'Devoir n°1', '2024-10-15', 'Travail satisfaisant'),
  ('grade-4', 'student-2', 'class-ce2b', 'subject-maths', 'teacher-sidibe', 'ecole-tech-moderne', 'academic-year-2024-2025', 'period-t1-2024', 13.0, 4, 'devoir', 'Devoir n°1', '2024-10-12', 'Peut mieux faire')
ON CONFLICT (id) DO UPDATE SET
  grade_value = EXCLUDED.grade_value,
  teacher_comment = EXCLUDED.teacher_comment;

-- Insérer les types de frais
INSERT INTO fee_types (
  id,
  school_id,
  name,
  amount,
  level,
  is_mandatory,
  description
) VALUES 
  ('fee-scolarite-maternelle', 'ecole-tech-moderne', 'Frais de scolarité', 300000, 'Maternelle', true, 'Frais annuels de scolarité pour la maternelle'),
  ('fee-scolarite-ci', 'ecole-tech-moderne', 'Frais de scolarité', 350000, 'CI', true, 'Frais annuels de scolarité pour le CI'),
  ('fee-scolarite-cp', 'ecole-tech-moderne', 'Frais de scolarité', 350000, 'CP', true, 'Frais annuels de scolarité pour le CP'),
  ('fee-scolarite-ce1', 'ecole-tech-moderne', 'Frais de scolarité', 400000, 'CE1', true, 'Frais annuels de scolarité pour le CE1'),
  ('fee-scolarite-ce2', 'ecole-tech-moderne', 'Frais de scolarité', 400000, 'CE2', true, 'Frais annuels de scolarité pour le CE2'),
  ('fee-scolarite-cm1', 'ecole-tech-moderne', 'Frais de scolarité', 450000, 'CM1', true, 'Frais annuels de scolarité pour le CM1'),
  ('fee-scolarite-cm2', 'ecole-tech-moderne', 'Frais de scolarité', 450000, 'CM2', true, 'Frais annuels de scolarité pour le CM2'),
  ('fee-inscription', 'ecole-tech-moderne', 'Frais d''inscription', 50000, 'Tous', true, 'Frais d''inscription annuelle'),
  ('fee-cantine', 'ecole-tech-moderne', 'Frais de cantine', 25000, 'Tous', false, 'Frais de restauration scolaire'),
  ('fee-transport', 'ecole-tech-moderne', 'Frais de transport', 15000, 'Tous', false, 'Transport scolaire')
ON CONFLICT (id) DO UPDATE SET
  amount = EXCLUDED.amount,
  description = EXCLUDED.description;

-- Log de création des données d'exemple
INSERT INTO activity_logs (
  school_id,
  action,
  entity_type,
  level,
  details
) VALUES (
  'ecole-tech-moderne',
  'INIT_SAMPLE_DATA',
  'system',
  'info',
  'Données d''exemple créées pour l''École Technique Moderne'
);