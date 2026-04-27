'use client';

import { useRouter, usePathname } from 'next/navigation';

interface TopbarProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export default function Topbar({ title, subtitle, actions }: TopbarProps) {
  const router = useRouter();
  const pathname = usePathname();

  const handleNotificationClick = () => {
    if (pathname.startsWith('/volunteer')) {
      router.push('/volunteer/notifications');
    }
    // other roles could be added here in the future
  };
  return (
    <header className="topbar" id="topbar">
      <div>
        <div className="topbar-title">{title}</div>
        {subtitle && (
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>{subtitle}</div>
        )}
      </div>
      <div className="topbar-actions">
        {actions}
        {!(pathname.startsWith('/admin') || pathname.startsWith('/super-admin')) && (
          <button className="topbar-icon-btn" id="topbar-notifications-btn" title="Notifications" onClick={handleNotificationClick}>
            🔔
            <span className="notification-dot" />
          </button>
        )}
      </div>
    </header>
  );
}
