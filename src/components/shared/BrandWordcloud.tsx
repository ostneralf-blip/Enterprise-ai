// Hintergrund-Wortwolke mit Buchcover-Begriffen — Lora-Kursiv, Deckkraft 5%, aria-hidden
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
          className={`absolute font-serif italic text-primary ${w.size}`}
          style={{
            top: w.top,
            left: w.left,
            transform: `rotate(${w.rotate})`,
            opacity: 0.05,
            whiteSpace: 'nowrap',
          }}
        >
          {w.text}
        </span>
      ))}
    </div>
  )
}
