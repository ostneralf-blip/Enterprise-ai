import Link from 'next/link'
import type { Metadata } from 'next'

const BASE = process.env.NEXT_PUBLIC_APP_URL ?? 'https://enterprise-ai.biz'

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Datenschutzerklärung',
    alternates: { canonical: `${BASE}/datenschutz` },
  }
}

export default function DatenschutzPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-2xl mx-auto px-4 py-12">
        <Link href="/" className="text-sm text-slate-400 hover:text-slate-600 transition-colors">
          ← Zurück
        </Link>
        <h1 className="text-2xl font-semibold text-slate-900 mt-6 mb-8">Datenschutzerklärung</h1>

        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 prose prose-slate prose-sm max-w-none">

          <h2>1. Verantwortlicher</h2>
          <p>
            Daniel Ostner<br />
            Hasenheide 8b, 25474 Ellerbek, Deutschland<br />
            E-Mail: <a href="mailto:webmaster@enterprise-ai.biz">webmaster@enterprise-ai.biz</a>
          </p>
          <p>(im Folgenden „wir" / „AI Navigator")</p>

          <h2>2. Überblick der Verarbeitungen</h2>
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
              <strong>Nutzungsdaten:</strong> von Ihnen eingegebene Inhalte in den 7 Modulen
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

          <h2>3. Rechtsgrundlagen</h2>
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

          <h2>4. Auftragsverarbeiter &amp; Empfänger</h2>
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
                <td>Serverstandort EU (Region fra1); Anbieter mit Sitz in den USA — Datenübermittlung auf Grundlage von EU-Standardvertragsklauseln (SCC)</td>
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
            gesetzlich dazu verpflichtet sind.
          </p>

          <h2>5. Cookies und Tracking</h2>
          <p>
            Wir setzen für die Produktanalyse PostHog in einer cookielosen Konfiguration ein —
            es werden keine dauerhaften Tracking-Cookies gesetzt. Für den Login-Status verwenden
            wir technisch notwendige Session-Cookies von Supabase Auth; diese sind zur
            Bereitstellung des Dienstes erforderlich (Art. 6 Abs. 1 lit. b DSGVO,
            § 25 Abs. 2 Nr. 2 TTDSG) und bedürfen keiner gesonderten Einwilligung.
          </p>

          <h2>6. Speicherdauer und Löschung</h2>
          <p>
            Wir speichern personenbezogene Daten nur so lange, wie es für die genannten Zwecke
            erforderlich ist oder gesetzliche Aufbewahrungsfristen (z. B. handels-/steuerrechtlich,
            i. d. R. 6–10 Jahre für Rechnungsunterlagen) dies verlangen. Sie können Ihr Konto und
            alle damit verbundenen Daten jederzeit über <strong>Einstellungen → Konto löschen</strong>{' '}
            selbst löschen. Alternativ können Sie uns unter{' '}
            <a href="mailto:webmaster@enterprise-ai.biz">webmaster@enterprise-ai.biz</a> kontaktieren.
          </p>

          <h2>7. Ihre Rechte</h2>
          <p>
            Sie haben das Recht auf Auskunft (Art. 15 DSGVO), Berichtigung (Art. 16),
            Löschung (Art. 17), Einschränkung der Verarbeitung (Art. 18),
            Datenübertragbarkeit (Art. 20) und Widerspruch (Art. 21) gegen die Verarbeitung
            Ihrer personenbezogenen Daten sowie das Recht, sich bei einer
            Datenschutzaufsichtsbehörde zu beschweren (Art. 77 DSGVO). Zuständig ist das
            Unabhängige Landeszentrum für Datenschutz Schleswig-Holstein (ULD), sofern keine
            abweichende örtliche Zuständigkeit greift.
          </p>

          <h2>8. Keine automatisierte Entscheidungsfindung im Sinne Art. 22 DSGVO</h2>
          <p>
            AI Navigator erstellt auf Basis Ihrer Eingaben Auswertungen, Scores und Empfehlungen
            zu Unternehmensprozessen (z. B. Governance-Einschätzungen, Architektur-Vorschläge).
            Diese Auswertungen betreffen ausschließlich organisatorische/technische Sachverhalte,
            die Sie selbst eingeben — es findet keine automatisierte Entscheidung mit rechtlicher
            oder ähnlich erheblicher Wirkung gegenüber Ihnen als Person im Sinne von Art. 22
            DSGVO statt.
          </p>

          <h2>9. Änderungen dieser Datenschutzerklärung</h2>
          <p>
            Wir passen diese Datenschutzerklärung an, wenn sich die Rechtslage oder unsere
            Datenverarbeitung ändert. Die jeweils aktuelle Fassung finden Sie auf dieser Seite.
          </p>

          <p className="text-xs text-slate-400 mt-6">Stand: Juli 2026</p>
        </div>

        <p className="text-xs text-slate-400 mt-6 text-center">
          AI Navigator · enterprise-ai.biz ·{' '}
          <Link href="/impressum" className="hover:text-slate-600">Impressum</Link>{' '}·{' '}
          <Link href="/agb" className="hover:text-slate-600">AGB</Link>
        </p>
      </div>
    </div>
  )
}
