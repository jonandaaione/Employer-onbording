import { useEffect, useState } from 'react';
import { Briefcase, Plus, Trash2 } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { Modal, EmptyState } from '@/components/ui';
import type { JobRole, Department } from '@/lib/types';

export default function JobRoles() {
  const { company } = useAuth();
  const [roles, setRoles] = useState<JobRole[]>([]);
  const [depts, setDepts] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ title: '', department_id: '', description: '' });

  async function load() {
    if (!company) return;
    const [{ data: r }, { data: d }] = await Promise.all([
      supabase.from('job_roles').select('*').eq('company_id', company.id).order('title'),
      supabase.from('departments').select('*').eq('company_id', company.id),
    ]);
    setRoles((r ?? []) as JobRole[]);
    setDepts((d ?? []) as Department[]);
    setLoading(false);
  }

  useEffect(() => { load(); }, [company]);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!company) return;
    await supabase.from('job_roles').insert({ company_id: company.id, title: form.title, department_id: form.department_id || null, description: form.description || null });
    setShowAdd(false); setForm({ title: '', department_id: '', description: '' });
    await load();
  }

  async function remove(id: string) {
    if (!confirm('Delete this role?')) return;
    await supabase.from('job_roles').delete().eq('id', id);
    await load();
  }

  const deptName = (id: string | null) => depts.find((d) => d.id === id)?.name ?? 'Unassigned';

  if (loading) return <div className="py-20 text-center text-slate-400">Loading…</div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Job Roles</h1>
          <p className="text-slate-500 text-sm mt-1">{roles.length} roles</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="btn-primary"><Plus size={18} /> Add role</button>
      </div>

      {roles.length === 0 ? (
        <div className="card"><EmptyState icon={Briefcase} title="No job roles" action={<button onClick={() => setShowAdd(true)} className="btn-primary"><Plus size={18} /> Add role</button>} /></div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {roles.map((r) => (
            <div key={r.id} className="card p-5 group">
              <div className="flex items-start justify-between">
                <div className="w-11 h-11 rounded-lg bg-teal-50 flex items-center justify-center">
                  <Briefcase size={22} className="text-teal-600" />
                </div>
                <button onClick={() => remove(r.id)} className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-500 transition"><Trash2 size={16} /></button>
              </div>
              <h3 className="font-semibold text-slate-900 mt-3">{r.title}</h3>
              <p className="text-xs text-slate-500 mt-1">{deptName(r.department_id)}</p>
              {r.description && <p className="text-sm text-slate-600 mt-2 line-clamp-2">{r.description}</p>}
            </div>
          ))}
        </div>
      )}

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add job role">
        <form onSubmit={add} className="space-y-4">
          <div>
            <label className="label">Title</label>
            <input className="input" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Senior Engineer" />
          </div>
          <div>
            <label className="label">Department</label>
            <select className="input" value={form.department_id} onChange={(e) => setForm({ ...form, department_id: e.target.value })}>
              <option value="">Unassigned</option>
              {depts.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Description</label>
            <textarea className="input" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div className="flex justify-end gap-3"><button type="button" onClick={() => setShowAdd(false)} className="btn-secondary">Cancel</button><button type="submit" className="btn-primary">Create</button></div>
        </form>
      </Modal>
    </div>
  );
}
