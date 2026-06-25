import { redirect } from 'next/navigation'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { AdminPageClient } from './AdminPageClient'
import type { ContentLibraryEntry, UserProfile, CatalogComponent } from '@/types'

export const dynamic = 'force-dynamic'

export default async function AdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (!profile?.is_admin) redirect('/dashboard')

  // Service-role client bypasses RLS to load all user profiles
  const adminClient = await createAdminClient()
  const [{ data: entries }, { data: users }, { data: components }, { count: componentCount }] = await Promise.all([
    adminClient
      .from('content_library')
      .select('*')
      .order('module', { ascending: true })
      .order('created_at', { ascending: false }),
    adminClient
      .from('profiles')
      .select('id, email, full_name, company, tier, is_admin, is_banned, feature_flags, created_at')
      .order('created_at', { ascending: false }),
    adminClient
      .from('component_catalog')
      .select('*')
      .eq('is_active', true)
      .order('name', { ascending: true })
      .limit(100),
    adminClient
      .from('component_catalog')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true),
  ])

  return (
    <AdminPageClient
      initialEntries={(entries ?? []) as ContentLibraryEntry[]}
      initialUsers={(users ?? []) as UserProfile[]}
      initialComponents={(components ?? []) as CatalogComponent[]}
      componentCount={componentCount ?? 0}
    />
  )
}
