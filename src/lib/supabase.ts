import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

export type Supabase = SupabaseClient<Database>

/**
 * The Supabase client, or null when the app is built without credentials.
 * Everything that touches the network must handle null: the game is fully
 * playable without an account, and sync is opt-in.
 */
export function createSupabase(
  url: string | undefined = import.meta.env.VITE_SUPABASE_URL,
  key: string | undefined = import.meta.env.VITE_SUPABASE_ANON_KEY,
): Supabase | null {
  if (!url || !key) return null
  return createClient<Database>(url, key, {
    auth: {
      // The app is served under a hash route, so tokens arrive in the fragment.
      detectSessionInUrl: true,
      flowType: 'pkce',
      persistSession: true,
    },
  })
}

export const supabase: Supabase | null = createSupabase()
