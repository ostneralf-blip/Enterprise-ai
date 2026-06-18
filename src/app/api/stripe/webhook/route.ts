import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe/client'
import { createAdminClient } from '@/lib/supabase/server'
import type Stripe from 'stripe'

export async function POST(req: Request) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')!

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const supabase = await createAdminClient()

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      const userId = session.metadata?.userId
      if (!userId) break
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from('profiles') as any)
        .update({ stripe_customer_id: session.customer as string, tier: 'pro' })
        .eq('id', userId)
      break
    }
    case 'customer.subscription.updated':
    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription
      const customerId = sub.customer as string
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: profile } = await (supabase.from('profiles') as any)
        .select('id').eq('stripe_customer_id', customerId).single()
      if (profile) {
        const isActive = sub.status === 'active' || sub.status === 'trialing'
        const periodEnd = (sub as unknown as { current_period_end: number }).current_period_end
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase.from('profiles') as any).update({
          tier: isActive ? 'pro' : 'free',
          subscription_status: sub.status,
          subscription_period_end: new Date(periodEnd * 1000).toISOString(),
        }).eq('id', (profile as { id: string }).id)
      }
      break
    }
  }
  return NextResponse.json({ received: true })
}
