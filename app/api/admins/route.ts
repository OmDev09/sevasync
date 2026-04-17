import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { adminSupabase } from '@/lib/supabase/admin';

// GET /api/admins — list all admins
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Use adminSupabase to bypass RLS, so volunteers can view the list of admins
  const { data, error } = await adminSupabase
    .from('profiles')
    .select('*')
    .in('role', ['admin', 'super-admin']);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ admins: data });
}
