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
  const canonical = isEn ? `${BASE}/en/datenschutz` : `${BASE}/datenschutz`
  return {
    title: isEn ? 'Privacy policy' : 'Datenschutzerklärung',
    description: isEn
      ? 'Privacy policy: what data AI Navigator processes, under which legal basis, and for how long.'
      : 'Datenschutzerklärung: welche Daten AI Navigator verarbeitet, auf welcher Rechtsgrundlage und wie lange.',
    alternates: {
      canonical,
      languages: {
        de: `${BASE}/datenschutz`,
        en: `${BASE}/en/datenschutz`,
        'x-default': `${BASE}/datenschutz`,
      },
    },
  }
}

// Anker-IDs bleiben sprachübergreifend gleich (deutsche Slugs) — nur die Labels
// unterscheiden sich, damit die #-Sprungmarken in beiden Sprachen funktionieren.
const TOC_DE = [
  { id: 'verantwortlicher', label: '1. Verantwortlicher' },
  { id: 'ueberblick', label: '2. Überblick der Verarbeitungen' },
  { id: 'rechtsgrundlagen', label: '3. Rechtsgrundlagen' },
  { id: 'auftragsverarbeiter', label: '4. Auftragsverarbeiter & Empfänger' },
  { id: 'cookies', label: '5. Cookies und Tracking' },
  { id: 'speicherdauer', label: '6. Speicherdauer und Löschung' },
  { id: 'rechte', label: '7. Ihre Rechte' },
  { id: 'automatisierte-entscheidung', label: '8. Keine automatisierte Entscheidungsfindung' },
  { id: 'aenderungen', label: '9. Änderungen dieser Erklärung' },
]

const TOC_EN = [
  { id: 'verantwortlicher', label: '1. Controller' },
  { id: 'ueberblick', label: '2. Overview of processing' },
  { id: 'rechtsgrundlagen', label: '3. Legal bases' },
  { id: 'auftragsverarbeiter', label: '4. Processors & recipients' },
  { id: 'cookies', label: '5. Cookies and tracking' },
  { id: 'speicherdauer', label: '6. Storage period and deletion' },
  { id: 'rechte', label: '7. Your rights' },
  { id: 'automatisierte-entscheidung', label: '8. No automated decision-making' },
  { id: 'aenderungen', label: '9. Changes to this policy' },
]

const proseClass = 'bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 prose prose-slate prose-sm max-w-none prose-h2:scroll-mt-20 prose-h2:border-t prose-h2:border-slate-100 prose-h2:pt-6 first:prose-h2:border-t-0 first:prose-h2:pt-0'

