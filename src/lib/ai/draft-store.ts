'use client'

const TTL_MS = 7 * 24 * 60 * 60 * 1000 // 7 Tage

interface AiDraft {
  result: unknown
  module: string
  entityId: string
  savedAt: number // Date.now()
  model?: string | null
  basedOnHash?: string | null
}

function draftKey(module: string, entityId: string): string {
  return `ai_draft_${module}_${entityId}`
}

/** Veraltete Drafts (TTL überschritten) löschen */
function pruneExpired(): void {
  if (typeof window === 'undefined') return
  const cutoff = Date.now() - TTL_MS
  const toRemove: string[] = []
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (!key?.startsWith('ai_draft_')) continue
    try {
      const raw = localStorage.getItem(key)
      if (!raw) continue
      const draft = JSON.parse(raw) as AiDraft
      if (draft.savedAt < cutoff) toRemove.push(key)
    } catch {
      toRemove.push(key!)
    }
  }
  toRemove.forEach(k => localStorage.removeItem(k))
}

export function saveDraft(
  module: string,
  entityId: string,
  result: unknown,
  meta?: { model?: string | null; basedOnHash?: string | null }
): void {
  if (typeof window === 'undefined') return
  pruneExpired()
  const draft: AiDraft = {
    result,
    module,
    entityId,
    savedAt: Date.now(),
    model: meta?.model ?? null,
    basedOnHash: meta?.basedOnHash ?? null,
  }
  try {
    localStorage.setItem(draftKey(module, entityId), JSON.stringify(draft))
  } catch {
    // localStorage voll — ignorieren
  }
}

export function loadDraft(module: string, entityId: string): AiDraft | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(draftKey(module, entityId))
    if (!raw) return null
    const draft = JSON.parse(raw) as AiDraft
    if (Date.now() - draft.savedAt > TTL_MS) {
      localStorage.removeItem(draftKey(module, entityId))
      return null
    }
    return draft
  } catch {
    return null
  }
}

export function clearDraft(module: string, entityId: string): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(draftKey(module, entityId))
}

export function formatDraftAge(savedAt: number): string {
  const diffMs = Date.now() - savedAt
  const diffMin = Math.round(diffMs / 60_000)
  if (diffMin < 1) return 'gerade eben'
  if (diffMin < 60) return `vor ${diffMin} Min.`
  const diffH = Math.round(diffMin / 60)
  if (diffH < 24) return `vor ${diffH} Std.`
  return `vor ${Math.round(diffH / 24)} Tag(en)`
}
