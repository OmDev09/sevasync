'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useTheme } from './context/ThemeContext';

const stats = [
  { label: 'Volunteers Coordinated', value: '12,400+' },
  { label: 'NGOs Onboarded', value: '340+' },
  { label: 'Tasks Completed', value: '58,000+' },
  { label: 'Communities Served', value: '1,200+' },
];

const features = [
  {
    icon: '🧠',
    color: 'rgba(18,154,156,0.15)',
    title: 'AI Need Prioritization',
    desc: 'Automatically score and rank incoming needs across all data sources with our weighted AI engine — surfacing the most critical situations instantly.',
  },
  {
    icon: '📡',
    color: 'rgba(244,156,39,0.15)',
    title: 'Multi-Source Intake',
    desc: 'Unify paper forms (OCR), WhatsApp/SMS, mobile entries, and CSV uploads into one structured pipeline — no data left behind.',
  },
  {
    icon: '🗺️',
    color: 'rgba(245,158,11,0.15)',
    title: 'Visual Severity Map',
    desc: 'Interactive heatmaps show high-priority areas at a glance. Color-coded by need type and severity so you always act on what matters most.',
  },
  {
    icon: '⚡',
    color: 'rgba(126,182,79,0.15)',
    title: 'Smart Volunteer Matching',
    desc: 'AI matches the right volunteer to each task based on skills, location proximity, current workload, and real-time availability.',
  },
  {
    icon: '📊',
    color: 'rgba(139,92,246,0.15)',
    title: 'Impact Analytics',
    desc: 'Track response times, volunteer utilization, regional need trends, and overall social impact with live dashboards and exportable reports.',
  },
  {
    icon: '🔐',
    color: 'rgba(239,68,68,0.15)',
    title: '3-Tier Role System',
    desc: 'Super Admin → Admin → Volunteer hierarchy with controlled onboarding. Admins create volunteers; no unauthorized access, ever.',
  },
];

