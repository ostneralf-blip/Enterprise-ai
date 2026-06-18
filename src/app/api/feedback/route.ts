import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const feedbackSchema = z.object({
  module: z.string(),
  sentiment: z.enum(['positive', 'negative']),
  comment: z.string().max(500).optional(),
})

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const parsed = feedbackSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 })

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from('feedback') as any).insert({
      user_id: user?.id ?? null,
      module: parsed.data.module,
      sentiment: parsed.data.sentiment,
      comment: parsed.data.comment ?? null,
    })

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
