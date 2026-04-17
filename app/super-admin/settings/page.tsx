'use client';

import { useState } from 'react';

export default function SASettingsPage() {
  const [saved, setSaved] = useState(false);
  const handleSave = () => { setSaved(true); setTimeout(() => setSaved(false), 2000); };

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div className="page-header-top">
          <div>
            <h1 className="page-title font-display">⚙️ Platform Settings</h1>
            <p className="page-subtitle">Configure platform-wide settings and defaults</p>
          </div>
          <button className="btn btn-primary btn-sm" id="settings-save-btn" onClick={handleSave}>
            {saved ? '✓ Saved!' : 'Save Changes'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6" style={{ alignItems: 'start' }}>
        {/* Need Categories */}
        <div className="card">
          <h3 className="h4" style={{ marginBottom: 16 }}>Need Categories</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { name: 'Medical', icon: '💊', weight: 10, color: '#ef4444' },
              { name: 'Food & Nutrition', icon: '🍱', weight: 8, color: '#f97316' },
              { name: 'Shelter & Housing', icon: '🏠', weight: 8, color: '#6366f1' },
              { name: 'Clean Water', icon: '💧', weight: 7, color: '#06b6d4' },
              { name: 'Education', icon: '📚', weight: 5, color: '#10b981' },
              { name: 'Mental Health', icon: '🧠', weight: 6, color: '#8b5cf6' },
            ].map(c => (
              <div key={c.name} className="flex items-center gap-3" style={{ padding: '10px 12px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)' }}>
                <span style={{ fontSize: '1.125rem' }}>{c.icon}</span>
                <span style={{ flex: 1, fontSize: '0.875rem', fontWeight: 500 }}>{c.name}</span>
                <div className="flex items-center gap-2">
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Weight:</span>
                  <select className="form-select" style={{ width: 70 }} defaultValue={c.weight} id={`settings-weight-${c.name.replace(/\s+/g, '-').toLowerCase()}`}>
                    {[1,2,3,4,5,6,7,8,9,10].map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
                <div style={{ width: 12, height: 12, borderRadius: 3, background: c.color }} />
              </div>
            ))}
          </div>
        </div>

        {/* Severity Levels + AI Settings */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="card">
            <h3 className="h4" style={{ marginBottom: 16 }}>Severity Thresholds</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { level: 'Critical', min: 80, color: 'var(--critical)' },
                { level: 'High', min: 60, color: 'var(--high)' },
                { level: 'Medium', min: 40, color: 'var(--medium)' },
                { level: 'Low', min: 0, color: 'var(--low)' },
              ].map(s => (
                <div key={s.level} className="flex items-center gap-3">
                  <span className={`badge badge-${s.level.toLowerCase()}`}>{s.level}</span>
                  <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>Score ≥</span>
                  <input className="form-input" style={{ width: 80 }} type="number" defaultValue={s.min} id={`settings-threshold-${s.level.toLowerCase()}`} />
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <h3 className="h4" style={{ marginBottom: 16 }}>AI Scoring Weights</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { label: 'Urgency Keywords', key: 'urgency', val: 25 },
                { label: 'Affected Population', key: 'population', val: 25 },
                { label: 'Location Severity', key: 'location', val: 25 },
                { label: 'Recency & Decay', key: 'recency', val: 15 },
                { label: 'Category Weight', key: 'category', val: 10 },
              ].map(f => (
                <div key={f.key} className="flex items-center gap-3">
                  <span style={{ flex: 1, fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>{f.label}</span>
                  <input className="form-input" style={{ width: 80 }} type="number" defaultValue={f.val} id={`settings-ai-${f.key}`} />
                  <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>%</span>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <h3 className="h4" style={{ marginBottom: 16 }}>Notification Settings</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { label: 'Critical need alerts', id: 'notif-critical', checked: true },
                { label: 'Task completion alerts', id: 'notif-complete', checked: true },
                { label: 'Volunteer onboarding', id: 'notif-onboard', checked: false },
                { label: 'Daily digest email', id: 'notif-digest', checked: true },
              ].map(n => (
                <div key={n.id} className="flex items-center justify-between" style={{ padding: '10px 12px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)' }}>
                  <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{n.label}</span>
                  <div style={{ width: 44, height: 24, borderRadius: 'var(--radius-full)', background: n.checked ? 'var(--brand-primary)' : 'var(--bg-border)', cursor: 'pointer', position: 'relative', transition: 'background var(--transition-fast)' }} id={n.id}>
                    <div style={{ width: 18, height: 18, borderRadius: '50%', background: '#fff', position: 'absolute', top: 3, left: n.checked ? 22 : 4, transition: 'left var(--transition-fast)' }} />
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
