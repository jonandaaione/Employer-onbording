import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { LayoutDashboard, User, FileText, PenTool, ClipboardList, GraduationCap, HelpCircle, LogOut } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { Avatar } from '@/components/ui';
import { Logo } from '@/components/Logo';
import { useEffect, useState } from 'react';

const nav = [
  { to: '/portal/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/portal/profile', label: 'My Profile', icon: User },
  { to: '/portal/documents', label: 'Documents', icon: FileText },
  { to: '/portal/agreements', label: 'Agreements', icon: PenTool },
  { to: '/portal/tasks', label: 'My Tasks', icon: ClipboardList },
  { to: '/portal/training', label: 'Training', icon: GraduationCap },
  { to: '/portal/help', label: 'Help Center', icon: HelpCircle },
];

export default function PortalShell() {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    setProgress(profile?.onboarding_progress ?? 0);
  }, [profile]);

  async function handleSignOut() {
    await signOut();
    navigate('/');
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Logo size={36} />
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2">
              <div className="w-32 bg-slate-100 rounded-full h-2 overflow-hidden">
                <div className="h-full bg-blue-600 rounded-full transition-all" style={{ width: `${progress}%` }} />
              </div>
              <span className="text-sm font-medium text-slate-600">{progress}%</span>
            </div>
            <Avatar name={profile?.name ?? 'User'} photoUrl={profile?.photo_url} size={36} />
            <button onClick={handleSignOut} className="text-slate-400 hover:text-red-500 transition"><LogOut size={20} /></button>
          </div>
        </div>
      </header>

      <div className="flex-1 max-w-6xl mx-auto w-full px-6 py-6 flex gap-6">
        <aside className="w-56 shrink-0">
          <nav className="space-y-0.5 sticky top-24">
            {nav.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                    isActive ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`
                }
              >
                <item.icon size={18} /> {item.label}
              </NavLink>
            ))}
          </nav>
        </aside>
        <main className="flex-1 min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