const roles = [
  {
    role: 'Super Admin',
    icon: '👑',
    color: '#129A9C',
    bg: 'rgba(18,154,156,0.08)',
    border: 'rgba(18,154,156,0.2)',
    points: ['Monitor all regions globally', 'Create & manage Admin accounts', 'View global analytics & audit trail', 'Configure platform settings'],
  },
  {
    role: 'Admin',
    icon: '🛠️',
    color: '#F49C27',
    bg: 'rgba(244,156,39,0.08)',
    border: 'rgba(244,156,39,0.2)',
    points: ['Intake & prioritize community needs', 'Create tasks & assign volunteers', 'Manage volunteer accounts', 'Track tasks on Kanban board'],
  },
  {
    role: 'Volunteer',
    icon: '🙋',
    color: '#7EB64F',
    bg: 'rgba(126,182,79,0.08)',
    border: 'rgba(126,182,79,0.2)',
    points: ['View assigned tasks & locations', 'Update progress in real time', 'Communicate with Admin', 'Track personal impact history'],
  },
];

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);
  const { theme, toggleTheme, setTheme } = useTheme();

  useEffect(() => {
    // Default the landing page to light theme IF no theme is explicitly set yet locally
    const stored = localStorage.getItem('sevasync-theme');
    if (!stored) {
      setTheme('light-theme');
    }
  }, []);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div style={{ background: 'var(--bg-base)', color: 'var(--text-primary)', minHeight: '100vh' }}>
      {/* NAV */}
      <nav
        className="landing-nav"
        style={{ boxShadow: scrolled ? 'var(--shadow-md)' : 'none' }}
      >
        <div className="container flex items-center justify-between" style={{ height: '100%' }}>
          <div className="flex items-center gap-3">
            <img src="/Sevasync_Logo.svg" alt="Sevasync Logo" style={{ width: 55, height: 55, borderRadius: 10, objectFit: 'contain' }} />
            <span
              className="font-display font-bold"
              style={{ fontSize: '1.125rem', color: 'var(--text-primary)' }}
            >
              Sevasync<span style={{ color: 'var(--brand-primary-light)' }}> AI</span>
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Link href="#features" className="btn btn-ghost btn-sm" style={{ color: 'var(--text-secondary)' }}>
              Features
            </Link>
            <Link href="#roles" className="btn btn-ghost btn-sm" style={{ color: 'var(--text-secondary)' }}>
              How it works
            </Link>
            <Link href="/login" className="btn btn-primary btn-sm" id="nav-login-btn">
              Login
            </Link>
            <button
              id="theme-toggle"
              onClick={toggleTheme}
              className="btn btn-ghost btn-sm"
              style={{ fontSize: '1.125rem', padding: '6px 8px', marginLeft: 8 }}
              title="Toggle Theme"
            >
              {theme === 'light-theme' ? '🌙' : '☀️'}
            </button>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="landing-hero" style={{ minHeight: '100vh', paddingTop: 120, paddingBottom: 60, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <div className="hero-bg-gradient" />
        <div className="hero-grid" />

        {/* Floating orbs */}
        <div style={{
          position: 'absolute', width: '40vw', height: '40vw', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(18,154,156,0.12) 0%, transparent 70%)',
          top: '-10%', right: '-5%', pointerEvents: 'none'
        }} />
        <div style={{
          position: 'absolute', width: '30vw', height: '30vw', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(244,156,39,0.08) 0%, transparent 70%)',
          bottom: '10%', left: '-10%', pointerEvents: 'none'
        }} />

        <div className="container" style={{ position: 'relative', zIndex: 10 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 64, alignItems: 'center' }}>
            
            {/* LEFT — TEXT */}
            <div className="animate-fade-in" style={{ textAlign: 'left' }}>
              <div
                className="badge badge-brand"
                style={{ display: 'inline-flex', marginBottom: 24, fontSize: '0.8125rem', padding: '6px 16px' }}
              >
               AI-Powered Volunteer Coordination System 
              </div>

              <h1
                className="font-display gradient-text"
                style={{
                  fontSize: 'clamp(2.5rem, 5vw, 4.25rem)',
                  fontWeight: 900,
                  lineHeight: 1.1,
                  marginBottom: 24,
                }}
              >
                Right Help.<br />Right Place.<br />Right Time.
              </h1>

              <p
                style={{
                  fontSize: '1.125rem',
                  color: 'var(--text-secondary)',
                  maxWidth: 520,
                  marginBottom: 40,
                  lineHeight: 1.6,
                }}
              >
                Sevasync AI unifies scattered community data, intelligently prioritizes
                urgent needs, and smartly matches the perfect volunteers, turning fragmented
                information into life-changing action.
              </p>

              <div className="flex items-center gap-4" style={{ flexWrap: 'wrap' }}>
                <Link href="/login" className="btn btn-primary btn-lg" id="hero-get-started-btn">
                  Get Started →
                </Link>
                <Link href="#features" className="btn btn-secondary btn-lg">
                  See Features
                </Link>
              </div>
            </div>

            {/* RIGHT — ABSTRACT GRAPHIC */}
            <div className="animate-fade-in" style={{ position: 'relative', height: 440, display: 'flex', alignItems: 'center', justifyContent: 'center', animationDelay: '0.2s' }}>
              <div style={{ position: 'relative', width: '100%', maxWidth: 460, height: '100%' }}>
                
                {/* Background Analytics Card */}
                <div className="glass-card" style={{ position: 'absolute', top: 20, right: 0, width: '80%', height: 220, padding: 24, transform: 'rotate(3deg)', zIndex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
                    <div style={{ width: '30%', height: 8, background: 'var(--bg-border)', borderRadius: 4 }} />
                    <div style={{ width: '15%', height: 8, background: 'var(--brand-accent)', borderRadius: 4 }} />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, height: 100, borderBottom: '1px solid var(--bg-border)', paddingBottom: 8 }}>
                    <div style={{ flex: 1, background: 'var(--brand-primary)', height: '40%', borderRadius: '4px 4px 0 0', opacity: 0.6 }} />
                    <div style={{ flex: 1, background: 'var(--brand-primary)', height: '70%', borderRadius: '4px 4px 0 0', opacity: 0.8 }} />
                    <div style={{ flex: 1, background: 'var(--brand-accent)', height: '100%', borderRadius: '4px 4px 0 0' }} />
                    <div style={{ flex: 1, background: 'var(--brand-primary)', height: '50%', borderRadius: '4px 4px 0 0', opacity: 0.5 }} />
                  </div>
                </div>

                {/* Foreground Live Match Card */}
                <div className="glass-card" style={{ position: 'absolute', bottom: 40, left: 0, width: '85%', padding: '28px 24px', zIndex: 3, boxShadow: 'var(--shadow-lg)' }}>
                  <div className="flex justify-between items-center mb-6">
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                       <img src="/Sevasync_Logo.svg" alt="Sevasync Logo" style={{ width: 28, height: 28, objectFit: 'contain' }} />
                       <div style={{ fontWeight: 700, letterSpacing: '0.02em', color: 'var(--text-primary)' }}>Live Dispatch</div>
                    </div>
                    <span className="badge badge-high">URGENT</span>
                  </div>
                  
                  <div className="flex gap-4 mb-4">
                    <div style={{ flex: 1, background: 'var(--bg-elevated)', padding: 12, borderRadius: 'var(--radius-sm)' }}>
                       <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 4, textTransform: 'uppercase' }}>Crisis Need</div>
                       <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Medical Supp.</div>
                       <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: 4 }}>📍 Central Dist.</div>
                    </div>
                    <div style={{ flex: 1, background: 'rgba(18,154,156,0.08)', border: '1px solid rgba(18,154,156,0.2)', padding: 12, borderRadius: 'var(--radius-sm)' }}>
                       <div style={{ fontSize: '0.75rem', color: 'var(--brand-primary)', marginBottom: 4, textTransform: 'uppercase' }}>AI Matched</div>
                       <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Dr. Sharma</div>
                       <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: 4 }}>🚗 1.2km away</div>
                    </div>
                  </div>
                  
                  <div className="progress-bar" style={{ height: 4, background: 'var(--bg-border)' }}>
                     <div style={{ height: '100%', width: '100%', background: 'linear-gradient(90deg, var(--brand-primary), var(--brand-accent))', animation: 'progress 2s ease-in-out infinite' }} />
                  </div>
                </div>

                {/* Floating Micro-Badge */}
                <div className="glass-card" style={{ position: 'absolute', top: '15%', left: '-5%', padding: '10px 16px', borderRadius: 'var(--radius-full)', zIndex: 4, display: 'flex', alignItems: 'center', gap: 10, boxShadow: 'var(--shadow-md)' }}>
                  <div className="dot dot-online" />
                  <span style={{ fontWeight: 600, fontSize: '0.8125rem', color: 'var(--text-primary)' }}>14 Active Volunteers</span>
                </div>

              </div>
            </div>
            
          </div>

          {/* STATS */}
          <div
            className="grid stagger animate-fade-in"
            style={{
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: 16,
              marginTop: 80,
              animationDelay: '0.4s',
            }}
          >
            {stats.map((s) => (
              <div
                key={s.label}
                className="glass-card"
                style={{ padding: '24px 16px', textAlign: 'center' }}
              >
                <div
                  className="font-display font-extrabold"
                  style={{ fontSize: '2.25rem', color: 'var(--text-primary)', marginBottom: 4, letterSpacing: '-0.02em' }}
                >
                  {s.value}
                </div>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', fontWeight: 500 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" style={{ padding: '96px 0' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <div className="badge badge-cyan" style={{ display: 'inline-flex', marginBottom: 14, padding: '6px 16px' }}>
              Platform Features
            </div>
            <h2
              className="font-display"
              style={{ fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 12 }}
            >
              Everything you need to coordinate
            </h2>
            <p style={{ color: 'var(--text-secondary)', maxWidth: 480, margin: '0 auto', fontSize: '1rem' }}>
              From data collection to delivery <b>Sevasync AI</b> handles the entire volunteer coordination lifecycle.
            </p>
          </div>

          <div
            className="grid stagger"
            style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}
          >
            {features.map((f) => (
              <div key={f.title} className="feature-card animate-fade-in">
                <div className="feature-icon" style={{ background: f.color }}>
                  {f.icon}
                </div>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>
                  {f.title}
                </h3>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.65 }}>
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ROLES */}
      <section id="roles" style={{ padding: '96px 0', background: 'var(--bg-surface)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <div className="badge badge-brand" style={{ display: 'inline-flex', marginBottom: 14, padding: '6px 16px' }}>
              Role-Based Access
            </div>
            <h2
              className="font-display"
              style={{ fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 12 }}
            >
              Built for every stakeholder
            </h2>
            <p style={{ color: 'var(--text-secondary)', maxWidth: 480, margin: '0 auto' }}>
              Three distinct dashboards tailored to each role — no clutter, just the right tools.
            </p>
          </div>

          <div
            className="grid"
            style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}
          >
            {roles.map((r) => (
              <div
                key={r.role}
                style={{
                  background: r.bg,
                  border: `1px solid ${r.border}`,
                  borderRadius: 'var(--radius-xl)',
                  padding: '28px 24px',
                  transition: 'transform var(--transition-base), box-shadow var(--transition-base)',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-4px)';
                  (e.currentTarget as HTMLDivElement).style.boxShadow = 'var(--shadow-md)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLDivElement).style.transform = '';
                  (e.currentTarget as HTMLDivElement).style.boxShadow = '';
                }}
              >
                <div style={{ fontSize: '2rem', marginBottom: 12 }}>{r.icon}</div>
                <h3
                  className="font-display"
                  style={{ fontSize: '1.125rem', fontWeight: 700, color: r.color, marginBottom: 14 }}
                >
                  {r.role}
                </h3>
                <ul style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {r.points.map((p) => (
                    <li
                      key={p}
                      style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: '0.875rem', color: 'var(--text-secondary)' }}
                    >
                      <span style={{ color: r.color, marginTop: 1 }}>✓</span>
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: '96px 0', position: 'relative', overflow: 'hidden' }}>
        <div style={{
          position: 'absolute', inset: 0,
          background: 'radial-gradient(ellipse 60% 80% at 50% 50%, rgba(18,154,156,0.08) 0%, transparent 70%)',
        }} />
        <div className="container" style={{ textAlign: 'center', position: 'relative' }}>
          <h2
            className="font-display gradient-text"
            style={{ fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', fontWeight: 800, marginBottom: 16 }}
          >
            Ready to coordinate impact?
          </h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 36, maxWidth: 440, margin: '0 auto 36px' }}>
            Join hundreds of NGOs already using Sevasync AI to deliver faster, smarter community relief.
          </p>
          <Link href="/login" className="btn btn-primary btn-lg" id="cta-login-btn">
            Start Now →
          </Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer
        style={{
          borderTop: '1px solid var(--bg-border)',
          padding: '28px 0',
          textAlign: 'center',
          color: 'var(--text-muted)',
          fontSize: '0.8125rem',
        }}
      >
        <div className="container">
          <span style={{ color: 'var(--text-muted)' }}>
            © 2026 Sevasync AI · Built for social impact
          </span>
        </div>
      </footer>
    </div>
  );
}
