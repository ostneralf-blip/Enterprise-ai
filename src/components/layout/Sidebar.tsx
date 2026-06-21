'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { MODULES } from '@/config/modules'
import type { UserProfile } from '@/types'
import { useMobileNav } from './MobileNavContext'

interface SidebarProps {
  profile: UserProfile | null
}

export function Sidebar({ profile }: SidebarProps) {
  const pathname = usePathname()
  const tier = profile?.tier ?? 'free'
  const { isOpen, close } = useMobileNav()

  const content = (
    <>
      {/* Logo */}
      <div className="px-6 py-5 border-b border-slate-700 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center text-sm font-bold">N</div>
          <div>
            <div className="font-semibold text-sm tracking-wide">AI Navigator</div>
            <div className="text-xs text-slate-400">enterprise-ai.biz</div>
          </div>
        </div>
        <button onClick={close} aria-label="Menü schließen"
          className="lg:hidden text-slate-400 hover:text-white p-1 -mr-1">
          ✕
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <NavItem href="/dashboard" icon="⊞" label="Dashboard" active={pathname === '/dashboard'} onNavigate={close} />

        <div className="pt-4 pb-1 px-3">
          <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Tools</span>
        </div>

        {MODULES.map(mod => {
          const isLocked = mod.requiredTier !== 'free' && tier === 'free'
          return (
            <NavItem
              key={mod.id}
              href={`/${mod.id}`}
              icon={mod.icon}
              label={mod.title}
              active={pathname.startsWith(`/${mod.id}`)}
              locked={isLocked}
              onNavigate={close}
            />
          )
        })}

        <div className="pt-4 pb-1 px-3">
          <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Konto</span>
        </div>
        <NavItem href="/settings" icon="⚙" label="Einstellungen" active={pathname === '/settings'} onNavigate={close} />
        {profile?.is_admin && (
          <NavItem href="/admin" icon="🛡" label="Admin" active={pathname.startsWith('/admin')} onNavigate={close} />
        )}
      </nav>

      {/* Tier Badge */}
      {tier === 'free' && (
        <div className="p-4 border-t border-slate-700">
          <div className="bg-blue-600/20 border border-blue-500/30 rounded-lg p-3">
            <div className="text-xs font-semibold text-blue-400 mb-1">Explorer Plan</div>
            <div className="text-xs text-slate-400 mb-2">PDF-Export, Speichern und mehr mit Pro</div>
            <Link href="/upgrade" onClick={close}
              className="block text-center text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-md py-1.5 transition-colors">
              Upgrade auf Pro →
            </Link>
          </div>
        </div>
      )}
    </>
  )

  return (
    <>
      {/* Desktop: statische Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-slate-900 text-white shrink-0">
        {content}
      </aside>

      {/* Mobile: Backdrop + Slide-in-Drawer */}
      {isOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black/50" onClick={close} aria-hidden="true" />
      )}
      <aside className={cn(
        'lg:hidden fixed inset-y-0 left-0 z-50 flex flex-col w-72 max-w-[85vw] bg-slate-900 text-white shrink-0 transition-transform duration-200',
        isOpen ? 'translate-x-0' : '-translate-x-full'
      )}>
        {content}
      </aside>
    </>
  )
}

function NavItem({ href, icon, label, active, locked, onNavigate }: {
  href: string; icon: string; label: string; active: boolean; locked?: boolean; onNavigate?: () => void
}) {
  return (
    <Link href={locked ? '/upgrade' : href} onClick={onNavigate}
      className={cn(
        'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
        active
          ? 'bg-blue-600 text-white'
          : locked
          ? 'text-slate-600 cursor-pointer hover:text-slate-400'
          : 'text-slate-300 hover:bg-slate-800 hover:text-white'
      )}>
      <span className="text-base w-5 text-center shrink-0">{icon}</span>
      <span className="flex-1 truncate">{label}</span>
      {locked && <span className="text-xs text-slate-600 shrink-0">Pro</span>}
    </Link>
  )
}
