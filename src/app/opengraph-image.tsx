import { ImageResponse } from 'next/og'

export const alt = 'AI Navigator — Enterprise AI. Structured navigation.'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

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
          backgroundColor: '#0F1B2D',
          color: '#FDFDFB',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 32 }}>
          <div
            style={{
              display: 'flex',
              width: 72,
              height: 72,
              borderRadius: 16,
              backgroundColor: '#2563EB',
              color: '#fff',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 40,
              fontWeight: 700,
            }}
          >
            N
          </div>
          <div style={{ fontSize: 52, fontWeight: 700, display: 'flex' }}>AI Navigator</div>
        </div>
        <div style={{ fontSize: 28, color: '#C6CFDA', display: 'flex' }}>
          Enterprise AI. Structured navigation.
        </div>
      </div>
    ),
    { ...size }
  )
}
