import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const getFilePath = () => path.join(process.cwd(), 'data', 'applications.json');

async function getApps() {
  try {
    const file = await fs.readFile(getFilePath(), 'utf-8');
    return JSON.parse(file);
  } catch (e) {
    return [];
  }
}

async function saveApps(apps: any[]) {
  const dir = path.join(process.cwd(), 'data');
  try { await fs.mkdir(dir, { recursive: true }); } catch {}
  await fs.writeFile(getFilePath(), JSON.stringify(apps, null, 2));
}

export async function GET() {
  const apps = await getApps();
  return NextResponse.json({ applications: apps });
}

export async function POST(req: Request) {
  const body = await req.json();
  const apps = await getApps();
  const newApp = { 
    id: Date.now().toString(), 
    status: 'pending', 
    created_at: new Date().toISOString(), 
    ...body 
  };
  apps.unshift(newApp);
  await saveApps(apps);
  return NextResponse.json(newApp, { status: 201 });
}

export async function PATCH(req: Request) {
  const body = await req.json();
  const { id, status } = body;
  const apps = await getApps();
  const index = apps.findIndex((a: any) => a.id === id);
  if (index !== -1) {
    apps[index].status = status;
    await saveApps(apps);
    return NextResponse.json(apps[index]);
  }
  return NextResponse.json({ error: 'Not found' }, { status: 404 });
}

export async function DELETE(req: Request) {
  const body = await req.json();
  const { id } = body;
  const apps = await getApps();
  const filtered = apps.filter((a: any) => a.id !== id);
  if (filtered.length !== apps.length) {
    await saveApps(filtered);
    return NextResponse.json({ success: true });
  }
  return NextResponse.json({ error: 'Not found' }, { status: 404 });
}
