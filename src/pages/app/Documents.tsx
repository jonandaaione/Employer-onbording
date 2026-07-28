import { useEffect, useState } from 'react';
import { FileText, Search, CheckCircle2, XCircle, Eye, Clock, RotateCcw } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { logAudit } from '@/lib/seed';
import { Avatar, StatusBadge, Modal, EmptyState } from '@/components/ui';
import type { DocumentRecord, Profile } from '@/lib/types';

export default function Documents() {
  const { company, profile } = useAuth();
  const [docs, setDocs] = useState<DocumentRecord[]>([]);
  const [employees, setEmployees] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [reviewDoc, setReviewDoc] = useState<DocumentRecord | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  async function load() {
    if (!company) return;
    const [{ data: d }, { data: emps }] = await Promise.all([
      supabase.from('documents').select('*').eq('company_id', company.id).order('uploaded_at', { ascending: false }),
      supabase.from('profiles').select('*').eq('company_id', company.id).neq('role', 'hr_admin'),
    ]);
    setDocs((d ?? []) as DocumentRecord[]);
    setEmployees((emps ?? []) as Profile[]);
    setLoading(false);
  }

  useEffect(() => { load(); }, [company]);

  async function updateStatus(doc: DocumentRecord, status: DocumentRecord['status'], reason?: string) {
    if (!company || !profile) return;
    await supabase
      .from('documents')
      .update({
        status,
        rejection_reason: reason ?? null,
        reviewed_by: profile.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', doc.id);
    await logAudit(company.id, profile.user_id, 'review_document', 'documents', `${doc.doc_type_name} → ${status}`);
    setReviewDoc(null);
    setRejectReason('');
    await load();
  }

  const filtered = docs.filter((d) => {
    const emp = employees.find((e) => e.id === d.employee_id);
    const matchSearch =
      d.doc_type_name.toLowerCase().includes(search.toLowerCase()) ||
      (emp?.name ?? '').toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'all' || d.status === filter;
    return matchSearch && matchFilter;
  });

  const empName = (id: string) => employees.find((e) => e.id === id)?.name ?? 'Unknown';

  if (loading) return <div className="py-20 text-center text-slate-400">Loading documents…</div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Documents Vault</h1>
        <p className="text-slate-500 text-sm mt-1">Review and approve employee documents</p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input className="input pl-10" placeholder="Search documents…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select className="input w-auto" value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="all">All statuses</option>
          <option value="pending">Pending</option>
          <option value="under_review">Under Review</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="resubmit">Resubmit</option>
        </select>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {[
          { label: 'Total', value: docs.length, color: 'slate' },
          { label: 'Pending', value: docs.filter(d => d.status === 'pending').length, color: 'amber' },
          { label: 'Under Review', value: docs.filter(d => d.status === 'under_review').length, color: 'blue' },
          { label: 'Approved', value: docs.filter(d => d.status === 'approved').length, color: 'emerald' },
          { label: 'Rejected', value: docs.filter(d => d.status === 'rejected').length, color: 'red' },
        ].map((s) => (
          <div key={s.label} className="card p-4">
            <p className="text-xs text-slate-500 font-medium">{s.label}</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{s.value}</p>
          </div>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="card"><EmptyState icon={FileText} title="No documents found" description="Documents will appear here once employees upload them." /></div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr className="text-left text-xs font-semibold text-slate-500 uppercase">
                <th className="px-6 py-3">Employee</th><th className="px-6 py-3">Document</th><th className="px-6 py-3">Status</th><th className="px-6 py-3">Uploaded</th><th className="px-6 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((d) => (
                <tr key={d.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Avatar name={empName(d.employee_id)} size={30} />
                      <span className="text-sm font-medium text-slate-900">{empName(d.employee_id)}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-700">{d.doc_type_name}</td>
                  <td className="px-6 py-4"><StatusBadge status={d.status} /></td>
                  <td className="px-6 py-4 text-sm text-slate-500">{new Date(d.uploaded_at).toLocaleDateString()}</td>
                  <td className="px-6 py-4">
                    <button onClick={() => setReviewDoc(d)} className="btn-ghost text-xs">
                      <Eye size={16} /> Review
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Review modal */}
      <Modal open={!!reviewDoc} onClose={() => { setReviewDoc(null); setRejectReason(''); }} title="Review document" size="lg">
        {reviewDoc && (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-lg bg-slate-50">
              <div>
                <p className="font-medium text-slate-900">{reviewDoc.doc_type_name}</p>
                <p className="text-sm text-slate-500">{empName(reviewDoc.employee_id)}</p>
              </div>
              <StatusBadge status={reviewDoc.status} />
            </div>
            <div className="border border-slate-200 rounded-lg p-4 bg-slate-50 flex items-center justify-center min-h-[200px]">
              {reviewDoc.file_url.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                <img src={reviewDoc.file_url} alt={reviewDoc.doc_type_name} className="max-h-64 rounded" />
              ) : (
                <div className="text-center">
                  <FileText size={48} className="text-slate-300 mx-auto" />
                  <p className="text-sm text-slate-500 mt-2">{reviewDoc.file_name ?? 'Document file'}</p>
                  <a href={reviewDoc.file_url} target="_blank" rel="noreferrer" className="text-blue-600 text-sm hover:underline mt-1 inline-block">Open file</a>
                </div>
              )}
            </div>
            {reviewDoc.rejection_reason && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
                <strong>Rejection reason:</strong> {reviewDoc.rejection_reason}
              </div>
            )}
            <div>
              <label className="label">Rejection / resubmit reason (optional)</label>
              <textarea className="input" rows={2} value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder="e.g. Document is blurry, please re-upload…" />
            </div>
            <div className="flex flex-wrap justify-end gap-2">
              <button onClick={() => updateStatus(reviewDoc, 'rejected', rejectReason)} className="btn-danger">
                <XCircle size={16} /> Reject
              </button>
              <button onClick={() => updateStatus(reviewDoc, 'resubmit', rejectReason)} className="btn-secondary">
                <RotateCcw size={16} /> Resubmit
              </button>
              <button onClick={() => updateStatus(reviewDoc, 'under_review')} className="btn-secondary">
                <Clock size={16} /> Under Review
              </button>
              <button onClick={() => updateStatus(reviewDoc, 'approved')} className="btn-primary">
                <CheckCircle2 size={16} /> Approve
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
