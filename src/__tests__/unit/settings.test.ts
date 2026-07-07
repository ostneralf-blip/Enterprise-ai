import { z } from 'zod'
import { readFileSync } from 'fs'
import { join } from 'path'

const ProfileUpdateSchema = z.object({
  full_name: z.string().min(1).max(100),
  company: z.string().max(100).nullable().optional(),
  role: z.string().max(100).nullable().optional(),
})

describe('Settings: Profil-Update-Schema', () => {
  it('akzeptiert vollständige valide Eingabe', () => {
    expect(ProfileUpdateSchema.safeParse({
      full_name: 'Max Mustermann',
      company: 'Mustermann GmbH',
      role: 'CTO',
    }).success).toBe(true)
  })

  it('akzeptiert Eingabe ohne optionale Felder', () => {
    expect(ProfileUpdateSchema.safeParse({ full_name: 'Maria Muster' }).success).toBe(true)
  })

  it('akzeptiert null für company und role', () => {
    expect(ProfileUpdateSchema.safeParse({ full_name: 'Max', company: null, role: null }).success).toBe(true)
  })

  it('lehnt leeren full_name ab', () => {
    expect(ProfileUpdateSchema.safeParse({ full_name: '' }).success).toBe(false)
  })

  it('lehnt full_name > 100 Zeichen ab (DoS-Schutz)', () => {
    expect(ProfileUpdateSchema.safeParse({ full_name: 'x'.repeat(101) }).success).toBe(false)
  })

  it('lehnt company > 100 Zeichen ab', () => {
    expect(ProfileUpdateSchema.safeParse({ full_name: 'Max', company: 'x'.repeat(101) }).success).toBe(false)
  })

  it('lehnt role > 100 Zeichen ab', () => {
    expect(ProfileUpdateSchema.safeParse({ full_name: 'Max', role: 'x'.repeat(101) }).success).toBe(false)
  })

  it('lehnt fehlendes full_name ab', () => {
    expect(ProfileUpdateSchema.safeParse({ company: 'Firma' }).success).toBe(false)
  })

  it('lässt XSS-Payload durch (Escaping ist Aufgabe der Ausgabe, nicht des Schemas)', () => {
    const r = ProfileUpdateSchema.safeParse({ full_name: '<script>alert(1)</script>' })
    expect(r.success).toBe(true)
  })
})

describe('Theme-Picker: handleThemeChange', () => {
  it('setzt data-theme via documentElement beim Theme-Wechsel', () => {
    const source = readFileSync(join(process.cwd(), 'src/app/[locale]/(dashboard)/settings/SettingsPageClient.tsx'), 'utf-8')
    expect(source).toContain("documentElement.setAttribute('data-theme'")
  })

  it('Theme-API-Aufruf enthält theme-Feld im Body', () => {
    const source = readFileSync(join(process.cwd(), 'src/app/[locale]/(dashboard)/settings/SettingsPageClient.tsx'), 'utf-8')
    expect(source).toContain("theme: t")
  })

  it('THEMES-Konstante enthält alle 4 Theme-IDs', () => {
    const source = readFileSync(join(process.cwd(), 'src/app/[locale]/(dashboard)/settings/SettingsPageClient.tsx'), 'utf-8')
    expect(source).toContain("'book'")
    expect(source).toContain("'teal'")
    expect(source).toContain("'indigo'")
    expect(source).toContain("'dark'")
  })
})
