import { NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export async function DELETE() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Kaskadierendes DELETE via FK auf profiles — löscht alle user-Daten
  const { error: profileError } = await supabase
    .from('profiles')
    .delete()
    .eq('id', user.id)

  if (profileError) return NextResponse.json({ error: profileError.message }, { status: 500 })

  // Auth-User löschen (braucht Admin-Client, da nur Admins fremde Auth-User löschen können)
  const adminClient = await createAdminClient()
  const { error: authError } = await adminClient.auth.admin.deleteUser(user.id)

  if (authError) return NextResponse.json({ error: authError.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
