'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import type { Task } from '../../../lib/supabase/database.types';

const PRIORITY_COLORS: Record<string, string> = {
  critical: 'var(--critical)', high: 'var(--high)', medium: 'var(--medium)', low: 'var(--low)',
};

export default function VolunteerTasksPage() {
  const { user } = useAuth();
  const { success, error: toastError } = useToast();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [selected, setSelected] = useState<Task | null>(null);
  const [updating, setUpdating] = useState(false);

  const fetchTasks = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/tasks?volunteer_id=${user.id}`);
      const data = await res.json();
      setTasks(data.tasks || []);
    } catch {
      toastError('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  }, [user, toastError]);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  const updateStatus = async (id: string, status: 'in_progress' | 'completed') => {
    setUpdating(true);
    try {
      const res = await fetch(`/api/tasks/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error('Update failed');
      setTasks(prev => prev.map(t => t.id === id ? { ...t, status } : t));
      if (selected?.id === id) setSelected(prev => prev ? { ...prev, status } : null);
      success(status === 'completed' ? 'Task Completed! 🎉' : 'Task Started ▶️',
        status === 'completed' ? 'Great work! Your admin has been notified.' : 'Keep it up!');
    } catch {
      toastError('Failed to update task status');
    } finally {
      setUpdating(false);
    }
  };

  const filtered = tasks.filter(t => filter === 'all' || t.status === filter);
  const activeTasks = tasks.filter(t => t.status !== 'completed');
  const completedTasks = tasks.filter(t => t.status === 'completed');

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div className="page-header-top">
          <div>
            <h1 className="page-title font-display">My Tasks</h1>
            <p className="page-subtitle">
              {loading ? 'Loading...' : `${activeTasks.length} active · ${completedTasks.length} completed`}
            </p>
          </div>
          <button className="btn btn-secondary btn-sm" id="vol-tasks-refresh-btn" onClick={fetchTasks}>🔄 Refresh</button>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-3" style={{ marginBottom: 20, flexWrap: 'wrap' }}>
        {[
          { key: 'all', label: 'All Tasks', count: tasks.length },
          { key: 'assigned', label: 'Assigned', count: tasks.filter(t => t.status === 'assigned').length },
          { key: 'in_progress', label: 'In Progress', count: tasks.filter(t => t.status === 'in_progress').length },
          { key: 'completed', label: 'Completed', count: tasks.filter(t => t.status === 'completed').length },
        ].map(f => (
          <button key={f.key} id={`vol-tasks-filter-${f.key}-btn`}
            onClick={() => setFilter(f.key)} className="btn btn-sm"
            style={{
              background: filter === f.key ? 'rgba(99,102,241,0.15)' : 'transparent',
              color: filter === f.key ? 'var(--brand-primary-light)' : 'var(--text-secondary)',
              border: `1px solid ${filter === f.key ? 'rgba(99,102,241,0.3)' : 'var(--bg-border)'}`,
            }}
          >{f.label} <span style={{ marginLeft: 4, opacity: 0.7 }}>({f.count})</span></button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-6" style={{ alignItems: 'start' }}>
        {/* Task list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {loading ? (
            [1, 2, 3].map(i => (
              <div key={i} className="card" style={{ padding: 20, opacity: 0.5 }}>
                <div style={{ height: 16, width: '70%', background: 'var(--bg-elevated)', borderRadius: 4, marginBottom: 12 }} />
                <div style={{ height: 12, width: '50%', background: 'var(--bg-elevated)', borderRadius: 4 }} />
              </div>
            ))
          ) : filtered.length === 0 ? (
            <div className="empty-state card">
              <div className="empty-icon">📋</div>
              <p className="text-secondary">
                {tasks.length === 0
                  ? 'No tasks assigned yet. Your admin will assign tasks soon!'
                  : 'No tasks match this filter.'}
              </p>
            </div>
          ) : (
            filtered.map(task => (
              <div key={task.id} className="card"
                style={{
                  padding: '16px',
                  borderLeft: `3px solid ${PRIORITY_COLORS[task.priority]}`,
                  cursor: 'pointer',
                  opacity: task.status === 'completed' ? 0.7 : 1,
                  outline: selected?.id === task.id ? '1px solid var(--brand-primary)' : 'none',
                }}
                onClick={() => setSelected(task)} id={`vol-task-card-${task.id}`}
              >
                <div className="flex items-center gap-2" style={{ marginBottom: 8, flexWrap: 'wrap' }}>
                  <span className={`badge badge-${task.priority}`}>{task.priority}</span>
                  <span className="badge badge-muted">{task.type}</span>
                  <span className="badge" style={{
                    background: task.status === 'completed' ? 'rgba(34,197,94,0.12)'
                      : task.status === 'in_progress' ? 'rgba(6,182,212,0.12)'
                        : 'rgba(99,102,241,0.12)',
                    color: task.status === 'completed' ? 'var(--low)'
                      : task.status === 'in_progress' ? 'var(--brand-accent)'
                        : 'var(--brand-primary-light)',
                    border: 'none',
                  }}>
                    {task.status.replace('_', ' ')}
                  </span>
                </div>
                <div style={{ fontWeight: 600, marginBottom: 4 }}>{task.title}</div>
                <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                  📍 {task.location || 'Location TBD'} · ⏰ {task.due_date ? new Date(task.due_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'No deadline'}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Task Detail Panel */}
        {selected ? (
          <div className="card animate-fade-in" style={{ position: 'sticky', top: 80 }}>
            <div className="flex items-center justify-between" style={{ marginBottom: 16 }}>
              <h3 className="h4">Task Details</h3>
              <button className="btn btn-ghost btn-sm" onClick={() => setSelected(null)} id="vol-task-detail-close">✕</button>
            </div>
            <div className="flex items-center gap-2" style={{ marginBottom: 12 }}>
              <span className={`badge badge-${selected.priority}`}>{selected.priority}</span>
              <span className="badge badge-muted">{selected.type}</span>
            </div>
            <h3 style={{ fontWeight: 700, marginBottom: 12, lineHeight: 1.3 }}>{selected.title}</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
              {[
                { icon: '📍', label: selected.location || 'Location TBD' },
                { icon: '⏰', label: `Due: ${selected.due_date ? new Date(selected.due_date).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'No deadline'}` },
                { icon: '📅', label: `Assigned: ${new Date(selected.created_at).toLocaleDateString('en-IN')}` },
              ].map(f => (
                <div key={f.label} className="flex items-center gap-3">
                  <span style={{ fontSize: '1rem' }}>{f.icon}</span>
                  <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{f.label}</span>
                </div>
              ))}
            </div>
            {selected.instructions && (
              <>
                <div className="divider" />
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: 8 }}>Instructions</div>
                  <div style={{ background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)', padding: '12px 14px', fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                    {selected.instructions}
                  </div>
                </div>
              </>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {selected.status === 'assigned' && (
                <button className="btn btn-primary" id={`vol-start-task-${selected.id}-btn`}
                  disabled={updating} onClick={() => updateStatus(selected.id, 'in_progress')}>
                  {updating ? '⟳ Updating...' : '▶ Start Task'}
                </button>
              )}
              {selected.status === 'in_progress' && (
                <button className="btn btn-accent" id={`vol-complete-task-${selected.id}-btn`}
                  disabled={updating} onClick={() => updateStatus(selected.id, 'completed')}>
                  {updating ? '⟳ Updating...' : '✓ Mark Complete'}
                </button>
              )}
              {selected.status === 'completed' && (
                <div style={{ textAlign: 'center', padding: '12px', background: 'rgba(34,197,94,0.08)', borderRadius: 'var(--radius-sm)', color: 'var(--low)', fontWeight: 600 }}>
                  ✅ Task Completed
                </div>
              )}
              {selected.location && (
                <a href={`https://maps.google.com/?q=${encodeURIComponent(selected.location)}`}
                  target="_blank" rel="noopener noreferrer"
                  className="btn btn-secondary" id={`vol-directions-${selected.id}-btn`}>
                  🗺️ Get Directions
                </a>
              )}
            </div>
          </div>
        ) : (
          <div className="card" style={{ textAlign: 'center', padding: '40px 24px' }}>
            <div className="empty-icon">📋</div>
            <p className="text-secondary">Select a task to see full details and take action</p>
          </div>
        )}
      </div>
    </div>
  );
}
