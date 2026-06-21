import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createBillingPortalSession } from '@/lib/stripe/client'

export async function POST() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await supabase
      .from('profiles')
      .select('tier, stripe_customer_id')
      .eq('id', user.id)
      .single() as { data: { tier: string; stripe_customer_id: string | null } | null }

    if (!profile || profile.tier === 'free') {
      return NextResponse.json({ error: 'Nur für Pro/Enterprise verfügbar' }, { status: 403 })
    }
    if (!profile.stripe_customer_id) {
      return NextResponse.json({ error: 'Kein Stripe-Kunde gefunden' }, { status: 400 })
    }

    const returnUrl = `${process.env.NEXT_PUBLIC_APP_URL}/settings`
    const session = await createBillingPortalSession(profile.stripe_customer_id, returnUrl)
    return NextResponse.json({ url: session.url })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
