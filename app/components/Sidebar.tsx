'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../context/AuthContext';

interface NavItem {
  href: string;
  icon: string;
  label: string;
  badge?: number;
}

interface SidebarProps {
  role: 'super-admin' | 'admin' | 'volunteer';
  userName: string;
  userInitials: string;
}

const SUPER_ADMIN_NAV: NavItem[] = [
  { href: '/super-admin', icon: '📊', label: 'Overview' },
  { href: '/super-admin/admins', icon: '👥', label: 'Admin Management' },
  { href: '/super-admin/analytics', icon: '📈', label: 'Global Analytics' },
  { href: '/super-admin/map', icon: '🗺️', label: 'Global Map' },
  { href: '/super-admin/activity', icon: '📋', label: 'Activity Log' },
  { href: '/super-admin/settings', icon: '⚙️', label: 'System Config' },
  { href: '/super-admin/profile', icon: '👤', label: 'General / Profile' },
];

const ADMIN_NAV: NavItem[] = [
  { href: '/admin', icon: '📊', label: 'Overview' },
  { href: '/admin/needs', icon: '🆘', label: 'Needs', badge: 5 },
  { href: '/admin/data-intake', icon: '📡', label: 'Data Intake' },
  { href: '/admin/priorities', icon: '🧠', label: 'AI Priorities' },
  { href: '/admin/tasks', icon: '✅', label: 'Tasks', badge: 3 },
  { href: '/admin/volunteers', icon: '🙋', label: 'Volunteers' },
  { href: '/admin/map', icon: '🗺️', label: 'Regional Map' },
  { href: '/admin/reports', icon: '📈', label: 'Reports' },
  { href: '/admin/messages', icon: '💬', label: 'Messages', badge: 2 },
  { href: '/admin/profile', icon: '👤', label: 'My Profile' },
];

const VOLUNTEER_NAV: NavItem[] = [
  { href: '/volunteer', icon: '🏠', label: 'My Dashboard' },
  { href: '/volunteer/tasks', icon: '✅', label: 'My Tasks', badge: 2 },
  { href: '/volunteer/notifications', icon: '🔔', label: 'Notifications', badge: 4 },
  { href: '/volunteer/messages', icon: '💬', label: 'Messages', badge: 0 },
  { href: '/volunteer/profile', icon: '👤', label: 'My Profile' },
  { href: '/volunteer/history', icon: '📋', label: 'Task History' },
];

const ROLE_CONFIG = {
  'super-admin': { label: 'Super Admin', color: 'var(--brand-primary-light)', icon: '👑', nav: SUPER_ADMIN_NAV },
  'admin': { label: 'Admin', color: 'var(--brand-accent)', icon: '🛠️', nav: ADMIN_NAV },
  'volunteer': { label: 'Volunteer', color: 'var(--low)', icon: '🙋', nav: VOLUNTEER_NAV },
};

