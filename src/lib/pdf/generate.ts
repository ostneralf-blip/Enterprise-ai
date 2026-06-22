import { renderToBuffer } from '@react-pdf/renderer'
import type { ReactElement } from 'react'

interface PdfOptions {
  document: ReactElement
  filename: string
}

export async function renderPdf({ document: element }: PdfOptions): Promise<Buffer> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = await renderToBuffer(element as any)
  return Buffer.from(result)
}
