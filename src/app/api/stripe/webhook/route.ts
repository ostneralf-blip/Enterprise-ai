import { NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe/client'
import { deriveTier, safePeriodEnd } from '@/lib/stripe/tier-logic'
import { createAdminClient } from '@/lib/supabase/server'
import { trackServer } from '@/lib/posthog/server'
import type Stripe from 'stripe'

type ProfileRow = { id: string; email: string | null }

async function profileByCustomer(supabase: Awaited<ReturnType<typeof createAdminClient>>, customerId: string): Promise<ProfileRow | null> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase.from('profiles') as any)
    .select('id, email')
    .eq('stripe_customer_id', customerId)
    .single()
  return (data as ProfileRow | null) ?? null
}

async function updateProfile(supabase: Awaited<ReturnType<typeof createAdminClient>>, id: string, patch: Record<string, unknown>) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase.from('profiles') as any).update(patch).eq('id', id)
}

async function markProcessed(supabase: Awaited<ReturnType<typeof createAdminClient>>, eventId: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase.from('processed_stripe_events') as any).insert({ event_id: eventId })
}

async function sendPaymentFailedEmail(userEmail: string) {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey || apiKey === 're_...') return
  try {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from:    'AI Navigator <noreply@enterprise-ai.biz>',
        to:      [userEmail],
        subject: 'Ihre Zahlung konnte nicht verarbeitet werden',
        text: [
          'Hallo,',
          '',
          'leider ist die Zahlung für Ihr AI Navigator Pro-Abonnement fehlgeschlagen.',
          '',
          'Bitte aktualisieren Sie Ihre Zahlungsmethode im Kundenportal, um Ihren Pro-Zugang zu erhalten:',
          'https://enterprise-ai.biz/einstellungen',
          '',
          'Ihr AI Navigator Team',
        ].join('\n'),
      }),
    })
  } catch (err) {
    console.error('[Webhook] Resend-Fehler bei payment_failed:', err)
  }
}

export async function POST(req: Request) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')!

  let event: Stripe.Event
  try {
    event = getStripe().webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const supabase = await createAdminClient()

  // Idempotenz: bereits verarbeitete Events sofort bestätigen ohne erneute Verarbeitung
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: existing } = await (supabase.from('processed_stripe_events') as any)
    .select('event_id')
    .eq('event_id', event.id)
    .maybeSingle()
  if (existing) {
    return NextResponse.json({ received: true })
  }

  switch (event.type) {

    // ── Checkout abgeschlossen ────────────────────────────────────────────────
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      const userId = session.metadata?.userId
      if (!userId) break
      await updateProfile(supabase, userId, {
        stripe_customer_id:      session.customer as string,
        tier:                    'pro',
        subscription_status:     'active',
      })
      void trackServer(userId, 'subscription_activated', { interval: session.metadata?.interval ?? null })
      break
    }

    // ── Abo aktualisiert / gelöscht ───────────────────────────────────────────
    case 'customer.subscription.updated':
    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription
      const profile = await profileByCustomer(supabase, sub.customer as string)
      if (!profile) break
      const periodEnd = safePeriodEnd(sub)
      const { tier, subscription_status } = await deriveTier(sub.status, periodEnd)
      const patch: Record<string, unknown> = { tier, subscription_status }
      if (periodEnd) {
        patch.subscription_period_end = new Date(periodEnd * 1000).toISOString()
      }
      console.info('[webhook]', { event_id: event.id, type: event.type, customer: sub.customer, tier, subscription_status, period_end: patch.subscription_period_end })
      await updateProfile(supabase, profile.id, patch)
      if (event.type === 'customer.subscription.deleted') {
        void trackServer(profile.id, 'subscription_cancelled', { subscription_status })
      }
      break
    }

    // ── Zahlung fehlgeschlagen ────────────────────────────────────────────────
    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice
      const customerId = invoice.customer as string
      const profile = await profileByCustomer(supabase, customerId)
      if (!profile) break
      // Nur Status setzen — Tier-Ableitung inkl. Grace Period erfolgt via subscription.updated,
      // das Stripe parallel sendet und period_end enthält.
      console.info('[webhook]', { event_id: event.id, type: event.type, customer: customerId, subscription_status: 'past_due' })
      await updateProfile(supabase, profile.id, { subscription_status: 'past_due' })
      if (profile.email) await sendPaymentFailedEmail(profile.email)
      void trackServer(profile.id, 'payment_failed', { subscription_status: 'past_due' })
      break
    }

    // ── Zahlung erfolgreich (nach fehlgeschlagenem Versuch) ───────────────────
    case 'invoice.payment_succeeded': {
      const invoice = event.data.object as Stripe.Invoice
      const customerId = invoice.customer as string
      const profile = await profileByCustomer(supabase, customerId)
      if (!profile) break
      await updateProfile(supabase, profile.id, {
        subscription_status: 'active',
        tier:                'pro',
      })
      break
    }
  }

  await markProcessed(supabase, event.id)
  return NextResponse.json({ received: true })
}
