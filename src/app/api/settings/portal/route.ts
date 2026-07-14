import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireFeature } from '@/lib/utils/tier-check'
import { createBillingPortalSession } from '@/lib/stripe/client'

export async function POST() {
  try {
    const gate = await requireFeature('billing_portal')
    if (gate instanceof NextResponse) return gate
    const { userId } = gate

    const supabase = await createClient()
    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', userId)
      .single() as { data: { stripe_customer_id: string | null } | null }

    if (!profile?.stripe_customer_id) {
      return NextResponse.json({ error: 'Kein Stripe-Kunde gefunden' }, { status: 400 })
    }

    const returnUrl = `${process.env.NEXT_PUBLIC_APP_URL}/settings`
    const session = await createBillingPortalSession(profile.stripe_customer_id, returnUrl)
    return NextResponse.json({ url: session.url })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