function DatenschutzContentDe() {
  return (
    <div className={proseClass}>
      <h2 id="verantwortlicher">1. Verantwortlicher</h2>
      <p>
        Daniel Ostner<br />
        Hasenheide 8b, 25474 Ellerbek, Deutschland<br />
        E-Mail: <a href="mailto:webmaster@enterprise-ai.biz">webmaster@enterprise-ai.biz</a>
      </p>
      <p>(im Folgenden „wir“ / „AI Navigator“)</p>

      <h2 id="ueberblick">2. Überblick der Verarbeitungen</h2>
      <p>
        AI Navigator ist eine webbasierte Anwendung zur Unterstützung bei
        Enterprise-AI-Strategie, -Governance und -Priorisierung (Assessment, Use-Case Scoring,
        AI Use-Case Canvas, Governance-Check, Compliance Center, Architektur-Generator,
        Roadmap-Generator). Bei der Nutzung verarbeiten wir folgende Kategorien
        personenbezogener Daten:
      </p>
      <ul>
        <li>
          <strong>Registrierungs- und Kontodaten:</strong> E-Mail-Adresse, Passwort (gehasht),
          Profil-Einstellungen
        </li>
        <li>
          <strong>Nutzungsdaten:</strong> von Ihnen eingegebene Inhalte in den Modulen
          (z. B. Assessment-Antworten, Canvas-Inhalte, Architektur-Konfigurationen) — diese
          können unternehmensbezogene Angaben enthalten, die Sie selbst eintragen
        </li>
        <li>
          <strong>Zahlungsdaten:</strong> bei kostenpflichtigen Tarifen (Pro/Enterprise) über
          unseren Zahlungsdienstleister Stripe; wir selbst speichern keine vollständigen
          Zahlungskartendaten
        </li>
        <li>
          <strong>Nutzungsstatistiken:</strong> anonymisierte/pseudonymisierte Produktnutzung
          über PostHog (cookielos konfiguriert)
        </li>
        <li>
          <strong>Technische Daten:</strong> IP-Adresse (temporär, zur Auslieferung/Sicherheit),
          Zeitstempel, Browsertyp — im Rahmen des Hosting-Betriebs
        </li>
      </ul>
      <p>
        Die Angabe einer E-Mail-Adresse bei der Registrierung ist zur Bereitstellung des
        Dienstes erforderlich; ohne diese Angabe können wir keinen Zugang einrichten. Alle
        übrigen Angaben in den Modulen erfolgen freiwillig.
      </p>

      <h2 id="rechtsgrundlagen">3. Rechtsgrundlagen</h2>
      <table>
        <thead>
          <tr><th>Verarbeitung</th><th>Rechtsgrundlage</th></tr>
        </thead>
        <tbody>
          <tr>
            <td>Registrierung, Bereitstellung der Kernfunktionen</td>
            <td>Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung)</td>
          </tr>
          <tr>
            <td>Zahlungsabwicklung, Rechnungsstellung</td>
            <td>Art. 6 Abs. 1 lit. b, lit. c DSGVO (Vertrag, steuerrechtliche Aufbewahrungspflichten)</td>
          </tr>
          <tr>
            <td>Produktanalyse (PostHog)</td>
            <td>Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse an Produktverbesserung)</td>
          </tr>
          <tr>
            <td>Support-/Feedback-Kommunikation</td>
            <td>Art. 6 Abs. 1 lit. b, lit. f DSGVO</td>
          </tr>
          <tr>
            <td>Transaktionale E-Mails (Bestätigungen, Rechnungen)</td>
            <td>Art. 6 Abs. 1 lit. b DSGVO</td>
          </tr>
        </tbody>
      </table>

      <h2 id="auftragsverarbeiter">4. Auftragsverarbeiter &amp; Empfänger</h2>
      <p>
        Wir setzen sorgfältig ausgewählte Dienstleister ein, mit denen — soweit erforderlich
        — Auftragsverarbeitungsverträge (Art. 28 DSGVO) bestehen:
      </p>
      <table>
        <thead>
          <tr><th>Dienstleister</th><th>Zweck</th><th>Standort / Besonderheit</th></tr>
        </thead>
        <tbody>
          <tr>
            <td>Supabase</td>
            <td>Datenbank, Authentifizierung, Speicherung</td>
            <td>EU (Frankfurt, eu-central-1)</td>
          </tr>
          <tr>
            <td>Vercel Inc.</td>
            <td>Hosting/Auslieferung der Anwendung</td>
            <td>Serverstandort EU (Region fra1); Anbieter mit Sitz in den USA — Datenübermittlung auf Grundlage von EU-Standardvertragsklauseln (SCC, Art. 46 DSGVO)</td>
          </tr>
          <tr>
            <td>Stripe</td>
            <td>Zahlungsabwicklung</td>
            <td>Stripe Payments Europe Ltd. (Dublin); ggf. Datenübermittlung in die USA auf Grundlage von SCC</td>
          </tr>
          <tr>
            <td>PostHog</td>
            <td>Produktanalyse (cookielos)</td>
            <td>EU-Cloud-Instanz</td>
          </tr>
          <tr>
            <td>Resend</td>
            <td>Versand transaktionaler E-Mails</td>
            <td>USA; Datenübermittlung auf Grundlage von EU-Standardvertragsklauseln (SCC)</td>
          </tr>
        </tbody>
      </table>
      <p>
        Eine Übermittlung Ihrer Daten an sonstige Dritte findet nicht statt, außer wenn wir
        gesetzlich dazu verpflichtet sind. Auf Anfrage unter{' '}
        <a href="mailto:webmaster@enterprise-ai.biz">webmaster@enterprise-ai.biz</a> stellen
        wir Ihnen eine Kopie der jeweils vereinbarten Garantien für Drittlandübermittlungen
        (z. B. EU-Standardvertragsklauseln) zur Verfügung.
      </p>

      <h2 id="cookies">5. Cookies und Tracking</h2>
      <p>
        Wir setzen für die Produktanalyse PostHog in einer cookielosen Konfiguration ein —
        es werden keine dauerhaften Tracking-Cookies gesetzt. Für den Login-Status verwenden
        wir technisch notwendige Session-Cookies von Supabase Auth; diese sind zur
        Bereitstellung des Dienstes erforderlich (Art. 6 Abs. 1 lit. b DSGVO,
        § 25 Abs. 2 Nr. 2 TDDDG) und bedürfen keiner gesonderten Einwilligung.
      </p>

      <h2 id="speicherdauer">6. Speicherdauer und Löschung</h2>
      <p>
        Wir speichern personenbezogene Daten nur so lange, wie es für die genannten Zwecke
        erforderlich ist oder gesetzliche Aufbewahrungsfristen (z. B. handels-/steuerrechtlich,
        i. d. R. 6–10 Jahre für Rechnungsunterlagen) dies verlangen. Sie können Ihr Konto und
        alle damit verbundenen Daten jederzeit über <strong>Einstellungen → Konto löschen</strong>{' '}
        selbst löschen. Alternativ können Sie uns unter{' '}
        <a href="mailto:webmaster@enterprise-ai.biz">webmaster@enterprise-ai.biz</a> kontaktieren.
      </p>

      <h2 id="rechte">7. Ihre Rechte</h2>
      <p>
        Sie haben das Recht auf Auskunft (Art. 15 DSGVO), Berichtigung (Art. 16),
        Löschung (Art. 17), Einschränkung der Verarbeitung (Art. 18),
        Datenübertragbarkeit (Art. 20) und Widerspruch (Art. 21) gegen die Verarbeitung
        Ihrer personenbezogenen Daten sowie das Recht, sich bei einer
        Datenschutzaufsichtsbehörde zu beschweren (Art. 77 DSGVO) — wahlweise bei der
        Behörde an Ihrem Wohnort, Arbeitsplatz oder dem Ort des mutmaßlichen Verstoßes.
        Für uns zuständig ist das Unabhängige Landeszentrum für Datenschutz
        Schleswig-Holstein (ULD).
      </p>

      <h2 id="automatisierte-entscheidung">8. Keine automatisierte Entscheidungsfindung im Sinne Art. 22 DSGVO</h2>
      <p>
        AI Navigator erstellt auf Basis Ihrer Eingaben Auswertungen, Scores und Empfehlungen
        zu Unternehmensprozessen (z. B. Governance-Einschätzungen, Architektur-Vorschläge).
        Diese Auswertungen betreffen ausschließlich organisatorische/technische Sachverhalte,
        die Sie selbst eingeben — es findet keine automatisierte Entscheidung mit rechtlicher
        oder ähnlich erheblicher Wirkung gegenüber Ihnen als Person im Sinne von Art. 22
        DSGVO statt.
      </p>

      <h2 id="aenderungen">9. Änderungen dieser Datenschutzerklärung</h2>
      <p>
        Wir passen diese Datenschutzerklärung an, wenn sich die Rechtslage oder unsere
        Datenverarbeitung ändert. Die jeweils aktuelle Fassung finden Sie auf dieser Seite.
      </p>

      <p className="text-xs text-slate-400 mt-6">Stand: Juli 2026</p>
    </div>
  )
}

