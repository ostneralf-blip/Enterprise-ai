import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/utils/admin-check'
import { SEED_COMPONENTS, SEED_ROLES } from '@/config/catalog-seed'

export async function POST() {
  try {
    await requireAdmin()
  } catch {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const supabase = await createClient()

  // Fetch current catalog as backup before overwriting
  const { data: backupData } = await supabase.from('component_catalog').select('*')

  // Deduplicate seed data by lower(trim(name)) — entspricht dem DB-Unique-Index auf name_key
  const compMap = new Map<string, typeof SEED_COMPONENTS[0]>()
  for (const c of SEED_COMPONENTS) compMap.set(c.name.toLowerCase().trim(), c)
  const dedupedComponents = Array.from(compMap.values())

  const roleMap = new Map<string, typeof SEED_ROLES[0]>()
  for (const r of SEED_ROLES) roleMap.set(r.role_name, r)
  const dedupedRoles = Array.from(roleMap.values())

  const [compResult, roleResult] = await Promise.all([
    supabase
      .from('component_catalog')
      .upsert(
        dedupedComponents.map(c => ({
          ...c,
          suggests: c.suggests ?? [],
          incompatible_with: c.incompatible_with ?? [],
          source: 'manual',
          is_active: true,
        })),
        { onConflict: 'name_key', ignoreDuplicates: false }
      )
      .select('id'),
    supabase
      .from('roles_catalog')
      .upsert(
        dedupedRoles.map(r => ({ ...r, is_active: true })),
        { onConflict: 'role_name', ignoreDuplicates: false }
      )
      .select('id'),
  ])

  if (compResult.error) {
    return NextResponse.json({ error: `components: ${compResult.error.message}` }, { status: 500 })
  }
  if (roleResult.error) {
    return NextResponse.json({ error: `roles: ${roleResult.error.message}` }, { status: 500 })
  }

  const { data: { user } } = await supabase.auth.getUser()
  await supabase.from('catalog_upload_log').insert({
    user_id: user?.id ?? null,
    filename: 'catalog-seed.ts',
    format: 'Seed-Daten',
    row_count: compResult.data?.length ?? 0,
    vendor_override: null,
    layer_override: null,
    source: 'seed',
    snapshot: dedupedComponents,
  })

  return NextResponse.json({
    data: {
      components_upserted: compResult.data?.length ?? 0,
      roles_upserted: roleResult.data?.length ?? 0,
      backup_count: backupData?.length ?? 0,
      backup_data: backupData ?? [],
    }
  })
}
