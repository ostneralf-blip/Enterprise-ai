import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? 'sk_build_placeholder', {
  apiVersion: '2026-05-27.dahlia',
  typescript: true,
})

export async function createCheckoutSession({
  userId,
  email,
  priceId,
  successUrl,
  cancelUrl,
}: {
  userId: string
  email: string
  priceId: string
  successUrl: string
  cancelUrl: string
}) {
  return stripe.checkout.sessions.create({
    mode: 'subscription',
    customer_email: email,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: { userId },
    tax_id_collection: { enabled: true },
    automatic_tax: { enabled: true },
    allow_promotion_codes: true,
    locale: 'de',
  })
}

export async function createBillingPortalSession(customerId: string, returnUrl: string) {
  return stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  })
}
