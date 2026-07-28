import { NavLink, Outlet, useNavigate, Link } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Building2,
  Briefcase,
  ClipboardList,
  FileText,
  PenTool,
  GraduationCap,
  Monitor,
  BarChart3,
  ScrollText,
  Settings,
  LogOut,
  Bell,
  ChevronDown,
} from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { Avatar } from '@/components/ui';
import { LogoMark } from '@/components/Logo';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Notification } from '@/lib/types';

const nav = [
  { to: '/app/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/app/employees', label: 'Employees', icon: Users },
  { to: '/app/departments', label: 'Departments', icon: Building2 },
  { to: '/app/job-roles', label: 'Job Roles', icon: Briefcase },
  { to: '/app/templates', label: 'Templates', icon: ClipboardList },
  { to: '/app/tasks', label: 'Tasks', icon: ClipboardList },
  { to: '/app/documents', label: 'Documents', icon: FileText },
  { to: '/app/signatures', label: 'E-Signatures', icon: PenTool },
  { to: '/app/training', label: 'Training', icon: GraduationCap },
  { to: '/app/it-requests', label: 'IT Requests', icon: Monitor },
  { to: '/app/reports', label: 'Reports', icon: BarChart3 },
  { to: '/app/audit-logs', label: 'Audit Logs', icon: ScrollText },
  { to: '/app/settings', label: 'Settings', icon: Settings },
];

export default function AppShell() {
  const { profile, company, signOut } = useAuth();
  const navigate = useNavigate();
  const [notifs, setNotifs] = useState<Notification[]>([]);
  const [showNotifs, setShowNotifs] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  useEffect(() => {
    if (!profile) return;
    (async () => {
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', profile.user_id)
        .order('created_at', { ascending: false })
        .limit(10);
      setNotifs((data ?? []) as Notification[]);
    })();
  }, [profile]);

  async function handleSignOut() {
    await signOut();
    navigate('/');
  }

  async function markAllRead() {
    if (!profile) return;
    await supabase.from('notifications').update({ is_read: true }).eq('user_id', profile.user_id);
    setNotifs((prev) => prev.map((n) => ({ ...n, is_read: true })));
  }

  const unread = notifs.filter((n) => !n.is_read).length;

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col fixed h-screen z-30">
        <div className="h-16 flex items-center gap-2.5 px-5 border-b border-slate-100">
          <LogoMark size={36} />
          <div>
            <p className="font-bold text-slate-900 leading-tight">Smart<span className="text-blue-600">Hire</span></p>
            <p className="text-xs text-slate-400 leading-tight">{company?.name ?? 'Company'}</p>
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5">
          {nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                  isActive
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`
              }
            >
              <item.icon size={18} />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="p-3 border-t border-slate-100">
          <button onClick={handleSignOut} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-red-50 hover:text-red-600 transition w-full">
            <LogOut size={18} />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 ml-64">
        {/* Topbar */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 sticky top-0 z-20">
          <div className="text-sm text-slate-500">
            Welcome back, <span className="font-semibold text-slate-900">{profile?.name}</span>
          </div>
          <div className="flex items-center gap-3">
            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => { setShowNotifs(!showNotifs); if (!showNotifs) markAllRead(); }}
                className="relative w-10 h-10 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-600"
              >
                <Bell size={20} />
                {unread > 0 && (
                  <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-red-500" />
                )}
              </button>
              {showNotifs && (
                <div className="absolute right-0 mt-2 w-80 card p-2 animate-fade-in z-50">
                  <p className="px-3 py-2 text-sm font-semibold text-slate-700 border-b border-slate-100">Notifications</p>
                  <div className="max-h-80 overflow-y-auto">
                    {notifs.length === 0 ? (
                      <p className="px-3 py-6 text-sm text-slate-400 text-center">No notifications</p>
                    ) : (
                      notifs.map((n) => (
                        <div key={n.id} className="px-3 py-2.5 hover:bg-slate-50 rounded-lg">
                          <p className="text-sm text-slate-700">{n.message}</p>
                          <p className="text-xs text-slate-400 mt-0.5">
                            {new Date(n.created_at).toLocaleString()}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* User menu */}
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="flex items-center gap-2 hover:bg-slate-100 rounded-lg p-1 pr-2 transition"
              >
                <Avatar name={profile?.name ?? 'User'} photoUrl={profile?.photo_url} size={32} />
                <ChevronDown size={16} className="text-slate-400" />
              </button>
              {showMenu && (
                <div className="absolute right-0 mt-2 w-48 card p-2 animate-fade-in z-50">
                  <div className="px-3 py-2 border-b border-slate-100">
                    <p className="text-sm font-semibold text-slate-900">{profile?.name}</p>
                    <p className="text-xs text-slate-500">{profile?.email}</p>
                  </div>
                  <Link to="/portal/dashboard" className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-600 hover:bg-slate-50">
                    <Building2 size={16} /> Employee portal
                  </Link>
                  <button onClick={handleSignOut} className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-600 hover:bg-red-50 hover:text-red-600 w-full">
                    <LogOut size={16} />
                    Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
