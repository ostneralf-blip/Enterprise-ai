import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AdminPageClient } from './AdminPageClient'
import type { ContentLibraryEntry } from '@/types'

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

  const { data: entries } = await supabase
    .from('content_library')
    .select('*')
    .order('module', { ascending: true })
    .order('created_at', { ascending: false })

  return (
    <AdminPageClient initialEntries={(entries ?? []) as ContentLibraryEntry[]} />
  )
}
