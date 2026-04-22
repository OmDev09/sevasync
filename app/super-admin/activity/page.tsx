'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Task, Need, Profile } from '@/lib/supabase/database.types';

type ActivityItem = {
  id: string;
  user: string;
  role: string;
  action: string;
  entity: string;
  timestamp: string;
  icon: string;
  color: string;
};

function formatRelativeTime(dateString: string) {
  const d = new Date(dateString);
  const diffMs = Date.now() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} min ago`;
  const diffHrs = Math.floor(diffMins / 60);
  if (diffHrs < 24) return `${diffHrs} hr ago`;
  const diffDays = Math.floor(diffHrs / 24);
  return `${diffDays} days ago`;
}

export default function SAActivityPage() {
  const [logs, setLogs] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState('All Roles');

  const fetchActivity = useCallback(async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      
      const [tRes, nRes, pRes] = await Promise.all([
        supabase.from('tasks').select('*').order('updated_at', { ascending: false }).limit(20),
        supabase.from('needs').select('*').order('updated_at', { ascending: false }).limit(20),
        supabase.from('profiles').select('*')
      ]);

      const profiles = pRes.data || [];
      const getProfile = (id?: string | null) => profiles.find((p: Profile) => p.id === id);

      const allActivity: ActivityItem[] = [];

      // Map Tasks
      (tRes.data || []).forEach((t: Task) => {
        let userProfile = getProfile(t.admin_id) || getProfile(t.volunteer_id);
        const isCompleted = t.status === 'completed';
        const isStarted = t.status === 'in_progress';
        const isCreated = t.created_at === t.updated_at;

        let actionStr = 'Updated task status';
        if (isCreated) actionStr = 'Created new task';
        if (isStarted) actionStr = 'Started task execution';
        if (isCompleted) actionStr = 'Marked task complete';

        allActivity.push({
          id: `task-${t.id}-${t.updated_at}`,
          user: userProfile?.name || 'System Auto',
          role: userProfile?.role ? userProfile.role.replace('-', ' ') : 'System',
          action: actionStr,
          entity: `${t.title} [State: ${t.status}]`,
          timestamp: t.updated_at,
          icon: isCompleted ? '✅' : isCreated ? '⚡' : '🔄',
          color: isCompleted ? 'rgba(16,185,129,0.12)' : 'rgba(99,102,241,0.15)'
        });
      });

      // Map Needs
      (nRes.data || []).forEach((n: Need) => {
        let userProfile = getProfile(n.admin_id);
        const isResolved = n.status === 'resolved';
        const isCreated = n.created_at === n.updated_at;

        let actionStr = 'Updated need resource';
        if (isCreated) actionStr = 'Logged new need';
        if (isResolved) actionStr = 'Need marked resolved';

        allActivity.push({
          id: `need-${n.id}-${n.updated_at}`,
          user: userProfile?.name || 'Intake Engine',
          role: userProfile?.role ? userProfile.role.replace('-', ' ') : 'System',
          action: actionStr,
          entity: `${n.title} [Priority: ${n.severity}]`,
          timestamp: n.updated_at,
          icon: isCreated ? '🚨' : isResolved ? '🏁' : '📊',
          color: isCreated ? 'rgba(239,68,68,0.12)' : 'rgba(6,182,212,0.12)'
        });
      });

      // Sort combined
      allActivity.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      
      setLogs(allActivity.slice(0, 30));
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchActivity();
    
    // Optional real-time polling to ensure it mimics true stream continuously without complicated RT setup
    const interval = setInterval(fetchActivity, 60000);
    return () => clearInterval(interval);
  }, [fetchActivity]);

  const filteredLogs = logs.filter(l => {
    if (roleFilter === 'All Roles') return true;
    return l.role.toLowerCase() === roleFilter.toLowerCase();
  });

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div className="page-header-top">
          <div>
            <h1 className="page-title font-display">📋 System Activity Log</h1>
            <p className="page-subtitle">Real-time audit trail of platform events</p>
          </div>
          <div className="flex items-center gap-3">
            <select 
              className="form-select" 
              style={{ maxWidth: 180, textTransform: 'capitalize' }} 
              value={roleFilter} 
              onChange={(e) => setRoleFilter(e.target.value)}
              id="activity-filter-role"
            >
              <option>All Roles</option>
              <option>Super admin</option>
              <option>Admin</option>
              <option>Volunteer</option>
              <option>System</option>
            </select>
            <button className="btn btn-secondary btn-sm" id="activity-refresh-btn" onClick={fetchActivity}>
              {loading ? '↻ Loading...' : '🔄 Refresh'}
            </button>
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: '8px 0', minHeight: 400 }}>
        {loading && logs.length === 0 ? (
          <div className="p-8 text-center text-muted">Scanning global events...</div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-8 text-center text-muted">No activity matching filter parameters.</div>
        ) : filteredLogs.map((item) => (
          <div key={item.id} className="activity-item animate-fade-in" style={{ padding: '14px 20px', gap: 14 }}>
            <div style={{ width: 36, height: 36, borderRadius: 'var(--radius-sm)', background: item.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', flexShrink: 0 }}>
              {item.icon}
            </div>
            <div style={{ flex: 1 }}>
              <div className="flex items-center gap-2" style={{ marginBottom: 3, flexWrap: 'wrap' }}>
                <span style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-primary)' }}>{item.user}</span>
                <span className="badge badge-muted" style={{ fontSize: '0.675rem', textTransform: 'capitalize' }}>{item.role}</span>
                <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{item.action}</span>
              </div>
              <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>→ {item.entity}</div>
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', flexShrink: 0 }}>
              {formatRelativeTime(item.timestamp)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
