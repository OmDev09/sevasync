'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { createClient } from '../../../lib/supabase/client';
import type { Notification } from '../../../lib/supabase/database.types';

const TYPE_META: Record<string, { icon: string; color: string }> = {
  task_assigned: { icon: '🆕', color: 'rgba(99,102,241,0.15)' },
  task_update:   { icon: '🔄', color: 'rgba(6,182,212,0.12)' },
  message:       { icon: '💬', color: 'rgba(245,158,11,0.12)' },
  alert:         { icon: '🚨', color: 'rgba(239,68,68,0.12)' },
  milestone:     { icon: '🏆', color: 'rgba(34,197,94,0.12)' },
};

export default function VolunteerNotificationsPage() {
  const { user } = useAuth();
  const { success } = useToast();
  const supabase = createClient();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    const res = await fetch('/api/notifications');
    const data = await res.json();
    setNotifications(data.notifications || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!user) return;
    const loadId = window.setTimeout(() => {
      void fetchNotifications();
    }, 0);

    // Supabase Realtime — live notification feed
    const channel = supabase
      .channel(`notifications:${user.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${user.id}`,
      }, (payload) => {
        const newNotif = payload.new as Notification;
        setNotifications(prev => [newNotif, ...prev]);
      })
      .subscribe();

    return () => {
      window.clearTimeout(loadId);
      supabase.removeChannel(channel);
    };
  }, [user, fetchNotifications, supabase]);

  const markRead = async (ids?: string[]) => {
    await fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(ids ? { ids } : {}),
    });
    setNotifications(prev =>
      prev.map(n => (!ids || ids.includes(n.id)) ? { ...n, read: true } : n)
    );
    if (!ids) success('All caught up! ✅', 'All notifications marked as read.');
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div className="page-header-top">
          <div>
            <h1 className="page-title font-display">Notifications</h1>
            <p className="page-subtitle">
              {loading ? 'Loading...' : `${unreadCount} unread · Live updates enabled`}
              <span style={{ marginLeft: 8, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <span className="animate-pulse" style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--low)', display: 'inline-block' }} />
                <span style={{ fontSize: '0.75rem', color: 'var(--low)' }}>Live</span>
              </span>
            </p>
          </div>
          {unreadCount > 0 && (
            <button className="btn btn-secondary btn-sm" id="notif-mark-all-read-btn" onClick={() => markRead()}>
              ✓ Mark all read
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="card" style={{ padding: 20, opacity: 0.4 }}>
              <div style={{ height: 14, width: '40%', background: 'var(--bg-elevated)', borderRadius: 4, marginBottom: 10 }} />
              <div style={{ height: 12, width: '70%', background: 'var(--bg-elevated)', borderRadius: 4 }} />
            </div>
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div className="empty-state card" style={{ padding: '56px 24px' }}>
          <div className="empty-icon">🔔</div>
          <h3 style={{ marginBottom: 8 }}>All clear!</h3>
          <p className="text-secondary">No notifications yet. New task assignments and updates will appear here in real-time.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {notifications.map(n => {
            const meta = TYPE_META[n.type] || { icon: '📌', color: 'rgba(99,102,241,0.1)' };
            return (
              <div
                key={n.id}
                id={`notif-${n.id}`}
                onClick={() => !n.read && markRead([n.id])}
                style={{
                  background: n.read ? 'var(--bg-card)' : meta.color,
                  border: `1px solid ${n.read ? 'var(--bg-border)' : 'rgba(99,102,241,0.2)'}`,
                  borderRadius: 'var(--radius-md)',
                  padding: '16px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 14,
                  cursor: n.read ? 'default' : 'pointer',
                  transition: 'all var(--transition-fast)',
                  opacity: n.read ? 0.75 : 1,
                }}
              >
                <div style={{
                  width: 42, height: 42, borderRadius: '50%',
                  background: n.read ? 'var(--bg-elevated)' : meta.color,
                  border: '1px solid var(--bg-border)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1.125rem', flexShrink: 0,
                }}>
                  {meta.icon}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="flex items-center gap-2" style={{ marginBottom: 4 }}>
                    <span style={{ fontWeight: n.read ? 500 : 700, fontSize: '0.9375rem' }}>{n.title}</span>
                    {!n.read && (
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--brand-primary-light)', display: 'inline-block', flexShrink: 0 }} />
                    )}
                  </div>
                  {n.body && (
                    <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>{n.body}</p>
                  )}
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 6, margin: '6px 0 0' }}>
                    {new Date(n.created_at).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
