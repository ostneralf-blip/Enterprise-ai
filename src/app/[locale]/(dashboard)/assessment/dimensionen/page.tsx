import { ASSESSMENT_DIMENSIONS } from '@/config/assessment-data'
import { getLocale } from 'next-intl/server'
import { pick } from '@/lib/utils/locale-data'
import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Assessment-Dimensionen' }

const DIMENSION_META: Record<string, { icon: string; description: string }> = {
  data: {
    icon: '📊',
    description:
      'Die höchste Gewichtung, weil KI-Systeme nur so gut sind wie ihre Datenbasis. Bewertet wird, ob Kerndaten strukturiert, qualitativ hochwertig und über definierte Zugriffsrechte für KI-Anwendungen nutzbar sind.',
  },
  skills: {
    icon: '🎓',
    description:
      'Technologie entfaltet ihren Wert nur mit den richtigen Menschen. Diese Dimension erfasst, ob technisches AI/ML-Know-how und Business-Verständnis für KI im Unternehmen ausreichend vorhanden und aktiv entwickelt werden.',
  },
  governance: {
    icon: '⚖️',
    description:
      'Klare Regeln schaffen Vertrauen und Skalierbarkeit. Besonders im Kontext des EU AI Act ist ein strukturiertes Governance-Framework für Datenschutz, Compliance und Risikosteuerung entscheidend.',
  },
  tech: {
    icon: '⚙️',
    description:
      'Die technische Basis bestimmt Geschwindigkeit und Qualität der KI-Entwicklung. Cloud-Fähigkeit, API-Reife und etablierte DevOps-/MLOps-Prozesse sind die Voraussetzung für produktiven KI-Betrieb.',
  },
  strategy: {
    icon: '🎯',
    description:
      'Ohne strategische Verankerung mit eigenem Budget und messbaren Zielen (OKRs) bleiben KI-Initiativen Einzelpiloten ohne Wirkung im Unternehmensmaßstab. Strategie sichert Priorisierung und Ressourcen.',
  },
  culture: {
    icon: '🌱',
    description:
      'Der kleinste Gewichtungsanteil, aber oft der entscheidende Faktor: Technisch exzellente KI-Projekte scheitern an kulturellem Widerstand. Executive Sponsorship und Offenheit für Wandel sind der Booster jeder KI-Transformation.',
  },
}

export default async function DimensionenPage() {
  const locale = await getLocale()
  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <Link
          href="/assessment"
          className="inline-flex items-center gap-1 text-sm text-primary hover:text-primary transition-colors mb-4"
        >
          ← Zurück zum Assessment
        </Link>
        <h1 className="text-xl sm:text-2xl font-semibold font-serif text-slate-900">Assessment-Dimensionen</h1>
        <p className="text-slate-500 text-sm mt-1 leading-relaxed">
          Das AI-Readiness Assessment bewertet Ihr Unternehmen in 6 Dimensionen. Die Gewichtungen
          spiegeln wider, welchen Einfluss jede Dimension erfahrungsgemäß auf den Gesamterfolg von
          KI-Initiativen hat.
        </p>
      </div>

      <div className="space-y-4">
        {ASSESSMENT_DIMENSIONS.map(dim => {
          const meta = DIMENSION_META[dim.id]
          const weightPct = Math.round(dim.weight * 100)
          return (
            <div
              key={dim.id}
              id={dim.id}
              className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 scroll-mt-20"
            >
              {/* Header */}
              <div className="flex items-start gap-3 mb-4">
                <span className="text-2xl shrink-0 mt-0.5">{meta?.icon}</span>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <h2 className="text-base sm:text-lg font-semibold text-slate-900">{pick(dim.label, locale)}</h2>
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-primary-soft text-primary-hover border border-primary-border whitespace-nowrap">
                      {weightPct}% Gewichtung
                    </span>
                  </div>
                  <p className="text-sm text-slate-500 leading-relaxed">{meta?.description}</p>
                </div>
              </div>

              {/* Questions */}
              <div className="border-t border-slate-100 pt-4">
                <div className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-3">
                  Bewertungsfragen
                </div>
                <ul className="space-y-3">
                  {dim.questions.map(q => (
                    <li key={q.id}>
                      <div className="text-sm font-medium text-slate-800 mb-1.5">{pick(q.text, locale)}</div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                        <div className="bg-slate-50 rounded-lg px-3 py-2">
                          <span className="text-xs font-semibold text-red-500">1 — Niedrig: </span>
                          <span className="text-xs text-slate-500">{pick(q.lowLabel, locale)}</span>
                        </div>
                        <div className="bg-slate-50 rounded-lg px-3 py-2">
                          <span className="text-xs font-semibold text-emerald-600">5 — Sehr hoch: </span>
                          <span className="text-xs text-slate-500">{pick(q.highLabel, locale)}</span>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )
        })}
      </div>

      <div className="mt-6">
        <Link
          href="/assessment"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary text-white text-sm font-medium rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-primary-ring focus:ring-offset-2"
        >
          Assessment starten →
        </Link>
      </div>
    </div>
  )
}
