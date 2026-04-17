'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AIMatchModal from '../../components/AIMatchModal';
import { useToast } from '../../context/ToastContext';
import type { Need } from '../../../lib/supabase/database.types';

const FACTORS = [
  { key: 'urgencyKw', label: 'Urgency Keywords', weight: 25, icon: '🔤', color: '#ef4444' },
  { key: 'affectedPop', label: 'Affected Population', weight: 25, icon: '👥', color: '#f97316' },
  { key: 'locationIdx', label: 'Location Severity', weight: 25, icon: '📍', color: '#6366f1' },
  { key: 'recency', label: 'Recency & Decay', weight: 15, icon: '🕐', color: '#06b6d4' },
  { key: 'category', label: 'Category Weight', weight: 10, icon: '📂', color: '#10b981' },
];

const TYPE_COLORS: Record<string, string> = {
  Medical: '#ef4444', Food: '#f97316', Shelter: '#6366f1',
  Water: '#06b6d4', Education: '#10b981',
};

export default function PrioritiesPage() {
  const { success } = useToast();
  const router = useRouter();

  const [needs, setNeeds] = useState<Need[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Need | null>(null);
  const [aiMatchNeed, setAiMatchNeed] = useState<Need | null>(null);

  const fetchNeeds = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/needs');
      const data = await res.json();
      setNeeds(data.needs || []);
    } catch {
      console.error('Failed to load needs');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchNeeds(); }, [fetchNeeds]);

  // Exclude resolved needs and sort by AI score
  const activeNeeds = needs.filter(n => n.status !== 'resolved');
  const sortedNeeds = [...activeNeeds].sort((a, b) => b.ai_score - a.ai_score);

  const getBadge = (score: number) => {
    if (score >= 80) return 'critical';
    if (score >= 60) return 'high';
    if (score >= 40) return 'medium';
    return 'low';
  };

  // Compute hotspot data from real needs — no more mock REGIONS
  const regionMap: Record<string, { needs: Need[]; topScore: number }> = {};
  for (const n of activeNeeds) {
    const loc = n.location || 'Unknown';
    if (!regionMap[loc]) regionMap[loc] = { needs: [], topScore: 0 };
    regionMap[loc].needs.push(n);
    regionMap[loc].topScore = Math.max(regionMap[loc].topScore, n.ai_score);
  }

  const regions = Object.entries(regionMap)
    .map(([name, data]) => ({
      name,
      severity: data.topScore,
      count: data.needs.length,
      types: [...new Set(data.needs.map(n => n.type))],
    }))
    .sort((a, b) => b.severity - a.severity)
    .slice(0, 8);

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div className="page-header-top">
          <div>
            <h1 className="page-title font-display">🧠 AI Need Prioritization</h1>
            <p className="page-subtitle">Auto-scored needs ranked by urgency · Live from database</p>
          </div>
          <div className="flex items-center gap-3">
            <div
              style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 'var(--radius-sm)', padding: '7px 14px', display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.8125rem', color: 'var(--critical)' }}
            >
              <span className="animate-pulse">🔴</span> {sortedNeeds.filter(n => n.ai_score >= 80).length} Critical Needs
            </div>
            <button className="btn btn-secondary btn-sm" id="priorities-refresh-btn" onClick={fetchNeeds}>🔄 Refresh Scores</button>
          </div>
        </div>
      </div>

      {/* Scoring Legend */}
      <div className="card" style={{ padding: '16px 20px', marginBottom: 24 }}>
        <div className="flex items-center justify-between" style={{ marginBottom: 14 }}>
          <h3 className="h4">AI Scoring Factors</h3>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Total weight: 100%</span>
        </div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {FACTORS.map(f => (
            <div key={f.key} style={{ flex: '1 1 160px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)', padding: '12px 14px' }}>
              <div className="flex items-center gap-2" style={{ marginBottom: 6 }}>
                <span>{f.icon}</span>
                <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)' }}>{f.label}</span>
                <span style={{ marginLeft: 'auto', fontSize: '0.75rem', color: f.color, fontWeight: 700 }}>{f.weight}%</span>
              </div>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${f.weight * 4}%`, background: f.color }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6" style={{ alignItems: 'start' }}>
        {/* Left: Ranked Needs */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="h3">Priority Ranking</h2>
            <div style={{ display: 'flex', gap: 6 }}>
              {(['critical', 'high', 'medium', 'low'] as const).map(l => (
                <span key={l} className={`badge badge-${l}`} style={{ fontSize: '0.7rem' }}>{sortedNeeds.filter(n => getBadge(n.ai_score) === l).length} {l}</span>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {loading ? (
              [1, 2, 3].map(i => (
                <div key={i} className="card" style={{ padding: 20, opacity: 0.5 }}>
                  <div style={{ height: 16, width: '60%', background: 'var(--bg-elevated)', borderRadius: 4, marginBottom: 12 }} />
                  <div style={{ height: 12, width: '40%', background: 'var(--bg-elevated)', borderRadius: 4 }} />
                </div>
              ))
            ) : sortedNeeds.length === 0 ? (
              <div className="empty-state"><p className="text-secondary">No active needs to prioritize.</p></div>
            ) : (
              sortedNeeds.map((n, idx) => {
                const level = getBadge(n.ai_score);
                const tc = TYPE_COLORS[n.type] || 'var(--text-secondary)';
                return (
                  <div
                    key={n.id}
                    className="card"
                    style={{ padding: '14px 16px', cursor: 'pointer', borderLeft: `3px solid ${level === 'critical' ? 'var(--critical)' : level === 'high' ? 'var(--high)' : level === 'medium' ? 'var(--medium)' : 'var(--low)'}`, transition: 'all var(--transition-fast)', outline: selected?.id === n.id ? '1px solid var(--brand-primary)' : 'none' }}
                    onClick={() => setSelected(n)}
                    id={`priority-need-${n.id}-card`}
                  >
                    <div className="flex items-center gap-3">
                      <span style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--text-muted)', minWidth: 28 }}>#{idx + 1}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="flex items-center gap-2" style={{ marginBottom: 4 }}>
                          <span className={`badge badge-${level}`}>{level}</span>
                          <span className="badge" style={{ background: `${tc}18`, color: tc, border: `1px solid ${tc}30` }}>{n.type}</span>
                        </div>
                        <div style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{n.title}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>📍 {n.location} · 👥 {n.people_affected}</div>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div style={{ fontSize: '1.5rem', fontWeight: 900, color: level === 'critical' ? 'var(--critical)' : level === 'high' ? 'var(--high)' : level === 'medium' ? 'var(--medium)' : 'var(--low)' }}>
                          {n.ai_score}
                        </div>
                        <div style={{ fontSize: '0.675rem', color: 'var(--text-muted)' }}>/ 100</div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right: Score Breakdown + Regional */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {selected ? (
            <div className="card animate-fade-in">
              <div className="flex items-center justify-between" style={{ marginBottom: 16 }}>
                <h3 className="h4">Score Breakdown</h3>
                <button className="btn btn-ghost btn-sm" onClick={() => setSelected(null)} id="priorities-close-breakdown-btn">✕</button>
              </div>
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontWeight: 700, fontSize: '0.9375rem', marginBottom: 4 }}>{selected.title}</div>
                <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>📍 {selected.location} · 👥 {selected.people_affected} people</div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '3rem', fontWeight: 900, color: getBadge(selected.ai_score) === 'critical' ? 'var(--critical)' : getBadge(selected.ai_score) === 'high' ? 'var(--high)' : getBadge(selected.ai_score) === 'medium' ? 'var(--medium)' : 'var(--low)' }}>
                    {selected.ai_score}
                  </div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Priority Score / 100</div>
                </div>
              </div>
              
              {/* Score breakdown computed from the need's real properties */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {FACTORS.map(f => {
                  let val = 0;
                  if (f.key === 'affectedPop') val = Math.min((selected.people_affected || 0) / 4, f.weight);
                  else if (f.key === 'category') val = selected.severity === 'critical' ? f.weight : selected.severity === 'high' ? f.weight * 0.75 : f.weight * 0.5;
                  else if (f.key === 'recency') {
                    const ageHrs = (Date.now() - new Date(selected.created_at).getTime()) / 3600000;
                    val = ageHrs < 24 ? f.weight : ageHrs < 72 ? f.weight * 0.7 : f.weight * 0.4;
                  }
                  else val = f.weight * (selected.ai_score / 100);
                  val = Math.round(val);
                  
                  return (
                    <div key={f.key}>
                      <div className="flex items-center justify-between" style={{ marginBottom: 4 }}>
                        <div className="flex items-center gap-2">
                          <span>{f.icon}</span>
                          <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>{f.label}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: f.color }}>{val}/{f.weight}</span>
                        </div>
                      </div>
                      <div className="progress-bar">
                        <div className="progress-fill" style={{ width: `${(val / f.weight) * 100}%`, background: f.color }} />
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="flex gap-3" style={{ marginTop: 16 }}>
                <Link
                  href={`/admin/tasks?openCreate=1&title=${encodeURIComponent(selected.title)}&type=${encodeURIComponent(selected.type)}&priority=${encodeURIComponent(selected.severity)}&location=${encodeURIComponent(selected.location)}&instructions=${encodeURIComponent(`Follow up on need: ${selected.title}`)}`}
                  className="btn btn-primary btn-sm"
                  id="priorities-create-task-btn"
                  style={{ flex: 1 }}
                >
                  ✅ Create Task
                </Link>
                <button className="btn btn-accent btn-sm" id="priorities-ai-match-btn" onClick={() => setAiMatchNeed(selected)}>🤖 AI Match</button>
              </div>
            </div>
          ) : (
            <div className="card" style={{ textAlign: 'center', padding: '32px' }}>
              <div style={{ fontSize: '2rem', marginBottom: 8 }}>🧠</div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Click any need to see its detailed AI score breakdown</p>
            </div>
          )}

          {/* Location Severity — computed from real data */}
          <div className="card">
            <h3 className="h4" style={{ marginBottom: 16 }}>Hotspot Radar Overview</h3>
            {loading ? (
              <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)' }}>Loading...</div>
            ) : regions.length === 0 ? (
              <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>No active needs data yet.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {regions.map(r => {
                  const level = r.severity >= 80 ? 'critical' : r.severity >= 60 ? 'high' : r.severity >= 40 ? 'medium' : 'low';
                  return (
                    <div key={r.name}>
                      <div className="flex items-center justify-between" style={{ marginBottom: 4 }}>
                        <div className="flex items-center gap-2">
                          <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.name}</span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{r.count} need(s)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`badge badge-${level}`} style={{ fontSize: '0.7rem' }}>{r.severity}</span>
                        </div>
                      </div>
                      <div className="progress-bar">
                        <div
                          className="progress-fill"
                          style={{ width: `${r.severity}%`, background: level === 'critical' ? 'var(--critical)' : level === 'high' ? 'var(--high)' : level === 'medium' ? 'var(--medium)' : 'linear-gradient(90deg, var(--brand-primary), var(--brand-accent))' }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* AI Match Modal */}
      {aiMatchNeed && (
        <AIMatchModal
          needTitle={aiMatchNeed.title}
          needType={aiMatchNeed.type}
          needLocation={aiMatchNeed.location}
          onClose={() => setAiMatchNeed(null)}
          onAssign={(vol) => {
            success('AI match ready ✅', `${vol.name} selected for "${aiMatchNeed.title}".`);
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
