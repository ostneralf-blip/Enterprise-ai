import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/layout/Sidebar'
import { TopBar } from '@/components/layout/TopBar'
import { BfcacheGuard } from '@/components/shared/BfcacheGuard'
import { MobileNavProvider } from '@/components/layout/MobileNavContext'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (profile?.is_banned) redirect('/login?message=account_suspended')

  return (
    <MobileNavProvider>
      {/* h-[100dvh] statt h-screen: verhindert iOS-Safari-Modal-Effekt (dynamische Viewport-Höhe) */}
      <div className="flex h-[100dvh] overflow-hidden bg-slate-50">
        <BfcacheGuard />
        <Sidebar profile={profile} />
        <div className="flex flex-col flex-1 overflow-hidden min-w-0">
          <TopBar profile={profile} />
          <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
            <div className="max-w-6xl mx-auto">
              {children}
            </div>
          </main>
        </div>
      </div>
    </MobileNavProvider>
  )
}
