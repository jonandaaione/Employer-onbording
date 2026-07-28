import { useEffect, useState } from 'react';
import { ClipboardList, CheckCircle2, Clock, Calendar } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { StatusBadge, EmptyState } from '@/components/ui';
import type { EmployeeTask } from '@/lib/types';

export default function PortalTasks() {
  const { profile } = useAuth();
  const [tasks, setTasks] = useState<EmployeeTask[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    if (!profile) return;
    const { data } = await supabase.from('employee_tasks').select('*').eq('employee_id', profile.id).order('due_date', { ascending: true });
    setTasks((data ?? []) as EmployeeTask[]);
    setLoading(false);
  }

  useEffect(() => { load(); }, [profile]);

  async function updateStatus(id: string, status: string) {
    await supabase.from('employee_tasks').update({
      status,
      completed_at: status === 'completed' ? new Date().toISOString() : null,
    }).eq('id', id);
    await load();
  }

  if (loading) return <div className="py-20 text-center text-slate-400">Loading…</div>;

  const completed = tasks.filter(t => t.status === 'completed');
  const remaining = tasks.filter(t => t.status !== 'completed');

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">My Tasks</h1>
        <p className="text-slate-500 text-sm mt-1">{completed.length} of {tasks.length} completed</p>
      </div>

      {/* Progress */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-slate-700">Overall progress</span>
          <span className="text-sm font-bold text-blue-600">{tasks.length ? Math.round(completed.length / tasks.length * 100) : 0}%</span>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
          <div className="h-full bg-blue-600 rounded-full transition-all" style={{ width: `${tasks.length ? (completed.length / tasks.length * 100) : 0}%` }} />
        </div>
      </div>

      {tasks.length === 0 ? (
        <div className="card"><EmptyState icon={ClipboardList} title="No tasks assigned" /></div>
      ) : (
        <>
          {remaining.length > 0 && (
            <div>
              <h3 className="font-semibold text-slate-900 mb-3">To do</h3>
              <div className="space-y-2">
                {remaining.map((t) => (
                  <div key={t.id} className="card p-4 flex items-center justify-between">
                    <div className="flex items-start gap-3">
                      <div className={`w-5 h-5 rounded border-2 mt-0.5 ${t.status === 'in_progress' ? 'border-blue-500 bg-blue-50' : 'border-slate-300'}`} />
                      <div>
                        <p className="text-sm font-medium text-slate-900">{t.task_name}</p>
                        <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                          <Calendar size={12} /> Due {t.due_date ? new Date(t.due_date).toLocaleDateString() : '—'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={t.status} />
                      <select
                        value={t.status}
                        onChange={(e) => updateStatus(t.id, e.target.value)}
                        className="text-xs px-2 py-1.5 rounded border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                      >
                        <option value="pending">Pending</option>
                        <option value="in_progress">In Progress</option>
                        <option value="completed">Mark Done</option>
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {completed.length > 0 && (
            <div>
              <h3 className="font-semibold text-slate-900 mb-3">Completed</h3>
              <div className="space-y-2">
                {completed.map((t) => (
                  <div key={t.id} className="card p-4 flex items-center gap-3 opacity-70">
                    <CheckCircle2 size={20} className="text-emerald-500" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-700 line-through">{t.task_name}</p>
                      <p className="text-xs text-slate-400">Completed {t.completed_at ? new Date(t.completed_at).toLocaleDateString() : ''}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
