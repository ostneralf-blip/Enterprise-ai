import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Datenschutzerklärung' }

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
            Verantwortlicher im Sinne der DSGVO ist:<br />
            [Name / Firmenname]<br />
            [Adresse]<br />
            E-Mail: <a href="mailto:kontakt@enterprise-ai.biz">kontakt@enterprise-ai.biz</a>
          </p>

          <h2>2. Erhebung und Verarbeitung personenbezogener Daten</h2>
          <p>
            Wir verarbeiten personenbezogene Daten (E-Mail-Adresse, Name, Unternehmensangaben)
            ausschließlich zum Zweck der Bereitstellung des AI Navigator-Dienstes. Die Daten werden
            auf Servern in der EU (Frankfurt, Deutschland) gespeichert und nicht an Dritte
            außerhalb der EU weitergegeben.
          </p>

          <h2>3. Rechtsgrundlage</h2>
          <p>
            Die Verarbeitung erfolgt auf Basis von Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung)
            sowie Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse an der Plattformsicherheit).
          </p>

          <h2>4. Speicherdauer</h2>
          <p>
            Ihre Daten werden gespeichert, solange Ihr Konto aktiv ist. Nach Kontolöschung werden
            alle personenbezogenen Daten innerhalb von 30 Tagen unwiderruflich gelöscht.
          </p>

          <h2>5. Verwendete Dienste</h2>
          <ul>
            <li><strong>Supabase</strong> (Datenbank & Auth) — EU-Hosting, Frankfurt</li>
            <li><strong>Vercel</strong> (Hosting) — fra1-Region, Frankfurt</li>
            <li><strong>Stripe</strong> (Zahlungsabwicklung) — EU-Datenverarbeitung</li>
            <li><strong>PostHog</strong> (Analyse, cookieless) — EU-Cloud</li>
            <li><strong>Resend</strong> (E-Mail-Versand)</li>
          </ul>

          <h2>6. Ihre Rechte (Art. 15–22 DSGVO)</h2>
          <p>Sie haben das Recht auf:</p>
          <ul>
            <li>Auskunft über Ihre gespeicherten Daten (Art. 15)</li>
            <li>Berichtigung unrichtiger Daten (Art. 16)</li>
            <li>Löschung Ihrer Daten (Art. 17) — jederzeit über Einstellungen → Konto löschen</li>
            <li>Einschränkung der Verarbeitung (Art. 18)</li>
            <li>Datenübertragbarkeit (Art. 20)</li>
            <li>Widerspruch gegen die Verarbeitung (Art. 21)</li>
          </ul>
          <p>
            Anfragen richten Sie an:{' '}
            <a href="mailto:datenschutz@enterprise-ai.biz">datenschutz@enterprise-ai.biz</a>
          </p>

          <h2>7. Beschwerderecht</h2>
          <p>
            Sie haben das Recht, sich bei der zuständigen Datenschutzaufsichtsbehörde zu beschweren.
            Zuständig ist der Landesbeauftragte für den Datenschutz des jeweiligen Bundeslandes.
          </p>

          <p className="text-xs text-slate-400 mt-6">Stand: Juni 2026</p>
        </div>

        <p className="text-xs text-slate-400 mt-6 text-center">
          AI Navigator · enterprise-ai.biz ·{' '}
          <Link href="/impressum" className="hover:text-slate-600">Impressum</Link>
        </p>
      </div>
    </div>
  )
}
