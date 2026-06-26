import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'
import { calcWeightedScore, deriveQuadrant, DEFAULT_WEIGHTS } from '@/config/usecase-data'
import type { UseCaseWeights } from '@/types'

const UpdateSchema = z.object({
  name: z.string().min(1).max(200),
  domain: z.string().max(100).nullable().optional(),
  description: z.string().max(1000).nullable().optional(),
  scores: z.object({
    value: z.number().int().min(1).max(5),
    feasibility: z.number().int().min(1).max(5),
    data_readiness: z.number().int().min(1).max(5),
    risk: z.number().int().min(1).max(5),
    speed: z.number().int().min(1).max(5),
  }),
  canvas_id: z.string().uuid().nullable().optional(),
})

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    if (!id) return NextResponse.json({ error: 'ID fehlt' }, { status: 400 })

    // Ownership via RLS — verify use case belongs to user's portfolio
    const { data: existing } = await supabase
      .from('use_cases')
      .select('portfolio_id, uc_portfolios!inner(user_id, weights)')
      .eq('id', id)
      .single() as { data: { portfolio_id: string; uc_portfolios: { user_id: string; weights: UseCaseWeights } } | null }

    if (!existing || existing.uc_portfolios.user_id !== user.id) {
      return NextResponse.json({ error: 'Nicht gefunden' }, { status: 404 })
    }

    const body = await req.json()

    // Canvas-Ownership prüfen wenn canvas_id übergeben wird
    if (body.canvas_id) {
      const { data: canvasOwner } = await supabase
        .from('canvases')
        .select('user_id')
        .eq('id', body.canvas_id)
        .single()
      if (!canvasOwner || canvasOwner.user_id !== user.id) {
        return NextResponse.json({ error: 'Canvas nicht gefunden' }, { status: 403 })
      }
    }

    const parse = UpdateSchema.safeParse(body)
    if (!parse.success) return NextResponse.json({ error: 'Ungültige Eingabe' }, { status: 400 })

    const { name, domain, description, scores, canvas_id } = parse.data
    const weights = existing.uc_portfolios.weights ?? DEFAULT_WEIGHTS
    const weighted_score = calcWeightedScore(scores, weights)
    const quadrant = deriveQuadrant(scores)

    const { data, error } = await supabase
      .from('use_cases')
      .update({
        name,
        domain: domain ?? null,
        description: description ?? null,
        scores,
        weighted_score,
        quadrant,
        ...(canvas_id !== undefined ? { canvas_id: canvas_id ?? null } : {}),
      })
      .eq('id', id)
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ data })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    if (!id) return NextResponse.json({ error: 'ID fehlt' }, { status: 400 })

    const { error } = await supabase
      .from('use_cases')
      .delete()
      .eq('id', id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
