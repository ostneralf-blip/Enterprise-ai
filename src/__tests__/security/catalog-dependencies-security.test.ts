/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server'

jest.mock('@/lib/utils/admin-check', () => ({
  requireAdmin: jest.fn(),
}))
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(),
}))

import { requireAdmin } from '@/lib/utils/admin-check'
import { createClient } from '@/lib/supabase/server'
import { PATCH } from '@/app/api/admin/catalog/components/[id]/route'

const mockRequireAdmin = requireAdmin as jest.Mock
const mockCreateClient = createClient as jest.Mock

describe('PATCH /api/admin/catalog/components/[id] — Sicherheit', () => {
  beforeEach(() => jest.clearAllMocks())

  it('gibt 403 zurück wenn kein Admin', async () => {
    mockRequireAdmin.mockRejectedValue(new Error('Forbidden'))
    const req = new NextRequest('http://localhost/api/admin/catalog/components/abc', {
      method: 'PATCH',
      body: JSON.stringify({ incompatible_with: ['vLLM'] }),
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await PATCH(req, { params: Promise.resolve({ id: 'abc' }) })
    expect(res.status).toBe(403)
  })

  it('akzeptiert incompatible_with, requires, suggests als Arrays', async () => {
    mockRequireAdmin.mockResolvedValue(undefined)
    const mockUpdate = jest.fn().mockReturnValue({
      eq: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({ data: { id: 'abc' }, error: null }),
        }),
      }),
    })
    mockCreateClient.mockResolvedValue({ from: jest.fn().mockReturnValue({ update: mockUpdate }) })

    const req = new NextRequest('http://localhost/api/admin/catalog/components/abc', {
      method: 'PATCH',
      body: JSON.stringify({ incompatible_with: ['vLLM'], requires: ['SAP BTP'], suggests: ['SAP GenAI Hub'] }),
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await PATCH(req, { params: Promise.resolve({ id: 'abc' }) })
    expect(res.status).toBe(200)
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        incompatible_with: ['vLLM'],
        requires: ['SAP BTP'],
        suggests: ['SAP GenAI Hub'],
      })
    )
  })

  it('lehnt nicht-Array-Werte für incompatible_with ab', async () => {
    mockRequireAdmin.mockResolvedValue(undefined)
    const req = new NextRequest('http://localhost/api/admin/catalog/components/abc', {
      method: 'PATCH',
      body: JSON.stringify({ incompatible_with: 'vLLM' }),
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await PATCH(req, { params: Promise.resolve({ id: 'abc' }) })
    expect(res.status).toBe(400)
  })

  it('lehnt leeren Body ab (kein Feld vorhanden)', async () => {
    mockRequireAdmin.mockResolvedValue(undefined)
    const req = new NextRequest('http://localhost/api/admin/catalog/components/abc', {
      method: 'PATCH',
      body: JSON.stringify({}),
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await PATCH(req, { params: Promise.resolve({ id: 'abc' }) })
    expect(res.status).toBe(400)
    const body = await res.json() as { error?: string }
    expect(body.error).toContain('Mindestens ein Feld')
  })
})
