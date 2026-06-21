import type { Metadata } from 'next'
import './globals.css'

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
    <html lang="de" suppressHydrationWarning>
      <body className="font-sans antialiased bg-slate-50 text-slate-900">
        {children}
      </body>
    </html>
  )
}
