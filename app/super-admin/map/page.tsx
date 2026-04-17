'use client';

export default function SAMapPage() {
  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div className="page-header-top">
          <div>
            <h1 className="page-title font-display">🗺️ Global Map</h1>
            <p className="page-subtitle">All regions · Need severity heatmap across India</p>
          </div>
          <div className="flex items-center gap-3">
            <select className="form-select" style={{ maxWidth: 180 }} id="samap-filter-type">
              <option value="all">All Need Types</option>
              <option value="medical">🔴 Medical</option>
              <option value="food">🟠 Food</option>
              <option value="shelter">🔵 Shelter</option>
            </select>
            <button className="btn btn-secondary btn-sm" id="samap-export-btn">📥 Export Map</button>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="card" style={{ padding: '12px 20px', marginBottom: 20 }}>
        <div className="flex items-center gap-6" style={{ flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', fontWeight: 600 }}>Severity:</span>
          {[['🔴', 'Critical (80–100)', '#ef4444'], ['🟠', 'High (60–79)', '#f97316'], ['🟡', 'Medium (40–59)', '#eab308'], ['🟢', 'Low (0–39)', '#22c55e']].map(([, label, color]) => (
            <div key={label as string} className="flex items-center gap-2">
              <div style={{ width: 12, height: 12, borderRadius: '50%', background: color as string, boxShadow: `0 0 6px ${color}80` }} />
              <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Global map */}
      <div className="card" style={{ padding: 0, overflow: 'hidden', marginBottom: 24 }}>
        <div
          id="sa-global-map-container"
          style={{
            height: 480,
            background: `
              radial-gradient(circle at 30% 35%, rgba(239,68,68,0.2) 0%, rgba(239,68,68,0.06) 12%, transparent 22%),
              radial-gradient(circle at 50% 50%, rgba(249,115,22,0.15) 0%, transparent 18%),
              radial-gradient(circle at 65% 30%, rgba(239,68,68,0.15) 0%, transparent 15%),
              radial-gradient(circle at 25% 65%, rgba(234,179,8,0.12) 0%, transparent 14%),
              radial-gradient(circle at 75% 60%, rgba(249,115,22,0.12) 0%, transparent 14%),
              radial-gradient(circle at 45% 75%, rgba(99,102,241,0.1) 0%, transparent 12%),
              linear-gradient(135deg, #0a0a12 0%, #111827 100%)
            `,
            position: 'relative',
          }}
        >
          <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

          {[
            { x: 30, y: 35, color: '#ef4444', label: 'Mumbai', score: 94, admin: 'Priya Sharma', size: 20 },
            { x: 65, y: 30, color: '#ef4444', label: 'Delhi NCR', score: 88, admin: 'Rohit Joshi', size: 18 },
            { x: 50, y: 55, color: '#f97316', label: 'Hyderabad', score: 72, admin: 'Vikram Nair', size: 15 },
            { x: 45, y: 70, color: '#f97316', label: 'Chennai', score: 68, admin: 'Kavya Reddy', size: 14 },
            { x: 38, y: 45, color: '#f97316', label: 'Pune', score: 62, admin: 'Sneha Kulkarni', size: 13 },
            { x: 55, y: 42, color: '#eab308', label: 'Bangalore', score: 55, admin: 'Arjun Menon', size: 12 },
          ].map(pin => (
            <div key={pin.label} style={{ position: 'absolute', left: `${pin.x}%`, top: `${pin.y}%`, transform: 'translate(-50%, -50%)', cursor: 'pointer' }} id={`samap-pin-${pin.label.toLowerCase().replace(/\s+/g, '-')}`} title={`${pin.label} — Score: ${pin.score} · ${pin.admin}`}>
              <div className="animate-pulse" style={{ width: pin.size * 2 + 20, height: pin.size * 2 + 20, borderRadius: '50%', background: `${pin.color}15`, position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }} />
              <div style={{ width: pin.size, height: pin.size, borderRadius: '50%', background: pin.color, boxShadow: `0 0 14px ${pin.color}90`, border: '2px solid rgba(255,255,255,0.3)', position: 'relative', zIndex: 1 }} />
              <div style={{ position: 'absolute', bottom: '100%', left: '50%', transform: 'translateX(-50%)', marginBottom: 6, background: 'var(--bg-elevated)', border: '1px solid var(--bg-border)', borderRadius: 'var(--radius-sm)', padding: '4px 10px', whiteSpace: 'nowrap', fontSize: '0.7rem', color: 'var(--text-primary)' }}>
                {pin.label} · {pin.score}
              </div>
            </div>
          ))}

          <div style={{ position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)', fontSize: '0.8125rem', color: 'rgba(255,255,255,0.3)', background: 'rgba(0,0,0,0.4)', padding: '6px 16px', borderRadius: 'var(--radius-full)', backdropFilter: 'blur(8px)' }}>
            Interactive Leaflet.js map — Phase 2
          </div>
        </div>
      </div>

      {/* Region cards */}
      <div className="grid grid-cols-3 gap-4 stagger">
        {[
          { region: 'Mumbai North', admin: 'Priya Sharma', score: 94, level: 'critical', vols: 42, tasks: 18 },
          { region: 'Delhi NCR', admin: 'Rohit Joshi', score: 88, level: 'critical', vols: 67, tasks: 31 },
          { region: 'Hyderabad East', admin: 'Vikram Nair', score: 72, level: 'high', vols: 31, tasks: 15 },
          { region: 'Chennai South', admin: 'Kavya Reddy', score: 68, level: 'high', vols: 28, tasks: 24 },
          { region: 'Pune West', admin: 'Sneha Kulkarni', score: 62, level: 'high', vols: 19, tasks: 8 },
          { region: 'Bangalore Central', admin: 'Arjun Menon', score: 55, level: 'medium', vols: 35, tasks: 12 },
        ].map(r => (
          <div key={r.region} className="card animate-fade-in" style={{ padding: '14px 16px' }} id={`samap-region-${r.region.toLowerCase().replace(/\s+/g, '-')}-card`}>
            <div className="flex items-center justify-between" style={{ marginBottom: 8 }}>
              <span style={{ fontWeight: 700 }}>{r.region}</span>
              <span className={`badge badge-${r.level}`}>{r.score}</span>
            </div>
            <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: 8 }}>Admin: {r.admin}</div>
            <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: 8 }}>🙋 {r.vols} volunteers · ✅ {r.tasks} tasks</div>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${r.score}%`, background: r.level === 'critical' ? 'var(--critical)' : r.level === 'high' ? 'var(--high)' : 'var(--medium)' }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
