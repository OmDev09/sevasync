import { NextResponse } from 'next/server';
import { adminSupabase } from '@/lib/supabase/admin';

const DEMO_USERS = [
  {
    email: 'superadmin@sevasync.com',
    password: 'Super@123',
    name: 'Rajesh Patel',
    role: 'super-admin',
    region: 'All India',
    skills: [] as string[],
  },
  {
    email: 'admin@sevasync.com',
    password: 'Admin@123',
    name: 'Priya Sharma',
    role: 'admin',
    region: 'Mumbai North',
    skills: ['Management', 'Field Ops'],
  },
  {
    email: 'volunteer@sevasync.com',
    password: 'Volunteer@123',
    name: 'Amit Kumar',
    role: 'volunteer',
    region: 'Mumbai North',
    skills: ['Medical', 'First Aid', 'Transport'],
  },
];

async function runSeed() {
  const results: { email: string; status: string; error?: string }[] = [];

  for (const u of DEMO_USERS) {
    // Create auth user
    const { data: authData, error: authError } = await adminSupabase.auth.admin.createUser({
      email: u.email,
      password: u.password,
      email_confirm: true,
      user_metadata: { name: u.name, role: u.role },
    });

    if (authError) {
      if (authError.message.toLowerCase().includes('already')) {
        results.push({ email: u.email, status: 'already_exists' });
        continue;
      }
      results.push({ email: u.email, status: 'error', error: authError.message });
      continue;
    }

    // Upsert the profile row
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: profileError } = await (adminSupabase as any).from('profiles').upsert({
      id: authData.user.id,
      name: u.name,
      email: u.email,
      role: u.role,
      region: u.region,
      skills: u.skills,
      status: 'active',
    });

    if (profileError) {
      results.push({ email: u.email, status: 'profile_error', error: profileError.message });
    } else {
      results.push({ email: u.email, status: 'created' });
    }
  }

  return results;
}

// GET — visit in browser: http://localhost:3000/api/seed
export async function GET() {
  const results = await runSeed();
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Sevasync Seed</title>
        <style>
          body { font-family: system-ui; background: #0f0f11; color: #e2e8f0; padding: 40px; }
          h1 { color: #818cf8; }
          .row { background: #1a1a2e; border: 1px solid #2d2d4a; border-radius: 8px; padding: 16px; margin: 8px 0; display: flex; align-items: center; gap: 16px; }
          .created { color: #4ade80; }
          .exists  { color: #fbbf24; }
          .error   { color: #f87171; }
          .creds   { background: #111827; border: 1px solid #374151; border-radius: 8px; padding: 20px; margin-top: 24px; }
          code { background: #1f2937; padding: 2px 8px; border-radius: 4px; font-size: 0.85rem; }
        </style>
      </head>
      <body>
        <h1>🌱 Sevasync Seed Results</h1>
        ${results.map(r => `
          <div class="row">
            <span class="${r.status === 'created' ? 'created' : r.status === 'already_exists' ? 'exists' : 'error'}">
              ${r.status === 'created' ? '✅' : r.status === 'already_exists' ? '⚠️' : '❌'}
              <strong>${r.status}</strong>
            </span>
            <span>${r.email}</span>
            ${r.error ? `<span style="color:#f87171;font-size:0.8rem">${r.error}</span>` : ''}
          </div>
        `).join('')}
        <div class="creds">
          <h2 style="margin:0 0 16px;font-size:1rem;color:#94a3b8">🔑 Demo Login Credentials</h2>
          <p>👑 Super Admin: <code>superadmin@sevasync.com</code> / <code>Super@123</code></p>
          <p>🛠️ Admin: <code>admin@sevasync.com</code> / <code>Admin@123</code></p>
          <p>🙋 Volunteer: <code>volunteer@sevasync.com</code> / <code>Volunteer@123</code></p>
          <p style="margin-top:16px"><a href="/login" style="color:#818cf8">→ Go to Login</a></p>
        </div>
      </body>
    </html>
  `;
  return new Response(html, { headers: { 'Content-Type': 'text/html' } });
}

// POST — also available for programmatic calls
export async function POST() {
  const results = await runSeed();
  return NextResponse.json({ results });
}
