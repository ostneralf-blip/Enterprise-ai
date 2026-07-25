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
  const canonical = isEn ? `${BASE}/en/agb` : `${BASE}/agb`
  return {
    title: isEn ? 'General Terms and Conditions' : 'Allgemeine Geschäftsbedingungen',
    description: isEn
      ? 'General terms and conditions for using AI Navigator (courtesy translation; the German version is legally binding).'
      : 'Allgemeine Geschäftsbedingungen für die Nutzung des AI Navigator.',
    alternates: {
      canonical,
      languages: {
        de: `${BASE}/agb`,
        en: `${BASE}/en/agb`,
        'x-default': `${BASE}/agb`,
      },
    },
  }
}

function AgbContentDe() {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 prose prose-slate prose-sm max-w-none">

      <h2>§ 1 Geltungsbereich</h2>
      <p>
        (1) Diese AGB gelten für alle Verträge über die Nutzung der
        Software-as-a-Service-Anwendung „AI Navigator“ (nachfolgend „Dienst“) zwischen
        Daniel Ostner, Hasenheide 8b, 25474 Ellerbek (nachfolgend „Anbieter“) und den
        Nutzern des Dienstes (nachfolgend „Kunde“).
      </p>
      <p>
        (2) Der Dienst richtet sich sowohl an Unternehmer im Sinne des § 14 BGB als auch
        an Verbraucher im Sinne des § 13 BGB. Abweichende, entgegenstehende oder ergänzende
        Geschäftsbedingungen des Kunden werden nicht Vertragsbestandteil, es sei denn, der
        Anbieter stimmt ihrer Geltung ausdrücklich in Textform zu.
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
        (2) Gemäß § 19 Abs. 1 UStG wird derzeit keine Umsatzsteuer berechnet und ausgewiesen
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
      <p>
        (5) Für Verbraucherverträge, die über eine Online-Benutzeroberfläche geschlossen
        werden, stellt der Anbieter gemäß § 312k BGB eine ständig verfügbare
        Kündigungsschaltfläche („Kündigungsbutton“) in den Kontoeinstellungen sowie im
        Footer der Website bereit, über die der Kunde den Vertrag unmittelbar kündigen und
        eine Bestätigung der Kündigung erhalten kann.
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
        („Widerrufsbutton“, § 356a BGB) im Kundenkonto sowie im Footer der Website bereit.
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
        (3) Der Kunde hat seine Zugangsdaten vertraulich zu behandeln und den Anbieter
        unverzüglich zu informieren, wenn er von einem Missbrauch seines Kontos Kenntnis
        erlangt.
      </p>
      <p>
        (4) Verarbeitet der Kunde über den Dienst personenbezogene Daten Dritter (z. B.
        eigener Mitarbeiter oder Kunden), schließen Anbieter und Kunde hierfür auf Anfrage
        einen gesonderten Auftragsverarbeitungsvertrag (AVV) gemäß Art. 28 DSGVO ab; die
        Einzelheiten ergeben sich aus der Datenschutzerklärung.
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
        (3) Vertragssprache ist Deutsch.
      </p>
      <p>
        (4) Sollten einzelne Bestimmungen dieser AGB unwirksam sein, bleibt die Wirksamkeit
        der übrigen Bestimmungen unberührt.
      </p>

      <p className="text-xs text-slate-400 mt-6">Stand: Juli 2026</p>
    </div>
  )
}

