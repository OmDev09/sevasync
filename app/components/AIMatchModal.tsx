'use client';

import { useState } from 'react';

interface Volunteer {
  id: string;
  name: string;
  skills: string[];
  location: string;
  status: string;
  matchScore: number;
  matchReasons: string[];
  activeTasks: number;
  completedTasks: number;
  distance: string;
}

interface AIMatchModalProps {
  needTitle: string;
  needType: string;
  needLocation: string;
  onClose: () => void;
  onAssign: (volunteer: Volunteer) => void;
}

const DELAY_STEPS = [
  { text: 'Analyzing need requirements...', pct: 15 },
  { text: 'Scanning volunteer skill profiles...', pct: 35 },
  { text: 'Computing location proximity scores...', pct: 55 },
  { text: 'Applying workload & availability weights...', pct: 75 },
  { text: 'Ranking and finalizing matches...', pct: 100 },
];

const CANDIDATE_POOL: Volunteer[] = [
  { id: 'V001', name: 'Amit Kumar', skills: ['Medical', 'First Aid', 'Transport'], location: 'Dharavi, Mumbai', status: 'available', matchScore: 97, matchReasons: ['Exact skill match: Medical, First Aid', 'Nearest volunteer (0.8 km)', 'Available now', 'High impact score (94)'], activeTasks: 1, completedTasks: 47, distance: '0.8 km' },
  { id: 'V005', name: 'Kiran Desai', skills: ['Medical', 'Transport', 'Marathi'], location: 'Andheri, Mumbai', status: 'available', matchScore: 82, matchReasons: ['Skill match: Medical', 'Moderate proximity (4.2 km)', 'Available now', 'High completion rate'], activeTasks: 0, completedTasks: 61, distance: '4.2 km' },
  { id: 'V004', name: 'Pooja Singh', skills: ['Education', 'Counseling', 'Hindi'], location: 'Govandi, Mumbai', status: 'available', matchScore: 54, matchReasons: ['Partial skill match: Counseling', 'Farther location (8.1 km)', 'Available now'], activeTasks: 2, completedTasks: 28, distance: '8.1 km' },
];

