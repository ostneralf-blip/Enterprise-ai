import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: { flowType: 'pkce' },
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {}
        },
      },
    }
  )
}

/**
 * Wählt den Supabase-Secret-Key für den Admin-Client (RLS-Bypass).
 *
 * Hintergrund (Incident 24.07.2026): Supabase hat auf das neue Key-System
 * (`sb_secret_…`) umgestellt; die alten JWT-basierten `service_role`-Keys sind
 * bei umgestellten Projekten deaktiviert. Je nach Umgebung liegt der neue Key
 * mal in `SUPABASE_SECRET_KEY` (von der Vercel/Supabase-Integration angelegt),
 * mal in `SUPABASE_SERVICE_ROLE_KEY` (lokale `.env`). Ein deaktivierter alter
 * JWT führte dazu, dass Stripe-Webhook-Schreibzugriffe still fehlschlugen.
 *
 * Strategie: den Wert im NEUEN Format (`sb_…`) bevorzugen, egal in welcher der
 * beiden Variablen er steht — der alte JWT wird ignoriert, solange irgendeine
 * Variable den neuen Key enthält.
 */
function resolveServiceKey(): string {
  const secret = process.env.SUPABASE_SECRET_KEY
  const legacy = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (secret?.startsWith('sb_')) return secret
  if (legacy?.startsWith('sb_')) return legacy
  const fallback = secret ?? legacy
  if (!fallback) throw new Error('Kein Supabase-Secret-Key gesetzt (SUPABASE_SECRET_KEY / SUPABASE_SERVICE_ROLE_KEY)')
  return fallback
}

export async function createAdminClient() {
  const { createClient } = await import('@supabase/supabase-js')
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    resolveServiceKey(),
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}
