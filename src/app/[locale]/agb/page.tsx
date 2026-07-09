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
            (1) Diese AGB gelten für alle Verträge über die Nutzung der
            Software-as-a-Service-Anwendung „AI Navigator" (nachfolgend „Dienst") zwischen
            Daniel Ostner, Hasenheide 8b, 25474 Ellerbek (nachfolgend „Anbieter") und den
            Nutzern des Dienstes (nachfolgend „Kunde").
          </p>
          <p>
            (2) Der Dienst richtet sich sowohl an Unternehmer im Sinne des § 14 BGB als auch
            an Verbraucher im Sinne des § 13 BGB. Abweichende, entgegenstehende oder ergänzende
            Geschäftsbedingungen des Kunden werden nicht Vertragsbestandteil, es sei denn, der
            Anbieter stimmt ihrer Geltung ausdrücklich schriftlich zu.
          </p>

          <h2>§ 2 Vertragsgegenstand</h2>
          <p>
            (1) Der Anbieter stellt eine webbasierte Anwendung zur Unterstützung bei
            Enterprise-AI-Strategie, -Governance und -Priorisierung bereit, bestehend aus den
            Modulen AI-Readiness Assessment, Use-Case Scoring, AI Use-Case Canvas,
            Governance-Check, Compliance Center, Architektur-Generator und Roadmap-Generator,
            jeweils im Umfang des gewählten Tarifs (Free / Pro / Enterprise gemäß aktueller
            Tarifübersicht auf der Website).
          </p>
          <p>
            (2) Der Funktionsumfang der einzelnen Tarife ergibt sich aus der jeweils aktuellen
            Leistungsbeschreibung auf der Website zum Zeitpunkt des Vertragsschlusses.
          </p>

          <h2>§ 3 Wichtiger Hinweis zur Art der Leistung — keine Rechts-, Steuer- oder Unternehmensberatung</h2>
          <p>
            (1) Der Dienst erstellt auf Basis der vom Kunden eingegebenen Informationen
            automatisierte Auswertungen, Einschätzungen, Scores, Checklisten und Vorschläge
            (u. a. zu AI-Governance-Reife, EU-AI-Act-Risikoklassifizierung, DSGVO-Aspekten,
            Architekturvorschlägen und Roadmaps).
          </p>
          <p>
            (2) Diese Auswertungen dienen ausschließlich der allgemeinen Orientierung und
            Entscheidungsunterstützung. Sie stellen <strong>keine Rechts-, Steuer-, Compliance-
            oder Unternehmensberatung</strong> dar und ersetzen diese nicht. Insbesondere die
            Einordnung nach dem EU AI Act und der DSGVO ist eine automatisiert erzeugte
            Orientierungshilfe auf Basis allgemein verfügbarer Informationen und muss vor jeder
            unternehmerischen oder rechtlichen Entscheidung durch qualifizierte Rechts-, Steuer-
            oder Fachberater für den konkreten Einzelfall geprüft werden.
          </p>
          <p>
            (3) Der Anbieter übernimmt keine Gewähr für die Vollständigkeit, Richtigkeit oder
            Aktualität der im Dienst enthaltenen Inhalte, Bewertungen und regulatorischen
            Verweise. Das regulatorische Umfeld (insbesondere EU AI Act, DSGVO) entwickelt sich
            fortlaufend weiter.
          </p>

          <h2>§ 4 Vertragsschluss</h2>
          <p>
            (1) Die Darstellung des Dienstes auf der Website stellt kein bindendes Angebot dar,
            sondern eine Aufforderung zur Abgabe eines Angebots durch den Kunden.
          </p>
          <p>
            (2) Mit Abschluss der Registrierung und — bei kostenpflichtigen Tarifen — Abschluss
            des Bestellvorgangs über den Zahlungsdienstleister Stripe gibt der Kunde ein
            verbindliches Angebot ab. Der Vertrag kommt mit Freischaltung des Zugangs durch den
            Anbieter zustande.
          </p>

          <h2>§ 5 Preise und Zahlungsbedingungen</h2>
          <p>
            (1) Es gelten die zum Zeitpunkt der Bestellung auf der Website ausgewiesenen Preise.
          </p>
          <p>
            (2) Gemäß § 19 UStG wird derzeit keine Umsatzsteuer berechnet und ausgewiesen
            (Kleinunternehmerregelung).
          </p>
          <p>
            (3) Kostenpflichtige Tarife werden im Voraus für den jeweiligen Abrechnungszeitraum
            (monatlich) über Stripe abgerechnet. Der Kunde erteilt hierzu die erforderliche
            Zahlungsautorisierung im Bestellprozess.
          </p>
          <p>
            (4) Bei Zahlungsverzug ist der Anbieter berechtigt, den Zugang zu kostenpflichtigen
            Funktionen bis zum Ausgleich zu sperren.
          </p>

          <h2>§ 6 Laufzeit und Kündigung</h2>
          <p>
            (1) Kostenpflichtige Tarife (Pro) laufen auf monatlicher Basis und verlängern sich
            automatisch um jeweils einen weiteren Monat, sofern sie nicht vor Ablauf gekündigt
            werden.
          </p>
          <p>
            (2) Die Kündigung ist jederzeit zum Ende des laufenden Abrechnungszeitraums über die
            Kontoeinstellungen oder das Stripe-Kundenportal möglich.
          </p>
          <p>
            (3) Das Recht zur außerordentlichen Kündigung aus wichtigem Grund bleibt unberührt.
          </p>
          <p>
            (4) Der Anbieter kann den kostenlosen Free-Tarif jederzeit mit angemessener
            Ankündigungsfrist ändern oder einstellen.
          </p>

          <h2>§ 7 Widerrufsrecht für Verbraucher</h2>
          <p>
            (1) Verbrauchern im Sinne des § 13 BGB steht ein gesetzliches Widerrufsrecht gemäß
            §§ 355, 356 BGB zu. Die{' '}
            <Link href="/widerruf" className="text-primary hover:underline">
              Widerrufsbelehrung mit Muster-Widerrufsformular
            </Link>{' '}
            ist separat abrufbar.
          </p>
          <p>
            (2) Das Widerrufsrecht erlischt vorzeitig, wenn der Anbieter mit der Ausführung der
            Dienstleistung begonnen hat, nachdem der Kunde ausdrücklich zugestimmt hat, dass mit
            der Ausführung vor Ablauf der Widerrufsfrist begonnen wird, und der Kunde seine
            Kenntnis davon bestätigt hat, dass er durch seine Zustimmung mit Beginn der
            Ausführung sein Widerrufsrecht verliert.
          </p>
          <p>
            (3) Für Verbraucherverträge, die über eine Online-Benutzeroberfläche geschlossen
            werden, stellt der Anbieter eine elektronische Widerrufsfunktion
            („Widerrufsbutton", § 356a BGB) im Kundenkonto sowie im Footer der Website bereit.
          </p>

          <h2>§ 8 Pflichten des Kunden</h2>
          <p>
            (1) Der Kunde ist für die Richtigkeit der von ihm eingegebenen Daten selbst
            verantwortlich.
          </p>
          <p>
            (2) Der Kunde darf keine rechtswidrigen Inhalte in den Dienst eingeben und ist
            verpflichtet, personenbezogene Daten Dritter nur dann in die Eingabefelder des
            Dienstes einzutragen, wenn er hierfür über eine eigene datenschutzrechtliche
            Grundlage verfügt.
          </p>
          <p>
            (3) Der Kunde hat seine Zugangsdaten vertraulich zu behandeln und uns unverzüglich
            zu informieren, wenn er von einem Missbrauch seines Kontos Kenntnis erlangt.
          </p>

          <h2>§ 9 Verfügbarkeit</h2>
          <p>
            Der Anbieter ist bemüht, eine hohe Verfügbarkeit des Dienstes sicherzustellen,
            übernimmt jedoch außerhalb gesonderter Enterprise-Vereinbarungen keine Garantie für
            eine bestimmte Verfügbarkeit. Wartungsarbeiten werden, soweit zumutbar, im Voraus
            angekündigt.
          </p>

          <h2>§ 10 Haftung</h2>
          <p>
            (1) Der Anbieter haftet unbeschränkt für Vorsatz und grobe Fahrlässigkeit sowie nach
            Maßgabe des Produkthaftungsgesetzes.
          </p>
          <p>
            (2) Bei leicht fahrlässiger Verletzung wesentlicher Vertragspflichten
            (Kardinalpflichten), deren Erfüllung die ordnungsgemäße Durchführung des Vertrags
            überhaupt erst ermöglicht und auf deren Einhaltung der Kunde regelmäßig vertrauen
            darf, ist die Haftung auf den bei Vertragsschluss vorhersehbaren, vertragstypischen
            Schaden begrenzt.
          </p>
          <p>
            (3) Im Übrigen ist die Haftung für leicht fahrlässige Pflichtverletzungen
            ausgeschlossen.
          </p>
          <p>
            (4) Die vorstehenden Haftungsbeschränkungen gelten nicht für Schäden aus der
            Verletzung des Lebens, des Körpers oder der Gesundheit.
          </p>
          <p>
            (5) Für Schäden, die aus unternehmerischen oder rechtlichen Entscheidungen des
            Kunden auf Basis der im Dienst enthaltenen Auswertungen entstehen, haftet der
            Anbieter nicht, soweit diese Auswertungen ausdrücklich als Orientierungshilfe
            gekennzeichnet sind (§ 3) und keine grobe Fahrlässigkeit oder Vorsatz des Anbieters
            vorliegt.
          </p>

          <h2>§ 11 Gewährleistung</h2>
          <p>
            Es gelten die gesetzlichen Gewährleistungsvorschriften, soweit nachfolgend nichts
            Abweichendes geregelt ist.
          </p>

          <h2>§ 12 Änderungen dieser AGB</h2>
          <p>
            Der Anbieter kann diese AGB mit Wirkung für die Zukunft ändern, wenn dies aus
            triftigem Grund (z. B. Änderung der Rechtslage, des Leistungsangebots oder der
            Rechtsprechung) erforderlich ist. Der Kunde wird über Änderungen mit angemessener
            Frist informiert und kann widersprechen; bei Widerspruch gilt der Vertrag zu den
            bisherigen Bedingungen fort, der Anbieter kann in diesem Fall ordentlich kündigen.
          </p>

          <h2>§ 13 Schlussbestimmungen</h2>
          <p>
            (1) Es gilt das Recht der Bundesrepublik Deutschland unter Ausschluss des
            UN-Kaufrechts. Bei Verbrauchern gilt dies nur, soweit hierdurch kein gesetzlicher
            Verbraucherschutz des Staates entzogen wird, in dem der Verbraucher seinen
            gewöhnlichen Aufenthalt hat.
          </p>
          <p>
            (2) Ist der Kunde Kaufmann, juristische Person des öffentlichen Rechts oder
            öffentlich-rechtliches Sondervermögen, ist Gerichtsstand der Sitz des Anbieters.
          </p>
          <p>
            (3) Sollten einzelne Bestimmungen dieser AGB unwirksam sein, bleibt die Wirksamkeit
            der übrigen Bestimmungen unberührt.
          </p>

          <p className="text-xs text-slate-400 mt-6">Stand: Juli 2026</p>
        </div>

        <p className="text-xs text-slate-400 mt-6 text-center">
          AI Navigator · enterprise-ai.biz ·{' '}
          <Link href="/impressum" className="hover:text-slate-600">Impressum</Link>{' '}·{' '}
          <Link href="/datenschutz" className="hover:text-slate-600">Datenschutz</Link>{' '}·{' '}
          <Link href="/widerruf" className="hover:text-slate-600">Widerrufsbelehrung</Link>
        </p>
      </div>
    </div>
  )
}
