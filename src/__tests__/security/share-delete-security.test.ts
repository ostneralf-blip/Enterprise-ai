import { readFileSync } from 'fs'
import { join } from 'path'

const route = readFileSync(join(process.cwd(), 'src/app/api/share/route.ts'), 'utf-8')

describe('Security: Share DELETE (#Geteilte Links)', () => {
  it('exportiert einen DELETE-Handler', () => {
    expect(route).toMatch(/export async function DELETE/)
  })
  it('prüft Auth (401) und scoped auf user_id', () => {
    const del = route.slice(route.indexOf('export async function DELETE'))
    expect(del).toContain('auth.getUser()')
    expect(del).toContain("status: 401")
    expect(del).toContain(".eq('user_id', user.id)")
  })
  it('validiert die id als UUID (Zod)', () => {
    const del = route.slice(route.indexOf('export async function DELETE'))
    expect(del).toMatch(/uuid\(\)/)
  })
})
