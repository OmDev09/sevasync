import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

type IntakePayload = {
  source: 'ocr' | 'whatsapp' | 'csv' | 'mobile' | 'manual';
  raw_text?: string | null;
  parsed_data?: Record<string, unknown> | null;
};

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');

  let query = supabase
    .from('intake_queue')
    .select('*')
    .order('created_at', { ascending: false });

  if (status) {
    query = query.eq('status', status);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ items: data ?? [] });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const items = Array.isArray(body.items) ? body.items : [body];
  const payload = items
    .filter(Boolean)
    .map((item: IntakePayload) => ({
      source: item.source,
      raw_text: item.raw_text ?? null,
      parsed_data: item.parsed_data ?? null,
      admin_id: user.id,
      status: 'pending',
    }));

  if (payload.length === 0) {
    return NextResponse.json({ error: 'At least one intake item is required.' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('intake_queue')
    .insert(payload)
    .select()
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ items: data ?? [] }, { status: 201 });
}
