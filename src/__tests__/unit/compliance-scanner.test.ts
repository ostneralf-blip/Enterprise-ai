import { computeHash, stripHtml, fetchText, summarizeWithClaude, COMPLIANCE_SOURCES } from '@/lib/compliance/scanner'

// fetch global mocken — wird in allen Tests mit jest.fn() überschrieben
beforeEach(() => {
  global.fetch = jest.fn()
})
afterEach(() => {
  jest.restoreAllMocks()
  delete (process.env as Record<string, string | undefined>).ANTHROPIC_API_KEY
})

// ─── computeHash ─────────────────────────────────────────────────────────────

describe('computeHash', () => {
  it('liefert gleichen Hash für gleichen Text', () => {
    expect(computeHash('EU AI Act Artikel 9')).toBe(computeHash('EU AI Act Artikel 9'))
  })

  it('liefert anderen Hash wenn sich der Text ändert', () => {
    const hashVorher = computeHash('Hochrisiko-Pflichten: August 2026')
    const hashNachher = computeHash('Hochrisiko-Pflichten: Dezember 2027')
    expect(hashVorher).not.toBe(hashNachher)
  })

  it('gibt einen 64-Zeichen-Hex-String zurück (SHA-256)', () => {
    expect(computeHash('test')).toMatch(/^[a-f0-9]{64}$/)
  })

  it('ist deterministisch über mehrere Aufrufe', () => {
    const text = 'DSGVO Art. 12–14 Transparenzpflichten'
    const results = Array.from({ length: 5 }, () => computeHash(text))
    expect(new Set(results).size).toBe(1)
  })
})

// ─── stripHtml ───────────────────────────────────────────────────────────────

describe('stripHtml', () => {
  it('entfernt HTML-Tags', () => {
    expect(stripHtml('<p>Artikel 9 EU AI Act</p>')).toBe('Artikel 9 EU AI Act')
  })

  it('entfernt Script-Blöcke vollständig', () => {
    const result = stripHtml('<script>alert("xss")</script><p>Inhalt</p>')
    expect(result).not.toContain('alert')
    expect(result).toContain('Inhalt')
  })

  it('entfernt Style-Blöcke vollständig', () => {
    const result = stripHtml('<style>.cls{color:red}</style><p>Text</p>')
    expect(result).not.toContain('.cls')
    expect(result).toContain('Text')
  })

  it('kollabiert mehrfache Whitespaces', () => {
    expect(stripHtml('<p>Wort   A</p>   <p>Wort   B</p>')).toBe('Wort A Wort B')
  })

  it('schneidet bei 8000 Zeichen ab', () => {
    const lang = '<p>' + 'x'.repeat(10000) + '</p>'
    expect(stripHtml(lang).length).toBeLessThanOrEqual(8000)
  })
})

// ─── fetchText ───────────────────────────────────────────────────────────────

describe('fetchText', () => {
  it('gibt null zurück bei HTTP-Fehler (404)', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({ ok: false, status: 404 })
    const result = await fetchText('https://example.com/seite')
    expect(result).toBeNull()
  })

  it('gibt null zurück bei Netzwerkfehler', async () => {
    ;(global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Netzwerk nicht erreichbar'))
    const result = await fetchText('https://example.com/seite')
    expect(result).toBeNull()
  })

  it('gibt Text zurück und strippt HTML bei Erfolg', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      text: () => Promise.resolve('<h1>EU AI Act</h1><p>Artikel 9 Risikomanagementsystem</p>'),
    })
    const result = await fetchText('https://eur-lex.europa.eu/...')
    expect(result).toBe('EU AI Act Artikel 9 Risikomanagementsystem')
  })
})

// ─── summarizeWithClaude ─────────────────────────────────────────────────────

describe('summarizeWithClaude', () => {
  it('gibt Fallback zurück wenn kein API-Key gesetzt', async () => {
    const result = await summarizeWithClaude('alter Text', 'neuer Text')
    expect(result.status_estimate).toBe('unklar')
    expect(result.summary).toContain('fehlgeschlagen')
  })

  it('parst gültige Claude-Antwort korrekt', async () => {
    process.env.ANTHROPIC_API_KEY = 'test-key'
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        content: [{ text: '{"summary":"Artikel 9 Frist auf Dezember 2027 verschoben.","status_estimate":"entwurf"}' }],
      }),
    })
    const result = await summarizeWithClaude('alt', 'neu')
    expect(result.summary).toBe('Artikel 9 Frist auf Dezember 2027 verschoben.')
    expect(result.status_estimate).toBe('entwurf')
  })

  it('normalisiert ungültigen status_estimate auf unklar', async () => {
    process.env.ANTHROPIC_API_KEY = 'test-key'
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        content: [{ text: '{"summary":"Etwas hat sich geändert.","status_estimate":"möglicherweise"}' }],
      }),
    })
    const result = await summarizeWithClaude('alt', 'neu')
    expect(result.status_estimate).toBe('unklar')
  })

  it('gibt Fallback zurück bei ungültigem JSON', async () => {
    process.env.ANTHROPIC_API_KEY = 'test-key'
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ content: [{ text: 'kein JSON hier' }] }),
    })
    const result = await summarizeWithClaude('alt', 'neu')
    expect(result.status_estimate).toBe('unklar')
    expect(result.summary).toContain('fehlgeschlagen')
  })

  it('gibt Fallback zurück bei HTTP-Fehler der Anthropic API', async () => {
    process.env.ANTHROPIC_API_KEY = 'test-key'
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({ ok: false, status: 529 })
    const result = await summarizeWithClaude('alt', 'neu')
    expect(result.status_estimate).toBe('unklar')
  })
})

// ─── COMPLIANCE_SOURCES ──────────────────────────────────────────────────────

describe('COMPLIANCE_SOURCES', () => {
  it('enthält genau 5 Quellen', () => {
    expect(COMPLIANCE_SOURCES).toHaveLength(5)
  })

  it('jede Quelle hat url und label', () => {
    for (const src of COMPLIANCE_SOURCES) {
      expect(src.url).toMatch(/^https:\/\//)
      expect(src.label.length).toBeGreaterThan(0)
    }
  })

  it('enthält EUR-Lex AI Act Volltext als Quelle', () => {
    const eurlexSource = COMPLIANCE_SOURCES.find(s => s.url.includes('eur-lex.europa.eu'))
    expect(eurlexSource).toBeDefined()
    expect(eurlexSource?.url).toContain('32024R1689')
  })
})
