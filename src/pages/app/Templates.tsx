import { useEffect, useState } from 'react';
import { ClipboardList, Plus, Trash2, CheckCircle2, Layers } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { Modal, EmptyState } from '@/components/ui';
import type { OnboardingTemplate, TemplateTask } from '@/lib/types';

export default function Templates() {
  const { company, profile } = useAuth();
  const [templates, setTemplates] = useState<OnboardingTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: '', employment_type: 'full-time', tasks: [{ task_name: '', dept_responsible: 'employee', deadline_days: 3 }] });

  async function load() {
    if (!company) return;
    const { data } = await supabase.from('onboarding_templates').select('*').eq('company_id', company.id).order('created_at', { ascending: false });
    setTemplates((data ?? []) as OnboardingTemplate[]);
    setLoading(false);
  }

  useEffect(() => { load(); }, [company]);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!company || !profile) return;
    const { data: tmpl } = await supabase.from('onboarding_templates').insert({
      company_id: company.id, name: form.name, employment_type: form.employment_type, is_active: true, created_by: profile.id,
    }).select().single();
    if (tmpl && form.tasks.filter(t => t.task_name).length) {
      await supabase.from('template_tasks').insert(
        form.tasks.filter(t => t.task_name).map(t => ({ template_id: tmpl.id, task_name: t.task_name, dept_responsible: t.dept_responsible, deadline_days: t.deadline_days, priority: 'medium' }))
      );
    }
    setShowAdd(false); setForm({ name: '', employment_type: 'full-time', tasks: [{ task_name: '', dept_responsible: 'employee', deadline_days: 3 }] });
    await load();
  }

  async function remove(id: string) {
    if (!confirm('Delete this template?')) return;
    await supabase.from('onboarding_templates').delete().eq('id', id);
    await load();
  }

  if (loading) return <div className="py-20 text-center text-slate-400">Loading…</div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Onboarding Templates</h1>
          <p className="text-slate-500 text-sm mt-1">{templates.length} templates</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="btn-primary"><Plus size={18} /> New template</button>
      </div>

      {templates.length === 0 ? (
        <div className="card"><EmptyState icon={ClipboardList} title="No templates" description="Templates auto-create tasks when you add employees." action={<button onClick={() => setShowAdd(true)} className="btn-primary"><Plus size={18} /> New template</button>} /></div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((t) => (
            <TemplateCard key={t.id} template={t} onDelete={() => remove(t.id)} />
          ))}
        </div>
      )}

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Create onboarding template" size="lg">
        <form onSubmit={add} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Template name</label>
              <input className="input" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Engineering Onboarding" />
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
            <label className="label">Tasks</label>
            <div className="space-y-2">
              {form.tasks.map((task, i) => (
                <div key={i} className="grid grid-cols-12 gap-2">
                  <input className="input col-span-6" placeholder="Task name" value={task.task_name} onChange={(e) => { const t = [...form.tasks]; t[i].task_name = e.target.value; setForm({ ...form, tasks: t }); }} />
                  <select className="input col-span-3" value={task.dept_responsible} onChange={(e) => { const t = [...form.tasks]; t[i].dept_responsible = e.target.value; setForm({ ...form, tasks: t }); }}>
                    <option value="employee">Employee</option><option value="hr">HR</option><option value="it">IT</option><option value="manager">Manager</option>
                  </select>
                  <input type="number" className="input col-span-2" placeholder="Days" value={task.deadline_days} onChange={(e) => { const t = [...form.tasks]; t[i].deadline_days = +e.target.value; setForm({ ...form, tasks: t }); }} />
                  <button type="button" onClick={() => setForm({ ...form, tasks: form.tasks.filter((_, j) => j !== i) })} className="col-span-1 text-slate-400 hover:text-red-500"><Trash2 size={16} /></button>
                </div>
              ))}
            </div>
            <button type="button" onClick={() => setForm({ ...form, tasks: [...form.tasks, { task_name: '', dept_responsible: 'employee', deadline_days: 3 }] })} className="btn-ghost text-sm mt-2"><Plus size={14} /> Add task</button>
          </div>
          <div className="flex justify-end gap-3"><button type="button" onClick={() => setShowAdd(false)} className="btn-secondary">Cancel</button><button type="submit" className="btn-primary">Create template</button></div>
        </form>
      </Modal>
    </div>
  );
}

function TemplateCard({ template, onDelete }: { template: OnboardingTemplate; onDelete: () => void }) {
  const [tasks, setTasks] = useState<TemplateTask[]>([]);
  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('template_tasks').select('*').eq('template_id', template.id);
      setTasks((data ?? []) as TemplateTask[]);
    })();
  }, [template.id]);

  return (
    <div className="card p-5 group">
      <div className="flex items-start justify-between">
        <div className="w-11 h-11 rounded-lg bg-purple-50 flex items-center justify-center">
          <Layers size={22} className="text-purple-600" />
        </div>
        <button onClick={onDelete} className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-500 transition"><Trash2 size={16} /></button>
      </div>
      <h3 className="font-semibold text-slate-900 mt-3">{template.name}</h3>
      <p className="text-xs text-slate-500 mt-1 capitalize">{template.employment_type.replace('-', ' ')} · {tasks.length} tasks</p>
      <div className="mt-3 space-y-1">
        {tasks.slice(0, 4).map((t) => (
          <div key={t.id} className="flex items-center gap-2 text-xs text-slate-600">
            <CheckCircle2 size={12} className="text-slate-300" /> {t.task_name}
          </div>
        ))}
        {tasks.length > 4 && <p className="text-xs text-slate-400">+ {tasks.length - 4} more</p>}
      </div>
    </div>
  );
}
