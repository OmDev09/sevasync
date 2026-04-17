'use client';

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
  { href: '/super-admin/settings', icon: '⚙️', label: 'Settings' },
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
];

const VOLUNTEER_NAV: NavItem[] = [
  { href: '/volunteer', icon: '🏠', label: 'My Dashboard' },
  { href: '/volunteer/tasks', icon: '✅', label: 'My Tasks', badge: 2 },
  { href: '/volunteer/notifications', icon: '🔔', label: 'Notifications', badge: 4 },
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
  const { logout } = useAuth();
  const config = ROLE_CONFIG[role];

  const isActive = (href: string) => {
    if (href === `/${role}`) return pathname === href;
    return pathname.startsWith(href);
  };

  return (
    <aside className="sidebar" id="sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">🤝</div>
        <div>
          <div className="sidebar-logo-text">Sevasync</div>
          <div className="sidebar-logo-badge">AI</div>
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
        {config.nav.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            id={`nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
            className={`sidebar-link${isActive(item.href) ? ' active' : ''}`}
          >
            <span className="icon">{item.icon}</span>
            <span>{item.label}</span>
            {item.badge && item.badge > 0 && (
              <span className="badge-count">{item.badge}</span>
            )}
          </Link>
        ))}
      </nav>

      {/* Footer / User */}
      <div className="sidebar-footer">
        <div className="sidebar-user" onClick={logout} title="Click to logout">
          <div className="sidebar-avatar">{userInitials}</div>
          <div className="sidebar-user-info">
            <div className="sidebar-user-name">{userName}</div>
            <div className="sidebar-user-role">Sign out</div>
          </div>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>→</span>
        </div>
      </div>
    </aside>
  );
}
