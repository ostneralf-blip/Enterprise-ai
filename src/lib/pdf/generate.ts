import type { Browser } from 'puppeteer-core'

/**
 * PDF-Generierung über Puppeteer-Core + @sparticuz/chromium.
 * Lokal nutzt Puppeteer den im System installierten Chrome (falls vorhanden),
 * auf Vercel wird die serverless-optimierte Chromium-Binary geladen.
 */
export async function getBrowser(): Promise<Browser> {
  const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL === '1'

  if (isProduction) {
    const chromium = (await import('@sparticuz/chromium-min')).default
    const puppeteer = await import('puppeteer-core')
    return puppeteer.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath(
        'https://github.com/Sparticuz/chromium/releases/download/v149.0.0/chromium-v149.0.0-pack.tar'
      ),
      headless: true,
    }) as unknown as Promise<Browser>
  }

  const puppeteer = await import('puppeteer-core')

  if (process.env.CHROME_PATH) {
    return puppeteer.launch({
      executablePath: process.env.CHROME_PATH,
      headless: true,
    }) as unknown as Promise<Browser>
  }

  try {
    const { computeExecutablePath, Browser: BrowserEnum, getInstalledBrowsers } = await import('@puppeteer/browsers')
    const path = await import('path')
    const cacheDir = path.join(process.cwd(), 'chrome')

    const installed = await getInstalledBrowsers({ cacheDir })
    const chromeInstall = installed.find(b => b.browser === BrowserEnum.CHROME)

    if (!chromeInstall) {
      throw new Error(`Kein installierter Chrome in ${cacheDir} gefunden`)
    }

    const executablePath = computeExecutablePath({
      browser: BrowserEnum.CHROME,
      buildId: chromeInstall.buildId,
      cacheDir,
    })

    return puppeteer.launch({ executablePath, headless: true }) as unknown as Promise<Browser>
  } catch (err) {
    throw new Error(
      `Lokaler Chrome für PDF-Export nicht gefunden. Bitte ausführen: ` +
      `npx @puppeteer/browsers install chrome@stable --path ./chrome. Original-Fehler: ${err instanceof Error ? err.message : String(err)}`
    )
  }
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
