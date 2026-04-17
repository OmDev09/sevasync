'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

type VolunteerProfile = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  region: string | null;
  skills: string[];
  status: string;
  joined_at: string;
};

const STATUS_CONFIG: Record<string, { color: string; label: string; dotClass: string }> = {
  active: { color: 'var(--low)', label: 'Active', dotClass: 'dot-online' },
  busy: { color: 'var(--high)', label: 'Busy', dotClass: 'dot-busy' },
  inactive: { color: 'var(--text-muted)', label: 'Inactive', dotClass: 'dot-offline' },
};

export default function VolunteersPage() {
  const { user } = useAuth();
  const { success, error: toastError } = useToast();
  const router = useRouter();

  const [volunteers, setVolunteers] = useState<VolunteerProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedVol, setSelectedVol] = useState<VolunteerProfile | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [form, setForm] = useState({ name: '', email: '', phone: '', location: '', skills: '' });
  const [creating, setCreating] = useState(false);

  const fetchVolunteers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/volunteers');
      const data = await res.json();
      setVolunteers(data.volunteers || []);
    } catch {
      toastError('Failed to load volunteers');
    } finally {
      setLoading(false);
    }
  }, [toastError]);

  useEffect(() => { if (user) fetchVolunteers(); }, [user, fetchVolunteers]);

  const filtered = volunteers.filter(v => {
    if (statusFilter !== 'All' && v.status !== statusFilter.toLowerCase()) return false;
    if (search && !v.name.toLowerCase().includes(search.toLowerCase()) && !(v.region || '').toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const handleCreate = async () => {
    if (!form.name || !form.email) {
      toastError('Validation', 'Name and email are required.');
      return;
    }
    setCreating(true);
    try {
      const res = await fetch('/api/volunteers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          phone: form.phone || null,
          region: form.location || null,
          skills: form.skills.split(',').map(s => s.trim()).filter(Boolean),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create volunteer');
      setShowModal(false);
      setForm({ name: '', email: '', phone: '', location: '', skills: '' });
      setVolunteers(prev => [data.volunteer, ...prev]);
      success(
        'Volunteer Onboarded ✅',
        `${data.volunteer.name} added. Temp password: ${data.credentials.temporaryPassword}`
      );
    } catch (e: unknown) {
      toastError('Failed to create volunteer', e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div className="page-header-top">
          <div>
            <h1 className="page-title font-display">Volunteer Management</h1>
            <p className="page-subtitle">
              {loading ? 'Loading...' : `${volunteers.length} volunteers · ${volunteers.filter(v => v.status === 'active').length} active`}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button className="btn btn-secondary btn-sm" id="vol-refresh-btn" onClick={fetchVolunteers}>🔄 Refresh</button>
            <button className="btn btn-primary btn-sm" id="vol-add-btn" onClick={() => setShowModal(true)}>+ Onboard Volunteer</button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 stagger" style={{ marginBottom: 24 }}>
        {[
          { label: 'Total', value: volunteers.length, icon: '🙋', color: 'rgba(99,102,241,0.15)' },
          { label: 'Active', value: volunteers.filter(v => v.status === 'active').length, icon: '🟢', color: 'rgba(16,185,129,0.12)' },
          { label: 'Busy', value: volunteers.filter(v => v.status === 'busy').length, icon: '🟠', color: 'rgba(249,115,22,0.12)' },
          { label: 'Inactive', value: volunteers.filter(v => v.status === 'inactive').length, icon: '⚫', color: 'rgba(100,100,100,0.12)' },
        ].map(s => (
          <div key={s.label} className="stat-card animate-fade-in">
            <div className="flex items-center justify-between">
              <span className="stat-label">{s.label}</span>
              <div className="stat-icon" style={{ background: s.color }}>{s.icon}</div>
            </div>
            <div className="stat-value">{loading ? '—' : s.value}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="card" style={{ padding: '14px 20px', marginBottom: 20 }}>
        <div className="flex items-center gap-3" style={{ flexWrap: 'wrap' }}>
          <input
            className="form-input" style={{ maxWidth: 260 }}
            placeholder="🔍 Search by name or region..."
            value={search} onChange={e => setSearch(e.target.value)}
            id="vol-search-input"
          />
          {['All', 'Active', 'Busy', 'Inactive'].map(s => (
            <button key={s} id={`vol-filter-${s.toLowerCase()}-btn`}
              onClick={() => setStatusFilter(s)} className="btn btn-sm"
              style={{
                background: statusFilter === s ? 'rgba(99,102,241,0.15)' : 'transparent',
                color: statusFilter === s ? 'var(--brand-primary-light)' : 'var(--text-secondary)',
                border: `1px solid ${statusFilter === s ? 'rgba(99,102,241,0.3)' : 'var(--bg-border)'}`,
              }}
            >{s}</button>
          ))}
        </div>
      </div>

      {/* Volunteer Cards */}
      {loading ? (
        <div className="grid grid-cols-2 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="card" style={{ padding: 24, opacity: 0.4 }}>
              <div style={{ height: 48, width: 48, borderRadius: '50%', background: 'var(--bg-elevated)', marginBottom: 16 }} />
              <div style={{ height: 16, width: '50%', background: 'var(--bg-elevated)', borderRadius: 4, marginBottom: 8 }} />
              <div style={{ height: 12, width: '30%', background: 'var(--bg-elevated)', borderRadius: 4 }} />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 stagger">
          {filtered.map(v => {
            const sc = STATUS_CONFIG[v.status] || STATUS_CONFIG.active;
            const joinDate = new Date(v.joined_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
            return (
              <div key={v.id} className="card animate-fade-in" style={{ padding: '20px' }}>
                <div className="flex items-start gap-4">
                  <div className="avatar avatar-lg" style={{ width: 52, height: 52, fontSize: '1.125rem', flexShrink: 0 }}>
                    {v.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="flex items-center justify-between gap-2">
                      <div style={{ fontWeight: 700, fontSize: '0.9375rem' }}>{v.name}</div>
                      <div className="flex items-center gap-2">
                        <div className={`dot ${sc.dotClass}`} />
                        <span style={{ fontSize: '0.75rem', color: sc.color, fontWeight: 600 }}>{sc.label}</span>
                      </div>
                    </div>
                    <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: 2 }}>📍 {v.region || 'No region'}</div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
                      {(v.skills || []).map(s => (
                        <span key={s} className="badge badge-brand" style={{ fontSize: '0.7rem' }}>{s}</span>
                      ))}
                      {(!v.skills || v.skills.length === 0) && <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>No skills listed</span>}
                    </div>
                  </div>
                </div>
                <div className="divider" />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, textAlign: 'center', marginBottom: 14 }}>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Email</div>
                    <div style={{ fontSize: '0.8125rem', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis' }}>{v.email}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Joined</div>
                    <div style={{ fontSize: '0.8125rem', color: 'var(--text-primary)' }}>{joinDate}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    className="btn btn-primary btn-sm"
                    id={`vol-assign-${v.id}-btn`}
                    style={{ flex: 1 }}
                    onClick={() => router.push(`/admin/tasks?openCreate=1&volunteer_id=${encodeURIComponent(v.id)}`)}
                  >
                    Assign Task
                  </button>
                  <button className="btn btn-ghost btn-sm" id={`vol-view-${v.id}-btn`} onClick={() => setSelectedVol(v)}>View</button>
                  <button
                    className="btn btn-ghost btn-sm"
                    id={`vol-message-${v.id}-btn`}
                    onClick={() => toastError('Messaging not connected yet', 'Use the Messages page while chat wiring is still pending.')}
                  >
                    💬
                  </button>
                </div>
              </div>
            );
          })}
          {filtered.length === 0 && (
            <div className="empty-state" style={{ gridColumn: '1/-1' }}>
              <div className="empty-icon">🙋</div>
              <p className="text-secondary">
                {volunteers.length === 0 ? 'No volunteers yet. Onboard your first volunteer above!' : 'No volunteers match your filters.'}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Profile Side Panel */}
      {selectedVol && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', justifyContent: 'flex-end' }}
          onClick={e => { if (e.target === e.currentTarget) setSelectedVol(null); }}
        >
          <div className="animate-fade-in" style={{ width: 380, background: 'var(--bg-surface)', borderLeft: '1px solid var(--bg-border)', padding: 28, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div className="flex items-center justify-between">
              <h2 className="h3">Volunteer Profile</h2>
              <button className="btn btn-ghost btn-sm" onClick={() => setSelectedVol(null)} id="vol-profile-close-btn">✕</button>
            </div>
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div className="avatar" style={{ width: 72, height: 72, fontSize: '1.5rem', margin: '0 auto 12px' }}>
                {selectedVol.name.split(' ').map(n => n[0]).join('')}
              </div>
              <div style={{ fontWeight: 700, fontSize: '1.125rem' }}>{selectedVol.name}</div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: 4 }}>{selectedVol.region || 'No region'}</div>
              <span className={`badge badge-${selectedVol.status === 'active' ? 'low' : selectedVol.status === 'busy' ? 'high' : 'muted'}`} style={{ marginTop: 10, display: 'inline-flex' }}>
                {selectedVol.status}
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { label: 'Email', val: selectedVol.email, icon: '📧' },
                { label: 'Phone', val: selectedVol.phone || 'Not provided', icon: '📱' },
                { label: 'Joined', val: new Date(selectedVol.joined_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }), icon: '📅' },
              ].map(f => (
                <div key={f.label}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 2 }}>{f.label}</div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--text-primary)' }}>{f.icon} {f.val}</div>
                </div>
              ))}
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 8 }}>Skills</div>
                <div className="flex gap-2" style={{ flexWrap: 'wrap' }}>
                  {(selectedVol.skills || []).map(s => <span key={s} className="badge badge-brand">{s}</span>)}
                  {(!selectedVol.skills || selectedVol.skills.length === 0) && <span style={{ color: 'var(--text-muted)', fontSize: '0.8125rem' }}>None listed</span>}
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <button
                className="btn btn-primary"
                id="vol-profile-assign-btn"
                onClick={() => router.push(`/admin/tasks?openCreate=1&volunteer_id=${encodeURIComponent(selectedVol.id)}`)}
              >
                Assign New Task
              </button>
              <button
                className="btn btn-secondary"
                id="vol-profile-message-btn"
                onClick={() => toastError('Messaging not connected yet', 'Use the Messages page while chat wiring is still pending.')}
              >
                💬 Message
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Onboard Volunteer Modal */}
      {showModal && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
          onClick={e => { if (e.target === e.currentTarget) setShowModal(false); }}
        >
          <div className="card animate-fade-in" style={{ width: '100%', maxWidth: 480 }}>
            <div className="flex items-center justify-between" style={{ marginBottom: 24 }}>
              <h2 className="h3 font-display">Onboard Volunteer</h2>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowModal(false)} id="vol-modal-close-btn">✕</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {[
                { label: 'Full Name *', key: 'name', placeholder: 'e.g. Rahul Gupta', id: 'new-vol-name' },
                { label: 'Email *', key: 'email', placeholder: 'rahul@email.com', id: 'new-vol-email' },
                { label: 'Phone', key: 'phone', placeholder: '+91 XXXXX XXXXX', id: 'new-vol-phone' },
                { label: 'Location', key: 'location', placeholder: 'Area, City', id: 'new-vol-location' },
                { label: 'Skills (comma separated)', key: 'skills', placeholder: 'e.g. Medical, Transport', id: 'new-vol-skills' },
              ].map(f => (
                <div key={f.key} className="form-group">
                  <label className="form-label">{f.label}</label>
                  <input className="form-input" id={f.id} placeholder={f.placeholder}
                    value={(form as Record<string, string>)[f.key]}
                    onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} />
                </div>
              ))}
              <div style={{ background: 'rgba(6,182,212,0.08)', border: '1px solid rgba(6,182,212,0.2)', borderRadius: 'var(--radius-sm)', padding: '10px 14px', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                🔑 A temporary password will be auto-generated and sent to the volunteer&apos;s email.
              </div>
              <div className="flex gap-3" style={{ marginTop: 8 }}>
                <button className="btn btn-primary" id="vol-create-btn" onClick={handleCreate} disabled={creating} style={{ flex: 1 }}>
                  {creating ? '⟳ Creating...' : 'Create Account'}
                </button>
                <button className="btn btn-secondary" onClick={() => setShowModal(false)} id="vol-cancel-btn">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
