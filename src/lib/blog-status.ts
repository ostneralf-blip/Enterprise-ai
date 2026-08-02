// Redaktionsstatus für Blogbeiträge — bewusst als reine Logik ohne Datenbank- oder
// Next.js-Abhängigkeit, damit die Freigaberegeln unabhängig von der API testbar sind.
//
// Hintergrund: Nach Art. 50 Abs. 4 EU AI Act entfällt die Kennzeichnungspflicht für
// KI-unterstützt erstellte, öffentlich informierende Texte nur bei echter menschlicher
// Prüfung mit benannter redaktioneller Verantwortung. „Veröffentlicht" darf deshalb
// nie ohne Prüfer und Prüfzeitpunkt erreichbar sein.

export const BLOG_STATUSES = ['draft', 'in_review', 'published', 'archived'] as const
export type BlogStatus = (typeof BLOG_STATUSES)[number]

export const BLOG_STATUS_LABELS: Record<BlogStatus, { de: string; en: string }> = {
  draft:     { de: 'Entwurf',        en: 'Draft' },
  in_review: { de: 'In Prüfung',     en: 'In review' },
  published: { de: 'Veröffentlicht', en: 'Published' },
  archived:  { de: 'Deaktiviert',    en: 'Deactivated' },
}

/** Nur diese Beiträge sind öffentlich sichtbar. */
export function isPubliclyVisible(status: BlogStatus): boolean {
  return status === 'published'
}

export interface StatusChangeInput {
  nextStatus: BlogStatus
  /** Name der prüfenden Person — Pflicht beim Veröffentlichen. */
  reviewedBy?: string | null
  /** Bereits gesetztes Veröffentlichungsdatum, falls der Beitrag schon einmal live war. */
  existingPublishedAt?: string | null
  /** Bereits vorhandener Freigabevermerk (bleibt bei Statuswechseln erhalten). */
  existingReviewedBy?: string | null
  existingReviewedAt?: string | null
  /** Zeitpunkt der Aktion; als Parameter, damit Tests deterministisch bleiben. */
  now: Date
}

export interface StatusChangeResult {
  status: BlogStatus
  reviewed_by: string | null
  reviewed_at: string | null
  published_at: string | null
}

export class BlogStatusError extends Error {}

/**
 * Berechnet die zu schreibenden Felder für einen Statuswechsel.
 *
 * Regeln:
 *  - Veröffentlichen verlangt einen nicht-leeren Prüfernamen und setzt den
 *    Prüfzeitpunkt auf jetzt. Ohne beides wirft die Funktion — dieselbe Bedingung
 *    ist zusätzlich als CHECK-Constraint in der Datenbank hinterlegt.
 *  - Das Veröffentlichungsdatum wird beim ersten Freigeben gesetzt und danach nicht
 *    mehr überschrieben, damit ein Deaktivieren und erneutes Freigeben das
 *    ursprüngliche Datum (und damit die Sortierung) nicht verändert.
 *  - Deaktivieren, Zurücksetzen auf Entwurf oder Prüfung behalten einen bereits
 *    vorhandenen Freigabevermerk. Er dokumentiert, dass die Prüfung stattgefunden
 *    hat — auch wenn der Beitrag gerade nicht sichtbar ist.
 */
export function computeStatusChange(input: StatusChangeInput): StatusChangeResult {
  const { nextStatus, existingPublishedAt = null, now } = input
  const reviewedBy = input.reviewedBy?.trim() || null

  if (nextStatus === 'published') {
    if (!reviewedBy) {
      throw new BlogStatusError(
        'Zum Veröffentlichen ist der Name der prüfenden Person erforderlich (Art. 50 Abs. 4 EU AI Act).'
      )
    }
    return {
      status: 'published',
      reviewed_by: reviewedBy,
      reviewed_at: now.toISOString(),
      published_at: existingPublishedAt ?? now.toISOString().slice(0, 10),
    }
  }

  // Entwurf, Prüfung, Deaktiviert: vorhandenen Freigabevermerk unverändert lassen.
  return {
    status: nextStatus,
    reviewed_by: reviewedBy ?? input.existingReviewedBy ?? null,
    reviewed_at: input.existingReviewedAt ?? null,
    published_at: existingPublishedAt,
  }
}
