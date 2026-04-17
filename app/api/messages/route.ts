import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/messages — list messages, optionally filtered by user_id
export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('user_id');

  let query = supabase
    .from('messages')
    .select('*')
    .order('created_at', { ascending: true });

  if (userId) {
    // Get conversation between current user and specified user
    query = query.or(
      `and(from_id.eq.${user.id},to_id.eq.${userId}),and(from_id.eq.${userId},to_id.eq.${user.id})`
    );
  } else {
    // Get all messages involving current user
    query = query.or(`from_id.eq.${user.id},to_id.eq.${user.id}`);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ messages: data ?? [] });
}

// POST /api/messages — send a message
export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const { to_id, text, task_id } = body;

  if (!to_id || !text?.trim()) {
    return NextResponse.json({ error: 'to_id and text are required' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('messages')
    .insert({
      from_id: user.id,
      to_id,
      text: text.trim(),
      task_id: task_id || null,
      read: false,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ message: data }, { status: 201 });
}
