/*
# SmartHire Onboarding Portal — Core Schema

Multi-tenant SaaS employee onboarding portal. Companies register, HR admins invite employees,
employees self-register, upload documents, sign agreements, complete training, and reach
Day 1 readiness, followed by 30/60/90 day reviews.

Tables: companies, departments, profiles, job_roles, onboarding_templates, template_tasks,
employee_tasks, document_types, documents, agreements, signatures, training_courses,
training_lessons, training_progress, it_requests, meetings, notifications, messages,
employee_feedback, audit_logs, day1_readiness.

Security: RLS on every table. Company isolation via profiles.user_id -> company_id.
*/

-- COMPANIES
CREATE TABLE IF NOT EXISTS companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  logo_url text,
  subscription_plan text NOT NULL DEFAULT 'starter',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

-- DEPARTMENTS (before profiles, since profiles references departments)
CREATE TABLE IF NOT EXISTS departments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  manager_id uuid,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;

-- PROFILES
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'employee',
  name text NOT NULL,
  email text NOT NULL,
  phone text,
  photo_url text,
  job_title text,
  department_id uuid REFERENCES departments(id) ON DELETE SET NULL,
  manager_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  location text,
  employment_type text DEFAULT 'full-time',
  joining_date date,
  onboarding_progress int NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Now wire departments.manager_id -> profiles (added after profiles exists)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'departments_manager_id_fkey') THEN
    ALTER TABLE departments ADD CONSTRAINT departments_manager_id_fkey
      FOREIGN KEY (manager_id) REFERENCES profiles(id) ON DELETE SET NULL;
  END IF;
END $$;

-- JOB_ROLES
CREATE TABLE IF NOT EXISTS job_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  department_id uuid REFERENCES departments(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE job_roles ENABLE ROW LEVEL SECURITY;

-- ONBOARDING_TEMPLATES
CREATE TABLE IF NOT EXISTS onboarding_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  employment_type text DEFAULT 'full-time',
  is_active boolean DEFAULT true,
  created_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE onboarding_templates ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS template_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id uuid NOT NULL REFERENCES onboarding_templates(id) ON DELETE CASCADE,
  task_name text NOT NULL,
  dept_responsible text,
  priority text DEFAULT 'medium',
  deadline_days int DEFAULT 7
);
ALTER TABLE template_tasks ENABLE ROW LEVEL SECURITY;

-- EMPLOYEE_TASKS
CREATE TABLE IF NOT EXISTS employee_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  employee_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  task_name text NOT NULL,
  dept_responsible text DEFAULT 'employee',
  assigned_to uuid REFERENCES profiles(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'pending',
  due_date date,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE employee_tasks ENABLE ROW LEVEL SECURITY;

-- DOCUMENT_TYPES + DOCUMENTS
CREATE TABLE IF NOT EXISTS document_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  is_required boolean DEFAULT true,
  file_types text DEFAULT 'pdf,jpg,png'
);
ALTER TABLE document_types ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  employee_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  doc_type_id uuid REFERENCES document_types(id) ON DELETE SET NULL,
  doc_type_name text NOT NULL,
  file_url text NOT NULL,
  file_name text,
  status text NOT NULL DEFAULT 'pending',
  rejection_reason text,
  reviewed_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  uploaded_at timestamptz DEFAULT now()
);
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- AGREEMENTS + SIGNATURES
CREATE TABLE IF NOT EXISTS agreements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  body text,
  version int DEFAULT 1,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE agreements ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS signatures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  employee_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  agreement_id uuid REFERENCES agreements(id) ON DELETE SET NULL,
  agreement_name text NOT NULL,
  signature_url text NOT NULL,
  signed_at timestamptz DEFAULT now(),
  ip text,
  device text,
  doc_version int DEFAULT 1
);
ALTER TABLE signatures ENABLE ROW LEVEL SECURITY;

-- TRAINING
CREATE TABLE IF NOT EXISTS training_courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  is_mandatory boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE training_courses ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS training_lessons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES training_courses(id) ON DELETE CASCADE,
  title text NOT NULL,
  video_url text,
  quiz_q text,
  quiz_options text[],
  quiz_answer int,
  "order" int DEFAULT 0
);
ALTER TABLE training_lessons ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS training_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  employee_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  course_id uuid NOT NULL REFERENCES training_courses(id) ON DELETE CASCADE,
  completed boolean DEFAULT false,
  quiz_score int,
  completed_at timestamptz,
  UNIQUE (employee_id, course_id)
);
ALTER TABLE training_progress ENABLE ROW LEVEL SECURITY;

