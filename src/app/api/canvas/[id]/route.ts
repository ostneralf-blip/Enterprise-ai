import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const CanvasUpdateSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  archetype: z.enum(['starter', 'scaler', 'transformer']).nullable().optional(),
  data: z.object({
    problem: z.string(),
    solution: z.string(),
    data_sources: z.string(),
    stakeholders: z.string(),
    kpis: z.string(),
    risks: z.string(),
    architecture: z.string(),
    next_steps: z.string(),
  }).optional(),
  ai_act_assessment: z.record(z.string(), z.unknown()).nullable().optional(),
})

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 })

  const { id } = await params
  const body = await req.json()
  const parsed = CanvasUpdateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Ungültige Daten', details: parsed.error.flatten() }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('canvases')
    .update(parsed.data)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 })

  const { id } = await params
  const { error } = await supabase
    .from('canvases')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return new NextResponse(null, { status: 204 })
}
