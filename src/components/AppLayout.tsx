import { NavLink, Outlet } from 'react-router-dom'
import { InstallPrompt } from '@/features/settings/InstallPrompt'
import { da } from '@/i18n/da'

const navItems = [
  { to: '/tasting', label: da.nav.tasting, icon: '🍷' },
  { to: '/map', label: da.nav.map, icon: '🗺️' },
  { to: '/daily', label: da.nav.daily, icon: '📅' },
  { to: '/lexicon', label: da.nav.lexicon, icon: '📖' },
  { to: '/progress', label: da.nav.progress, icon: '📈' },
] as const

function linkClass(isActive: boolean) {
  return isActive ? 'font-semibold text-wine-700' : 'text-wine-900/70 hover:text-wine-700'
}

/**
 * Mobile-first shell: bottom tab bar on small screens, top bar on md+.
 */
export function AppLayout() {
  return (
    <div className="flex min-h-dvh flex-col">
      {/* A plain #main href would be read as a route by HashRouter, so focus the element instead. */}
      <a
        href="#main"
        onClick={(e) => {
          e.preventDefault()
          document.getElementById('main')?.focus()
        }}
        className="bg-wine-700 sr-only z-20 rounded-lg px-4 py-2 font-semibold text-white focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
      >
        {da.nav.skipToContent}
      </a>
      <header className="border-wine-200 bg-wine-50/95 sticky top-0 z-10 border-b backdrop-blur">
        <div className="mx-auto flex h-14 w-full max-w-4xl items-center justify-between px-4">
          <NavLink to="/" className="text-wine-800 text-lg font-bold">
            {da.app.name}
          </NavLink>
          <nav aria-label={da.nav.ariaLabel} className="hidden gap-6 md:flex">
            {navItems.map((item) => (
              <NavLink key={item.to} to={item.to} className={({ isActive }) => linkClass(isActive)}>
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>

      <main
        id="main"
        tabIndex={-1}
        className="mx-auto w-full max-w-4xl flex-1 px-4 pt-4 pb-24 md:pb-8"
      >
        <Outlet />
      </main>
      <InstallPrompt />

      <nav
        aria-label={da.nav.ariaLabel}
        className="border-wine-200 bg-wine-50/95 fixed inset-x-0 bottom-0 z-10 border-t pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
      >
        <ul className="flex h-16 items-stretch">
          {navItems.map((item) => (
            <li key={item.to} className="flex-1">
              <NavLink
                to={item.to}
                className={({ isActive }) =>
                  'flex h-full flex-col items-center justify-center gap-0.5 text-xs ' +
                  linkClass(isActive)
                }
              >
                <span aria-hidden="true" className="text-xl leading-none">
                  {item.icon}
                </span>
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  )
}
