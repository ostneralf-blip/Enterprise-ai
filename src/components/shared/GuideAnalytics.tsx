'use client'
import { useEffect } from 'react'
import Link from 'next/link'
import { track } from '@/lib/posthog/client'

/** Feuert `guide_viewed` einmal beim Mount (cookieless, Issue #220). */
export function GuideViewTracker({ slug, locale }: { slug: string; locale: string }) {
  useEffect(() => {
    track('guide_viewed', { slug, locale })
  }, [slug, locale])
  return null
}

/**
 * Interner Link, der beim Klick `guide_cta` feuert und dann navigiert.
 * Für den EINEN Tool-CTA je Guide (GEO-Format, Issue #220).
 */
export function GuideCtaLink({
  href,
  slug,
  className,
  children,
}: {
  href: string
  slug: string
  className?: string
  children: React.ReactNode
}) {
  return (
    <Link href={href} className={className} onClick={() => track('guide_cta', { slug })}>
      {children}
    </Link>
  )
}
