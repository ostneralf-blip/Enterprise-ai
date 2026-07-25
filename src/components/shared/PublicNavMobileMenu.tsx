'use client'
import { useState } from 'react'
import Link from 'next/link'

export interface PublicNavLink {
  label: string
  href: string
  external?: boolean
}

// Hamburger-Menü für die öffentliche Nav auf Mobile (<768px). Die Desktop-Links
// liegen in `hidden md:flex` und wären sonst mobil komplett unsichtbar.
export function PublicNavMobileMenu({ links, loginHref, loginLabel, menuLabel }: {
  links: PublicNavLink[]
  loginHref: string
  loginLabel: string
  menuLabel: string
}) {
  const [open, setOpen] = useState(false)
  return (
    <div className="md:hidden">
      <button type="button" aria-label={menuLabel} aria-expanded={open} onClick={() => setOpen(o => !o)}
        className="text-slate-600 hover:text-slate-900 p-1 text-xl leading-none">
        <span aria-hidden="true">{open ? '✕' : '☰'}</span>
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-full z-40 bg-white border-b border-slate-200 shadow-sm">
          <div className="max-w-6xl mx-auto px-6 py-2 flex flex-col">
            {links.map(l => l.external ? (
              <a key={l.href} href={l.href} target="_blank" rel="noopener noreferrer" onClick={() => setOpen(false)}
                className="py-2.5 text-slate-700 hover:text-slate-900 text-sm">{l.label}</a>
            ) : (
              <Link key={l.href} href={l.href} onClick={() => setOpen(false)}
                className="py-2.5 text-slate-700 hover:text-slate-900 text-sm">{l.label}</Link>
            ))}
            <Link href={loginHref} onClick={() => setOpen(false)}
              className="py-2.5 text-slate-500 hover:text-slate-900 text-sm border-t border-slate-100 mt-1">{loginLabel}</Link>
          </div>
        </div>
      )}
    </div>
  )
}