function AgbContentEn() {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 prose prose-slate prose-sm max-w-none">
      <p className="text-xs text-slate-500 not-prose mb-4">
        This is a non-binding courtesy translation of the German „Allgemeine Geschäftsbedingungen“.
        In the event of any discrepancy, the{' '}
        <Link href="/agb" className="text-primary hover:underline">German version</Link>{' '}
        shall prevail. References to German statutes (BGB, UStG, etc.) are retained.
      </p>

      <h2>§ 1 Scope</h2>
      <p>
        (1) These General Terms and Conditions (GTC) apply to all contracts on the use of the
        software-as-a-service application “AI Navigator” (the “Service”) between Daniel Ostner,
        Hasenheide 8b, 25474 Ellerbek, Germany (the “Provider”) and the users of the Service
        (the “Customer”).
      </p>
      <p>
        (2) The Service is aimed at both entrepreneurs within the meaning of § 14 German Civil
        Code (BGB) and consumers within the meaning of § 13 BGB. Deviating, conflicting or
        supplementary terms and conditions of the Customer do not become part of the contract
        unless the Provider expressly agrees to their validity in text form.
      </p>

      <h2>§ 2 Subject matter of the contract</h2>
      <p>
        (1) The Provider provides a web-based application supporting enterprise AI strategy,
        governance and prioritization, consisting of the modules AI Readiness Assessment,
        Use-Case Scoring, AI Use-Case Canvas, Governance Check, Compliance Center, Architecture
        Generator and Roadmap Generator, in each case within the scope of the selected plan
        (Free / Pro / Enterprise according to the current plan overview on the website).
      </p>
      <p>
        (2) The scope of functions of the individual plans results from the respective current
        service description on the website at the time the contract is concluded.
      </p>

      <h2>§ 3 Important note on the nature of the service — no legal, tax or business consulting</h2>
      <p>
        (1) Based on the information entered by the Customer, the Service generates automated
        analyses, assessments, scores, checklists and suggestions (including on AI governance
        maturity, EU AI Act risk classification, GDPR aspects, architecture proposals and
        roadmaps).
      </p>
      <p>
        (2) These analyses serve exclusively for general orientation and decision support. They
        do <strong>not constitute legal, tax, compliance or business consulting</strong> and do
        not replace such advice. In particular, the classification under the EU AI Act and the
        GDPR is an automatically generated orientation aid based on generally available
        information and must be reviewed by qualified legal, tax or specialist advisors for the
        specific individual case before any business or legal decision.
      </p>
      <p>
        (3) The Provider assumes no warranty for the completeness, accuracy or timeliness of the
        content, assessments and regulatory references contained in the Service. The regulatory
        environment (in particular the EU AI Act and the GDPR) continues to evolve.
      </p>

      <h2>§ 4 Conclusion of contract</h2>
      <p>
        (1) The presentation of the Service on the website does not constitute a binding offer,
        but an invitation to the Customer to submit an offer.
      </p>
      <p>
        (2) By completing registration and — for paid plans — completing the ordering process via
        the payment service provider Stripe, the Customer submits a binding offer. The contract
        is concluded upon activation of access by the Provider.
      </p>

      <h2>§ 5 Prices and payment terms</h2>
      <p>
        (1) The prices shown on the website at the time of ordering apply.
      </p>
      <p>
        (2) Pursuant to § 19 (1) German VAT Act (UStG), no value added tax is currently charged
        or shown (small business regulation).
      </p>
      <p>
        (3) Paid plans are billed in advance for the respective billing period (monthly) via
        Stripe. The Customer grants the necessary payment authorization during the ordering
        process.
      </p>
      <p>
        (4) In the event of default in payment, the Provider is entitled to block access to paid
        functions until settlement.
      </p>

      <h2>§ 6 Term and termination</h2>
      <p>
        (1) Paid plans (Pro) run on a monthly basis and are automatically renewed for a further
        month unless terminated before expiry.
      </p>
      <p>
        (2) Termination is possible at any time as of the end of the current billing period via
        the account settings or the Stripe customer portal.
      </p>
      <p>
        (3) The right to extraordinary termination for good cause remains unaffected.
      </p>
      <p>
        (4) The Provider may change or discontinue the free Free plan at any time with reasonable
        notice.
      </p>
      <p>
        (5) For consumer contracts concluded via an online user interface, the Provider provides,
        pursuant to § 312k BGB, a permanently available termination button in the account
        settings and in the footer of the website, via which the Customer can terminate the
        contract directly and receive a confirmation of the termination.
      </p>

      <h2>§ 7 Right of withdrawal for consumers</h2>
      <p>
        (1) Consumers within the meaning of § 13 BGB have a statutory right of withdrawal
        pursuant to §§ 355, 356 BGB. The{' '}
        <Link href="/widerruf" className="text-primary hover:underline">
          withdrawal instructions with a model withdrawal form
        </Link>{' '}
        are available separately.
      </p>
      <p>
        (2) The right of withdrawal expires prematurely if the Provider has begun performing the
        service after the Customer has expressly consented to the Provider beginning performance
        before the end of the withdrawal period and has confirmed his knowledge that, by giving
        this consent, he loses his right of withdrawal upon commencement of performance.
      </p>
      <p>
        (3) For consumer contracts concluded via an online user interface, the Provider provides
        an electronic withdrawal function (“withdrawal button”, § 356a BGB) in the customer
        account and in the footer of the website.
      </p>

      <h2>§ 8 Customer obligations</h2>
      <p>
        (1) The Customer is responsible for the accuracy of the data he enters.
      </p>
      <p>
        (2) The Customer may not enter any unlawful content into the Service and is obliged to
        enter personal data of third parties into the Service’s input fields only if he has his
        own data protection basis for doing so.
      </p>
      <p>
        (3) The Customer must keep his access data confidential and inform the Provider without
        undue delay if he becomes aware of any misuse of his account.
      </p>
      <p>
        (4) If the Customer processes personal data of third parties (e.g. his own employees or
        customers) via the Service, the Provider and Customer shall, upon request, conclude a
        separate data processing agreement (DPA) pursuant to Art. 28 GDPR for this purpose; the
        details result from the privacy policy.
      </p>

      <h2>§ 9 Availability</h2>
      <p>
        The Provider endeavors to ensure high availability of the Service but, outside of
        separate Enterprise agreements, provides no guarantee of a specific availability.
        Maintenance work will be announced in advance where reasonable.
      </p>

      <h2>§ 10 Liability</h2>
      <p>
        (1) The Provider is liable without limitation for intent and gross negligence as well as
        in accordance with the German Product Liability Act.
      </p>
      <p>
        (2) In the event of a slightly negligent breach of essential contractual obligations
        (cardinal obligations), the fulfillment of which is essential for the proper performance
        of the contract and on the observance of which the Customer may regularly rely, liability
        is limited to the foreseeable, contract-typical damage at the time the contract was
        concluded.
      </p>
      <p>
        (3) Otherwise, liability for slightly negligent breaches of duty is excluded.
      </p>
      <p>
        (4) The above limitations of liability do not apply to damage resulting from injury to
        life, body or health.
      </p>
      <p>
        (5) The Provider is not liable for damage arising from the Customer’s business or legal
        decisions based on the analyses contained in the Service, insofar as these analyses are
        expressly marked as orientation aids (§ 3) and there is no gross negligence or intent on
        the part of the Provider.
      </p>

      <h2>§ 11 Warranty</h2>
      <p>
        The statutory warranty provisions apply unless otherwise stipulated below.
      </p>

      <h2>§ 12 Amendments to these GTC</h2>
      <p>
        The Provider may amend these GTC with effect for the future if this is necessary for a
        valid reason (e.g. a change in the legal situation, the range of services or case law).
        The Customer will be informed of changes with reasonable notice and may object; in the
        event of an objection, the contract continues under the previous conditions, in which
        case the Provider may terminate the contract by ordinary notice.
      </p>

      <h2>§ 13 Final provisions</h2>
      <p>
        (1) The law of the Federal Republic of Germany applies, excluding the UN Convention on
        Contracts for the International Sale of Goods. For consumers, this only applies insofar
        as no statutory consumer protection of the state in which the consumer has his habitual
        residence is thereby withdrawn.
      </p>
      <p>
        (2) If the Customer is a merchant, a legal entity under public law or a special fund
        under public law, the place of jurisdiction is the Provider’s registered office.
      </p>
      <p>
        (3) The contract language is German.
      </p>
      <p>
        (4) Should individual provisions of these GTC be invalid, the validity of the remaining
        provisions remains unaffected.
      </p>

      <p className="text-xs text-slate-400 mt-6">As of: July 2026</p>
    </div>
  )
}

export default async function AgbPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const isEn = locale === 'en'

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-2xl mx-auto px-4 py-12">
        <Link href="/" className="text-sm text-slate-400 hover:text-slate-600 transition-colors">
          {isEn ? '← Back' : '← Zurück'}
        </Link>
        <h1 className="text-2xl font-semibold text-slate-900 mt-6 mb-8">
          {isEn ? 'General Terms and Conditions' : 'Allgemeine Geschäftsbedingungen'}
        </h1>

        {isEn ? <AgbContentEn /> : <AgbContentDe />}

        <p className="text-xs text-slate-400 mt-6 text-center">
          AI Navigator · enterprise-ai.biz ·{' '}
          <Link href="/impressum" className="hover:text-slate-600">{isEn ? 'Legal notice' : 'Impressum'}</Link>{' '}·{' '}
          <Link href="/datenschutz" className="hover:text-slate-600">{isEn ? 'Privacy' : 'Datenschutz'}</Link>{' '}·{' '}
          <Link href="/widerruf" className="hover:text-slate-600">{isEn ? 'Withdrawal' : 'Widerrufsbelehrung'}</Link>
        </p>
      </div>
    </div>
  )
}
