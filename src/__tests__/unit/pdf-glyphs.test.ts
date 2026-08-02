import { readFileSync, readdirSync } from 'fs'
import { join } from 'path'
import { UNSUPPORTED_PDF_GLYPHS, MONO_ONLY_PDF_GLYPHS } from '@/lib/pdf/meridian/fonts'

// Schutz gegen ein Problem, das sich nicht von selbst meldet: react-pdf wirft bei
// fehlenden Glyphen KEINEN Fehler, sondern rendert ein falsches Zeichen oder nichts.
// Der Jest-Mock für @react-pdf/renderer prüft ohnehin keine Fonts. Deshalb hier eine
// statische Prüfung der Quelldateien — sie ersetzt kein echtes Rendering, fängt aber
// den häufigsten Fall ab: jemand fügt ein hübsches Unicode-Symbol in einen Report ein.
//
// Befund vom 02.08.2026: „◎" wurde im Architektur-Report als „Î" ausgegeben, „⚠" gar
// nicht. Beide standen seit Monaten im ausgelieferten PDF.

const PDF_DIR = join(process.cwd(), 'src/lib/pdf/meridian')

function collectSourceFiles(dir: string): string[] {
  const out: string[] = []
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) out.push(...collectSourceFiles(full))
    else if (/\.tsx?$/.test(entry.name) && entry.name !== 'fonts.ts') out.push(full)
  }
  return out
}

/**
 * Liefert je Zeile nur den Teil, der tatsächlich gerendert werden kann.
 *
 * Kommentare werden entfernt — sowohl ganze Kommentarzeilen als auch nachgestellte
 * (`const x = 1 // Achsenzahl ≥ 3`). In der Dokumentation sind diese Zeichen richtig
 * und sollen dort erlaubt bleiben; nur im ausgegebenen Text sind sie ein Problem.
 */
function renderableLines(source: string): { line: string; number: number }[] {
  return source
    .split('\n')
    .map((line, i) => ({ line, number: i + 1 }))
    .filter(({ line }) => {
      const t = line.trim()
      return !t.startsWith('//') && !t.startsWith('*') && !t.startsWith('/*') && !t.startsWith('{/*')
    })
    .map(({ line, number }) => ({ number, line: line.replace(/\/\/.*$/, '').replace(/\/\*.*?\*\//g, '') }))
}

describe('PDF-Reports: keine Zeichen, die die registrierten Fonts nicht darstellen', () => {
  const files = collectSourceFiles(PDF_DIR)

  it('findet überhaupt Report-Quelldateien (sonst prüft der Test nichts)', () => {
    expect(files.length).toBeGreaterThan(5)
  })

  it.each(UNSUPPORTED_PDF_GLYPHS)('verwendet %s nirgends', (glyph) => {
    const hits: string[] = []
    for (const file of files) {
      for (const { line, number } of renderableLines(readFileSync(file, 'utf-8'))) {
        if (line.includes(glyph)) {
          hits.push(`${file.replace(process.cwd() + '/', '')}:${number}`)
        }
      }
    }
    expect(hits).toEqual([])
  })
})

describe('PDF-Reports: mono-only-Zeichen nur in Mono-Textelementen', () => {
  const files = collectSourceFiles(PDF_DIR)

  it.each(MONO_ONLY_PDF_GLYPHS)(
    '%s steht nur in Zeilen, deren Style die Mono-Schrift nutzt',
    (glyph) => {
      const suspicious: string[] = []
      for (const file of files) {
        const source = readFileSync(file, 'utf-8')
        for (const { line, number } of renderableLines(source)) {
          if (!line.includes(glyph)) continue
          // Heuristik: Der verwendete Style muss im Namen auf ein Mono-Element
          // verweisen (z. B. connVerb) ODER die Zeile setzt fontFamily direkt.
          const styleMatch = line.match(/styles\.(\w+)/)
          const usesMonoDirectly = line.includes('reportFonts.mono')
          const styleIsMono = styleMatch
            ? new RegExp(`${styleMatch[1]}:\\s*\\{[^}]*reportFonts\\.mono`).test(source)
            : false
          if (!usesMonoDirectly && !styleIsMono) {
            suspicious.push(`${file.replace(process.cwd() + '/', '')}:${number}`)
          }
        }
      }
      expect(suspicious).toEqual([])
    }
  )
})

describe('Report-Übersetzungen: keine nicht darstellbaren Zeichen', () => {
  // Wichtiger Nachtrag: Der Quellcode-Scan oben hätte den zweiten Fund am 02.08.2026
  // NICHT gefangen — „geplant → evaluiert → …" stand in messages/*.json und wurde im
  // PDF als „geplant ' evaluiert" ausgegeben. Reporttexte müssen genauso geprüft werden
  // wie der Code. `→` ist hier immer falsch, weil die Legende in der Sans-Schrift steht.
  const FORBIDDEN = [...UNSUPPORTED_PDF_GLYPHS, ...MONO_ONLY_PDF_GLYPHS]

  function collectStrings(node: unknown, path: string[], out: { path: string; value: string }[]) {
    if (typeof node === 'string') out.push({ path: path.join('.'), value: node })
    else if (node && typeof node === 'object') {
      for (const [k, v] of Object.entries(node)) collectStrings(v, [...path, k], out)
    }
  }

  it.each(['de', 'en'])('%s: reports-Namensraum ist frei von Problemzeichen', (lang) => {
    const messages = JSON.parse(
      readFileSync(join(process.cwd(), `messages/${lang}.json`), 'utf-8')
    ) as { reports?: unknown }
    const strings: { path: string; value: string }[] = []
    collectStrings(messages.reports ?? {}, ['reports'], strings)

    expect(strings.length).toBeGreaterThan(20) // sonst prüft der Test nichts

    const hits = strings
      .filter((s) => FORBIDDEN.some((g) => s.value.includes(g)))
      .map((s) => s.path)
    expect(hits).toEqual([])
  })
})

describe('Glyphen-Liste ist gepflegt', () => {
  it('enthält die beiden am 02.08.2026 gefundenen Fälle', () => {
    expect(UNSUPPORTED_PDF_GLYPHS).toContain('◎')
    expect(UNSUPPORTED_PDF_GLYPHS).toContain('⚠')
  })

  it('überschneidet sich nicht mit den mono-tauglichen Zeichen', () => {
    const overlap = MONO_ONLY_PDF_GLYPHS.filter((g) =>
      (UNSUPPORTED_PDF_GLYPHS as readonly string[]).includes(g)
    )
    expect(overlap).toEqual([])
  })
})
