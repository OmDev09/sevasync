'use client';

import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { createClient } from '@/lib/supabase/client';
import { useTheme } from '../../context/ThemeContext';

export default function AdminProfilePage() {
  const { profile, logout } = useAuth();
  const { success, error: toastError } = useToast();
  const { theme, toggleTheme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [updatingPwd, setUpdatingPwd] = useState(false);

  if (!profile) return null;

  const handleLogout = async () => {
    setLoading(true);
    await logout();
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

  const initials = profile.name.split(' ').map((n: string) => n[0]).join('').toUpperCase();
  const joinedDate = new Date(profile.joined_at || Date.now()).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div className="page-header-top">
          <div>
            <h1 className="page-title font-display">My Profile</h1>
            <p className="page-subtitle">Manage your account and preferences</p>
          </div>
          <div className="flex items-center gap-3">
            <button 
              className="btn btn-danger btn-sm" 
              onClick={handleLogout} 
              disabled={loading}
              id="admin-logout-btn"
            >
              {loading ? 'Logging out...' : 'Log Out ➔'}
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6" style={{ alignItems: 'start' }}>
        {/* Left Column: Quick Profile Summary */}
        <div className="card" style={{ padding: 32, textAlign: 'center', gridColumn: 'span 1' }}>
          <div className="avatar" style={{ width: 80, height: 80, fontSize: '2rem', margin: '0 auto 16px', background: 'var(--brand-accent-light)', color: 'var(--brand-accent)' }}>
            {initials}
          </div>
          <h2 className="h3" style={{ marginBottom: 4 }}>{profile.name}</h2>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: 16 }}>{profile.email}</div>
          
          <span className="badge" style={{ background: 'rgba(99,102,241,0.1)', color: 'var(--brand-primary-light)', border: '1px solid rgba(99,102,241,0.2)', marginBottom: 24, padding: '6px 12px' }}>
            Administrator
          </span>

          <div style={{ padding: '20px 0', borderTop: '1px solid var(--bg-border)', display: 'flex', flexDirection: 'column', gap: 12, textAlign: 'left', marginTop: 12 }}>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Status</div>
              <div style={{ fontWeight: 600, color: 'var(--low)' }}>🟢 Active</div>
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Date Joined</div>
              <div style={{ fontWeight: 600 }}>{joinedDate}</div>
            </div>
          </div>
        </div>

        {/* Right Column: Detailed Info & Settings */}
        <div className="grid grid-cols-1 gap-6" style={{ gridColumn: 'span 2' }}>
          
          <div className="card" style={{ padding: 24 }}>
            <h3 className="h4" style={{ marginBottom: 20 }}>Account Details</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input className="form-input" disabled value={profile.name} />
              </div>
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input className="form-input" disabled value={profile.email} />
              </div>
              <div className="form-group">
                <label className="form-label">Supervised Region</label>
                <input className="form-input" disabled value={profile.region || 'Not Assigned'} />
              </div>
              <div className="form-group">
                <label className="form-label">Phone Number</label>
                <input className="form-input" disabled value={profile.phone || 'No phone registered'} />
              </div>
            </div>
            <div style={{ marginTop: 24 }}>
              <button 
                className="btn btn-secondary" 
                onClick={() => success('Profile Settings', 'Contact Super Admin to modify restricted details.')}
              >
                Request Detail Update
              </button>
            </div>
          </div>

          <div className="card" style={{ padding: 24 }}>
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

          <div className="card" style={{ padding: 24 }}>
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
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>We recommend setting a secure password instead of using the generated temporary key.</div>
          </div>

        </div>
      </div>
    </div>
  );
}