export default function Sidebar({ role, userName, userInitials }: SidebarProps) {
  const pathname = usePathname();
  const { user } = useAuth();
  const config = ROLE_CONFIG[role];

  const [badgeCounts, setBadgeCounts] = useState<{ needs?: number; tasks?: number; messages?: number }>({});
  const [messagesOpened, setMessagesOpened] = useState(false);

  useEffect(() => {
    if (pathname.startsWith('/admin/messages') || pathname.startsWith('/volunteer/messages')) {
      // eslint-disable-next-line
      setMessagesOpened(true);
    }
  }, [pathname]);

  useEffect(() => {
    if (role === 'admin' && user?.id) {
      const fetchCounts = async () => {
        try {
          const [nRes, tRes, mRes] = await Promise.all([
            fetch('/api/needs'), fetch('/api/tasks'), fetch('/api/messages')
          ]);
          const nData = await nRes.json();
          const tData = await tRes.json();
          const mData = await mRes.json();
          const openNeeds = (nData.needs || []).filter((n: { status: string }) => n.status === 'open');
          const activeTasks = (tData.tasks || []).filter((t: { status: string }) => t.status !== 'completed' && t.status !== 'cancelled');
          const unreadMsgs = (mData.messages || []).filter((m: { to_id: string; read: boolean }) => m.to_id === user.id && !m.read);
          setBadgeCounts({ needs: openNeeds.length, tasks: activeTasks.length, messages: unreadMsgs.length });
        } catch {}
      };
      fetchCounts();
    } else if (role === 'volunteer' && user?.id) {
      const fetchCounts = async () => {
        try {
          const [tRes, mRes] = await Promise.all([
            fetch(`/api/tasks?volunteer_id=${user.id}`), fetch('/api/messages')
          ]);
          const tData = await tRes.json();
          const mData = await mRes.json();
          const activeTasks = (tData.tasks || []).filter((t: { status: string }) => t.status !== 'completed' && t.status !== 'cancelled');
          const unreadMsgs = (mData.messages || []).filter((m: { to_id: string; read: boolean }) => m.to_id === user.id && !m.read);
          setBadgeCounts({ tasks: activeTasks.length, messages: unreadMsgs.length });
        } catch {}
      };
      fetchCounts();
    }
  }, [role, user?.id]);

  const navItems = config.nav.map(item => {
    if (role === 'admin') {
      if (item.label === 'Needs' && badgeCounts.needs !== undefined) return { ...item, badge: badgeCounts.needs };
      if (item.label === 'Tasks' && badgeCounts.tasks !== undefined) return { ...item, badge: badgeCounts.tasks };
      if (item.label === 'Messages' && badgeCounts.messages !== undefined) return { ...item, badge: badgeCounts.messages };
    } else if (role === 'volunteer') {
      if (item.label === 'My Tasks' && badgeCounts.tasks !== undefined) return { ...item, badge: badgeCounts.tasks };
      if (item.label === 'Notifications' && badgeCounts.tasks !== undefined) return { ...item, badge: badgeCounts.tasks };
      if (item.label === 'Messages' && badgeCounts.messages !== undefined) return { ...item, badge: badgeCounts.messages };
    }
    return item;
  });

  const isActive = (href: string) => {
    if (href === `/${role}`) return pathname === href;
    return pathname.startsWith(href);
  };

  return (
    <aside className="sidebar" id="sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <img src="/Sevasync_Logo.svg" alt="Sevasync AI" style={{ width: 50, height: 50, borderRadius: 10, objectFit: 'contain' }} />
        <div>
          <div className="sidebar-logo-text">Sevasync <span style={{ color: 'var(--brand-primary-light)' }}> AI</span></div>
        </div>
      </div>

      {/* Role badge */}
      <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--bg-border)' }}>
        <div
          style={{
            background: 'var(--bg-elevated)',
            borderRadius: 'var(--radius-sm)',
            padding: '7px 12px',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            fontSize: '0.8125rem',
          }}
        >
          <span>{config.icon}</span>
          <span style={{ color: config.color, fontWeight: 600 }}>{config.label}</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="sidebar-nav">
        <span className="sidebar-section-label">Navigation</span>
        {navItems.map((item) => {
          const hideBadge = item.label === 'Messages' && messagesOpened;
          return (
          <Link
            key={item.href}
            href={item.href}
            id={`nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
            className={`sidebar-link${isActive(item.href) ? ' active' : ''}`}
          >
            <span className="icon">{item.icon}</span>
            <span>{item.label}</span>
            {item.badge !== undefined && item.badge > 0 && !hideBadge && (
              <span className="badge-count">{item.badge}</span>
            )}
          </Link>
        )})}
      </nav>

      {/* Footer / User */}
      <div className="sidebar-footer">
        <div className="sidebar-user" title="User Profile">
          <div className="sidebar-avatar">{userInitials}</div>
          <div className="sidebar-user-info">
            <div className="sidebar-user-name">{userName}</div>
            <div className="sidebar-user-role" style={{ textTransform: 'capitalize' }}>{role.replace('-', ' ')}</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
