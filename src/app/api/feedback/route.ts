import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

const BodySchema = z.object({
  category: z.enum(['bug', 'feature', 'frage', 'sonstiges']),
  message:  z.string().min(1).max(5000),
})

const CATEGORY_LABELS: Record<string, string> = {
  bug:       'Fehler',
  feature:   'Feature-Wunsch',
  frage:     'Frage / Support',
  sonstiges: 'Sonstiges',
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, email')
    .eq('id', user.id)
    .single()

  const body: unknown = await request.json().catch(() => ({}))
  const parsed = BodySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Ungültige Eingabe' }, { status: 400 })
  }

  const { category, message } = parsed.data
  const senderName  = (profile?.full_name as string | null) ?? 'Unbekannt'
  const senderEmail = (profile?.email as string | null) ?? user.email ?? 'unbekannt'
  const categoryLabel = CATEGORY_LABELS[category] ?? category

  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey || apiKey === 're_...') {
    console.info('[Feedback]', { category, senderEmail, message: message.substring(0, 100) })
    return NextResponse.json({ ok: true })
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from:    'AI Navigator <noreply@enterprise-ai.biz>',
        to:      ['ostneralf@freenet.de'],
        subject: `[AI Navigator Feedback] ${categoryLabel} von ${senderName}`,
        text: [
          `Kategorie: ${categoryLabel}`,
          `Von: ${senderName} <${senderEmail}>`,
          '',
          message,
        ].join('\n'),
      }),
    })
    if (!res.ok) console.error('[Feedback] Resend-Fehler:', await res.text())
  } catch (err) {
    console.error('[Feedback] Netzwerkfehler:', err)
  }

  return NextResponse.json({ ok: true })
}
