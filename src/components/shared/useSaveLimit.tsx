'use client'

import { useCallback, useState } from 'react'
import { useTranslations } from 'next-intl'
import { UpgradeModal } from './UpgradeModal'

// Fängt das Free-Tageslimit beim Speichern ab (429 / SAVE_LIMIT_REACHED aus
// enforceSaveQuota) und zeigt eine Upgrade-Aufforderung mit dem Grund. Vorher
// verschluckten die Modul-Clients die 429 stumm (`if (!res.ok) return`) — der
// Free-Nutzer bekam gar kein Feedback, das Speichern passierte einfach nicht.
//
// Nutzung im Client:
//   const { checkSaveLimit, saveLimitModal } = useSaveLimit()
//   const res = await fetch(...)
//   if (await checkSaveLimit(res)) return   // Limit erreicht → Modal, abbrechen
//   ... und {saveLimitModal} im JSX rendern.
export function useSaveLimit() {
  const t = useTranslations('upgrade')
  const [limited, setLimited] = useState(false)

  // true, wenn die Antwort das Save-Limit war (Aufrufer bricht dann ab).
  const checkSaveLimit = useCallback(async (res: Response): Promise<boolean> => {
    if (res.status !== 429) return false
    const body = await res.clone().json().catch(() => null)
    if (body?.code === 'SAVE_LIMIT_REACHED') {
      setLimited(true)
      return true
    }
    return false
  }, [])

  const saveLimitModal = limited
    ? <UpgradeModal feature="save_limit" reason={t('saveLimitReason')} onClose={() => setLimited(false)} />
    : null

  return { checkSaveLimit, saveLimitModal }
}
