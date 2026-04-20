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

// POST /api/admins — create an admin auth user + profile
export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // verify the executing user is a super-admin
  const { data: currentUserProfile } = await adminSupabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();
    
  if (currentUserProfile?.role !== 'super-admin') {
     return NextResponse.json({ error: 'Forbidden. Only Super Admins can create new Admins.' }, { status: 403 });
  }

  const body = await request.json();
  const name = String(body.name || '').trim();
  const email = String(body.email || '').trim().toLowerCase();
  const phone = body.phone ? String(body.phone).trim() : null;
  const region = body.region ? String(body.region).trim() : null;

  if (!name || !email) {
    return NextResponse.json({ error: 'Name and email are required.' }, { status: 400 });
  }

  const tempPassword = `Admin@${Math.random().toString(36).slice(-8)}1`;
  const { data: authData, error: authError } = await adminSupabase.auth.admin.createUser({
    email,
    password: tempPassword,
    email_confirm: true,
    user_metadata: { name, role: 'admin' },
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
      role: 'admin',
      phone,
      region,
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
    admin: profile,
    credentials: {
      email,
      temporaryPassword: tempPassword,
    },
  }, { status: 201 });
}

// PUT /api/admins — update an existing admin's details
export async function PUT(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: currentUserProfile } = await adminSupabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();
    
  if (currentUserProfile?.role !== 'super-admin') {
     return NextResponse.json({ error: 'Forbidden. Only Super Admins can edit Admins.' }, { status: 403 });
  }

  const body = await request.json();
  const id = body.id;
  if (!id) return NextResponse.json({ error: 'Admin ID required.' }, { status: 400 });

  const name = body.name ? String(body.name).trim() : undefined;
  const phone = body.phone !== undefined ? String(body.phone).trim() : undefined;
  const region = body.region !== undefined ? String(body.region).trim() : undefined;

  const updates: any = {};
  if (name !== undefined) updates.name = name;
  if (phone !== undefined) updates.phone = phone;
  if (region !== undefined) updates.region = region;

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No valid fields provided to update.' }, { status: 400 });
  }

  const { data: profile, error } = await adminSupabase
    .from('profiles')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Optionally update auth user_metadata name if name was changed
  if (name) {
    await adminSupabase.auth.admin.updateUserById(id, { user_metadata: { name } });
  }

  return NextResponse.json({ admin: profile });
}
