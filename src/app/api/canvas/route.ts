import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { EMPTY_CANVAS_DATA } from '@/config/canvas-data'
import { getTier } from '@/lib/utils/tier-check'
import { enforceSaveQuota } from '@/lib/tier/save-quota'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 })

  const { data, error } = await supabase
    .from('canvases')
    .select('*')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data: data ?? [] })
}

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 })

  // Free-Tageslimit fürs Anlegen eines neuen Canvas (Issue #222). Bearbeiten (PATCH) zählt nicht.
  const limited = await enforceSaveQuota(user.id, await getTier(user.id), 'canvas')
  if (limited) return limited

  const { data, error } = await supabase
    .from('canvases')
    .insert({ user_id: user.id, title: 'Neuer Use Case', data: EMPTY_CANVAS_DATA })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data }, { status: 201 })
}
