import { readFileSync } from 'fs'
import { join } from 'path'

const versionsRoute = readFileSync(join(process.cwd(), 'src/app/api/versions/route.ts'), 'utf-8')
const shareRoute    = readFileSync(join(process.cwd(), 'src/app/api/share/route.ts'), 'utf-8')
const governanceClient  = readFileSync(join(process.cwd(), 'src/app/(dashboard)/governance/GovernancePageClient.tsx'), 'utf-8')
const roadmapClient     = readFileSync(join(process.cwd(), 'src/app/(dashboard)/roadmap/RoadmapPageClient.tsx'), 'utf-8')
const canvasClient      = readFileSync(join(process.cwd(), 'src/app/(dashboard)/canvas/CanvasPageClient.tsx'), 'utf-8')

describe('Security: /api/versions', () => {
  it('GET prüft Auth und gibt 401 zurück', () => {
    expect(versionsRoute).toContain("status: 401")
    expect(versionsRoute).toContain('supabase.auth.getUser()')
  })

  it('POST prüft Auth und gibt 401 zurück', () => {
    expect(versionsRoute).toContain("status: 401")
  })

  it('POST erfordert Pro-Tier und gibt 403 zurück', () => {
    expect(versionsRoute).toContain("status: 403")
    expect(versionsRoute).toMatch(/tier.*pro|pro.*tier/i)
  })

  it('POST validiert entity_id als UUID via Zod', () => {
    expect(versionsRoute).toContain('z.string().uuid()')
  })

  it('POST validiert module-Länge (max 50)', () => {
    expect(versionsRoute).toContain('max(50)')
  })

  it('POST legt user_id aus Auth-Session an (kein Client-Trust)', () => {
    expect(versionsRoute).toContain('user.id')
    expect(versionsRoute).not.toContain('body.user_id')
  })
})

describe('Security: /api/share', () => {
  it('GET prüft Auth und gibt 401 zurück', () => {
    expect(shareRoute).toContain("status: 401")
    expect(shareRoute).toContain('supabase.auth.getUser()')
  })

  it('POST erfordert Pro-Tier und gibt 403 zurück', () => {
    expect(shareRoute).toContain("status: 403")
    expect(shareRoute).toMatch(/tier.*pro|pro.*tier/i)
  })

  it('POST validiert entity_id als UUID via Zod', () => {
    expect(shareRoute).toContain('z.string().uuid()')
  })

  it('POST validiert expires_in_days als Integer zwischen 1 und 365', () => {
    expect(shareRoute).toContain('z.number().int().min(1).max(365)')
  })

  it('POST legt user_id aus Auth-Session an (kein Client-Trust)', () => {
    expect(shareRoute).toContain('user.id')
    expect(shareRoute).not.toContain('body.user_id')
  })
})

describe('Security: VersionsPanel + ShareButton in Modul-Clients', () => {
  it('GovernancePageClient importiert VersionsPanel', () => {
    expect(governanceClient).toContain('VersionsPanel')
  })

  it('GovernancePageClient importiert ShareButton', () => {
    expect(governanceClient).toContain('ShareButton')
  })

  it('GovernancePageClient übergibt tier-Prop (kein Free-User erhält Pro-Funktion)', () => {
    expect(governanceClient).toMatch(/tier[=\s{]/)
  })

  it('RoadmapPageClient importiert VersionsPanel', () => {
    expect(roadmapClient).toContain('VersionsPanel')
  })

  it('RoadmapPageClient importiert ShareButton', () => {
    expect(roadmapClient).toContain('ShareButton')
  })

  it('CanvasPageClient importiert VersionsPanel', () => {
    expect(canvasClient).toContain('VersionsPanel')
  })

  it('CanvasPageClient importiert ShareButton', () => {
    expect(canvasClient).toContain('ShareButton')
  })

  it('GovernancePageClient hat keinen direkten Supabase-Import', () => {
    expect(governanceClient).not.toContain("from '@/lib/supabase")
  })

  it('RoadmapPageClient hat keinen direkten Supabase-Import', () => {
    expect(roadmapClient).not.toContain("from '@/lib/supabase")
  })
})
