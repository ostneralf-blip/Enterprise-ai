import { PaperNoise } from '@/components/shared/PaperNoise'
import { BrandWordcloud } from '@/components/shared/BrandWordcloud'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen bg-ivory overflow-hidden">
      <PaperNoise />
      <BrandWordcloud />
      {/* 3px Cover-Blau Deckenlinie — Buch-Branding */}
      <div className="absolute top-0 left-0 right-0 h-[3px] bg-primary" aria-hidden="true" />
      <main className="relative flex items-center justify-center min-h-screen p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/lockup-vertical.svg" alt="AI Navigator" width={220} height={101} className="mx-auto mb-3 h-20 w-auto" />
            <p className="text-slate-500 text-xs tracking-widest uppercase font-medium">Enterprise-AI.biz</p>
          </div>
          {children}
        </div>
      </main>
    </div>
  )
}
