import { useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/Button'
import { Card, Heading } from '@/components/ui/Card'
import { Icon } from '@/components/ui/Icon'
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
    <Card as="section" aria-labelledby="account-title" className="flex flex-col gap-3">
      <Heading id="account-title" size="md">
        {t.title}
      </Heading>

      {sync.session ? (
        <div className="flex flex-col gap-3 text-sm">
          <p className="font-bold">
            {interpolate(t.signedInAs, { email: sync.session.email ?? '' })}
          </p>
          <p className="text-ink-2">{t.syncHelp}</p>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="soft"
              size="md"
              onClick={() => void sync.syncNow()}
              disabled={sync.status === 'syncing'}
            >
              <Icon name="refresh" size={16} strokeWidth={2.2} />
              {t.syncNow}
            </Button>
            <Button variant="secondary" size="md" onClick={() => void sync.signOut()}>
              <Icon name="logout" size={16} strokeWidth={2.2} />
              {t.signOut}
            </Button>
          </div>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="flex flex-col gap-3 text-sm">
          <p className="text-ink-2">{t.intro}</p>
          <label className="flex flex-col gap-1.5">
            <span className="text-ink-2 text-xs font-extrabold tracking-[0.08em] uppercase">
              {t.email}
            </span>
            <input
              type="email"
              required
              autoComplete="email"
              inputMode="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="border-line bg-surface focus:border-primary-ink min-h-14 w-full rounded-2xl border-[1.5px] px-4 text-base font-semibold outline-none"
            />
          </label>
          <Button type="submit" block>
            <Icon name="mail" size={18} strokeWidth={2.2} />
            {t.sendLink}
          </Button>
        </form>
      )}

      {statusText && (
        <p
          role="status"
          className={`text-sm font-bold ${sync.status === 'error' ? 'text-wrong' : 'text-ink-2'}`}
        >
          {statusText}
        </p>
      )}
    </Card>
  )
}
