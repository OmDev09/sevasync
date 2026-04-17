'use client';

import { useState, useEffect, useCallback } from 'react';
import { useToast } from '../../context/ToastContext';

type ReportData = {
  summary: {
    totalNeeds: number;
    openNeeds: number;
    totalTasks: number;
    completedTasks: number;
    completionRate: number;
    totalVolunteers: number;
    activeVolunteers: number;
    totalPeopleHelped: number;
  };
  needsByType: Record<string, number>;
  needsBySeverity: Record<string, number>;
  tasksByStatus: Record<string, number>;
  recentNeeds: Array<{ created_at: string }>;
  recentTasks: Array<{ created_at: string; status: string }>;
};

export default function AdminReportsPage() {
  const { success, error: toastError } = useToast();
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/reports');
      const json = await res.json();
      setData(json);
    } catch {
      toastError('Failed to load reports');
    } finally {
      setLoading(false);
    }
  }, [toastError]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const s = data?.summary;
  const tn = s?.totalNeeds || 1; // avoid / 0

  const types = [
    { label: 'Medical', color: '#ef4444' },
    { label: 'Food', color: '#f97316' },
    { label: 'Shelter', color: '#6366f1' },
    { label: 'Water', color: '#06b6d4' },
    { label: 'Education', color: '#10b981' },
  ].map(t => ({
    ...t,
    count: data?.needsByType[t.label] || 0,
    pct: data?.needsByType[t.label] ? Math.round((data.needsByType[t.label] / tn) * 100) : 0,
  })).sort((a, b) => b.pct - a.pct);

  // Compute SVG arc offsets
  let currentOffset = 0;
  const donutData = types.map(t => {
    const d = { ...t, offset: currentOffset };
    currentOffset += t.pct;
    return d;
  });

  // Build activity timeline from real data — group needs by week
  const weeklyActivity = buildWeeklyActivity(data?.recentNeeds || [], data?.recentTasks || []);

  const handleExportCsv = () => {
    if (!data) return;

    const rows = [
      ['Metric', 'Value'],
      ['Total Needs', String(data.summary.totalNeeds)],
      ['Open Needs', String(data.summary.openNeeds)],
      ['Total Tasks', String(data.summary.totalTasks)],
      ['Completed Tasks', String(data.summary.completedTasks)],
      ['Completion Rate', `${data.summary.completionRate}%`],
      ['Total Volunteers', String(data.summary.totalVolunteers)],
      ['Active Volunteers', String(data.summary.activeVolunteers)],
      ['People Helped', String(data.summary.totalPeopleHelped)],
      [''],
      ['Need Type', 'Count'],
      ...Object.entries(data.needsByType).map(([k, v]) => [k, String(v)]),
      [''],
      ['Severity', 'Count'],
      ...Object.entries(data.needsBySeverity).map(([k, v]) => [k, String(v)]),
      [''],
      ['Task Status', 'Count'],
      ...Object.entries(data.tasksByStatus).map(([k, v]) => [k, String(v)]),
    ];

    const csv = rows.map(row => (Array.isArray(row) ? row : [row]).map(value => `"${String(value).replaceAll('"', '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `sevasync-report-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    success('CSV exported ✅', 'The report download has started.');
  };

  const handleExportPdf = () => {
    window.print();
    success('Print dialog opened', 'Save as PDF from your browser to export this report.');
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div className="page-header-top">
          <div>
            <h1 className="page-title font-display">📈 Reports & Insights</h1>
            <p className="page-subtitle">Platform-Wide Performance · Live Data</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="btn btn-secondary btn-sm" id="reports-refresh-btn" onClick={fetchData}>🔄 Refresh</button>
            <button className="btn btn-secondary btn-sm" id="reports-export-pdf-btn" onClick={handleExportPdf}>📄 PDF</button>
            <button className="btn btn-primary btn-sm" id="reports-export-csv-btn" onClick={handleExportCsv}>📥 CSV</button>
          </div>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-secondary)' }}>Loading reports...</div>
      ) : (
        <>
          <div className="grid grid-cols-4 gap-4 stagger" style={{ marginBottom: 28 }}>
            {[
              { label: 'Tasks Completed', value: s?.completedTasks || 0, change: `${s?.completionRate || 0}% rate`, icon: '✅', color: 'rgba(16,185,129,0.12)' },
              { label: 'Total Needs Logged', value: s?.totalNeeds || 0, change: `${s?.openNeeds || 0} open`, icon: '📂', color: 'rgba(6,182,212,0.12)' },
              { label: 'Volunteer Utilization', value: s?.activeVolunteers || 0, change: `of ${s?.totalVolunteers || 0} total`, icon: '🙋', color: 'rgba(99,102,241,0.15)' },
              { label: 'People Helped', value: s?.totalPeopleHelped || 0, change: 'Estimated from needs', icon: '👥', color: 'rgba(245,158,11,0.12)' },
            ].map(st => (
              <div key={st.label} className="stat-card animate-fade-in">
                <div className="flex items-center justify-between">
                  <span className="stat-label">{st.label}</span>
                  <div className="stat-icon" style={{ background: st.color }}>{st.icon}</div>
                </div>
                <div className="stat-value">{st.value}</div>
                <div className="stat-change" style={{ color: 'var(--text-secondary)' }}>{st.change}</div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-6" style={{ alignItems: 'start' }}>
            {/* Weekly Activity Bar Chart — Real Data */}
            <div className="card">
              <h3 className="h4" style={{ marginBottom: 20 }}>Weekly Activity (Last 8 Weeks)</h3>
              {weeklyActivity.length === 0 ? (
                <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)' }}>No activity data yet</div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 160, padding: '0 4px' }}>
                  {weeklyActivity.map((w, i) => {
                    const maxCount = Math.max(...weeklyActivity.map(x => x.total), 1);
                    const heightPct = Math.max(5, (w.total / maxCount) * 100);
                    const isThisWeek = i === weeklyActivity.length - 1;
                    return (
                      <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }} title={`${w.label}: ${w.needs} needs, ${w.tasks} tasks`}>
                        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 600 }}>{w.total}</div>
                        <div style={{ display: 'flex', flexDirection: 'column', width: '100%', gap: 1, height: `${heightPct}%` }}>
                          {w.tasks > 0 && (
                            <div style={{
                              flex: w.tasks, borderRadius: '4px 4px 0 0',
                              background: isThisWeek ? 'linear-gradient(180deg, var(--brand-primary) 0%, var(--brand-accent) 100%)' : 'rgba(99,102,241,0.4)',
                              transition: 'height 0.6s ease',
                            }} />
                          )}
                          {w.needs > 0 && (
                            <div style={{
                              flex: w.needs, borderRadius: w.tasks > 0 ? '0' : '4px 4px 0 0',
                              background: isThisWeek ? 'var(--brand-accent)' : 'rgba(16,185,129,0.4)',
                              transition: 'height 0.6s ease',
                            }} />
                          )}
                        </div>
                        <span style={{ fontSize: '0.6rem', color: isThisWeek ? 'var(--brand-primary-light)' : 'var(--text-muted)', fontWeight: isThisWeek ? 700 : 400 }}>{w.label}</span>
                      </div>
                    );
                  })}
                </div>
              )}
              <div className="flex items-center gap-4" style={{ marginTop: 12, justifyContent: 'center' }}>
                <div className="flex items-center gap-2">
                  <div style={{ width: 10, height: 10, borderRadius: 2, background: 'rgba(99,102,241,0.5)' }} />
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Tasks</span>
                </div>
                <div className="flex items-center gap-2">
                  <div style={{ width: 10, height: 10, borderRadius: 2, background: 'rgba(16,185,129,0.5)' }} />
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Needs</span>
                </div>
              </div>
            </div>

            {/* Donut Chart (Dynamic) */}
            <div className="card">
              <h3 className="h4" style={{ marginBottom: 20 }}>Need Distribution by Type</h3>
              <div className="flex items-center gap-8">
                <svg width="120" height="120" viewBox="0 0 42 42" style={{ flexShrink: 0 }}>
                  <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="var(--bg-elevated)" strokeWidth="4" />
                  {donutData.filter(d => d.pct > 0).map((d, i) => (
                    <circle key={i} cx="21" cy="21" r="15.915" fill="transparent" stroke={d.color} strokeWidth="4"
                      strokeDasharray={`${d.pct} ${100 - d.pct}`} strokeDashoffset={25 - d.offset} style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%', transition: 'all 1s ease' }} />
                  ))}
                  {s?.totalNeeds === 0 && <text x="21" y="21" textAnchor="middle" fill="var(--text-secondary)" fontSize="4" dy="1.5">No Data</text>}
                </svg>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
                  {types.map(d => (
                    <div key={d.label} className="flex items-center gap-2">
                      <div style={{ width: 10, height: 10, borderRadius: 2, background: d.color, opacity: d.pct > 0 ? 1 : 0.3 }} />
                      <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>{d.label}</span>
                      <span style={{ marginLeft: 'auto', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)' }}>{d.pct}% <span style={{ opacity: 0.5, fontSize: '0.7rem' }}>({d.count})</span></span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Severity Distribution */}
            <div className="card">
              <h3 className="h4" style={{ marginBottom: 16 }}>Need Severity Overview</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {[
                  { label: 'critical', color: 'var(--critical)', count: data?.needsBySeverity?.['critical'] || 0 },
                  { label: 'high', color: 'var(--high)', count: data?.needsBySeverity?.['high'] || 0 },
                  { label: 'medium', color: 'var(--medium)', count: data?.needsBySeverity?.['medium'] || 0 },
                  { label: 'low', color: 'var(--low)', count: data?.needsBySeverity?.['low'] || 0 },
                ].map(m => (
                  <div key={m.label} style={{ padding: '12px 14px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)' }}>
                    <div className="flex items-center justify-between" style={{ marginBottom: 6 }}>
                      <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', textTransform: 'capitalize' }}>{m.label}</div>
                      <div><span style={{ fontWeight: 700, fontSize: '1rem', color: m.color }}>{m.count}</span><span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}> needs</span></div>
                    </div>
                    <div className="progress-bar" style={{ height: 4 }}>
                      <div className="progress-fill" style={{ width: `${s?.totalNeeds ? (m.count / s.totalNeeds) * 100 : 0}%`, background: m.color }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Task Status Overview */}
            <div className="card">
              <h3 className="h4" style={{ marginBottom: 16 }}>Task Funnel</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[
                  { id: 'unassigned', icon: '📋', count: data?.tasksByStatus?.['unassigned'] || 0, color: 'var(--text-secondary)' },
                  { id: 'assigned', icon: '👤', count: data?.tasksByStatus?.['assigned'] || 0, color: 'var(--brand-primary)' },
                  { id: 'in_progress', icon: '▶️', count: data?.tasksByStatus?.['in_progress'] || 0, color: 'var(--brand-accent)' },
                  { id: 'completed', icon: '✅', count: data?.tasksByStatus?.['completed'] || 0, color: 'var(--low)' },
                ].map(v => (
                  <div key={v.id} className="flex items-center gap-3">
                    <span style={{ fontSize: '1.25rem' }}>{v.icon}</span>
                    <div style={{ flex: 1 }}>
                      <div className="flex items-center justify-between" style={{ marginBottom: 4 }}>
                        <span style={{ fontSize: '0.875rem', fontWeight: 600, textTransform: 'capitalize' }}>{v.id.replace('_', ' ')}</span>
                        <span style={{ fontSize: '0.875rem', fontWeight: 700 }}>{v.count}</span>
                      </div>
                      <div className="progress-bar">
                        <div className="progress-fill" style={{ width: `${s?.totalTasks ? (v.count / s.totalTasks) * 100 : 0}%`, background: v.color }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </>
      )}
    </div>
  );
}

// Build weekly activity from real created_at timestamps
function buildWeeklyActivity(
  needsList: Array<{ created_at: string }>,
  tasksList: Array<{ created_at: string; status: string }>
) {
  const weeks: Array<{ label: string; needs: number; tasks: number; total: number }> = [];
  const now = new Date();

  for (let i = 7; i >= 0; i--) {
    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - (i * 7));
    weekStart.setHours(0, 0, 0, 0);

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);

    const needsCount = needsList.filter(n => {
      const d = new Date(n.created_at);
      return d >= weekStart && d < weekEnd;
    }).length;

    const tasksCount = tasksList.filter(t => {
      const d = new Date(t.created_at);
      return d >= weekStart && d < weekEnd;
    }).length;

    const label = i === 0
      ? 'This wk'
      : i === 1
        ? 'Last wk'
        : `${weekStart.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`;

    weeks.push({
      label,
      needs: needsCount,
      tasks: tasksCount,
      total: needsCount + tasksCount,
    });
  }

  return weeks;
}
