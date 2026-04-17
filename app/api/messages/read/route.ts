import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// POST /api/messages/read — mark messages as read
export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const ids = Array.isArray(body.ids) ? body.ids : [];

  if (ids.length === 0) {
    return NextResponse.json({ updated: 0 });
  }

  const { error } = await supabase
    .from('messages')
    .update({ read: true })
    .in('id', ids)
    .eq('to_id', user.id); // Only mark messages sent TO the current user

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ updated: ids.length });
}
