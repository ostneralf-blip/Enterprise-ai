import { readFileSync, readdirSync } from 'fs'
import { join } from 'path'
import { OG_IMAGES, ogLocale } from '@/lib/seo'
import robots from '@/app/robots'

// Befund 02.08.2026: Außer der Startseite hatte KEINE Seite ein og:image — geteilte
// Links erschienen ohne Vorschaubild. Ursache: Next.js führt Metadaten nur FLACH
// zusammen. Definiert eine Seite ein eigenes `openGraph`-Objekt, ersetzt das den
// Block aus dem Layout vollständig, inklusive der dort hinterlegten Bilder. Die
// Startseite hatte deshalb bereits eine handgeschriebene images-Zeile; alle später
// gebauten Seiten nicht.
//
// Dieser Test erzwingt die Regel: Wer openGraph setzt, muss images mitgeben.

const APP_DIR = join(process.cwd(), 'src/app/[locale]')

function collectPageFiles(dir: string): string[] {
  const out: string[] = []
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) out.push(...collectPageFiles(full))
    else if (/^(page|layout)\.tsx$/.test(entry.name)) out.push(full)
  }
  return out
}

describe('Open Graph: jede Seite mit openGraph liefert auch ein Bild', () => {
  const files = collectPageFiles(APP_DIR)

  it('findet überhaupt Seiten (sonst prüft der Test nichts)', () => {
    expect(files.length).toBeGreaterThan(10)
  })

  it('keine openGraph-Definition ohne images', () => {
    const offenders: string[] = []
    for (const file of files) {
      const source = readFileSync(file, 'utf-8')
      // Jeden openGraph-Block isolieren und auf images prüfen.
      const blocks = source.split(/openGraph:\s*\{/).slice(1)
      for (const block of blocks) {
        const body = block.split('\n').slice(0, 12).join('\n')
        if (!body.includes('images:')) {
          offenders.push(file.replace(process.cwd() + '/', ''))
        }
      }
    }
    expect(offenders).toEqual([])
  })

  it('nutzt die gemeinsame Konstante statt eigener Bildpfade', () => {
    // Verhindert, dass sich Größe oder URL zwischen den Seiten auseinanderentwickeln.
    const handwritten: string[] = []
    for (const file of files) {
      const source = readFileSync(file, 'utf-8')
      if (/images:\s*\[\{/.test(source)) handwritten.push(file.replace(process.cwd() + '/', ''))
    }
    expect(handwritten).toEqual([])
  })
})

describe('Open Graph: gemeinsame Bildkonstante', () => {
  it('zeigt auf die generierte Bildroute mit korrekten Maßen', () => {
    expect(OG_IMAGES).toHaveLength(1)
    expect(OG_IMAGES[0].url).toMatch(/\/opengraph-image$/)
    expect(OG_IMAGES[0].width).toBe(1200)
    expect(OG_IMAGES[0].height).toBe(630)
    expect(OG_IMAGES[0].alt.trim().length).toBeGreaterThan(0)
  })

  it('nutzt eine absolute URL — Social-Crawler lösen relative Pfade unzuverlässig auf', () => {
    expect(OG_IMAGES[0].url.startsWith('http')).toBe(true)
  })

  it('bildet das Routen-Locale auf die Open-Graph-Schreibweise ab', () => {
    expect(ogLocale('de')).toBe('de_DE')
    expect(ogLocale('en')).toBe('en_GB')
  })
})

describe('Indexierbarkeit des Blogs', () => {
  it('robots.txt sperrt weder den Blog-Hub noch Beiträge', () => {
    const result = robots()
    const rules = Array.isArray(result.rules) ? result.rules : [result.rules]
    for (const rule of rules) {
      const disallow = Array.isArray(rule.disallow) ? rule.disallow : [rule.disallow]
      for (const entry of disallow) {
        expect(entry?.startsWith('/blog')).not.toBe(true)
        expect(entry?.startsWith('/en/blog')).not.toBe(true)
      }
    }
  })

  it('robots.txt verweist auf die Sitemap und setzt den Host', () => {
    const result = robots()
    expect(result.sitemap).toMatch(/\/sitemap\.xml$/)
    expect(result.host).toBeTruthy()
  })

  it('Blogseiten setzen Canonical und hreflang inklusive x-default', () => {
    for (const file of ['blog/page.tsx', 'blog/[slug]/page.tsx']) {
      const source = readFileSync(join(APP_DIR, file), 'utf-8')
      expect(source).toContain('canonical')
      expect(source).toContain("'x-default'")
      expect(source).toMatch(/languages:\s*\{/)
    }
  })

  it('Sitemap meldet für Beiträge ein echtes Änderungsdatum statt des Build-Zeitpunkts', () => {
    const source = readFileSync(join(process.cwd(), 'src/app/sitemap.ts'), 'utf-8')
    expect(source).toContain('getPublishedSlugsWithDates')
    expect(source).toContain("'x-default': deUrl")
  })
})
