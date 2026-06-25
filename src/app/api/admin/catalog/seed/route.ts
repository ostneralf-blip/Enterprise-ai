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

  const [compResult, roleResult] = await Promise.all([
    supabase
      .from('component_catalog')
      .upsert(
        SEED_COMPONENTS.map(c => ({ ...c, source: 'manual', is_active: true })),
        { onConflict: 'name,vendor', ignoreDuplicates: false }
      )
      .select('id'),
    supabase
      .from('roles_catalog')
      .upsert(
        SEED_ROLES.map(r => ({ ...r, is_active: true })),
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

  return NextResponse.json({
    data: {
      components_upserted: compResult.data?.length ?? 0,
      roles_upserted: roleResult.data?.length ?? 0,
    }
  })
}
