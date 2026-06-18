import type { Browser } from 'puppeteer-core'

/**
 * PDF-Generierung über Puppeteer-Core + @sparticuz/chromium.
 * Lokal nutzt Puppeteer den im System installierten Chrome (falls vorhanden),
 * auf Vercel wird die serverless-optimierte Chromium-Binary geladen.
 */
export async function getBrowser(): Promise<Browser> {
  const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL === '1'

  if (isProduction) {
    const chromium = (await import('@sparticuz/chromium')).default
    const puppeteer = await import('puppeteer-core')
    return puppeteer.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath(),
      headless: true,
    }) as unknown as Promise<Browser>
  }

  const puppeteer = await import('puppeteer-core')
  return puppeteer.launch({
    executablePath: process.env.CHROME_PATH || '/usr/bin/google-chrome',
    headless: true,
  }) as unknown as Promise<Browser>
}

interface PdfOptions {
  html: string
  filename: string
}

export async function renderPdf({ html }: PdfOptions): Promise<Buffer> {
  const browser = await getBrowser()
  try {
    const page = await browser.newPage()
    await page.setContent(html, { waitUntil: 'load' })
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '20mm', bottom: '20mm', left: '15mm', right: '15mm' },
    })
    return Buffer.from(pdf)
  } finally {
    await browser.close()
  }
}
