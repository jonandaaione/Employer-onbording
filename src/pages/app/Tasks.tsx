import { useEffect, useState } from 'react';
import { ClipboardList, Plus, Calendar, Trash2 } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { Modal, EmptyState, StatusBadge } from '@/components/ui';
import type { EmployeeTask, Profile } from '@/lib/types';

const columns = [
  { key: 'pending', title: 'Pending', color: 'bg-slate-100 text-slate-600' },
  { key: 'in_progress', title: 'In Progress', color: 'bg-blue-100 text-blue-700' },
  { key: 'completed', title: 'Completed', color: 'bg-emerald-100 text-emerald-700' },
  { key: 'overdue', title: 'Overdue', color: 'bg-red-100 text-red-700' },
] as const;

export default function Tasks() {
  const { company, profile } = useAuth();
  const [tasks, setTasks] = useState<EmployeeTask[]>([]);
  const [employees, setEmployees] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ task_name: '', employee_id: '', dept_responsible: 'employee', due_date: '' });

  async function load() {
    if (!company) return;
    const [{ data: t }, { data: emps }] = await Promise.all([
      supabase.from('employee_tasks').select('*').eq('company_id', company.id).order('created_at', { ascending: false }),
      supabase.from('profiles').select('*').eq('company_id', company.id).neq('role', 'hr_admin'),
    ]);
    setTasks((t ?? []) as EmployeeTask[]);
    setEmployees((emps ?? []) as Profile[]);
    setLoading(false);
  }

  useEffect(() => { load(); }, [company]);

  async function moveTask(id: string, status: string) {
    await supabase
      .from('employee_tasks')
      .update({ status, completed_at: status === 'completed' ? new Date().toISOString() : null })
      .eq('id', id);
    await load();
  }

  async function addTask(e: React.FormEvent) {
    e.preventDefault();
    if (!company) return;
    await supabase.from('employee_tasks').insert({
      company_id: company.id,
      employee_id: form.employee_id,
      task_name: form.task_name,
      dept_responsible: form.dept_responsible,
      status: 'pending',
      due_date: form.due_date || null,
    });
    setShowAdd(false);
    setForm({ task_name: '', employee_id: '', dept_responsible: 'employee', due_date: '' });
    await load();
  }

  async function deleteTask(id: string) {
    await supabase.from('employee_tasks').delete().eq('id', id);
    await load();
  }

  const empName = (id: string) => employees.find((e) => e.id === id)?.name ?? 'Unknown';

  if (loading) return <div className="py-20 text-center text-slate-400">Loading tasks…</div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Tasks</h1>
          <p className="text-slate-500 text-sm mt-1">{tasks.length} total tasks across all employees</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="btn-primary"><Plus size={18} /> Add task</button>
      </div>

      {tasks.length === 0 ? (
        <div className="card"><EmptyState icon={ClipboardList} title="No tasks yet" description="Tasks are auto-created when you add employees. You can also create custom tasks." action={<button onClick={() => setShowAdd(true)} className="btn-primary"><Plus size={18} /> Add task</button>} /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {columns.map((col) => {
            const colTasks = tasks.filter((t) => t.status === col.key);
            return (
              <div key={col.key} className="bg-slate-50 rounded-xl p-3 min-h-[200px]">
                <div className="flex items-center justify-between mb-3 px-1">
                  <span className={`badge ${col.color}`}>{col.title}</span>
                  <span className="text-xs text-slate-400 font-medium">{colTasks.length}</span>
                </div>
                <div className="space-y-2">
                  {colTasks.map((t) => (
                    <div key={t.id} className="card p-3 hover:shadow-md transition group">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium text-slate-900">{t.task_name}</p>
                        <button onClick={() => deleteTask(t.id)} className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-500 transition">
                          <Trash2 size={14} />
                        </button>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">{empName(t.employee_id)}</p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-slate-400 capitalize">{t.dept_responsible}</span>
                        {t.due_date && (
                          <span className="text-xs text-slate-400 flex items-center gap-1">
                            <Calendar size={12} /> {new Date(t.due_date).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                      <select
                        value={t.status}
                        onChange={(e) => moveTask(t.id, e.target.value)}
                        className="mt-2 w-full text-xs px-2 py-1.5 rounded border border-slate-200 bg-white text-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      >
                        <option value="pending">Pending</option>
                        <option value="in_progress">In Progress</option>
                        <option value="completed">Completed</option>
                        <option value="overdue">Overdue</option>
                      </select>
                    </div>
                  ))}
                  {colTasks.length === 0 && <p className="text-xs text-slate-400 text-center py-8">No tasks</p>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add task">
        <form onSubmit={addTask} className="space-y-4">
          <div>
            <label className="label">Task name</label>
            <input className="input" required value={form.task_name} onChange={(e) => setForm({ ...form, task_name: e.target.value })} placeholder="e.g. Schedule orientation" />
          </div>
          <div>
            <label className="label">Assign to employee</label>
            <select className="input" required value={form.employee_id} onChange={(e) => setForm({ ...form, employee_id: e.target.value })}>
              <option value="">Select employee…</option>
              {employees.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Responsible dept</label>
              <select className="input" value={form.dept_responsible} onChange={(e) => setForm({ ...form, dept_responsible: e.target.value })}>
                <option value="employee">Employee</option>
                <option value="hr">HR</option>
                <option value="it">IT</option>
                <option value="manager">Manager</option>
              </select>
            </div>
            <div>
              <label className="label">Due date</label>
              <input type="date" className="input" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setShowAdd(false)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">Create task</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
