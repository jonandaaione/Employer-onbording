import { useEffect, useState } from 'react';
import { GraduationCap, Plus, Trash2, PlayCircle, BookOpen } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { Modal, EmptyState } from '@/components/ui';
import type { TrainingCourse, TrainingLesson } from '@/lib/types';

export default function Training() {
  const { company } = useAuth();
  const [courses, setCourses] = useState<TrainingCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', is_mandatory: true });

  async function load() {
    if (!company) return;
    const { data } = await supabase.from('training_courses').select('*').eq('company_id', company.id).order('created_at', { ascending: false });
    setCourses((data ?? []) as TrainingCourse[]);
    setLoading(false);
  }

  useEffect(() => { load(); }, [company]);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!company) return;
    await supabase.from('training_courses').insert({ company_id: company.id, name: form.name, description: form.description, is_mandatory: form.is_mandatory });
    setShowAdd(false); setForm({ name: '', description: '', is_mandatory: true });
    await load();
  }

  async function remove(id: string) {
    if (!confirm('Delete this course and its lessons?')) return;
    await supabase.from('training_courses').delete().eq('id', id);
    await load();
  }

  if (loading) return <div className="py-20 text-center text-slate-400">Loading…</div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Training Library</h1>
          <p className="text-slate-500 text-sm mt-1">{courses.length} courses</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="btn-primary"><Plus size={18} /> Add course</button>
      </div>

      {courses.length === 0 ? (
        <div className="card"><EmptyState icon={GraduationCap} title="No courses" action={<button onClick={() => setShowAdd(true)} className="btn-primary"><Plus size={18} /> Add course</button>} /></div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {courses.map((c) => <CourseCard key={c.id} course={c} onDelete={() => remove(c.id)} />)}
        </div>
      )}

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add training course">
        <form onSubmit={add} className="space-y-4">
          <div>
            <label className="label">Course name</label>
            <input className="input" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Security Awareness" />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea className="input" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" checked={form.is_mandatory} onChange={(e) => setForm({ ...form, is_mandatory: e.target.checked })} className="rounded" />
            Mandatory for all employees
          </label>
          <div className="flex justify-end gap-3"><button type="button" onClick={() => setShowAdd(false)} className="btn-secondary">Cancel</button><button type="submit" className="btn-primary">Create</button></div>
        </form>
      </Modal>
    </div>
  );
}

function CourseCard({ course, onDelete }: { course: TrainingCourse; onDelete: () => void }) {
  const [lessons, setLessons] = useState<TrainingLesson[]>([]);
  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('training_lessons').select('*').eq('course_id', course.id).order('"order"');
      setLessons((data ?? []) as TrainingLesson[]);
    })();
  }, [course.id]);

  return (
    <div className="card p-5 group">
      <div className="flex items-start justify-between">
        <div className="w-11 h-11 rounded-lg bg-teal-50 flex items-center justify-center">
          <GraduationCap size={22} className="text-teal-600" />
        </div>
        <button onClick={onDelete} className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-500 transition"><Trash2 size={16} /></button>
      </div>
      <h3 className="font-semibold text-slate-900 mt-3">{course.name}</h3>
      <p className="text-xs text-slate-500 mt-1">{course.is_mandatory ? 'Mandatory' : 'Optional'} · {lessons.length} lessons</p>
      {course.description && <p className="text-sm text-slate-600 mt-2 line-clamp-2">{course.description}</p>}
      <div className="mt-3 space-y-1">
        {lessons.map((l) => (
          <div key={l.id} className="flex items-center gap-2 text-xs text-slate-600">
            {l.video_url ? <PlayCircle size={12} className="text-blue-500" /> : <BookOpen size={12} className="text-slate-400" />}
            {l.title}
          </div>
        ))}
      </div>
    </div>
  );
}
