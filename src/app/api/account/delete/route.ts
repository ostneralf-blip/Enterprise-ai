import { NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { archiveUserData } from '@/lib/account/archive-user-data'

export async function DELETE() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const adminClient = await createAdminClient()

  // #261: Inhaltliche Daten (Use Cases, Architekturen) anonym in die historischen
  // Tabellen archivieren, BEVOR gelöscht wird. Best-effort — ein Archivierungs-
  // fehler darf das Recht auf Löschung (DSGVO Art. 17) niemals blockieren, daher
  // gefangen + an Sentry gemeldet, aber ohne die Löschung abzubrechen.
  try {
    await archiveUserData(adminClient, user.id)
  } catch (err) {
    Sentry.captureException(err, { tags: { module: 'account', feature: 'delete-archive' } })
  }

  // Kaskadierendes DELETE via FK auf profiles — löscht alle user-Daten
  const { error: profileError } = await supabase
    .from('profiles')
    .delete()
    .eq('id', user.id)

  if (profileError) return NextResponse.json({ error: profileError.message }, { status: 500 })

  // Auth-User löschen (braucht Admin-Client, da nur Admins fremde Auth-User löschen können)
  const { error: authError } = await adminClient.auth.admin.deleteUser(user.id)

  if (authError) return NextResponse.json({ error: authError.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
