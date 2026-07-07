import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/utils/admin-check'
import { VENDOR_ALIASES, PLATFORM_CATEGORY_KEYWORDS } from '@/lib/canvas-context'

export type LearnSuggestion = {
  word: string
  count: number
  fields: string[]
  suggested_type: 'vendor' | 'category' | 'usecase'
}

const CANVAS_FIELDS = ['problem', 'solution', 'data_sources', 'stakeholders', 'kpis', 'risks', 'architecture', 'next_steps'] as const

const STOPWORDS = new Set([
  // Deutsch grammatisch
  'der', 'die', 'das', 'ein', 'eine', 'einer', 'einem', 'einen', 'eines',
  'und', 'oder', 'aber', 'mit', 'für', 'von', 'bei', 'zum', 'zur', 'des',
  'dem', 'den', 'ist', 'sind', 'wird', 'werden', 'kann', 'soll', 'haben',
  'sein', 'auch', 'nicht', 'alle', 'nach', 'aus', 'durch', 'an', 'auf',
  'in', 'im', 'es', 'er', 'sie', 'wir', 'ich', 'kein', 'keine', 'mehr',
  'sehr', 'noch', 'dass', 'wie', 'als', 'über', 'unter', 'zwischen', 'beim',
  'bereits', 'können', 'sollte', 'müssen', 'muss', 'wurde', 'wurden',
  'neue', 'neuer', 'neues', 'weitere', 'weiteren', 'sowie', 'jedoch',
  'dieser', 'diese', 'dieses', 'einen', 'unser', 'unsere', 'ihrer', 'ihrem',
  'ihres', 'wird', 'werden', 'werden', 'werden', 'daten', 'system', 'prozess',
  'prozesse', 'lösung', 'lösungen', 'nutzer', 'team', 'teams', 'projekt',
  'schritt', 'schritte', 'bereich', 'bereiche', 'ziel', 'ziele', 'rolle',
  'rollen', 'phase', 'phasen', 'wert', 'werte', 'ansatz',
  // Englisch grammatisch
  'the', 'and', 'for', 'with', 'this', 'that', 'from', 'are', 'have',
  'will', 'can', 'not', 'use', 'used', 'using', 'new', 'all', 'more',
  'data', 'based', 'our', 'their', 'its', 'was', 'has', 'been', 'into',
])

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[\s,;.!?()[\]{}\-/\\|&=<>:@#%^*+~`'"„"]+/)
    .map(t => t.trim())
    .filter(t => t.length >= 4 && !/^\d+$/.test(t) && !STOPWORDS.has(t))
}

function guessType(word: string, fieldCounts: Record<string, number>): LearnSuggestion['suggested_type'] {
  const techFields = (fieldCounts['data_sources'] ?? 0) + (fieldCounts['architecture'] ?? 0)
  const processFields = (fieldCounts['problem'] ?? 0) + (fieldCounts['solution'] ?? 0)
  const outcomeFields = (fieldCounts['kpis'] ?? 0) + (fieldCounts['next_steps'] ?? 0)

  if (techFields >= processFields && techFields >= outcomeFields) return 'vendor'
  if (processFields >= outcomeFields) return 'category'
  return 'usecase'
}

export async function GET(request: Request) {
  try { await requireAdmin() } catch {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const threshold = Math.max(1, parseInt(searchParams.get('threshold') ?? '2'))

  const supabase = await createClient()

  const [{ data: canvases }, { data: existingSynonyms }] = await Promise.all([
    supabase.from('canvases').select('id, data'),
    supabase.from('canvas_synonyms').select('synonym'),
  ])

  if (!canvases?.length) return NextResponse.json({ data: [] })

  // Build set of already-known terms (all vendor aliases + category keywords + existing synonyms)
  const knownTerms = new Set<string>()
  for (const aliases of Object.values(VENDOR_ALIASES)) {
    for (const a of aliases) knownTerms.add(a.toLowerCase())
  }
  for (const vendor of Object.keys(VENDOR_ALIASES)) {
    knownTerms.add(vendor.toLowerCase())
  }
  for (const keywords of Object.values(PLATFORM_CATEGORY_KEYWORDS)) {
    for (const k of keywords) knownTerms.add(k.toLowerCase())
  }
  for (const category of Object.keys(PLATFORM_CATEGORY_KEYWORDS)) {
    knownTerms.add(category.toLowerCase())
  }
  for (const s of existingSynonyms ?? []) {
    knownTerms.add(s.synonym.toLowerCase())
  }

  // Count: word → { canvasIds: Set, fieldCounts: Record<field, count> }
  const wordMap = new Map<string, { canvasIds: Set<string>; fieldCounts: Record<string, number> }>()

  for (const canvas of canvases) {
    const canvasData = canvas.data as Record<string, string> | null
    if (!canvasData) continue

    for (const field of CANVAS_FIELDS) {
      const text = canvasData[field]
      if (!text || typeof text !== 'string') continue
      const tokens = tokenize(text)
      for (const word of tokens) {
        if (knownTerms.has(word)) continue
        if (!wordMap.has(word)) {
          wordMap.set(word, { canvasIds: new Set(), fieldCounts: {} })
        }
        const entry = wordMap.get(word)!
        entry.canvasIds.add(canvas.id)
        entry.fieldCounts[field] = (entry.fieldCounts[field] ?? 0) + 1
      }
    }
  }

  // Filter by threshold + build suggestions
  const suggestions: LearnSuggestion[] = []
  for (const [word, { canvasIds, fieldCounts }] of wordMap) {
    if (canvasIds.size < threshold) continue
    const topFields = Object.entries(fieldCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([f]) => f)
    suggestions.push({
      word,
      count: canvasIds.size,
      fields: topFields,
      suggested_type: guessType(word, fieldCounts),
    })
  }

  suggestions.sort((a, b) => b.count - a.count)

  return NextResponse.json({ data: suggestions.slice(0, 40) })
}
