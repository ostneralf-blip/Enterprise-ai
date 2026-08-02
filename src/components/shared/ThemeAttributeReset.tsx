'use client'

import { useEffect } from 'react'

/**
 * Setzt `data-theme` beim Verlassen des Dashboards auf den Markenstandard zurück.
 *
 * Nötig, weil `<html>` bei clientseitiger Navigation bestehen bleibt: Ohne diesen
 * Reset behielte ein Nutzer mit Theme „dark", der aus dem Dashboard auf die
 * Startseite oder eine Rechtsseite wechselt, den dunklen Hintergrund — während
 * diese öffentlichen Seiten ihre Textfarben fest kodiert hellthemig setzen
 * (`text-slate-900`, `bg-slate-50`). Ergebnis wäre dunkle Schrift auf dunklem
 * Grund. Der Reset läuft nur beim Unmount des Dashboard-Layouts.
 */
export function ThemeAttributeReset({ defaultTheme }: { defaultTheme: string }) {
  useEffect(() => {
    return () => {
      document.documentElement.dataset.theme = defaultTheme
    }
  }, [defaultTheme])

  return null
}
