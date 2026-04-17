'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';

const stats = [
  { label: 'Volunteers Coordinated', value: '12,400+' },
  { label: 'NGOs Onboarded', value: '340+' },
  { label: 'Tasks Completed', value: '58,000+' },
  { label: 'Communities Served', value: '1,200+' },
];

const features = [
  {
    icon: '🧠',
    color: 'rgba(99,102,241,0.15)',
    title: 'AI Need Prioritization',
    desc: 'Automatically score and rank incoming needs across all data sources with our weighted AI engine — surfacing the most critical situations instantly.',
  },
  {
    icon: '📡',
    color: 'rgba(6,182,212,0.15)',
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
    color: 'rgba(16,185,129,0.15)',
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
    color: '#6366f1',
    bg: 'rgba(99,102,241,0.08)',
    border: 'rgba(99,102,241,0.2)',
    points: ['Monitor all regions globally', 'Create & manage Admin accounts', 'View global analytics & audit trail', 'Configure platform settings'],
  },
  {
    role: 'Admin',
    icon: '🛠️',
    color: '#06b6d4',
    bg: 'rgba(6,182,212,0.08)',
    border: 'rgba(6,182,212,0.2)',
    points: ['Intake & prioritize community needs', 'Create tasks & assign volunteers', 'Manage volunteer accounts', 'Track tasks on Kanban board'],
  },
  {
    role: 'Volunteer',
    icon: '🙋',
    color: '#10b981',
    bg: 'rgba(16,185,129,0.08)',
    border: 'rgba(16,185,129,0.2)',
    points: ['View assigned tasks & locations', 'Update progress in real time', 'Communicate with Admin', 'Track personal impact history'],
  },
];

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div style={{ background: 'var(--bg-base)' }}>
      {/* NAV */}
      <nav
        className="landing-nav"
        style={{ boxShadow: scrolled ? 'var(--shadow-md)' : 'none' }}
      >
        <div className="container flex items-center justify-between" style={{ height: '100%' }}>
          <div className="flex items-center gap-3">
            <div
              style={{
                width: 38, height: 38,
                background: 'linear-gradient(135deg, var(--brand-primary) 0%, var(--brand-accent) 100%)',
                borderRadius: 10,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.25rem',
              }}
            >
              🤝
            </div>
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
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="landing-hero" style={{ minHeight: '100vh' }}>
        <div className="hero-bg-gradient" />
        <div className="hero-grid" />

        {/* Floating orbs */}
        <div style={{
          position: 'absolute', width: 600, height: 600, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 70%)',
          top: -100, right: -100, pointerEvents: 'none'
        }} />
        <div style={{
          position: 'absolute', width: 400, height: 400, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(6,182,212,0.06) 0%, transparent 70%)',
          bottom: 0, left: -50, pointerEvents: 'none'
        }} />

        <div className="container" style={{ position: 'relative', zIndex: 10, textAlign: 'center' }}>
          <div className="animate-fade-in">
            <div
              className="badge badge-brand"
              style={{ display: 'inline-flex', marginBottom: 20, fontSize: '0.8125rem', padding: '6px 16px' }}
            >
              <span>🤖</span> AI-Powered Volunteer Coordination
            </div>

            <h1
              className="font-display gradient-text"
              style={{
                fontSize: 'clamp(2.5rem, 6vw, 4rem)',
                fontWeight: 900,
                lineHeight: 1.1,
                marginBottom: 20,
              }}
            >
              Right Help,<br />Right Place,<br />Right Time.
            </h1>

            <p
              style={{
                fontSize: '1.0625rem',
                color: 'var(--text-secondary)',
                maxWidth: 560,
                margin: '0 auto 36px',
                lineHeight: 1.7,
              }}
            >
              Sevasync AI unifies scattered community data, intelligently prioritizes
              urgent needs, and matches the perfect volunteers — turning fragmented
              information into life-changing action.
            </p>

            <div className="flex items-center justify-center gap-4" style={{ flexWrap: 'wrap' }}>
              <Link href="/login" className="btn btn-primary btn-lg" id="hero-get-started-btn">
                Get Started →
              </Link>
              <Link href="#features" className="btn btn-secondary btn-lg">
                See Features
              </Link>
            </div>
          </div>

          {/* STATS */}
          <div
            className="grid stagger animate-fade-in"
            style={{
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: 16,
              marginTop: 72,
              animationDelay: '0.3s',
            }}
          >
            {stats.map((s) => (
              <div
                key={s.label}
                className="glass-card animate-fade-in"
                style={{ padding: '20px 16px', textAlign: 'center' }}
              >
                <div
                  className="font-display font-extrabold"
                  style={{ fontSize: '1.75rem', color: 'var(--text-primary)', marginBottom: 4 }}
                >
                  {s.value}
                </div>
                <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>{s.label}</div>
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
              From data collection to delivery — Sevasync AI handles the entire volunteer coordination lifecycle.
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
          background: 'radial-gradient(ellipse 60% 80% at 50% 50%, rgba(99,102,241,0.08) 0%, transparent 70%)',
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
