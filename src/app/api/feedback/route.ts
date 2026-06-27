import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

// Vollständiges Feedback-Formular (Feedback-Seite)
const FormSchema = z.object({
  category: z.enum(['bug', 'feature', 'frage', 'sonstiges']),
  message:  z.string().min(1).max(5000),
})

// Quick-Widget (Daumen hoch/runter in Modul-Ergebnissen)
const WidgetSchema = z.object({
  module:    z.string().min(1).max(50),
  sentiment: z.enum(['positive', 'negative']),
  comment:   z.string().max(2000).optional(),
})

const CATEGORY_LABELS: Record<string, string> = {
  bug:       'Fehler',
  feature:   'Feature-Wunsch',
  frage:     'Frage / Support',
  sonstiges: 'Sonstiges',
}

function normalizeBody(body: unknown): { category: string; message: string; categoryLabel: string } | null {
  const form = FormSchema.safeParse(body)
  if (form.success) {
    return {
      category: form.data.category,
      message: form.data.message,
      categoryLabel: CATEGORY_LABELS[form.data.category] ?? form.data.category,
    }
  }
  const widget = WidgetSchema.safeParse(body)
  if (widget.success) {
    const { module, sentiment, comment } = widget.data
    const emoji = sentiment === 'positive' ? '👍' : '👎'
    const label = sentiment === 'positive' ? 'Positives Feedback' : 'Verbesserungsbedarf'
    const text = comment ? `${emoji} ${label}\n\n${comment}` : `${emoji} ${label}`
    return {
      category: 'sonstiges',
      message: `[Modul: ${module}] ${text}`,
      categoryLabel: `Widget-Feedback (${module})`,
    }
  }
  return null
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
  const normalized = normalizeBody(body)
  if (!normalized) {
    return NextResponse.json({ error: 'Ungültige Eingabe' }, { status: 400 })
  }

  const { message, categoryLabel } = normalized
  const senderName  = (profile?.full_name as string | null) ?? 'Unbekannt'
  const senderEmail = (profile?.email as string | null) ?? user.email ?? 'unbekannt'

  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey || apiKey === 're_...') {
    console.info('[Feedback]', { categoryLabel, senderEmail, message: message.substring(0, 100) })
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
