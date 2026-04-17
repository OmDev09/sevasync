import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/tasks
export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  const volunteer_id = searchParams.get('volunteer_id');

  let query = supabase
    .from('tasks')
    .select(`*, volunteer:profiles!tasks_volunteer_id_fkey(id,name,email), need:needs(id,title,type,severity)`)
    .order('created_at', { ascending: false });

  if (status) query = query.eq('status', status);
  if (volunteer_id) query = query.eq('volunteer_id', volunteer_id);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ tasks: data });
}

// POST /api/tasks — create task
export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();

  const { data: task, error: taskError } = await supabase
    .from('tasks')
    .insert({
      title: body.title,
      type: body.type,
      priority: body.priority,
      status: body.volunteer_id ? 'assigned' : 'unassigned',
      need_id: body.need_id || null,
      volunteer_id: body.volunteer_id || null,
      admin_id: user.id,
      location: body.location || null,
      due_date: body.due_date || null,
      instructions: body.instructions || null,
    })
    .select()
    .single();

  if (taskError) return NextResponse.json({ error: taskError.message }, { status: 500 });

  // Fire notification if volunteer assigned
  if (body.volunteer_id && task) {
    await supabase.from('notifications').insert({
      user_id: body.volunteer_id,
      type: 'task_assigned',
      title: 'New task assigned to you',
      body: `"${task.title}" — Due: ${body.due_date ? new Date(body.due_date).toLocaleDateString() : 'TBD'}`,
    });
  }

  return NextResponse.json({ task }, { status: 201 });
}
