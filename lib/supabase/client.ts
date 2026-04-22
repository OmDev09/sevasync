import { createBrowserClient } from '@supabase/ssr';

let browserClient: ReturnType<typeof createBrowserClient> | undefined;

export function createClient() {
  if (typeof window === 'undefined') {
    // Cannot memoize on the server
    return createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }
  
  if (!browserClient) {
    browserClient = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          // The middleware already refreshes tokens server-side on every
          // request via getUser(). We don't need the client to also try
          // detecting auth tokens in the URL on reload — this avoids
          // race conditions and stale URL params.
          detectSessionInUrl: false,
          // Use PKCE flow for better security with SSR cookie-based sessions.
          flowType: 'pkce',
          // Keep session persisted across reloads via cookies.
          persistSession: true,
        },
      }
    );
  }
  
  return browserClient;
}
