import { Link } from 'react-router-dom';
import {
  CheckCircle2,
  FileText,
  Users,
  ClipboardCheck,
  GraduationCap,
  ShieldCheck,
  Bell,
  BarChart3,
  ArrowRight,
  Calendar,
  PenTool,
  Star,
  Building2,
  TrendingUp,
} from 'lucide-react';
import { Logo, LogoMark } from '@/components/Logo';

export default function Landing() {
  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/">
            <Logo size={36} />
          </Link>
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
            <a href="#features" className="hover:text-slate-900 transition">Features</a>
            <a href="#workflow" className="hover:text-slate-900 transition">Workflow</a>
            <a href="#pricing" className="hover:text-slate-900 transition">Pricing</a>
          </nav>
          <div className="flex items-center gap-3">
            <Link to="/signin" className="btn-ghost text-sm">Sign in</Link>
            <Link to="/signup" className="btn-primary text-sm">Get started</Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-blue-50/60 to-white" />
        <div className="absolute top-20 -right-20 w-96 h-96 bg-blue-200/30 rounded-full blur-3xl" />
        <div className="absolute top-40 -left-20 w-80 h-80 bg-teal-200/20 rounded-full blur-3xl" />
        <div className="relative max-w-7xl mx-auto px-6 pt-20 pb-24">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-sm font-medium mb-6">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
              Employee onboarding, reimagined
            </div>
            <h1 className="text-5xl md:text-6xl font-extrabold text-slate-900 leading-[1.05] tracking-tight">
              Get every new hire, <span className="text-blue-600">every time</span>
            </h1>
            <p className="text-lg text-slate-600 mt-6 max-w-2xl leading-relaxed">
              SmartHire brings employee documents, e-signatures, training, IT setup, and onboarding
              tasks into one simple portal. Track every new hire's progress and make sure nothing
              is missed before their first day.
            </p>
            <div className="flex flex-wrap items-center gap-4 mt-8">
              <Link to="/signup" className="btn-primary text-base px-6 py-3">
                Start Free
                <ArrowRight size={18} />
              </Link>
              <a href="#features" className="btn-secondary text-base px-6 py-3">See how it works</a>
            </div>
            <div className="flex items-center gap-6 mt-8 text-sm text-slate-500">
              <span className="flex items-center gap-1.5"><CheckCircle2 size={16} className="text-emerald-500" /> No credit card</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 size={16} className="text-emerald-500" /> Setup in minutes</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 size={16} className="text-emerald-500" /> SOC 2 ready</span>
            </div>
          </div>
        </div>
      </section>

      {/* Stats band */}
      <section className="border-y border-slate-100 bg-slate-50/50">
        <div className="max-w-7xl mx-auto px-6 py-12 grid grid-cols-2 md:grid-cols-4 gap-8">
          {[
            { value: '60%', label: 'Faster onboarding' },
            { value: '95%', label: 'Day 1 readiness' },
            { value: '<24h', label: 'Document processing' },
            { value: '4.5+', label: 'Employee satisfaction' },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <p className="text-3xl font-bold text-slate-900">{s.value}</p>
              <p className="text-sm text-slate-500 mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="max-w-7xl mx-auto px-6 py-24">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900">Everything onboarding needs, in one place</h2>
          <p className="text-slate-600 mt-4">Replace spreadsheets, email chains, and scattered tools with a single, auditable workflow.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { icon: Users, title: 'Employee invitations', desc: 'HR sends secure invite links. New hires self-register, upload a photo, and fill personal details.' },
            { icon: FileText, title: 'Document vault', desc: 'Upload CNIC, certificates, bank and tax info. HR reviews with Pending, Under Review, Approved, or Resubmit.' },
            { icon: PenTool, title: 'E-signatures', desc: 'Sign contracts, NDAs, and policies on a canvas pad. Every signature records timestamp, IP, and device.' },
            { icon: ClipboardCheck, title: 'Task automation', desc: 'Tasks auto-create for HR, IT, managers, and employees. Track due dates and overdue items.' },
            { icon: GraduationCap, title: 'Training library', desc: 'Assign welcome videos, role training, and quizzes. Issue certificates on completion.' },
            { icon: ShieldCheck, title: 'Day 1 readiness', desc: 'A single card checks docs, contract, laptop, email, manager, orientation, and payroll.' },
            { icon: Bell, title: 'Notifications', desc: 'In-app alerts for invites, uploads, rejections, task assignments, and overdue items.' },
            { icon: BarChart3, title: 'Analytics & reports', desc: 'Completion rates, department progress, time-to-productivity, and audit logs.' },
            { icon: Calendar, title: '30/60/90 reviews', desc: 'Structured check-ins with surveys, feedback, goal progress, and satisfaction scores.' },
          ].map((f) => (
            <div key={f.title} className="card p-6 hover:shadow-md hover:border-slate-300 transition group">
              <div className="w-11 h-11 rounded-lg bg-blue-50 flex items-center justify-center mb-4 group-hover:bg-blue-600 group-hover:text-white transition">
                <f.icon size={22} className="text-blue-600 group-hover:text-white transition" />
              </div>
              <h3 className="font-semibold text-slate-900">{f.title}</h3>
              <p className="text-sm text-slate-600 mt-2 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Workflow */}
      <section id="workflow" className="bg-slate-900 text-white py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold">From invite to Day 1, in 8 steps</h2>
            <p className="text-slate-400 mt-4">A guided journey for HR, IT, managers, and the new employee.</p>
          </div>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { n: 1, t: 'HR creates employee', d: 'Name, email, job, department, joining date, and template.' },
              { n: 2, t: 'Employee registers', d: 'Sets password, verifies email, uploads photo and details.' },
              { n: 3, t: 'Documents uploaded', d: 'CNIC, certificates, bank and tax info — reviewed by HR.' },
              { n: 4, t: 'Agreements signed', d: 'Contract, NDA, policies — with full audit trail.' },
              { n: 5, t: 'Tasks auto-created', d: 'HR, IT, manager, and employee tasks with due dates.' },
              { n: 6, t: 'Training completed', d: 'Welcome video, role training, safety, and quizzes.' },
              { n: 7, t: 'Day 1 readiness', d: 'One card confirms everything is ready for the first day.' },
              { n: 8, t: '30/60/90 reviews', d: 'Check-ins, feedback, surveys, and completion certificates.' },
            ].map((s) => (
              <div key={s.n} className="relative">
                <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center font-bold mb-4">{s.n}</div>
                <h3 className="font-semibold text-white">{s.t}</h3>
                <p className="text-sm text-slate-400 mt-1.5 leading-relaxed">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="max-w-7xl mx-auto px-6 py-24">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900">Simple, transparent pricing</h2>
          <p className="text-slate-600 mt-4">Start free. Upgrade when your team grows.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {[
            { name: 'Starter', price: '$0', period: 'forever', features: ['Up to 10 employees', 'Document upload', 'Task management', 'Basic analytics'], cta: 'Get started', highlight: false },
            { name: 'Growth', price: '$49', period: '/mo', features: ['Up to 100 employees', 'E-signatures', 'Training library', 'Templates builder', 'IT requests', 'Advanced analytics'], cta: 'Start free trial', highlight: true },
            { name: 'Enterprise', price: 'Custom', period: '', features: ['Unlimited employees', 'Custom roles', 'Audit logs', 'SSO & SAML', 'Priority support', 'SLA 99.9%'], cta: 'Contact sales', highlight: false },
          ].map((p) => (
            <div
              key={p.name}
              className={`card p-8 relative ${p.highlight ? 'border-blue-600 border-2 shadow-lg shadow-blue-600/10' : ''}`}
            >
              {p.highlight && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-blue-600 text-white text-xs font-semibold">
                  Most popular
                </span>
              )}
              <h3 className="font-semibold text-slate-900 text-lg">{p.name}</h3>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="text-4xl font-bold text-slate-900">{p.price}</span>
                <span className="text-slate-500">{p.period}</span>
              </div>
              <ul className="mt-6 space-y-3">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-slate-600">
                    <CheckCircle2 size={18} className="text-emerald-500 mt-0.5 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                to="/signup"
                className={`mt-8 w-full ${p.highlight ? 'btn-primary' : 'btn-secondary'}`}
              >
                {p.cta}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-slate-50 border-y border-slate-100 py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900">Loved by HR teams everywhere</h2>
            <p className="text-slate-600 mt-4">See what companies are saying about SmartHire.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { quote: "SmartHire cut our onboarding time by 60%. New hires are productive from Day 1.", name: "Sarah Chen", role: "VP People, TechFlow", avatar: "https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=120" },
              { quote: "The e-signature and document vault alone saved my team 3 hours per employee.", name: "Marcus Johnson", role: "HR Director, Globex", avatar: "https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=120" },
              { quote: "Day 1 readiness went from 70% to 96%. The checklist is a game changer.", name: "Priya Patel", role: "Head of HR, Initech", avatar: "https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=120" },
            ].map((t) => (
              <div key={t.name} className="card p-6">
                <div className="flex gap-0.5 mb-4">
                  {[...Array(5)].map((_, i) => <Star key={i} size={16} className="text-amber-400 fill-amber-400" />)}
                </div>
                <p className="text-sm text-slate-700 leading-relaxed">"{t.quote}"</p>
                <div className="flex items-center gap-3 mt-5">
                  <img src={t.avatar} alt={t.name} className="w-10 h-10 rounded-full object-cover" />
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{t.name}</p>
                    <p className="text-xs text-slate-500">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-7xl mx-auto px-6 py-24">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 to-blue-800 px-8 py-16 text-center">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
          <h2 className="relative text-3xl md:text-4xl font-bold text-white">Ready to onboard your next hire?</h2>
          <p className="relative text-blue-100 mt-4 max-w-xl mx-auto">Join companies transforming their onboarding with SmartHire.</p>
          <Link to="/signup" className="relative inline-flex mt-8 bg-white text-blue-700 font-semibold px-6 py-3 rounded-lg hover:bg-blue-50 transition">
            Get started free
            <ArrowRight size={18} className="ml-1" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-100 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6 py-12 flex flex-col md:flex-row items-center justify-between gap-4">
          <Logo size={32} />
          <div className="flex items-center gap-6 text-sm text-slate-500">
            <span>by Jonanda Company</span>
            <span>© 2026 SmartHire. All rights reserved.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
