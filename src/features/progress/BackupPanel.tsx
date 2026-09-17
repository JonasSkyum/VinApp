import { useRef, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Card, Heading } from '@/components/ui/Card'
import { Icon } from '@/components/ui/Icon'
import { da } from '@/i18n/da'
import { useProgress } from './progressContext'
import { exportProgress, importProgress } from './progressStore'

type Notice = { kind: 'ok' | 'error'; text: string } | null

/** Export/import progress as JSON (a backup until sync arrives) and reset. */
export function BackupPanel() {
  const { data, replace, reset } = useProgress()
  const fileInput = useRef<HTMLInputElement>(null)
  const [notice, setNotice] = useState<Notice>(null)
  const [confirmReset, setConfirmReset] = useState(false)

  const download = () => {
    const json = exportProgress(data)
    const url = URL.createObjectURL(new Blob([json], { type: 'application/json' }))
    const a = document.createElement('a')
    a.href = url
    a.download = `vinspil-fremskridt-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(exportProgress(data))
      setNotice({ kind: 'ok', text: da.progress.copied })
    } catch {
      setNotice({ kind: 'error', text: da.progress.importError })
    }
  }

  const onFile = async (file: File | undefined) => {
    if (!file) return
    try {
      replace(importProgress(await file.text()))
      setNotice({ kind: 'ok', text: da.progress.importSuccess })
    } catch {
      setNotice({ kind: 'error', text: da.progress.importError })
    }
  }

  return (
    <Card as="section" aria-labelledby="backup-title" className="flex flex-col gap-3">
      <Heading id="backup-title" size="md">
        {da.progress.backup}
      </Heading>
      <div className="flex flex-wrap gap-2">
        <Button variant="secondary" size="md" onClick={download}>
          <Icon name="download" size={16} strokeWidth={2.2} />
          {da.progress.exportButton}
        </Button>
        <Button variant="secondary" size="md" onClick={copy}>
          <Icon name="copy" size={16} strokeWidth={2.2} />
          {da.progress.copyButton}
        </Button>
        <Button variant="secondary" size="md" onClick={() => fileInput.current?.click()}>
          <Icon name="upload" size={16} strokeWidth={2.2} />
          {da.progress.importButton}
        </Button>
        <input
          ref={fileInput}
          type="file"
          accept="application/json,.json"
          aria-label={da.progress.importButton}
          className="hidden"
          onChange={(e) => {
            void onFile(e.target.files?.[0])
            e.target.value = ''
          }}
        />
      </div>
      {notice && (
        <p
          role="status"
          className={`text-sm font-bold ${notice.kind === 'ok' ? 'text-ok' : 'text-wrong'}`}
        >
          {notice.text}
        </p>
      )}

      {confirmReset ? (
        <div className="bg-wrong-soft text-wrong flex flex-col gap-2 rounded-2xl p-3 text-sm">
          <p className="font-bold">{da.progress.resetConfirm}</p>
          <div className="flex gap-2">
            <Button
              variant="danger"
              size="md"
              onClick={() => {
                reset()
                setConfirmReset(false)
              }}
            >
              {da.progress.resetYes}
            </Button>
            <Button variant="secondary" size="md" onClick={() => setConfirmReset(false)}>
              {da.progress.resetNo}
            </Button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setConfirmReset(true)}
          className="text-wrong flex items-center gap-1.5 self-start text-sm font-bold underline underline-offset-2"
        >
          <Icon name="trash" size={14} strokeWidth={2.2} />
          {da.progress.resetButton}
        </button>
      )}
    </Card>
  )
}
