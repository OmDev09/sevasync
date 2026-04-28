'use client';

import { useState, useEffect } from 'react';
import { useToast } from '../../context/ToastContext';

export default function ApplicationsPage() {
  const [apps, setApps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { success: toastSuccess, error: toastError } = useToast();

  useEffect(() => {
    fetch('/api/applications')
      .then(res => res.json())
      .then(data => { setApps(data.applications || []); setLoading(false); })
      .catch(() => { toastError('Failed to load applications'); setLoading(false); });
  }, []);

  const handleAction = async (id: string, status: 'accepted' | 'rejected') => {
    try {
      const res = await fetch('/api/applications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status })
      });
      if (!res.ok) throw new Error();
      setApps(prev => prev.map(a => a.id === id ? { ...a, status } : a));
      
      if (status === 'accepted') {
        toastSuccess('Application accepted! Notification email sent to applicant.');
      } else {
        toastSuccess('Application rejected.');
      }
    } catch {
      toastError('Action failed');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to permanently delete this application?')) return;
    try {
      const res = await fetch('/api/applications', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      if (!res.ok) throw new Error();
      setApps(prev => prev.filter(a => a.id !== id));
      toastSuccess('Application deleted permanently.');
    } catch {
      toastError('Failed to delete application.');
    }
  };

  if (loading) return <div style={{ padding: 24 }}>Loading applications...</div>;

  return (
    <div style={{ padding: 24, maxWidth: 1000, margin: '0 auto' }}>
      <div style={{ marginBottom: 32 }}>
        <h1 className="h3" style={{ marginBottom: 8 }}>Role Applications</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Review and verify people applying to be Volunteers or Admins from the landing page.</p>
      </div>

      {apps.length === 0 ? (
        <div className="glass-card" style={{ padding: 60, textAlign: 'center', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>📩</div>
          No applications pending at the moment.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {apps.map(app => (
            <div key={app.id} className="glass-card" style={{ padding: 20, borderLeft: `4px solid ${app.role === 'admin' ? 'var(--brand-accent)' : 'var(--brand-primary)'}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
                <div style={{ flex: 1, minWidth: 300 }}>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 12 }}>
                    <h3 style={{ margin: 0, fontSize: '1.25rem' }}>{app.name}</h3>
                    <span className="badge" style={{ background: app.role === 'admin' ? 'rgba(244,156,39,0.1)' : 'rgba(18,154,156,0.1)', color: app.role === 'admin' ? 'var(--brand-accent)' : 'var(--brand-primary)' }}>
                      {app.role === 'admin' ? 'Admin Applicant' : 'Volunteer Applicant'}
                    </span>
                    <span className="badge" style={{ background: app.status === 'pending' ? 'var(--bg-elevated)' : app.status === 'accepted' ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)', color: app.status === 'pending' ? 'var(--text-secondary)' : app.status === 'accepted' ? 'var(--low)' : 'var(--high)', fontWeight: 700 }}>
                      {app.status.toUpperCase()}
                    </span>
                  </div>

                  <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', display: 'flex', flexWrap: 'wrap', gap: 16, marginBottom: 16 }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>📧 {app.email}</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>📱 {app.phone}</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>📍 {app.location || app.organization}</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>📅 {new Date(app.created_at).toLocaleDateString()}</span>
                  </div>

                  <div style={{ background: 'var(--bg-base)', border: '1px solid var(--bg-border)', padding: 16, borderRadius: 'var(--radius-md)', fontSize: '0.9375rem', color: 'var(--text-primary)' }}>
                    <div style={{ fontWeight: 600, marginBottom: 6, color: 'var(--text-secondary)', fontSize: '0.8125rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      {app.role === 'admin' ? 'Reason / Use Case' : 'Primary Skills'}
                    </div>
                    {app.reason || app.skills}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 8, flexDirection: 'column', width: 140 }}>
                  {app.status === 'pending' && (
                    <>
                      <button onClick={() => handleAction(app.id, 'accepted')} className="btn btn-primary" style={{ background: 'var(--low)', borderColor: 'var(--low)', width: '100%' }}>Accept & Notify</button>
                      <button onClick={() => handleAction(app.id, 'rejected')} className="btn btn-secondary" style={{ width: '100%' }}>Reject</button>
                    </>
                  )}
                  <button 
                    onClick={() => handleDelete(app.id)} 
                    className="btn btn-ghost btn-sm" 
                    style={{ width: '100%', color: 'var(--high)', marginTop: app.status !== 'pending' ? 0 : 8, border: '1px solid rgba(239,68,68,0.2)' }}
                  >
                    🗑️ Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
