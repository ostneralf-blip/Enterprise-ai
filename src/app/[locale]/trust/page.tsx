import Link from 'next/link'
import type { Metadata } from 'next'

const BASE = process.env.NEXT_PUBLIC_APP_URL ?? 'https://enterprise-ai.biz'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const isEn = locale === 'en'
  const canonical = isEn ? `${BASE}/en/trust` : `${BASE}/trust`
  return {
    title: isEn ? 'Security & Trust' : 'Sicherheit & Vertrauen',
    description: isEn
      ? 'EU hosting in Frankfurt, GDPR compliance, data security, and transparency.'
      : 'EU-Hosting in Frankfurt, DSGVO-Konformität, Datensicherheit und Transparenz.',
    alternates: {
      canonical,
      languages: {
        de: `${BASE}/trust`,
        en: `${BASE}/en/trust`,
        'x-default': `${BASE}/trust`,
      },
    },
  }
}

const TRUST_ITEMS = [
  {
    icon: '🇩🇪',
    title: 'EU-Hosting in Frankfurt',
    body: 'Alle Daten werden ausschließlich auf Servern in Frankfurt am Main (eu-central-1) gespeichert und verarbeitet — niemals außerhalb der EU. Infrastruktur-Anbieter: Supabase (PostgreSQL) und Vercel (Serverless-Compute), jeweils mit EU-Rechenzentrum.',
  },
  {
    icon: '🔒',
    title: 'DSGVO-Konformität',
    body: 'Der AI Navigator wurde DSGVO-konform entwickelt: Recht auf Datenlöschung (Art. 17) direkt in den Einstellungen, keine Weitergabe personenbezogener Daten an Dritte, Privacy-by-Design-Architektur. Datenschutzerklärung, Impressum und AGB sind jederzeit einsehbar.',
  },
  {
    icon: '🛡',
    title: 'Datensicherheit',
    body: 'Row-Level-Security (RLS) auf jeder Datenbanktabelle stellt sicher, dass Nutzer ausschließlich ihre eigenen Daten lesen und schreiben können. Sämtliche Verbindungen sind TLS-verschlüsselt. Passwörter werden ausschließlich gehasht gespeichert (bcrypt via Supabase Auth).',
  },
  {
    icon: '👁',
    title: 'Transparenz & keine versteckten Tracker',
    body: 'Analytics über PostHog EU-Cloud (cookieless, kein Cross-Site-Tracking). Keine Google Analytics, keine Facebook-Pixel, keine Werbenetze. Sentry Error-Tracking (EU-Region) ausschließlich zur Fehlerbehebung, mit vollständiger Textverschleierung in Session-Replays.',
  },
  {
    icon: '💳',
    title: 'Sichere Zahlungsabwicklung',
    body: 'Zahlungen werden vollständig über Stripe abgewickelt — PCI-DSS Level 1 zertifiziert. Der AI Navigator speichert keine Kreditkartendaten. Rechnungen, Zahlungsmethoden und Abonnements können direkt im Stripe-Kundenportal verwaltet werden.',
  },
  {
    icon: '📋',
    title: 'Auftragsverarbeitungsvertrag (AVV)',
    body: 'Mit allen Unterauftragsverarbeitern (Supabase, Vercel, Stripe, PostHog, Resend) bestehen Auftragsverarbeitungsverträge gemäß Art. 28 DSGVO. Auf Anfrage stellen wir Ihnen einen AVV für Ihre eigene DSGVO-Dokumentation bereit.',
  },
]

export default function TrustPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-16">

        <div className="mb-10">
          <Link href="/" className="text-sm text-slate-500 hover:text-slate-700 transition-colors">← Zurück zur Startseite</Link>
          <h1 className="text-2xl sm:text-3xl font-semibold text-slate-900 mt-4 mb-2">Sicherheit & Vertrauen</h1>
          <p className="text-slate-500 text-sm sm:text-base leading-relaxed">
            Der AI Navigator wurde für Enterprise-Anforderungen entwickelt — mit EU-Hosting, DSGVO-Konformität und vollständiger Datentransparenz.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-10">
          {[
            { icon: '🇩🇪', label: 'Hosting: Frankfurt EU' },
            { icon: '✓', label: 'DSGVO-konform' },
            { icon: '🔒', label: 'TLS-verschlüsselt' },
            { icon: '🛡', label: 'Row-Level-Security' },
            { icon: '💳', label: 'Stripe PCI-DSS L1' },
            { icon: '👁', label: 'Cookieless Analytics' },
          ].map(b => (
            <div key={b.label} className="flex items-center gap-2.5 bg-white border border-slate-200 rounded-xl px-3 py-2.5">
              <span className="text-base">{b.icon}</span>
              <span className="text-xs font-medium text-slate-700">{b.label}</span>
            </div>
          ))}
        </div>

        <div className="space-y-4">
          {TRUST_ITEMS.map(item => (
            <section key={item.title} className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-xl">{item.icon}</span>
                <h2 className="text-base font-semibold text-slate-900">{item.title}</h2>
              </div>
              <p className="text-sm text-slate-600 leading-relaxed">{item.body}</p>
            </section>
          ))}
        </div>

        <div className="mt-8 bg-slate-800 text-white rounded-2xl p-5 sm:p-6">
          <h2 className="text-base font-semibold mb-2">Fragen zu Datenschutz & Sicherheit?</h2>
          <p className="text-sm text-slate-300 mb-4 leading-relaxed">
            Für Datenschutzanfragen, AVV-Anforderungen oder Sicherheitsfragen wenden Sie sich direkt an uns.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/impressum" className="text-xs text-slate-300 hover:text-white underline transition-colors">Impressum</Link>
            <Link href="/datenschutz" className="text-xs text-slate-300 hover:text-white underline transition-colors">Datenschutzerklärung</Link>
            <Link href="/agb" className="text-xs text-slate-300 hover:text-white underline transition-colors">AGB</Link>
          </div>
        </div>

      </div>
    </div>
  )
}
