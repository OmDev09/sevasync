'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import type { Task } from '../../../lib/supabase/database.types';

const COLS = [
  { id: 'unassigned', label: 'Unassigned', color: 'var(--medium)', emoji: '📋' },
  { id: 'assigned', label: 'Assigned', color: 'var(--brand-primary-light)', emoji: '👤' },
  { id: 'in_progress', label: 'In Progress', color: 'var(--brand-accent)', emoji: '⚡' },
  { id: 'completed', label: 'Completed', color: 'var(--low)', emoji: '✅' },
];

const TYPE_COLORS: Record<string, string> = {
  Medical: '#ef4444', Food: '#f97316', Shelter: '#6366f1',
  Water: '#06b6d4', Education: '#10b981', Survey: '#8b5cf6',
};

type VolOption = { id: string; name: string };

export default function TasksPage() {
  const { user } = useAuth();
  const { success, error: toastError } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [volunteers, setVolunteers] = useState<VolOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dragging, setDragging] = useState<string | null>(null);
  const [form, setForm] = useState({ title: '', type: 'Medical', priority: 'high', location: '', due: '', volunteer_id: '', instructions: '' });
  const [prefillApplied, setPrefillApplied] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [tasksRes, volsRes] = await Promise.all([
        fetch('/api/tasks'),
        fetch('/api/volunteers'),
      ]);
      const tasksData = await tasksRes.json();
      const volsData = await volsRes.json();
      setTasks(tasksData.tasks || []);
      setVolunteers((volsData.volunteers || []).map((v: { id: string; name: string }) => ({ id: v.id, name: v.name })));
    } catch {
      toastError('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  }, [toastError]);

  useEffect(() => { if (user) fetchData(); }, [user, fetchData]);

  useEffect(() => {
    if (prefillApplied) return;

    const openCreate = searchParams.get('openCreate');
    const title = searchParams.get('title');
    const type = searchParams.get('type');
    const priority = searchParams.get('priority');
    const location = searchParams.get('location');
    const volunteerId = searchParams.get('volunteer_id');
    const instructions = searchParams.get('instructions');

    if (!openCreate && !title && !volunteerId) return;

    setForm(prev => ({
      ...prev,
      title: title || prev.title,
      type: type || prev.type,
      priority: priority || prev.priority,
      location: location || prev.location,
      volunteer_id: volunteerId || prev.volunteer_id,
      instructions: instructions || prev.instructions,
    }));
    setShowModal(true);
    setPrefillApplied(true);
  }, [prefillApplied, searchParams]);

  const getColTasks = (status: string) => tasks.filter(t => t.status === status);

  const moveTask = async (taskId: string, newStatus: string) => {
    // Optimistic update
    setTasks(ts => ts.map(t => t.id === taskId ? { ...t, status: newStatus as Task['status'] } : t));
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error();
    } catch {
      // Revert
      fetchData();
      toastError('Failed to update task status');
    }
  };

  const handleCreate = async () => {
    if (!form.title) { toastError('Validation', 'Title is required'); return; }
    setSaving(true);
    try {
      const body: Record<string, string> = {
        title: form.title,
        type: form.type,
        priority: form.priority,
        location: form.location,
        instructions: form.instructions,
      };
      if (form.due) body.due_date = new Date(form.due).toISOString();
      if (form.volunteer_id) body.volunteer_id = form.volunteer_id;

      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      setTasks(prev => [data.task, ...prev]);
      setShowModal(false);
      router.replace('/admin/tasks');
      setForm({ title: '', type: 'Medical', priority: 'high', location: '', due: '', volunteer_id: '', instructions: '' });
      success('Task Created ✅', `"${form.title}" added to the board.`);
    } catch (e: unknown) {
      toastError('Create failed', e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div className="page-header-top">
          <div>
            <h1 className="page-title font-display">Task Board</h1>
            <p className="page-subtitle">
              {loading ? 'Loading...' : `${tasks.length} total tasks · ${tasks.filter(t => t.priority === 'critical').length} critical`}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button className="btn btn-secondary btn-sm" id="tasks-refresh-btn" onClick={fetchData}>🔄 Refresh</button>
            <button className="btn btn-primary btn-sm" id="tasks-add-btn" onClick={() => setShowModal(true)}>+ New Task</button>
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="flex items-center gap-4" style={{ marginBottom: 24, flexWrap: 'wrap' }}>
        {COLS.map(col => (
          <div key={col.id} className="flex items-center gap-2">
            <span>{col.emoji}</span>
            <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{col.label}:</span>
            <span style={{ fontWeight: 700, color: col.color }}>{getColTasks(col.id).length}</span>
          </div>
        ))}
      </div>

      {/* Kanban Board */}
      {loading ? (
        <div style={{ display: 'flex', gap: 16 }}>
          {COLS.map(col => (
            <div key={col.id} className="kanban-col" style={{ minHeight: 200, opacity: 0.4 }}>
              <div className="kanban-col-header"><span style={{ color: col.color }}>{col.label}</span></div>
              {[1, 2].map(i => (
                <div key={i} style={{ height: 80, background: 'var(--bg-elevated)', borderRadius: 8, marginBottom: 8 }} />
              ))}
            </div>
          ))}
        </div>
      ) : (
        <div style={{ display: 'flex', gap: 16, overflowX: 'auto', paddingBottom: 16, minHeight: 500 }}>
          {COLS.map(col => (
            <div key={col.id} className="kanban-col" style={{ minHeight: 200 }}
              onDragOver={e => e.preventDefault()}
              onDrop={e => { e.preventDefault(); if (dragging) { moveTask(dragging, col.id); setDragging(null); } }}
            >
              <div className="kanban-col-header">
                <div className="flex items-center gap-2">
                  <span style={{ fontSize: '0.9rem' }}>{col.emoji}</span>
                  <span className="kanban-col-title" style={{ color: col.color }}>{col.label}</span>
                </div>
                <span style={{ background: `${col.color}20`, color: col.color, fontSize: '0.75rem', fontWeight: 700, padding: '2px 8px', borderRadius: 'var(--radius-full)' }}>
                  {getColTasks(col.id).length}
                </span>
              </div>

              {getColTasks(col.id).map(task => (
                <TaskCard key={task.id} task={task} onDragStart={() => setDragging(task.id)}
                  onMove={(status) => moveTask(task.id, status)} colOptions={COLS} />
              ))}

              {getColTasks(col.id).length === 0 && (
                <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-muted)', fontSize: '0.8125rem', borderRadius: 'var(--radius-sm)', border: '2px dashed var(--bg-border)', marginTop: 8 }}>
                  Drop task here
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create Task Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
          onClick={e => { if (e.target === e.currentTarget) setShowModal(false); }}
        >
          <div className="card animate-fade-in" style={{ width: '100%', maxWidth: 500, maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="flex items-center justify-between" style={{ marginBottom: 24 }}>
              <h2 className="h3 font-display">Create Task</h2>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowModal(false)} id="task-modal-close-btn">✕</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="form-group">
                <label className="form-label">Task Title *</label>
                <input className="form-input" id="task-title-input" placeholder="What needs to be done?"
                  value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="form-label">Type</label>
                  <select className="form-select" id="task-type-select" value={form.type}
                    onChange={e => setForm(p => ({ ...p, type: e.target.value }))}>
                    {['Medical', 'Food', 'Shelter', 'Water', 'Education', 'Survey', 'Other'].map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Priority</label>
                  <select className="form-select" id="task-priority-select" value={form.priority}
                    onChange={e => setForm(p => ({ ...p, priority: e.target.value }))}>
                    {['critical', 'high', 'medium', 'low'].map(p => <option key={p}>{p}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Location</label>
                <input className="form-input" id="task-location-input" placeholder="Area, City"
                  value={form.location} onChange={e => setForm(p => ({ ...p, location: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="form-label">Due Date</label>
                  <input className="form-input" id="task-due-input" type="date"
                    value={form.due} onChange={e => setForm(p => ({ ...p, due: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Assign Volunteer</label>
                  <select className="form-select" id="task-volunteer-select" value={form.volunteer_id}
                    onChange={e => setForm(p => ({ ...p, volunteer_id: e.target.value }))}>
                    <option value="">— None —</option>
                    {volunteers.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Instructions</label>
                <textarea className="form-input" id="task-instructions-input" rows={3}
                  placeholder="Steps for the volunteer..."
                  value={form.instructions} onChange={e => setForm(p => ({ ...p, instructions: e.target.value }))}
                  style={{ resize: 'vertical' }} />
              </div>
              <div className="flex gap-3" style={{ marginTop: 8 }}>
                <button className="btn btn-primary" id="task-save-btn" onClick={handleCreate}
                  disabled={saving} style={{ flex: 1 }}>
                  {saving ? '⟳ Creating...' : 'Create Task'}
                </button>
                <button className="btn btn-secondary" onClick={() => setShowModal(false)} id="task-cancel-btn">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function TaskCard({ task, onDragStart, onMove, colOptions }: {
  task: Task;
  onDragStart: () => void;
  onMove: (s: string) => void;
  colOptions: typeof COLS;
}) {
  const [showMenu, setShowMenu] = useState(false);
  const typeColor = TYPE_COLORS[task.type] || 'var(--text-secondary)';

  return (
    <div className="kanban-card" draggable onDragStart={onDragStart} style={{ position: 'relative' }}>
      <div className="flex items-center gap-2" style={{ marginBottom: 8 }}>
        <span className={`badge badge-${task.priority}`} style={{ fontSize: '0.675rem' }}>{task.priority}</span>
        <span className="badge" style={{ background: `${typeColor}18`, color: typeColor, border: `1px solid ${typeColor}30`, fontSize: '0.675rem' }}>{task.type}</span>
        <button id={`task-menu-${task.id}-btn`} onClick={() => setShowMenu(!showMenu)}
          style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1rem' }}>⋯</button>
      </div>
      {showMenu && (
        <div style={{ position: 'absolute', right: 8, top: 28, background: 'var(--bg-elevated)', border: '1px solid var(--bg-border)', borderRadius: 'var(--radius-sm)', padding: '4px 0', zIndex: 10, minWidth: 140 }}>
          {colOptions.filter(c => c.id !== task.status).map(c => (
            <button key={c.id} onClick={() => { onMove(c.id); setShowMenu(false); }}
              style={{ display: 'block', width: '100%', padding: '7px 14px', background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: '0.8125rem', cursor: 'pointer', textAlign: 'left' }}>
              Move to {c.label}
            </button>
          ))}
        </div>
      )}
      <div style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: 6, lineHeight: 1.4 }}>{task.title}</div>
      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: 3 }}>
        <span>📍 {task.location || 'No location'}</span>
        <span>⏰ {task.due_date ? new Date(task.due_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : 'No deadline'}</span>
        {task.volunteer_id ? (
          <span>👤 Assigned</span>
        ) : (
          <span style={{ color: 'var(--medium)' }}>⚠️ Unassigned</span>
        )}
      </div>
    </div>
  );
}
