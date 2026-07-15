'use client'
import { useEffect, useRef, useCallback } from 'react'
import { VENDOR_ALIASES, PLATFORM_CATEGORY_KEYWORDS, BASE_VOCAB } from '@/lib/canvas/detection'
import { extractUnknownCandidates } from '@/lib/canvas/pass0'
import { FIELD_PRIOR_MAP, isHarvestField } from '@/lib/canvas/field-priors'
import type { Canvas } from '@/types'

function hashText(s: string): string {
  let h = 0
  for (let i = 0; i < Math.min(s.length, 200); i++) {
    h = ((h * 31) + s.charCodeAt(i)) >>> 0
  }
  return h.toString(36)
}

function buildStaticKnownTerms(): Set<string> {
  const terms = new Set<string>()
  for (const [v, aliases] of Object.entries(VENDOR_ALIASES)) {
    terms.add(v.toLowerCase())
    for (const a of aliases) terms.add(a.toLowerCase())
  }
  for (const [c, kws] of Object.entries(PLATFORM_CATEGORY_KEYWORDS)) {
    terms.add(c.toLowerCase())
    for (const k of kws) terms.add(k.toLowerCase())
  }
  for (const [t, vocab] of Object.entries(BASE_VOCAB)) {
    terms.add(t.toLowerCase())
    for (const k of vocab) terms.add(k.toLowerCase())
  }
  return terms
}

/**
 * Feuert on-blur einen Pass-1-Klassifikations-Call, wenn:
 * (a) Feldtext geändert, (b) Feld hat Harvest-Prior, (c) Pass 0 findet Kandidaten.
 * Ergebnis pro {field}:{textHash} gecacht — kein Doppel-Call.
 */
export function usePass1Classify(canvasId: string | null, getCanvas: () => Canvas | null) {
  const knownTerms  = useRef<Set<string>>(new Set())
  const blocklist   = useRef<Set<string>>(new Set())
  const cache       = useRef<Set<string>>(new Set())
  const prevValues  = useRef<Record<string, string>>({})

  // Einmalig: static vocab aufbauen
  useEffect(() => {
    knownTerms.current = buildStaticKnownTerms()
  }, [])

  // Einmalig: Blocklist laden
  useEffect(() => {
    if (!canvasId) return
    void fetch('/api/canvas/blocklist')
      .then(r => r.ok ? r.json() : null)
      .then((data: { terms: string[] } | null) => {
        if (data?.terms) blocklist.current = new Set(data.terms)
      })
  }, [canvasId])

  const handleBlur = useCallback((fieldId: string, text: string) => {
    if (!canvasId) return

    // (a) Geändert?
    if (prevValues.current[fieldId] === text) return
    prevValues.current[fieldId] = text

    // (b) Harvest-Feld?
    const prior = FIELD_PRIOR_MAP[fieldId]
    if (!prior || !isHarvestField(prior)) return

    const canvas = getCanvas()
    if (!canvas) return

    // (c) Pass-0-Kandidaten im geänderten Feld?
    const candidates = extractUnknownCandidates(canvas, knownTerms.current, blocklist.current)
      .filter(c => c.field === fieldId)
    if (candidates.length === 0) return

    // Deduplizierung: bereits klassifiziert?
    const cacheKey = `${fieldId}:${hashText(text)}`
    if (cache.current.has(cacheKey)) return
    cache.current.add(cacheKey)

    void fetch(`/api/canvas/${canvasId}/classify-terms`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ candidates }),
    })
  }, [canvasId, getCanvas])

  return { handleBlur }
}
