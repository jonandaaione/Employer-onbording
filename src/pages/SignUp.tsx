import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, AlertCircle } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { Logo, LogoMark, GoogleIcon } from '@/components/Logo';

export default function SignUp() {
  const { signUp, signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    companyName: '',
    companyEmail: '',
    name: '',
    email: '',
    password: '',
    plan: 'starter',
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error } = await signUp(form);
    setLoading(false);
    if (error) setError(error);
    else navigate('/app/dashboard');
  }

  async function handleGoogle() {
    setError(null);
    setGoogleLoading(true);
    const { error } = await signInWithGoogle();
    if (error) {
      setError(error);
      setGoogleLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left brand panel */}
      <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-blue-600 to-blue-800 relative overflow-hidden flex-col justify-between p-12 text-white">
        <div className="absolute top-20 -right-20 w-80 h-80 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute bottom-10 -left-10 w-72 h-72 bg-teal-400/10 rounded-full blur-3xl" />
        <Link to="/" className="relative">
          <Logo size={40} textClassName="text-white" />
        </Link>
        <div className="relative">
          <h2 className="text-3xl font-bold leading-tight">Onboard your team the modern way.</h2>
          <p className="text-blue-100 mt-4 max-w-md">
            Create your company workspace and start inviting employees in minutes. Documents,
            e-signatures, training, and Day 1 readiness — all in one place.
          </p>
          <ul className="mt-8 space-y-3 text-blue-50">
            {['Secure multi-tenant isolation', 'Role-based access control', 'Audit-ready from day one'].map((t) => (
              <li key={t} className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-white" />
                {t}
              </li>
            ))}
          </ul>
        </div>
        <p className="relative text-sm text-blue-200">© 2026 SmartHire by Jonanda Company</p>
      </div>

      {/* Right form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 bg-slate-50">
        <div className="w-full max-w-md">
          <Link to="/" className="lg:hidden flex justify-center mb-8">
            <Logo size={40} />
          </Link>
          <h1 className="text-2xl font-bold text-slate-900">Create your workspace</h1>
          <p className="text-slate-500 mt-1 text-sm">Sign up as an HR admin to manage onboarding.</p>

          {error && (
            <div className="mt-5 flex items-start gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
              <AlertCircle size={18} className="shrink-0 mt-0.5" />
              {error}
            </div>
          )}

          <button
            onClick={handleGoogle}
            disabled={googleLoading || loading}
            className="btn-secondary w-full mt-6"
          >
            <GoogleIcon size={20} />
            {googleLoading ? 'Connecting to Google…' : 'Sign up with Google'}
          </button>

          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-slate-200" />
            <span className="text-xs text-slate-400 font-medium">or</span>
            <div className="flex-1 h-px bg-slate-200" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Company name</label>
                <input
                  className="input"
                  required
                  value={form.companyName}
                  onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                  placeholder="Acme Inc."
                />
              </div>
              <div>
                <label className="label">Company email</label>
                <input
                  type="email"
                  className="input"
                  required
                  value={form.companyEmail}
                  onChange={(e) => setForm({ ...form, companyEmail: e.target.value })}
                  placeholder="hr@acme.com"
                />
              </div>
            </div>
            <div>
              <label className="label">Your name</label>
              <input
                className="input"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Jane Smith"
              />
            </div>
            <div>
              <label className="label">Your email</label>
              <input
                type="email"
                className="input"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="jane@acme.com"
              />
            </div>
            <div>
              <label className="label">Password</label>
              <input
                type="password"
                className="input"
                required
                minLength={6}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="At least 6 characters"
              />
            </div>
            <div>
              <label className="label">Plan</label>
              <select
                className="input"
                value={form.plan}
                onChange={(e) => setForm({ ...form, plan: e.target.value })}
              >
                <option value="starter">Starter — Free</option>
                <option value="growth">Growth — $49/mo</option>
                <option value="enterprise">Enterprise — Custom</option>
              </select>
            </div>
            <button type="submit" className="btn-primary w-full" disabled={loading || googleLoading}>
              {loading ? 'Creating workspace…' : 'Create workspace'}
              {!loading && <ArrowRight size={18} />}
            </button>
          </form>

          <p className="text-sm text-slate-500 mt-6 text-center">
            Already have an account?{' '}
            <Link to="/signin" className="text-blue-600 font-medium hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
