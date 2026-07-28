import { supabase } from '@/lib/supabase';

// Seeds default departments, document types, agreements, training, and templates
// for a newly created company. Called after signup.
export async function seedCompanyData(companyId: string, hrProfileId: string) {
  // Departments
  const departments = ['Engineering', 'Sales', 'Human Resources', 'Finance', 'Operations'];
  const deptRows = departments.map((name) => ({ company_id: companyId, name }));
  const { data: depts } = await supabase.from('departments').insert(deptRows).select();

  // Document types
  const docTypes = [
    { name: 'National ID / CNIC', is_required: true, file_types: 'pdf,jpg,png' },
    { name: 'Resume / CV', is_required: true, file_types: 'pdf,doc,docx' },
    { name: 'Educational Certificate', is_required: true, file_types: 'pdf,jpg,png' },
    { name: 'Bank Details', is_required: true, file_types: 'pdf,jpg,png' },
    { name: 'Tax Information', is_required: false, file_types: 'pdf,jpg,png' },
    { name: 'Previous Employment Letter', is_required: false, file_types: 'pdf,jpg,png' },
  ];
  await supabase.from('document_types').insert(docTypes.map((d) => ({ ...d, company_id: companyId })));

  // Agreements
  const agreements = [
    { name: 'Employment Contract', body: 'This Employment Agreement is entered into between the Company and the Employee. The Employee agrees to perform their duties diligently and in accordance with company policies. Compensation, benefits, and terms of employment are outlined in the attached schedule. This agreement is binding upon signature.', version: 1, is_active: true },
    { name: 'Non-Disclosure Agreement (NDA)', body: 'The Employee agrees to keep confidential all proprietary information, trade secrets, and business data of the Company. This obligation survives the termination of employment. Breach of this agreement may result in legal action.', version: 1, is_active: true },
    { name: 'Code of Conduct', body: 'The Employee agrees to uphold the Company code of conduct, including professional behavior, respect for colleagues, compliance with laws, and ethical business practices at all times.', version: 1, is_active: true },
    { name: 'Equipment Agreement', body: 'The Employee acknowledges receipt of company equipment (laptop, accessories) and agrees to use it responsibly, return it upon termination, and report any damage or loss immediately.', version: 1, is_active: true },
  ];
  await supabase.from('agreements').insert(agreements.map((a) => ({ ...a, company_id: companyId })));

  // Training courses with lessons
  const courses = [
    { name: 'Welcome to the Company', description: 'Introduction to our mission, values, and culture.', lessons: [
      { title: 'Company Overview', quiz_q: 'What is our company mission?', quiz_options: ['Innovate globally', 'Build great products', 'Serve customers first', 'All of the above'], quiz_answer: 3 },
      { title: 'Meet the Team', quiz_q: 'Who is your first point of contact?', quiz_options: ['CEO', 'HR Manager', 'Your manager', 'IT Support'], quiz_answer: 2 },
    ]},
    { name: 'Role-Specific Training', description: 'Training tailored to your role and department.', lessons: [
      { title: 'Your Role Explained', quiz_q: 'What should you do in your first week?', quiz_options: ['Nothing', 'Shadow your team', 'Take vacation', 'Quit'], quiz_answer: 1 },
    ]},
    { name: 'Workplace Safety', description: 'Health, safety, and compliance essentials.', lessons: [
      { title: 'Safety Basics', quiz_q: 'What is the first thing to do in an emergency?', quiz_options: ['Panic', 'Call emergency services', 'Run outside', 'Hide'], quiz_answer: 1 },
    ]},
  ];

  for (const c of courses) {
    const { data: course } = await supabase
      .from('training_courses')
      .insert({ company_id: companyId, name: c.name, description: c.description, is_mandatory: true })
      .select()
      .single();
    if (course) {
      const lessonRows = c.lessons.map((l, i) => ({
        course_id: course.id,
        title: l.title,
        quiz_q: l.quiz_q,
        quiz_options: l.quiz_options,
        quiz_answer: l.quiz_answer,
        order: i,
      }));
      await supabase.from('training_lessons').insert(lessonRows);
    }
  }

  // Onboarding templates
  const templates = [
    { name: 'Office Onboarding', employment_type: 'full-time', tasks: [
      { task_name: 'Verify employment contract', dept_responsible: 'hr', deadline_days: 3 },
      { task_name: 'Set up payroll', dept_responsible: 'hr', deadline_days: 5 },
      { task_name: 'Assign employee ID', dept_responsible: 'hr', deadline_days: 2 },
      { task_name: 'Create email account', dept_responsible: 'it', deadline_days: 2 },
      { task_name: 'Provision laptop', dept_responsible: 'it', deadline_days: 3 },
      { task_name: 'Schedule welcome meeting', dept_responsible: 'manager', deadline_days: 1 },
      { task_name: 'Complete profile', dept_responsible: 'employee', deadline_days: 2 },
      { task_name: 'Upload required documents', dept_responsible: 'employee', deadline_days: 3 },
      { task_name: 'Sign agreements', dept_responsible: 'employee', deadline_days: 3 },
      { task_name: 'Complete training', dept_responsible: 'employee', deadline_days: 7 },
    ]},
    { name: 'Remote Onboarding', employment_type: 'full-time', tasks: [
      { task_name: 'Verify employment contract', dept_responsible: 'hr', deadline_days: 3 },
      { task_name: 'Set up payroll', dept_responsible: 'hr', deadline_days: 5 },
      { task_name: 'Create email account', dept_responsible: 'it', deadline_days: 2 },
      { task_name: 'Provision laptop & ship', dept_responsible: 'it', deadline_days: 5 },
      { task_name: 'Configure VPN access', dept_responsible: 'it', deadline_days: 2 },
      { task_name: 'Schedule virtual welcome', dept_responsible: 'manager', deadline_days: 1 },
      { task_name: 'Complete profile', dept_responsible: 'employee', deadline_days: 2 },
      { task_name: 'Upload documents', dept_responsible: 'employee', deadline_days: 3 },
      { task_name: 'Sign agreements', dept_responsible: 'employee', deadline_days: 3 },
      { task_name: 'Complete remote training', dept_responsible: 'employee', deadline_days: 7 },
    ]},
  ];

  for (const t of templates) {
    const { data: tmpl } = await supabase
      .from('onboarding_templates')
      .insert({ company_id: companyId, name: t.name, employment_type: t.employment_type, is_active: true, created_by: hrProfileId })
      .select()
      .single();
    if (tmpl) {
      await supabase.from('template_tasks').insert(
        t.tasks.map((task) => ({ ...task, template_id: tmpl.id, priority: 'medium' }))
      );
    }
  }

  return depts;
}

