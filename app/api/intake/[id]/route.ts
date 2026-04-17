import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

type Params = { params: Promise<{ id: string }> };

function computeAiScore(parsedData: Record<string, unknown>) {
  const severityScore: Record<string, number> = { critical: 90, high: 70, medium: 50, low: 25 };
  const typeBonus: Record<string, number> = { Medical: 10, Food: 8, Shelter: 6, Water: 5, Education: 3 };
  const severity = String(parsedData.severity || 'medium');
  const type = String(parsedData.type || 'Medical');
  const people = Number(parsedData.people_affected ?? parsedData.people ?? 0);
  const peopleBonus = Math.min(Math.floor(people / 10), 10);

  return Math.min((severityScore[severity] || 50) + (typeBonus[type] || 0) + peopleBonus, 100);
}

export async function PATCH(request: Request, { params }: Params) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const status = String(body.status || '');

  if (!['approved', 'rejected'].includes(status)) {
    return NextResponse.json({ error: 'Invalid status.' }, { status: 400 });
  }

  const { data: intakeItem, error: intakeError } = await supabase
    .from('intake_queue')
    .select('*')
    .eq('id', id)
    .single();

  if (intakeError || !intakeItem) {
    return NextResponse.json({ error: 'Intake item not found.' }, { status: 404 });
  }

  if (status === 'rejected') {
    const { data, error } = await supabase
      .from('intake_queue')
      .update({ status: 'rejected' })
      .eq('id', id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ item: data });
  }

  const parsed = (intakeItem.parsed_data ?? {}) as Record<string, unknown>;
  const title = String(parsed.title || '').trim();
  const type = String(parsed.type || '').trim();
  const severity = String(parsed.severity || '').trim();
  const location = String(parsed.location || '').trim();
  const peopleAffected = Number(parsed.people_affected ?? parsed.people ?? 0);
  const description = parsed.description ? String(parsed.description) : null;

  if (!title || !type || !severity || !location) {
    return NextResponse.json({ error: 'Parsed intake data is incomplete.' }, { status: 400 });
  }

  const { data: need, error: needError } = await supabase
    .from('needs')
    .insert({
      title,
      type,
      severity,
      location,
      people_affected: Number.isFinite(peopleAffected) ? peopleAffected : 0,
      description,
      source: intakeItem.source,
      admin_id: user.id,
      ai_score: computeAiScore(parsed),
      status: 'open',
    })
    .select()
    .single();

  if (needError || !need) {
    return NextResponse.json({ error: needError?.message || 'Failed to create need.' }, { status: 500 });
  }

  const { data: updatedItem, error: updateError } = await supabase
    .from('intake_queue')
    .update({ status: 'approved', need_id: need.id })
    .eq('id', id)
    .select()
    .single();

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ item: updatedItem, need });
}
