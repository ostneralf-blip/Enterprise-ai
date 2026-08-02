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
  const canonical = isEn ? `${BASE}/en/widerruf` : `${BASE}/widerruf`
  return {
    title: isEn ? 'Right of withdrawal' : 'Widerrufsbelehrung',
    description: isEn
      ? 'Right of withdrawal notice and sample withdrawal form for consumers (German consumer law).'
      : 'Widerrufsbelehrung und Muster-Widerrufsformular für Verbraucher.',
    alternates: {
      canonical,
      languages: {
        de: `${BASE}/widerruf`,
        en: `${BASE}/en/widerruf`,
        'x-default': `${BASE}/widerruf`,
      },
    },
  }
}

function WiderrufContentDe() {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 prose prose-slate prose-sm max-w-none">

      <h2>Widerrufsrecht</h2>
      <p>
        Sie haben das Recht, binnen vierzehn Tagen ohne Angabe von Gründen diesen Vertrag
        zu widerrufen. Die Widerrufsfrist beträgt vierzehn Tage ab dem Tag des
        Vertragsschlusses.
      </p>
      <p>
        Um Ihr Widerrufsrecht auszuüben, müssen Sie uns (Daniel Ostner, Hasenheide 8b,
        25474 Ellerbek, E-Mail:{' '}
        <a href="mailto:webmaster@enterprise-ai.biz">webmaster@enterprise-ai.biz</a>) mittels
        einer eindeutigen Erklärung (z. B. per Post versandter Brief oder E-Mail) über
        Ihren Entschluss, diesen Vertrag zu widerrufen, informieren. Sie können dafür das
        beigefügte Muster-Widerrufsformular verwenden, das jedoch nicht vorgeschrieben ist.
      </p>
      <p>
        Zur Wahrung der Widerrufsfrist reicht es aus, dass Sie die Mitteilung über die
        Ausübung des Widerrufsrechts vor Ablauf der Widerrufsfrist absenden.
      </p>

      <h2>Folgen des Widerrufs</h2>
      <p>
        Im Falle eines wirksamen Widerrufs sind die beiderseits empfangenen Leistungen
        zurückzugewähren. Haben Sie verlangt, dass die Dienstleistung während der
        Widerrufsfrist beginnen soll, so haben Sie uns einen angemessenen Betrag zu zahlen,
        der dem Anteil der bis zu dem Zeitpunkt, in dem Sie uns von der Ausübung des
        Widerrufsrechts hinsichtlich dieses Vertrags unterrichten, bereits erbrachten
        Dienstleistungen entspricht.
      </p>

      <h2>Hinweis zum vorzeitigen Erlöschen</h2>
      <p>
        Ihr Widerrufsrecht erlischt bei Verträgen über die Bereitstellung digitaler
        Dienstleistungen vorzeitig, wenn wir mit der Ausführung erst begonnen haben,
        nachdem Sie ausdrücklich zugestimmt haben, dass wir vor Ablauf der Widerrufsfrist
        mit der Ausführung beginnen, und Sie Ihre Kenntnis davon bestätigt haben, dass Sie
        durch Ihre Zustimmung Ihr Widerrufsrecht verlieren.
      </p>

      <hr />

      <h2>Muster-Widerrufsformular</h2>
      <p className="text-slate-500 text-xs">
        (Wenn Sie den Vertrag widerrufen wollen, füllen Sie bitte dieses Formular aus und
        senden Sie es zurück.)
      </p>

      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 not-prose text-sm text-slate-700 space-y-3">
        <p>
          <strong>An:</strong><br />
          Daniel Ostner<br />
          Hasenheide 8b, 25474 Ellerbek<br />
          <a href="mailto:webmaster@enterprise-ai.biz" className="text-primary hover:underline">
            webmaster@enterprise-ai.biz
          </a>
        </p>
        <p>
          Hiermit widerrufe(n) ich/wir den von mir/uns abgeschlossenen Vertrag über die
          Nutzung des Dienstes „AI Navigator“
        </p>
        <div className="space-y-2 pt-1">
          <p>Bestellt am: <span className="inline-block w-40 border-b border-slate-400">&nbsp;</span></p>
          <p>Name des/der Verbraucher(s): <span className="inline-block w-48 border-b border-slate-400">&nbsp;</span></p>
          <p>Anschrift des/der Verbraucher(s): <span className="inline-block w-48 border-b border-slate-400">&nbsp;</span></p>
          <p>Datum: <span className="inline-block w-32 border-b border-slate-400">&nbsp;</span></p>
        </div>
      </div>

      <p className="text-xs text-slate-400 mt-6">Stand: Juli 2026</p>
    </div>
  )
}