// When HR adds an employee (creates an auth user + profile), auto-generate tasks
// from the default template, a day1 readiness row, and training progress rows.
export async function provisionEmployee(
  companyId: string,
  employeeProfileId: string,
  templateId: string | null
) {
  // Day 1 readiness row
  await supabase.from('day1_readiness').upsert({
    company_id: companyId,
    employee_id: employeeProfileId,
  }, { onConflict: 'employee_id' });

  // Training progress for all mandatory courses
  const { data: courses } = await supabase
    .from('training_courses')
    .select('id')
    .eq('company_id', companyId)
    .eq('is_mandatory', true);
  if (courses && courses.length) {
    await supabase.from('training_progress').upsert(
      courses.map((c) => ({
        company_id: companyId,
        employee_id: employeeProfileId,
        course_id: c.id,
        completed: false,
      })),
      { onConflict: 'employee_id,course_id' }
    );
  }

  // Tasks from template
  if (templateId) {
    const { data: tasks } = await supabase
      .from('template_tasks')
      .select('*')
      .eq('template_id', templateId);
    if (tasks && tasks.length) {
      const today = new Date();
      await supabase.from('employee_tasks').insert(
        tasks.map((t) => {
          const due = new Date(today);
          due.setDate(due.getDate() + (t.deadline_days ?? 7));
          return {
            company_id: companyId,
            employee_id: employeeProfileId,
            task_name: t.task_name,
            dept_responsible: t.dept_responsible ?? 'employee',
            status: 'pending',
            due_date: due.toISOString().slice(0, 10),
          };
        })
      );
    }
  } else {
    // Default tasks if no template
    const defaultTasks = [
      { task_name: 'Complete profile', dept_responsible: 'employee', days: 2 },
      { task_name: 'Upload required documents', dept_responsible: 'employee', days: 3 },
      { task_name: 'Sign agreements', dept_responsible: 'employee', days: 3 },
      { task_name: 'Complete training', dept_responsible: 'employee', days: 7 },
      { task_name: 'Verify employment contract', dept_responsible: 'hr', days: 3 },
      { task_name: 'Set up payroll', dept_responsible: 'hr', days: 5 },
      { task_name: 'Create email account', dept_responsible: 'it', days: 2 },
      { task_name: 'Provision laptop', dept_responsible: 'it', days: 3 },
      { task_name: 'Schedule welcome meeting', dept_responsible: 'manager', days: 1 },
    ];
    const today = new Date();
    await supabase.from('employee_tasks').insert(
      defaultTasks.map((t) => {
        const due = new Date(today);
        due.setDate(due.getDate() + t.days);
        return {
          company_id: companyId,
          employee_id: employeeProfileId,
          task_name: t.task_name,
          dept_responsible: t.dept_responsible,
          status: 'pending',
          due_date: due.toISOString().slice(0, 10),
        };
      })
    );
  }
}

export async function logAudit(companyId: string, userId: string, action: string, resource?: string, details?: string) {
  await supabase.from('audit_logs').insert({
    company_id: companyId,
    user_id: userId,
    action,
    resource: resource ?? null,
    details: details ?? null,
  });
}
