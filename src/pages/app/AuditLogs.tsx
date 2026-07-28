import { useEffect, useState } from 'react';
import { ScrollText, Search } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { EmptyState } from '@/components/ui';
import type { AuditLog } from '@/lib/types';

export default function AuditLogs() {
  const { company } = useAuth();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!company) return;
    (async () => {
      const { data } = await supabase.from('audit_logs').select('*').eq('company_id', company.id).order('created_at', { ascending: false }).limit(200);
      setLogs((data ?? []) as AuditLog[]);
      setLoading(false);
    })();
  }, [company]);

  const filtered = logs.filter(
    (l) => l.action.toLowerCase().includes(search.toLowerCase()) || (l.details ?? '').toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="py-20 text-center text-slate-400">Loading…</div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Audit Logs</h1>
        <p className="text-slate-500 text-sm mt-1">Track every action across your workspace</p>
      </div>

      <div className="relative max-w-md">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input className="input pl-10" placeholder="Search logs…" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {filtered.length === 0 ? (
        <div className="card"><EmptyState icon={ScrollText} title="No audit logs" description="Actions performed in your workspace will be logged here." /></div>
      ) : (
        <div className="card overflow-hidden">
          <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
            {filtered.map((l) => (
              <div key={l.id} className="flex items-start gap-3 px-6 py-3.5 hover:bg-slate-50">
                <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                  <ScrollText size={14} className="text-slate-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-900">
                    <span className="font-medium">{l.action.replace(/_/g, ' ')}</span>
                    {l.resource && <span className="text-slate-400"> · {l.resource}</span>}
                  </p>
                  {l.details && <p className="text-xs text-slate-500 mt-0.5 truncate">{l.details}</p>}
                </div>
                <span className="text-xs text-slate-400 whitespace-nowrap">{new Date(l.created_at).toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
