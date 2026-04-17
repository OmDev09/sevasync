'use client';

interface TopbarProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export default function Topbar({ title, subtitle, actions }: TopbarProps) {
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
        <button className="topbar-icon-btn" id="topbar-notifications-btn" title="Notifications">
          🔔
          <span className="notification-dot" />
        </button>
        <button className="topbar-icon-btn" id="topbar-search-btn" title="Search">
          🔍
        </button>
      </div>
    </header>
  );
}
