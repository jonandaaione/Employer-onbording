import { useEffect, useState } from 'react';
import { PenTool, FileText, CheckCircle2, Clock } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { Modal, EmptyState } from '@/components/ui';
import SignaturePad from '@/components/SignaturePad';
import type { Agreement, Signature } from '@/lib/types';

export default function PortalAgreements() {
  const { profile, company } = useAuth();
  const [agreements, setAgreements] = useState<Agreement[]>([]);
  const [signatures, setSignatures] = useState<Signature[]>([]);
  const [loading, setLoading] = useState(true);
  const [signAgreement, setSignAgreement] = useState<Agreement | null>(null);
  const [savedSig, setSavedSig] = useState<string | null>(null);

  async function load() {
    if (!profile || !company) return;
    const [a, s] = await Promise.all([
      supabase.from('agreements').select('*').eq('company_id', company.id).eq('is_active', true),
      supabase.from('signatures').select('*').eq('employee_id', profile.id),
    ]);
    setAgreements((a.data ?? []) as Agreement[]);
    setSignatures((s.data ?? []) as Signature[]);
    setLoading(false);
  }

  useEffect(() => { load(); }, [profile, company]);

  async function confirmSign() {
    if (!signAgreement || !profile || !company || !savedSig) return;
    await supabase.from('signatures').insert({
      company_id: company.id,
      employee_id: profile.id,
      agreement_id: signAgreement.id,
      agreement_name: signAgreement.name,
      signature_url: savedSig,
      signed_at: new Date().toISOString(),
      ip: 'recorded',
      device: navigator.userAgent.slice(0, 120),
      doc_version: signAgreement.version,
    });
    setSignAgreement(null); setSavedSig(null);
    await load();
  }

  if (loading) return <div className="py-20 text-center text-slate-400">Loading…</div>;

  const signedSet = new Set(signatures.map(s => s.agreement_id));
  const signedCount = agreements.filter(a => signedSet.has(a.id)).length;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Agreements</h1>
        <p className="text-slate-500 text-sm mt-1">{signedCount} of {agreements.length} signed</p>
      </div>

      {agreements.length === 0 ? (
        <div className="card"><EmptyState icon={PenTool} title="No agreements" /></div>
      ) : (
        <div className="space-y-3">
          {agreements.map((a) => {
            const sig = signatures.find(s => s.agreement_id === a.id);
            return (
              <div key={a.id} className="card p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                      <FileText size={20} className="text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-medium text-slate-900">{a.name}</h3>
                      <p className="text-xs text-slate-500 mt-0.5">Version {a.version}</p>
                      <p className="text-sm text-slate-600 mt-2 line-clamp-2">{a.body}</p>
                    </div>
                  </div>
                  {sig ? (
                    <div className="text-right shrink-0">
                      <span className="badge bg-emerald-100 text-emerald-700"><CheckCircle2 size={12} /> Signed</span>
                      <p className="text-xs text-slate-400 mt-1">{new Date(sig.signed_at).toLocaleDateString()}</p>
                    </div>
                  ) : (
                    <button onClick={() => setSignAgreement(a)} className="btn-primary text-sm shrink-0">
                      <PenTool size={16} /> Sign
                    </button>
                  )}
                </div>
                {sig && (
                  <div className="mt-3 pt-3 border-t border-slate-100">
                    <img src={sig.signature_url} alt="signature" className="h-14 rounded border border-slate-200 bg-white" />
                    <p className="text-xs text-slate-400 mt-1">Signed: {new Date(sig.signed_at).toLocaleString()} · IP: {sig.ip}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <Modal open={!!signAgreement} onClose={() => { setSignAgreement(null); setSavedSig(null); }} title={`Sign ${signAgreement?.name ?? ''}`} size="lg">
        {signAgreement && (
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-slate-50 text-sm text-slate-600 max-h-48 overflow-y-auto">
              {signAgreement.body}
            </div>
            {!savedSig ? (
              <SignaturePad onSave={(url) => setSavedSig(url)} />
            ) : (
              <div>
                <p className="label">Preview</p>
                <img src={savedSig} alt="signature" className="h-24 rounded border border-slate-200 bg-white p-2" />
                <div className="flex gap-2 mt-3">
                  <button onClick={() => setSavedSig(null)} className="btn-secondary text-sm">Redo</button>
                  <button onClick={confirmSign} className="btn-primary text-sm"><CheckCircle2 size={16} /> Confirm & sign</button>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