-- IT_REQUESTS
CREATE TABLE IF NOT EXISTS it_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  employee_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'pending',
  assigned_to uuid REFERENCES profiles(id) ON DELETE SET NULL,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE it_requests ENABLE ROW LEVEL SECURITY;

-- MEETINGS
CREATE TABLE IF NOT EXISTS meetings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  employee_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  with_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  type text DEFAULT 'welcome',
  title text,
  scheduled_date timestamptz,
  url text,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;

-- NOTIFICATIONS + MESSAGES
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL,
  message text NOT NULL,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  recipient_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  body text NOT NULL,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- EMPLOYEE_FEEDBACK + AUDIT_LOGS + DAY1_READINESS
CREATE TABLE IF NOT EXISTS employee_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  employee_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reviewer_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  category text NOT NULL,
  rating int,
  comments text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE employee_feedback ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action text NOT NULL,
  resource text,
  details text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS day1_readiness (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  employee_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  docs_ok boolean DEFAULT false,
  contract_ok boolean DEFAULT false,
  laptop_ok boolean DEFAULT false,
  email_ok boolean DEFAULT false,
  manager_ok boolean DEFAULT false,
  orientation_ok boolean DEFAULT false,
  payroll_ok boolean DEFAULT false,
  updated_at timestamptz DEFAULT now(),
  UNIQUE (employee_id)
);
ALTER TABLE day1_readiness ENABLE ROW LEVEL SECURITY;

-- ============ RLS POLICIES ============

-- COMPANIES
DROP POLICY IF EXISTS "read_own_company" ON companies;
CREATE POLICY "read_own_company" ON companies FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM profiles p WHERE p.user_id = auth.uid() AND p.company_id = companies.id));
DROP POLICY IF EXISTS "update_own_company" ON companies;
CREATE POLICY "update_own_company" ON companies FOR UPDATE TO authenticated
USING (EXISTS (SELECT 1 FROM profiles p WHERE p.user_id = auth.uid() AND p.company_id = companies.id))
WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.user_id = auth.uid() AND p.company_id = companies.id));

-- PROFILES
DROP POLICY IF EXISTS "read_company_profiles" ON profiles;
CREATE POLICY "read_company_profiles" ON profiles FOR SELECT TO authenticated
USING (company_id IN (SELECT company_id FROM profiles WHERE user_id = auth.uid()));
DROP POLICY IF EXISTS "insert_company_profile" ON profiles;
CREATE POLICY "insert_company_profile" ON profiles FOR INSERT TO authenticated
WITH CHECK (company_id IN (SELECT company_id FROM profiles WHERE user_id = auth.uid()) OR user_id = auth.uid());
DROP POLICY IF EXISTS "update_company_profiles" ON profiles;
CREATE POLICY "update_company_profiles" ON profiles FOR UPDATE TO authenticated
USING (user_id = auth.uid() OR company_id IN (SELECT company_id FROM profiles WHERE user_id = auth.uid()))
WITH CHECK (user_id = auth.uid() OR company_id IN (SELECT company_id FROM profiles WHERE user_id = auth.uid()));
DROP POLICY IF EXISTS "delete_company_profiles" ON profiles;
CREATE POLICY "delete_company_profiles" ON profiles FOR DELETE TO authenticated
USING (company_id IN (SELECT company_id FROM profiles WHERE user_id = auth.uid()));

-- DEPARTMENTS
DROP POLICY IF EXISTS "select_departments" ON departments;
CREATE POLICY "select_departments" ON departments FOR SELECT TO authenticated
USING (company_id IN (SELECT company_id FROM profiles WHERE user_id = auth.uid()));
DROP POLICY IF EXISTS "insert_departments" ON departments;
CREATE POLICY "insert_departments" ON departments FOR INSERT TO authenticated
WITH CHECK (company_id IN (SELECT company_id FROM profiles WHERE user_id = auth.uid()));
DROP POLICY IF EXISTS "update_departments" ON departments;
CREATE POLICY "update_departments" ON departments FOR UPDATE TO authenticated
USING (company_id IN (SELECT company_id FROM profiles WHERE user_id = auth.uid()))
WITH CHECK (company_id IN (SELECT company_id FROM profiles WHERE user_id = auth.uid()));
DROP POLICY IF EXISTS "delete_departments" ON departments;
CREATE POLICY "delete_departments" ON departments FOR DELETE TO authenticated
USING (company_id IN (SELECT company_id FROM profiles WHERE user_id = auth.uid()));

