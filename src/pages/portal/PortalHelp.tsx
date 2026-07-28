import { LifeBuoy, Mail, MessageCircle, Phone, BookOpen, ChevronDown } from 'lucide-react';
import { useState } from 'react';

const faqs = [
  { q: 'How do I upload my documents?', a: 'Go to the Documents page, click Upload on the required document card, and paste a link to your file. HR will review and approve it.' },
  { q: 'How do I sign my employment contract?', a: 'Visit the Agreements page, click Sign on any pending agreement, draw your signature on the pad, and confirm.' },
  { q: 'When do I get my laptop and email?', a: 'IT requests are auto-created when you are added. Your IT department will provision your laptop, email, and software. Check the status on your dashboard.' },
  { q: 'How do I complete training?', a: 'Go to the Training page, open a course, watch each lesson video, and answer the quiz at the end. Complete all lessons to finish the course.' },
  { q: 'What happens on Day 1?', a: 'Your HR admin confirms a Day 1 readiness checklist (documents, contract, laptop, email, manager, orientation, payroll). Once all are checked, you are ready to start.' },
  { q: 'Who is my manager?', a: 'Your manager is shown on your dashboard. You can also find this information on your profile page.' },
];

export default function PortalHelp() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Help Center</h1>
        <p className="text-slate-500 text-sm mt-1">Answers to common onboarding questions</p>
      </div>

      <div className="card p-6">
        <h3 className="font-semibold text-slate-900 mb-4">Contact support</h3>
        <div className="grid sm:grid-cols-3 gap-3">
          <a href="mailto:support@smarthire.app" className="flex flex-col items-center p-4 rounded-lg border border-slate-200 hover:bg-slate-50 transition">
            <Mail size={24} className="text-blue-600" />
            <p className="text-sm font-medium text-slate-900 mt-2">Email</p>
            <p className="text-xs text-slate-500">support@smarthire.app</p>
          </a>
          <div className="flex flex-col items-center p-4 rounded-lg border border-slate-200">
            <MessageCircle size={24} className="text-teal-600" />
            <p className="text-sm font-medium text-slate-900 mt-2">In-app chat</p>
            <p className="text-xs text-slate-500">Coming soon</p>
          </div>
          <div className="flex flex-col items-center p-4 rounded-lg border border-slate-200">
            <Phone size={24} className="text-amber-600" />
            <p className="text-sm font-medium text-slate-900 mt-2">Phone</p>
            <p className="text-xs text-slate-500">Mon–Fri, 9–5</p>
          </div>
        </div>
      </div>

      <div>
        <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2"><BookOpen size={18} /> Frequently asked questions</h3>
        <div className="space-y-2">
          {faqs.map((f, i) => (
            <div key={i} className="card overflow-hidden">
              <button onClick={() => setOpen(open === i ? null : i)} className="flex items-center justify-between w-full p-4 text-left">
                <span className="text-sm font-medium text-slate-900">{f.q}</span>
                <ChevronDown size={18} className={`text-slate-400 transition ${open === i ? 'rotate-180' : ''}`} />
              </button>
              {open === i && <div className="px-4 pb-4 text-sm text-slate-600">{f.a}</div>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
