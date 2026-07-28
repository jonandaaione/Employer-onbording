import { useEffect, useState } from 'react';
import { PenTool, FileText, CheckCircle2, Clock } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { logAudit } from '@/lib/seed';
import { Avatar, Modal, EmptyState, StatusBadge } from '@/components/ui';
import SignaturePad from '@/components/SignaturePad';
import type { Agreement, Signature, Profile } from '@/lib/types';

export default function Signatures() {
  const { company, profile } = useAuth();
  const [agreements, setAgreements] = useState<Agreement[]>([]);
  const [signatures, setSignatures] = useState<Signature[]>([]);
  const [employees, setEmployees] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [signFor, setSignFor] = useState<{ agreement: Agreement; employee: Profile } | null>(null);
  const [savedSig, setSavedSig] = useState<string | null>(null);

  async function load() {
    if (!company) return;
    const [{ data: a }, { data: s }, { data: emps }] = await Promise.all([
      supabase.from('agreements').select('*').eq('company_id', company.id).eq('is_active', true),
      supabase.from('signatures').select('*').eq('company_id', company.id).order('signed_at', { ascending: false }),
      supabase.from('profiles').select('*').eq('company_id', company.id).neq('role', 'hr_admin'),
    ]);
    setAgreements((a ?? []) as Agreement[]);
    setSignatures((s ?? []) as Signature[]);
    setEmployees((emps ?? []) as Profile[]);
    setLoading(false);
  }

  useEffect(() => { load(); }, [company]);

  async function handleSave(dataUrl: string) {
    setSavedSig(dataUrl);
  }

  async function confirmSign() {
    if (!signFor || !company || !profile || !savedSig) return;
    await supabase.from('signatures').insert({
      company_id: company.id,
      employee_id: signFor.employee.id,
      agreement_id: signFor.agreement.id,
      agreement_name: signFor.agreement.name,
      signature_url: savedSig,
      signed_at: new Date().toISOString(),
      ip: 'recorded',
      device: navigator.userAgent.slice(0, 120),
      doc_version: signFor.agreement.version,
    });
    await logAudit(company.id, profile.user_id, 'sign_agreement', 'signatures', `${signFor.agreement.name} for ${signFor.employee.name}`);
    setSignFor(null);
    setSavedSig(null);
    await load();
  }

  const empName = (id: string) => employees.find((e) => e.id === id)?.name ?? 'Unknown';
  const signedAgreements = new Set(signatures.map((s) => `${s.employee_id}:${s.agreement_id}`));

  if (loading) return <div className="py-20 text-center text-slate-400">Loading…</div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">E-Signatures</h1>
        <p className="text-slate-500 text-sm mt-1">Agreements and signed documents with full audit trail</p>
      </div>

      {/* Agreements */}
      <div>
        <h3 className="font-semibold text-slate-900 mb-3">Agreement templates</h3>
        <div className="grid md:grid-cols-2 gap-4">
          {agreements.length === 0 ? (
            <div className="card md:col-span-2"><EmptyState icon={FileText} title="No agreements" description="Agreement templates are created automatically." /></div>
          ) : agreements.map((a) => {
            const signedCount = signatures.filter((s) => s.agreement_id === a.id).length;
            return (
              <div key={a.id} className="card p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                      <FileText size={20} className="text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">{a.name}</p>
                      <p className="text-xs text-slate-500">v{a.version} · {signedCount} signed</p>
                    </div>
                  </div>
                  <StatusBadge status={signedCount > 0 ? 'active' : 'pending'} />
                </div>
                <p className="text-sm text-slate-600 mt-3 line-clamp-2">{a.body}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Sign on behalf */}
      <div>
        <h3 className="font-semibold text-slate-900 mb-3">Sign on behalf of employee</h3>
        <div className="card p-5">
          {employees.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-4">No employees to sign for.</p>
          ) : (
            <div className="space-y-2">
              {employees.map((e) => (
                <div key={e.id} className="flex items-center justify-between p-3 rounded-lg border border-slate-200">
                  <div className="flex items-center gap-3">
                    <Avatar name={e.name} photoUrl={e.photo_url} size={32} />
                    <div>
                      <p className="text-sm font-medium text-slate-900">{e.name}</p>
                      <p className="text-xs text-slate-500">
                        {agreements.filter((a) => signedAgreements.has(`${e.id}:${a.id}`)).length} / {agreements.length} signed
                      </p>
                    </div>
                  </div>
                  <select
                    className="input w-auto text-sm"
                    defaultValue=""
                    onChange={(ev) => {
                      const a = agreements.find((ag) => ag.id === ev.target.value);
                      if (a) setSignFor({ agreement: a, employee: e });
                      ev.target.value = "";
                    }}
                  >
                    <option value="">Sign agreement…</option>
                    {agreements.filter((a) => !signedAgreements.has(`${e.id}:${a.id}`)).map((a) => (
                      <option key={a.id} value={a.id}>{a.name}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent signatures */}
      <div>
        <h3 className="font-semibold text-slate-900 mb-3">Recent signatures</h3>
        <div className="card">
          {signatures.length === 0 ? <EmptyState icon={PenTool} title="No signatures yet" /> : (
            <div className="divide-y divide-slate-100">
              {signatures.map((s) => (
                <div key={s.id} className="flex items-center gap-4 px-6 py-4">
                  <img src={s.signature_url} alt="sig" className="h-12 rounded border border-slate-200 bg-white" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-900">{s.agreement_name}</p>
                    <p className="text-xs text-slate-500">{empName(s.employee_id)} · {new Date(s.signed_at).toLocaleString()}</p>
                  </div>
                  <div className="text-right text-xs text-slate-400">
                    <p>IP: {s.ip}</p>
                    <p>v{s.doc_version}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Sign modal */}
      <Modal open={!!signFor} onClose={() => { setSignFor(null); setSavedSig(null); }} title={`Sign ${signFor?.agreement.name ?? ''}`} size="lg">
        {signFor && (
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-slate-50 text-sm text-slate-600 max-h-40 overflow-y-auto">
              {signFor.agreement.body}
            </div>
            <div className="flex items-center gap-2 p-3 rounded-lg bg-blue-50 border border-blue-100 text-sm text-blue-700">
              <Avatar name={signFor.employee.name} size={28} />
              Signing as <strong>{signFor.employee.name}</strong>
            </div>
            {!savedSig ? (
              <SignaturePad onSave={handleSave} />
            ) : (
              <div>
                <p className="label">Preview</p>
                <img src={savedSig} alt="signature" className="h-24 rounded border border-slate-200 bg-white p-2" />
                <div className="flex gap-2 mt-3">
                  <button onClick={() => setSavedSig(null)} className="btn-secondary text-sm">Redo</button>
                  <button onClick={confirmSign} className="btn-primary text-sm">
                    <CheckCircle2 size={16} /> Confirm signature
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
