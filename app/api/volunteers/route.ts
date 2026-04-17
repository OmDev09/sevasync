import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { adminSupabase } from '@/lib/supabase/admin';

// GET /api/volunteers — list volunteers (admin sees their own, super-admin sees all)
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: volunteers, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('role', 'volunteer')
    .order('joined_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ volunteers });
}

// POST /api/volunteers — create a volunteer auth user + profile
export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const name = String(body.name || '').trim();
  const email = String(body.email || '').trim().toLowerCase();
  const phone = body.phone ? String(body.phone).trim() : null;
  const region = body.region ? String(body.region).trim() : null;
  const skills = Array.isArray(body.skills)
    ? body.skills.filter(Boolean).map((skill: unknown) => String(skill).trim()).filter(Boolean)
    : [];

  if (!name || !email) {
    return NextResponse.json({ error: 'Name and email are required.' }, { status: 400 });
  }

  const tempPassword = `Seva@${Math.random().toString(36).slice(-8)}1`;
  const { data: authData, error: authError } = await adminSupabase.auth.admin.createUser({
    email,
    password: tempPassword,
    email_confirm: true,
    user_metadata: { name, role: 'volunteer' },
  });

  if (authError) {
    return NextResponse.json({ error: authError.message }, { status: 400 });
  }

  const { data: profile, error: profileError } = await adminSupabase
    .from('profiles')
    .upsert({
      id: authData.user.id,
      name,
      email,
      role: 'volunteer',
      phone,
      region,
      skills,
      status: 'active',
      admin_id: user.id,
      available_days: [],
    })
    .select()
    .single();

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 500 });
  }

  return NextResponse.json({
    volunteer: profile,
    credentials: {
      email,
      temporaryPassword: tempPassword,
    },
  }, { status: 201 });
}
