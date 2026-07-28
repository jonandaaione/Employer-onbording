import { useEffect, useState } from 'react';
import {
  Users,
  CalendarCheck,
  CheckCircle2,
  AlertTriangle,
  FileWarning,
  TrendingUp,
  Clock,
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { StatCard, ProgressBar, Avatar, StatusBadge } from '@/components/ui';
import type { Profile, EmployeeTask, DocumentRecord } from '@/lib/types';

const COLORS = ['#2563eb', '#0d9488', '#d97706', '#dc2626', '#7c3aed', '#64748b'];

export default function Dashboard() {
  const { profile, company } = useAuth();
  const [employees, setEmployees] = useState<Profile[]>([]);
  const [tasks, setTasks] = useState<EmployeeTask[]>([]);
  const [docs, setDocs] = useState<DocumentRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!company) return;
    (async () => {
      const [{ data: emps }, { data: t }, { data: d }] = await Promise.all([
        supabase.from('profiles').select('*').eq('company_id', company.id).neq('role', 'hr_admin'),
        supabase.from('employee_tasks').select('*').eq('company_id', company.id),
        supabase.from('documents').select('*').eq('company_id', company.id),
      ]);
      setEmployees((emps ?? []) as Profile[]);
      setTasks((t ?? []) as EmployeeTask[]);
      setDocs((d ?? []) as DocumentRecord[]);
      setLoading(false);
    })();
  }, [company]);

  const now = new Date();
  const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const joiningThisWeek = employees.filter(
    (e) => e.joining_date && new Date(e.joining_date) >= now && new Date(e.joining_date) <= weekFromNow
  ).length;

  const readyForDay1 = employees.filter((e) => e.onboarding_progress >= 100).length;
  const pendingDocs = docs.filter((d) => d.status === 'pending' || d.status === 'under_review').length;
  const overdueTasks = tasks.filter(
    (t) => t.status !== 'completed' && t.due_date && new Date(t.due_date) < now
  ).length;

  const avgProgress = employees.length
    ? Math.round(employees.reduce((sum, e) => sum + (e.onboarding_progress ?? 0), 0) / employees.length)
    : 0;

  // Chart: onboarding progress over last 6 "buckets" (by employee created date)
  const progressData = employees.slice(0, 6).map((e, i) => ({
    name: e.name.split(' ')[0],
    progress: e.onboarding_progress ?? 0,
  }));

  // Chart: tasks by status
  const taskStatusData = [
    { name: 'Pending', value: tasks.filter((t) => t.status === 'pending').length },
    { name: 'In Progress', value: tasks.filter((t) => t.status === 'in_progress').length },
    { name: 'Completed', value: tasks.filter((t) => t.status === 'completed').length },
    { name: 'Overdue', value: tasks.filter((t) => t.status === 'overdue').length },
  ].filter((s) => s.value > 0);

  // Chart: documents by status
  const docStatusData = [
    { name: 'Pending', value: docs.filter((d) => d.status === 'pending').length },
    { name: 'Under Review', value: docs.filter((d) => d.status === 'under_review').length },
    { name: 'Approved', value: docs.filter((d) => d.status === 'approved').length },
    { name: 'Rejected', value: docs.filter((d) => d.status === 'rejected').length },
  ].filter((s) => s.value > 0);

  const recentJoiners = [...employees]
    .sort((a, b) => (b.created_at ?? '').localeCompare(a.created_at ?? ''))
    .slice(0, 5);

  if (loading) {
    return <div className="flex items-center justify-center py-20 text-slate-400">Loading dashboard…</div>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-500 text-sm mt-1">Onboarding overview for {company?.name}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Total onboarding" value={employees.length} accent="blue" />
        <StatCard icon={CalendarCheck} label="Joining this week" value={joiningThisWeek} accent="purple" />
        <StatCard icon={CheckCircle2} label="Ready for Day 1" value={readyForDay1} accent="emerald" />
        <StatCard icon={FileWarning} label="Pending documents" value={pendingDocs} accent="amber" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={AlertTriangle} label="Overdue tasks" value={overdueTasks} accent="red" />
        <StatCard icon={TrendingUp} label="Avg. onboarding" value={`${avgProgress}%`} accent="emerald" />
        <StatCard icon={Clock} label="Active tasks" value={tasks.filter((t) => t.status !== 'completed').length} accent="blue" />
        <StatCard icon={CheckCircle2} label="Completed tasks" value={tasks.filter((t) => t.status === 'completed').length} accent="slate" />
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="card p-6 lg:col-span-2">
          <h3 className="font-semibold text-slate-900 mb-4">Onboarding progress by employee</h3>
          {progressData.length === 0 ? (
            <p className="text-sm text-slate-400 py-12 text-center">No employees yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={progressData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} domain={[0, 100]} />
                <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 13 }} />
                <Bar dataKey="progress" fill="#2563eb" radius={[6, 6, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="card p-6">
          <h3 className="font-semibold text-slate-900 mb-4">Task status</h3>
          {taskStatusData.length === 0 ? (
            <p className="text-sm text-slate-400 py-12 text-center">No tasks yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={taskStatusData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={2}>
                  {taskStatusData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 13 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
          <div className="mt-3 space-y-1.5">
            {taskStatusData.map((s, i) => (
              <div key={s.name} className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-slate-600">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                  {s.name}
                </span>
                <span className="font-medium text-slate-900">{s.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent joiners */}
        <div className="card p-6">
          <h3 className="font-semibold text-slate-900 mb-4">Recent joiners</h3>
          {recentJoiners.length === 0 ? (
            <p className="text-sm text-slate-400 py-8 text-center">No employees yet.</p>
          ) : (
            <div className="space-y-3">
              {recentJoiners.map((e) => (
                <div key={e.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar name={e.name} photoUrl={e.photo_url} size={36} />
                    <div>
                      <p className="text-sm font-medium text-slate-900">{e.name}</p>
                      <p className="text-xs text-slate-500">{e.job_title ?? 'Employee'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-24"><ProgressBar value={e.onboarding_progress ?? 0} /></div>
                    <span className="text-xs font-medium text-slate-600 w-8 text-right">{e.onboarding_progress ?? 0}%</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Document status */}
        <div className="card p-6">
          <h3 className="font-semibold text-slate-900 mb-4">Document status</h3>
          {docStatusData.length === 0 ? (
            <p className="text-sm text-slate-400 py-8 text-center">No documents uploaded yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={docStatusData}>
                <defs>
                  <linearGradient id="docGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 13 }} />
                <Area type="monotone" dataKey="value" stroke="#2563eb" fill="url(#docGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
