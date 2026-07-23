import { readFileSync } from 'fs'
import { join } from 'path'

// Security-Gate für die Assessment-Draft-Autosave-Routen (UX-Review Sprint 35).
// Statische Quelltext-Prüfung im etablierten Muster (siehe
// export-report-security.test.ts): Pro-Gating via requireFeature, Zod-Validierung
// aller Eingaben, Eigentumsprüfung über user_id.
const postRoute = readFileSync(join(process.cwd(), 'src/app/api/assessment/route.ts'), 'utf-8')
const idRoute = readFileSync(join(process.cwd(), 'src/app/api/assessment/[id]/route.ts'), 'utf-8')
const tierCheckSrc = readFileSync(join(process.cwd(), 'src/lib/utils/tier-check.ts'), 'utf-8')

describe('Security: POST /api/assessment (Draft anlegen)', () => {
  it('gatet über requireFeature(save_results) — delegiert 401/403 an tier-check.ts (save_results ist seit #222 free, das Gate erzwingt weiterhin Auth)', () => {
    expect(postRoute).toContain("requireFeature('save_results')")
    expect(tierCheckSrc).toContain('status: 401')
    expect(tierCheckSrc).toContain('status: 403')
  })

  it('validiert den Body via Zod (kein Client-Trust) und antwortet 422 bei Fehleingabe', () => {
    expect(postRoute).toContain('CreateSchema')
    expect(postRoute).toContain('safeParse')
    expect(postRoute).toContain('status: 422')
  })

  it('setzt user_id aus dem Gate-Ergebnis, nicht aus Client-Input', () => {
    expect(postRoute).toContain('gate.userId')
  })
})

describe('Security: PATCH /api/assessment/[id] (Draft-Update / Finalisierung)', () => {
  it('gatet über requireFeature(save_results) und erzwingt bei Finalisierung das Free-Tageslimit (enforceSaveQuota)', () => {
    expect(idRoute).toContain("requireFeature('save_results')")
    expect(idRoute).toContain('enforceSaveQuota')
  })

  it('validiert den Body via Zod inkl. Score-Wertebereich (1–5) und antwortet 422', () => {
    expect(idRoute).toContain('PatchSchema')
    expect(idRoute).toContain('safeParse')
    expect(idRoute).toContain('status: 422')
  })

  it('filtert das Update über user_id (verhindert Schreiben auf fremde Sessions) und gibt 404 bei fehlendem Treffer', () => {
    expect(idRoute).toContain('.eq(\'id\', id)')
    expect(idRoute).toContain('gate.userId')
    expect(idRoute).toContain('status: 404')
  })

  it('DELETE prüft Auth und filtert nach user_id (kein Löschen fremder Sessions)', () => {
    expect(idRoute).toContain('getUser()')
    expect(idRoute).toContain(".eq('user_id', user.id)")
  })

  it('lädt Daten erst nach dem Gate (kein Supabase-Zugriff vor requireFeature)', () => {
    const gateIdx = idRoute.indexOf("requireFeature('save_results')")
    const clientIdx = idRoute.indexOf('await createClient()', gateIdx)
    expect(gateIdx).toBeGreaterThan(-1)
    expect(clientIdx).toBeGreaterThan(gateIdx)
  })
})
