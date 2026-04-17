import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// POST /api/messages/broadcast — send a message to all volunteers
export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const text = body.text?.trim();

  if (!text) {
    return NextResponse.json({ error: 'text is required' }, { status: 400 });
  }

  // Check that the sender is an admin
  const { data: senderProfile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!senderProfile || !['admin', 'super-admin'].includes(senderProfile.role)) {
    return NextResponse.json({ error: 'Only admins can broadcast' }, { status: 403 });
  }

  // Get all volunteers
  const { data: volunteers, error: volError } = await supabase
    .from('profiles')
    .select('id')
    .eq('role', 'volunteer');

  if (volError) return NextResponse.json({ error: volError.message }, { status: 500 });
  if (!volunteers || volunteers.length === 0) {
    return NextResponse.json({ error: 'No volunteers to broadcast to' }, { status: 400 });
  }

  // Insert message to each volunteer
  const messages = volunteers.map(v => ({
    from_id: user.id,
    to_id: v.id,
    text: `📢 BROADCAST: ${text}`,
    read: false,
    task_id: null,
  }));

  const { error: insertError } = await supabase
    .from('messages')
    .insert(messages);

  if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 });

  // Also create notifications for each volunteer
  const notifications = volunteers.map(v => ({
    user_id: v.id,
    type: 'alert' as const,
    title: '📢 Admin Broadcast',
    body: text.slice(0, 200),
    read: false,
  }));

  await supabase.from('notifications').insert(notifications);

  return NextResponse.json({ count: volunteers.length }, { status: 201 });
}
