'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

type Message = {
  id: string;
  from_id: string;
  text: string;
  created_at: string;
};

type Admin = {
  id: string;
  name: string;
  region?: string;
  role: string;
};

export default function SuperAdminReportsPage() {
  const { user } = useAuth();
  const { success, error: toastError } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState<Message[]>([]);
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [viewReport, setViewReport] = useState<Message | null>(null);
  const [requesting, setRequesting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [deleting, setDeleting] = useState(false);

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [msgRes, adminRes] = await Promise.all([
        fetch('/api/messages'),
        fetch('/api/admins')
      ]);
      const msgData = await msgRes.json();
      const adminData = await adminRes.json();
      
      const allMessages = msgData.messages || [];
      const aiReports = allMessages.filter((m: Message) => m.text.startsWith('[AI_REPORT]'));
      
      setReports(aiReports.sort((a: Message, b: Message) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
      setAdmins(adminData.admins || []);
    } catch {
      toastError('Failed to load reports');
    } finally {
      setLoading(false);
    }
  }, [user, toastError]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const getAdminName = (adminId: string) => {
    const a = admins.find(a => a.id === adminId);
    return a ? `${a.name} ${a.region ? `(${a.region})` : ''}` : 'Unknown Admin';
  };

  const handleRequestData = async () => {
    setRequesting(true);
    try {
      const regularAdmins = admins.filter(a => a.role === 'admin');
      if (regularAdmins.length === 0) {
        toastError('No admins found to request data from.');
        return;
      }
      
      const promises = regularAdmins.map(admin => 
        fetch('/api/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to_id: admin.id,
            text: `[REPORT_REQUEST] Please export and send an updated AI Task Report for your region.`,
          })
        })
      );
      
      await Promise.all(promises);
      success('Data Requested ✅', `Sent report requests to ${regularAdmins.length} admins.`);
    } catch {
      toastError('Failed to send requests.');
    } finally {
      setRequesting(false);
    }
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(reports.map(r => r.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.length === 0) return;
    if (!confirm(`Are you sure you want to delete ${selectedIds.length} report(s)?`)) return;
    setDeleting(true);
    try {
      const res = await fetch('/api/messages', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedIds }),
      });
      if (!res.ok) throw new Error('Failed to delete');
      success('Reports Deleted ✅', `${selectedIds.length} reports have been removed.`);
      setSelectedIds([]);
      fetchData();
    } catch {
      toastError('Failed to delete reports');
    } finally {
      setDeleting(false);
    }
  };

  const printHtml = (htmlContent: string) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <html>
        <head>
          <title>Operational Report</title>
          <style>
            body { margin: 0; padding: 20px; background: #f8fafc; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            @media print {
              body { background: white; padding: 0; }
              div { page-break-inside: avoid; }
            }
          </style>
        </head>
        <body>
          ${htmlContent}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 500);
  };

  const handleDownloadSingle = (report: Message) => {
    printHtml(report.text.replace('[AI_REPORT] ', ''));
  };

  const handleDownloadSelected = () => {
    if (selectedIds.length === 0) return;
    const selectedReports = reports.filter(r => selectedIds.includes(r.id));
    const combinedHtml = selectedReports.map(r => `
      <div style="page-break-after: always; padding-bottom: 20px; margin-bottom: 20px;">
        <div style="margin-bottom: 20px; color: #64748b; font-size: 14px; text-align: right; border-bottom: 1px solid #e2e8f0; padding-bottom: 10px;">
           <strong>Admin:</strong> ${getAdminName(r.from_id)} | <strong>Submitted:</strong> ${new Date(r.created_at).toLocaleString()}
        </div>
        ${r.text.replace('[AI_REPORT] ', '')}
      </div>
    `).join('<hr style="border:none; border-top: 2px dashed #cbd5e1; margin: 40px 0;" />');
    
    printHtml(combinedHtml);
  };

  return (
    <>
      <div className="animate-fade-in">
      <div className="page-header">
        <div className="page-header-top">
          <div>
            <h1 className="page-title font-display">Admin Reports</h1>
            <p className="page-subtitle">Collect and review AI-generated task reports from regional admins.</p>
          </div>
          <div className="flex gap-3">
            <button className="btn btn-secondary" onClick={fetchData}>🔄 Refresh</button>
            <button className="btn btn-primary" onClick={handleRequestData} disabled={requesting || loading}>
              {requesting ? '⟳ Sending...' : '📥 Request Data from All Admins'}
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>Loading reports...</div>
      ) : reports.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
          <div style={{ fontSize: '2rem', marginBottom: 16 }}>📭</div>
          <h3 className="h4" style={{ marginBottom: 8 }}>No Reports Received</h3>
          <p className="text-secondary">Click "Request Data" to notify admins to submit their reports.</p>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between" style={{ marginBottom: 20, background: 'var(--bg-card)', padding: '12px 20px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--bg-border)' }}>
            <div className="flex items-center gap-3">
              <input type="checkbox" onChange={handleSelectAll} checked={selectedIds.length === reports.length && reports.length > 0} style={{ width: 18, height: 18, cursor: 'pointer' }} />
              <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>Select All ({selectedIds.length} selected)</span>
            </div>
            {selectedIds.length > 0 && (
              <div className="flex items-center gap-2">
                <button className="btn btn-secondary btn-sm" onClick={handleDownloadSelected}>📄 Download</button>
                <button className="btn btn-primary btn-sm" onClick={handleDeleteSelected} disabled={deleting} style={{ background: 'var(--danger)', borderColor: 'var(--danger)', color: 'black' }}>
                  {deleting ? '⟳' : '🗑️ Delete'}
                </button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {reports.map(r => (
              <div key={r.id} className="card" style={{ display: 'flex', flexDirection: 'column', position: 'relative' }}>
                <div style={{ position: 'absolute', top: 16, right: 16 }}>
                  <input type="checkbox" checked={selectedIds.includes(r.id)} onChange={() => handleSelect(r.id)} style={{ width: 18, height: 18, cursor: 'pointer' }} />
                </div>
                <div style={{ marginBottom: 12, borderBottom: '1px solid var(--bg-border)', paddingBottom: 12, paddingRight: 30 }}>
                  <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: 4 }}>
                    {new Date(r.created_at).toLocaleString()}
                  </div>
                <div style={{ fontWeight: 600, color: 'var(--brand-primary-light)' }}>
                  From: {getAdminName(r.from_id)}
                </div>
              </div>
              <div style={{ flex: 1, fontSize: '0.875rem', color: 'var(--text-primary)', whiteSpace: 'normal', maxHeight: '100px', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: 16 }}>
                {r.text.replace('[AI_REPORT] ', '').replace(/<[^>]+>/g, '').substring(0, 150)}...
              </div>
              <button className="btn btn-secondary w-full" onClick={() => setViewReport(r)}>
                View Full Report
              </button>
            </div>
          ))}
          </div>
        </>
      )}
      </div>

      {/* Report Modal */}
      {viewReport && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
          onClick={e => { if (e.target === e.currentTarget) setViewReport(null); }}
        >
          <div className="card animate-fade-in" style={{ width: '100%', maxWidth: 700, padding: 24, maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
            <div className="flex items-center justify-between" style={{ marginBottom: 16 }}>
              <div>
                <h2 className="h4" style={{ margin: 0 }}>Report from {getAdminName(viewReport.from_id)}</h2>
                <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: 4 }}>
                  Submitted: {new Date(viewReport.created_at).toLocaleString()}
                </div>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => setViewReport(null)}>✕</button>
            </div>
            
            <div style={{ flex: 1, overflowY: 'auto', background: '#e2e8f0', borderRadius: 'var(--radius-sm)', padding: 16, marginBottom: 16, border: '1px solid var(--bg-border)' }}>
              <div dangerouslySetInnerHTML={{ __html: viewReport.text.replace('[AI_REPORT] ', '') }} />
            </div>

            <button className="btn btn-secondary w-full" onClick={() => handleDownloadSingle(viewReport)}>
              📄 Download as PDF
            </button>
          </div>
        </div>
      )}
    </>
  );
}
