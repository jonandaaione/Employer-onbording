import { useState } from 'react';
import { Settings as SettingsIcon, Building2, User, Bell, Shield, Save } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { Avatar, RoleBadge } from '@/components/ui';

export default function Settings() {
  const { company, profile, refreshProfile } = useAuth();
  const [tab, setTab] = useState<'company' | 'profile' | 'notifications' | 'security'>('company');
  const [companyForm, setCompanyForm] = useState({ name: company?.name ?? '', email: company?.email ?? '', logo_url: company?.logo_url ?? '', plan: company?.subscription_plan ?? 'starter' });
  const [profileForm, setProfileForm] = useState({ name: profile?.name ?? '', phone: profile?.phone ?? '', photo_url: profile?.photo_url ?? '', location: profile?.location ?? '' });
  const [saved, setSaved] = useState(false);

  async function saveCompany() {
    if (!company) return;
    await supabase.from('companies').update(companyForm).eq('id', company.id);
    await refreshProfile();
    setSaved(true); setTimeout(() => setSaved(false), 2000);
  }

  async function saveProfile() {
    if (!profile) return;
    await supabase.from('profiles').update(profileForm).eq('id', profile.id);
    await refreshProfile();
    setSaved(true); setTimeout(() => setSaved(false), 2000);
  }

  const tabs = [
    { key: 'company', label: 'Company', icon: Building2 },
    { key: 'profile', label: 'My Profile', icon: User },
    { key: 'notifications', label: 'Notifications', icon: Bell },
    { key: 'security', label: 'Security', icon: Shield },
  ] as const;

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="text-slate-500 text-sm mt-1">Manage your workspace and account</p>
      </div>

      <div className="flex gap-1 border-b border-slate-200">
        {tabs.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)} className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition ${tab === t.key ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-900'}`}>
            <t.icon size={16} /> {t.label}
          </button>
        ))}
      </div>

      {saved && <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-sm text-emerald-700">Saved successfully</div>}

      {tab === 'company' && (
        <div className="card p-6 space-y-4">
          <div>
            <label className="label">Company name</label>
            <input className="input" value={companyForm.name} onChange={(e) => setCompanyForm({ ...companyForm, name: e.target.value })} />
          </div>
          <div>
            <label className="label">Company email</label>
            <input className="input" value={companyForm.email} onChange={(e) => setCompanyForm({ ...companyForm, email: e.target.value })} />
          </div>
          <div>
            <label className="label">Logo URL</label>
            <input className="input" value={companyForm.logo_url} onChange={(e) => setCompanyForm({ ...companyForm, logo_url: e.target.value })} placeholder="https://…" />
          </div>
          <div>
            <label className="label">Subscription plan</label>
            <select className="input" value={companyForm.plan} onChange={(e) => setCompanyForm({ ...companyForm, plan: e.target.value })}>
              <option value="starter">Starter</option><option value="growth">Growth</option><option value="enterprise">Enterprise</option>
            </select>
          </div>
          <button onClick={saveCompany} className="btn-primary"><Save size={16} /> Save changes</button>
        </div>
      )}

      {tab === 'profile' && (
        <div className="card p-6 space-y-4">
          <div className="flex items-center gap-4">
            <Avatar name={profile?.name ?? 'User'} photoUrl={profileForm.photo_url} size={64} />
            <div>
              <p className="font-semibold text-slate-900">{profile?.name}</p>
              <p className="text-sm text-slate-500">{profile?.email}</p>
              {profile && <div className="mt-1"><RoleBadge role={profile.role} /></div>}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Full name</label>
              <input className="input" value={profileForm.name} onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })} />
            </div>
            <div>
              <label className="label">Phone</label>
              <input className="input" value={profileForm.phone} onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Photo URL</label>
              <input className="input" value={profileForm.photo_url} onChange={(e) => setProfileForm({ ...profileForm, photo_url: e.target.value })} placeholder="https://…" />
            </div>
            <div>
              <label className="label">Location</label>
              <input className="input" value={profileForm.location} onChange={(e) => setProfileForm({ ...profileForm, location: e.target.value })} />
            </div>
          </div>
          <button onClick={saveProfile} className="btn-primary"><Save size={16} /> Save profile</button>
        </div>
      )}

      {tab === 'notifications' && (
        <div className="card p-6 space-y-3">
          {['Invite sent', 'Document uploaded', 'Document rejected', 'Task assigned', 'Task overdue', 'Training completed', 'Agreement signed'].map((n) => (
            <label key={n} className="flex items-center justify-between p-3 rounded-lg border border-slate-200 hover:bg-slate-50">
              <span className="text-sm text-slate-700">{n}</span>
              <input type="checkbox" defaultChecked className="rounded" />
            </label>
          ))}
        </div>
      )}

      {tab === 'security' && (
        <div className="card p-6 space-y-4">
          <div className="p-4 rounded-lg bg-slate-50 flex items-center gap-3">
            <Shield size={20} className="text-emerald-600" />
            <div>
              <p className="text-sm font-medium text-slate-900">Row-level security enabled</p>
              <p className="text-xs text-slate-500">All data is isolated by company. Users can only access their own company's records.</p>
            </div>
          </div>
          <div className="p-4 rounded-lg bg-slate-50 flex items-center gap-3">
            <Shield size={20} className="text-emerald-600" />
            <div>
              <p className="text-sm font-medium text-slate-900">Audit logging active</p>
              <p className="text-xs text-slate-500">Every action is recorded with timestamp, user, and details.</p>
            </div>
          </div>
          <div>
            <label className="label">Change password</label>
            <input type="password" className="input" placeholder="New password" />
            <button className="btn-secondary mt-2">Update password</button>
          </div>
        </div>
      )}
    </div>
  );
}