export default function AIMatchModal({ needTitle, needType, needLocation, onClose, onAssign }: AIMatchModalProps) {
  const [phase, setPhase] = useState<'idle' | 'scanning' | 'results'>('idle');
  const [stepIdx, setStepIdx] = useState(0);
  const [progress, setProgress] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);

  const runScan = () => {
    setPhase('scanning');
    setStepIdx(0);
    setProgress(0);

    let i = 0;
    const tick = () => {
      if (i >= DELAY_STEPS.length) {
        setPhase('results');
        return;
      }
      setStepIdx(i);
      setProgress(DELAY_STEPS[i].pct);
      i++;
      setTimeout(tick, 700);
    };
    setTimeout(tick, 300);
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'var(--low)';
    if (score >= 70) return 'var(--brand-accent)';
    if (score >= 50) return 'var(--medium)';
    return 'var(--high)';
  };

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: 24 }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="animate-fade-in" style={{ width: '100%', maxWidth: 600, background: 'var(--bg-card)', border: '1px solid var(--bg-border)', borderRadius: 'var(--radius-xl)', padding: 32, maxHeight: '90vh', overflowY: 'auto' }}>
        {/* Header */}
        <div className="flex items-center justify-between" style={{ marginBottom: 24 }}>
          <div>
            <h2 className="font-display" style={{ fontSize: '1.375rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
              🤖 AI Volunteer Matching
            </h2>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>Finding the best volunteer for this need</p>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={onClose} id="ai-match-close-btn">✕</button>
        </div>

        {/* Need summary */}
        <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--bg-border)', borderRadius: 'var(--radius-md)', padding: '14px 16px', marginBottom: 24 }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 4, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Matching For</div>
          <div style={{ fontWeight: 700, marginBottom: 4 }}>{needTitle}</div>
          <div className="flex items-center gap-3">
            <span className="badge badge-brand">{needType}</span>
            <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>📍 {needLocation}</span>
          </div>
        </div>

        {/* Idle Phase */}
        {phase === 'idle' && (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ fontSize: '3rem', marginBottom: 16 }}>🧠</div>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 24, lineHeight: 1.6 }}>
              Our AI engine will analyze <strong style={{ color: 'var(--text-primary)' }}>skill compatibility</strong>, <strong style={{ color: 'var(--text-primary)' }}>location proximity</strong>, <strong style={{ color: 'var(--text-primary)' }}>workload</strong>, and <strong style={{ color: 'var(--text-primary)' }}>availability</strong> to find the top-matched volunteer.
            </p>
            <button className="btn btn-primary" id="ai-match-run-btn" onClick={runScan} style={{ padding: '13px 28px', fontSize: '1rem' }}>
              🚀 Run AI Match
            </button>
          </div>
        )}

        {/* Scanning Phase */}
        {phase === 'scanning' && (
          <div className="animate-fade-in" style={{ padding: '12px 0' }}>
            <div className="flex items-center justify-between" style={{ marginBottom: 8 }}>
              <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                {DELAY_STEPS[stepIdx]?.text}
              </span>
              <span style={{ fontWeight: 700, color: 'var(--brand-primary-light)' }}>{progress}%</span>
            </div>
            <div className="progress-bar" style={{ height: 8, marginBottom: 24 }}>
              <div className="progress-fill animate-pulse" style={{ width: `${progress}%`, transition: 'width 0.6s ease' }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {DELAY_STEPS.map((step, i) => (
                <div key={i} className="flex items-center gap-3" style={{ fontSize: '0.8125rem', opacity: i <= stepIdx ? 1 : 0.3, transition: 'opacity 0.4s ease' }}>
                  <span style={{ color: i < stepIdx ? 'var(--low)' : i === stepIdx ? 'var(--brand-primary-light)' : 'var(--text-muted)' }}>
                    {i < stepIdx ? '✓' : i === stepIdx ? '⟳' : '○'}
                  </span>
                  <span style={{ color: i <= stepIdx ? 'var(--text-primary)' : 'var(--text-muted)' }}>{step.text}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Results Phase */}
        {phase === 'results' && (
          <div className="animate-fade-in">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <span style={{ color: 'var(--low)', fontSize: '1rem' }}>✓</span>
              <span style={{ fontWeight: 600, color: 'var(--low)' }}>Match complete — {CANDIDATE_POOL.length} candidates ranked</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
              {CANDIDATE_POOL.map((vol, idx) => (
                <div
                  key={vol.id}
                  id={`ai-match-candidate-${vol.id}`}
                  onClick={() => setSelected(vol.id)}
                  style={{
                    border: `2px solid ${selected === vol.id ? 'var(--brand-primary)' : idx === 0 ? 'rgba(34,197,94,0.3)' : 'var(--bg-border)'}`,
                    borderRadius: 'var(--radius-lg)',
                    padding: '16px',
                    cursor: 'pointer',
                    background: selected === vol.id ? 'rgba(99,102,241,0.08)' : idx === 0 ? 'rgba(34,197,94,0.04)' : 'var(--bg-elevated)',
                    transition: 'all var(--transition-fast)',
                  }}
                >
                  <div className="flex items-start gap-4">
                    <div style={{ position: 'relative' }}>
                      <div className="avatar avatar-md" style={{ width: 44, height: 44, fontSize: '1rem' }}>
                        {vol.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      {idx === 0 && (
                        <div style={{ position: 'absolute', top: -6, right: -6, background: 'var(--low)', color: '#fff', borderRadius: '50%', width: 18, height: 18, fontSize: '0.625rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
                          ★
                        </div>
                      )}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div className="flex items-center justify-between" style={{ marginBottom: 6 }}>
                        <div>
                          <span style={{ fontWeight: 700, fontSize: '0.9375rem' }}>{vol.name}</span>
                          {idx === 0 && <span style={{ marginLeft: 8, fontSize: '0.7rem', background: 'rgba(34,197,94,0.15)', color: 'var(--low)', padding: '2px 8px', borderRadius: 'var(--radius-full)', fontWeight: 700 }}>BEST MATCH</span>}
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontWeight: 900, fontSize: '1.25rem', color: getScoreColor(vol.matchScore), fontFamily: 'Outfit, sans-serif' }}>{vol.matchScore}%</div>
                          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>match score</div>
                        </div>
                      </div>
                      <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: 8 }}>
                        📍 {vol.distance} away · {vol.activeTasks} active tasks · {vol.completedTasks} completed
                      </div>
                      <div className="flex gap-2" style={{ flexWrap: 'wrap', marginBottom: 8 }}>
                        {vol.skills.map(s => <span key={s} className="badge badge-brand" style={{ fontSize: '0.7rem' }}>{s}</span>)}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                        {vol.matchReasons.map((r, i) => (
                          <div key={i} className="flex items-center gap-2" style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                            <span style={{ color: 'var(--low)', fontSize: '0.65rem' }}>✓</span>
                            {r}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-3">
              <button
                className="btn btn-primary"
                id="ai-match-assign-btn"
                style={{ flex: 1, padding: '13px' }}
                disabled={!selected}
                onClick={() => {
                  const vol = CANDIDATE_POOL.find(v => v.id === selected);
                  if (vol) onAssign(vol);
                }}
              >
                {selected
                  ? `✓ Assign to ${CANDIDATE_POOL.find(v => v.id === selected)?.name}`
                  : 'Select a volunteer to assign'}
              </button>
              <button className="btn btn-secondary" id="ai-match-rerun-btn" onClick={runScan}>🔄 Re-run</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
