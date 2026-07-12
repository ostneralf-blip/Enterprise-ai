import { readFileSync } from 'fs'
import { join } from 'path'

const versionsRoute = readFileSync(join(process.cwd(), 'src/app/api/versions/route.ts'), 'utf-8')
const shareRoute    = readFileSync(join(process.cwd(), 'src/app/api/share/route.ts'), 'utf-8')
// tier-check.ts zentralisiert Auth + 401/403 seit Sprint 19 (requireFeature)
const tierCheckSrc  = readFileSync(join(process.cwd(), 'src/lib/utils/tier-check.ts'), 'utf-8')
const governanceClient  = readFileSync(join(process.cwd(), 'src/app/[locale]/(dashboard)/governance/GovernancePageClient.tsx'), 'utf-8')
const roadmapClient     = readFileSync(join(process.cwd(), 'src/app/[locale]/(dashboard)/roadmap/RoadmapPageClient.tsx'), 'utf-8')
const canvasClient      = readFileSync(join(process.cwd(), 'src/app/[locale]/(dashboard)/canvas/CanvasPageClient.tsx'), 'utf-8')

describe('Security: /api/versions', () => {
  it('GET prüft Auth und gibt 401 zurück', () => {
    expect(versionsRoute).toContain("status: 401")
    expect(versionsRoute).toContain('supabase.auth.getUser()')
  })

  it('POST prüft Auth und gibt 401 zurück', () => {
    // 401 wird in requireFeature() zentralisiert zurückgegeben
    expect(tierCheckSrc).toContain("status: 401")
  })

  it('POST erfordert Pro-Tier — requireFeature delegiert 403 an tier-check.ts', () => {
    // Route nutzt requireFeature('versioning') — 403 liegt in tier-check.ts, nicht in der Route
    expect(versionsRoute).toContain("requireFeature('versioning')")
    expect(tierCheckSrc).toContain("status: 403")
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

  it('POST erfordert Pro-Tier — requireFeature delegiert 403 an tier-check.ts', () => {
    expect(shareRoute).toContain("requireFeature('sharing')")
    expect(tierCheckSrc).toContain("status: 403")
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
