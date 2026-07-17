'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTranslations, useLocale } from 'next-intl'
import { cn } from '@/lib/utils'
import { MODULES } from '@/config/modules'
import { pick } from '@/lib/utils/locale-data'
import { CHANGELOG } from '@/config/changelog'
import type { UserProfile } from '@/types'
import { useMobileNav } from './MobileNavContext'

interface SidebarProps {
  profile: UserProfile | null
}

export function Sidebar({ profile }: SidebarProps) {
  const pathname = usePathname()
  const tier = profile?.tier ?? 'free'
  const { isOpen, close } = useMobileNav()
  const t = useTranslations('sidebar')
  const tn = useTranslations('nav')
  const locale = useLocale()

  const content = (
    <>
      {/* Logo */}
      <div className="px-6 py-5 border-b border-line flex items-center justify-between">
        <Link href="/dashboard" onClick={close} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-sm font-bold text-white">N</div>
          <div>
            <div className="font-semibold text-sm tracking-wide text-ink">AI Navigator</div>
            <div className="text-xs text-ink-subtle">enterprise-ai.biz</div>
          </div>
        </Link>
        <button onClick={close} aria-label={t('menuClose')}
          className="lg:hidden text-ink-subtle hover:text-ink-secondary p-1 -mr-1">
          ✕
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <NavItem href="/dashboard" icon="◎" label={tn('guidedPath')} active={pathname === '/dashboard'} onNavigate={close} />

        <div className="pt-4 pb-1 px-3">
          <span className="text-[10px] font-semibold text-primary tracking-widest uppercase">{tn('tools')}</span>
        </div>

        {MODULES.map(mod => {
          const isLocked = mod.requiredTier !== 'free' && tier === 'free'
          return (
            <NavItem
              key={mod.id}
              href={`/${mod.id}`}
              icon={mod.icon}
              label={pick(mod.title, locale)}
              active={pathname.startsWith(`/${mod.id}`)}
              locked={isLocked}
              onNavigate={close}
            />
          )
        })}

        <NavItem
          href="/zusammenfassung"
          icon="□"
          label="Executive Summary"
          active={pathname === '/zusammenfassung'}
          onNavigate={close}
        />

        <div className="pt-4 pb-1 px-3">
          <span className="text-[10px] font-semibold text-primary tracking-widest uppercase">{tn('account')}</span>
        </div>
        <NavItem href="/settings" icon="⚙" label={tn('settings')} active={pathname === '/settings'} onNavigate={close} />
        <NavItem href="/feedback" icon="✉" label={tn('feedback')} active={pathname === '/feedback'} onNavigate={close} />
        {profile?.is_admin && (
          <NavItem href="/admin" icon="🛡" label={tn('admin')} active={pathname.startsWith('/admin')} onNavigate={close} />
        )}
      </nav>

      {/* Tier Badge */}
      {tier === 'free' && (
        <div className="p-4 border-t border-line">
          <div className="bg-primary-soft border border-primary-border rounded-lg p-3">
            <div className="text-xs font-semibold text-primary mb-1">{t('explorerPlan')}</div>
            <div className="text-xs text-ink-muted mb-2">{t('explorerDesc')}</div>
            <Link href="/upgrade" onClick={close}
              className="block text-center text-xs font-semibold text-white bg-primary hover:bg-primary-hover rounded-md py-1.5 transition-colors">
              {t('upgradeCta')}
            </Link>
          </div>
        </div>
      )}

      {/* Legal-Footer */}
      <div className="px-4 py-3 border-t border-line space-y-2">
        <div className="flex gap-3">
          <Link href="/impressum" target="_blank" className="text-xs text-ink-subtle hover:text-ink-secondary transition-colors">{t('impressum')}</Link>
          <Link href="/datenschutz" target="_blank" className="text-xs text-ink-subtle hover:text-ink-secondary transition-colors">{t('datenschutz')}</Link>
          <Link href="/agb" target="_blank" className="text-xs text-ink-subtle hover:text-ink-secondary transition-colors">{t('agb')}</Link>
          <Link href="/widerruf" target="_blank" className="text-xs text-ink-subtle hover:text-ink-secondary transition-colors">{t('widerruf')}</Link>
        </div>
        <div className="flex items-center justify-between">
          <Link href="/trust" className="text-xs text-ink-subtle hover:text-ink-secondary transition-colors">{t('euHosting')}</Link>
          <span className="text-xs text-ink-subtle">v{CHANGELOG[0].version}</span>
        </div>
        <div className="pt-1 border-t border-line">
          <span className="text-xs text-ink-subtle">{t('basedOn')} </span>
          <a
            href="https://enterprise-ai.biz"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-ink-subtle hover:text-ink-secondary transition-colors"
          >
            {t('bookLink')}
          </a>
        </div>
      </div>
    </>
  )

  return (
    <>
      {/* Desktop: statische Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-surface border-r border-line shrink-0">
        {content}
      </aside>

      {/* Mobile: Backdrop + Slide-in-Drawer */}
      {isOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black/30" onClick={close} aria-hidden="true" />
      )}
      <aside
        aria-hidden={!isOpen}
        inert={!isOpen}
        className={cn(
          'lg:hidden fixed inset-y-0 left-0 z-50 flex flex-col w-72 max-w-[85vw] bg-surface border-r border-line shrink-0 transition-transform duration-200',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {content}
      </aside>
    </>
  )
}

function NavItem({ href, icon, label, active, locked, onNavigate }: {
  href: string; icon: string; label: string; active: boolean; locked?: boolean; onNavigate?: () => void
}) {
  const t = useTranslations('common')
  return (
    <Link href={locked ? '/upgrade' : href} onClick={onNavigate}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
        active
          ? 'bg-primary-soft text-primary border-l-[3px] border-primary -ml-px pl-[11px]'
          : locked
          ? 'text-ink-subtle cursor-pointer hover:text-ink-muted'
          : 'text-ink-secondary hover:bg-surface-raised hover:text-ink'
      )}>
      <span className="text-base w-5 text-center shrink-0">{icon}</span>
      <span className="flex-1 truncate">{label}</span>
      {locked && <span className="text-xs text-ink-subtle shrink-0">{t('pro')}</span>}
    </Link>
  )
}
