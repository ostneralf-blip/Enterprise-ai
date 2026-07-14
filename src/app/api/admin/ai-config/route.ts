import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/utils/admin-check'

export async function GET() {
  try { await requireAdmin() } catch {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  return NextResponse.json({
    hasAnthropicKey: !!process.env.ANTHROPIC_API_KEY,
    hasBedrockKeys:  !!(process.env.AWS_BEDROCK_ACCESS_KEY_ID && process.env.AWS_BEDROCK_SECRET_ACCESS_KEY),
    bedrockRegion:   process.env.BEDROCK_REGION ?? 'eu-west-1',
  })
}
