'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

type ProfileData = {
  name: string;
  email: string;
  phone: string | null;
  region: string | null;
  skills: string[];
  status: string;
  available_days: string[] | null;
  joined_at: string;
};

const DAY_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

export default function VolunteerProfilePage() {
  const { user } = useAuth();
  const { success, error: toastError } = useToast();

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState<ProfileData | null>(null);
  const [skills, setSkills] = useState<string[]>([]);
  const [availability, setAvailability] = useState<Record<string, boolean>>({});
  const [formFields, setFormFields] = useState({ name: '', email: '', phone: '', region: '' });

  // Load profile data
  const loadProfile = useCallback(async () => {
    if (!user) return;
    try {
      const res = await fetch('/api/auth/me');
      const json = await res.json();
      const p = json.profile as ProfileData;
      if (p) {
        setData(p);
        setSkills(p.skills || []);
        setFormFields({ name: p.name, email: p.email, phone: p.phone || '', region: p.region || '' });
        const avail: Record<string, boolean> = {};
        DAY_KEYS.forEach(d => { avail[d] = (p.available_days || []).includes(d); });
        setAvailability(avail);
      }
    } catch {
      toastError('Failed to load profile');
    }
  }, [user, toastError]);

  useEffect(() => { loadProfile(); }, [loadProfile]);

  const handleSave = async () => {
    setSaving(true);
    try {
      // Build available_days from toggle state
      const available_days = DAY_KEYS.filter(d => availability[d]);

      const res = await fetch('/api/auth/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formFields.name,
          phone: formFields.phone || null,
          region: formFields.region || null,
          skills,
          available_days,
        }),
      });
      if (!res.ok) throw new Error('Update failed');
      setEditing(false);
      success('Profile Updated ✅', 'Your changes have been saved.');
      loadProfile();
    } catch {
      toastError('Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  const initials = data ? data.name.split(' ').map(n => n[0]).join('') : '..';

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div className="page-header-top">
          <div>
            <h1 className="page-title font-display">My Profile</h1>
            <p className="page-subtitle">Manage your personal information and availability</p>
          </div>
          <button className="btn btn-primary btn-sm" id="vol-profile-edit-btn"
            onClick={() => editing ? handleSave() : setEditing(true)}
            disabled={saving}>
            {saving ? '⟳ Saving...' : editing ? '✓ Save Profile' : '✏️ Edit Profile'}
          </button>
        </div>
      </div>

      {!data ? (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-secondary)' }}>Loading profile...</div>
      ) : (
        <div className="grid grid-cols-2 gap-6" style={{ alignItems: 'start' }}>
          {/* Left — Personal Info */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div className="card" style={{ textAlign: 'center', padding: '28px' }}>
              <div className="avatar" style={{ width: 72, height: 72, fontSize: '1.5rem', margin: '0 auto 14px' }}>{initials}</div>
              <div style={{ fontWeight: 700, fontSize: '1.125rem', marginBottom: 4 }}>{data.name}</div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: 10 }}>Volunteer · {data.region || 'No region'}</div>
              <div className="flex items-center justify-center gap-2">
                <div className="dot dot-online" />
                <span className="badge badge-low">{data.status}</span>
              </div>
            </div>

            <div className="card">
              <h3 className="h4" style={{ marginBottom: 16 }}>Personal Information</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {[
                  { label: 'Full Name', id: 'prof-name', value: formFields.name, key: 'name', type: 'text' },
                  { label: 'Email', id: 'prof-email', value: formFields.email, key: 'email', type: 'email', disabled: true },
                  { label: 'Phone', id: 'prof-phone', value: formFields.phone, key: 'phone', type: 'tel' },
                  { label: 'Region / Area', id: 'prof-location', value: formFields.region, key: 'region', type: 'text' },
                ].map(f => (
                  <div key={f.id} className="form-group">
                    <label className="form-label">{f.label}</label>
                    <input className="form-input" id={f.id} type={f.type}
                      value={f.value}
                      onChange={e => setFormFields(p => ({ ...p, [f.key]: e.target.value }))}
                      disabled={!editing || f.disabled}
                      style={{ opacity: editing && !f.disabled ? 1 : 0.7 }}
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="card">
              <h3 className="h4" style={{ marginBottom: 8 }}>Joined</h3>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                📅 {new Date(data.joined_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>
          </div>

          {/* Right — Skills + Availability */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div className="card">
              <h3 className="h4" style={{ marginBottom: 14 }}>Skills</h3>
              <div className="flex gap-2" style={{ flexWrap: 'wrap', marginBottom: 14 }}>
                {skills.map(s => (
                  <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span className="badge badge-brand">{s}</span>
                    {editing && (
                      <button onClick={() => setSkills(prev => prev.filter(sk => sk !== s))}
                        style={{ background: 'none', border: 'none', color: 'var(--critical)', cursor: 'pointer', fontSize: '0.875rem', padding: '0 2px' }}
                        id={`vol-remove-skill-${s}-btn`}>✕</button>
                    )}
                  </div>
                ))}
                {skills.length === 0 && <span style={{ color: 'var(--text-muted)', fontSize: '0.8125rem' }}>No skills added yet</span>}
              </div>
              {editing && (
                <div className="flex gap-2">
                  <input className="form-input" placeholder="Add skill..." id="vol-add-skill-input" style={{ flex: 1 }}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        const val = (e.target as HTMLInputElement).value.trim();
                        if (val && !skills.includes(val)) { setSkills(prev => [...prev, val]); (e.target as HTMLInputElement).value = ''; }
                      }
                    }}
                  />
                  <button className="btn btn-secondary btn-sm" id="vol-add-skill-keydown-hint">↵ Enter</button>
                </div>
              )}
            </div>

            <div className="card">
              <h3 className="h4" style={{ marginBottom: 14 }}>Weekly Availability</h3>
              <div style={{ display: 'flex', gap: 8 }}>
                {DAY_KEYS.map(day => (
                  <button key={day} id={`vol-avail-${day}-btn`}
                    onClick={() => editing && setAvailability(prev => ({ ...prev, [day]: !prev[day] }))}
                    style={{
                      flex: 1, padding: '10px 4px', textAlign: 'center',
                      border: `1px solid ${availability[day] ? 'var(--brand-primary)' : 'var(--bg-border)'}`,
                      borderRadius: 'var(--radius-sm)',
                      background: availability[day] ? 'rgba(99,102,241,0.15)' : 'var(--bg-elevated)',
                      color: availability[day] ? 'var(--brand-primary-light)' : 'var(--text-muted)',
                      cursor: editing ? 'pointer' : 'default',
                      transition: 'all var(--transition-fast)',
                    }}
                  >
                    <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', fontWeight: 700 }}>{day.slice(0, 3)}</div>
                    <div style={{ fontSize: '0.6rem', marginTop: 3 }}>{availability[day] ? '✓' : '—'}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="card">
              <h3 className="h4" style={{ marginBottom: 16 }}>Account Info</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                <div>📧 {data.email}</div>
                <div>🆔 Role: Volunteer</div>
                <div>📊 Status: {data.status}</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
