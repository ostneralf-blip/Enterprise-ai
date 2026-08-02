import { readdirSync, readFileSync } from 'fs'
import { join } from 'path'
import { PRIVATE_TOOL_ROUTES, PRIVATE_ROUTES_HEADER_SOURCE } from '@/config/private-routes'
import robots from '@/app/robots'

const DASHBOARD_DIR = join(process.cwd(), 'src/app/[locale]/(dashboard)')

/** Alle Routensegmente unterhalb der (dashboard)-Gruppe — das sind die privaten Bereiche. */
function dashboardRouteSegments(): string[] {
  return readdirSync(DASHBOARD_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .filter((name) => !name.startsWith('_') && !name.startsWith('('))
}

describe('Private Routen: robots.txt und Cache-Header laufen nicht auseinander', () => {
  it('jede Route unter (dashboard) steht in PRIVATE_TOOL_ROUTES', () => {
    const missing = dashboardRouteSegments().filter(
      (segment) => !(PRIVATE_TOOL_ROUTES as readonly string[]).includes(segment)
    )
    expect(missing).toEqual([])
  })

  it('PRIVATE_TOOL_ROUTES enthält keine Einträge ohne zugehörige Route', () => {
    const actual = new Set(dashboardRouteSegments())
    const stale = PRIVATE_TOOL_ROUTES.filter((route) => !actual.has(route))
    expect(stale).toEqual([])
  })

  it('robots.txt verbietet jede private Route in DE- und EN-Variante', () => {
    const result = robots()
    const rules = Array.isArray(result.rules) ? result.rules : [result.rules]

    for (const rule of rules) {
      const disallow = Array.isArray(rule.disallow) ? rule.disallow : [rule.disallow]
      for (const route of PRIVATE_TOOL_ROUTES) {
        expect(disallow).toContain(`/${route}`)
        expect(disallow).toContain(`/en/${route}`)
      }
    }
  })

  it('robots.txt verbietet weiterhin API, Auth-Flows und Share-Links', () => {
    const result = robots()
    const rules = Array.isArray(result.rules) ? result.rules : [result.rules]
    const disallow = Array.isArray(rules[0].disallow) ? rules[0].disallow : [rules[0].disallow]

    for (const path of ['/api/', '/ingest/', '/share/', '/en/share/', '/reset-password']) {
      expect(disallow).toContain(path)
    }
  })

  it('robots.txt lässt die öffentlichen Content-Bereiche zu (Blog, Leitfaden, Tools)', () => {
    const result = robots()
    const rules = Array.isArray(result.rules) ? result.rules : [result.rules]
    const disallow = Array.isArray(rules[0].disallow) ? rules[0].disallow : [rules[0].disallow]

    for (const path of ['/blog', '/leitfaden', '/tools', '/preise']) {
      expect(disallow).not.toContain(path)
    }
  })

  it('das Header-Quellmuster matcht private Routen mit und ohne /en-Präfix, aber keine öffentlichen', () => {
    // next.config.ts nutzt dasselbe Muster für Cache-Control: no-store.
    const regex = new RegExp(`^${PRIVATE_ROUTES_HEADER_SOURCE}$`)

    for (const route of PRIVATE_TOOL_ROUTES) {
      expect(regex.test(`/${route}`)).toBe(true)
      expect(regex.test(`/en/${route}`)).toBe(true)
      expect(regex.test(`/${route}/unterseite`)).toBe(true)
    }

    for (const publicPath of ['/blog', '/leitfaden', '/tools', '/preise', '/impressum', '/']) {
      expect(regex.test(publicPath)).toBe(false)
    }
  })
})

describe('Private Routen: next.config.ts nutzt die zentrale Liste', () => {
  it('next.config.ts importiert das Quellmuster statt es zu duplizieren', () => {
    const source = readFileSync(join(process.cwd(), 'next.config.ts'), 'utf-8')
    expect(source).toContain('PRIVATE_ROUTES_HEADER_SOURCE')
    expect(source).toContain("from './src/config/private-routes'")
    // Die alte, handgepflegte Doppelliste darf nicht zurückkehren.
    expect(source).not.toContain('(dashboard|assessment|usecase')
  })
})
