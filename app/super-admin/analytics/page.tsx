'use client';

export default function SAAnalyticsPage() {
  const weekData = [42, 58, 51, 70, 63, 89, 75];
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div className="page-header-top">
          <div>
            <h1 className="page-title font-display">📈 Global Analytics</h1>
            <p className="page-subtitle">Platform-wide performance across all regions</p>
          </div>
          <div className="flex items-center gap-3">
            <select className="form-select" style={{ maxWidth: 160 }} id="sa-analytics-period"><option>This Week</option><option>This Month</option><option>This Quarter</option></select>
            <button className="btn btn-primary btn-sm" id="sa-analytics-export-btn">📥 Export</button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4 stagger" style={{ marginBottom: 28 }}>
        {[
          { label: 'Total Tasks (All Regions)', value: '1,240', change: '+89 this week', icon: '✅', color: 'rgba(16,185,129,0.12)' },
          { label: 'Overall Completion Rate', value: '87%', change: '+3% vs last month', icon: '📊', color: 'rgba(99,102,241,0.15)' },
          { label: 'Global Response Time', value: '2.8h', change: '-0.4h improvement', icon: '⚡', color: 'rgba(6,182,212,0.12)' },
          { label: 'Total People Helped', value: '58,200+', change: '+4,820 this month', icon: '👥', color: 'rgba(245,158,11,0.12)' },
        ].map(s => (
          <div key={s.label} className="stat-card animate-fade-in">
            <div className="flex items-center justify-between">
              <span className="stat-label">{s.label}</span>
              <div className="stat-icon" style={{ background: s.color }}>{s.icon}</div>
            </div>
            <div className="stat-value">{s.value}</div>
            <div className="stat-change">↑ {s.change}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-6" style={{ alignItems: 'start' }}>
        {/* Weekly Activity Chart */}
        <div className="card">
          <h3 className="h4" style={{ marginBottom: 20 }}>Weekly Task Activity</h3>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, height: 140 }}>
            {weekData.map((h, i) => (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{h}</span>
                <div style={{ width: '100%', height: `${h / Math.max(...weekData) * 100}%`, background: i === 5 ? 'linear-gradient(180deg, var(--brand-primary) 0%, var(--brand-accent) 100%)' : 'var(--bg-elevated)', borderRadius: '4px 4px 0 0', border: '1px solid var(--bg-border)', boxShadow: i === 5 ? 'var(--shadow-glow)' : 'none' }} />
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{days[i]}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Regional Comparison */}
        <div className="card">
          <h3 className="h4" style={{ marginBottom: 16 }}>Regional Performance</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { region: 'Delhi NCR', completion: 91, tasks: 31, color: 'var(--brand-primary)' },
              { region: 'Mumbai North', completion: 87, tasks: 18, color: 'var(--brand-accent)' },
              { region: 'Chennai South', completion: 83, tasks: 24, color: 'var(--low)' },
              { region: 'Bangalore Central', completion: 78, tasks: 12, color: 'var(--brand-warm)' },
              { region: 'Pune West', completion: 72, tasks: 8, color: 'var(--high)' },
              { region: 'Hyderabad East', completion: 68, tasks: 15, color: 'var(--medium)' },
            ].map(r => (
              <div key={r.region}>
                <div className="flex items-center justify-between" style={{ marginBottom: 4 }}>
                  <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>{r.region}</span>
                  <div className="flex items-center gap-3">
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{r.tasks} tasks</span>
                    <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: r.color }}>{r.completion}%</span>
                  </div>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${r.completion}%`, background: r.color }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Need Type Global Distribution */}
        <div className="card">
          <h3 className="h4" style={{ marginBottom: 16 }}>Global Need Distribution</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { type: '🔴 Medical', count: 420, pct: 34, color: '#ef4444' },
              { type: '🟠 Food', count: 312, pct: 25, color: '#f97316' },
              { type: '🔵 Shelter', count: 248, pct: 20, color: '#6366f1' },
              { type: '🩵 Water', count: 149, pct: 12, color: '#06b6d4' },
              { type: '🟢 Education', count: 111, pct: 9, color: '#10b981' },
            ].map(d => (
              <div key={d.type}>
                <div className="flex items-center justify-between" style={{ marginBottom: 4 }}>
                  <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{d.type}</span>
                  <div className="flex items-center gap-3">
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{d.count} needs</span>
                    <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: d.color }}>{d.pct}%</span>
                  </div>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${d.pct * 3}%`, background: d.color }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Impact Metrics */}
        <div className="card">
          <h3 className="h4" style={{ marginBottom: 16 }}>Cumulative Platform Impact</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {[
              { label: 'Meals Distributed', value: '1.2M+', icon: '🍱', color: '#f97316' },
              { label: 'Medical Aids', value: '84,000+', icon: '💊', color: '#ef4444' },
              { label: 'Shelters Built', value: '3,420', icon: '🏠', color: '#6366f1' },
              { label: 'Students Reached', value: '28,000+', icon: '📚', color: '#10b981' },
              { label: 'Water Purified (L)', value: '5.8M+', icon: '💧', color: '#06b6d4' },
              { label: 'Volunteer Hours', value: '142,000+', icon: '⏱️', color: '#8b5cf6' },
            ].map(m => (
              <div key={m.label} style={{ background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)', padding: '14px', textAlign: 'center' }}>
                <div style={{ fontSize: '1.5rem', marginBottom: 6 }}>{m.icon}</div>
                <div style={{ fontWeight: 800, fontSize: '1.125rem', color: m.color, fontFamily: 'Outfit, sans-serif' }}>{m.value}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>{m.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
