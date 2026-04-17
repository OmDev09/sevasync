'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '../context/AuthContext';
import type { Task, Notification } from '../../lib/supabase/database.types';

const PRIORITY_COLORS: Record<string, string> = {
  critical: 'var(--critical)', high: 'var(--high)', medium: 'var(--medium)', low: 'var(--low)',
};
const STATUS_BG: Record<string, string> = {
  in_progress: 'rgba(6,182,212,0.12)', assigned: 'rgba(99,102,241,0.12)', completed: 'rgba(16,185,129,0.12)',
};
const STATUS_COLOR: Record<string, string> = {
  in_progress: 'var(--brand-accent)', assigned: 'var(--brand-primary-light)', completed: 'var(--low)',
};

export default function VolunteerDashboard() {
  const { user, profile } = useAuth();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [tRes, nRes] = await Promise.all([
        fetch(`/api/tasks?volunteer_id=${user.id}`),
        fetch('/api/notifications'),
      ]);
      const [tData, nData] = await Promise.all([tRes.json(), nRes.json()]);
      setTasks(tData.tasks || []);
      setNotifications((nData.notifications || []).slice(0, 5));
    } catch { /* ignore */ } finally { setLoading(false); }
  }, [user]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const activeTasks = tasks.filter(t => t.status !== 'completed' && t.status !== 'cancelled');
  const completedTasks = tasks.filter(t => t.status === 'completed');
  const userName = profile?.name || 'Volunteer';
  const initials = userName.split(' ').map(n => n[0]).join('');
  const skills = profile?.skills || [];

  const updateStatus = async (id: string, status: 'in_progress' | 'completed') => {
    await fetch(`/api/tasks/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    setTasks(prev => prev.map(t => t.id === id ? { ...t, status } : t));
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div className="page-header-top">
          <div>
            <h1 className="page-title font-display">My Dashboard</h1>
            <p className="page-subtitle">
              Welcome back, {userName} · {loading ? 'Loading...' : `You have ${activeTasks.length} active tasks`}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="badge badge-low" style={{ padding: '6px 14px', fontSize: '0.8125rem' }}>
              <span className="dot dot-online" style={{ width: 6, height: 6 }} /> {profile?.status || 'active'}
            </span>
            <button className="btn btn-secondary btn-sm" id="vol-dash-refresh" onClick={fetchData}>🔄 Refresh</button>
          </div>
        </div>
      </div>

      {/* Impact cards */}
      <div className="grid grid-cols-4 gap-4 stagger" style={{ marginBottom: 28 }}>
        {[
          { icon: '✅', label: 'Completed', value: loading ? '—' : completedTasks.length, color: 'rgba(16,185,129,0.12)' },
          { icon: '🏃', label: 'Active', value: loading ? '—' : activeTasks.length, color: 'rgba(99,102,241,0.12)' },
          { icon: '🔔', label: 'Notifications', value: loading ? '—' : notifications.filter(n => !n.read).length, color: 'rgba(6,182,212,0.12)' },
          { icon: '📋', label: 'Total Tasks', value: loading ? '—' : tasks.length, color: 'rgba(245,158,11,0.12)' },
        ].map(s => (
          <div key={s.label} className="stat-card animate-fade-in">
            <div className="flex items-center justify-between">
              <span className="stat-label">{s.label}</span>
              <div className="stat-icon" style={{ background: s.color }}>{s.icon}</div>
            </div>
            <div className="stat-value">{s.value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-6" style={{ alignItems: 'start' }}>
        {/* Tasks */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="h3">My Tasks</h2>
            <Link href="/volunteer/tasks" className="btn btn-ghost btn-sm" id="vol-view-all-tasks-btn">View all →</Link>
          </div>

          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[1, 2].map(i => (
                <div key={i} className="card" style={{ padding: 20, opacity: 0.4 }}>
                  <div style={{ height: 16, width: '60%', background: 'var(--bg-elevated)', borderRadius: 4, marginBottom: 10 }} />
                  <div style={{ height: 12, width: '40%', background: 'var(--bg-elevated)', borderRadius: 4 }} />
                </div>
              ))}
            </div>
          ) : tasks.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '32px' }}>
              <div style={{ fontSize: '2rem', marginBottom: 8 }}>📋</div>
              <p style={{ color: 'var(--text-secondary)' }}>No tasks assigned yet. Your admin will assign tasks soon!</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {tasks.slice(0, 4).map(task => (
                <div key={task.id} className="card"
                  style={{ borderLeft: `3px solid ${PRIORITY_COLORS[task.priority]}`, padding: '16px', opacity: task.status === 'completed' ? 0.7 : 1 }}>
                  <div className="flex items-center gap-2" style={{ marginBottom: 6 }}>
                    <span className={`badge badge-${task.priority}`}>{task.priority}</span>
                    <span className="badge" style={{ background: STATUS_BG[task.status] || 'rgba(99,102,241,0.12)', color: STATUS_COLOR[task.status] || 'var(--text-secondary)', border: 'none' }}>
                      {task.status.replace('_', ' ')}
                    </span>
                  </div>
                  <div style={{ fontWeight: 600, fontSize: '0.9375rem', marginBottom: 4 }}>{task.title}</div>
                  <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                    📍 {task.location || 'TBD'} · ⏰ {task.due_date ? new Date(task.due_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : 'No deadline'}
                  </div>
                  {task.instructions && task.status !== 'completed' && (
                    <div style={{ background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)', padding: '10px 12px', fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: 8, lineHeight: 1.6 }}>
                      📝 {task.instructions}
                    </div>
                  )}
                  <div className="flex items-center gap-2" style={{ marginTop: 10 }}>
                    {task.status === 'assigned' && (
                      <button className="btn btn-primary btn-sm" id={`start-task-${task.id}-btn`}
                        onClick={() => updateStatus(task.id, 'in_progress')}>▶ Start</button>
                    )}
                    {task.status === 'in_progress' && (
                      <button className="btn btn-accent btn-sm" id={`complete-task-${task.id}-btn`}
                        onClick={() => updateStatus(task.id, 'completed')}>✓ Complete</button>
                    )}
                    {task.status === 'completed' && (
                      <span style={{ fontSize: '0.8125rem', color: 'var(--low)' }}>✓ Completed</span>
                    )}
                    {task.location && (
                      <a href={`https://maps.google.com/?q=${encodeURIComponent(task.location)}`}
                        target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm"
                        id={`directions-${task.id}-btn`}>🗺️ Directions</a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Notifications */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="h3">Notifications</h2>
              <Link href="/volunteer/notifications" className="badge badge-brand" id="vol-dash-notif-link">
                {notifications.filter(n => !n.read).length} new
              </Link>
            </div>
            <div className="card" style={{ padding: '8px 16px' }}>
              {notifications.length === 0 && !loading ? (
                <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>No notifications</div>
              ) : (
                notifications.map(n => (
                  <div key={n.id} className="activity-item">
                    <div style={{ fontSize: '1.25rem' }}>
                      {n.type === 'task_assigned' ? '🆕' : n.type === 'task_update' ? '🔄' : n.type === 'message' ? '💬' : '📌'}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '0.875rem', color: 'var(--text-primary)', fontWeight: n.read ? 400 : 600 }}>{n.title}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>
                        {new Date(n.created_at).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Profile summary */}
          <div className="card">
            <h3 className="h4" style={{ marginBottom: 16 }}>My Profile</h3>
            <div className="flex items-center gap-14" style={{ marginBottom: 16 }}>
              <div className="avatar avatar-lg" style={{ width: 52, height: 52, fontSize: '1.125rem' }}>{initials}</div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)' }}>{userName}</div>
                <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>Volunteer · {profile?.region || 'No region'}</div>
              </div>
            </div>
            {skills.length > 0 && (
              <>
                <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: 8 }}>Skills:</div>
                <div className="flex gap-2" style={{ flexWrap: 'wrap', marginBottom: 16 }}>
                  {skills.map(s => <span key={s} className="badge badge-brand">{s}</span>)}
                </div>
              </>
            )}
          </div>

          {/* Quick links */}
          <div className="card" style={{ padding: '16px' }}>
            <h3 className="h4" style={{ marginBottom: 12 }}>Quick Actions</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { icon: '📋', label: 'View all my tasks', href: '/volunteer/tasks' },
                { icon: '📜', label: 'Task history', href: '/volunteer/history' },
                { icon: '👤', label: 'Update profile & skills', href: '/volunteer/profile' },
                { icon: '🔔', label: 'Notifications', href: '/volunteer/notifications' },
              ].map(link => (
                <Link key={link.label} href={link.href} className="flex items-center gap-3"
                  style={{ padding: '10px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-elevated)', fontSize: '0.875rem', color: 'var(--text-secondary)', textDecoration: 'none' }}>
                  <span>{link.icon}</span><span>{link.label}</span><span style={{ marginLeft: 'auto' }}>→</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
