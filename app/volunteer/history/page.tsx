'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import type { Task } from '../../../lib/supabase/database.types';

const TYPE_COLORS: Record<string, string> = { Medical: '#ef4444', Food: '#f97316', Shelter: '#6366f1', Water: '#06b6d4', Survey: '#8b5cf6', Education: '#10b981' };

export default function VolunteerHistoryPage() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchHistory = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/tasks?volunteer_id=${user.id}`);
      const data = await res.json();
      const completed = (data.tasks || []).filter((t: Task) => t.status === 'completed');
      setTasks(completed);
    } catch {
      console.error('Failed to load history');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { fetchHistory(); }, [fetchHistory]);

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div className="page-header-top">
          <div>
            <h1 className="page-title font-display">Task History</h1>
            <p className="page-subtitle">
              {loading ? 'Loading...' : `${tasks.length} tasks completed`}
            </p>
          </div>
          <button className="btn btn-secondary btn-sm" id="vol-history-refresh-btn" onClick={fetchHistory}>🔄 Refresh</button>
        </div>
      </div>

      {/* Summary banner */}
      <div className="card" style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.1) 0%, rgba(6,182,212,0.08) 100%)', border: '1px solid rgba(99,102,241,0.2)', marginBottom: 24 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 0, textAlign: 'center' }}>
          {[
            { label: 'Total Completed', val: loading ? '—' : tasks.length, icon: '✅' },
            { label: 'This Month', val: loading ? '—' : tasks.filter(t => new Date(t.completed_at || t.created_at).getMonth() === new Date().getMonth()).length, icon: '📅' },
            { label: 'Task Types', val: loading ? '—' : new Set(tasks.map(t => t.type)).size, icon: '📋' },
          ].map((s, i) => (
            <div key={s.label} style={{ padding: '16px', borderRight: i < 2 ? '1px solid rgba(255,255,255,0.07)' : 'none' }}>
              <div style={{ fontSize: '1.5rem', marginBottom: 4 }}>{s.icon}</div>
              <div style={{ fontWeight: 800, fontSize: '1.25rem', fontFamily: 'Outfit, sans-serif', color: 'var(--text-primary)' }}>{s.val}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Task list */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[1, 2, 3].map(i => (
            <div key={i} className="card" style={{ padding: 20, opacity: 0.4 }}>
              <div style={{ height: 16, width: '60%', background: 'var(--bg-elevated)', borderRadius: 4, marginBottom: 10 }} />
              <div style={{ height: 12, width: '40%', background: 'var(--bg-elevated)', borderRadius: 4 }} />
            </div>
          ))}
        </div>
      ) : tasks.length === 0 ? (
        <div className="empty-state card" style={{ padding: '48px 24px' }}>
          <div className="empty-icon">📋</div>
          <h3 style={{ marginBottom: 8 }}>No completed tasks yet</h3>
          <p className="text-secondary">Once you complete your assigned tasks, they&apos;ll appear here as your impact history.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {tasks.map(task => {
            const tc = TYPE_COLORS[task.type] || 'var(--text-secondary)';
            const completedDate = task.completed_at
              ? new Date(task.completed_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
              : new Date(task.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
            return (
              <div key={task.id} className="card" style={{ padding: '18px 20px', opacity: 0.85 }}>
                <div className="flex items-start justify-between gap-4">
                  <div style={{ flex: 1 }}>
                    <div className="flex items-center gap-2" style={{ marginBottom: 8 }}>
                      <span className="badge" style={{ background: `${tc}18`, color: tc, border: `1px solid ${tc}30` }}>{task.type}</span>
                      <span className={`badge badge-${task.priority}`}>{task.priority}</span>
                      <span className="badge badge-low">✓ Completed</span>
                      <span style={{ marginLeft: 'auto', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>{completedDate}</span>
                    </div>
                    <div style={{ fontWeight: 600, marginBottom: 6 }}>{task.title}</div>
                    <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                      📍 {task.location || 'No location'}
                    </div>
                    {task.instructions && (
                      <div style={{ background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)', padding: '8px 12px', fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: 8 }}>
                        📝 {task.instructions}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
