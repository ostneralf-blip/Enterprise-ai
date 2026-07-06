import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createCheckoutSession } from '@/lib/stripe/client'
import { z } from 'zod'

const schema = z.object({ interval: z.enum(['monthly', 'yearly']) })

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { interval } = schema.parse(body)

    const priceId = interval === 'yearly'
      ? process.env.STRIPE_PRO_YEARLY_PRICE_ID!
      : process.env.STRIPE_PRO_MONTHLY_PRICE_ID!

    const appUrl = process.env.NEXT_PUBLIC_APP_URL!
    const session = await createCheckoutSession({
      userId: user.id,
      email: user.email!,
      priceId,
      successUrl: `${appUrl}/dashboard?upgrade=success`,
      cancelUrl: `${appUrl}/upgrade`,
    })

    return NextResponse.json({ url: session.url })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[Stripe Checkout]', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
