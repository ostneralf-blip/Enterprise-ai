import type { Metadata } from 'next'
import { Lora } from 'next/font/google'
import './globals.css'
import { createClient } from '@/lib/supabase/server'

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

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let theme = 'book'
  if (user) {
    const { data } = await supabase
      .from('profiles')
      .select('theme')
      .eq('id', user.id)
      .maybeSingle()
    if (data?.theme) theme = data.theme
  }

  return (
    <html lang="de" suppressHydrationWarning className={lora.variable} data-theme={theme}>
      <body className="font-sans antialiased bg-ivory text-slate-900">
        {children}
      </body>
    </html>
  )
}
