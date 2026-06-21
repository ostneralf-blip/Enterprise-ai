import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { CanvasPageClient } from './CanvasPageClient'
import type { Metadata } from 'next'
import type { Canvas, Tier } from '@/types'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'AI Use-Case Canvas' }

export default async function CanvasPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: rawCanvases }, { data: profileData }] = await Promise.all([
    supabase
      .from('canvases')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false }) as unknown as Promise<{ data: Omit<Canvas, 'version_no'>[] | null }>,
    supabase
      .from('profiles')
      .select('tier')
      .eq('id', user.id)
      .single() as unknown as Promise<{ data: { tier: string } | null }>,
  ])

  const canvases: Canvas[] = (rawCanvases ?? []).map(c => ({ ...c, version_no: 0 }))
  const tier = (profileData?.tier ?? 'free') as Tier

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl sm:text-2xl font-semibold text-slate-900">AI Use-Case Canvas</h1>
        <p className="text-slate-500 text-sm mt-1">
          8 Felder · Vollständiges Template · Problem bis nächste Schritte
        </p>
      </div>
      <CanvasPageClient initialCanvases={canvases} tier={tier} />
    </div>
  )
}
