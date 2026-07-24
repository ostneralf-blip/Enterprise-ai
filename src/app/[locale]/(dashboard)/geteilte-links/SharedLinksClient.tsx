'use client'
import { useState } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { AlertBox } from '@/components/shared/AlertBox'

export interface ShareLinkRow {
  id: string; token: string; module: string; entity_id: string
  expires_at: string | null; view_count: number; created_at: string
}

export function SharedLinksClient({ initialLinks }: { initialLinks: ShareLinkRow[] }) {
  const t = useTranslations('sharedLinks')
  const locale = useLocale()
  const [links, setLinks] = useState(initialLinks)
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const fmt = (d: string) => new Date(d).toLocaleDateString(locale === 'en' ? 'en-GB' : 'de-DE',
    { day: '2-digit', month: '2-digit', year: 'numeric' })
  const isExpired = (l: ShareLinkRow) => l.expires_at !== null && new Date(l.expires_at) < new Date()

  const revoke = async (id: string) => {
    if (!confirm(t('confirmRevoke'))) return
    setBusy(id); setError(null)
    const prev = links
    setLinks(ls => ls.filter(l => l.id !== id))
    try {
      const res = await fetch(`/api/share?id=${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
    } catch {
      setLinks(prev); setError('Fehler')
    } finally { setBusy(null) }
  }

  if (links.length === 0) return <p className="text-sm text-ink-muted py-8 text-center">{t('empty')}</p>

  return (
    <div className="space-y-3">
      {error && <AlertBox variant="error">{error}</AlertBox>}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-line text-left text-xs text-ink-muted uppercase">
            <th className="py-2 pr-3">{t('colModule')}</th>
            <th className="py-2 pr-3">{t('colExpires')}</th>
            <th className="py-2 pr-3">{t('colViews')}</th>
            <th className="py-2 pr-3">{t('colCreated')}</th>
            <th className="py-2">{t('colAction')}</th>
          </tr></thead>
          <tbody className="divide-y divide-line-subtle">
            {links.map(l => (
              <tr key={l.id} className={isExpired(l) ? 'opacity-50' : ''}>
                <td className="py-2.5 pr-3 font-medium text-ink capitalize">{l.module}</td>
                <td className="py-2.5 pr-3 text-ink-secondary">
                  {l.expires_at ? fmt(l.expires_at) : t('never')}
                  {isExpired(l) && <span className="ml-1.5 text-xs">({t('expired')})</span>}
                </td>
                <td className="py-2.5 pr-3 text-ink-secondary">{l.view_count}</td>
                <td className="py-2.5 pr-3 text-ink-muted">{fmt(l.created_at)}</td>
                <td className="py-2.5">
                  <a href={`/share/${l.token}`} target="_blank" rel="noopener noreferrer"
                    className="text-xs text-primary hover:underline mr-3">{t('openLink')} ↗</a>
                  <button onClick={() => revoke(l.id)} disabled={busy === l.id}
                    className="text-xs font-medium text-error-text hover:underline disabled:opacity-50">
                    {busy === l.id ? t('revoking') : t('revoke')}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
