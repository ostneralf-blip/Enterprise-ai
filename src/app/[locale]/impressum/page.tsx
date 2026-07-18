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
  const canonical = isEn ? `${BASE}/en/impressum` : `${BASE}/impressum`
  return {
    title: 'Impressum',
    description: isEn
      ? 'Legal notice (Impressum) for the AI Navigator enterprise AI platform under German law (§ 5 DDG).'
      : 'Impressum der AI Navigator Enterprise-AI-Plattform gemäß § 5 DDG.',
    alternates: {
      canonical,
      languages: {
        de: `${BASE}/impressum`,
        en: `${BASE}/en/impressum`,
        'x-default': `${BASE}/impressum`,
      },
    },
  }
}

const personJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Person',
  name: 'Daniel Ostner',
  jobTitle: 'Inhaber, AI Navigator · Autor, Enterprise AI Leitfaden',
  url: `${BASE}/impressum`,
}

export default function ImpressumPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd) }}
      />
      <div className="max-w-2xl mx-auto px-4 py-12">
        <Link href="/" className="text-sm text-slate-400 hover:text-slate-600 transition-colors">
          ← Zurück
        </Link>
        <h1 className="text-2xl font-semibold text-slate-900 mt-6 mb-8">Impressum</h1>

        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 prose prose-slate prose-sm max-w-none">
          <h2>Angaben gemäß § 5 DDG (Digitale-Dienste-Gesetz)</h2>
          <p>
            <strong>Daniel Ostner</strong><br />
            Hasenheide 8b<br />
            25474 Ellerbek<br />
            Deutschland
          </p>
          <p>Handelnd unter der Bezeichnung „AI Navigator" (Einzelunternehmen)</p>

          <h2>Kontakt</h2>
          <p>
            E-Mail: <a href="mailto:webmaster@enterprise-ai.biz">webmaster@enterprise-ai.biz</a>
          </p>

          <h2>Umsatzsteuer</h2>
          <p>
            Gemäß § 19 UStG wird keine Umsatzsteuer berechnet (Kleinunternehmerregelung).
          </p>

          <h2>Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV</h2>
          <p>
            Daniel Ostner<br />
            Hasenheide 8b, 25474 Ellerbek
          </p>

          <h2>Streitschlichtung</h2>
          <p>
            Wir sind nicht bereit und nicht verpflichtet, an Streitbeilegungsverfahren vor
            einer Verbraucherschlichtungsstelle teilzunehmen.
          </p>

          <h2>Haftung für Inhalte</h2>
          <p>
            Als Diensteanbieter sind wir gemäß § 7 Abs. 1 DDG für eigene Inhalte auf diesen
            Seiten nach den allgemeinen Gesetzen verantwortlich. Nach §§ 8–10 DDG sind wir als
            Diensteanbieter jedoch nicht verpflichtet, übermittelte oder gespeicherte fremde
            Informationen zu überwachen oder nach Umständen zu forschen, die auf eine
            rechtswidrige Tätigkeit hinweisen. Verpflichtungen zur Entfernung oder Sperrung der
            Nutzung von Informationen nach den allgemeinen Gesetzen bleiben hiervon unberührt.
            Eine diesbezügliche Haftung ist jedoch erst ab dem Zeitpunkt der Kenntnis einer
            konkreten Rechtsverletzung möglich. Bei Bekanntwerden entsprechender Rechtsverletzungen
            werden wir diese Inhalte umgehend entfernen.
          </p>

          <h2>Haftung für Links</h2>
          <p>
            Unser Angebot enthält gegebenenfalls Links zu externen Websites Dritter, auf deren
            Inhalte wir keinen Einfluss haben. Deshalb können wir für diese fremden Inhalte auch
            keine Gewähr übernehmen. Für die Inhalte der verlinkten Seiten ist stets der jeweilige
            Anbieter oder Betreiber der Seiten verantwortlich.
          </p>

          <h2>Urheberrecht</h2>
          <p>
            Die durch den Seitenbetreiber erstellten Inhalte und Werke auf diesen Seiten
            unterliegen dem deutschen Urheberrecht. Beiträge Dritter sind als solche
            gekennzeichnet.
          </p>
        </div>

        <p className="text-xs text-slate-400 mt-6 text-center">
          AI Navigator · enterprise-ai.biz ·{' '}
          <Link href="/datenschutz" className="hover:text-slate-600">Datenschutz</Link>{' '}·{' '}
          <Link href="/agb" className="hover:text-slate-600">AGB</Link>
        </p>
      </div>
    </div>
  )
}
