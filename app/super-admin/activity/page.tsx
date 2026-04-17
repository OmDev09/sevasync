'use client';

const ACTIVITY_LOG = [
  { user: 'Priya Sharma', role: 'Admin', action: 'Created task', entity: 'Medical Aid — Dharavi', time: '2 min ago', icon: '✅', color: 'var(--low)' },
  { user: 'Amit Kumar', role: 'Volunteer', action: 'Marked task complete', entity: 'Food camp setup — Kurla', time: '10 min ago', icon: '🏁', color: 'var(--brand-primary-light)' },
  { user: 'Super Admin', role: 'Super Admin', action: 'Created admin account', entity: 'Vikram Nair (Hyderabad East)', time: '25 min ago', icon: '👤', color: 'var(--brand-accent)' },
  { user: 'Rohit Joshi', role: 'Admin', action: 'Reported resource shortage', entity: 'Delhi NCR — Tents & food', time: '1 hr ago', icon: '⚠️', color: 'var(--high)' },
  { user: 'Kavya Reddy', role: 'Admin', action: 'Onboarded volunteer', entity: 'Deepa Rao (Chennai)', time: '2 hr ago', icon: '🙋', color: 'var(--low)' },
  { user: 'System', role: 'System', action: 'AI re-scored needs', entity: '6 needs updated', time: '2 hr ago', icon: '🧠', color: 'var(--brand-primary-light)' },
  { user: 'Sunita Rao', role: 'Volunteer', action: 'Started task', entity: 'Water purification — Andheri', time: '3 hr ago', icon: '▶️', color: 'var(--brand-accent)' },
  { user: 'Arjun Menon', role: 'Admin', action: 'Imported CSV data', entity: '14 needs from survey_march.csv', time: '4 hr ago', icon: '📊', color: 'var(--brand-warm)' },
  { user: 'Super Admin', role: 'Super Admin', action: 'Exported global report', entity: 'Q1 2026 Impact Report', time: '5 hr ago', icon: '📄', color: 'var(--text-secondary)' },
  { user: 'Ravi Mehta', role: 'Volunteer', action: 'Updated task status', entity: 'Shelter Setup — Bandra → In Progress', time: '6 hr ago', icon: '✏️', color: 'var(--medium)' },
];

export default function SAActivityPage() {
  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div className="page-header-top">
          <div>
            <h1 className="page-title font-display">📋 System Activity Log</h1>
            <p className="page-subtitle">Real-time audit trail of all platform actions</p>
          </div>
          <div className="flex items-center gap-3">
            <select className="form-select" style={{ maxWidth: 180 }} id="activity-filter-role">
              <option>All Roles</option>
              <option>Super Admin</option>
              <option>Admin</option>
              <option>Volunteer</option>
              <option>System</option>
            </select>
            <button className="btn btn-secondary btn-sm" id="activity-export-btn">📥 Export Log</button>
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: '8px 0' }}>
        {ACTIVITY_LOG.map((item, i) => (
          <div key={i} className="activity-item" style={{ padding: '14px 20px', gap: 14 }}>
            <div style={{ width: 36, height: 36, borderRadius: 'var(--radius-sm)', background: `${item.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', flexShrink: 0 }}>
              {item.icon}
            </div>
            <div style={{ flex: 1 }}>
              <div className="flex items-center gap-2" style={{ marginBottom: 3, flexWrap: 'wrap' }}>
                <span style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-primary)' }}>{item.user}</span>
                <span className="badge badge-muted" style={{ fontSize: '0.675rem' }}>{item.role}</span>
                <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{item.action}</span>
              </div>
              <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>→ {item.entity}</div>
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', flexShrink: 0 }}>{item.time}</div>
          </div>
        ))}
      </div>
      <div style={{ textAlign: 'center', marginTop: 20 }}>
        <button className="btn btn-secondary" id="activity-load-more-btn">Load More</button>
      </div>
    </div>
  );
}
