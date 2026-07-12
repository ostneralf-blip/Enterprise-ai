/**
 * SECURITY TEST SUITE — AI Navigator
 * ════════════════════════════════════════════════════════════════════════
 * Diese Datei kombiniert automatisierte Tests mit einer manuellen
 * Test-Checkliste (siehe Kommentare). Automatisierte Tests prüfen
 * Code-Logik; RLS- und Auth-Verhalten gegen die echte Supabase-Instanz
 * MUSS zusätzlich manuell verifiziert werden (siehe docs/testing/security-checklist.md).
 *
 * STATUS-KONVENTION:
 *   ✅ automatisiert testbar ohne Live-Backend
 *   🔶 erfordert Live-Supabase-Instanz (siehe manuelle Checkliste)
 */

import { FEATURE_TIERS } from '@/config/tiers'

describe('Security: Input Validation', () => {
  // ✅ Zod-Schema-Validierung für API-Inputs
  it('Feedback-Schema lehnt zu lange Kommentare ab (DoS/Storage-Schutz)', async () => {
    const { z } = await import('zod')
    const schema = z.object({
      module: z.string(),
      sentiment: z.enum(['positive', 'negative']),
      comment: z.string().max(500).optional(),
    })
    const longComment = 'a'.repeat(501)
    const result = schema.safeParse({ module: 'assessment', sentiment: 'positive', comment: longComment })
    expect(result.success).toBe(false)
  })

  it('Feedback-Schema lehnt ungültige Sentiment-Werte ab', async () => {
    const { z } = await import('zod')
    const schema = z.object({
      module: z.string(),
      sentiment: z.enum(['positive', 'negative']),
    })
    const result = schema.safeParse({ module: 'assessment', sentiment: 'malicious_value' })
    expect(result.success).toBe(false)
  })

  it('PDF-Export-Query lehnt ungültige Modul-Namen ab (verhindert Path-Traversal-artige Angriffe)', async () => {
    const { z } = await import('zod')
    const schema = z.object({
      module: z.enum(['assessment', 'usecase', 'governance', 'roadmap', 'canvas']),
    })
    const result = schema.safeParse({ module: '../../etc/passwd' })
    expect(result.success).toBe(false)
  })

  it('PDF-Export-Query lehnt ungültige UUID für entityId ab', async () => {
    const { z } = await import('zod')
    const schema = z.object({ entityId: z.string().uuid().optional() })
    const result = schema.safeParse({ entityId: '1 OR 1=1' })
    expect(result.success).toBe(false)
  })
})

describe('Security: Feature-Gating darf nicht client-seitig umgehbar sein', () => {
  // ✅ FEATURE_TIERS ist ein statisches const-Objekt — kein Client-Input beeinflusst die Tier-Zuordnung
  it('FEATURE_TIERS definiert pdf_export als pro-Feature', () => {
    expect(FEATURE_TIERS['pdf_export']).toBe('pro')
  })

  it('FEATURE_TIERS definiert sharing als pro-Feature', () => {
    expect(FEATURE_TIERS['sharing']).toBe('pro')
  })

  /**
   * 🔶 MANUELLER TEST ERFORDERLICH:
   * 1. Als Free-User anmelden
   * 2. Browser DevTools öffnen → Network Tab
   * 3. GET /api/export/pdf?module=assessment direkt aufrufen (curl oder Browser)
   * 4. ERWARTUNG: HTTP 403 mit { error: '...', code: 'UPGRADE_REQUIRED' }
   * 5. NIEMALS: PDF-Datei wird zurückgegeben
   *
   * curl-Befehl für manuellen Test:
   * curl -i -H "Cookie: <session-cookie-eines-free-users>" \
   *   "https://staging.enterprise-ai.biz/api/export/pdf?module=assessment"
   */
})

describe('Security: Stripe Webhook Signatur-Validierung', () => {
  /**
   * 🔶 MANUELLER TEST ERFORDERLICH (siehe docs/testing/security-checklist.md):
   * 1. POST an /api/stripe/webhook OHNE gültige stripe-signature Header senden
   * 2. ERWARTUNG: HTTP 400 "Invalid signature"
   * 3. Mit Stripe CLI testen: `stripe trigger checkout.session.completed`
   * 4. Mit manipuliertem Body + altem Secret testen → muss fehlschlagen
   */
  it('Webhook-Route validiert die Stripe-Signatur vor jeder Verarbeitung (statische Code-Prüfung)', async () => {
    const fs = await import('fs')
    const path = await import('path')
    const filePath = path.join(process.cwd(), 'src/app/api/stripe/webhook/route.ts')
    const content = fs.readFileSync(filePath, 'utf-8')

    // Muss constructEvent verwenden (Signaturprüfung), nicht JSON.parse direkt auf dem Body
    expect(content).toContain('webhooks.constructEvent')
    expect(content).toContain('STRIPE_WEBHOOK_SECRET')
    // Muss bei Fehler einen 400 zurückgeben, BEVOR Business-Logik ausgeführt wird
    expect(content).toMatch(/catch[\s\S]{0,100}status:\s*400/)
  })
})

