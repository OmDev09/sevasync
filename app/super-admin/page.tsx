'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Profile, Need, Task } from '@/lib/supabase/database.types';

export default function SuperAdminDashboard() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [needs, setNeeds] = useState<Need[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      const [pRes, nRes, tRes] = await Promise.all([
        supabase.from('profiles').select('*'),
        supabase.from('needs').select('*'),
        supabase.from('tasks').select('*'),
      ]);
      setProfiles(pRes.data || []);
      setNeeds(nRes.data || []);
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

  const admins = profiles.filter(p => p.role === 'admin');
  const volunteers = profiles.filter(p => p.role === 'volunteer');
  const activeTasks = tasks.filter(t => t.status !== 'completed' && t.status !== 'cancelled');
  const completedTasks = tasks.filter(t => t.status === 'completed');
  const criticalTasks = tasks.filter(t => t.priority === 'critical');

  const completionRate = tasks.length > 0 ? Math.round((completedTasks.length / tasks.length) * 100) : 0;

  const pendingNeeds = needs.filter(n => n.status !== 'resolved');
  const criticalNeeds = needs.filter(n => n.severity === 'critical');

  const regionsCovered = new Set(profiles.map(p => p.region).filter(Boolean));

  // Dynamic Activity mapping
  const ACTIVITY = [
    { icon: '🙋', color: 'var(--brand-primary-light)', text: `Community expanded: ${volunteers.length} total volunteers tracked`, time: 'System Core' },
    { icon: '✅', color: 'var(--low)', text: `Total operations: ${tasks.length} total tasks registered globally`, time: 'System Core' },
    { icon: '🆘', color: 'var(--critical)', text: `Current crisis levels: ${criticalNeeds.length} critical needs identified`, time: 'AI Analysis' },
  ];

  // Dynamic Regional Needs
  const regionalGroups = needs.reduce((acc, n) => {
    const loc = n.location || 'Unknown';
    if (!acc[loc]) acc[loc] = { total: 0, critical: 0, high: 0 };
    acc[loc].total++;
    if (n.severity === 'critical') acc[loc].critical++;
    else if (n.severity === 'high') acc[loc].high++;
    return acc;
  }, {} as Record<string, { total: number; critical: number; high: number }>);

  const regionRows = Object.entries(regionalGroups)
    .sort((a, b) => b[1].total - a[1].total)
    .slice(0, 5)
    .map(([loc, stats]) => {
      let pct = Math.round((stats.critical / stats.total) * 100) || 10;
      if (pct > 100) pct = 100;
      const level = pct > 50 ? 'critical' : pct > 25 ? 'high' : pct > 10 ? 'medium' : 'low';
      return { region: loc, pct, level };
    });

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="page-header">
        <div className="page-header-top">
          <div>
            <h1 className="page-title font-display">Platform Overview</h1>
            <p className="page-subtitle">Real-time view across all regions and administrators</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="btn btn-secondary btn-sm" id="sa-export-btn" onClick={fetchData}>🔄 Refresh Data</button>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-4 stagger" style={{ marginBottom: 28 }}>
        {[
          { icon: '🛠️', label: 'Total Admins', value: loading ? '—' : admins.length, change: 'Active oversight', up: true, color: 'rgba(99,102,241,0.15)' },
          { icon: '🙋', label: 'Total Volunteers', value: loading ? '—' : volunteers.length, change: 'Mobilized', up: true, color: 'rgba(6,182,212,0.15)' },
          { icon: '✅', label: 'Active Tasks', value: loading ? '—' : activeTasks.length, change: `${criticalTasks.length} critical`, up: false, color: 'rgba(239,68,68,0.12)' },
          { icon: '📊', label: 'Completion Rate', value: loading ? '—' : `${completionRate}%`, change: `${completedTasks.length} resolved`, up: true, color: 'rgba(16,185,129,0.12)' },
          { icon: '🆘', label: 'Pending Needs', value: loading ? '—' : pendingNeeds.length, change: `${criticalNeeds.length} critical`, up: false, color: 'rgba(249,115,22,0.12)' },
          { icon: '🌍', label: 'Regions Covered', value: loading ? '—' : regionsCovered.size, change: 'Protected zones', up: true, color: 'rgba(245,158,11,0.12)' },
        ].map((s) => (
          <div key={s.label} className="stat-card animate-fade-in">
            <div className="flex items-center justify-between">
              <span className="stat-label">{s.label}</span>
              <div className="stat-icon" style={{ background: s.color }}>{s.icon}</div>
            </div>
            <div className="stat-value">{s.value}</div>
            <div className={`stat-change${s.up ? '' : ' down'}`}>
              {s.change}
            </div>
          </div>
        ))}
      </div>

      {/* Bottom section: Admins table + Activity feed */}
      <div className="grid grid-cols-2 gap-6" style={{ alignItems: 'start' }}>

        {/* Admins Table */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="h3">Admin Directory</h2>
          </div>
          <div className="table-wrapper text-sm">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Admin</th>
                  <th>Region</th>
                  <th>Volunteers</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={4} className="text-center py-4 text-muted">Loading administrators...</td></tr>
                ) : admins.length === 0 ? (
                  <tr><td colSpan={4} className="text-center py-4 text-muted">No admins found.</td></tr>
                ) : admins.map((a) => {
                  const adminVols = volunteers.filter(v => v.admin_id === a.id).length;
                  return (
                    <tr key={a.id}>
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="avatar avatar-sm">
                            {a.name.split(' ').map(n => n[0]).join('')}
                          </div>
                          <span style={{ fontWeight: 500 }}>{a.name}</span>
                        </div>
                      </td>
                      <td style={{ color: 'var(--text-secondary)' }}>{a.region || 'Unassigned'}</td>
                      <td>{adminVols}</td>
                      <td>
                        <span className={`badge badge-low`}>
                          Active
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Activity Feed */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="h3">System Activity</h2>
          </div>
          <div className="card" style={{ padding: '8px 16px' }}>
            {ACTIVITY.map((a, i) => (
              <div key={i} className="activity-item">
                <div className="activity-dot" style={{ background: a.color }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.875rem', color: 'var(--text-primary)' }}>{a.text}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>{a.time}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Regional breakdown */}
          <div style={{ marginTop: 20 }}>
            <h3 className="h4" style={{ marginBottom: 14 }}>Regional Need Severity (Top 5)</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {loading ? (
                <div className="text-sm text-secondary">Analyzing regional data...</div>
              ) : regionRows.length === 0 ? (
                <div className="text-sm text-secondary">No regional data available yet.</div>
              ) : regionRows.map((r) => (
                <div key={r.region}>
                  <div className="flex items-center justify-between" style={{ marginBottom: 4 }}>
                    <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>{r.region}</span>
                    <span className={`badge badge-${r.level}`} style={{ fontSize: '0.7rem' }}>{r.pct}% severity density</span>
                  </div>
                  <div className="progress-bar">
                    <div
                      className="progress-fill"
                      style={{
                        width: `${r.pct}%`,
                        background: r.level === 'critical' ? 'var(--critical)'
                          : r.level === 'high' ? 'var(--high)'
                            : r.level === 'medium' ? 'var(--medium)'
                              : 'linear-gradient(90deg, var(--brand-primary), var(--brand-accent))',
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
