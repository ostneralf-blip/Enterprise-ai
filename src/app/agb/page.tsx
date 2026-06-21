import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Allgemeine Geschäftsbedingungen' }

export default function AgbPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-2xl mx-auto px-4 py-12">
        <Link href="/" className="text-sm text-slate-400 hover:text-slate-600 transition-colors">
          ← Zurück
        </Link>
        <h1 className="text-2xl font-semibold text-slate-900 mt-6 mb-8">
          Allgemeine Geschäftsbedingungen
        </h1>

        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 prose prose-slate prose-sm max-w-none">
          <h2>§ 1 Geltungsbereich</h2>
          <p>
            Diese Allgemeinen Geschäftsbedingungen gelten für alle Verträge zwischen
            [Firmenname] (nachfolgend &bdquo;Anbieter&ldquo;) und dem Nutzer über die Nutzung des
            AI Navigator-Dienstes unter enterprise-ai.biz.
          </p>

          <h2>§ 2 Leistungsbeschreibung</h2>
          <p>
            AI Navigator ist ein SaaS-Werkzeug für strategische AI-Planung. Es stellt
            Frameworks für AI-Readiness-Assessment, Use-Case-Priorisierung, Governance-Checks
            und Architekturplanung bereit. Der Dienst wird als Software-as-a-Service über das
            Internet bereitgestellt.
          </p>

          <h2>§ 3 Vertragsschluss und Nutzerkonto</h2>
          <p>
            Mit der Registrierung und dem Erstellen eines Nutzerkontos kommt ein Nutzungsvertrag
            zustande. Der Nutzer ist für die Sicherheit seiner Zugangsdaten verantwortlich.
          </p>

          <h2>§ 4 Vergütung und Zahlung</h2>
          <p>
            Der Free-Plan ist kostenlos. Kostenpflichtige Pläne (Professional, Enterprise) werden
            monatlich oder jährlich per Kreditkarte abgerechnet. Die Preise sind auf der Preisseite
            unter enterprise-ai.biz/upgrade einsehbar. Zahlungen werden über Stripe abgewickelt.
          </p>

          <h2>§ 5 Kündigung</h2>
          <p>
            Kostenpflichtige Abonnements können jederzeit zum Ende der aktuellen Abrechnungsperiode
            gekündigt werden. Die Kündigung erfolgt über die Kontoeinstellungen oder per E-Mail an
            <a href="mailto:kontakt@enterprise-ai.biz">kontakt@enterprise-ai.biz</a>. Nach Kündigung
            werden keine weiteren Beträge belastet.
          </p>

          <h2>§ 6 Datenlöschung bei Kontokündigung</h2>
          <p>
            Bei Löschung des Nutzerkontos werden alle personenbezogenen Daten und erstellten Inhalte
            innerhalb von 30 Tagen unwiderruflich gelöscht (Art. 17 DSGVO).
          </p>

          <h2>§ 7 Haftungsbeschränkung</h2>
          <p>
            Die durch AI Navigator generierten Empfehlungen und Analysen dienen ausschließlich der
            strategischen Orientierung und ersetzen keine Rechts-, Steuer- oder Fachberatung. Der
            Anbieter haftet nicht für Entscheidungen, die auf Basis der Plattformausgaben getroffen
            werden. Die Haftung für leichte Fahrlässigkeit ist — soweit gesetzlich zulässig —
            ausgeschlossen.
          </p>

          <h2>§ 8 Anwendbares Recht</h2>
          <p>
            Es gilt deutsches Recht unter Ausschluss des UN-Kaufrechts. Gerichtsstand ist
            [Ort des Anbieters].
          </p>

          <p className="text-xs text-slate-400 mt-6">Stand: Juni 2026</p>
        </div>

        <p className="text-xs text-slate-400 mt-6 text-center">
          AI Navigator · enterprise-ai.biz ·{' '}
          <Link href="/impressum" className="hover:text-slate-600">Impressum</Link>{' '}·{' '}
          <Link href="/datenschutz" className="hover:text-slate-600">Datenschutz</Link>
        </p>
      </div>
    </div>
  )
}