function DatenschutzContentEn() {
  return (
    <div className={proseClass}>
      <p className="text-xs text-slate-500 not-prose mb-4">
        This is a courtesy translation of the German „Datenschutzerklärung“. The legally
        authoritative version is the{' '}
        <Link href="/datenschutz" className="text-primary hover:underline">German version</Link>.
        References to German and EU statutes (GDPR/DSGVO, TDDDG) are retained.
      </p>

      <h2 id="verantwortlicher">1. Controller</h2>
      <p>
        Daniel Ostner<br />
        Hasenheide 8b, 25474 Ellerbek, Germany<br />
        E-mail: <a href="mailto:webmaster@enterprise-ai.biz">webmaster@enterprise-ai.biz</a>
      </p>
      <p>(hereinafter “we” / “AI Navigator”)</p>

      <h2 id="ueberblick">2. Overview of processing</h2>
      <p>
        AI Navigator is a web-based application supporting enterprise AI strategy, governance and
        prioritization (Assessment, Use-Case Scoring, AI Use-Case Canvas, Governance Check,
        Compliance Center, Architecture Generator, Roadmap Generator). When you use it, we process
        the following categories of personal data:
      </p>
      <ul>
        <li>
          <strong>Registration and account data:</strong> e-mail address, password (hashed),
          profile settings
        </li>
        <li>
          <strong>Usage data:</strong> content you enter in the modules (e.g. assessment answers,
          canvas content, architecture configurations) — this may contain company-related
          information that you enter yourself
        </li>
        <li>
          <strong>Payment data:</strong> for paid plans (Pro/Enterprise) via our payment service
          provider Stripe; we ourselves do not store full payment card data
        </li>
        <li>
          <strong>Usage statistics:</strong> anonymized/pseudonymized product usage via PostHog
          (configured cookieless)
        </li>
        <li>
          <strong>Technical data:</strong> IP address (temporary, for delivery/security),
          timestamps, browser type — within the scope of hosting operations
        </li>
      </ul>
      <p>
        Providing an e-mail address during registration is required to provide the service;
        without it we cannot set up access. All other entries in the modules are voluntary.
      </p>

      <h2 id="rechtsgrundlagen">3. Legal bases</h2>
      <table>
        <thead>
          <tr><th>Processing</th><th>Legal basis</th></tr>
        </thead>
        <tbody>
          <tr>
            <td>Registration, provision of core functions</td>
            <td>Art. 6 (1) (b) GDPR (performance of a contract)</td>
          </tr>
          <tr>
            <td>Payment processing, invoicing</td>
            <td>Art. 6 (1) (b), (c) GDPR (contract, tax retention obligations)</td>
          </tr>
          <tr>
            <td>Product analytics (PostHog)</td>
            <td>Art. 6 (1) (f) GDPR (legitimate interest in product improvement)</td>
          </tr>
          <tr>
            <td>Support/feedback communication</td>
            <td>Art. 6 (1) (b), (f) GDPR</td>
          </tr>
          <tr>
            <td>Transactional e-mails (confirmations, invoices)</td>
            <td>Art. 6 (1) (b) GDPR</td>
          </tr>
        </tbody>
      </table>

      <h2 id="auftragsverarbeiter">4. Processors &amp; recipients</h2>
      <p>
        We use carefully selected service providers with whom — where necessary — data
        processing agreements (Art. 28 GDPR) are in place:
      </p>
      <table>
        <thead>
          <tr><th>Service provider</th><th>Purpose</th><th>Location / note</th></tr>
        </thead>
        <tbody>
          <tr>
            <td>Supabase</td>
            <td>Database, authentication, storage</td>
            <td>EU (Frankfurt, eu-central-1)</td>
          </tr>
          <tr>
            <td>Vercel Inc.</td>
            <td>Hosting/delivery of the application</td>
            <td>Server location EU (region fra1); provider based in the USA — data transfer on the basis of EU Standard Contractual Clauses (SCC, Art. 46 GDPR)</td>
          </tr>
          <tr>
            <td>Stripe</td>
            <td>Payment processing</td>
            <td>Stripe Payments Europe Ltd. (Dublin); where applicable, data transfer to the USA on the basis of SCC</td>
          </tr>
          <tr>
            <td>PostHog</td>
            <td>Product analytics (cookieless)</td>
            <td>EU cloud instance</td>
          </tr>
          <tr>
            <td>Resend</td>
            <td>Sending transactional e-mails</td>
            <td>USA; data transfer on the basis of EU Standard Contractual Clauses (SCC)</td>
          </tr>
        </tbody>
      </table>
      <p>
        Your data is not transferred to any other third parties unless we are legally obliged to
        do so. Upon request at{' '}
        <a href="mailto:webmaster@enterprise-ai.biz">webmaster@enterprise-ai.biz</a>, we will
        provide you with a copy of the respective agreed safeguards for third-country transfers
        (e.g. EU Standard Contractual Clauses).
      </p>

      <h2 id="cookies">5. Cookies and tracking</h2>
      <p>
        For product analytics we use PostHog in a cookieless configuration — no persistent
        tracking cookies are set. For login status we use technically necessary session cookies
        from Supabase Auth; these are required to provide the service (Art. 6 (1) (b) GDPR,
        § 25 (2) no. 2 TDDDG) and do not require separate consent.
      </p>

      <h2 id="speicherdauer">6. Storage period and deletion</h2>
      <p>
        We store personal data only for as long as necessary for the stated purposes or as
        required by statutory retention periods (e.g. under commercial/tax law, generally
        6–10 years for invoice documents). You can delete your account and all associated data
        yourself at any time via <strong>Settings → Delete account</strong>. Alternatively, you
        can contact us at{' '}
        <a href="mailto:webmaster@enterprise-ai.biz">webmaster@enterprise-ai.biz</a>.
      </p>

      <h2 id="rechte">7. Your rights</h2>
      <p>
        You have the right to information (Art. 15 GDPR), rectification (Art. 16), erasure
        (Art. 17), restriction of processing (Art. 18), data portability (Art. 20) and objection
        (Art. 21) to the processing of your personal data, as well as the right to lodge a
        complaint with a data protection supervisory authority (Art. 77 GDPR) — either with the
        authority at your place of residence, place of work or the place of the alleged
        infringement. The authority responsible for us is the Independent State Centre for Data
        Protection Schleswig-Holstein (ULD).
      </p>

      <h2 id="automatisierte-entscheidung">8. No automated decision-making within the meaning of Art. 22 GDPR</h2>
      <p>
        Based on your inputs, AI Navigator generates analyses, scores and recommendations on
        business processes (e.g. governance assessments, architecture proposals). These analyses
        relate exclusively to organizational/technical matters that you enter yourself — there is
        no automated decision with legal or similarly significant effect on you as a person within
        the meaning of Art. 22 GDPR.
      </p>

      <h2 id="aenderungen">9. Changes to this privacy policy</h2>
      <p>
        We adapt this privacy policy when the legal situation or our data processing changes. You
        will always find the current version on this page.
      </p>

      <p className="text-xs text-slate-400 mt-6">As of: July 2026</p>
    </div>
  )
}

