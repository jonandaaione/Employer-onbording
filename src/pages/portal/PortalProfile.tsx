import { useState } from 'react';
import { User, Save, Phone, MapPin, Briefcase } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { Avatar, RoleBadge } from '@/components/ui';

export default function PortalProfile() {
  const { profile, refreshProfile } = useAuth();
  const [form, setForm] = useState({
    name: profile?.name ?? '',
    phone: profile?.phone ?? '',
    photo_url: profile?.photo_url ?? '',
    location: profile?.location ?? '',
    job_title: profile?.job_title ?? '',
  });
  const [saved, setSaved] = useState(false);

  async function save() {
    if (!profile) return;
    await supabase.from('profiles').update(form).eq('id', profile.id);
    await refreshProfile();
    setSaved(true); setTimeout(() => setSaved(false), 2000);
  }

  if (!profile) return null;

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">My Profile</h1>
        <p className="text-slate-500 text-sm mt-1">Update your personal details</p>
      </div>

      {saved && <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-sm text-emerald-700">Profile saved</div>}

      <div className="card p-6">
        <div className="flex items-center gap-4 mb-6">
          <Avatar name={form.name} photoUrl={form.photo_url} size={72} />
          <div>
            <p className="font-semibold text-slate-900 text-lg">{profile.name}</p>
            <p className="text-sm text-slate-500">{profile.email}</p>
            <div className="mt-1"><RoleBadge role={profile.role} /></div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Full name</label>
              <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <label className="label">Phone</label>
              <input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+1…" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Job title</label>
              <input className="input" value={form.job_title} onChange={(e) => setForm({ ...form, job_title: e.target.value })} />
            </div>
            <div>
              <label className="label">Location</label>
              <input className="input" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="City, Country" />
            </div>
          </div>
          <div>
            <label className="label">Photo URL</label>
            <input className="input" value={form.photo_url} onChange={(e) => setForm({ ...form, photo_url: e.target.value })} placeholder="https://…" />
          </div>
          <button onClick={save} className="btn-primary"><Save size={16} /> Save profile</button>
        </div>
      </div>
    </div>
  );
}
