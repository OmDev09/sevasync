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

      <div style={{ position: 'relative', zIndex: 10, width: '100%', maxWidth: 1100, margin: '0 auto', padding: '0 24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 440px', gap: 48, alignItems: 'center' }}>

          {/* Left side — branding */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
            <div>
              <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 12, marginBottom: 32 }}>
                <div style={{
                  width: 44, height: 44,
                  background: 'linear-gradient(135deg, var(--brand-primary) 0%, var(--brand-accent) 100%)',
                  borderRadius: 12,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1.5rem',
                }}>🤝</div>
                <span className="font-display font-bold" style={{ fontSize: '1.25rem', color: 'var(--text-primary)' }}>
                  Sevasync<span style={{ color: 'var(--brand-primary-light)' }}> AI</span>
                </span>
              </Link>

              <h1
                className="font-display"
                style={{ fontSize: 'clamp(2rem, 4vw, 2.75rem)', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.1, marginBottom: 16 }}
              >
                Coordinate volunteers.<br />
                <span className="gradient-text">Amplify impact.</span>
              </h1>
              <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', lineHeight: 1.7, maxWidth: 440 }}>
                Sign in to access your personalized dashboard and start making a difference in your community.
              </p>
            </div>

            {/* Demo credentials */}
            <div>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Demo Accounts
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {DEMO_USERS.map((u) => {
                  const meta = ROLE_LABELS[u.role];
                  return (
                    <button
                      key={u.role}
                      id={`demo-${u.role}-btn`}
                      onClick={() => fillDemo(u)}
                      style={{
                        background: 'var(--bg-card)',
                        border: '1px solid var(--bg-border)',
                        borderRadius: 'var(--radius-sm)',
                        padding: '12px 16px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        cursor: 'pointer',
                        transition: 'border-color var(--transition-fast), background var(--transition-fast)',
                        textAlign: 'left',
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--bg-border-hover)';
                        (e.currentTarget as HTMLButtonElement).style.background = 'var(--bg-elevated)';
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--bg-border)';
                        (e.currentTarget as HTMLButtonElement).style.background = 'var(--bg-card)';
                      }}
                    >
                      <span style={{ fontSize: '1.25rem' }}>{meta.icon}</span>
                      <div>
                        <div style={{ fontSize: '0.875rem', fontWeight: 600, color: meta.color }}>{meta.label}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{u.email}</div>
                      </div>
                      <span style={{ marginLeft: 'auto', fontSize: '0.75rem', color: 'var(--text-muted)' }}>Click to fill →</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right — Login Card */}
          <div className="login-card">
            <div style={{ marginBottom: 28 }}>
              <h2 className="font-display" style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>
                Welcome back
              </h2>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                Sign in to your Sevasync AI account
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

            <div style={{ marginTop: 24, padding: '16px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)' }}>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                🔒 Role-based access · Volunteers are onboarded by Admins
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
