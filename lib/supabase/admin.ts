import { createClient as createSupabaseClient } from '@supabase/supabase-js';

/**
 * Admin client with service_role key — bypasses RLS.
 * ONLY use in trusted server-side code (API routes, seed scripts).
 * NEVER expose to the browser.
 */
export const adminSupabase = createSupabaseClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);