function WiderrufContentEn() {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 prose prose-slate prose-sm max-w-none">
      <p className="text-xs text-slate-500 not-prose mb-4">
        This is a courtesy translation of the German „Widerrufsbelehrung“. The legally
        authoritative version is the{' '}
        <Link href="/widerruf" className="text-primary hover:underline">German version</Link>.
      </p>

      <h2>Right of withdrawal</h2>
      <p>
        You have the right to withdraw from this contract within fourteen days without giving any
        reason. The withdrawal period is fourteen days from the day the contract was concluded.
      </p>
      <p>
        To exercise your right of withdrawal, you must inform us (Daniel Ostner, Hasenheide 8b,
        25474 Ellerbek, Germany, e-mail:{' '}
        <a href="mailto:webmaster@enterprise-ai.biz">webmaster@enterprise-ai.biz</a>) of your
        decision to withdraw from this contract by means of a clear statement (e.g. a letter sent
        by post or an e-mail). You may use the attached sample withdrawal form for this purpose,
        but this is not mandatory.
      </p>
      <p>
        To meet the withdrawal deadline, it is sufficient for you to send your communication
        concerning the exercise of the right of withdrawal before the withdrawal period has
        expired.
      </p>

      <h2>Consequences of withdrawal</h2>
      <p>
        In the event of an effective withdrawal, the services received by both parties are to be
        returned. If you requested that the service should begin during the withdrawal period, you
        must pay us a reasonable amount corresponding to the proportion of the services already
        provided up to the point in time at which you notify us of the exercise of the right of
        withdrawal with regard to this contract.
      </p>

      <h2>Note on premature expiry</h2>
      <p>
        For contracts on the provision of digital services, your right of withdrawal expires
        prematurely if we have begun performance only after you have expressly consented to us
        beginning performance before the end of the withdrawal period and you have confirmed your
        knowledge that, by giving your consent, you lose your right of withdrawal.
      </p>

      <hr />

      <h2>Sample withdrawal form</h2>
      <p className="text-slate-500 text-xs">
        (If you wish to withdraw from the contract, please complete this form and return it.)
      </p>

      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 not-prose text-sm text-slate-700 space-y-3">
        <p>
          <strong>To:</strong><br />
          Daniel Ostner<br />
          Hasenheide 8b, 25474 Ellerbek, Germany<br />
          <a href="mailto:webmaster@enterprise-ai.biz" className="text-primary hover:underline">
            webmaster@enterprise-ai.biz
          </a>
        </p>
        <p>
          I/we hereby withdraw from the contract concluded by me/us for the use of the “AI
          Navigator” service
        </p>
        <div className="space-y-2 pt-1">
          <p>Ordered on: <span className="inline-block w-40 border-b border-slate-400">&nbsp;</span></p>
          <p>Name of consumer(s): <span className="inline-block w-48 border-b border-slate-400">&nbsp;</span></p>
          <p>Address of consumer(s): <span className="inline-block w-48 border-b border-slate-400">&nbsp;</span></p>
          <p>Date: <span className="inline-block w-32 border-b border-slate-400">&nbsp;</span></p>
        </div>
      </div>

      <p className="text-xs text-slate-400 mt-6">As of: July 2026</p>
    </div>
  )
}

export default async function WiderrufPage({
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
      <div className="max-w-2xl mx-auto px-4 py-12">
        <Link href="/" className="text-sm text-slate-500 hover:text-slate-700 transition-colors">
          {isEn ? '← Back' : '← Zurück'}
        </Link>
        <h1 className="text-2xl font-semibold text-slate-900 mt-6 mb-8">
          {isEn ? 'Right of withdrawal' : 'Widerrufsbelehrung'}
        </h1>

        {isEn ? <WiderrufContentEn /> : <WiderrufContentDe />}

        <p className="text-xs text-slate-400 mt-6 text-center">
          AI Navigator · enterprise-ai.biz ·{' '}
          <Link href="/impressum" className="hover:text-slate-600">{isEn ? 'Legal notice' : 'Impressum'}</Link>{' '}·{' '}
          <Link href="/datenschutz" className="hover:text-slate-600">{isEn ? 'Privacy' : 'Datenschutz'}</Link>{' '}·{' '}
          <Link href="/agb" className="hover:text-slate-600">{isEn ? 'Terms' : 'AGB'}</Link>
        </p>
      </div>
    </main>
  )
}
