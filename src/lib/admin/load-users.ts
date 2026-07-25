import 'server-only'
import type { createAdminClient } from '@/lib/supabase/server'

type AdminClient = Awaited<ReturnType<typeof createAdminClient>>

const PAGE_SIZE = 1000
const PROFILE_COLUMNS =
  'id, email, full_name, company, role, tier, stripe_customer_id, stripe_subscription_id, subscription_status, subscription_period_end, is_admin, is_banned, feature_flags, created_at'

/**
 * Lädt alle Profile (paginiert — profiles wächst über api.max_rows=1000 hinaus,
 * siehe Lektion 19.07.2026) und mergt die Anmelde-Daten aus auth.users
 * (letzter Login, Bestätigungsstatus, Provider). Auth-Merge-Fehler sind nicht
 * fatal — die Profil-Liste bleibt nutzbar.
 */
export async function loadUsersWithAuth(adminClient: AdminClient): Promise<Record<string, unknown>[]> {
  const users: Record<string, unknown>[] = []
  for (let page = 0; ; page++) {
    const from = page * PAGE_SIZE
    const { data, error } = await adminClient
      .from('profiles')
      .select(PROFILE_COLUMNS)
      .order('created_at', { ascending: false })
      .range(from, from + PAGE_SIZE - 1)
    if (error) throw new Error(error.message)
    users.push(...(data ?? []))
    if (!data || data.length < PAGE_SIZE) break
  }

  try {
    const authInfo = new Map<string, { last_sign_in_at: string | null; email_confirmed_at: string | null; auth_provider: string | null }>()
    for (let page = 1; ; page++) {
      const { data, error } = await adminClient.auth.admin.listUsers({ page, perPage: PAGE_SIZE })
      if (error) break
      for (const au of data.users) {
        authInfo.set(au.id, {
          last_sign_in_at: au.last_sign_in_at ?? null,
          email_confirmed_at: au.email_confirmed_at ?? null,
          auth_provider: (au.app_metadata as { provider?: string } | undefined)?.provider ?? null,
        })
      }
      if (data.users.length < PAGE_SIZE) break
    }
    for (const u of users) {
      const info = authInfo.get(u.id as string)
      if (info) Object.assign(u, info)
    }
  } catch {
    /* Anmelde-Daten optional */
  }

  return users
}
