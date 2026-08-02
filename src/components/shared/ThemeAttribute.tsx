import { ThemeAttributeReset } from './ThemeAttributeReset'

// Muss zur Theme-Auswahl in src/app/api/settings/route.ts und zu den
// [data-theme="…"]-Blöcken in src/app/globals.css passen.
export const VALID_THEMES = ['book', 'teal', 'indigo', 'dark'] as const
export const DEFAULT_THEME = 'book'

/**
 * Setzt das persönliche Theme des Nutzers auf `<html data-theme="…">`.
 *
 * Warum hier und nicht mehr im Root-Layout: Das Root-Layout musste dafür bei jedem
 * Request Supabase abfragen, wodurch auch alle öffentlichen Seiten dynamisch und
 * CDN-uncachebar wurden (siehe Kommentar in src/app/layout.tsx). Das Dashboard-Layout
 * lädt das Profil ohnehin und ist ohnehin `force-dynamic` — hier kostet es nichts.
 *
 * Das Inline-Skript läuft blockierend beim Parsen, also bevor der Dashboard-Inhalt
 * darunter gezeichnet wird. Dadurch gibt es kein sichtbares Umspringen der Farben
 * (dieselbe Technik wie next-themes). Ein `useEffect` allein würde erst nach dem
 * ersten Paint greifen und bei „dark" ein weißes Aufblitzen erzeugen.
 */
export function ThemeAttribute({ theme }: { theme?: string | null }) {
  // Whitelist statt direkter Einsetzung: Der Wert stammt aus der Datenbank und wird
  // in ein <script> geschrieben. Ohne Prüfung wäre das eine XSS-Senke, falls je ein
  // anderer Schreibpfad als die zod-validierte Settings-Route hinzukommt.
  const safeTheme = VALID_THEMES.includes(theme as (typeof VALID_THEMES)[number])
    ? (theme as string)
    : DEFAULT_THEME

  return (
    <>
      {safeTheme !== DEFAULT_THEME && (
        <script
          dangerouslySetInnerHTML={{
            __html: `document.documentElement.dataset.theme=${JSON.stringify(safeTheme)}`,
          }}
        />
      )}
      <ThemeAttributeReset defaultTheme={DEFAULT_THEME} />
    </>
  )
}
