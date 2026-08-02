import {
  computeStatusChange,
  isPubliclyVisible,
  BlogStatusError,
  BLOG_STATUSES,
  BLOG_STATUS_LABELS,
  type BlogStatus,
} from '@/lib/blog-status'

const NOW = new Date('2026-08-02T14:30:00.000Z')

describe('Blog-Freigabe: Veröffentlichen setzt den Nachweis voraus', () => {
  it('verweigert die Freigabe ohne Prüfernamen', () => {
    expect(() => computeStatusChange({ nextStatus: 'published', now: NOW })).toThrow(BlogStatusError)
  })

  it('verweigert die Freigabe bei leerem oder nur aus Leerzeichen bestehendem Namen', () => {
    for (const name of ['', '   ', '\t']) {
      expect(() => computeStatusChange({ nextStatus: 'published', reviewedBy: name, now: NOW }))
        .toThrow(BlogStatusError)
    }
  })

  it('setzt bei der Freigabe Prüfer, Prüfzeitpunkt und Veröffentlichungsdatum', () => {
    const r = computeStatusChange({ nextStatus: 'published', reviewedBy: 'Daniel Ostner', now: NOW })
    expect(r.status).toBe('published')
    expect(r.reviewed_by).toBe('Daniel Ostner')
    expect(r.reviewed_at).toBe(NOW.toISOString())
    expect(r.published_at).toBe('2026-08-02')
  })

  it('schneidet Leerzeichen am Prüfernamen ab', () => {
    const r = computeStatusChange({ nextStatus: 'published', reviewedBy: '  Daniel Ostner  ', now: NOW })
    expect(r.reviewed_by).toBe('Daniel Ostner')
  })

  it('behält ein bereits vorhandenes Veröffentlichungsdatum bei erneuter Freigabe', () => {
    // Sonst würde Deaktivieren + erneutes Freigeben den Beitrag in der nach Datum
    // sortierten Übersicht nach vorne schieben.
    const r = computeStatusChange({
      nextStatus: 'published',
      reviewedBy: 'Daniel Ostner',
      existingPublishedAt: '2026-07-01',
      now: NOW,
    })
    expect(r.published_at).toBe('2026-07-01')
  })
})

describe('Blog-Freigabe: übrige Statuswechsel', () => {
  it.each(['draft', 'in_review', 'archived'] as BlogStatus[])(
    'wechselt ohne Prüfernamen nach %s',
    (status) => {
      const r = computeStatusChange({ nextStatus: status, now: NOW })
      expect(r.status).toBe(status)
    }
  )

  it('behält den Freigabevermerk beim Deaktivieren', () => {
    // Die Prüfung hat stattgefunden — das bleibt dokumentiert, auch wenn der Beitrag
    // gerade nicht sichtbar ist.
    const r = computeStatusChange({
      nextStatus: 'archived',
      existingReviewedBy: 'Daniel Ostner',
      existingReviewedAt: '2026-08-02T10:00:00.000Z',
      existingPublishedAt: '2026-08-02',
      now: NOW,
    })
    expect(r.reviewed_by).toBe('Daniel Ostner')
    expect(r.reviewed_at).toBe('2026-08-02T10:00:00.000Z')
    expect(r.published_at).toBe('2026-08-02')
  })

  it('nutzt einen frisch übergebenen Prüfernamen vor dem gespeicherten', () => {
    const r = computeStatusChange({
      nextStatus: 'in_review',
      reviewedBy: 'Neue Person',
      existingReviewedBy: 'Alte Person',
      now: NOW,
    })
    expect(r.reviewed_by).toBe('Neue Person')
  })
})

describe('Blog-Sichtbarkeit', () => {
  it('macht ausschließlich veröffentlichte Beiträge öffentlich', () => {
    expect(isPubliclyVisible('published')).toBe(true)
    for (const s of ['draft', 'in_review', 'archived'] as BlogStatus[]) {
      expect(isPubliclyVisible(s)).toBe(false)
    }
  })

  it('hat für jeden Status ein Label in beiden Sprachen', () => {
    for (const s of BLOG_STATUSES) {
      expect(BLOG_STATUS_LABELS[s].de.trim().length).toBeGreaterThan(0)
      expect(BLOG_STATUS_LABELS[s].en.trim().length).toBeGreaterThan(0)
    }
  })
})
