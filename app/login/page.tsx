'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../context/AuthContext';

const DEMO_USERS = [
  { email: 'superadmin@sevasync.com', password: 'Super@123', role: 'super-admin', name: 'Rajesh Patel' },
  { email: 'admin@sevasync.com', password: 'Admin@123', role: 'admin', name: 'Priya Sharma' },
  { email: 'volunteer@sevasync.com', password: 'Volunteer@123', role: 'volunteer', name: 'Amit Kumar' },
];

const ROLE_LABELS: Record<string, { label: string; color: string; icon: string }> = {
  'super-admin': { label: 'Super Admin', color: 'var(--brand-primary-light)', icon: '👑' },
  'admin': { label: 'Admin', color: 'var(--brand-accent)', icon: '🛠️' },
  'volunteer': { label: 'Volunteer', color: 'var(--low)', icon: '🙋' },
};

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const result = await login(email, password);
    if (!result.success) {
      setError(result.error || 'Login failed.');
      setLoading(false);
    }
  };

  const fillDemo = (u: typeof DEMO_USERS[0]) => {
    setEmail(u.email);
    setPassword(u.password);
    setError('');
  };

  return (
    <div className="login-page">
      <Link href="/" className="btn btn-ghost" style={{
        position: 'absolute',
        top: 24,
        left: 24,
        zIndex: 20,
        background: 'var(--glass-bg)',
        padding: '8px 16px',
        borderRadius: 'var(--radius-full)',
        border: '1px solid var(--glass-border)',
        backdropFilter: 'blur(12px)',
      }}>
        ← Back
      </Link>

      {/* Background */}
      <div style={{
        position: 'absolute', inset: 0,
        background: `
          radial-gradient(ellipse 70% 60% at 30% 20%, rgba(99,102,241,0.12) 0%, transparent 60%),
          radial-gradient(ellipse 50% 40% at 80% 80%, rgba(6,182,212,0.08) 0%, transparent 50%)
        `,
      }} />
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: `
          linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)
        `,
        backgroundSize: '60px 60px',
      }} />

      <div style={{ position: 'relative', zIndex: 10, width: '100%', maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 64, alignItems: 'center' }}>

          {/* Left side — branding */}
          <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 36, position: 'relative' }}>
            
            <div style={{ position: 'absolute', width: 400, height: 400, background: 'radial-gradient(circle, var(--brand-primary) 0%, transparent 60%)', opacity: 0.08, top: -80, left: -80, borderRadius: '50%', pointerEvents: 'none' }} />

            <div>
              <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 14, marginBottom: 32, position: 'relative', zIndex: 2 }}>
                <img src="/Sevasync_Logo.svg" alt="Sevasync Logo" style={{ width: 55, height: 55, borderRadius: 12, objectFit: 'contain' }} />
                <span className="font-display font-bold" style={{ fontSize: '1.5rem', color: 'var(--text-primary)' }}>
                  Sevasync <span style={{ color: 'var(--brand-primary-light)' }}> AI</span>
                </span>
              </Link>

              <h1
                className="font-display gradient-text"
                style={{ fontSize: 'clamp(2.5rem, 5vw, 3.5rem)', fontWeight: 900, lineHeight: 1.1, marginBottom: 20, letterSpacing: '-0.02em' }}
              >
                Access the<br />Coordination Grid
              </h1>
              <p style={{ color: 'var(--text-secondary)', fontSize: '1.0625rem', lineHeight: 1.7, maxWidth: 460 }}>
                Authenticate into the primary Sevasync dispatch node to monitor live data and coordinate volunteer operations seamlessly.
              </p>
            </div>



            {/* Demo credentials */}
            <div style={{ marginTop: 12, position: 'relative', zIndex: 2 }}>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 16, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Quick Launch Nodes (Demo)
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {DEMO_USERS.map((u) => {
                  const meta = ROLE_LABELS[u.role];
                  return (
                    <button
                      key={u.role}
                      id={`demo-${u.role}-btn`}
                      onClick={() => fillDemo(u)}
                      className="glass-card"
                      style={{
                        padding: '14px 20px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 16,
                        cursor: 'pointer',
                        transition: 'all var(--transition-base)',
                        textAlign: 'left',
                        boxShadow: 'none'
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLButtonElement).style.transform = 'translateX(4px)';
                        (e.currentTarget as HTMLButtonElement).style.background = 'var(--bg-card-hover)';
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLButtonElement).style.transform = '';
                        (e.currentTarget as HTMLButtonElement).style.background = '';
                      }}
                    >
                      <div style={{ width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-elevated)', borderRadius: '10px', fontSize: '1.25rem' }}>{meta.icon}</div>
                      <div>
                        <div style={{ fontSize: '0.9375rem', fontWeight: 700, color: meta.color, marginBottom: 2 }}>{meta.label}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{u.email}</div>
                      </div>
                      <span style={{ marginLeft: 'auto', fontSize: '0.75rem', color: 'var(--text-muted)' }}>Auto-fill →</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right — Login Card */}
          <div className="login-card glass-card animate-fade-in" style={{ padding: '48px 40px', position: 'relative', boxShadow: 'var(--shadow-xl)', border: 'none', animationDelay: '0.2s' }}>
            {/* Glowing Gradient Border overlay */}
            <div style={{ position: 'absolute', inset: 0, borderRadius: 'inherit', padding: 1, background: 'linear-gradient(135deg, rgba(18,154,156,0.5) 0%, rgba(244,156,39,0.5) 100%)', WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)', WebkitMaskComposite: 'xor', maskComposite: 'exclude', pointerEvents: 'none' }} />

            <div style={{ marginBottom: 32, position: 'relative', zIndex: 2 }}>
              <h2 className="font-display" style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 8, letterSpacing: '-0.02em' }}>
                Login Securely 
              </h2>
              <p style={{ fontSize: '0.9375rem', color: 'var(--text-secondary)' }}>
                Authenticate below to access the interface.
              </p>
            </div>

            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div className="form-group">
                <label className="form-label" htmlFor="login-email">Email address</label>
                <input
                  id="login-email"
                  type="email"
                  className="form-input"
                  placeholder="you@organization.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  suppressHydrationWarning
                />
              </div>

              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label className="form-label" htmlFor="login-password">Password</label>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{ fontSize: '0.75rem', color: 'var(--brand-primary-light)', background: 'none', border: 'none', cursor: 'pointer' }}
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  className="form-input"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  suppressHydrationWarning
                />
              </div>

              {error && (
                <div
                  style={{
                    background: 'rgba(239,68,68,0.1)',
                    border: '1px solid rgba(239,68,68,0.25)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '10px 14px',
                    fontSize: '0.8125rem',
                    color: 'var(--critical)',
                  }}
                >
                  {error}
                </div>
              )}

              <button
                id="login-submit-btn"
                type="submit"
                className="btn btn-primary"
                disabled={loading}
                style={{ padding: '13px 20px', fontSize: '0.9375rem', marginTop: 4 }}
              >
                {loading ? (
                  <>
                    <span className="animate-spin" style={{ display: 'inline-block' }}>⟳</span>
                    Signing in...
                  </>
                ) : (
                  'Sign In →'
                )}
              </button>
            </form>

            <div style={{ marginTop: 28, padding: '16px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--bg-border)', position: 'relative', zIndex: 2 }}>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center', lineHeight: 1.5 }}>
                🔒 <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>End-to-end encrypted link.</span><br/>
                Volunteer nodes must be provisioned by an Administrator.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
