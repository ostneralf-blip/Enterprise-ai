import Link from 'next/link'
import type { Metadata } from 'next'
import { setRequestLocale } from 'next-intl/server'

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
    title: isEn ? 'Legal notice (Impressum)' : 'Impressum',
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

function ImpressumContentDe() {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 prose prose-slate prose-sm max-w-none">
      <h2>Angaben gemäß § 5 DDG (Digitale-Dienste-Gesetz)</h2>
      <p>
        <strong>AI Navigator</strong><br />
        Einzelunternehmen<br />
        Inhaber: Daniel Ostner<br />
        Hasenheide 8b<br />
        25474 Ellerbek<br />
        Deutschland
      </p>

      <h2>Kontakt</h2>
      <p>
        E-Mail: <a href="mailto:webmaster@enterprise-ai.biz">webmaster@enterprise-ai.biz</a>
      </p>

      <h2>Umsatzsteuer</h2>
      <p>
        Gemäß § 19 Abs. 1 UStG wird keine Umsatzsteuer berechnet (Kleinunternehmerregelung).
      </p>

      <h2>Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV</h2>
      <p>
        Daniel Ostner<br />
        Hasenheide 8b, 25474 Ellerbek
      </p>

      <h2>Verbraucherstreitbeilegung</h2>
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
        gekennzeichnet. Die Vervielfältigung, Bearbeitung, Verbreitung und jede Art der
        Verwertung außerhalb der Grenzen des Urheberrechts bedürfen der schriftlichen
        Zustimmung des jeweiligen Autors bzw. Erstellers.
      </p>
    </div>
  )
}

function ImpressumContentEn() {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 prose prose-slate prose-sm max-w-none">
      <p className="text-xs text-slate-500 not-prose mb-4">
        This is a courtesy translation of the German „Impressum“. The legally authoritative
        version is the{' '}
        <Link href="/impressum" className="text-primary hover:underline">German version</Link>.
        References to German statutes (DDG, UStG, MStV) are retained.
      </p>

      <h2>Information pursuant to § 5 DDG (German Digital Services Act)</h2>
      <p>
        <strong>AI Navigator</strong><br />
        Sole proprietorship<br />
        Owner: Daniel Ostner<br />
        Hasenheide 8b<br />
        25474 Ellerbek<br />
        Germany
      </p>

      <h2>Contact</h2>
      <p>
        E-mail: <a href="mailto:webmaster@enterprise-ai.biz">webmaster@enterprise-ai.biz</a>
      </p>

      <h2>Value added tax</h2>
      <p>
        Pursuant to § 19 (1) German VAT Act (UStG), no value added tax is charged (small business
        regulation).
      </p>

      <h2>Responsible for content pursuant to § 18 (2) MStV</h2>
      <p>
        Daniel Ostner<br />
        Hasenheide 8b, 25474 Ellerbek, Germany
      </p>

      <h2>Consumer dispute resolution</h2>
      <p>
        We are neither willing nor obliged to participate in dispute resolution proceedings
        before a consumer arbitration board.
      </p>

      <h2>Liability for content</h2>
      <p>
        As a service provider, we are responsible for our own content on these pages under the
        general laws in accordance with § 7 (1) DDG. However, pursuant to §§ 8–10 DDG, we as a
        service provider are not obliged to monitor transmitted or stored third-party information
        or to investigate circumstances that indicate illegal activity. Obligations to remove or
        block the use of information under the general laws remain unaffected. However, liability
        in this respect is only possible from the point in time at which knowledge of a specific
        legal violation is obtained. Upon becoming aware of such legal violations, we will remove
        this content immediately.
      </p>

      <h2>Liability for links</h2>
      <p>
        Our offer may contain links to external third-party websites over whose content we have
        no influence. We therefore cannot assume any warranty for this third-party content. The
        respective provider or operator of the pages is always responsible for the content of the
        linked pages.
      </p>

      <h2>Copyright</h2>
      <p>
        The content and works created by the site operator on these pages are subject to German
        copyright law. Contributions by third parties are marked as such. Duplication,
        processing, distribution and any kind of exploitation outside the limits of copyright law
        require the written consent of the respective author or creator.
      </p>
    </div>
  )
}

export default async function ImpressumPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  // Erlaubt Next.js das statische Vorrendern dieser Seite (next-intl).
  setRequestLocale(locale)
  const isEn = locale === 'en'

  return (
    <main className="min-h-screen bg-slate-50">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd) }}
      />
      <div className="max-w-2xl mx-auto px-4 py-12">
        <Link href="/" className="text-sm text-slate-500 hover:text-slate-700 transition-colors">
          {isEn ? '← Back' : '← Zurück'}
        </Link>
        <h1 className="text-2xl font-semibold text-slate-900 mt-6 mb-8">
          {isEn ? 'Legal notice (Impressum)' : 'Impressum'}
        </h1>

        {isEn ? <ImpressumContentEn /> : <ImpressumContentDe />}

        <p className="text-xs text-slate-400 mt-6 text-center">
          AI Navigator · enterprise-ai.biz ·{' '}
          <Link href="/datenschutz" className="hover:text-slate-600">{isEn ? 'Privacy' : 'Datenschutz'}</Link>{' '}·{' '}
          <Link href="/agb" className="hover:text-slate-600">{isEn ? 'Terms' : 'AGB'}</Link>
        </p>
      </div>
    </main>
  )
}
