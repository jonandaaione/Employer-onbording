import { useEffect, useState } from 'react';
import { Monitor, Mail, Laptop, AppWindow, ShieldCheck, Key, Clock, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { Avatar, StatusBadge, EmptyState } from '@/components/ui';
import type { ITRequest, Profile } from '@/lib/types';

const typeIcons: Record<string, typeof Mail> = {
  email: Mail, laptop: Laptop, software: AppWindow, vpn: ShieldCheck, access: Key,
};

export default function ITRequests() {
  const { company } = useAuth();
  const [requests, setRequests] = useState<ITRequest[]>([]);
  const [employees, setEmployees] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    if (!company) return;
    const [{ data: r }, { data: e }] = await Promise.all([
      supabase.from('it_requests').select('*').eq('company_id', company.id).order('created_at', { ascending: false }),
      supabase.from('profiles').select('*').eq('company_id', company.id).neq('role', 'hr_admin'),
    ]);
    setRequests((r ?? []) as ITRequest[]);
    setEmployees((e ?? []) as Profile[]);
    setLoading(false);
  }

  useEffect(() => { load(); }, [company]);

  async function updateStatus(id: string, status: ITRequest['status']) {
    await supabase.from('it_requests').update({ status, completed_at: status === 'completed' ? new Date().toISOString() : null }).eq('id', id);
    await load();
  }

  const empName = (id: string) => employees.find((e) => e.id === id)?.name ?? 'Unknown';

  if (loading) return <div className="py-20 text-center text-slate-400">Loading…</div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">IT Requests</h1>
        <p className="text-slate-500 text-sm mt-1">Provisioning for email, laptops, software, and VPN</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="card p-4"><p className="text-xs text-slate-500">Pending</p><p className="text-2xl font-bold text-slate-900 mt-1">{requests.filter(r => r.status === 'pending').length}</p></div>
        <div className="card p-4"><p className="text-xs text-slate-500">In Progress</p><p className="text-2xl font-bold text-slate-900 mt-1">{requests.filter(r => r.status === 'in_progress').length}</p></div>
        <div className="card p-4"><p className="text-xs text-slate-500">Completed</p><p className="text-2xl font-bold text-slate-900 mt-1">{requests.filter(r => r.status === 'completed').length}</p></div>
      </div>

      {requests.length === 0 ? (
        <div className="card"><EmptyState icon={Monitor} title="No IT requests" description="IT requests are auto-created when employees are provisioned." /></div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr className="text-left text-xs font-semibold text-slate-500 uppercase">
                <th className="px-6 py-3">Employee</th><th className="px-6 py-3">Type</th><th className="px-6 py-3">Description</th><th className="px-6 py-3">Status</th><th className="px-6 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {requests.map((r) => {
                const Icon = typeIcons[r.type] ?? Monitor;
                return (
                  <tr key={r.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Avatar name={empName(r.employee_id)} size={30} />
                        <span className="text-sm font-medium text-slate-900">{empName(r.employee_id)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="flex items-center gap-2 text-sm text-slate-700 capitalize">
                        <Icon size={16} className="text-slate-400" /> {r.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">{r.description ?? '—'}</td>
                    <td className="px-6 py-4"><StatusBadge status={r.status} /></td>
                    <td className="px-6 py-4">
                      <select
                        value={r.status}
                        onChange={(e) => updateStatus(r.id, e.target.value as ITRequest['status'])}
                        className="text-xs px-2 py-1.5 rounded border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                      >
                        <option value="pending">Pending</option>
                        <option value="in_progress">In Progress</option>
                        <option value="completed">Completed</option>
                      </select>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
