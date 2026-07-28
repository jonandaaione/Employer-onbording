import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, Plus, Search, Mail, Briefcase, Building2, Calendar, ArrowRight, Trash2 } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { provisionEmployee, logAudit } from '@/lib/seed';
import { Avatar, StatusBadge, RoleBadge, ProgressBar, Modal, EmptyState } from '@/components/ui';
import type { Profile, Department, OnboardingTemplate } from '@/lib/types';

export default function Employees() {
  const { profile, company } = useAuth();
  const [employees, setEmployees] = useState<Profile[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [templates, setTemplates] = useState<OnboardingTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: '',
    job_title: '',
    department_id: '',
    joining_date: '',
    employment_type: 'full-time',
    template_id: '',
  });
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    if (!company) return;
    const [{ data: emps }, { data: depts }, { data: tmpls }] = await Promise.all([
      supabase.from('profiles').select('*').eq('company_id', company.id).neq('role', 'hr_admin').order('created_at', { ascending: false }),
      supabase.from('departments').select('*').eq('company_id', company.id),
      supabase.from('onboarding_templates').select('*').eq('company_id', company.id).eq('is_active', true),
    ]);
    setEmployees((emps ?? []) as Profile[]);
    setDepartments((depts ?? []) as Department[]);
    setTemplates((tmpls ?? []) as OnboardingTemplate[]);
    setLoading(false);
  }

  useEffect(() => { load(); }, [company]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!company || !profile) return;
    setAdding(true);
    setError(null);

    try {
      // Create a profile record in "invited" status. The employee will sign up
      // with the same email; the auth trigger / our matching logic links them.
      // We create a placeholder profile without user_id — but user_id is NOT NULL.
      // Instead, we use the HR admin's user_id as a placeholder and mark status=invited.
      // When the employee signs up with this email, we update the profile's user_id.
      // For simplicity in this MVP, we create the profile with a generated UUID placeholder.
      const placeholderId = crypto.randomUUID();

      const { data: newProf, error: insErr } = await supabase
        .from('profiles')
        .insert({
          user_id: placeholderId,
          company_id: company.id,
          role: 'employee',
          name: form.name,
          email: form.email,
          job_title: form.job_title || null,
          department_id: form.department_id || null,
          joining_date: form.joining_date || null,
          employment_type: form.employment_type,
          status: 'invited',
          onboarding_progress: 0,
        })
        .select()
        .single();

      if (insErr) throw new Error(insErr.message);

      await provisionEmployee(company.id, newProf.id, form.template_id || null);
      await logAudit(company.id, profile.user_id, 'invite_employee', 'profiles', `Invited ${form.name} (${form.email})`);

      // Send notification to HR
      await supabase.from('notifications').insert({
        company_id: company.id,
        user_id: profile.user_id,
        type: 'invite_sent',
        message: `Invitation sent to ${form.name} (${form.email})`,
      });

      setShowAdd(false);
      setForm({ name: '', email: '', job_title: '', department_id: '', joining_date: '', employment_type: 'full-time', template_id: '' });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add employee');
    } finally {
      setAdding(false);
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!company || !profile) return;
    if (!confirm(`Remove ${name}? This deletes their onboarding data.`)) return;
    await supabase.from('profiles').delete().eq('id', id);
    await logAudit(company.id, profile.user_id, 'remove_employee', 'profiles', `Removed ${name}`);
    await load();
  }

  const filtered = employees.filter(
    (e) =>
      e.name.toLowerCase().includes(search.toLowerCase()) ||
      e.email.toLowerCase().includes(search.toLowerCase()) ||
      (e.job_title ?? '').toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="py-20 text-center text-slate-400">Loading employees…</div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Employees</h1>
          <p className="text-slate-500 text-sm mt-1">{employees.length} total · {employees.filter(e => e.status === 'invited').length} invited</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="btn-primary">
          <Plus size={18} /> Add employee
        </button>
      </div>

      <div className="relative max-w-md">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          className="input pl-10"
          placeholder="Search by name, email, or role…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {filtered.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={Users}
            title="No employees yet"
            description="Invite your first employee to start the onboarding process."
            action={<button onClick={() => setShowAdd(true)} className="btn-primary"><Plus size={18} /> Add employee</button>}
          />
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <th className="px-6 py-3">Employee</th>
                <th className="px-6 py-3">Role / Title</th>
                <th className="px-6 py-3">Department</th>
                <th className="px-6 py-3">Joining</th>
                <th className="px-6 py-3">Progress</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((e) => {
                const dept = departments.find((d) => d.id === e.department_id);
                return (
                  <tr key={e.id} className="hover:bg-slate-50 transition">
                    <td className="px-6 py-4">
                      <Link to={`/app/employees/${e.id}`} className="flex items-center gap-3">
                        <Avatar name={e.name} photoUrl={e.photo_url} size={38} />
                        <div>
                          <p className="text-sm font-medium text-slate-900 hover:text-blue-600">{e.name}</p>
                          <p className="text-xs text-slate-500">{e.email}</p>
                        </div>
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">{e.job_title ?? '—'}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{dept?.name ?? '—'}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {e.joining_date ? new Date(e.joining_date).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 w-28">
                        <ProgressBar value={e.onboarding_progress ?? 0} />
                        <span className="text-xs font-medium text-slate-600 w-8">{e.onboarding_progress ?? 0}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4"><StatusBadge status={e.status} /></td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1">
                        <Link to={`/app/employees/${e.id}`} className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-blue-600">
                          <ArrowRight size={16} />
                        </Link>
                        <button onClick={() => handleDelete(e.id, e.name)} className="p-2 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Add employee modal */}
      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Invite new employee" size="lg">
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">{error}</div>
        )}
        <form onSubmit={handleAdd} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Full name</label>
              <input className="input" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="John Doe" />
            </div>
            <div>
              <label className="label">Email</label>
              <input type="email" className="input" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="john@company.com" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Job title</label>
              <input className="input" value={form.job_title} onChange={(e) => setForm({ ...form, job_title: e.target.value })} placeholder="Software Engineer" />
            </div>
            <div>
              <label className="label">Department</label>
              <select className="input" value={form.department_id} onChange={(e) => setForm({ ...form, department_id: e.target.value })}>
                <option value="">Unassigned</option>
                {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Joining date</label>
              <input type="date" className="input" value={form.joining_date} onChange={(e) => setForm({ ...form, joining_date: e.target.value })} />
            </div>
            <div>
              <label className="label">Employment type</label>
              <select className="input" value={form.employment_type} onChange={(e) => setForm({ ...form, employment_type: e.target.value })}>
                <option value="full-time">Full-time</option>
                <option value="part-time">Part-time</option>
                <option value="contract">Contract</option>
                <option value="intern">Intern</option>
              </select>
            </div>
          </div>
          <div>
            <label className="label">Onboarding template</label>
            <select className="input" value={form.template_id} onChange={(e) => setForm({ ...form, template_id: e.target.value })}>
              <option value="">Default tasks</option>
              {templates.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
            <p className="text-xs text-slate-400 mt-1">Tasks will be auto-created from the selected template.</p>
          </div>
          <div className="flex items-center gap-2 p-3 rounded-lg bg-blue-50 border border-blue-100 text-sm text-blue-700">
            <Mail size={16} />
            A secure invitation will be created. The employee can sign up with this email to begin onboarding.
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setShowAdd(false)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary" disabled={adding}>
              {adding ? 'Sending invite…' : 'Send invitation'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
