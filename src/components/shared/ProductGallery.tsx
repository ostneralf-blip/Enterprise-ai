'use client'

import { useEffect, useState, useCallback } from 'react'
import type { GalleryImage } from '@/config/preise-gallery'

function ProBadge() {
  return (
    <span className="absolute top-2 right-2 bg-primary text-white text-[10px] font-semibold uppercase tracking-wide px-2 py-1 rounded-full shadow">
      Pro
    </span>
  )
}

function FreeProBadge() {
  return (
    <span className="absolute top-2 right-2 bg-white/90 text-slate-700 text-[10px] font-semibold uppercase tracking-wide px-2 py-1 rounded-full shadow">
      Free &amp; Pro
    </span>
  )
}

export function ProductGallery({
  images,
  locale,
}: {
  images: GalleryImage[]
  locale: string
}) {
  const isEn = locale === 'en'
  const p = (bi: { de: string; en: string }) => (isEn ? bi.en : bi.de)
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  const close = useCallback(() => setOpenIndex(null), [])
  const prev = useCallback(
    () => setOpenIndex((i) => (i === null ? null : (i - 1 + images.length) % images.length)),
    [images.length]
  )
  const next = useCallback(
    () => setOpenIndex((i) => (i === null ? null : (i + 1) % images.length)),
    [images.length]
  )

  useEffect(() => {
    if (openIndex === null) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') close()
      if (e.key === 'ArrowLeft') prev()
      if (e.key === 'ArrowRight') next()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [openIndex, close, prev, next])

  const active = openIndex !== null ? images[openIndex] : null

  return (
    <>
      <div className="grid sm:grid-cols-3 gap-6">
        {images.map((img, i) => (
          <div key={img.key} className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
            <button
              type="button"
              onClick={() => setOpenIndex(i)}
              className="block w-full cursor-zoom-in group relative text-left"
              aria-label={isEn ? 'Open full-size image' : 'Bild in voller Größe öffnen'}
            >
              {img.pro ? <ProBadge /> : <FreeProBadge />}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img.src}
                alt={p(img.alt)}
                className="w-full h-auto block transition-transform duration-200 group-hover:scale-[1.03]"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                <span className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 text-slate-800 text-xs font-medium px-3 py-1.5 rounded-full shadow">
                  {isEn ? 'View full size ↗' : 'Vollbild ansehen ↗'}
                </span>
              </div>
            </button>
            <p className="text-center text-sm font-medium text-slate-700 py-3 px-3">{p(img.caption)}</p>
          </div>
        ))}
      </div>

      {active && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 sm:p-8"
          onClick={close}
          role="dialog"
          aria-modal="true"
        >
          <button
            type="button"
            onClick={close}
            aria-label={isEn ? 'Close' : 'Schließen'}
            className="absolute top-4 right-4 text-white/80 hover:text-white text-3xl leading-none"
          >
            ×
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              prev()
            }}
            aria-label={isEn ? 'Previous image' : 'Vorheriges Bild'}
            className="absolute left-2 sm:left-6 top-1/2 -translate-y-1/2 text-white/70 hover:text-white text-4xl leading-none px-2"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              next()
            }}
            aria-label={isEn ? 'Next image' : 'Nächstes Bild'}
            className="absolute right-2 sm:right-6 top-1/2 -translate-y-1/2 text-white/70 hover:text-white text-4xl leading-none px-2"
          >
            ›
          </button>

          <div
            className="max-w-4xl w-full flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative w-full">
              {active.pro ? (
                <span className="absolute top-3 right-3 bg-primary text-white text-xs font-semibold uppercase tracking-wide px-2.5 py-1 rounded-full shadow">
                  Pro
                </span>
              ) : (
                <span className="absolute top-3 right-3 bg-white/90 text-slate-700 text-xs font-semibold uppercase tracking-wide px-2.5 py-1 rounded-full shadow">
                  Free &amp; Pro
                </span>
              )}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={active.src}
                alt={p(active.alt)}
                className="w-full h-auto rounded-xl shadow-2xl"
              />
            </div>
            <p className="text-white/90 text-sm mt-4 text-center max-w-2xl">{p(active.caption)}</p>
            <p className="text-white/40 text-xs mt-1">
              {openIndex !== null ? openIndex + 1 : 0} / {images.length}
            </p>
          </div>
        </div>
      )}
    </>
  )
}
