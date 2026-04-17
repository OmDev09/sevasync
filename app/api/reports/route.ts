import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/reports — aggregated stats for the Reports page
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Run all queries in parallel
  const [needsRes, tasksRes, volunteersRes] = await Promise.all([
    supabase.from('needs').select('type, severity, status, people_affected, ai_score, created_at'),
    supabase.from('tasks').select('status, priority, created_at, completed_at, volunteer_id'),
    supabase.from('profiles').select('id, status').eq('role', 'volunteer'),
  ]);

  const needs = needsRes.data || [];
  const tasks = tasksRes.data || [];
  const volunteers = volunteersRes.data || [];

  // Aggregate
  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  const totalTasks = tasks.length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const totalPeople = needs.reduce((sum, n) => sum + (n.people_affected || 0), 0);

  const byType = needs.reduce((acc: Record<string, number>, n) => {
    acc[n.type] = (acc[n.type] || 0) + 1;
    return acc;
  }, {});

  const bySeverity = needs.reduce((acc: Record<string, number>, n) => {
    acc[n.severity] = (acc[n.severity] || 0) + 1;
    return acc;
  }, {});

  const tasksByStatus = tasks.reduce((acc: Record<string, number>, t) => {
    acc[t.status] = (acc[t.status] || 0) + 1;
    return acc;
  }, {});

  return NextResponse.json({
    summary: {
      totalNeeds: needs.length,
      openNeeds: needs.filter(n => n.status === 'open').length,
      totalTasks,
      completedTasks,
      completionRate,
      totalVolunteers: volunteers.length,
      activeVolunteers: volunteers.filter(v => v.status === 'active').length,
      totalPeopleHelped: totalPeople,
    },
    needsByType: byType,
    needsBySeverity: bySeverity,
    tasksByStatus,
    // Provide raw timestamps for weekly chart
    recentNeeds: needs.map(n => ({ created_at: n.created_at })),
    recentTasks: tasks.map(t => ({ created_at: t.created_at, status: t.status })),
  });
}
