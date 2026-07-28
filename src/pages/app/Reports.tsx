import { useEffect, useState } from 'react';
import { BarChart3, TrendingUp, Users, Clock, Award, Download } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell } from 'recharts';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { StatCard, EmptyState } from '@/components/ui';
import type { Profile, EmployeeTask, DocumentRecord, Department } from '@/lib/types';

const COLORS = ['#2563eb', '#0d9488', '#d97706', '#dc2626', '#7c3aed'];

export default function Reports() {
  const { company } = useAuth();
  const [employees, setEmployees] = useState<Profile[]>([]);
  const [tasks, setTasks] = useState<EmployeeTask[]>([]);
  const [docs, setDocs] = useState<DocumentRecord[]>([]);
  const [depts, setDepts] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!company) return;
    (async () => {
      const [{ data: e }, { data: t }, { data: d }, { data: dp }] = await Promise.all([
        supabase.from('profiles').select('*').eq('company_id', company.id).neq('role', 'hr_admin'),
        supabase.from('employee_tasks').select('*').eq('company_id', company.id),
        supabase.from('documents').select('*').eq('company_id', company.id),
        supabase.from('departments').select('*').eq('company_id', company.id),
      ]);
      setEmployees((e ?? []) as Profile[]);
      setTasks((t ?? []) as EmployeeTask[]);
      setDocs((d ?? []) as DocumentRecord[]);
      setDepts((dp ?? []) as Department[]);
      setLoading(false);
    })();
  }, [company]);

  if (loading) return <div className="py-20 text-center text-slate-400">Loading reports…</div>;

  const completionRate = employees.length ? Math.round(employees.filter(e => (e.onboarding_progress ?? 0) >= 100).length / employees.length * 100) : 0;
  const avgProgress = employees.length ? Math.round(employees.reduce((s, e) => s + (e.onboarding_progress ?? 0), 0) / employees.length) : 0;
  const taskCompletion = tasks.length ? Math.round(tasks.filter(t => t.status === 'completed').length / tasks.length * 100) : 0;
  const docApprovalRate = docs.length ? Math.round(docs.filter(d => d.status === 'approved').length / docs.length * 100) : 0;

  // Department progress
  const deptProgress = depts.map((d) => {
    const deptEmps = employees.filter((e) => e.department_id === d.id);
    const avg = deptEmps.length ? Math.round(deptEmps.reduce((s, e) => s + (e.onboarding_progress ?? 0), 0) / deptEmps.length) : 0;
    return { name: d.name, progress: avg, count: deptEmps.length };
  }).filter((d) => d.count > 0);

  // Activity over time (tasks created by date)
  const taskActivity: Record<string, number> = {};
  tasks.forEach((t) => {
    const day = new Date(t.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    taskActivity[day] = (taskActivity[day] ?? 0) + 1;
  });
  const activityData = Object.entries(taskActivity).slice(-7).map(([name, value]) => ({ name, value }));

  // Document processing
  const docProcessing = [
    { name: 'Approved', value: docs.filter(d => d.status === 'approved').length },
    { name: 'Pending', value: docs.filter(d => d.status === 'pending').length },
    { name: 'Rejected', value: docs.filter(d => d.status === 'rejected').length },
    { name: 'Resubmit', value: docs.filter(d => d.status === 'resubmit').length },
  ].filter(s => s.value > 0);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Reports & Analytics</h1>
          <p className="text-slate-500 text-sm mt-1">Onboarding performance and insights</p>
        </div>
        <button onClick={() => window.print()} className="btn-secondary"><Download size={18} /> Export</button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Award} label="Completion rate" value={`${completionRate}%`} accent="emerald" />
        <StatCard icon={TrendingUp} label="Avg. progress" value={`${avgProgress}%`} accent="blue" />
        <StatCard icon={Clock} label="Task completion" value={`${taskCompletion}%`} accent="purple" />
        <StatCard icon={Users} label="Doc approval" value={`${docApprovalRate}%`} accent="amber" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <h3 className="font-semibold text-slate-900 mb-4">Department progress</h3>
          {deptProgress.length === 0 ? <EmptyState icon={BarChart3} title="No data" /> : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={deptProgress}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 13 }} />
                <Bar dataKey="progress" fill="#2563eb" radius={[6, 6, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="card p-6">
          <h3 className="font-semibold text-slate-900 mb-4">Task activity (last 7 days)</h3>
          {activityData.length === 0 ? <EmptyState icon={Clock} title="No activity" /> : (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={activityData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 13 }} />
                <Line type="monotone" dataKey="value" stroke="#0d9488" strokeWidth={2.5} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <h3 className="font-semibold text-slate-900 mb-4">Document processing</h3>
          {docProcessing.length === 0 ? <EmptyState icon={BarChart3} title="No documents" /> : (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={docProcessing} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={2}>
                  {docProcessing.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 13 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="card p-6">
          <h3 className="font-semibold text-slate-900 mb-4">Employee leaderboard</h3>
          <div className="space-y-2">
            {[...employees].sort((a, b) => (b.onboarding_progress ?? 0) - (a.onboarding_progress ?? 0)).slice(0, 8).map((e, i) => (
              <div key={e.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50">
                <span className="flex items-center gap-3">
                  <span className="text-xs font-bold text-slate-400 w-5">#{i + 1}</span>
                  <span className="text-sm font-medium text-slate-900">{e.name}</span>
                </span>
                <span className="text-sm font-bold text-blue-600">{e.onboarding_progress ?? 0}%</span>
              </div>
            ))}
            {employees.length === 0 && <p className="text-sm text-slate-400 text-center py-8">No employees</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
