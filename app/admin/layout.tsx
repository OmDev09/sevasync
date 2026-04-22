'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, profile, loading } = useAuth();

  useEffect(() => {
    if (!loading && (!user || profile?.role !== 'admin')) {
      router.push('/login');
    }
  }, [user, profile, loading, router]);

  if (loading || !user || !profile) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-base)' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '2rem', marginBottom: 12 }} className="animate-spin">⟳</div>
        <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Loading...</div>
      </div>
    </div>
  );

  const initials = profile.name.split(' ').map((n: string) => n[0]).join('').toUpperCase();

  return (
    <div className="dash-layout">
      <Sidebar role="admin" userName={profile.name} userInitials={initials} />
      <Topbar title="Admin Dashboard" subtitle={`${profile.region || 'Region'} · ${profile.name}`} />
      <main className="dash-main">
        <div className="dash-content">{children}</div>
      </main>
    </div>
  );
}
