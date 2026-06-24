import { createBrowserClient } from "@supabase/ssr";

// Browser client — use in Client Components
// Run `npm run db:types` after connecting Supabase CLI for full type safety
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