-- JOB_ROLES
DROP POLICY IF EXISTS "select_job_roles" ON job_roles;
CREATE POLICY "select_job_roles" ON job_roles FOR SELECT TO authenticated
USING (company_id IN (SELECT company_id FROM profiles WHERE user_id = auth.uid()));
DROP POLICY IF EXISTS "insert_job_roles" ON job_roles;
CREATE POLICY "insert_job_roles" ON job_roles FOR INSERT TO authenticated
WITH CHECK (company_id IN (SELECT company_id FROM profiles WHERE user_id = auth.uid()));
DROP POLICY IF EXISTS "update_job_roles" ON job_roles;
CREATE POLICY "update_job_roles" ON job_roles FOR UPDATE TO authenticated
USING (company_id IN (SELECT company_id FROM profiles WHERE user_id = auth.uid()))
WITH CHECK (company_id IN (SELECT company_id FROM profiles WHERE user_id = auth.uid()));
DROP POLICY IF EXISTS "delete_job_roles" ON job_roles;
CREATE POLICY "delete_job_roles" ON job_roles FOR DELETE TO authenticated
USING (company_id IN (SELECT company_id FROM profiles WHERE user_id = auth.uid()));

-- ONBOARDING_TEMPLATES
DROP POLICY IF EXISTS "select_templates" ON onboarding_templates;
CREATE POLICY "select_templates" ON onboarding_templates FOR SELECT TO authenticated
USING (company_id IN (SELECT company_id FROM profiles WHERE user_id = auth.uid()));
DROP POLICY IF EXISTS "insert_templates" ON onboarding_templates;
CREATE POLICY "insert_templates" ON onboarding_templates FOR INSERT TO authenticated
WITH CHECK (company_id IN (SELECT company_id FROM profiles WHERE user_id = auth.uid()));
DROP POLICY IF EXISTS "update_templates" ON onboarding_templates;
CREATE POLICY "update_templates" ON onboarding_templates FOR UPDATE TO authenticated
USING (company_id IN (SELECT company_id FROM profiles WHERE user_id = auth.uid()))
WITH CHECK (company_id IN (SELECT company_id FROM profiles WHERE user_id = auth.uid()));
DROP POLICY IF EXISTS "delete_templates" ON onboarding_templates;
CREATE POLICY "delete_templates" ON onboarding_templates FOR DELETE TO authenticated
USING (company_id IN (SELECT company_id FROM profiles WHERE user_id = auth.uid()));

-- TEMPLATE_TASKS
DROP POLICY IF EXISTS "select_template_tasks" ON template_tasks;
CREATE POLICY "select_template_tasks" ON template_tasks FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM onboarding_templates t JOIN profiles p ON p.user_id = auth.uid() AND p.company_id = t.company_id WHERE t.id = template_tasks.template_id));
DROP POLICY IF EXISTS "insert_template_tasks" ON template_tasks;
CREATE POLICY "insert_template_tasks" ON template_tasks FOR INSERT TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM onboarding_templates t JOIN profiles p ON p.user_id = auth.uid() AND p.company_id = t.company_id WHERE t.id = template_tasks.template_id));
DROP POLICY IF EXISTS "update_template_tasks" ON template_tasks;
CREATE POLICY "update_template_tasks" ON template_tasks FOR UPDATE TO authenticated
USING (EXISTS (SELECT 1 FROM onboarding_templates t JOIN profiles p ON p.user_id = auth.uid() AND p.company_id = t.company_id WHERE t.id = template_tasks.template_id))
WITH CHECK (EXISTS (SELECT 1 FROM onboarding_templates t JOIN profiles p ON p.user_id = auth.uid() AND p.company_id = t.company_id WHERE t.id = template_tasks.template_id));
DROP POLICY IF EXISTS "delete_template_tasks" ON template_tasks;
CREATE POLICY "delete_template_tasks" ON template_tasks FOR DELETE TO authenticated
USING (EXISTS (SELECT 1 FROM onboarding_templates t JOIN profiles p ON p.user_id = auth.uid() AND p.company_id = t.company_id WHERE t.id = template_tasks.template_id));

