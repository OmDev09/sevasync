import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

type Params = { params: Promise<{ id: string }> };

// PATCH /api/tasks/[id] — update status, assign volunteer, etc.
export async function PATCH(request: Request, { params }: Params) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();

  // If marking completed, set completed_at
  const updateData: Record<string, unknown> = { ...body };
  if (body.status === 'completed') {
    updateData.completed_at = new Date().toISOString();
  }

  const { data: task, error } = await supabase
    .from('tasks')
    .update(updateData)
    .eq('id', id)
    .select(`*, volunteer:profiles!tasks_volunteer_id_fkey(id,name,email)`)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Notify volunteer if newly assigned
  if (body.volunteer_id && body.status === 'assigned') {
    await supabase.from('notifications').insert({
      user_id: body.volunteer_id,
      type: 'task_assigned',
      title: '🆕 New task assigned to you',
      body: `"${task.title}"`,
    });
  }

  // Notify admin if volunteer updated status
  if (body.status === 'in_progress' || body.status === 'completed') {
    if (task.admin_id) {
      await supabase.from('notifications').insert({
        user_id: task.admin_id,
        type: 'task_update',
        title: `Task ${body.status === 'completed' ? 'completed ✅' : 'started ▶️'}`,
        body: `"${task.title}" by ${task.volunteer?.name || 'volunteer'}`,
      });
    }
  }

  return NextResponse.json({ task });
}

export async function GET(_req: Request, { params }: Params) {
  const { id } = await params;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('tasks')
    .select(`*, volunteer:profiles!tasks_volunteer_id_fkey(*), need:needs(*)`)
    .eq('id', id)
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 404 });
  return NextResponse.json({ task: data });
}
