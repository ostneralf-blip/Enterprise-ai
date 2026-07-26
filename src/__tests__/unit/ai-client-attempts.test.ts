import { z } from 'zod'

// #256: Sichert das Timeout-/Versuchs-Verhalten von callLLM ab. Die schweren
// Architektur-Narrative-Sektionen sollen nur EINEN Bedrock-Versuch mit größerem
// Timeout machen (maxBedrockAttempts: 1) statt zwei kurzer — ein Retry mit
// demselben Budget half bei legitim langen Antworten nachweislich nicht.

const sendMock = jest.fn()

jest.mock('server-only', () => ({}))
jest.mock('@aws-sdk/client-bedrock-runtime', () => ({
  BedrockRuntimeClient: jest.fn().mockImplementation(() => ({ send: sendMock })),
  InvokeModelCommand: jest.fn().mockImplementation((args: unknown) => args),
}))
jest.mock('@sentry/nextjs', () => ({ captureException: jest.fn(), captureMessage: jest.fn() }))
jest.mock('@/lib/supabase/server', () => ({
  createAdminClient: jest.fn().mockResolvedValue({
    from: () => ({
      select: () => ({ eq: () => ({ gt: () => ({ maybeSingle: async () => ({ data: null }) }) }) }),
      upsert: async () => ({}),
    }),
    rpc: async () => ({}),
  }),
}))
jest.mock('@/lib/app-settings', () => ({
  getBedrockModelId: async () => 'model-x',
  getDirectFallbackModelId: async () => 'direct-x',
  getFallbackEnabled: async () => false,
  getFallbackEnabledAt: async () => null,
}))

const schema = z.object({ x: z.string() })
const abortError = () => Object.assign(new Error('Request aborted'), { name: 'AbortError' })

describe('callLLM Bedrock-Versuche (#256)', () => {
  beforeEach(() => {
    jest.resetModules()
    sendMock.mockReset()
    process.env.AWS_BEDROCK_ACCESS_KEY_ID = 'test-key'
    process.env.AWS_BEDROCK_SECRET_ACCESS_KEY = 'test-secret'
    delete process.env.ANTHROPIC_API_KEY
    delete process.env.ALLOW_NON_EU_AI_FALLBACK
  })

  it('macht bei maxBedrockAttempts:1 trotz Timeout nur EINEN Versuch', async () => {
    sendMock.mockRejectedValue(abortError())
    const { callLLM } = await import('@/lib/ai/client')
    const res = await callLLM('prompt', schema, { maxBedrockAttempts: 1, timeoutMs: 100 })
    expect(sendMock).toHaveBeenCalledTimes(1)
    expect(res.data).toBeNull()
    expect(res.errorCode).toBe('Timeout')
  })

  it('macht im Default bei Timeout einen Retry (zwei Versuche)', async () => {
    sendMock.mockRejectedValue(abortError())
    const { callLLM } = await import('@/lib/ai/client')
    const res = await callLLM('prompt', schema, { timeoutMs: 100 })
    expect(sendMock).toHaveBeenCalledTimes(2)
    expect(res.data).toBeNull()
    expect(res.errorCode).toBe('Timeout')
  })
})
