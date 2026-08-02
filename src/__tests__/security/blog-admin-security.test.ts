import { readFileSync } from 'fs'
import { join } from 'path'

const read = (p: string) => readFileSync(join(process.cwd(), p), 'utf-8')

describe('Blog-Admin-API: Zugriffsschutz', () => {
  const route = read('src/app/api/admin/blog/route.ts')

  it('prüft bei JEDER Methode Admin-Rechte, bevor etwas passiert', () => {
    // Der Admin-Client umgeht RLS — ohne requireAdmin wäre die Route ein offenes
    // Schreibrecht auf alle Blogtabellen.
    const handlers = route.split(/export async function /).slice(1)
    expect(handlers.length).toBe(4) // GET, PUT, PATCH, DELETE
    for (const h of handlers) {
      expect(h).toContain('await requireAdmin()')
    }
  })

  it('validiert Eingaben mit Zod, nicht per Handarbeit', () => {
    expect(route).toContain('safeParse')
    expect(route).toContain('PostSchema')
    expect(route).toContain('StatusSchema')
  })

  it('beschränkt den Slug auf URL-taugliche Zeichen', () => {
    expect(route).toMatch(/slug:\s*z\.string\(\)\.regex\(/)
  })

  it('gibt 401 bzw. 403 statt 500 zurück, wenn die Admin-Prüfung scheitert', () => {
    expect(route).toContain("=== 'UNAUTHORIZED'")
    expect(route).toContain("=== 'FORBIDDEN'")
    expect(route).toContain('status: 401')
    expect(route).toContain('status: 403')
  })

  it('trennt inhaltliche Bearbeitung von der Freigabe', () => {
    // PUT darf keinen Status schreiben — sonst könnte ein Speichern versehentlich
    // veröffentlichen und der Freigabevermerk wäre wertlos.
    const put = route.split('export async function PUT')[1].split('export async function PATCH')[0]
    expect(put).not.toMatch(/status:\s*['"]published['"]/)
    expect(put).not.toContain('computeStatusChange')
  })
})

describe('Blog: öffentliche Lese-Schicht', () => {
  const lib = read('src/lib/blog.ts')

  it('nutzt den RLS-gebundenen Public-Client und NICHT den Admin-Client', () => {
    // Der Admin-Client würde RLS umgehen und könnte Entwürfe ausliefern.
    expect(lib).toContain('createPublicClient')
    expect(lib).not.toContain('createAdminClient')
  })

  it('filtert zusätzlich im Code auf veröffentlichte Beiträge (doppelter Boden)', () => {
    const matches = lib.match(/\.eq\('status', 'published'\)/g) ?? []
    expect(matches.length).toBeGreaterThanOrEqual(3) // Liste, Einzelbeitrag, Slugs
  })

  it('ist server-only, damit der Lesepfad nicht im Client-Bundle landet', () => {
    expect(lib.startsWith("import 'server-only'")).toBe(true)
  })
})

describe('Blog: Datenbank erzwingt den Freigabenachweis', () => {
  const migration = read('supabase/migrations/20260802123609_blog_posts_schema.sql')

  it('lässt den Status published nur mit Prüfer, Prüfzeitpunkt und Datum zu', () => {
    expect(migration).toContain('blog_posts_published_requires_review')
    expect(migration).toMatch(/status <> 'published'/)
    expect(migration).toMatch(/reviewed_by is not null/)
    expect(migration).toMatch(/reviewed_at is not null/)
  })

  it('gibt anonymen Besuchern ausschließlich veröffentlichte Beiträge frei', () => {
    expect(migration).toContain('public_read_published')
    expect(migration).toMatch(/for select to anon, authenticated\s+using \(status = 'published'\)/)
  })

  it('schützt Übersetzungen und Abschnitte über den Status des Beitrags', () => {
    // Ohne diese Bedingung wären die Texte eines Entwurfs einzeln abrufbar,
    // obwohl der Beitrag selbst nicht sichtbar ist.
    const perTable = migration.split('create policy "public_read_published"')
    expect(perTable.length).toBe(4) // 1 Vorspann + 3 Policies
    for (const part of perTable.slice(2)) {
      expect(part).toContain("p.status = 'published'")
    }
  })

  it('erlaubt Schreibzugriff nur Admins', () => {
    const adminPolicies = migration.match(/create policy "admin_all"/g) ?? []
    expect(adminPolicies.length).toBe(3)
    expect(migration).toContain('p.is_admin')
  })
})
