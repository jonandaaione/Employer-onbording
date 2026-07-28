import { useEffect, useState } from 'react';
import { GraduationCap, PlayCircle, BookOpen, CheckCircle2, Award, ChevronRight, X } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { Modal, EmptyState, ProgressBar } from '@/components/ui';
import type { TrainingCourse, TrainingLesson, TrainingProgress } from '@/lib/types';

export default function PortalTraining() {
  const { profile, company } = useAuth();
  const [courses, setCourses] = useState<TrainingCourse[]>([]);
  const [progress, setProgress] = useState<TrainingProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCourse, setActiveCourse] = useState<TrainingCourse | null>(null);
  const [lessons, setLessons] = useState<TrainingLesson[]>([]);
  const [activeLesson, setActiveLesson] = useState<TrainingLesson | null>(null);
  const [quizAnswer, setQuizAnswer] = useState<number | null>(null);
  const [quizResult, setQuizResult] = useState<'correct' | 'wrong' | null>(null);

  async function load() {
    if (!profile || !company) return;
    const [c, p] = await Promise.all([
      supabase.from('training_courses').select('*').eq('company_id', company.id),
      supabase.from('training_progress').select('*').eq('employee_id', profile.id),
    ]);
    setCourses((c.data ?? []) as TrainingCourse[]);
    setProgress((p.data ?? []) as TrainingProgress[]);
    setLoading(false);
  }

  useEffect(() => { load(); }, [profile, company]);

  async function openCourse(course: TrainingCourse) {
    const { data } = await supabase.from('training_lessons').select('*').eq('course_id', course.id).order('"order"');
    setLessons((data ?? []) as TrainingLesson[]);
    setActiveCourse(course);
  }

  async function submitQuiz() {
    if (!activeLesson || quizAnswer === null || !profile || !company || !activeCourse) return;
    const correct = quizAnswer === activeLesson.quiz_answer;
    setQuizResult(correct ? 'correct' : 'wrong');
    if (correct) {
      // Mark this lesson done; if all lessons have quizzes and all done, mark course complete
      const prog = progress.find(p => p.course_id === activeCourse.id);
      const allLessons = lessons;
      // Simple: mark course complete if this is the last lesson
      const isLast = activeLesson.order === allLessons.length - 1;
      if (isLast || allLessons.length === 1) {
        if (prog) {
          await supabase.from('training_progress').update({
            completed: true,
            quiz_score: 100,
            completed_at: new Date().toISOString(),
          }).eq('id', prog.id);
        } else {
          await supabase.from('training_progress').insert({
            company_id: company.id,
            employee_id: profile.id,
            course_id: activeCourse.id,
            completed: true,
            quiz_score: 100,
            completed_at: new Date().toISOString(),
          });
        }
        await load();
      }
    }
  }

  function nextLesson() {
    if (!activeLesson || !lessons.length) return;
    const next = lessons.find(l => l.order === activeLesson.order + 1);
    if (next) {
      setActiveLesson(next);
      setQuizAnswer(null);
      setQuizResult(null);
    } else {
      setActiveLesson(null);
      setActiveCourse(null);
    }
  }

  if (loading) return <div className="py-20 text-center text-slate-400">Loading…</div>;

  const completedCount = progress.filter(p => p.completed).length;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Training</h1>
        <p className="text-slate-500 text-sm mt-1">{completedCount} of {courses.length} courses completed</p>
      </div>

      {courses.length === 0 ? (
        <div className="card"><EmptyState icon={GraduationCap} title="No training assigned" /></div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {courses.map((c) => {
            const prog = progress.find(p => p.course_id === c.id);
            const done = prog?.completed;
            return (
              <div key={c.id} className="card p-5">
                <div className="flex items-start justify-between">
                  <div className="w-11 h-11 rounded-lg bg-teal-50 flex items-center justify-center">
                    {done ? <Award size={22} className="text-emerald-600" /> : <GraduationCap size={22} className="text-teal-600" />}
                  </div>
                  {done ? <span className="badge bg-emerald-100 text-emerald-700"><CheckCircle2 size={12} /> Completed</span> :
                    c.is_mandatory ? <span className="badge bg-red-50 text-red-600">Required</span> : null}
                </div>
                <h3 className="font-semibold text-slate-900 mt-3">{c.name}</h3>
                {c.description && <p className="text-sm text-slate-600 mt-1">{c.description}</p>}
                {done && prog?.quiz_score != null && (
                  <p className="text-xs text-emerald-600 mt-2 font-medium">Score: {prog.quiz_score}%</p>
                )}
                {!done && (
                  <button onClick={() => openCourse(c)} className="btn-primary w-full mt-4 text-sm">
                    <PlayCircle size={16} /> Start course
                  </button>
                )}
                {done && (
                  <button onClick={() => openCourse(c)} className="btn-secondary w-full mt-4 text-sm">
                    <BookOpen size={16} /> Review
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Course lessons modal */}
      <Modal open={!!activeCourse} onClose={() => { setActiveCourse(null); setActiveLesson(null); }} title={activeCourse?.name ?? ''} size="lg">
        {!activeLesson ? (
          <div className="space-y-2">
            <p className="text-sm text-slate-500 mb-4">{lessons.length} lessons in this course</p>
            {lessons.map((l) => (
              <button key={l.id} onClick={() => { setActiveLesson(l); setQuizAnswer(null); setQuizResult(null); }} className="flex items-center justify-between w-full p-3 rounded-lg border border-slate-200 hover:bg-slate-50 transition">
                <span className="flex items-center gap-3">
                  {l.video_url ? <PlayCircle size={18} className="text-blue-500" /> : <BookOpen size={18} className="text-slate-400" />}
                  <span className="text-sm font-medium text-slate-900">{l.title}</span>
                </span>
                <ChevronRight size={18} className="text-slate-400" />
              </button>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-slate-900">{activeLesson.title}</h3>
              <button onClick={() => setActiveLesson(null)} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
            </div>

            {/* Video placeholder */}
            <div className="aspect-video rounded-lg bg-slate-900 flex items-center justify-center">
              {activeLesson.video_url ? (
                <video src={activeLesson.video_url} controls className="w-full h-full rounded-lg" />
              ) : (
                <div className="text-center text-white/70">
                  <PlayCircle size={48} className="mx-auto" />
                  <p className="text-sm mt-2">Video lesson</p>
                </div>
              )}
            </div>

            {/* Quiz */}
            {activeLesson.quiz_q && (
              <div className="p-4 rounded-lg border border-slate-200">
                <p className="font-medium text-slate-900 mb-3">{activeLesson.quiz_q}</p>
                <div className="space-y-2">
                  {activeLesson.quiz_options?.map((opt, i) => (
                    <button
                      key={i}
                      onClick={() => setQuizAnswer(i)}
                      disabled={quizResult !== null}
                      className={`flex items-center gap-3 w-full p-3 rounded-lg border text-sm text-left transition ${
                        quizAnswer === i
                          ? quizResult === 'correct' && i === activeLesson.quiz_answer
                            ? 'border-emerald-500 bg-emerald-50'
                            : quizResult === 'wrong' && i === activeLesson.quiz_answer
                            ? 'border-emerald-500 bg-emerald-50'
                            : quizResult === 'wrong' && i === quizAnswer
                            ? 'border-red-500 bg-red-50'
                            : 'border-blue-500 bg-blue-50'
                          : 'border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <span className="w-6 h-6 rounded-full border-2 border-slate-300 flex items-center justify-center text-xs font-medium">
                        {String.fromCharCode(65 + i)}
                      </span>
                      {opt}
                      {quizResult && i === activeLesson.quiz_answer && <CheckCircle2 size={16} className="text-emerald-500 ml-auto" />}
                    </button>
                  ))}
                </div>
                {quizResult === 'wrong' && <p className="text-sm text-red-600 mt-2">Incorrect. Try again or review the lesson.</p>}
                {quizResult === 'correct' && <p className="text-sm text-emerald-600 mt-2">Correct! Well done.</p>}
                <div className="flex gap-2 mt-4">
                  {!quizResult ? (
                    <button onClick={submitQuiz} disabled={quizAnswer === null} className="btn-primary text-sm">Submit answer</button>
                  ) : (
                    <button onClick={nextLesson} className="btn-primary text-sm">Next lesson <ChevronRight size={16} /></button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
