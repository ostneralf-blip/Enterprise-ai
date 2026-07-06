'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'

interface Props {
  module: string
  entityId: string
  tier: string
}

type ExpiryOption = { label: string; days?: number }

const EXPIRY_OPTIONS: ExpiryOption[] = [
  { label: '1 Woche', days: 7 },
  { label: '1 Monat', days: 30 },
  { label: 'Unbegrenzt' },
]

export function ShareButton({ module, entityId, tier }: Props) {
  const [open, setOpen] = useState(false)
  const [expiryDays, setExpiryDays] = useState<number | undefined>(7)
  const [url, setUrl] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [copied, setCopied] = useState(false)

  const isPro = tier === 'pro' || tier === 'enterprise'

  if (!isPro) {
    return (
      <a
        href="/upgrade"
        className="px-4 py-2 text-sm font-medium border border-violet-200 text-violet-700 bg-violet-50 rounded-xl hover:bg-violet-100 transition-colors whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2"
      >
        Teilen (Pro)
      </a>
    )
  }

  const handleCreate = async () => {
    setCreating(true)
    try {
      const res = await fetch('/api/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ module, entity_id: entityId, expires_in_days: expiryDays }),
      })
      if (res.ok) {
        const { data } = await res.json()
        setUrl(data.url)
      }
    } finally {
      setCreating(false)
    }
  }

  const handleCopy = async () => {
    if (!url) return
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="px-4 py-2 text-sm font-medium border border-slate-200 rounded-xl text-slate-700 hover:bg-slate-50 transition-colors whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-primary-ring focus:ring-offset-2"
      >
        Teilen
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" role="dialog" aria-modal="true" aria-label="Ergebnis teilen">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-slate-900">Ergebnis teilen</h2>
              <button
                onClick={() => { setOpen(false); setUrl(null) }}
                aria-label="Dialog schließen"
                className="text-slate-400 hover:text-slate-600 text-xl leading-none"
              >×</button>
            </div>

            {!url ? (
              <>
                <p className="text-sm text-slate-600 mb-4">Erstellt einen öffentlich lesbaren Link. Keine Anmeldung für Empfänger nötig.</p>
                <div className="mb-5">
                  <p className="text-xs font-medium text-slate-700 mb-2">Ablaufdatum</p>
                  <div className="flex gap-2">
                    {EXPIRY_OPTIONS.map(opt => (
                      <button
                        key={opt.label}
                        onClick={() => setExpiryDays(opt.days)}
                        className={cn(
                          'flex-1 px-2 py-1.5 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap',
                          expiryDays === opt.days
                            ? 'bg-primary text-white border-blue-600'
                            : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                        )}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
                <button
                  onClick={handleCreate}
                  disabled={creating}
                  className="w-full py-2.5 text-sm font-medium bg-primary text-white rounded-xl hover:bg-primary disabled:opacity-50 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-ring focus:ring-offset-2"
                >
                  {creating ? 'Link wird erstellt…' : 'Link erstellen'}
                </button>
              </>
            ) : (
              <>
                <p className="text-sm text-slate-600 mb-3">Link erstellt. Teilen per E-Mail oder Messenger.</p>
                <div className="flex gap-2">
                  <input
                    readOnly
                    value={url}
                    aria-label="Share-Link"
                    className="flex-1 min-w-0 text-xs border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 text-slate-700 focus:outline-none"
                  />
                  <button
                    onClick={handleCopy}
                    aria-label="Link kopieren"
                    className="px-3 py-2 text-xs font-medium bg-slate-800 text-white rounded-xl hover:bg-slate-700 whitespace-nowrap transition-colors focus:outline-none focus:ring-2 focus:ring-primary-ring focus:ring-offset-2"
                  >
                    {copied ? '✓' : 'Kopieren'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}