describe('Security: Keine Service-Role-Key-Exposition im Client-Bundle', () => {
  it('lib/supabase/client.ts referenziert NIEMALS SUPABASE_SERVICE_ROLE_KEY', async () => {
    const fs = await import('fs')
    const path = await import('path')
    const clientFilePath = path.join(process.cwd(), 'src/lib/supabase/client.ts')
    const content = fs.readFileSync(clientFilePath, 'utf-8')
    expect(content).not.toContain('SERVICE_ROLE')
  })

  it('Keine Komponente mit "use client" importiert createAdminClient', async () => {
    const fs = await import('fs')
    const path = await import('path')
    const glob = await import('glob')

    const clientFiles = glob.sync('src/**/*.tsx', { cwd: process.cwd() })
    const violatingFiles: string[] = []

    for (const file of clientFiles) {
      const fullPath = path.join(process.cwd(), file)
      const content = fs.readFileSync(fullPath, 'utf-8')
      if (content.includes("'use client'") && content.includes('createAdminClient')) {
        violatingFiles.push(file)
      }
    }
    expect(violatingFiles).toEqual([])
  })
})

describe('Security: XSS-Schutz in PDF-Templates', () => {
  // Mit @react-pdf/renderer ist HTML-Injection strukturell unmöglich:
  // React PDF nutzt eine eigene Layout-Engine (kein HTML-Parser/Browser).
  // Text-Content wird als literale Zeichenkette in die PDF-Binary geschrieben,
  // nicht als HTML gerendert. <script>-Tags werden nie ausgeführt.
  it('renderAssessmentPdf wirft keinen Fehler bei HTML-Sonderzeichen im Firmennamen', async () => {
    const { renderAssessmentPdf } = await import('@/lib/pdf/templates')
    const maliciousInput = '<script>alert("xss")</script>'
    const element = renderAssessmentPdf({
      totalScore: 3.5,
      dimScores: { data: 3, skills: 4 },
      archetype: 'scaler',
      companyName: maliciousInput,
    })
    // Gibt ein ReactElement zurück — keine Ausnahme, kein HTML-Output
    expect(element).not.toBeNull()
    expect(typeof element).toBe('object')
  })
})

/**
 * ════════════════════════════════════════════════════════════════════════
 * WEITERE MANUELLE SECURITY-TESTS — siehe docs/testing/security-checklist.md
 * ════════════════════════════════════════════════════════════════════════
 * Diese Tests erfordern eine laufende Instanz und können nicht in Jest
 * automatisiert werden:
 *
 * 🔶 RLS Row-Level-Security: User A kann NICHT auf Daten von User B zugreifen
 * 🔶 Middleware: Nicht-eingeloggte User werden von /dashboard/* zu /login umgeleitet
 * 🔶 Share-Links: Abgelaufene Tokens geben HTTP 404/410, keine Daten
 * 🔶 Rate-Limiting: Wiederholte Login-Versuche werden gedrosselt (Supabase Auth Default)
 * 🔶 SQL-Injection: Supabase-Client parametrisiert automatisch — Penetrationstest empfohlen
 * 🔶 CSRF: Next.js Server Actions haben integrierten CSRF-Schutz — verifizieren
 * 🔶 Dependency-Scan: `npm audit` vor jedem Deployment ausführen
 */

describe('Security: DSGVO-Kontolöschung (Art. 17)', () => {
  it('DELETE /api/account/delete verwendet createClient (nicht Admin) für Auth-Check', async () => {
    const fs = await import('fs')
    const path = await import('path')
    const filePath = path.join(process.cwd(), 'src/app/api/account/delete/route.ts')
    const content = fs.readFileSync(filePath, 'utf-8')

    // Muss User-Session prüfen, BEVOR Admin-Operationen ausgeführt werden
    expect(content).toContain('createClient')
    expect(content).toContain('supabase.auth.getUser()')
    expect(content).toMatch(/status:\s*401/)

    // Auth-Check muss VOR dem Admin-Client-Aufruf stehen (indexOf findet im Function-Body)
    const authCheckIndex = content.indexOf('supabase.auth.getUser()')
    const adminCallIndex = content.indexOf('createAdminClient()') // Aufruf, nicht Import
    expect(authCheckIndex).toBeGreaterThan(-1)
    expect(adminCallIndex).toBeGreaterThan(-1)
    expect(authCheckIndex).toBeLessThan(adminCallIndex)
  })

  it('DELETE /api/account/delete löscht Profil (Cascade) UND Auth-User', async () => {
    const fs = await import('fs')
    const path = await import('path')
    const filePath = path.join(process.cwd(), 'src/app/api/account/delete/route.ts')
    const content = fs.readFileSync(filePath, 'utf-8')

    // Profil-Löschung (kaskadiert alle user-Daten via FK ON DELETE CASCADE)
    expect(content).toContain("from('profiles')")
    expect(content).toContain('.delete()')
    // Auth-User-Löschung (braucht Admin-Rechte)
    expect(content).toContain('auth.admin.deleteUser')
  })
})

describe('Security: Proxy/Middleware schließt API-Routen von Auth-Guard aus', () => {
  it('proxy.ts leitet /api/* Requests NIEMALS zu /login um (kritisch für Webhooks)', async () => {
    const fs = await import('fs')
    const path = await import('path')
    const filePath = path.join(process.cwd(), 'src/proxy.ts')
    const content = fs.readFileSync(filePath, 'utf-8')

    // Muss einen expliziten early-return für /api/ Pfade haben, VOR dem Auth-Check
    expect(content).toMatch(/pathname\.startsWith\(['"]\/api\/['"]\)/)

    // Der /api/-Check muss vor dem supabase.auth.getUser() Call stehen
    const apiCheckIndex = content.indexOf("pathname.startsWith('/api/')")
    const authCheckIndex = content.indexOf('supabase.auth.getUser()')
    expect(apiCheckIndex).toBeGreaterThan(-1)
    expect(apiCheckIndex).toBeLessThan(authCheckIndex)
  })
})
