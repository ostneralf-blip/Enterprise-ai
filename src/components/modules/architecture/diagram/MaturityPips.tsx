// Reifegrad theme-sicher: 4 Pips, Füllzahl = level (1..4). Neutrale Tinte;
// Primary-Akzent NUR bei level 4 („produktiv"). Kein Farbton-Mehrfachcode — überlebt
// Dark-/Book-Theme und Farbsehschwäche, weil die Ordnung über den Füllgrad kodiert ist.
const LABELS = ['geplant', 'evaluiert', 'pilot', 'produktiv'] as const

export function MaturityPips({ level }: { level: 1 | 2 | 3 | 4 }) {
  return (
    <span className="inline-flex items-center gap-0.5" role="img" aria-label={`Reifegrad: ${LABELS[level - 1]}`}>
      {[1, 2, 3, 4].map(i => (
        <span key={i} className={
          i > level ? 'w-2 h-2 rounded-sm bg-line'
          : level === 4 ? 'w-2 h-2 rounded-sm bg-primary'
          : 'w-2 h-2 rounded-sm bg-ink-secondary'
        } />
      ))}
    </span>
  )
}
