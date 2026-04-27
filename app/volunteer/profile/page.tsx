'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { createClient } from '@/lib/supabase/client';
import { useTheme } from '../../context/ThemeContext';

type ProfileData = {
  name: string;
  email: string;
  phone: string | null;
  region: string | null;
  skills: string[];
  status: string;
  avatar_url: string | null;
  available_days: string[] | null;
  joined_at: string;
};

const DAY_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

export default function VolunteerProfilePage() {
  const { user, logout } = useAuth();
  const { success, error: toastError } = useToast();

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState<ProfileData | null>(null);
  const [skills, setSkills] = useState<string[]>([]);
  const [availability, setAvailability] = useState<Record<string, boolean>>({});
  const [formFields, setFormFields] = useState({ name: '', email: '', phone: '', region: '' });
  const [avatarUrl, setAvatarUrl] = useState('');
  
  const { theme, toggleTheme } = useTheme();
  const [newPassword, setNewPassword] = useState('');
  const [updatingPwd, setUpdatingPwd] = useState(false);

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
        setAvatarUrl(p.avatar_url || '');
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
          avatar_url: avatarUrl || null,
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

  const handleUploadPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    
    // Auto-save state
    setSaving(true);
    try {
      const supabase = createClient();
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Math.random()}.${fileExt}`;
      
      const { error: uploadErr } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true });
        
      if (uploadErr) throw uploadErr;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      setAvatarUrl(publicUrl);
      
      // If currently not editing, immediately apply the change to the DB
      if (!editing) {
         await fetch('/api/auth/me', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ avatar_url: publicUrl }),
         });
         loadProfile();
         success('Photo Uploaded', 'Profile picture successfully changed.');
      }

    } catch (err: any) {
      toastError('Upload failed', err.message || 'Error uploading photo');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      toastError('Invalid Password', 'Password must be at least 6 characters.');
      return;
    }
    setUpdatingPwd(true);
    try {
      const supabase = createClient();
      const { error: pwdErr } = await supabase.auth.updateUser({ password: newPassword });
      if (pwdErr) throw new Error(pwdErr.message);
      
      success('Security Updated', 'Your password has been changed successfully.');
      setNewPassword('');
    } catch (e: any) {
      toastError('Update Failed', e.message);
    } finally {
      setUpdatingPwd(false);
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
          <div className="flex items-center gap-3">
            <button className="btn btn-danger btn-sm" id="vol-profile-logout-btn" onClick={() => logout()} disabled={saving}>
              Log Out ➔
            </button>
            <button className="btn btn-primary btn-sm" id="vol-profile-edit-btn"
              onClick={() => editing ? handleSave() : setEditing(true)}
              disabled={saving}>
              {saving ? '⟳ Saving...' : editing ? '✓ Save Profile' : '✏️ Edit Profile'}
            </button>
          </div>
        </div>
      </div>

      {!data ? (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-secondary)' }}>Loading profile...</div>
      ) : (
        <div className="grid grid-cols-2 gap-6" style={{ alignItems: 'start' }}>
          {/* Left — Personal Info */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div className="card" style={{ textAlign: 'center', padding: '28px' }}>
              <div className="avatar" style={{ width: 72, height: 72, fontSize: '1.5rem', margin: '0 auto 14px', background: avatarUrl ? 'transparent' : 'var(--bg-elevated)', border: avatarUrl ? 'none' : '1px solid var(--bg-border)' }}>
                {avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={avatarUrl} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                ) : (
                  initials
                )}
              </div>
              <div className="flex gap-2 justify-center" style={{ marginBottom: 20 }}>
                <label className="btn btn-secondary btn-sm" style={{ cursor: 'pointer' }}>
                  <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleUploadPhoto} disabled={saving} />
                  {saving ? '⟳ Uploading...' : '📁 Upload Pic'}
                </label>
              </div>
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

            <div className="card">
              <h3 className="h4" style={{ marginBottom: 12 }}>Appearance & UI Settings</h3>
              <div className="flex items-center justify-between" style={{ padding: '16px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--bg-border)' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: 2 }}>Visual Theme</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Switch between Light and Dark interface templates.</div>
                </div>
                <div className="flex items-center gap-2">
                  <span style={{ fontSize: '0.8125rem', color: theme === 'light-theme' ? 'var(--text-primary)' : 'var(--text-muted)' }}>☀️ Light</span>
                  <div onClick={toggleTheme} style={{ width: 44, height: 24, borderRadius: 'var(--radius-full)', background: theme !== 'light-theme' ? 'var(--brand-primary)' : 'var(--bg-border)', cursor: 'pointer', position: 'relative', transition: 'background var(--transition-fast)' }}>
                    <div style={{ width: 18, height: 18, borderRadius: '50%', background: '#fff', position: 'absolute', top: 3, left: theme !== 'light-theme' ? 22 : 4, transition: 'left var(--transition-fast)' }} />
                  </div>
                  <span style={{ fontSize: '0.8125rem', color: theme !== 'light-theme' ? 'var(--text-primary)' : 'var(--text-muted)' }}>🌙 Dark</span>
                </div>
              </div>
            </div>

            <div className="card">
              <h3 className="h4" style={{ marginBottom: 14 }}>Security</h3>
              <div className="form-group" style={{ marginBottom: 12 }}>
                <label className="form-label">New Password</label>
                <div className="flex gap-2">
                  <input className="form-input" style={{ flex: 1 }} type="password" placeholder="••••••••" value={newPassword} onChange={e => setNewPassword(e.target.value)} disabled={updatingPwd} />
                  <button className="btn btn-secondary" onClick={handleUpdatePassword} disabled={updatingPwd || !newPassword}>
                    {updatingPwd ? 'Updating...' : 'Update'}
                  </button>
                </div>
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>We recommend setting a secure password if you are logging in with temporary credentials.</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
