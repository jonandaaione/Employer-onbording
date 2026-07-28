import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Mail, Phone, Briefcase, Building2, Calendar, MapPin, CheckCircle2, XCircle, FileText, ClipboardList, PenTool, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { Avatar, StatusBadge, ProgressBar, EmptyState } from '@/components/ui';
import type { Profile, EmployeeTask, DocumentRecord, Signature, TrainingProgress, Day1Readiness, Department } from '@/lib/types';

export default function EmployeeDetail() {
  const { id } = useParams();
  const { company } = useAuth();
  const [employee, setEmployee] = useState<Profile | null>(null);
  const [tasks, setTasks] = useState<EmployeeTask[]>([]);
  const [docs, setDocs] = useState<DocumentRecord[]>([]);
  const [sigs, setSigs] = useState<Signature[]>([]);
  const [training, setTraining] = useState<TrainingProgress[]>([]);
  const [readiness, setReadiness] = useState<Day1Readiness | null>(null);
  const [dept, setDept] = useState<Department | null>(null);
  const [tab, setTab] = useState<'overview' | 'documents' | 'tasks' | 'signatures' | 'training' | 'readiness'>('overview');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id || !company) return;
    (async () => {
      const { data: emp } = await supabase.from('profiles').select('*').eq('id', id).maybeSingle();
      setEmployee(emp as Profile | null);
      if (emp) {
        const { data: d } = await supabase.from('departments').select('*').eq('id', emp.department_id ?? '').maybeSingle();
        setDept(d as Department | null);
      }
      const [t, d, s, tr, r] = await Promise.all([
        supabase.from('employee_tasks').select('*').eq('employee_id', id),
        supabase.from('documents').select('*').eq('employee_id', id),
        supabase.from('signatures').select('*').eq('employee_id', id),
        supabase.from('training_progress').select('*').eq('employee_id', id),
        supabase.from('day1_readiness').select('*').eq('employee_id', id).maybeSingle(),
      ]);
      setTasks((t.data ?? []) as EmployeeTask[]);
      setDocs((d.data ?? []) as DocumentRecord[]);
      setSigs((s.data ?? []) as Signature[]);
      setTraining((tr.data ?? []) as TrainingProgress[]);
      setReadiness(r.data as Day1Readiness | null);
      setLoading(false);
    })();
  }, [id, company]);

  async function toggleReadiness(key: keyof Day1Readiness) {
    if (!readiness || !employee || !company) return;
    const newVal = !readiness[key];
    const { data } = await supabase
      .from('day1_readiness')
      .update({ [key]: newVal, updated_at: new Date().toISOString() })
      .eq('id', readiness.id)
      .select()
      .single();
    setReadiness(data as Day1Readiness);
  }

  if (loading) return <div className="py-20 text-center text-slate-400">Loading…</div>;
  if (!employee) return <EmptyState icon={XCircle} title="Employee not found" />;

  const tabs = [
    { key: 'overview', label: 'Overview', icon: Building2 },
    { key: 'documents', label: 'Documents', icon: FileText },
    { key: 'tasks', label: 'Tasks', icon: ClipboardList },
    { key: 'signatures', label: 'Signatures', icon: PenTool },
    { key: 'training', label: 'Training', icon: ShieldCheck },
    { key: 'readiness', label: 'Day 1 Readiness', icon: CheckCircle2 },
  ] as const;

  const readinessItems: { key: keyof Day1Readiness; label: string }[] = [
    { key: 'docs_ok', label: 'Documents approved' },
    { key: 'contract_ok', label: 'Contract signed' },
    { key: 'laptop_ok', label: 'Laptop provisioned' },
    { key: 'email_ok', label: 'Email account created' },
    { key: 'manager_ok', label: 'Manager assigned' },
    { key: 'orientation_ok', label: 'Orientation scheduled' },
    { key: 'payroll_ok', label: 'Payroll set up' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <Link to="/app/employees" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900">
        <ArrowLeft size={16} /> Back to employees
      </Link>

      {/* Header */}
      <div className="card p-6">
        <div className="flex items-start gap-5">
          <Avatar name={employee.name} photoUrl={employee.photo_url} size={64} />
          <div className="flex-1">
            <h1 className="text-xl font-bold text-slate-900">{employee.name}</h1>
            <p className="text-sm text-slate-500">{employee.email}</p>
            <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-slate-600">
              {employee.job_title && <span className="flex items-center gap-1.5"><Briefcase size={15} className="text-slate-400" /> {employee.job_title}</span>}
              {dept && <span className="flex items-center gap-1.5"><Building2 size={15} className="text-slate-400" /> {dept.name}</span>}
              {employee.joining_date && <span className="flex items-center gap-1.5"><Calendar size={15} className="text-slate-400" /> {new Date(employee.joining_date).toLocaleDateString()}</span>}
              {employee.location && <span className="flex items-center gap-1.5"><MapPin size={15} className="text-slate-400" /> {employee.location}</span>}
            </div>
          </div>
          <div className="text-right">
            <StatusBadge status={employee.status} />
            <p className="text-2xl font-bold text-slate-900 mt-2">{employee.onboarding_progress}%</p>
            <p className="text-xs text-slate-400">onboarding</p>
          </div>
        </div>
        <div className="mt-4"><ProgressBar value={employee.onboarding_progress} /></div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-200 overflow-x-auto">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px whitespace-nowrap transition ${
              tab === t.key ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <t.icon size={16} /> {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'overview' && (
        <div className="grid md:grid-cols-2 gap-6">
          <div className="card p-6">
            <h3 className="font-semibold text-slate-900 mb-4">Personal details</h3>
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between"><dt className="text-slate-500">Phone</dt><dd className="text-slate-900">{employee.phone || '—'}</dd></div>
              <div className="flex justify-between"><dt className="text-slate-500">Employment type</dt><dd className="text-slate-900 capitalize">{employee.employment_type?.replace('-', ' ') || '—'}</dd></div>
              <div className="flex justify-between"><dt className="text-slate-500">Location</dt><dd className="text-slate-900">{employee.location || '—'}</dd></div>
              <div className="flex justify-between"><dt className="text-slate-500">Status</dt><dd><StatusBadge status={employee.status} /></dd></div>
            </dl>
          </div>
          <div className="card p-6">
            <h3 className="font-semibold text-slate-900 mb-4">Onboarding summary</h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm"><span className="text-slate-500">Tasks completed</span><span className="font-medium text-slate-900">{tasks.filter(t => t.status === 'completed').length} / {tasks.length}</span></div>
              <div className="flex justify-between text-sm"><span className="text-slate-500">Documents approved</span><span className="font-medium text-slate-900">{docs.filter(d => d.status === 'approved').length} / {docs.length}</span></div>
              <div className="flex justify-between text-sm"><span className="text-slate-500">Agreements signed</span><span className="font-medium text-slate-900">{sigs.length}</span></div>
              <div className="flex justify-between text-sm"><span className="text-slate-500">Training completed</span><span className="font-medium text-slate-900">{training.filter(t => t.completed).length} / {training.length}</span></div>
            </div>
          </div>
        </div>
      )}

      {tab === 'documents' && (
        <div className="card overflow-hidden">
          {docs.length === 0 ? <EmptyState icon={FileText} title="No documents uploaded" /> : (
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr className="text-left text-xs font-semibold text-slate-500 uppercase">
                  <th className="px-6 py-3">Document</th><th className="px-6 py-3">Status</th><th className="px-6 py-3">Uploaded</th><th className="px-6 py-3">Reviewed</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {docs.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 text-sm font-medium text-slate-900">{d.doc_type_name}</td>
                    <td className="px-6 py-4"><StatusBadge status={d.status} /></td>
                    <td className="px-6 py-4 text-sm text-slate-500">{new Date(d.uploaded_at).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-sm text-slate-500">{d.reviewed_at ? new Date(d.reviewed_at).toLocaleDateString() : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {tab === 'tasks' && (
        <div className="card">
          {tasks.length === 0 ? <EmptyState icon={ClipboardList} title="No tasks assigned" /> : (
            <div className="divide-y divide-slate-100">
              {tasks.map((t) => (
                <div key={t.id} className="flex items-center justify-between px-6 py-4">
                  <div>
                    <p className="text-sm font-medium text-slate-900">{t.task_name}</p>
                    <p className="text-xs text-slate-500 capitalize">{t.dept_responsible} · due {t.due_date ? new Date(t.due_date).toLocaleDateString() : '—'}</p>
                  </div>
                  <StatusBadge status={t.status} />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'signatures' && (
        <div className="card">
          {sigs.length === 0 ? <EmptyState icon={PenTool} title="No signatures yet" /> : (
            <div className="divide-y divide-slate-100">
              {sigs.map((s) => (
                <div key={s.id} className="px-6 py-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-slate-900">{s.agreement_name}</p>
                    <span className="text-xs text-slate-500">{new Date(s.signed_at).toLocaleString()}</span>
                  </div>
                  <img src={s.signature_url} alt="signature" className="mt-2 h-16 rounded border border-slate-200 bg-white" />
                  <p className="text-xs text-slate-400 mt-1">IP: {s.ip} · Device: {s.device}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'training' && (
        <div className="card">
          {training.length === 0 ? <EmptyState icon={ShieldCheck} title="No training assigned" /> : (
            <div className="divide-y divide-slate-100">
              {training.map((t) => (
                <div key={t.id} className="flex items-center justify-between px-6 py-4">
                  <div>
                    <p className="text-sm font-medium text-slate-900">Course progress</p>
                    <p className="text-xs text-slate-500">{t.completed ? 'Completed' : 'In progress'} {t.quiz_score != null && `· Score: ${t.quiz_score}%`}</p>
                  </div>
                  {t.completed ? <CheckCircle2 size={20} className="text-emerald-500" /> : <StatusBadge status="in_progress" />}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'readiness' && (
        <div className="card p-6">
          <h3 className="font-semibold text-slate-900 mb-1">Day 1 Readiness Checklist</h3>
          <p className="text-sm text-slate-500 mb-5">Check off items as they're completed. All green means ready for Day 1.</p>
          {!readiness ? (
            <EmptyState icon={CheckCircle2} title="No readiness card" description="The readiness card is created when the employee is provisioned." />
          ) : (
            <div className="space-y-2">
              {readinessItems.map((item) => (
                <button
                  key={item.key}
                  onClick={() => toggleReadiness(item.key)}
                  className="flex items-center gap-3 w-full p-3 rounded-lg border border-slate-200 hover:bg-slate-50 transition text-left"
                >
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${readiness[item.key] ? 'bg-emerald-500 border-emerald-500' : 'border-slate-300'}`}>
                    {readiness[item.key] && <CheckCircle2 size={14} className="text-white" />}
                  </div>
                  <span className={`text-sm font-medium ${readiness[item.key] ? 'text-slate-900' : 'text-slate-500'}`}>{item.label}</span>
                </button>
              ))}
              <div className="mt-4 p-4 rounded-lg bg-slate-50 flex items-center justify-between">
                <span className="text-sm font-medium text-slate-700">Overall readiness</span>
                <span className="text-lg font-bold text-slate-900">
                  {readinessItems.filter(i => readiness[i.key]).length} / {readinessItems.length}
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
