'use client';

import { useState } from 'react';

const ADMINS = [
  { id: 'A001', name: 'Priya Sharma', email: 'priya@sevasync.com', region: 'Mumbai North', volunteers: 42, tasks: 18, status: 'active', joined: '12 Jan 2026', lastActive: '2 min ago' },
  { id: 'A002', name: 'Arjun Menon', email: 'arjun@sevasync.com', region: 'Bangalore Central', volunteers: 35, tasks: 12, status: 'active', joined: '5 Feb 2026', lastActive: '1 hr ago' },
  { id: 'A003', name: 'Kavya Reddy', email: 'kavya@sevasync.com', region: 'Chennai South', volunteers: 28, tasks: 24, status: 'active', joined: '20 Feb 2026', lastActive: '30 min ago' },
  { id: 'A004', name: 'Rohit Joshi', email: 'rohit@sevasync.com', region: 'Delhi NCR', volunteers: 67, tasks: 31, status: 'inactive', joined: '8 Jan 2026', lastActive: '2 days ago' },
  { id: 'A005', name: 'Sneha Kulkarni', email: 'sneha@sevasync.com', region: 'Pune West', volunteers: 19, tasks: 8, status: 'active', joined: '1 Mar 2026', lastActive: '5 min ago' },
  { id: 'A006', name: 'Vikram Nair', email: 'vikram@sevasync.com', region: 'Hyderabad East', volunteers: 31, tasks: 15, status: 'active', joined: '15 Mar 2026', lastActive: '20 min ago' },
];

type Admin = typeof ADMINS[0];

export default function AdminsManagementPage() {
  const [showModal, setShowModal] = useState(false);
  const [selected, setSelected] = useState<Admin | null>(null);
  const [search, setSearch] = useState('');

  const filtered = ADMINS.filter(a =>
    !search || a.name.toLowerCase().includes(search.toLowerCase()) || a.region.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div className="page-header-top">
          <div>
            <h1 className="page-title font-display">Admin Management</h1>
            <p className="page-subtitle">{ADMINS.length} administrators · {ADMINS.filter(a => a.status === 'active').length} active</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="btn btn-secondary btn-sm" id="sa-admins-export-btn">📥 Export</button>
            <button className="btn btn-primary btn-sm" id="sa-admins-create-btn" onClick={() => setShowModal(true)}>+ Create Admin</button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 stagger" style={{ marginBottom: 24 }}>
        {[
          { label: 'Total Admins', val: ADMINS.length, icon: '🛠️', color: 'rgba(99,102,241,0.15)' },
          { label: 'Active', val: ADMINS.filter(a => a.status === 'active').length, icon: '🟢', color: 'rgba(16,185,129,0.12)' },
          { label: 'Total Regions', val: ADMINS.length, icon: '🌍', color: 'rgba(6,182,212,0.12)' },
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
              <th>Last Active</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(a => (
              <tr key={a.id}>
                <td>
                  <div className="flex items-center gap-3">
                    <div className="avatar avatar-sm">{a.name.split(' ').map(n => n[0]).join('')}</div>
                    <div>
                      <div style={{ fontWeight: 600 }}>{a.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{a.email}</div>
                    </div>
                  </div>
                </td>
                <td style={{ color: 'var(--text-secondary)' }}>{a.region}</td>
                <td style={{ fontWeight: 600 }}>{a.volunteers}</td>
                <td>{a.tasks}</td>
                <td style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>{a.lastActive}</td>
                <td>
                  <span className={`badge badge-${a.status === 'active' ? 'low' : 'muted'}`}>{a.status}</span>
                </td>
                <td>
                  <div className="flex items-center gap-2">
                    <button className="btn btn-ghost btn-sm" id={`sa-view-admin-${a.id}-btn`} onClick={() => setSelected(a)}>View</button>
                    <button className="btn btn-danger btn-sm" id={`sa-toggle-admin-${a.id}-btn`}>{a.status === 'active' ? 'Deactivate' : 'Activate'}</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Admin Detail Panel */}
      {selected && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', justifyContent: 'flex-end' }}
          onClick={e => { if (e.target === e.currentTarget) setSelected(null); }}>
          <div className="animate-fade-in" style={{ width: 400, background: 'var(--bg-surface)', borderLeft: '1px solid var(--bg-border)', padding: 28, overflowY: 'auto' }}>
            <div className="flex items-center justify-between" style={{ marginBottom: 24 }}>
              <h2 className="h3">Admin Profile</h2>
              <button className="btn btn-ghost btn-sm" onClick={() => setSelected(null)} id="sa-admin-profile-close">✕</button>
            </div>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div className="avatar" style={{ width: 64, height: 64, fontSize: '1.25rem', margin: '0 auto 12px' }}>{selected.name.split(' ').map((n: string) => n[0]).join('')}</div>
              <div style={{ fontWeight: 700, fontSize: '1.0625rem' }}>{selected.name}</div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>{selected.email}</div>
              <span className={`badge badge-${selected.status === 'active' ? 'low' : 'muted'}`} style={{ marginTop: 10, display: 'inline-flex' }}>{selected.status}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[['Region', selected.region], ['Joined', selected.joined], ['Last Active', selected.lastActive], ['Volunteers', String(selected.volunteers)], ['Active Tasks', String(selected.tasks)]].map(([k, v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--bg-border)' }}>
                  <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>{k}</span>
                  <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)' }}>{v}</span>
                </div>
              ))}
            </div>
            <div className="flex flex-col gap-3" style={{ marginTop: 24 }}>
              <button className="btn btn-primary" id="sa-admin-profile-message">💬 Send Message</button>
              <button className="btn btn-danger btn-sm" id="sa-admin-profile-deactivate">Deactivate Account</button>
            </div>
          </div>
        </div>
      )}

      {/* Create Admin Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
          onClick={e => { if (e.target === e.currentTarget) setShowModal(false); }}>
          <div className="card animate-fade-in" style={{ width: '100%', maxWidth: 460 }}>
            <div className="flex items-center justify-between" style={{ marginBottom: 24 }}>
              <h2 className="h3 font-display">Create Admin Account</h2>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowModal(false)} id="sa-create-admin-close">✕</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {[
                { label: 'Full Name *', id: 'new-admin-name', placeholder: 'Admin full name' },
                { label: 'Email *', id: 'new-admin-email', placeholder: 'admin@sevasync.com' },
                { label: 'Phone', id: 'new-admin-phone', placeholder: '+91 XXXXX XXXXX' },
              ].map(f => (
                <div key={f.id} className="form-group">
                  <label className="form-label">{f.label}</label>
                  <input className="form-input" id={f.id} placeholder={f.placeholder} />
                </div>
              ))}
              <div className="form-group">
                <label className="form-label">Region / Organization *</label>
                <input className="form-input" id="new-admin-region" placeholder="e.g. Mumbai North" />
              </div>
              <button className="btn btn-primary" id="sa-create-admin-submit-btn" onClick={() => setShowModal(false)}>Create Admin Account</button>
              <button className="btn btn-secondary" onClick={() => setShowModal(false)} id="sa-create-admin-cancel">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
