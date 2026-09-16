import { useRef, useState } from 'react'
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
    <section className="space-y-3">
      <h2 className="text-wine-800 text-lg font-semibold">{da.progress.backup}</h2>
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={download} className={buttonClass}>
          {da.progress.exportButton}
        </button>
        <button type="button" onClick={copy} className={buttonClass}>
          {da.progress.copyButton}
        </button>
        <button type="button" onClick={() => fileInput.current?.click()} className={buttonClass}>
          {da.progress.importButton}
        </button>
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
          className={`text-sm ${notice.kind === 'ok' ? 'text-green-800' : 'text-red-800'}`}
        >
          {notice.text}
        </p>
      )}

      {confirmReset ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-900">
          <p className="mb-2">{da.progress.resetConfirm}</p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                reset()
                setConfirmReset(false)
              }}
              className="rounded-lg bg-red-700 px-3 py-2 font-semibold text-white"
            >
              {da.progress.resetYes}
            </button>
            <button
              type="button"
              onClick={() => setConfirmReset(false)}
              className="rounded-lg border border-red-300 px-3 py-2"
            >
              {da.progress.resetNo}
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setConfirmReset(true)}
          className="text-sm text-red-700 underline"
        >
          {da.progress.resetButton}
        </button>
      )}
    </section>
  )
}

const buttonClass =
  'border-wine-300 text-wine-800 hover:bg-wine-100 rounded-lg border bg-white px-3 py-2 text-sm'