-- EMPLOYEE_TASKS
DROP POLICY IF EXISTS "select_employee_tasks" ON employee_tasks;
CREATE POLICY "select_employee_tasks" ON employee_tasks FOR SELECT TO authenticated
USING (company_id IN (SELECT company_id FROM profiles WHERE user_id = auth.uid()));
DROP POLICY IF EXISTS "insert_employee_tasks" ON employee_tasks;
CREATE POLICY "insert_employee_tasks" ON employee_tasks FOR INSERT TO authenticated
WITH CHECK (company_id IN (SELECT company_id FROM profiles WHERE user_id = auth.uid()));
DROP POLICY IF EXISTS "update_employee_tasks" ON employee_tasks;
CREATE POLICY "update_employee_tasks" ON employee_tasks FOR UPDATE TO authenticated
USING (company_id IN (SELECT company_id FROM profiles WHERE user_id = auth.uid()))
WITH CHECK (company_id IN (SELECT company_id FROM profiles WHERE user_id = auth.uid()));
DROP POLICY IF EXISTS "delete_employee_tasks" ON employee_tasks;
CREATE POLICY "delete_employee_tasks" ON employee_tasks FOR DELETE TO authenticated
USING (company_id IN (SELECT company_id FROM profiles WHERE user_id = auth.uid()));

-- DOCUMENT_TYPES
DROP POLICY IF EXISTS "select_document_types" ON document_types;
CREATE POLICY "select_document_types" ON document_types FOR SELECT TO authenticated
USING (company_id IN (SELECT company_id FROM profiles WHERE user_id = auth.uid()));
DROP POLICY IF EXISTS "insert_document_types" ON document_types;
CREATE POLICY "insert_document_types" ON document_types FOR INSERT TO authenticated
WITH CHECK (company_id IN (SELECT company_id FROM profiles WHERE user_id = auth.uid()));
DROP POLICY IF EXISTS "update_document_types" ON document_types;
CREATE POLICY "update_document_types" ON document_types FOR UPDATE TO authenticated
USING (company_id IN (SELECT company_id FROM profiles WHERE user_id = auth.uid()))
WITH CHECK (company_id IN (SELECT company_id FROM profiles WHERE user_id = auth.uid()));
DROP POLICY IF EXISTS "delete_document_types" ON document_types;
CREATE POLICY "delete_document_types" ON document_types FOR DELETE TO authenticated
USING (company_id IN (SELECT company_id FROM profiles WHERE user_id = auth.uid()));

-- DOCUMENTS
DROP POLICY IF EXISTS "select_documents" ON documents;
CREATE POLICY "select_documents" ON documents FOR SELECT TO authenticated
USING (company_id IN (SELECT company_id FROM profiles WHERE user_id = auth.uid()));
DROP POLICY IF EXISTS "insert_documents" ON documents;
CREATE POLICY "insert_documents" ON documents FOR INSERT TO authenticated
WITH CHECK (company_id IN (SELECT company_id FROM profiles WHERE user_id = auth.uid()));
DROP POLICY IF EXISTS "update_documents" ON documents;
CREATE POLICY "update_documents" ON documents FOR UPDATE TO authenticated
USING (company_id IN (SELECT company_id FROM profiles WHERE user_id = auth.uid()))
WITH CHECK (company_id IN (SELECT company_id FROM profiles WHERE user_id = auth.uid()));
DROP POLICY IF EXISTS "delete_documents" ON documents;
CREATE POLICY "delete_documents" ON documents FOR DELETE TO authenticated
USING (company_id IN (SELECT company_id FROM profiles WHERE user_id = auth.uid()));

-- AGREEMENTS
DROP POLICY IF EXISTS "select_agreements" ON agreements;
CREATE POLICY "select_agreements" ON agreements FOR SELECT TO authenticated
USING (company_id IN (SELECT company_id FROM profiles WHERE user_id = auth.uid()));
DROP POLICY IF EXISTS "insert_agreements" ON agreements;
CREATE POLICY "insert_agreements" ON agreements FOR INSERT TO authenticated
WITH CHECK (company_id IN (SELECT company_id FROM profiles WHERE user_id = auth.uid()));
DROP POLICY IF EXISTS "update_agreements" ON agreements;
CREATE POLICY "update_agreements" ON agreements FOR UPDATE TO authenticated
USING (company_id IN (SELECT company_id FROM profiles WHERE user_id = auth.uid()))
WITH CHECK (company_id IN (SELECT company_id FROM profiles WHERE user_id = auth.uid()));
DROP POLICY IF EXISTS "delete_agreements" ON agreements;
CREATE POLICY "delete_agreements" ON agreements FOR DELETE TO authenticated
USING (company_id IN (SELECT company_id FROM profiles WHERE user_id = auth.uid()));

