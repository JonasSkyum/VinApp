import { useNavigate } from 'react-router-dom'
import { PageTitle } from '@/components/PageTitle'
import { Card, Heading } from '@/components/ui/Card'
import { Icon } from '@/components/ui/Icon'
import { BackupPanel } from '@/features/progress/BackupPanel'
import { useProgress } from '@/features/progress/progressContext'
import { AccountPanel } from '@/features/sync/AccountPanel'
import { da } from '@/i18n/da'
import { SettingsPanel } from './SettingsPanel'
import { Toggle } from './Toggle'

/** Device preferences, game settings, account and backup. */
export function SettingsPage() {
  const navigate = useNavigate()
  const { data, setUnlockingEnabled } = useProgress()
  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-4">
      <header className="flex h-12 items-center gap-2">
        <button
          type="button"
          onClick={() => navigate(-1)}
          aria-label={da.nav.back}
          className="text-ink -ml-2 flex h-11 w-11 items-center justify-center rounded-full"
        >
          <Icon name="chevronLeft" size={22} strokeWidth={2.4} />
        </button>
        <PageTitle className="mb-0">{da.settings.title}</PageTitle>
      </header>

      <Card as="section" aria-labelledby="appearance-title" className="flex flex-col gap-4">
        <Heading id="appearance-title" size="md">
          {da.settings.appearance}
        </Heading>
        <SettingsPanel />
      </Card>

      <Card as="section" aria-labelledby="game-title" className="flex flex-col gap-4">
        <Heading id="game-title" size="md">
          {da.settings.game}
        </Heading>
        <Toggle
          checked={data.settings.unlockingEnabled}
          onChange={setUnlockingEnabled}
          label={da.progress.unlocking}
          help={da.progress.unlockingHelp}
        />
      </Card>

      <AccountPanel />
      <BackupPanel />
    </div>
  )
}
