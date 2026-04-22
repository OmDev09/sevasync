'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Profile, Task } from '@/lib/supabase/database.types';

export default function AdminsManagementPage() {
  const [showModal, setShowModal] = useState(false);
  const [selected, setSelected] = useState<Profile | null>(null);
  const [search, setSearch] = useState('');

  const [admins, setAdmins] = useState<Profile[]>([]);
  const [volunteers, setVolunteers] = useState<Profile[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  // Create admin states
  const [createData, setCreateData] = useState({ name: '', email: '', phone: '', region: '' });
  const [creating, setCreating] = useState(false);
  const [createResult, setCreateResult] = useState<{ email?: string; tempPassword?: string; error?: string } | null>(null);

  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState({ name: '', phone: '', region: '' });
  const [editing, setEditing] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();
    try {
      const [pRes, tRes] = await Promise.all([
        supabase.from('profiles').select('*'),
        supabase.from('tasks').select('*')
      ]);
      const allProfiles = (pRes.data || []) as Profile[];
      setAdmins(allProfiles.filter(p => p.role === 'admin' || p.role === 'super-admin'));
      setVolunteers(allProfiles.filter(p => p.role === 'volunteer'));
      setTasks(tRes.data || []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCreateAdmin = async () => {
    if (!createData.name || !createData.email || !createData.region) {
      setCreateResult({ error: 'Please set a Name, Email, and Region' });
      return;
    }
    setCreating(true);
    setCreateResult(null);
    try {
      const res = await fetch('/api/admins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(createData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create admin');

      setCreateResult({
        email: data.credentials.email,
        tempPassword: data.credentials.temporaryPassword
      });
      fetchData(); // refresh list
    } catch (err: unknown) {
      if (err instanceof Error) {
        setCreateResult({ error: err.message });
      } else {
        setCreateResult({ error: 'Failed to create admin' });
      }
      setCreating(false);
    }
  };

  const handleEditAdmin = async () => {
    if (!selected) return;
    setEditing(true);
    try {
      const res = await fetch('/api/admins', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: selected.id, ...editData }),
      });
      if (!res.ok) throw new Error('Failed to update');
      const { admin } = await res.json();
      setSelected(admin);
      setEditMode(false);
      fetchData();
    } catch (e: any) {
      alert('Error updating admin: ' + e.message);
    } finally {
      setEditing(false);
    }
  };

  const filtered = admins.filter(a =>
    !search ||
    a.name?.toLowerCase().includes(search.toLowerCase()) ||
    (a.region || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div className="page-header-top">
          <div>
            <h1 className="page-title font-display">Admin Management</h1>
            <p className="page-subtitle">{admins.length} registered administrators</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="btn btn-secondary btn-sm" id="sa-admins-refresh-btn" onClick={fetchData}>🔄 Refresh</button>
            <button className="btn btn-primary btn-sm" id="sa-admins-create-btn" onClick={() => {
              setCreateData({ name: '', email: '', phone: '', region: '' });
              setCreateResult(null);
              setShowModal(true);
            }}>+ Create Admin</button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 stagger" style={{ marginBottom: 24 }}>
        {[
          { label: 'Total Admins', val: loading ? '—' : admins.length, icon: '🛠️', color: 'rgba(99,102,241,0.15)' },
          { label: 'Active', val: loading ? '—' : admins.length, icon: '🟢', color: 'rgba(16,185,129,0.12)' },
          { label: 'Total Regions', val: loading ? '—' : new Set(admins.map(a => a.region).filter(Boolean)).size, icon: '🌍', color: 'rgba(6,182,212,0.12)' },
        ].map(s => (
          <div key={s.label} className="stat-card animate-fade-in">
            <div className="flex items-center justify-between">
              <span className="stat-label">{s.label}</span>
              <div className="stat-icon" style={{ background: s.color }}>{s.icon}</div>
            </div>
            <div className="stat-value">{s.val}</div>
          </div>
        ))}
      </div>

      <div className="card" style={{ padding: '12px 16px', marginBottom: 16 }}>
        <input className="form-input" style={{ maxWidth: 280 }} placeholder="🔍 Search by name or region..." value={search} onChange={e => setSearch(e.target.value)} id="sa-admins-search-input" />
      </div>

      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>Admin</th>
              <th>Region</th>
              <th>Volunteers</th>
              <th>Active Tasks</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="text-center py-4 text-muted">Loading administrators...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-4 text-muted">No administrators found.</td></tr>
            ) : filtered.map(a => {
              const aVols = volunteers.filter(v => v.admin_id === a.id);
              const aTasks = tasks.filter(t => aVols.some(v => v.id === t.volunteer_id) && t.status !== 'completed' && t.status !== 'cancelled');

              return (
                <tr key={a.id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="avatar avatar-sm">{a.name.split(' ').map(n => n[0]).join('')}</div>
                      <div>
                        <div style={{ fontWeight: 600 }}>{a.name} <span className="text-xs text-brand-primary ml-1">{a.role === 'super-admin' && '(Super)'}</span></div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{a.email}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ color: 'var(--text-secondary)' }}>{a.region || '—'}</td>
                  <td style={{ fontWeight: 600 }}>{aVols.length}</td>
                  <td>{aTasks.length}</td>
                  <td>
                    <span className={`badge badge-low`}>Active</span>
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <button className="btn btn-ghost btn-sm" id={`sa-view-admin-${a.id}-btn`} onClick={() => setSelected(a)}>View</button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Admin Detail Panel */}
      {selected && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', justifyContent: 'flex-end' }}
          onClick={e => { if (e.target === e.currentTarget) setSelected(null); }}>
          <div className="animate-fade-in" style={{ width: 400, background: 'var(--bg-surface)', borderLeft: '1px solid var(--bg-border)', padding: 28, overflowY: 'auto' }}>
            <div className="flex items-center justify-between" style={{ marginBottom: 24 }}>
              <h2 className="h3">{editMode ? 'Edit Admin' : 'Admin Profile'}</h2>
              <button className="btn btn-ghost btn-sm" onClick={() => { setSelected(null); setEditMode(false); }}>✕</button>
            </div>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div className="avatar" style={{ width: 64, height: 64, fontSize: '1.25rem', margin: '0 auto 12px' }}>{selected.name.split(' ').map((n: string) => n[0]).join('')}</div>
              <div style={{ fontWeight: 700, fontSize: '1.0625rem' }}>{selected.name}</div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>{selected.email}</div>
              <span className={`badge badge-low`} style={{ marginTop: 10, display: 'inline-flex' }}>Active Role: {selected.role}</span>
            </div>

            {editMode ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input className="form-input" disabled={editing} value={editData.name} onChange={e => setEditData({ ...editData, name: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Phone</label>
                  <input className="form-input" disabled={editing} value={editData.phone} onChange={e => setEditData({ ...editData, phone: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Region</label>
                  <input className="form-input" disabled={editing} value={editData.region} onChange={e => setEditData({ ...editData, region: e.target.value })} />
                </div>
                <div className="flex gap-2" style={{ marginTop: 10 }}>
                  <button className="btn btn-primary" style={{ flex: 1 }} disabled={editing} onClick={handleEditAdmin}>
                    {editing ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button className="btn btn-secondary" disabled={editing} onClick={() => setEditMode(false)}>Cancel</button>
                </div>
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {[['Region', selected.region || '—'], ['Phone', selected.phone || '—'], ['Joined At', new Date(selected.joined_at || '').toLocaleDateString()]].map(([k, v]) => (
                    <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--bg-border)' }}>
                      <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>{k}</span>
                      <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)' }}>{v}</span>
                    </div>
                  ))}
                </div>
                <div className="flex flex-col gap-3" style={{ marginTop: 24 }}>
                  <button className="btn btn-secondary btn-sm" onClick={() => {
                    setEditData({ name: selected.name, phone: selected.phone || '', region: selected.region || '' });
                    setEditMode(true);
                  }}>✎ Edit Details</button>
                  <button className="btn btn-danger btn-sm" onClick={() => alert('Feature coming soon: Requires user deletion in Auth block')}>Deactivate User</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Create Admin Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
          onClick={e => { if (e.target === e.currentTarget && !creating) setShowModal(false); }}>
          <div className="card animate-fade-in" style={{ width: '100%', maxWidth: 460 }}>
            <div className="flex items-center justify-between" style={{ marginBottom: 24 }}>
              <h2 className="h3 font-display">Create Admin Account</h2>
              {!creating && <button className="btn btn-ghost btn-sm" onClick={() => setShowModal(false)}>✕</button>}
            </div>

            {createResult?.tempPassword ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div className="card" style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)' }}>
                  <h3 style={{ color: 'var(--low)', marginBottom: 8 }}>✅ Admin created successfully!</h3>
                  <div style={{ fontSize: '0.875rem', marginBottom: 16 }}>Please share these temporary credentials. They will be prompted to change their password on first login.</div>
                  <div style={{ background: 'var(--bg-base)', padding: 12, borderRadius: 4, fontFamily: 'monospace' }}>
                    <div>Email: <span style={{ color: 'var(--text-primary)' }}>{createResult.email}</span></div>
                    <div>Password: <span style={{ color: 'var(--text-primary)' }}>{createResult.tempPassword}</span></div>
                  </div>
                </div>
                <button className="btn btn-primary" onClick={() => setShowModal(false)}>Done</button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {createResult?.error && <div className="text-sm text-critical mb-2">{createResult.error}</div>}

                <div className="form-group">
                  <label className="form-label">Full Name *</label>
                  <input className="form-input" disabled={creating} placeholder="Admin full name" value={createData.name} onChange={e => setCreateData({ ...createData, name: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Email *</label>
                  <input className="form-input" disabled={creating} type="email" placeholder="admin@sevasync.com" value={createData.email} onChange={e => setCreateData({ ...createData, email: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Phone</label>
                  <input className="form-input" disabled={creating} placeholder="+91 XXXXX XXXXX" value={createData.phone} onChange={e => setCreateData({ ...createData, phone: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Region / Organization *</label>
                  <input className="form-input" disabled={creating} placeholder="e.g. Mumbai North" value={createData.region} onChange={e => setCreateData({ ...createData, region: e.target.value })} />
                </div>

                <button className="btn btn-primary" disabled={creating} onClick={handleCreateAdmin}>
                  {creating ? 'Creating...' : 'Create Admin Account'}
                </button>
                <button className="btn btn-secondary" disabled={creating} onClick={() => setShowModal(false)}>Cancel</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
