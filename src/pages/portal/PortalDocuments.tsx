import { useEffect, useState } from 'react';
import { FileText, Upload, CheckCircle2, AlertCircle, Trash2 } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { StatusBadge, EmptyState, Modal } from '@/components/ui';
import type { DocumentRecord, DocumentType } from '@/lib/types';

export default function PortalDocuments() {
  const { profile, company } = useAuth();
  const [docs, setDocs] = useState<DocumentRecord[]>([]);
  const [docTypes, setDocTypes] = useState<DocumentType[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [uploadType, setUploadType] = useState<DocumentType | null>(null);
  const [fileUrl, setFileUrl] = useState('');
  const [fileName, setFileName] = useState('');
  const [uploading, setUploading] = useState(false);

  async function load() {
    if (!profile || !company) return;
    const [d, dt] = await Promise.all([
      supabase.from('documents').select('*').eq('employee_id', profile.id).order('uploaded_at', { ascending: false }),
      supabase.from('document_types').select('*').eq('company_id', company.id),
    ]);
    setDocs((d.data ?? []) as DocumentRecord[]);
    setDocTypes((dt.data ?? []) as DocumentType[]);
    setLoading(false);
  }

  useEffect(() => { load(); }, [profile, company]);

  async function handleUpload() {
    if (!profile || !company || !uploadType || !fileUrl) return;
    setUploading(true);
    await supabase.from('documents').insert({
      company_id: company.id,
      employee_id: profile.id,
      doc_type_id: uploadType.id,
      doc_type_name: uploadType.name,
      file_url: fileUrl,
      file_name: fileName || uploadType.name,
      status: 'pending',
    });
    setShowUpload(false); setUploadType(null); setFileUrl(''); setFileName('');
    setUploading(false);
    await load();
  }

  async function removeDoc(id: string) {
    if (!confirm('Remove this document?')) return;
    await supabase.from('documents').delete().eq('id', id);
    await load();
  }

  if (loading) return <div className="py-20 text-center text-slate-400">Loading…</div>;

  const uploadedTypeIds = new Set(docs.map(d => d.doc_type_id));
  const requiredTypes = docTypes.filter(t => t.is_required);
  const allRequiredUploaded = requiredTypes.every(t => uploadedTypeIds.has(t.id));

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">My Documents</h1>
        <p className="text-slate-500 text-sm mt-1">Upload and track your required documents</p>
      </div>

      {/* Status banner */}
      <div className={`p-4 rounded-lg flex items-center gap-3 ${allRequiredUploaded ? 'bg-emerald-50 border border-emerald-200' : 'bg-amber-50 border border-amber-200'}`}>
        {allRequiredUploaded ? <CheckCircle2 size={20} className="text-emerald-600" /> : <AlertCircle size={20} className="text-amber-600" />}
        <p className="text-sm text-slate-700">
          {allRequiredUploaded ? 'All required documents uploaded!' : `${requiredTypes.filter(t => !uploadedTypeIds.has(t.id)).length} required document(s) still need to be uploaded.`}
        </p>
      </div>

      {/* Upload buttons for required docs */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {docTypes.map((dt) => {
          const uploaded = docs.find(d => d.doc_type_id === dt.id);
          return (
            <div key={dt.id} className="card p-5">
              <div className="flex items-start justify-between">
                <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                  <FileText size={20} className="text-blue-600" />
                </div>
                {dt.is_required && <span className="badge bg-red-50 text-red-600">Required</span>}
              </div>
              <h3 className="font-medium text-slate-900 mt-3 text-sm">{dt.name}</h3>
              <p className="text-xs text-slate-500 mt-1">Accepted: {dt.file_types}</p>
              {uploaded ? (
                <div className="mt-3 flex items-center justify-between">
                  <StatusBadge status={uploaded.status} />
                  <button onClick={() => removeDoc(uploaded.id)} className="text-slate-300 hover:text-red-500"><Trash2 size={16} /></button>
                </div>
              ) : (
                <button onClick={() => { setUploadType(dt); setShowUpload(true); }} className="btn-secondary w-full mt-3 text-sm">
                  <Upload size={16} /> Upload
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Uploaded documents history */}
      {docs.length > 0 && (
        <div className="card overflow-hidden">
          <div className="px-6 py-3 border-b border-slate-100">
            <h3 className="font-semibold text-slate-900 text-sm">Upload history</h3>
          </div>
          <div className="divide-y divide-slate-100">
            {docs.map((d) => (
              <div key={d.id} className="flex items-center justify-between px-6 py-3">
                <div>
                  <p className="text-sm font-medium text-slate-900">{d.doc_type_name}</p>
                  <p className="text-xs text-slate-500">Uploaded {new Date(d.uploaded_at).toLocaleDateString()}</p>
                  {d.rejection_reason && <p className="text-xs text-red-600 mt-1">Reason: {d.rejection_reason}</p>}
                </div>
                <StatusBadge status={d.status} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upload modal */}
      <Modal open={showUpload} onClose={() => setShowUpload(false)} title={`Upload ${uploadType?.name ?? ''}`}>
        <div className="space-y-4">
          <div>
            <label className="label">File URL</label>
            <input className="input" value={fileUrl} onChange={(e) => setFileUrl(e.target.value)} placeholder="https://… or paste a file link" />
            <p className="text-xs text-slate-400 mt-1">Paste a link to your document. Accepted: {uploadType?.file_types}</p>
          </div>
          <div>
            <label className="label">File name (optional)</label>
            <input className="input" value={fileName} onChange={(e) => setFileName(e.target.value)} placeholder="my-document.pdf" />
          </div>
          <div className="flex justify-end gap-3">
            <button onClick={() => setShowUpload(false)} className="btn-secondary">Cancel</button>
            <button onClick={handleUpload} disabled={!fileUrl || uploading} className="btn-primary">
              {uploading ? 'Uploading…' : 'Upload document'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
