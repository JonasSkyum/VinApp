import { useState, type FormEvent } from 'react'
import { da } from '@/i18n/da'
import { interpolate } from '@/lib/text'
import { useSync } from './syncContext'

/** Login with a magic link and the sync status. Hidden entirely when sync is not configured. */
export function AccountPanel() {
  const sync = useSync()
  const [email, setEmail] = useState('')
  const t = da.account

  if (!sync.available) return null

  const statusText = {
    idle: '',
    'link-sent': t.linkSent,
    syncing: t.syncing,
    synced: t.synced,
    error: interpolate(t.error, { message: sync.error ?? '' }),
  }[sync.status]

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (email.trim()) void sync.signIn(email)
  }

  return (
    <section aria-labelledby="account-title" className="space-y-3">
      <h2 id="account-title" className="text-wine-800 text-lg font-semibold">
        {t.title}
      </h2>

      {sync.session ? (
        <div className="space-y-3 text-sm">
          <p>{interpolate(t.signedInAs, { email: sync.session.email ?? '' })}</p>
          <p className="text-wine-900/70">{t.syncHelp}</p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void sync.syncNow()}
              disabled={sync.status === 'syncing'}
              className="border-wine-700 text-wine-800 hover:bg-wine-100 rounded-lg border px-3 py-2 font-semibold disabled:opacity-50"
            >
              {t.syncNow}
            </button>
            <button
              type="button"
              onClick={() => void sync.signOut()}
              className="border-wine-300 text-wine-800 hover:bg-wine-50 rounded-lg border px-3 py-2"
            >
              {t.signOut}
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="space-y-2 text-sm">
          <p className="text-wine-900/70">{t.intro}</p>
          <label className="block">
            <span className="font-medium">{t.email}</span>
            <input
              type="email"
              required
              autoComplete="email"
              inputMode="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="border-wine-300 focus:border-wine-600 mt-1 w-full rounded-lg border bg-white px-3 py-3 text-base outline-none"
            />
          </label>
          <button
            type="submit"
            className="bg-wine-700 hover:bg-wine-800 w-full rounded-lg px-4 py-3 font-semibold text-white"
          >
            {t.sendLink}
          </button>
        </form>
      )}

      {statusText && (
        <p
          role="status"
          className={`text-sm ${sync.status === 'error' ? 'text-red-800' : 'text-wine-900/70'}`}
        >
          {statusText}
        </p>
      )}
    </section>
  )
}
