'use client';

const SA_STATS = [
  { icon: '🛠️', label: 'Total Admins', value: '24', change: '+2 this month', up: true, color: 'rgba(99,102,241,0.15)' },
  { icon: '🙋', label: 'Total Volunteers', value: '1,248', change: '+38 this month', up: true, color: 'rgba(6,182,212,0.15)' },
  { icon: '✅', label: 'Active Tasks', value: '342', change: '28 critical', up: false, color: 'rgba(239,68,68,0.12)' },
  { icon: '📊', label: 'Completion Rate', value: '87%', change: '+3% vs last week', up: true, color: 'rgba(16,185,129,0.12)' },
  { icon: '🆘', label: 'Pending Needs', value: '89', change: '12 critical', up: false, color: 'rgba(249,115,22,0.12)' },
  { icon: '🌍', label: 'Regions Covered', value: '18', change: '+1 this month', up: true, color: 'rgba(245,158,11,0.12)' },
];

const ADMINS = [
  { name: 'Priya Sharma', region: 'Mumbai North', volunteers: 42, tasks: 18, status: 'active' },
  { name: 'Arjun Menon', region: 'Bangalore Central', volunteers: 35, tasks: 12, status: 'active' },
  { name: 'Kavya Reddy', region: 'Chennai South', volunteers: 28, tasks: 24, status: 'active' },
  { name: 'Rohit Joshi', region: 'Delhi NCR', volunteers: 67, tasks: 31, status: 'busy' },
  { name: 'Sneha Kulkarni', region: 'Pune West', volunteers: 19, tasks: 8, status: 'active' },
];

const ACTIVITY = [
  { icon: '✅', color: 'var(--low)', text: 'Admin Priya created 3 new tasks in Mumbai', time: '2 min ago' },
  { icon: '🆘', color: 'var(--critical)', text: 'Critical need reported: Medical aid — Dharavi', time: '11 min ago' },
  { icon: '🙋', color: 'var(--brand-primary-light)', text: 'New volunteer onboarded: Rahul Gupta (Bangalore)', time: '23 min ago' },
  { icon: '📊', color: 'var(--brand-accent)', text: 'Monthly report generated for Q1 2026', time: '1 hr ago' },
  { icon: '✅', color: 'var(--low)', text: '12 tasks completed in Chennai region', time: '2 hr ago' },
  { icon: '⚠️', color: 'var(--high)', text: 'Admin Rohit reported resource shortage in Delhi', time: '3 hr ago' },
];

export default function SuperAdminDashboard() {
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
            <button className="btn btn-secondary btn-sm" id="sa-export-btn">📥 Export Report</button>
            <button className="btn btn-primary btn-sm" id="sa-create-admin-btn">+ Add Admin</button>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-4 stagger" style={{ marginBottom: 28 }}>
        {SA_STATS.map((s) => (
          <div key={s.label} className="stat-card animate-fade-in">
            <div className="flex items-center justify-between">
              <span className="stat-label">{s.label}</span>
              <div className="stat-icon" style={{ background: s.color }}>{s.icon}</div>
            </div>
            <div className="stat-value">{s.value}</div>
            <div className={`stat-change${s.up ? '' : ' down'}`}>
              {s.up ? '↑' : '↓'} {s.change}
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
            <button className="btn btn-ghost btn-sm" id="sa-view-all-admins-btn">View all →</button>
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
                </tr>
              </thead>
              <tbody>
                {ADMINS.map((a) => (
                  <tr key={a.name}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="avatar avatar-sm">
                          {a.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <span style={{ fontWeight: 500 }}>{a.name}</span>
                      </div>
                    </td>
                    <td style={{ color: 'var(--text-secondary)' }}>{a.region}</td>
                    <td>{a.volunteers}</td>
                    <td>{a.tasks}</td>
                    <td>
                      <span className={`badge ${a.status === 'busy' ? 'badge-high' : 'badge-low'}`}>
                        {a.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Activity Feed */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="h3">System Activity</h2>
            <button className="btn btn-ghost btn-sm" id="sa-view-all-activity-btn">View all →</button>
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
            <h3 className="h4" style={{ marginBottom: 14 }}>Regional Need Severity</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { region: 'Mumbai', pct: 78, level: 'critical' },
                { region: 'Delhi NCR', pct: 65, level: 'high' },
                { region: 'Chennai', pct: 52, level: 'medium' },
                { region: 'Bangalore', pct: 38, level: 'low' },
                { region: 'Pune', pct: 22, level: 'low' },
              ].map((r) => (
                <div key={r.region}>
                  <div className="flex items-center justify-between" style={{ marginBottom: 4 }}>
                    <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>{r.region}</span>
                    <span className={`badge badge-${r.level}`} style={{ fontSize: '0.7rem' }}>{r.pct}%</span>
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
