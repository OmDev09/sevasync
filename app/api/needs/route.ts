import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/needs — list needs (filtered by admin's region if applicable)
export async function GET(request: Request) {
  const supabase = await createClient();
  const { searchParams } = new URL(request.url);

  const status = searchParams.get('status');
  const type = searchParams.get('type');
  const severity = searchParams.get('severity');

  let query = supabase
    .from('needs')
    .select('*')
    .order('ai_score', { ascending: false });

  if (status) query = query.eq('status', status);
  if (type) query = query.eq('type', type);
  if (severity) query = query.eq('severity', severity);

  const { data, error } = await query;

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ needs: data });
}

// POST /api/needs — create a new need
export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();

  // Simple AI score calculation
  const severityScore: Record<string, number> = { critical: 90, high: 70, medium: 50, low: 25 };
  const typeBonus: Record<string, number> = { Medical: 10, Food: 8, Shelter: 6, Water: 5, Education: 3 };
  const peopleBonus = Math.min(Math.floor((body.people_affected || 0) / 10), 10);
  const ai_score = Math.min(
    (severityScore[body.severity] || 50) + (typeBonus[body.type] || 0) + peopleBonus,
    100
  );

  const { data, error } = await supabase
    .from('needs')
    .insert({
      title: body.title,
      type: body.type,
      severity: body.severity,
      location: body.location,
      people_affected: body.people_affected || 0,
      source: body.source || 'manual',
      description: body.description || null,
      ai_score,
      admin_id: user.id,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ need: data }, { status: 201 });
}
