'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AIMatchModal from '../components/AIMatchModal';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import type { Need, Task } from '../../lib/supabase/database.types';

const TYPE_COLORS: Record<string, string> = {
  Medical: '#ef4444', Food: '#f97316', Shelter: '#6366f1',
  Water: '#06b6d4', Education: '#10b981',
};

type VolSummary = { id: string; name: string; status: string; skills: string[]; region: string | null };

export default function AdminDashboard() {
  const { profile } = useAuth();
  const { success } = useToast();
  const router = useRouter();

  const [needs, setNeeds] = useState<Need[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [volunteers, setVolunteers] = useState<VolSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'needs' | 'tasks'>('needs');
  const [aiMatchNeed, setAiMatchNeed] = useState<Need | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [nRes, tRes, vRes] = await Promise.all([
        fetch('/api/needs'), fetch('/api/tasks'), fetch('/api/volunteers'),
      ]);
      const [nData, tData, vData] = await Promise.all([nRes.json(), tRes.json(), vRes.json()]);
      setNeeds(nData.needs || []);
      setTasks(tData.tasks || []);
      setVolunteers(vData.volunteers || []);
    } catch { /* ignore */ } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const openNeeds = needs.filter(n => n.status === 'open');
  const criticalNeeds = needs.filter(n => n.severity === 'critical');
  const activeTasks = tasks.filter(t => t.status !== 'completed' && t.status !== 'cancelled');
  const completedTasks = tasks.filter(t => t.status === 'completed');
  const completionRate = tasks.length > 0 ? Math.round((completedTasks.length / tasks.length) * 100) : 0;
  const availableVols = volunteers.filter(v => v.status === 'active');

  const topNeeds = [...needs].sort((a, b) => b.ai_score - a.ai_score).slice(0, 5);
  const recentTasks = [...tasks].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 4);

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="page-header">
        <div className="page-header-top">
          <div>
            <h1 className="page-title font-display">Dashboard</h1>
            <p className="page-subtitle">Welcome, {profile?.name || 'Admin'} · {loading ? 'Loading...' : `${openNeeds.length} open needs`}</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="btn btn-secondary btn-sm" id="admin-refresh-btn" onClick={fetchAll}>🔄 Refresh</button>
            <Link href="/admin/needs" className="btn btn-primary btn-sm" id="admin-add-need-btn">+ Add Need</Link>
          </div>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-4 gap-4 stagger" style={{ marginBottom: 28 }}>
        {[
          { icon: '🙋', label: 'Active Volunteers', value: loading ? '—' : availableVols.length, change: `${volunteers.length} total`, color: 'rgba(6,182,212,0.15)' },
          { icon: '🆘', label: 'Open Needs', value: loading ? '—' : openNeeds.length, change: `${criticalNeeds.length} critical`, color: 'rgba(239,68,68,0.12)' },
          { icon: '✅', label: 'Active Tasks', value: loading ? '—' : activeTasks.length, change: `${tasks.filter(t => t.status === 'in_progress').length} in progress`, color: 'rgba(99,102,241,0.15)' },
          { icon: '📊', label: 'Completion Rate', value: loading ? '—' : `${completionRate}%`, change: `${completedTasks.length} completed`, color: 'rgba(16,185,129,0.12)' },
        ].map(s => (
          <div key={s.label} className="stat-card animate-fade-in">
            <div className="flex items-center justify-between">
              <span className="stat-label">{s.label}</span>
              <div className="stat-icon" style={{ background: s.color }}>{s.icon}</div>
            </div>
            <div className="stat-value">{s.value}</div>
            <div className="stat-change">{s.change}</div>
          </div>
        ))}
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-2 gap-6" style={{ alignItems: 'start' }}>
        {/* Left: Needs/Tasks Toggle */}
        <div>
          <div className="flex items-center gap-3 mb-4">
            {(['needs', 'tasks'] as const).map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)} className="btn btn-sm"
                style={{
                  background: activeTab === tab ? 'rgba(99,102,241,0.15)' : 'transparent',
                  color: activeTab === tab ? 'var(--brand-primary-light)' : 'var(--text-secondary)',
                  border: `1px solid ${activeTab === tab ? 'rgba(99,102,241,0.3)' : 'var(--bg-border)'}`,
                  textTransform: 'capitalize',
                }}
              >{tab === 'needs' ? `🆘 Top Needs (${topNeeds.length})` : `📋 Recent Tasks (${recentTasks.length})`}</button>
            ))}
          </div>

          {activeTab === 'needs' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {topNeeds.map(n => {
                const tc = TYPE_COLORS[n.type] || 'var(--text-secondary)';
                return (
                  <div key={n.id} className="card" style={{ padding: '14px 16px', borderLeft: `3px solid ${n.severity === 'critical' ? 'var(--critical)' : n.severity === 'high' ? 'var(--high)' : 'var(--medium)'}` }}>
                    <div className="flex items-center gap-2" style={{ marginBottom: 6 }}>
                      <span className={`badge badge-${n.severity}`}>{n.severity}</span>
                      <span className="badge" style={{ background: `${tc}18`, color: tc, border: `1px solid ${tc}30` }}>{n.type}</span>
                      <span style={{ marginLeft: 'auto', fontWeight: 700, color: n.ai_score >= 80 ? 'var(--critical)' : 'var(--text-secondary)', fontSize: '0.875rem' }}>🧠 {n.ai_score}</span>
                    </div>
                    <div style={{ fontWeight: 600, marginBottom: 4 }}>{n.title}</div>
                    <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>📍 {n.location} · 👥 {n.people_affected}</div>
                    <div className="flex items-center gap-2" style={{ marginTop: 10 }}>
                      <Link
                        href={`/admin/tasks?openCreate=1&title=${encodeURIComponent(n.title)}&type=${encodeURIComponent(n.type)}&priority=${encodeURIComponent(n.severity)}&location=${encodeURIComponent(n.location)}&instructions=${encodeURIComponent(`Follow up on need: ${n.title}`)}`}
                        className="btn btn-primary btn-sm"
                        id={`dash-create-task-${n.id}`}
                      >
                        ✅ Create Task
                      </Link>
                      <button className="btn btn-accent btn-sm" id={`dash-ai-match-${n.id}`} onClick={() => setAiMatchNeed(n)}>🤖 AI Match</button>
                    </div>
                  </div>
                );
              })}
              <Link href="/admin/needs" className="btn btn-ghost btn-sm" style={{ alignSelf: 'center' }} id="dash-view-all-needs">View all needs →</Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {recentTasks.map(t => (
                <div key={t.id} className="card" style={{ padding: '14px 16px', borderLeft: `3px solid ${t.priority === 'critical' ? 'var(--critical)' : t.priority === 'high' ? 'var(--high)' : 'var(--medium)'}` }}>
                  <div className="flex items-center gap-2" style={{ marginBottom: 6 }}>
                    <span className={`badge badge-${t.priority}`}>{t.priority}</span>
                    <span className="badge badge-muted">{t.status.replace('_', ' ')}</span>
                  </div>
                  <div style={{ fontWeight: 600, marginBottom: 4 }}>{t.title}</div>
                  <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                    📍 {t.location || 'No location'} · ⏰ {t.due_date ? new Date(t.due_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : 'No deadline'}
                  </div>
                </div>
              ))}
              <Link href="/admin/tasks" className="btn btn-ghost btn-sm" style={{ alignSelf: 'center' }} id="dash-view-all-tasks">View task board →</Link>
            </div>
          )}
        </div>

        {/* Right: Volunteers + Quick Links */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="h3">Volunteers</h2>
              <Link href="/admin/volunteers" className="btn btn-ghost btn-sm" id="dash-view-all-vols">View all →</Link>
            </div>
            <div className="card" style={{ padding: '8px 16px' }}>
              {volunteers.slice(0, 5).map(v => (
                <div key={v.id} className="activity-item">
                  <div className="avatar avatar-sm">{v.name.split(' ').map(n => n[0]).join('')}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>{v.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{v.region || 'No region'}</div>
                  </div>
                  <span className={`badge badge-${v.status === 'active' ? 'low' : 'muted'}`} style={{ fontSize: '0.7rem' }}>{v.status}</span>
                </div>
              ))}
              {volunteers.length === 0 && !loading && (
                <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>No volunteers yet</div>
              )}
            </div>
          </div>

          <div className="card" style={{ padding: '16px' }}>
            <h3 className="h4" style={{ marginBottom: 12 }}>Quick Actions</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { icon: '🆘', label: 'Manage Needs', href: '/admin/needs' },
                { icon: '📋', label: 'Task Board', href: '/admin/tasks' },
                { icon: '🧠', label: 'AI Priorities', href: '/admin/priorities' },
                { icon: '📡', label: 'Data Intake', href: '/admin/data-intake' },
                { icon: '📈', label: 'Reports', href: '/admin/reports' },
              ].map(link => (
                <Link key={link.label} href={link.href} className="flex items-center gap-3"
                  style={{ padding: '10px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-elevated)', fontSize: '0.875rem', color: 'var(--text-secondary)', textDecoration: 'none', transition: 'color var(--transition-fast)' }}>
                  <span>{link.icon}</span><span>{link.label}</span><span style={{ marginLeft: 'auto' }}>→</span>
                </Link>
              ))}
            </div>
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
