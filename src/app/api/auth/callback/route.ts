import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      // Neue Nutzer (v. a. via OAuth) haben ein leeres Profil — der handle_new_user-
      // Trigger legt nur id + email an. Vor dem Dashboard erst in die Einstellungen
      // zum Ausfüllen leiten. Nur beim Standard-Ziel /dashboard (nicht z. B. bei
      // Passwort-Reset, das ein eigenes `next` setzt).
      const user = data.user
      if (next === '/dashboard' && user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, company')
          .eq('id', user.id)
          .single()

        // Zustand VOR einer evtl. Namensübernahme: ist das Profil noch leer?
        const profileEmpty = !profile?.full_name?.trim() && !profile?.company?.trim()

        // Google/OAuth liefert meist einen Namen im user_metadata — ins leere Profil
        // übernehmen, damit die Einstellungen ihn bereits vorausgefüllt zeigen.
        const meta = user.user_metadata as { full_name?: string; name?: string } | null
        const oauthName = meta?.full_name || meta?.name
        if (oauthName && !profile?.full_name?.trim()) {
          await supabase.from('profiles').update({ full_name: oauthName }).eq('id', user.id)
        }

        if (profileEmpty) {
          return NextResponse.redirect(`${origin}/settings?welcome=1`)
        }
      }
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/login?message=Authentifizierung fehlgeschlagen`)
}
