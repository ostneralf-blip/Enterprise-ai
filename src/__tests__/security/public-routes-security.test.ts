import { readFileSync } from 'fs'
import { join } from 'path'
import { isPublicPath, PUBLIC_PREFIXES } from '@/config/public-routes'
import { PRIVATE_TOOL_ROUTES } from '@/config/private-routes'

describe('Auth-Guard: öffentliche Routen', () => {
  it('lässt Startseite, Rechtstexte und Auth-Flows durch', () => {
    for (const path of ['/', '/login', '/register', '/impressum', '/datenschutz', '/agb', '/widerruf', '/preise', '/reset-password']) {
      expect(isPublicPath(path)).toBe(true)
    }
  })

  it('lässt die Content-Bereiche inklusive Unterseiten durch', () => {
    for (const path of [
      '/blog',
      '/blog/ki-governance-betriebsmodelle',
      '/leitfaden',
      '/leitfaden/ai-governance-aufbauen',
      '/tools',
      '/tools/governance-check',
      '/trust',
      '/share/abc123',
    ]) {
      expect(isPublicPath(path)).toBe(true)
    }
  })
})

describe('Auth-Guard: private Routen bleiben geschützt', () => {
  it('keine einzige Dashboard-Route gilt als öffentlich', () => {
    const leaked = PRIVATE_TOOL_ROUTES.filter(
      (route) => isPublicPath(`/${route}`) || isPublicPath(`/${route}/unterseite`)
    )
    expect(leaked).toEqual([])
  })

  it('Präfix-Vergleich lässt sich nicht durch angehängte Zeichen austricksen', () => {
    // Ein naives startsWith('/trust') würde diese Pfade fälschlich freigeben.
    for (const path of ['/trustcenter', '/blogging', '/toolsuite', '/leitfadenarchiv', '/sharepoint']) {
      expect(isPublicPath(path)).toBe(false)
    }
  })

  it('unbekannte Pfade sind standardmäßig privat (fail closed)', () => {
    for (const path of ['/interner-bereich', '/api-keys', '/dashboard-neu']) {
      expect(isPublicPath(path)).toBe(false)
    }
  })
})

describe('Auth-Guard: Verdrahtung im Proxy', () => {
  it('proxy.ts nutzt die zentrale Prüffunktion statt einer eigenen Inline-Liste', () => {
    const source = readFileSync(join(process.cwd(), 'src/proxy.ts'), 'utf-8')
    expect(source).toContain('isPublicPath')
    expect(source).toContain("from './config/public-routes'")
    // Die frühere, fehleranfällige Inline-Verkettung darf nicht zurückkehren.
    expect(source).not.toContain("localelessPath.startsWith('/trust')")
  })

  it('jeder öffentliche Content-Bereich mit Unterseiten ist als Präfix hinterlegt', () => {
    // Schützt davor, dass ein neuer Bereich (wie /blog am 02.08.2026) vergessen wird.
    for (const prefix of ['/blog', '/leitfaden', '/tools']) {
      expect(PUBLIC_PREFIXES as readonly string[]).toContain(prefix)
    }
  })
})