-- SIGNATURES
DROP POLICY IF EXISTS "select_signatures" ON signatures;
CREATE POLICY "select_signatures" ON signatures FOR SELECT TO authenticated
USING (company_id IN (SELECT company_id FROM profiles WHERE user_id = auth.uid()));
DROP POLICY IF EXISTS "insert_signatures" ON signatures;
CREATE POLICY "insert_signatures" ON signatures FOR INSERT TO authenticated
WITH CHECK (company_id IN (SELECT company_id FROM profiles WHERE user_id = auth.uid()));
DROP POLICY IF EXISTS "delete_signatures" ON signatures;
CREATE POLICY "delete_signatures" ON signatures FOR DELETE TO authenticated
USING (company_id IN (SELECT company_id FROM profiles WHERE user_id = auth.uid()));

-- TRAINING_COURSES
DROP POLICY IF EXISTS "select_training_courses" ON training_courses;
CREATE POLICY "select_training_courses" ON training_courses FOR SELECT TO authenticated
USING (company_id IN (SELECT company_id FROM profiles WHERE user_id = auth.uid()));
DROP POLICY IF EXISTS "insert_training_courses" ON training_courses;
CREATE POLICY "insert_training_courses" ON training_courses FOR INSERT TO authenticated
WITH CHECK (company_id IN (SELECT company_id FROM profiles WHERE user_id = auth.uid()));
DROP POLICY IF EXISTS "update_training_courses" ON training_courses;
CREATE POLICY "update_training_courses" ON training_courses FOR UPDATE TO authenticated
USING (company_id IN (SELECT company_id FROM profiles WHERE user_id = auth.uid()))
WITH CHECK (company_id IN (SELECT company_id FROM profiles WHERE user_id = auth.uid()));
DROP POLICY IF EXISTS "delete_training_courses" ON training_courses;
CREATE POLICY "delete_training_courses" ON training_courses FOR DELETE TO authenticated
USING (company_id IN (SELECT company_id FROM profiles WHERE user_id = auth.uid()));

-- TRAINING_LESSONS
DROP POLICY IF EXISTS "select_training_lessons" ON training_lessons;
CREATE POLICY "select_training_lessons" ON training_lessons FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM training_courses c JOIN profiles p ON p.user_id = auth.uid() AND p.company_id = c.company_id WHERE c.id = training_lessons.course_id));
DROP POLICY IF EXISTS "insert_training_lessons" ON training_lessons;
CREATE POLICY "insert_training_lessons" ON training_lessons FOR INSERT TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM training_courses c JOIN profiles p ON p.user_id = auth.uid() AND p.company_id = c.company_id WHERE c.id = training_lessons.course_id));
DROP POLICY IF EXISTS "update_training_lessons" ON training_lessons;
CREATE POLICY "update_training_lessons" ON training_lessons FOR UPDATE TO authenticated
USING (EXISTS (SELECT 1 FROM training_courses c JOIN profiles p ON p.user_id = auth.uid() AND p.company_id = c.company_id WHERE c.id = training_lessons.course_id))
WITH CHECK (EXISTS (SELECT 1 FROM training_courses c JOIN profiles p ON p.user_id = auth.uid() AND p.company_id = c.company_id WHERE c.id = training_lessons.course_id));
DROP POLICY IF EXISTS "delete_training_lessons" ON training_lessons;
CREATE POLICY "delete_training_lessons" ON training_lessons FOR DELETE TO authenticated
USING (EXISTS (SELECT 1 FROM training_courses c JOIN profiles p ON p.user_id = auth.uid() AND p.company_id = c.company_id WHERE c.id = training_lessons.course_id));

