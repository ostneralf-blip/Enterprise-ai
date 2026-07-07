import { readFileSync } from 'fs'
import { join } from 'path'

const source = readFileSync(
  join(process.cwd(), 'src/app/api/stripe/webhook/route.ts'),
  'utf-8'
)

describe('Security: POST /api/stripe/webhook', () => {
  it('prüft Stripe-Signatur mit constructEvent', () => {
    expect(source).toContain('webhooks.constructEvent')
  })

  it('gibt 400 zurück bei ungültiger Signatur', () => {
    expect(source).toContain("{ status: 400 }")
  })

  it('liest Webhook-Secret aus Env-Variable (nie hardcodiert)', () => {
    expect(source).toContain('process.env.STRIPE_WEBHOOK_SECRET')
    expect(source).not.toMatch(/whsec_[A-Za-z0-9]+/)
  })

  it('implementiert Idempotenz-Check vor der Verarbeitung', () => {
    expect(source).toContain('processed_stripe_events')
    expect(source).toContain('event.id')
  })

  it('markiert Events nach Verarbeitung als processed', () => {
    expect(source).toContain('markProcessed')
  })

  it('sendet E-Mail bei invoice.payment_failed', () => {
    expect(source).toContain("'invoice.payment_failed'")
    expect(source).toContain('sendPaymentFailedEmail')
  })

  it('sendet E-Mail nur wenn profile.email vorhanden', () => {
    expect(source).toContain('profile.email')
    expect(source).toContain('await sendPaymentFailedEmail(profile.email)')
  })

  it('gibt RESEND_API_KEY nie an Client weiter (kein NEXT_PUBLIC_)', () => {
    expect(source).not.toContain('NEXT_PUBLIC_RESEND')
  })
})
