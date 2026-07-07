import { PaperNoise } from '@/components/shared/PaperNoise'
import { BrandWordcloud } from '@/components/shared/BrandWordcloud'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen bg-ivory overflow-hidden">
      <PaperNoise />
      <BrandWordcloud />
      {/* 3px Cover-Blau Deckenlinie — Buch-Branding */}
      <div className="absolute top-0 left-0 right-0 h-[3px] bg-primary" aria-hidden="true" />
      <div className="relative flex items-center justify-center min-h-screen p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white font-bold text-lg">N</div>
              <span className="text-slate-900 text-xl font-serif">AI Navigator</span>
            </div>
            <p className="text-slate-400 text-xs tracking-widest uppercase font-medium">Enterprise-AI.biz</p>
          </div>
          {children}
        </div>
      </div>
    </div>
  )
}
