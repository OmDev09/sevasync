'use client';

import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { useTheme } from './context/ThemeContext';
import { motion, useInView, animate } from 'framer-motion';

function AnimatedNumber({ value }: { value: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });
  
  const numMatch = value.match(/\d+/g);
  const rawNum = numMatch ? parseInt(numMatch.join(''), 10) : 0;
  const suffix = value.replace(/[\d,]/g, '');

  useEffect(() => {
    if (isInView && ref.current) {
      animate(0, rawNum, {
        duration: 2.5,
        ease: "easeOut",
        onUpdate: (cv) => {
          if (ref.current) {
            ref.current.textContent = Math.floor(cv).toLocaleString() + suffix;
          }
        }
      });
    }
  }, [isInView, rawNum, suffix]);

  return <span ref={ref}>0{suffix}</span>;
}

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
    desc: 'Automatically score and rank incoming needs across all data sources with our weighted AI engine surfacing the most critical situations instantly.',
  },
  {
    icon: '📡',
    color: 'rgba(244,156,39,0.15)',
    title: 'Multi-Source Intake',
    desc: 'Unify paper forms (OCR), WhatsApp/SMS, mobile entries, and CSV uploads into one structured pipeline no data left behind.',
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
    desc: 'Super Admin → Admin → Volunteer hierarchy with controlled onboarding. Admins create volunteers; no unauthorized access, ever!',
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
  const [showAppModal, setShowAppModal] = useState(false);
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
                  <AnimatedNumber value={s.value} />
                </div>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', fontWeight: 500 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" style={{ padding: '120px 0', position: 'relative' }}>
        <div style={{
          position: 'absolute', width: '60vw', height: '60vw', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(18,154,156,0.05) 0%, transparent 60%)',
          top: '10%', right: '-30%', pointerEvents: 'none'
        }} />
        <div className="container" style={{ position: 'relative', zIndex: 10 }}>
          <div style={{ textAlign: 'center', marginBottom: 72 }}>
            <div className="badge badge-cyan" style={{ display: 'inline-flex', marginBottom: 16, padding: '6px 16px' }}>
              Platform Features
            </div>
            <h2
              className="font-display"
              style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 16, letterSpacing: '-0.02em' }}
            >
              Everything you need to coordinate
            </h2>
            <p style={{ color: 'var(--text-secondary)', maxWidth: 520, margin: '0 auto', fontSize: '1.0625rem', lineHeight: 1.6 }}>
              From data collection to delivery — <b>Sevasync AI</b> handles the entire volunteer coordination lifecycle natively.
            </p>
          </div>

          <div className="features-bento stagger">
            {features.map((f, i) => (
              <div 
                key={f.title} 
                className={`feature-card glass-card animate-fade-in bento-${i}`} 
                style={{ 
                  animationDelay: `${i * 0.1}s`,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center'
                }}
              >
                <div className="flex items-start gap-4 mb-2">
                  <div className="feature-icon" style={{ background: f.color, boxShadow: `0 4px 12px ${f.color.replace('0.15', '0.4')}`, flexShrink: 0 }}>
                    {f.icon}
                  </div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: 8 }}>
                    {f.title}
                  </h3>
                </div>
                <p style={{ fontSize: '1rem', color: 'var(--text-secondary)', lineHeight: 1.65, marginTop: 4 }}>
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ROLES */}
      <section id="roles" style={{ padding: '120px 0', background: 'var(--bg-surface)', position: 'relative', overflow: 'hidden' }}>
        <div style={{
          position: 'absolute', width: '50vw', height: '50vw', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(244,156,39,0.06) 0%, transparent 60%)',
          bottom: '-20%', left: '-20%', pointerEvents: 'none'
        }} />
        <div className="container" style={{ position: 'relative', zIndex: 10 }}>
          <div style={{ textAlign: 'center', marginBottom: 72 }}>
            <div className="badge badge-brand" style={{ display: 'inline-flex', marginBottom: 16, padding: '6px 16px' }}>
              Role-Based Access
            </div>
            <h2
              className="font-display"
              style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 16, letterSpacing: '-0.02em' }}
            >
              Built for every stakeholder
            </h2>
            <p style={{ color: 'var(--text-secondary)', maxWidth: 520, margin: '0 auto', fontSize: '1.0625rem' }}>
              Three distinct interconnected dashboards tailored to each role no clutter, just the right tools exactly when needed.
            </p>
          </div>

          <div
            className="grid"
            style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 32 }}
          >
            {roles.map((r, i) => (
              <div
                key={r.role}
                className="glass-card animate-fade-in"
                style={{
                  background: r.bg,
                  border: `1px solid ${r.border}`,
                  padding: '36px 28px',
                  borderRadius: 'var(--radius-xl)',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  position: 'relative',
                  overflow: 'hidden',
                  animationDelay: `${i * 0.15}s`
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-8px) scale(1.02)';
                  (e.currentTarget as HTMLDivElement).style.boxShadow = 'var(--shadow-lg)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLDivElement).style.transform = '';
                  (e.currentTarget as HTMLDivElement).style.boxShadow = '';
                }}
              >
                <div style={{ width: 64, height: 64, fontSize: '2.5rem', marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-elevated)', borderRadius: '16px' }}>{r.icon}</div>
                <h3
                  className="font-display"
                  style={{ fontSize: '1.25rem', fontWeight: 800, color: r.color, marginBottom: 16 }}
                >
                  {r.role}
                </h3>
                <ul style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {r.points.map((p) => (
                    <li
                      key={p}
                      style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: '0.9375rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}
                    >
                      <span style={{ color: r.color, marginTop: 2, fontWeight: 700 }}>✓</span>
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
      <section style={{ padding: '120px 0', position: 'relative', overflow: 'hidden' }}>
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(135deg, rgba(18,154,156,0.08) 0%, rgba(244,156,39,0.08) 100%)',
        }} />
        <div className="container" style={{ position: 'relative', zIndex: 10 }}>
          <div className="glass-card animate-fade-in" style={{ padding: '64px 32px', textAlign: 'center', borderRadius: 'var(--radius-xl)', border: '1px solid var(--bg-border)', boxShadow: 'var(--shadow-xl)', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', width: '300px', height: '300px', background: 'radial-gradient(circle, var(--brand-accent) 0%, transparent 60%)', opacity: 0.15, top: '-100px', left: '-100px', borderRadius: '50%' }} />
            <div style={{ position: 'absolute', width: '300px', height: '300px', background: 'radial-gradient(circle, var(--brand-primary) 0%, transparent 60%)', opacity: 0.15, bottom: '-100px', right: '-100px', borderRadius: '50%' }} />
            
            <h2
              className="font-display gradient-text"
              style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', fontWeight: 900, marginBottom: 20, letterSpacing: '-0.02em', position: 'relative' }}
            >
              Ready to coordinate impact?
            </h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 40, maxWidth: 480, margin: '0 auto 40px', fontSize: '1.125rem', lineHeight: 1.6, position: 'relative' }}>
              Join hundreds of high-impact action networks already using Sevasync AI to deliver faster, smarter community relief.
            </p>
            <Link href="/login" className="btn btn-primary btn-lg" id="cta-login-btn" style={{ fontSize: '1.125rem', padding: '16px 40px', position: 'relative' }}>
              Launch Platform →
            </Link>
          </div>
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

      {/* FAB: Download Mobile App */}
      <button
        onClick={() => setShowAppModal(true)}
        className="animate-fade-in"
        style={{
          position: 'fixed',
          bottom: 32,
          right: 32,
          padding: '12px 24px',
          borderRadius: 'var(--radius-full)',
          background: 'linear-gradient(135deg, var(--brand-primary), var(--brand-accent))',
          color: '#fff',
          border: '1px solid rgba(255,255,255,0.2)',
          boxShadow: '0 8px 32px rgba(18,154,156,0.3)',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          fontSize: '1rem',
          fontWeight: 700,
          cursor: 'pointer',
          zIndex: 999,
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-4px)';
          e.currentTarget.style.boxShadow = '0 12px 36px rgba(18,154,156,0.4)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 8px 32px rgba(18,154,156,0.3)';
        }}
        title="Download Volunteer App"
      >
        <div style={{ width: 28, height: 28, background: 'rgba(255,255,255,0.2)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          ⬇️
        </div>
        Get Volunteer's App
      </button>

      {/* DOWNLOAD MODAL */}
      {showAppModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 10000,
            background: 'rgba(0,0,0,0.75)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowAppModal(false);
          }}
        >
          <div
            className="card animate-fade-in"
            style={{
              width: '100%',
              maxWidth: 440,
              padding: 0,
              textAlign: 'center',
              position: 'relative',
              overflow: 'hidden',
              boxShadow: '0 24px 64px rgba(0,0,0,0.4)',
              border: '1px solid var(--bg-border)'
            }}
          >
            {/* Header graphic */}
            <div style={{ background: 'linear-gradient(135deg, rgba(18,154,156,0.06) 0%, rgba(139,92,246,0.06) 100%)', padding: '40px 24px 30px', position: 'relative' }}>
               <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at top right, var(--brand-accent) 0%, transparent 60%)', opacity: 0.15 }}></div>
               <button
                 onClick={() => setShowAppModal(false)}
                 style={{
                   position: 'absolute', top: 16, right: 16,
                   background: 'var(--bg-elevated)', border: '1px solid var(--bg-border)',
                   width: 32, height: 32, borderRadius: '50%', fontSize: '0.875rem',
                   color: 'var(--text-primary)', cursor: 'pointer', zIndex: 10,
                   display: 'flex', alignItems: 'center', justifyContent: 'center'
                 }}
               >
                 ✕
               </button>
               <div style={{ width: 84, height: 84, background: 'var(--bg-elevated)', borderRadius: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', boxShadow: 'var(--shadow-md)', border: '1px solid var(--bg-border)', position: 'relative' }}>
                  <img src="/Sevasync_Logo.svg" alt="App Logo" style={{ width: 50, height: 50, objectFit: 'contain' }} />
                  <div style={{ position: 'absolute', bottom: -6, right: -6, background: 'var(--brand-primary)', border: '2px solid var(--bg-elevated)', borderRadius: '50%', width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem' }}>✨</div>
               </div>
               <h2 className="h4" style={{ marginBottom: 6, position: 'relative' }}>SevaSync Volunteer</h2>
               <div style={{ display: 'flex', justifyContent: 'center', gap: 10, alignItems: 'center', position: 'relative' }}>
                 <div className="badge badge-brand" style={{ background: 'rgba(34,197,94,0.15)', color: 'var(--low)', border: '1px solid rgba(34,197,94,0.3)', padding: '2px 8px' }}>🤖 Android</div>
                 <span style={{ color: 'var(--text-muted)', fontSize: '0.8125rem' }}>•</span>
                 <span style={{ fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.875rem' }}>v1.0 (Latest)</span>
               </div>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '24px 32px 32px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 20px', background: 'var(--bg-base)', borderRadius: 'var(--radius-sm)', marginBottom: 24, border: '1px solid var(--bg-border-hover)' }}>
                 <div style={{ textAlign: 'left' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4, letterSpacing: '0.05em' }}>Size</div>
                    <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.9375rem' }}>~50 MB</div>
                 </div>
                 <div style={{ width: 1, background: 'var(--bg-border)' }} />
                 <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4, letterSpacing: '0.05em' }}>Requires</div>
                    <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.9375rem' }}>Android 8.0+</div>
                 </div>
                 <div style={{ width: 1, background: 'var(--bg-border)' }} />
                 <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4, letterSpacing: '0.05em' }}>Type</div>
                    <div style={{ fontWeight: 700, color: 'var(--brand-primary)', fontSize: '0.9375rem' }}>.APK</div>
                 </div>
              </div>

              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem', marginBottom: 24, lineHeight: 1.6 }}>
                Receive instant dispatch alerts, seamlessly navigate directly to critical sites, and easily upload live photo proof right from the field.
              </p>
              
              <a
                href="https://github.com/Premdev23/sevasync-volunteer-app/releases/download/v1.0/SevaSync-Volunteer-v1.apk"
                className="btn btn-primary"
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, width: '100%', padding: '16px', fontSize: '1.0625rem', fontWeight: 700, boxShadow: 'var(--shadow-md)' }}
              >
                <span>Download APK File</span>
                <span style={{ fontSize: '1.125rem' }}>⬇️</span>
              </a>
              
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 16, lineHeight: 1.5 }}>
                🔒 Secure package sourced directly from GitHub Releases.<br/>
                You may need to allow "Install from Unknown Sources" on your device.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
