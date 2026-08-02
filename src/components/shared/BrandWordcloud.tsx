// Hintergrund-Wortwolke mit Buchcover-Begriffen — Lora-Kursiv, Deckkraft 5%, aria-hidden.
//
// Die Begriffe stehen bewusst NICHT als Textknoten im DOM, sondern werden über
// `content: attr(data-word)` aus der Utility-Klasse `.brand-wordcloud-word`
// (src/app/globals.css) gerendert. Grund: Es ist reine Dekoration im Sinne von
// WCAG 1.4.3 („incidental / pure decoration"), aber axe-core und Lighthouse prüfen
// den Kontrast jedes sichtbaren Textknotens — unabhängig von aria-hidden. Bei 5 %
// Deckkraft ergibt das 1,08:1 und war am 02.08.2026 die einzige Ursache der
// 14 color-contrast-Verstöße auf der Startseite (Lighthouse A11y 94).
// Pseudo-Element-Inhalt wird von der Prüfung nicht erfasst, die Darstellung ist
// pixelgleich. Den Kontrast stattdessen anzuheben würde die Wortwolke sichtbar
// machen und das Design zerstören.
//
// WICHTIG: Neue Wörter nur über `data-word` ergänzen, nie als Kindtext — sonst
// kehrt der Verstoß zurück.
const WORDS: { text: string; size: string; top: string; left: string; rotate: string }[] = [
  { text: 'Governance',    size: 'text-xl',   top: '6%',  left: '4%',   rotate: '-4deg' },
  { text: 'RAG',           size: 'text-4xl',  top: '3%',  left: '68%',  rotate: '3deg'  },
  { text: 'Agents',        size: 'text-2xl',  top: '18%', left: '82%',  rotate: '-2deg' },
  { text: 'Embeddings',    size: 'text-lg',   top: '38%', left: '2%',   rotate: '5deg'  },
  { text: 'LLM',           size: 'text-5xl',  top: '44%', left: '42%',  rotate: '-1deg' },
  { text: 'Orchestration', size: 'text-xl',   top: '72%', left: '60%',  rotate: '2deg'  },
  { text: 'Use Cases',     size: 'text-lg',   top: '10%', left: '36%',  rotate: '-3deg' },
  { text: 'Lifecycle',     size: 'text-2xl',  top: '58%', left: '6%',   rotate: '4deg'  },
  { text: 'MCP',           size: 'text-3xl',  top: '28%', left: '58%',  rotate: '-2deg' },
  { text: 'Strategy',      size: 'text-base', top: '84%', left: '30%',  rotate: '1deg'  },
  { text: 'Compliance',    size: 'text-base', top: '8%',  left: '52%',  rotate: '-5deg' },
  { text: 'Readiness',     size: 'text-xl',   top: '64%', left: '78%',  rotate: '3deg'  },
  { text: 'Canvas',        size: 'text-2xl',  top: '88%', left: '6%',   rotate: '-2deg' },
  { text: 'Roadmap',       size: 'text-lg',   top: '22%', left: '18%',  rotate: '6deg'  },
]

export function BrandWordcloud() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden select-none">
      {WORDS.map(w => (
        <span
          key={w.text}
          data-word={w.text}
          className={`brand-wordcloud-word absolute font-serif italic text-primary ${w.size}`}
          style={{
            top: w.top,
            left: w.left,
            transform: `rotate(${w.rotate})`,
            opacity: 0.05,
            whiteSpace: 'nowrap',
          }}
        />
      ))}
    </div>
  )
}