export default async function DatenschutzPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  // Erlaubt Next.js das statische Vorrendern dieser Seite (next-intl).
  setRequestLocale(locale)
  const isEn = locale === 'en'
  const toc = isEn ? TOC_EN : TOC_DE

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="max-w-2xl mx-auto px-4 py-12">
        <Link href="/" className="text-sm text-slate-500 hover:text-slate-700 transition-colors">
          {isEn ? '← Back' : '← Zurück'}
        </Link>

        <div className="flex flex-wrap items-center gap-3 mt-6 mb-4">
          <h1 className="text-2xl font-semibold text-slate-900">
            {isEn ? 'Privacy policy' : 'Datenschutzerklärung'}
          </h1>
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-primary bg-primary-soft border border-primary-border rounded-full px-3 py-1">
            {isEn ? 'As of: July 2026' : 'Stand: Juli 2026'}
          </span>
        </div>

        <div className="bg-primary-soft border border-primary-border rounded-2xl p-5 sm:p-6 mb-6 text-sm text-slate-700">
          <p className="font-semibold text-slate-900 mb-2">{isEn ? 'In short' : 'Kurz zusammengefasst'}</p>
          <ul className="space-y-1 list-disc list-inside">
            {isEn ? (
              <>
                <li>We host in the EU (Supabase Frankfurt, Vercel region fra1).</li>
                <li>Product analytics run cookieless via PostHog — no tracking cookie banner needed.</li>
                <li>Payments run via Stripe; we do not store full card data.</li>
                <li>Your inputs are not used for automated decisions about you as a person (Art. 22 GDPR).</li>
                <li>You can delete your account and data yourself at any time in the account settings.</li>
              </>
            ) : (
              <>
                <li>Wir hosten in der EU (Supabase Frankfurt, Vercel Region fra1).</li>
                <li>Produktanalyse läuft cookielos über PostHog — kein Tracking-Cookie-Banner nötig.</li>
                <li>Zahlungen laufen über Stripe; wir speichern keine vollständigen Kartendaten.</li>
                <li>Ihre Eingaben werden nicht automatisiert für Entscheidungen über Sie als Person verwendet (Art. 22 DSGVO).</li>
                <li>Konto und Daten können Sie jederzeit selbst über die Kontoeinstellungen löschen.</li>
              </>
            )}
          </ul>
        </div>

        <nav className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 mb-6" aria-label={isEn ? 'Table of contents' : 'Inhaltsverzeichnis'}>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">{isEn ? 'Contents' : 'Inhalt'}</p>
          <ul className="grid sm:grid-cols-2 gap-x-6 gap-y-1.5 text-sm">
            {toc.map((item) => (
              <li key={item.id}>
                <a href={`#${item.id}`} className="text-primary hover:underline">
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        {isEn ? <DatenschutzContentEn /> : <DatenschutzContentDe />}

        <p className="text-xs text-slate-400 mt-6 text-center">
          AI Navigator · enterprise-ai.biz ·{' '}
          <Link href="/impressum" className="hover:text-slate-600">{isEn ? 'Legal notice' : 'Impressum'}</Link>{' '}·{' '}
          <Link href="/agb" className="hover:text-slate-600">{isEn ? 'Terms' : 'AGB'}</Link>
        </p>
      </div>
    </main>
  )
}
