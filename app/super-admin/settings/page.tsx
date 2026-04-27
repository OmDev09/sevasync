'use client';

import { useState } from 'react';
import EmojiPicker from 'emoji-picker-react';

export default function SASettingsPage() {
  const [saved, setSaved] = useState(false);
  const [categories, setCategories] = useState([
    { name: 'Medical', icon: '💊', weight: 10, color: '#ef4444' },
    { name: 'Food & Nutrition', icon: '🍱', weight: 8, color: '#f97316' },
    { name: 'Shelter & Housing', icon: '🏠', weight: 8, color: '#6366f1' },
    { name: 'Clean Water', icon: '💧', weight: 7, color: '#06b6d4' },
    { name: 'Education', icon: '📚', weight: 5, color: '#10b981' },
    { name: 'Mental Health', icon: '🧠', weight: 6, color: '#8b5cf6' },
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const [newCategoryForm, setNewCategoryForm] = useState({ name: '', icon: '🏷️', color: '#8b5cf6', weight: 5 });

  const handleSave = () => { setSaved(true); setTimeout(() => setSaved(false), 2000); };

  const handleAddCategoryClick = () => {
    setNewCategoryForm({ name: '', icon: '🏷️', color: '#8b5cf6', weight: 5 });
    setIsModalOpen(true);
  };

  const saveNewCategory = () => {
    if (newCategoryForm.name.trim()) {
      setCategories([...categories, { ...newCategoryForm }]);
      setIsModalOpen(false);
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div className="page-header-top">
          <div>
            <h1 className="page-title font-display">⚙️ Platform Settings</h1>
            <p className="page-subtitle">Configure platform-wide settings and defaults</p>
          </div>
          <button className="btn btn-primary btn-sm" id="settings-save-btn" onClick={handleSave}>
            {saved ? '✓ Saved!' : 'Save Changes'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6" style={{ alignItems: 'start' }}>
        {/* Need Categories */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 className="h4" style={{ margin: 0 }}>Need Categories</h3>
            <button className="btn btn-primary btn-sm" onClick={handleAddCategoryClick} style={{ padding: '4px 10px', fontSize: '0.8125rem' }}>
              + Add Category
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {categories.map(c => (
              <div key={c.name} className="flex items-center gap-3" style={{ padding: '10px 12px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)' }}>
                <span style={{ fontSize: '1.125rem' }}>{c.icon}</span>
                <span style={{ flex: 1, fontSize: '0.875rem', fontWeight: 500 }}>{c.name}</span>
                <div className="flex items-center gap-2">
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Weight:</span>
                  <select className="form-select" style={{ width: 70 }} defaultValue={c.weight} id={`settings-weight-${c.name.replace(/\s+/g, '-').toLowerCase()}`}>
                    {[1,2,3,4,5,6,7,8,9,10].map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
                <div style={{ width: 12, height: 12, borderRadius: 3, background: c.color }} />
              </div>
            ))}
          </div>
        </div>

        {/* Severity Levels + AI Settings */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="card">
            <h3 className="h4" style={{ marginBottom: 16 }}>Severity Thresholds</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { level: 'Critical', min: 80, color: 'var(--critical)' },
                { level: 'High', min: 60, color: 'var(--high)' },
                { level: 'Medium', min: 40, color: 'var(--medium)' },
                { level: 'Low', min: 0, color: 'var(--low)' },
              ].map(s => (
                <div key={s.level} className="flex items-center gap-3">
                  <span className={`badge badge-${s.level.toLowerCase()}`}>{s.level}</span>
                  <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>Score ≥</span>
                  <input className="form-input" style={{ width: 80 }} type="number" defaultValue={s.min} id={`settings-threshold-${s.level.toLowerCase()}`} />
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <h3 className="h4" style={{ marginBottom: 16 }}>AI Scoring Weights</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { label: 'Urgency Keywords', key: 'urgency', val: 25 },
                { label: 'Affected Population', key: 'population', val: 25 },
                { label: 'Location Severity', key: 'location', val: 25 },
                { label: 'Recency & Decay', key: 'recency', val: 15 },
                { label: 'Category Weight', key: 'category', val: 10 },
              ].map(f => (
                <div key={f.key} className="flex items-center gap-3">
                  <span style={{ flex: 1, fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>{f.label}</span>
                  <input className="form-input" style={{ width: 80 }} type="number" defaultValue={f.val} id={`settings-ai-${f.key}`} />
                  <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>%</span>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <h3 className="h4" style={{ marginBottom: 16 }}>Notification Settings</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { label: 'Critical need alerts', id: 'notif-critical', checked: true },
                { label: 'Task completion alerts', id: 'notif-complete', checked: true },
                { label: 'Volunteer onboarding', id: 'notif-onboard', checked: false },
                { label: 'Daily digest email', id: 'notif-digest', checked: true },
              ].map(n => (
                <div key={n.id} className="flex items-center justify-between" style={{ padding: '10px 12px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)' }}>
                  <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{n.label}</span>
                  <div style={{ width: 44, height: 24, borderRadius: 'var(--radius-full)', background: n.checked ? 'var(--brand-primary)' : 'var(--bg-border)', cursor: 'pointer', position: 'relative', transition: 'background var(--transition-fast)' }} id={n.id}>
                    <div style={{ width: 18, height: 18, borderRadius: '50%', background: '#fff', position: 'absolute', top: 3, left: n.checked ? 22 : 4, transition: 'left var(--transition-fast)' }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div className="card" style={{ width: 400, maxWidth: '90%', background: 'var(--bg-card)', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' }}>
            <h3 className="h4" style={{ marginBottom: 16 }}>Add New Category</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ display: 'block', marginBottom: 6, fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-secondary)' }}>Category Name</label>
                <input className="form-input" value={newCategoryForm.name} onChange={e => setNewCategoryForm({...newCategoryForm, name: e.target.value})} placeholder="e.g. Relief Supplies" style={{ width: '100%' }} />
              </div>
              <div style={{ display: 'flex', gap: 16 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: 6, fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-secondary)' }}>Emoji Icon</label>
                  <div style={{ position: 'relative' }}>
                    <button type="button" className="form-input" onClick={() => setIsEmojiPickerOpen(!isEmojiPickerOpen)} style={{ width: '100%', height: 38, padding: 0, fontSize: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: 'var(--bg-elevated)' }}>
                      {newCategoryForm.icon}
                    </button>
                    {isEmojiPickerOpen && (
                      <div style={{ position: 'absolute', top: '100%', left: 0, zIndex: 110, marginTop: 4 }}>
                        <EmojiPicker onEmojiClick={(emojiData) => {
                          setNewCategoryForm({...newCategoryForm, icon: emojiData.emoji});
                          setIsEmojiPickerOpen(false);
                        }} />
                      </div>
                    )}
                  </div>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: 6, fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-secondary)' }}>Color</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input type="color" className="form-input" value={newCategoryForm.color} onChange={e => setNewCategoryForm({...newCategoryForm, color: e.target.value})} style={{ width: 40, height: 38, padding: 2, cursor: 'pointer' }} />
                    <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{newCategoryForm.color}</span>
                  </div>
                </div>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 6, fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-secondary)' }}>Weight (1-10)</label>
                <select className="form-select" value={newCategoryForm.weight} onChange={e => setNewCategoryForm({...newCategoryForm, weight: Number(e.target.value)})} style={{ width: '100%' }}>
                  {[1,2,3,4,5,6,7,8,9,10].map(n => <option key={n} value={n}>{n}</option>)}
                </select>
                <p style={{ marginTop: 4, fontSize: '0.75rem', color: 'var(--text-muted)' }}>Higher weight prioritizes needs in this category.</p>
              </div>
              <div style={{ display: 'flex', gap: 12, marginTop: 8, justifyContent: 'flex-end' }}>
                <button className="btn" onClick={() => setIsModalOpen(false)} style={{ background: 'var(--bg-elevated)', color: 'var(--text-primary)' }}>Cancel</button>
                <button className="btn btn-primary" onClick={saveNewCategory}>Save Category</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
