import { NextResponse } from 'next/server'
import { getPublicPricing, type PricingData } from '@/lib/pricing'

export type { PricingData }

export async function GET() {
  const result = await getPublicPricing()
  return NextResponse.json(result)
}
