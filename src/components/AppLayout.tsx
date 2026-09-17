import { useMemo, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { dailyDateKey, dailyStreak } from '@/engine'
import { useProgress } from '@/features/progress/progressContext'
import { InstallPrompt } from '@/features/settings/InstallPrompt'
import { da } from '@/i18n/da'
import { interpolate } from '@/lib/text'
import { ChromeContext } from './chrome'
import { FlameIcon, Icon, type IconName } from './ui/Icon'

interface NavItem {
  to: string
  label: string
  icon: IconName
}

const NAV: NavItem[] = [
  { to: '/tasting', label: da.nav.tasting, icon: 'glass' },
  { to: '/map', label: da.nav.map, icon: 'map' },
  { to: '/daily', label: da.nav.daily, icon: 'star' },
  { to: '/lexicon', label: da.nav.lexicon, icon: 'book' },
  { to: '/progress', label: da.nav.progress, icon: 'chart' },
]

/** Streak pill shown in headers: flame + "12 dage". */
export function StreakPill({ days, className = '' }: { days: number; className?: string }) {
  return (
    <span
      aria-label={interpolate(da.home.streakAria, { days })}
      className={`border-line bg-surface inline-flex h-9 items-center gap-1.5 rounded-full border px-3 text-sm font-extrabold tabular-nums ${className}`}
    >
      <FlameIcon />
      {interpolate(da.progress.streakDays, { days })}
    </span>
  )
}

/**
 * App shell. Mobile: bottom tab bar with the daily challenge raised in the middle.
 * Desktop (md+): a top bar with pill navigation and a centred 1100 px column.
 * Pages in an immersive state (a running round, the map) hide both.
 */
export function AppLayout() {
  const [immersive, setImmersive] = useState(false)
  const chrome = useMemo(() => ({ immersive, setImmersive }), [immersive])
  const { data } = useProgress()
  const { pathname } = useLocation()
  // Read once per mount; the daily key only changes at midnight, which a reload picks up.
  const [todayKey] = useState(() => dailyDateKey(Date.now()))
  const playedToday = todayKey in data.daily
  const streak = dailyStreak(data.daily, todayKey)

  return (
    <ChromeContext.Provider value={chrome}>
      <div className="flex min-h-dvh flex-col">
        {/* A plain #main href would be read as a route by HashRouter, so focus the element instead. */}
        <a
          href="#main"
          onClick={(e) => {
            e.preventDefault()
            document.getElementById('main')?.focus()
          }}
          className="bg-primary text-on-primary sr-only z-30 rounded-lg px-4 py-2 font-bold focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
        >
          {da.nav.skipToContent}
        </a>

        <header
          className={`border-line bg-surface sticky top-0 z-10 border-b ${immersive ? 'hidden' : 'hidden md:block'}`}
        >
          <div className="mx-auto flex h-[72px] w-full max-w-[1100px] items-center justify-between px-4">
            <NavLink to="/" className="text-primary-ink font-serif text-[26px] font-bold">
              {da.app.name}
            </NavLink>
            <nav aria-label={da.nav.ariaLabel} className="flex gap-1">
              {NAV.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `flex min-h-11 items-center gap-2 rounded-full px-3.5 text-[15px] ${
                      isActive
                        ? 'bg-primary-soft text-primary-ink font-extrabold'
                        : 'text-ink-2 hover:bg-surface-2 hover:text-ink font-semibold'
                    }`
                  }
                >
                  <Icon name={item.icon} size={18} />
                  {item.label}
                  {item.to === '/daily' && !playedToday && (
                    <span aria-hidden="true" className="bg-amber h-2 w-2 rounded-full" />
                  )}
                </NavLink>
              ))}
            </nav>
            <div className="flex items-center gap-2.5">
              <StreakPill days={streak} className="bg-canvas" />
              <NavLink
                to="/settings"
                aria-label={da.nav.settings}
                className="bg-primary-soft text-primary-ink flex h-11 w-11 items-center justify-center rounded-full"
              >
                <Icon name="user" size={20} />
              </NavLink>
            </div>
          </div>
        </header>

        <main
          id="main"
          tabIndex={-1}
          className={`mx-auto flex w-full max-w-[1100px] flex-1 flex-col outline-none ${
            immersive ? '' : 'px-4 pt-3 pb-28 md:pt-7 md:pb-10'
          }`}
        >
          <Outlet />
        </main>
        {!immersive && <InstallPrompt />}

        <nav
          aria-label={da.nav.ariaLabel}
          className={`border-line bg-surface fixed inset-x-0 bottom-0 z-10 border-t pb-[env(safe-area-inset-bottom)] ${
            immersive ? 'hidden' : 'md:hidden'
          }`}
        >
          <ul className="flex h-[84px] items-end justify-around px-1.5 pb-4">
            {NAV.map((item) => {
              const center = item.to === '/daily'
              const active = pathname.startsWith(item.to)
              return (
                <li key={item.to} className="flex flex-1">
                  {center ? (
                    <NavLink
                      to={item.to}
                      aria-current={active ? 'page' : undefined}
                      className={`flex flex-1 flex-col items-center gap-[3px] ${
                        active ? 'text-primary-ink' : 'text-ink-2'
                      }`}
                    >
                      <span
                        className={`border-canvas bg-primary text-on-primary shadow-float relative box-border flex h-[60px] w-[60px] items-center justify-center rounded-full border-4 ${
                          active ? 'ring-primary-ink ring-2' : ''
                        }`}
                      >
                        <Icon name="star" size={26} />
                        {!playedToday && (
                          <span
                            aria-hidden="true"
                            className="border-primary bg-amber absolute top-0.5 right-0.5 h-3 w-3 rounded-full border-2"
                          />
                        )}
                      </span>
                      <span className="text-[11px] font-extrabold">{item.label}</span>
                    </NavLink>
                  ) : (
                    <NavLink
                      to={item.to}
                      className={`flex min-h-[60px] flex-1 flex-col items-center justify-end gap-[3px] ${
                        active ? 'text-primary-ink' : 'text-ink-2'
                      }`}
                    >
                      <span
                        className={`flex h-[30px] w-[52px] items-center justify-center rounded-full ${
                          active ? 'bg-primary-soft' : ''
                        }`}
                      >
                        <Icon name={item.icon} size={22} />
                      </span>
                      <span
                        className={`text-[11px] ${active ? 'font-extrabold' : 'font-semibold'}`}
                      >
                        {item.label}
                      </span>
                    </NavLink>
                  )}
                </li>
              )
            })}
          </ul>
        </nav>
      </div>
    </ChromeContext.Provider>
  )
}
