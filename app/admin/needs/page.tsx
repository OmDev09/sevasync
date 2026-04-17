'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AIMatchModal from '../../components/AIMatchModal';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import type { Need } from '../../../lib/supabase/database.types';

const TYPE_COLORS: Record<string, string> = {
  Medical: '#ef4444', Food: '#f97316', Shelter: '#6366f1',
  Water: '#06b6d4', Education: '#10b981',
};
const SOURCE_ICONS: Record<string, string> = {
  whatsapp: '💬', mobile: '📱', csv: '📊', manual: '✍️', ocr: '📄',
};
const NEED_TYPES = ['All', 'Medical', 'Food', 'Shelter', 'Water', 'Education'];
const SEVERITIES = ['All', 'critical', 'high', 'medium', 'low'];

const EMPTY_FORM = { title: '', type: 'Medical', severity: 'high', location: '', people: '', description: '', source: 'manual' };

export default function NeedsPage() {
  const { user } = useAuth();
  const { success, error: toastError } = useToast();
  const router = useRouter();

  const [needs, setNeeds] = useState<Need[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState({ type: 'All', severity: 'All' });
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState(EMPTY_FORM);
  const [aiMatchNeed, setAiMatchNeed] = useState<Need | null>(null);

  const fetchNeeds = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/needs');
      const data = await res.json();
      setNeeds(data.needs || []);
    } catch {
      toastError('Failed to load needs');
    } finally {
      setLoading(false);
    }
  }, [toastError]);

  useEffect(() => { if (user) fetchNeeds(); }, [user, fetchNeeds]);

  const handleSave = async () => {
    if (!form.title || !form.location) {
      toastError('Validation error', 'Title and location are required.');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/needs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title,
          type: form.type,
          severity: form.severity,
          location: form.location,
          people_affected: parseInt(form.people || '0', 10),
          description: form.description,
          source: form.source,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create need');
      setNeeds(prev => [data.need, ...prev]);
      setShowModal(false);
      setForm(EMPTY_FORM);
      success('Need created ✅', `"${form.title}" added with AI Score: ${data.need.ai_score}`);
    } catch (e: unknown) {
      toastError('Save failed', e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setSaving(false);
    }
  };

  const handleResolve = async (id: string, title: string) => {
    const res = await fetch(`/api/needs/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'resolved' }),
    });
    if (res.ok) {
      setNeeds(prev => prev.map(n => n.id === id ? { ...n, status: 'resolved' } : n));
      success('Resolved ✅', `"${title}" marked as resolved.`);
    }
  };

  const filtered = needs.filter(n => {
    if (filter.type !== 'All' && n.type !== filter.type) return false;
    if (filter.severity !== 'All' && n.severity !== filter.severity) return false;
    if (search && !n.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div className="page-header-top">
          <div>
            <h1 className="page-title font-display">Community Needs</h1>
            <p className="page-subtitle">{needs.length} needs tracked · {needs.filter(n => n.severity === 'critical').length} critical</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="btn btn-secondary btn-sm" id="needs-refresh-btn" onClick={fetchNeeds}>🔄 Refresh</button>
            <button className="btn btn-primary btn-sm" id="needs-add-btn" onClick={() => setShowModal(true)}>+ Add Need</button>
          </div>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-4 gap-4 stagger" style={{ marginBottom: 24 }}>
        {[
          { label: 'Total Needs', value: needs.length, color: 'rgba(99,102,241,0.15)', icon: '🆘' },
          { label: 'Critical', value: needs.filter(n => n.severity === 'critical').length, color: 'rgba(239,68,68,0.12)', icon: '🔴' },
          { label: 'Open', value: needs.filter(n => n.status === 'open').length, color: 'rgba(249,115,22,0.12)', icon: '📂' },
          { label: 'Resolved', value: needs.filter(n => n.status === 'resolved').length, color: 'rgba(16,185,129,0.12)', icon: '✅' },
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
            className="form-input" style={{ maxWidth: 240 }}
            placeholder="🔍 Search needs..." value={search}
            onChange={e => setSearch(e.target.value)} id="needs-search-input"
          />
          <div className="flex items-center gap-2" style={{ flexWrap: 'wrap' }}>
            {NEED_TYPES.map(t => (
              <button key={t} id={`filter-type-${t}-btn`}
                onClick={() => setFilter(f => ({ ...f, type: t }))} className="btn btn-sm"
                style={{
                  background: filter.type === t ? `${TYPE_COLORS[t] || 'var(--brand-primary)'}20` : 'transparent',
                  color: filter.type === t ? (TYPE_COLORS[t] || 'var(--brand-primary-light)') : 'var(--text-secondary)',
                  border: `1px solid ${filter.type === t ? (TYPE_COLORS[t] || 'var(--brand-primary)') + '40' : 'var(--bg-border)'}`,
                }}
              >{t}</button>
            ))}
          </div>
          <select className="form-select" style={{ maxWidth: 160 }} value={filter.severity}
            onChange={e => setFilter(f => ({ ...f, severity: e.target.value }))} id="needs-severity-filter">
            {SEVERITIES.map(s => <option key={s} value={s}>{s === 'All' ? 'All Severities' : s}</option>)}
          </select>
        </div>
      </div>

      {/* Needs list */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[1, 2, 3].map(i => (
            <div key={i} className="card" style={{ padding: 20, opacity: 0.5 }}>
              <div style={{ height: 16, width: '60%', background: 'var(--bg-elevated)', borderRadius: 4, marginBottom: 12 }} />
              <div style={{ height: 12, width: '40%', background: 'var(--bg-elevated)', borderRadius: 4 }} />
            </div>
          ))}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.map(n => (
            <NeedCard key={n.id} need={n} onResolve={handleResolve} onAiMatch={setAiMatchNeed} />
          ))}
          {filtered.length === 0 && (
            <div className="empty-state">
              <div className="empty-icon">🔍</div>
              <p className="text-secondary">{needs.length === 0 ? 'No needs yet. Click "+ Add Need" to create one.' : 'No needs match your filters.'}</p>
            </div>
          )}
        </div>
      )}

      {/* Add Need Modal */}
      {showModal && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
          onClick={e => { if (e.target === e.currentTarget) setShowModal(false); }}
        >
          <div className="card animate-fade-in" style={{ width: '100%', maxWidth: 520, maxHeight: '90vh', overflow: 'auto' }}>
            <div className="flex items-center justify-between" style={{ marginBottom: 24 }}>
              <h2 className="h3 font-display">Add New Need</h2>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowModal(false)} id="needs-modal-close-btn">✕</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="form-group">
                <label className="form-label">Title *</label>
                <input className="form-input" id="need-title-input" placeholder="Brief description of the need"
                  value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="form-label">Type *</label>
                  <select className="form-select" id="need-type-select" value={form.type}
                    onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                    {['Medical', 'Food', 'Shelter', 'Water', 'Education'].map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Severity *</label>
                  <select className="form-select" id="need-severity-select" value={form.severity}
                    onChange={e => setForm(f => ({ ...f, severity: e.target.value }))}>
                    {['critical', 'high', 'medium', 'low'].map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Location *</label>
                <input className="form-input" id="need-location-input" placeholder="Area, City"
                  value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="form-label">People Affected</label>
                  <input className="form-input" id="need-people-input" type="number" placeholder="e.g. 120"
                    value={form.people} onChange={e => setForm(f => ({ ...f, people: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Source</label>
                  <select className="form-select" id="need-source-select" value={form.source}
                    onChange={e => setForm(f => ({ ...f, source: e.target.value }))}>
                    {['manual', 'whatsapp', 'ocr', 'csv', 'mobile'].map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea className="form-input" id="need-description-input" rows={3}
                  placeholder="Additional details..." value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  style={{ resize: 'vertical' }} />
              </div>
              <div style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 'var(--radius-sm)', padding: '10px 14px', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                🧠 AI score will be auto-calculated based on severity, type, and people affected.
              </div>
              <div className="flex items-center gap-3" style={{ marginTop: 4 }}>
                <button className="btn btn-primary" id="need-save-btn" onClick={handleSave}
                  disabled={saving} style={{ flex: 1 }}>
                  {saving ? <><span className="animate-spin" style={{ display: 'inline-block' }}>⟳</span> Saving...</> : 'Save Need'}
                </button>
                <button className="btn btn-secondary" onClick={() => setShowModal(false)} id="need-cancel-btn">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {aiMatchNeed && (
        <AIMatchModal
          needTitle={aiMatchNeed.title}
          needType={aiMatchNeed.type}
          needLocation={aiMatchNeed.location}
          onClose={() => setAiMatchNeed(null)}
          onAssign={(vol) => {
            router.push(
              `/admin/tasks?openCreate=1&title=${encodeURIComponent(aiMatchNeed.title)}&type=${encodeURIComponent(aiMatchNeed.type)}&priority=${encodeURIComponent(aiMatchNeed.severity)}&location=${encodeURIComponent(aiMatchNeed.location)}&volunteer_id=${encodeURIComponent(vol.id)}&instructions=${encodeURIComponent(`Follow up on need: ${aiMatchNeed.title}`)}`
            );
            setAiMatchNeed(null);
          }}
        />
      )}
    </div>
  );
}

function NeedCard({ need, onResolve, onAiMatch }: {
  need: Need;
  onResolve: (id: string, title: string) => void;
  onAiMatch: (need: Need) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const score = need.ai_score;
  const tc = TYPE_COLORS[need.type] || 'var(--text-secondary)';
  const timeAgo = new Date(need.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });

  return (
    <div className="card" style={{ padding: '16px', borderLeft: `3px solid ${need.severity === 'critical' ? 'var(--critical)' : need.severity === 'high' ? 'var(--high)' : need.severity === 'medium' ? 'var(--medium)' : 'var(--low)'}` }}>
      <div className="flex items-start justify-between gap-4">
        <div style={{ flex: 1 }}>
          <div className="flex items-center gap-2" style={{ marginBottom: 8, flexWrap: 'wrap' }}>
            <span className={`badge badge-${need.severity}`}>{need.severity}</span>
            <span className="badge" style={{ background: `${tc}18`, color: tc, border: `1px solid ${tc}30` }}>{need.type}</span>
            <span className="badge badge-muted">{SOURCE_ICONS[need.source] || '📋'} {need.source}</span>
            <span className="badge" style={{ background: need.status === 'resolved' ? 'rgba(34,197,94,0.12)' : need.status === 'in-progress' ? 'rgba(6,182,212,0.12)' : 'rgba(99,102,241,0.12)', color: need.status === 'resolved' ? 'var(--low)' : need.status === 'in-progress' ? 'var(--brand-accent)' : 'var(--brand-primary-light)', border: 'none' }}>
              {need.status}
            </span>
            <span style={{ marginLeft: 'auto', fontSize: '0.8125rem', fontWeight: 700, color: score >= 80 ? 'var(--critical)' : score >= 60 ? 'var(--high)' : 'var(--text-secondary)' }}>
              🧠 {score}
            </span>
          </div>
          <div style={{ fontWeight: 600, marginBottom: 4 }}>{need.title}</div>
          <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
            📍 {need.location} · 👥 {need.people_affected} people · 🗓 {timeAgo}
          </div>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={() => setExpanded(!expanded)} id={`expand-need-${need.id}-btn`}>
          {expanded ? '▲' : '▼'}
        </button>
      </div>
      {expanded && (
        <div className="animate-fade-in" style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--bg-border)' }}>
          {need.description && (
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: 12, lineHeight: 1.6 }}>{need.description}</p>
          )}
          <div className="flex items-center gap-3">
            <Link
              className="btn btn-primary btn-sm"
              id={`create-task-need-${need.id}-btn`}
              href={`/admin/tasks?openCreate=1&title=${encodeURIComponent(need.title)}&type=${encodeURIComponent(need.type)}&priority=${encodeURIComponent(need.severity)}&location=${encodeURIComponent(need.location)}&instructions=${encodeURIComponent(`Follow up on need: ${need.title}`)}`}
            >
              ✅ Create Task
            </Link>
            <button className="btn btn-accent btn-sm" id={`ai-match-need-${need.id}-btn`} onClick={() => onAiMatch(need)}>🤖 AI Match</button>
            {need.status !== 'resolved' && (
              <button className="btn btn-ghost btn-sm" id={`resolve-need-${need.id}-btn`}
                style={{ color: 'var(--low)' }}
                onClick={() => onResolve(need.id, need.title)}>✓ Resolve</button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