-- TRAINING_PROGRESS
DROP POLICY IF EXISTS "select_training_progress" ON training_progress;
CREATE POLICY "select_training_progress" ON training_progress FOR SELECT TO authenticated
USING (company_id IN (SELECT company_id FROM profiles WHERE user_id = auth.uid()));
DROP POLICY IF EXISTS "insert_training_progress" ON training_progress;
CREATE POLICY "insert_training_progress" ON training_progress FOR INSERT TO authenticated
WITH CHECK (company_id IN (SELECT company_id FROM profiles WHERE user_id = auth.uid()));
DROP POLICY IF EXISTS "update_training_progress" ON training_progress;
CREATE POLICY "update_training_progress" ON training_progress FOR UPDATE TO authenticated
USING (company_id IN (SELECT company_id FROM profiles WHERE user_id = auth.uid()))
WITH CHECK (company_id IN (SELECT company_id FROM profiles WHERE user_id = auth.uid()));
DROP POLICY IF EXISTS "delete_training_progress" ON training_progress;
CREATE POLICY "delete_training_progress" ON training_progress FOR DELETE TO authenticated
USING (company_id IN (SELECT company_id FROM profiles WHERE user_id = auth.uid()));

-- IT_REQUESTS
DROP POLICY IF EXISTS "select_it_requests" ON it_requests;
CREATE POLICY "select_it_requests" ON it_requests FOR SELECT TO authenticated
USING (company_id IN (SELECT company_id FROM profiles WHERE user_id = auth.uid()));
DROP POLICY IF EXISTS "insert_it_requests" ON it_requests;
CREATE POLICY "insert_it_requests" ON it_requests FOR INSERT TO authenticated
WITH CHECK (company_id IN (SELECT company_id FROM profiles WHERE user_id = auth.uid()));
DROP POLICY IF EXISTS "update_it_requests" ON it_requests;
CREATE POLICY "update_it_requests" ON it_requests FOR UPDATE TO authenticated
USING (company_id IN (SELECT company_id FROM profiles WHERE user_id = auth.uid()))
WITH CHECK (company_id IN (SELECT company_id FROM profiles WHERE user_id = auth.uid()));
DROP POLICY IF EXISTS "delete_it_requests" ON it_requests;
CREATE POLICY "delete_it_requests" ON it_requests FOR DELETE TO authenticated
USING (company_id IN (SELECT company_id FROM profiles WHERE user_id = auth.uid()));

-- MEETINGS
DROP POLICY IF EXISTS "select_meetings" ON meetings;
CREATE POLICY "select_meetings" ON meetings FOR SELECT TO authenticated
USING (company_id IN (SELECT company_id FROM profiles WHERE user_id = auth.uid()));
DROP POLICY IF EXISTS "insert_meetings" ON meetings;
CREATE POLICY "insert_meetings" ON meetings FOR INSERT TO authenticated
WITH CHECK (company_id IN (SELECT company_id FROM profiles WHERE user_id = auth.uid()));
DROP POLICY IF EXISTS "update_meetings" ON meetings;
CREATE POLICY "update_meetings" ON meetings FOR UPDATE TO authenticated
USING (company_id IN (SELECT company_id FROM profiles WHERE user_id = auth.uid()))
WITH CHECK (company_id IN (SELECT company_id FROM profiles WHERE user_id = auth.uid()));
DROP POLICY IF EXISTS "delete_meetings" ON meetings;
CREATE POLICY "delete_meetings" ON meetings FOR DELETE TO authenticated
USING (company_id IN (SELECT company_id FROM profiles WHERE user_id = auth.uid()));

-- NOTIFICATIONS
DROP POLICY IF EXISTS "select_own_notifications" ON notifications;
CREATE POLICY "select_own_notifications" ON notifications FOR SELECT TO authenticated
USING (user_id = auth.uid());
DROP POLICY IF EXISTS "insert_own_notifications" ON notifications;
CREATE POLICY "insert_own_notifications" ON notifications FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid() OR company_id IN (SELECT company_id FROM profiles WHERE user_id = auth.uid()));
DROP POLICY IF EXISTS "update_own_notifications" ON notifications;
CREATE POLICY "update_own_notifications" ON notifications FOR UPDATE TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS "delete_own_notifications" ON notifications;
CREATE POLICY "delete_own_notifications" ON notifications FOR DELETE TO authenticated
USING (user_id = auth.uid());

