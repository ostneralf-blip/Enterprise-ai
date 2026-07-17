'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'
import { track } from '@/lib/posthog/client'

interface Props {
  module: string
  entityId: string
  tier: string
}

type ExpiryOption = { key: string; days?: number }

const EXPIRY_OPTIONS: ExpiryOption[] = [
  { key: 'expiryWeek',      days: 7 },
  { key: 'expiryMonth',     days: 30 },
  { key: 'expiryUnlimited' },
]

export function ShareButton({ module, entityId, tier }: Props) {
  const t = useTranslations('share')
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
        {t('shareProLabel')}
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
        track('share_created', { module, expires_in_days: expiryDays ?? null })
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
        className="px-4 py-2 text-sm font-medium border border-line rounded-xl text-ink-secondary hover:bg-surface-raised transition-colors whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-primary-ring focus:ring-offset-2"
      >
        {t('shareButton')}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" role="dialog" aria-modal="true" aria-label={t('dialogAriaLabel')}>
          <div className="bg-surface rounded-2xl shadow-xl w-full max-w-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-ink">{t('dialogTitle')}</h2>
              <button
                onClick={() => { setOpen(false); setUrl(null) }}
                aria-label={t('closeDialogAriaLabel')}
                className="text-ink-subtle hover:text-ink-secondary text-xl leading-none"
              >×</button>
            </div>

            {!url ? (
              <>
                <p className="text-sm text-ink-secondary mb-4">{t('createLinkDesc')}</p>
                <div className="mb-5">
                  <p className="text-xs font-medium text-ink-secondary mb-2">{t('expiryLabel')}</p>
                  <div className="flex gap-2">
                    {EXPIRY_OPTIONS.map(opt => (
                      <button
                        key={opt.key}
                        onClick={() => setExpiryDays(opt.days)}
                        className={cn(
                          'flex-1 px-2 py-1.5 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap',
                          expiryDays === opt.days
                            ? 'bg-primary text-white border-primary'
                            : 'border-line text-ink-secondary hover:bg-surface-raised'
                        )}
                      >
                        {t(opt.key as Parameters<typeof t>[0])}
                      </button>
                    ))}
                  </div>
                </div>
                <button
                  onClick={handleCreate}
                  disabled={creating}
                  className="w-full py-2.5 text-sm font-medium bg-primary text-white rounded-xl hover:bg-primary disabled:opacity-50 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-ring focus:ring-offset-2"
                >
                  {creating ? t('creating') : t('createLink')}
                </button>
              </>
            ) : (
              <>
                <p className="text-sm text-ink-secondary mb-3">{t('linkCreated')}</p>
                <div className="flex gap-2">
                  <input
                    readOnly
                    value={url}
                    aria-label={t('shareLinkAriaLabel')}
                    className="flex-1 min-w-0 text-xs border border-line rounded-xl px-3 py-2 bg-surface-raised text-ink-secondary focus:outline-none"
                  />
                  <button
                    onClick={handleCopy}
                    aria-label={t('copyAriaLabel')}
                    className="px-3 py-2 text-xs font-medium bg-slate-800 text-white rounded-xl hover:bg-slate-700 whitespace-nowrap transition-colors focus:outline-none focus:ring-2 focus:ring-primary-ring focus:ring-offset-2"
                  >
                    {copied ? t('copiedMark') : t('copy')}
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
