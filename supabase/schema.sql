-- ============================================================
-- SEVASYNC AI — Complete Supabase PostgreSQL Schema
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 1. PROFILES (extends auth.users)
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.profiles (
  id              UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  name            TEXT NOT NULL,
  email           TEXT UNIQUE NOT NULL,
  role            TEXT NOT NULL CHECK (role IN ('super-admin', 'admin', 'volunteer')),
  region          TEXT,
  phone           TEXT,
  skills          TEXT[],
  status          TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'busy')),
  admin_id        UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  available_days  TEXT[],
  avatar_url      TEXT,
  joined_at       TIMESTAMPTZ DEFAULT NOW(),
  last_active     TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure avatar_url exists even if the table is already created
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- ────────────────────────────────────────────────────────────
-- 2. NEEDS (community needs / problems reported)
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.needs (
  id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title            TEXT NOT NULL,
  type             TEXT NOT NULL CHECK (type IN ('Medical','Food','Shelter','Water','Education')),
  severity         TEXT NOT NULL CHECK (severity IN ('critical','high','medium','low')),
  ai_score         INTEGER DEFAULT 0 CHECK (ai_score BETWEEN 0 AND 100),
  location         TEXT NOT NULL,
  people_affected  INTEGER DEFAULT 0,
  source           TEXT DEFAULT 'manual' CHECK (source IN ('ocr','whatsapp','csv','mobile','manual')),
  status           TEXT DEFAULT 'open' CHECK (status IN ('open','in-progress','resolved')),
  description      TEXT,
  admin_id         UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ────────────────────────────────────────────────────────────
-- 3. TASKS (actionable units of work assigned to volunteers)
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.tasks (
  id             UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title          TEXT NOT NULL,
  type           TEXT NOT NULL,
  priority       TEXT NOT NULL CHECK (priority IN ('critical','high','medium','low')),
  status         TEXT DEFAULT 'unassigned' CHECK (status IN ('unassigned','assigned','in_progress','completed','cancelled')),
  need_id        UUID REFERENCES public.needs(id) ON DELETE SET NULL,
  volunteer_id   UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  admin_id       UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  location       TEXT,
  due_date       TIMESTAMPTZ,
  instructions   TEXT,
  completed_at   TIMESTAMPTZ,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);

-- ────────────────────────────────────────────────────────────
-- 4. MESSAGES (admin ↔ volunteer messaging)
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.messages (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  from_id     UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  to_id       UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  text        TEXT NOT NULL,
  task_id     UUID REFERENCES public.tasks(id) ON DELETE SET NULL,
  read        BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ────────────────────────────────────────────────────────────
-- 5. NOTIFICATIONS (live notification feed per user)
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.notifications (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  type        TEXT NOT NULL CHECK (type IN ('task_assigned','task_update','message','alert','milestone')),
  title       TEXT NOT NULL,
  body        TEXT,
  read        BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ────────────────────────────────────────────────────────────
-- 6. INTAKE QUEUE (OCR / WhatsApp / CSV raw data pipeline)
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.intake_queue (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  source       TEXT NOT NULL CHECK (source IN ('ocr','whatsapp','csv','mobile','manual')),
  raw_text     TEXT,
  parsed_data  JSONB,
  status       TEXT DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  admin_id     UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  need_id      UUID REFERENCES public.needs(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ────────────────────────────────────────────────────────────
-- TRIGGERS: auto-update updated_at
-- ────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS needs_updated_at ON public.needs;
CREATE TRIGGER needs_updated_at
  BEFORE UPDATE ON public.needs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS tasks_updated_at ON public.tasks;
CREATE TRIGGER tasks_updated_at
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ────────────────────────────────────────────────────────────
-- TRIGGER: auto-create profile on signup
-- ────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'volunteer')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ────────────────────────────────────────────────────────────
-- 7. STORAGE BUCKETS
-- ────────────────────────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Avatar Public Access" ON storage.objects;
CREATE POLICY "Avatar Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Avatar Auth Upload" ON storage.objects;
CREATE POLICY "Avatar Auth Upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Avatar Auth Update" ON storage.objects;
CREATE POLICY "Avatar Auth Update" ON storage.objects FOR UPDATE USING (bucket_id = 'avatars' AND auth.role() = 'authenticated');

-- ────────────────────────────────────────────────────────────
-- ROW LEVEL SECURITY
-- ────────────────────────────────────────────────────────────
ALTER TABLE public.profiles       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.needs          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.intake_queue   ENABLE ROW LEVEL SECURITY;

-- Helper function: get current user role
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS TEXT AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ── profiles policies ──
DROP POLICY IF EXISTS "profiles_select" ON public.profiles;
CREATE POLICY "profiles_select"
  ON public.profiles FOR SELECT
  USING (
    id = auth.uid()
    OR role IN ('admin', 'super-admin')
    OR public.current_user_role() IN ('admin', 'super-admin')
  );

DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE
  USING (id = auth.uid());

DROP POLICY IF EXISTS "profiles_insert_admin" ON public.profiles;
CREATE POLICY "profiles_insert_admin"
  ON public.profiles FOR INSERT
  WITH CHECK (public.current_user_role() IN ('admin','super-admin'));

-- ── needs policies ──
DROP POLICY IF EXISTS "needs_select_all" ON public.needs;
CREATE POLICY "needs_select_all"
  ON public.needs FOR SELECT
  USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "needs_all_admin" ON public.needs;
CREATE POLICY "needs_all_admin"
  ON public.needs FOR ALL
  USING (public.current_user_role() IN ('admin','super-admin'));

-- ── tasks policies ──
DROP POLICY IF EXISTS "tasks_select" ON public.tasks;
CREATE POLICY "tasks_select"
  ON public.tasks FOR SELECT
  USING (
    volunteer_id = auth.uid() OR
    public.current_user_role() IN ('admin','super-admin')
  );

-- FIX: PostgreSQL RLS does not support "FOR INSERT UPDATE DELETE" in one policy.
-- Use FOR ALL for admins, then a narrower UPDATE for volunteers.
DROP POLICY IF EXISTS "tasks_all_admin" ON public.tasks;
CREATE POLICY "tasks_all_admin"
  ON public.tasks FOR ALL
  USING (public.current_user_role() IN ('admin','super-admin'));

DROP POLICY IF EXISTS "tasks_update_volunteer" ON public.tasks;
CREATE POLICY "tasks_update_volunteer"
  ON public.tasks FOR UPDATE
  USING (volunteer_id = auth.uid());

-- ── messages policies ──
DROP POLICY IF EXISTS "messages_select" ON public.messages;
CREATE POLICY "messages_select"
  ON public.messages FOR SELECT
  USING (from_id = auth.uid() OR to_id = auth.uid());

DROP POLICY IF EXISTS "messages_insert" ON public.messages;
CREATE POLICY "messages_insert"
  ON public.messages FOR INSERT
  WITH CHECK (from_id = auth.uid());

-- ── notifications policies ──
DROP POLICY IF EXISTS "notifications_select" ON public.notifications;
CREATE POLICY "notifications_select"
  ON public.notifications FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "notifications_insert_admin" ON public.notifications;
CREATE POLICY "notifications_insert_admin"
  ON public.notifications FOR INSERT
  WITH CHECK (public.current_user_role() IN ('admin','super-admin'));

DROP POLICY IF EXISTS "notifications_update_own" ON public.notifications;
CREATE POLICY "notifications_update_own"
  ON public.notifications FOR UPDATE
  USING (user_id = auth.uid());

-- ── intake_queue policies ──
DROP POLICY IF EXISTS "intake_all_admin" ON public.intake_queue;
CREATE POLICY "intake_all_admin"
  ON public.intake_queue FOR ALL
  USING (public.current_user_role() IN ('admin','super-admin'));

-- ────────────────────────────────────────────────────────────
-- ENABLE REALTIME on key tables
-- ────────────────────────────────────────────────────────────
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.tasks;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.needs;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ────────────────────────────────────────────────────────────
-- SEED: Sample Needs Data
-- (profiles are seeded via POST /api/seed after auth users exist)
-- ────────────────────────────────────────────────────────────
INSERT INTO public.needs (title, type, severity, ai_score, location, people_affected, source, status, description)
VALUES
  ('Medical Aid — Dharavi Sector 4', 'Medical', 'critical', 94, 'Dharavi, Mumbai', 120, 'whatsapp', 'open', 'Multiple families reporting fever and dehydration. Urgent ORS and paracetamol needed.'),
  ('Food Distribution — Kurla West', 'Food', 'high', 76, 'Kurla, Mumbai', 85, 'ocr', 'open', 'Flood displaced families need daily meal support for at least 5 days.'),
  ('Shelter Setup — Bandra East', 'Shelter', 'high', 71, 'Bandra, Mumbai', 40, 'csv', 'open', '40 people need tarpaulin shelters. Materials available at nearby warehouse.'),
  ('Clean Water — Andheri Slum', 'Water', 'medium', 55, 'Andheri, Mumbai', 200, 'manual', 'open', 'Water pipeline damaged. Residents using contaminated source.'),
  ('Education Materials — Govandi', 'Education', 'low', 28, 'Govandi, Mumbai', 35, 'manual', 'open', '35 children displaced from school. Need books and stationery.')
ON CONFLICT DO NOTHING;
