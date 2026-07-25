import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { z } from 'zod'

const Schema = z.object({
  email: z.string().email(),
  captchaToken: z.string().optional(),
})

// Eigener Passwort-Reset-Versand: erzeugt den Recovery-Link über die Admin-API
// (sauberer token_hash, KEIN PKCE) und schickt ihn via Resend. Damit ist der Reset
// unabhängig von Supabase-Templates + PKCE-code_verifier (Incident 25.07.2026).
// Gibt IMMER 200 zurück (kein Enumeration-Leak).
export async function POST(req: Request) {
  const body = await req.json().catch(() => null)
  const parsed = Schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ success: true })
  const { email, captchaToken } = parsed.data

  // Optionale hCaptcha-Prüfung (nur wenn Secret gesetzt) — degradiert sauber.
  const secret = process.env.HCAPTCHA_SECRET
  if (secret && captchaToken) {
    try {
      const res = await fetch('https://api.hcaptcha.com/siteverify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ secret, response: captchaToken }),
      })
      const json = (await res.json()) as { success?: boolean }
      if (!json.success) return NextResponse.json({ success: true }) // still 200
    } catch { /* Captcha-Dienst nicht erreichbar → nicht blockieren */ }
  }

  const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? 'https://enterprise-ai.biz').replace(/\/+$/, '')
  try {
    const admin = await createAdminClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (admin.auth.admin as any).generateLink({ type: 'recovery', email })
    if (error || !data) return NextResponse.json({ success: true })
    const hashed = (data.properties as { hashed_token?: string } | undefined)?.hashed_token
    if (!hashed) return NextResponse.json({ success: true })
    const link = `${appUrl}/reset-password?token_hash=${hashed}&type=recovery`
    await sendResetEmail(email, link)
  } catch (err) {
    console.error('[reset-request] Fehler:', err)
  }
  return NextResponse.json({ success: true })
}

async function sendResetEmail(to: string, link: string) {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey || apiKey === 're_...') return
  const html = [
    '<div style="font-family:Arial,sans-serif;font-size:15px;color:#0F172A;line-height:1.6">',
    '<h2 style="color:#1D4ED8">Passwort zurücksetzen</h2>',
    '<p>Sie haben angefordert, Ihr Passwort für Ihr AI-Navigator-Konto zurückzusetzen.</p>',
    `<p><a href="${link}" style="display:inline-block;background:#1D4ED8;color:#fff;text-decoration:none;padding:10px 18px;border-radius:8px">Neues Passwort festlegen</a></p>`,
    '<p style="color:#64748B;font-size:13px">Falls Sie diese Anfrage nicht gestellt haben, können Sie diese E-Mail ignorieren. Der Link ist zeitlich begrenzt gültig.</p>',
    '</div>',
  ].join('')
  try {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'AI Navigator <noreply@enterprise-ai.biz>',
        to: [to],
        subject: 'Passwort zurücksetzen — AI Navigator',
        html,
      }),
    })
  } catch (err) {
    console.error('[reset-request] Resend-Fehler:', err)
  }
}
