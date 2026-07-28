export type Role = 'super_admin' | 'hr_admin' | 'manager' | 'it' | 'employee';

export interface Company {
  id: string;
  name: string;
  email: string;
  logo_url: string | null;
  subscription_plan: string;
  created_at: string;
}

export interface Profile {
  id: string;
  user_id: string;
  company_id: string;
  role: Role;
  name: string;
  email: string;
  phone: string | null;
  photo_url: string | null;
  job_title: string | null;
  department_id: string | null;
  manager_id: string | null;
  location: string | null;
  employment_type: string | null;
  joining_date: string | null;
  onboarding_progress: number;
  status: string;
  created_at: string;
}

export interface Department {
  id: string;
  company_id: string;
  name: string;
  manager_id: string | null;
  created_at: string;
}

export interface JobRole {
  id: string;
  company_id: string;
  department_id: string | null;
  title: string;
  description: string | null;
  created_at: string;
}

export interface OnboardingTemplate {
  id: string;
  company_id: string;
  name: string;
  employment_type: string;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
}

export interface TemplateTask {
  id: string;
  template_id: string;
  task_name: string;
  dept_responsible: string | null;
  priority: string;
  deadline_days: number;
}

export interface EmployeeTask {
  id: string;
  company_id: string;
  employee_id: string;
  task_name: string;
  dept_responsible: string;
  assigned_to: string | null;
  status: 'pending' | 'in_progress' | 'completed' | 'overdue';
  due_date: string | null;
  completed_at: string | null;
  created_at: string;
}

export interface DocumentType {
  id: string;
  company_id: string;
  name: string;
  is_required: boolean;
  file_types: string;
}

export interface DocumentRecord {
  id: string;
  company_id: string;
  employee_id: string;
  doc_type_id: string | null;
  doc_type_name: string;
  file_url: string;
  file_name: string | null;
  status: 'pending' | 'under_review' | 'approved' | 'rejected' | 'resubmit';
  rejection_reason: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  uploaded_at: string;
}

export interface Agreement {
  id: string;
  company_id: string;
  name: string;
  body: string | null;
  version: number;
  is_active: boolean;
  created_at: string;
}

export interface Signature {
  id: string;
  company_id: string;
  employee_id: string;
  agreement_id: string | null;
  agreement_name: string;
  signature_url: string;
  signed_at: string;
  ip: string | null;
  device: string | null;
  doc_version: number;
}

export interface TrainingCourse {
  id: string;
  company_id: string;
  name: string;
  description: string | null;
  is_mandatory: boolean;
  created_at: string;
}

export interface TrainingLesson {
  id: string;
  course_id: string;
  title: string;
  video_url: string | null;
  quiz_q: string | null;
  quiz_options: string[] | null;
  quiz_answer: number | null;
  order: number;
}

export interface TrainingProgress {
  id: string;
  company_id: string;
  employee_id: string;
  course_id: string;
  completed: boolean;
  quiz_score: number | null;
  completed_at: string | null;
}

export interface ITRequest {
  id: string;
  company_id: string;
  employee_id: string;
  type: string;
  description: string | null;
  status: 'pending' | 'in_progress' | 'completed';
  assigned_to: string | null;
  completed_at: string | null;
  created_at: string;
}

export interface Meeting {
  id: string;
  company_id: string;
  employee_id: string;
  with_id: string | null;
  type: string;
  title: string | null;
  scheduled_date: string | null;
  url: string | null;
  completed_at: string | null;
  created_at: string;
}

export interface Notification {
  id: string;
  company_id: string;
  user_id: string;
  type: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export interface Message {
  id: string;
  company_id: string;
  sender_id: string;
  recipient_id: string;
  body: string;
  is_read: boolean;
  created_at: string;
}

export interface EmployeeFeedback {
  id: string;
  company_id: string;
  employee_id: string;
  reviewer_id: string | null;
  category: string;
  rating: number | null;
  comments: string | null;
  created_at: string;
}

export interface AuditLog {
  id: string;
  company_id: string;
  user_id: string | null;
  action: string;
  resource: string | null;
  details: string | null;
  created_at: string;
}

export interface Day1Readiness {
  id: string;
  company_id: string;
  employee_id: string;
  docs_ok: boolean;
  contract_ok: boolean;
  laptop_ok: boolean;
  email_ok: boolean;
  manager_ok: boolean;
  orientation_ok: boolean;
  payroll_ok: boolean;
  updated_at: string;
}