-- MESSAGES
DROP POLICY IF EXISTS "select_messages" ON messages;
CREATE POLICY "select_messages" ON messages FOR SELECT TO authenticated
USING (company_id IN (SELECT company_id FROM profiles WHERE user_id = auth.uid()));
DROP POLICY IF EXISTS "insert_messages" ON messages;
CREATE POLICY "insert_messages" ON messages FOR INSERT TO authenticated
WITH CHECK (company_id IN (SELECT company_id FROM profiles WHERE user_id = auth.uid()));
DROP POLICY IF EXISTS "update_messages" ON messages;
CREATE POLICY "update_messages" ON messages FOR UPDATE TO authenticated
USING (company_id IN (SELECT company_id FROM profiles WHERE user_id = auth.uid()))
WITH CHECK (company_id IN (SELECT company_id FROM profiles WHERE user_id = auth.uid()));
DROP POLICY IF EXISTS "delete_messages" ON messages;
CREATE POLICY "delete_messages" ON messages FOR DELETE TO authenticated
USING (company_id IN (SELECT company_id FROM profiles WHERE user_id = auth.uid()));

-- EMPLOYEE_FEEDBACK
DROP POLICY IF EXISTS "select_feedback" ON employee_feedback;
CREATE POLICY "select_feedback" ON employee_feedback FOR SELECT TO authenticated
USING (company_id IN (SELECT company_id FROM profiles WHERE user_id = auth.uid()));
DROP POLICY IF EXISTS "insert_feedback" ON employee_feedback;
CREATE POLICY "insert_feedback" ON employee_feedback FOR INSERT TO authenticated
WITH CHECK (company_id IN (SELECT company_id FROM profiles WHERE user_id = auth.uid()));
DROP POLICY IF EXISTS "update_feedback" ON employee_feedback;
CREATE POLICY "update_feedback" ON employee_feedback FOR UPDATE TO authenticated
USING (company_id IN (SELECT company_id FROM profiles WHERE user_id = auth.uid()))
WITH CHECK (company_id IN (SELECT company_id FROM profiles WHERE user_id = auth.uid()));
DROP POLICY IF EXISTS "delete_feedback" ON employee_feedback;
CREATE POLICY "delete_feedback" ON employee_feedback FOR DELETE TO authenticated
USING (company_id IN (SELECT company_id FROM profiles WHERE user_id = auth.uid()));

-- AUDIT_LOGS
DROP POLICY IF EXISTS "select_audit_logs" ON audit_logs;
CREATE POLICY "select_audit_logs" ON audit_logs FOR SELECT TO authenticated
USING (company_id IN (SELECT company_id FROM profiles WHERE user_id = auth.uid()));
DROP POLICY IF EXISTS "insert_audit_logs" ON audit_logs;
CREATE POLICY "insert_audit_logs" ON audit_logs FOR INSERT TO authenticated
WITH CHECK (company_id IN (SELECT company_id FROM profiles WHERE user_id = auth.uid()));

-- DAY1_READINESS
DROP POLICY IF EXISTS "select_day1" ON day1_readiness;
CREATE POLICY "select_day1" ON day1_readiness FOR SELECT TO authenticated
USING (company_id IN (SELECT company_id FROM profiles WHERE user_id = auth.uid()));
DROP POLICY IF EXISTS "insert_day1" ON day1_readiness;
CREATE POLICY "insert_day1" ON day1_readiness FOR INSERT TO authenticated
WITH CHECK (company_id IN (SELECT company_id FROM profiles WHERE user_id = auth.uid()));
DROP POLICY IF EXISTS "update_day1" ON day1_readiness;
CREATE POLICY "update_day1" ON day1_readiness FOR UPDATE TO authenticated
USING (company_id IN (SELECT company_id FROM profiles WHERE user_id = auth.uid()))
WITH CHECK (company_id IN (SELECT company_id FROM profiles WHERE user_id = auth.uid()));
DROP POLICY IF EXISTS "delete_day1" ON day1_readiness;
CREATE POLICY "delete_day1" ON day1_readiness FOR DELETE TO authenticated
USING (company_id IN (SELECT company_id FROM profiles WHERE user_id = auth.uid()));

-- INDEXES
CREATE INDEX IF NOT EXISTS idx_profiles_company ON profiles(company_id);
CREATE INDEX IF NOT EXISTS idx_profiles_user ON profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_company ON documents(company_id);
CREATE INDEX IF NOT EXISTS idx_documents_employee ON documents(employee_id);
CREATE INDEX IF NOT EXISTS idx_tasks_company ON employee_tasks(company_id);
CREATE INDEX IF NOT EXISTS idx_tasks_employee ON employee_tasks(employee_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
