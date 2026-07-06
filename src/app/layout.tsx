import type { Metadata } from 'next'
import { Lora } from 'next/font/google'
import './globals.css'

const lora = Lora({
  subsets: ['latin'],
  weight: ['500', '600'],
  display: 'swap',
  variable: '--font-lora',
})

export const metadata: Metadata = {
  title: { default: 'AI Navigator', template: '%s | AI Navigator' },
  description: 'Enterprise AI. Strukturiert navigiert. Strategische Frameworks für AI-Readiness, Governance und Use-Case-Priorisierung.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? 'https://enterprise-ai.biz'),
  openGraph: {
    type: 'website',
    locale: 'de_DE',
    siteName: 'AI Navigator',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de" suppressHydrationWarning className={lora.variable}>
      <body className="font-sans antialiased bg-ivory text-slate-900">
        {children}
      </body>
    </html>
  )
}
