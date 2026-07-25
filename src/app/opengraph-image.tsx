import { ImageResponse } from 'next/og'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

export const alt = 'AI Navigator — Enterprise AI. Structured navigation.'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

// App-Icon als Daten-URI einbetten (lokale Datei zur Build-Zeit gelesen) — keine
// Netzabhängigkeit auf die noch nicht deployte Produktions-URL.
const iconSrc = `data:image/png;base64,${readFileSync(
  join(process.cwd(), 'public/brand/app-icon/app-icon-192.png'),
).toString('base64')}`

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#0F172A',
          color: '#F8F5EE',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 24, marginBottom: 32 }}>
          <img src={iconSrc} width={88} height={88} alt="" />
          <div style={{ fontSize: 56, fontWeight: 700, display: 'flex' }}>AI Navigator</div>
        </div>
        <div style={{ fontSize: 28, color: '#C7913A', display: 'flex' }}>
          Enterprise AI. Structured navigation.
        </div>
      </div>
    ),
    { ...size }
  )
}
