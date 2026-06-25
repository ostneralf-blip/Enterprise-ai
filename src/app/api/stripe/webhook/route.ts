import { NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe/client'
import { createAdminClient } from '@/lib/supabase/server'
import type Stripe from 'stripe'

type ProfileRow = { id: string }

async function profileByCustomer(supabase: Awaited<ReturnType<typeof createAdminClient>>, customerId: string): Promise<ProfileRow | null> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase.from('profiles') as any)
    .select('id')
    .eq('stripe_customer_id', customerId)
    .single()
  return (data as ProfileRow | null) ?? null
}

async function updateProfile(supabase: Awaited<ReturnType<typeof createAdminClient>>, id: string, patch: Record<string, unknown>) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase.from('profiles') as any).update(patch).eq('id', id)
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
      break
    }

    // ── Abo aktualisiert / gelöscht ───────────────────────────────────────────
    case 'customer.subscription.updated':
    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription
      const profile = await profileByCustomer(supabase, sub.customer as string)
      if (!profile) break
      const isActive = sub.status === 'active' || sub.status === 'trialing'
      const periodEnd = (sub as unknown as { current_period_end: number }).current_period_end
      await updateProfile(supabase, profile.id, {
        tier:                    isActive ? 'pro' : 'free',
        subscription_status:     sub.status,
        subscription_period_end: new Date(periodEnd * 1000).toISOString(),
      })
      break
    }

    // ── Zahlung fehlgeschlagen ────────────────────────────────────────────────
    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice
      const customerId = invoice.customer as string
      const profile = await profileByCustomer(supabase, customerId)
      if (!profile) break
      await updateProfile(supabase, profile.id, {
        subscription_status: 'past_due',
      })
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

  return NextResponse.json({ received: true })
}
