import Link from 'next/link'
import type { Metadata } from 'next'
import { PaperNoise } from '@/components/shared/PaperNoise'
import { BrandWordcloud } from '@/components/shared/BrandWordcloud'

export const metadata: Metadata = {
  title: 'AI Navigator — Enterprise AI. Strukturiert navigiert.',
  description: 'Interaktive Frameworks für AI-Readiness, Governance, Use-Case-Priorisierung und Architektur. Für CTOs, CDOs und Enterprise Architekten.',
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-ivory text-slate-900">
      <PaperNoise />
      {/* Nav */}
      <nav className="border-b border-slate-200 px-6 py-4 flex items-center justify-between max-w-6xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center font-bold text-sm text-white">N</div>
          <span className="font-semibold">AI Navigator</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/login" className="text-slate-500 hover:text-slate-900 text-sm transition-colors">Anmelden</Link>
          <Link href="/register" className="bg-primary hover:bg-primary-hover text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
            Kostenlos starten
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <div className="relative overflow-hidden">
        <BrandWordcloud />
      <div className="relative max-w-4xl mx-auto px-6 pt-24 pb-16 text-center">
        <div className="inline-block bg-primary-soft border border-primary-border text-primary tracking-widest text-xs font-semibold uppercase px-3 py-1 rounded-full mb-6">
          Enterprise AI Toolset · Version 1.0
        </div>
        <h1 className="text-5xl font-semibold font-serif leading-tight mb-6">
          Enterprise AI.<br />
          <span className="text-primary">Strukturiert navigiert.</span>
        </h1>
        <p className="text-slate-600 text-lg max-w-2xl mx-auto leading-relaxed mb-10">
          7 interaktive Tools für AI-Readiness, Governance, Use-Case-Priorisierung und Architektur —
          direkt aus dem Enterprise AI Best-Practice-Leitfaden.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link href="/register"
            className="bg-primary hover:bg-primary-hover text-white font-semibold px-8 py-3 rounded-xl transition-colors text-sm">
            Kostenlos registrieren
          </Link>
          <Link href="/login" className="text-slate-600 hover:text-slate-900 text-sm transition-colors">
            Bereits registriert? Anmelden →
          </Link>
        </div>
      </div>
      </div>

      {/* Key Stats */}
      <div className="max-w-3xl mx-auto px-6 pb-16">
        <div className="grid grid-cols-3 gap-6 text-center">
          {[
            { n: '88%', l: 'Unternehmen nutzen AI' },
            { n: '5,5%', l: 'erzielen messbaren ROI' },
            { n: '7', l: 'strukturierte Tools' },
          ].map(s => (
            <div key={s.n} className="bg-white border border-slate-200 rounded-xl py-6">
              <div className="text-3xl font-bold font-serif text-primary mb-1">{s.n}</div>
              <div className="text-slate-500 text-sm">{s.l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Trust Bar */}
      <div className="border-t border-slate-200 bg-white py-5">
        <div className="max-w-4xl mx-auto px-6">
          <p className="text-xs text-slate-500 text-center mb-3 uppercase tracking-wide font-medium">Sicherheit & Compliance</p>
          <div className="flex flex-wrap justify-center gap-3 sm:gap-4">
            {[
              { icon: '🇩🇪', label: 'Hosting: Frankfurt EU' },
              { icon: '🔒', label: 'DSGVO-konform' },
              { icon: '🛡', label: 'Row-Level-Security' },
              { icon: '💳', label: 'Stripe PCI-DSS' },
              { icon: '👁', label: 'Cookieless Analytics' },
            ].map(b => (
              <div key={b.label} className="flex items-center gap-1.5 text-xs text-slate-500">
                <span>{b.icon}</span>
                <span>{b.label}</span>
              </div>
            ))}
          </div>
          <p className="text-center mt-3">
            <Link href="/trust" className="text-xs text-slate-500 hover:text-slate-700 underline transition-colors">
              Details zur Sicherheit & Datenschutz →
            </Link>
          </p>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-200 py-6 text-center text-slate-500 text-xs">
        © 2026 AI Navigator · enterprise-ai.biz ·{' '}
        <Link href="/datenschutz" className="hover:text-slate-700">Datenschutz</Link> ·{' '}
        <Link href="/impressum" className="hover:text-slate-700">Impressum</Link> ·{' '}
        <Link href="/trust" className="hover:text-slate-700">Sicherheit</Link>
      </footer>
    </div>
  )
}
