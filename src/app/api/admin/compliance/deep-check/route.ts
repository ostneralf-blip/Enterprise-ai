import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAdmin } from '@/lib/utils/admin-check'
import { runDeepCheck } from '@/lib/compliance/deep-check'

// Manueller Fakten-Abgleich einer Regularie (#250). Bewusst pro Regularie (bounded:
// max. ~8 Punkte je Lauf → passt in maxDuration; Test-Gate „Teilmenge zuerst").
// Automatisierung (Cron) bewusst später — mit Daniel abgestimmt.
export const maxDuration = 300

const BodySchema = z.object({ slug: z.string().min(1).max(50) })

export async function POST(req: Request) {
  try { await requireAdmin() } catch {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const body = await req.json().catch(() => null)
  const parsed = BodySchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'slug erforderlich' }, { status: 422 })

  const result = await runDeepCheck(parsed.data.slug)
  return NextResponse.json({ result })
}
