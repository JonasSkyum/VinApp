import type { Session as SupabaseSession } from '@supabase/supabase-js'
import type { Supabase } from '@/lib/supabase'
import type { Session, SyncBackend } from './backend'
import {
  fromAnswerRow,
  fromDailyRow,
  fromLeitnerRow,
  toAnswerRow,
  toDailyRow,
  toLeitnerRow,
} from './rows'

/** Rows per upsert request; PostgREST handles thousands, this keeps payloads modest. */
const BATCH = 500

function toSession(s: SupabaseSession | null): Session | null {
  return s ? { userId: s.user.id, email: s.user.email ?? null } : null
}

function chunk<T>(items: T[]): T[][] {
  const out: T[][] = []
  for (let i = 0; i < items.length; i += BATCH) out.push(items.slice(i, i + BATCH))
  return out
}

export function supabaseBackend(client: Supabase): SyncBackend {
  return {
    async getSession() {
      const { data, error } = await client.auth.getSession()
      if (error) throw error
      return toSession(data.session)
    },

    onSessionChange(listener) {
      const { data } = client.auth.onAuthStateChange((_event, session) =>
        listener(toSession(session)),
      )
      return () => data.subscription.unsubscribe()
    },

    async signInWithEmail(email, redirectTo) {
      const { error } = await client.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: redirectTo },
      })
      if (error) throw error
    },

    async signOut() {
      const { error } = await client.auth.signOut()
      if (error) throw error
    },

    async pull(userId) {
      const [log, leitner, daily] = await Promise.all([
        client.from('answer_log').select('*').eq('user_id', userId),
        client.from('leitner_state').select('*').eq('user_id', userId),
        client.from('daily_results').select('*').eq('user_id', userId),
      ])
      const failed = log.error ?? leitner.error ?? daily.error
      if (failed) throw failed
      return {
        log: (log.data ?? []).map(fromAnswerRow),
        leitner: Object.fromEntries((leitner.data ?? []).map(fromLeitnerRow)),
        daily: Object.fromEntries((daily.data ?? []).map(fromDailyRow).map((d) => [d.dateKey, d])),
      }
    },

    async push(userId, push) {
      for (const rows of chunk(push.log.map((r) => toAnswerRow(r, userId)))) {
        const { error } = await client
          .from('answer_log')
          .upsert(rows, { onConflict: 'user_id,client_id', ignoreDuplicates: true })
        if (error) throw error
      }
      if (push.leitner.length > 0) {
        const { error } = await client.from('leitner_state').upsert(
          push.leitner.map((l) => toLeitnerRow(l.key, l.card, userId)),
          { onConflict: 'user_id,unit_key' },
        )
        if (error) throw error
      }
      if (push.daily.length > 0) {
        const { error } = await client.from('daily_results').upsert(
          push.daily.map((d) => toDailyRow(d, userId)),
          { onConflict: 'user_id,date_key' },
        )
        if (error) throw error
      }
    },
  }
}
