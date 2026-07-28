import { useEffect, useState } from 'react';
import { Calendar, Briefcase, Building2, ClipboardList, FileText, GraduationCap, CheckCircle2, Clock, TrendingUp } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { ProgressBar, StatusBadge, EmptyState } from '@/components/ui';
import type { EmployeeTask, DocumentRecord, TrainingProgress, Meeting, Department } from '@/lib/types';

export default function PortalDashboard() {
  const { profile } = useAuth();
  const [tasks, setTasks] = useState<EmployeeTask[]>([]);
  const [docs, setDocs] = useState<DocumentRecord[]>([]);
  const [training, setTraining] = useState<TrainingProgress[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [dept, setDept] = useState<Department | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;
    (async () => {
      const [t, d, tr, m] = await Promise.all([
        supabase.from('employee_tasks').select('*').eq('employee_id', profile.id),
        supabase.from('documents').select('*').eq('employee_id', profile.id),
        supabase.from('training_progress').select('*').eq('employee_id', profile.id),
        supabase.from('meetings').select('*').eq('employee_id', profile.id).order('scheduled_date', { ascending: true }),
      ]);
      setTasks((t.data ?? []) as EmployeeTask[]);
      setDocs((d.data ?? []) as DocumentRecord[]);
      setTraining((tr.data ?? []) as TrainingProgress[]);
      setMeetings((m.data ?? []) as Meeting[]);
      if (profile.department_id) {
        const { data: dp } = await supabase.from('departments').select('*').eq('id', profile.department_id).maybeSingle();
        setDept(dp as Department | null);
      }
      setLoading(false);
    })();
  }, [profile]);

  if (loading) return <div className="py-20 text-center text-slate-400">Loading…</div>;
  if (!profile) return null;

  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  const pendingTasks = tasks.length - completedTasks;
  const completedTraining = training.filter(t => t.completed).length;
  const approvedDocs = docs.filter(d => d.status === 'approved').length;
  const upcomingMeetings = meetings.filter(m => !m.completed_at && m.scheduled_date && new Date(m.scheduled_date) > new Date());

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Welcome, {profile.name.split(' ')[0]}!</h1>
        <p className="text-slate-500 text-sm mt-1">Here's your onboarding progress at a glance.</p>
      </div>

      {/* Progress hero */}
      <div className="card p-6 bg-gradient-to-br from-blue-600 to-blue-800 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
        <div className="relative">
          <p className="text-blue-100 text-sm">Your onboarding progress</p>
          <p className="text-4xl font-bold mt-1">{profile.onboarding_progress}%</p>
          <div className="mt-4 w-full max-w-md bg-white/20 rounded-full h-2.5 overflow-hidden">
            <div className="h-full bg-white rounded-full transition-all" style={{ width: `${profile.onboarding_progress}%` }} />
          </div>
          <div className="flex flex-wrap gap-4 mt-4 text-sm">
            {profile.joining_date && <span className="flex items-center gap-1.5"><Calendar size={15} /> Starts {new Date(profile.joining_date).toLocaleDateString()}</span>}
            {profile.job_title && <span className="flex items-center gap-1.5"><Briefcase size={15} /> {profile.job_title}</span>}
            {dept && <span className="flex items-center gap-1.5"><Building2 size={15} /> {dept.name}</span>}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center"><ClipboardList size={20} className="text-blue-600" /></div>
            <div><p className="text-xs text-slate-500">Tasks</p><p className="text-xl font-bold text-slate-900">{completedTasks}/{tasks.length}</p></div>
          </div>
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center"><FileText size={20} className="text-emerald-600" /></div>
            <div><p className="text-xs text-slate-500">Documents</p><p className="text-xl font-bold text-slate-900">{approvedDocs}/{docs.length}</p></div>
          </div>
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-teal-50 flex items-center justify-center"><GraduationCap size={20} className="text-teal-600" /></div>
            <div><p className="text-xs text-slate-500">Training</p><p className="text-xl font-bold text-slate-900">{completedTraining}/{training.length}</p></div>
          </div>
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center"><Calendar size={20} className="text-purple-600" /></div>
            <div><p className="text-xs text-slate-500">Meetings</p><p className="text-xl font-bold text-slate-900">{upcomingMeetings.length}</p></div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Remaining tasks */}
        <div className="card p-6">
          <h3 className="font-semibold text-slate-900 mb-4">Remaining tasks</h3>
          {tasks.filter(t => t.status !== 'completed').length === 0 ? (
            <EmptyState icon={CheckCircle2} title="All tasks complete!" />
          ) : (
            <div className="space-y-2">
              {tasks.filter(t => t.status !== 'completed').slice(0, 6).map((t) => (
                <div key={t.id} className="flex items-center justify-between p-3 rounded-lg border border-slate-200">
                  <div>
                    <p className="text-sm font-medium text-slate-900">{t.task_name}</p>
                    <p className="text-xs text-slate-500 flex items-center gap-1"><Clock size={12} /> Due {t.due_date ? new Date(t.due_date).toLocaleDateString() : '—'}</p>
                  </div>
                  <StatusBadge status={t.status} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Required documents */}
        <div className="card p-6">
          <h3 className="font-semibold text-slate-900 mb-4">Required documents</h3>
          {docs.length === 0 ? (
            <EmptyState icon={FileText} title="No documents yet" description="Upload your documents to get approved." />
          ) : (
            <div className="space-y-2">
              {docs.slice(0, 6).map((d) => (
                <div key={d.id} className="flex items-center justify-between p-3 rounded-lg border border-slate-200">
                  <p className="text-sm font-medium text-slate-900">{d.doc_type_name}</p>
                  <StatusBadge status={d.status} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Upcoming meetings */}
      {upcomingMeetings.length > 0 && (
        <div className="card p-6">
          <h3 className="font-semibold text-slate-900 mb-4">Upcoming meetings</h3>
          <div className="space-y-2">
            {upcomingMeetings.map((m) => (
              <div key={m.id} className="flex items-center justify-between p-3 rounded-lg border border-slate-200">
                <div>
                  <p className="text-sm font-medium text-slate-900">{m.title ?? m.type}</p>
                  <p className="text-xs text-slate-500">{new Date(m.scheduled_date!).toLocaleString()}</p>
                </div>
                {m.url && <a href={m.url} target="_blank" rel="noreferrer" className="text-sm text-blue-600 hover:underline">Join</a>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
