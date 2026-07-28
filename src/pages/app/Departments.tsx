import { useEffect, useState } from 'react';
import { Building2, Plus, Trash2, Users } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { Modal, EmptyState } from '@/components/ui';
import type { Department, Profile } from '@/lib/types';

export default function Departments() {
  const { company } = useAuth();
  const [depts, setDepts] = useState<Department[]>([]);
  const [employees, setEmployees] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState('');
  const [managerId, setManagerId] = useState('');

  async function load() {
    if (!company) return;
    const [{ data: d }, { data: e }] = await Promise.all([
      supabase.from('departments').select('*').eq('company_id', company.id).order('name'),
      supabase.from('profiles').select('*').eq('company_id', company.id),
    ]);
    setDepts((d ?? []) as Department[]);
    setEmployees((e ?? []) as Profile[]);
    setLoading(false);
  }

  useEffect(() => { load(); }, [company]);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!company) return;
    await supabase.from('departments').insert({ company_id: company.id, name, manager_id: managerId || null });
    setShowAdd(false); setName(''); setManagerId('');
    await load();
  }

  async function remove(id: string) {
    if (!confirm('Delete this department?')) return;
    await supabase.from('departments').delete().eq('id', id);
    await load();
  }

  const mgrName = (id: string | null) => employees.find((e) => e.id === id)?.name ?? '—';
  const count = (id: string) => employees.filter((e) => e.department_id === id).length;

  if (loading) return <div className="py-20 text-center text-slate-400">Loading…</div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Departments</h1>
          <p className="text-slate-500 text-sm mt-1">{depts.length} departments</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="btn-primary"><Plus size={18} /> Add department</button>
      </div>

      {depts.length === 0 ? (
        <div className="card"><EmptyState icon={Building2} title="No departments" action={<button onClick={() => setShowAdd(true)} className="btn-primary"><Plus size={18} /> Add department</button>} /></div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {depts.map((d) => (
            <div key={d.id} className="card p-5 group">
              <div className="flex items-start justify-between">
                <div className="w-11 h-11 rounded-lg bg-blue-50 flex items-center justify-center">
                  <Building2 size={22} className="text-blue-600" />
                </div>
                <button onClick={() => remove(d.id)} className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-500 transition"><Trash2 size={16} /></button>
              </div>
              <h3 className="font-semibold text-slate-900 mt-3">{d.name}</h3>
              <div className="flex items-center justify-between mt-3 text-sm">
                <span className="text-slate-500">Manager: <span className="text-slate-900 font-medium">{mgrName(d.manager_id)}</span></span>
              </div>
              <div className="flex items-center gap-1.5 text-sm text-slate-500 mt-1">
                <Users size={14} /> {count(d.id)} members
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add department">
        <form onSubmit={add} className="space-y-4">
          <div>
            <label className="label">Department name</label>
            <input className="input" required value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Marketing" />
          </div>
          <div>
            <label className="label">Manager (optional)</label>
            <select className="input" value={managerId} onChange={(e) => setManagerId(e.target.value)}>
              <option value="">No manager</option>
              {employees.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
            </select>
          </div>
          <div className="flex justify-end gap-3"><button type="button" onClick={() => setShowAdd(false)} className="btn-secondary">Cancel</button><button type="submit" className="btn-primary">Create</button></div>
        </form>
      </Modal>
    </div>
  );
}
