// Inhaltsdaten für den Blog.
//
// Abgrenzung zum Leitfaden (WICHTIG, damit keine zwei konkurrierenden Content-Silos
// entstehen und Google die Seiten nicht als Dubletten wertet):
//   /leitfaden — zeitlose Nachschlagewerke zu einem Thema, gepflegt und aktualisiert,
//                mit „Zuletzt geprüft"-Datum, FAQPage-Schema. Beantwortet „Was ist X?".
//   /blog      — datierte Beiträge mit Standpunkt und Erfahrungsbezug, die nicht
//                fortlaufend gepflegt werden, mit Veröffentlichungsdatum und
//                BlogPosting-Schema. Beantwortet „Wie gehen wir mit X um?".
// Ein Blogbeitrag verlinkt auf die passenden Leitfäden, dupliziert sie aber nicht.
//
// Bewusst als TypeScript-Datei statt als MDX: Der ursprüngliche Plan sah MDX mit
// Frontmatter vor. Das Repo hat aber bereits eine erprobte Konvention für Langtexte
// (leitfaden-data.ts, tools-data.ts, architecture-data.ts) mit dem bilingualen
// Bi-Typ. MDX hätte eine zusätzliche Abhängigkeit, eine zweite Content-Pipeline und
// vor allem keinen typsicheren DE/EN-Zwang gebracht — die bilinguale UI ist laut
// CLAUDE.md aber Pflicht. Der Bi-Typ erzwingt beide Sprachen zur Compile-Zeit.

import type { Bi } from './leitfaden-data'

export type { Bi }

export interface BlogSection {
  heading: Bi
  /** Fließtext-Absätze. Mindestens einer pro Abschnitt. */
  paragraphs: Bi[]
  /** Optionale Aufzählung unterhalb der Absätze. */
  bullets?: Bi[]
  /** Optionaler hervorgehobener Kasten am Ende des Abschnitts. */
  callout?: { tag: Bi; body: Bi }
}

export interface BlogPost {
  slug: string
  /** ISO-Datum (YYYY-MM-DD). Steuert Sortierung im Hub und datePublished im Schema. */
  publishedAt: string
  /** ISO-Datum. Nur setzen, wenn der Beitrag inhaltlich überarbeitet wurde. */
  updatedAt?: string
  category: Bi
  eyebrow: Bi
  title: Bi
  metaDescription: Bi
  /** Anreißer: erscheint im Hub und als hervorgehobener Einstieg im Beitrag. */
  lead: Bi
  sections: BlogSection[]
  /** Ungefähre Lesedauer in Minuten — redaktionell gesetzt, nicht berechnet. */
  readingMinutes: number
  /** Interne Verlinkung: Slug aus tools-data.ts für den Abschluss-CTA. */
  ctaToolSlug?: string
  /** Interne Verlinkung: Slugs aus leitfaden-data.ts für „Passend dazu". */
  relatedGuideSlugs?: string[]
}

export const BLOG_AUTHOR = {
  name: 'Daniel Ostner',
  role: {
    de: 'Autor des Enterprise-AI-Leitfadens',
    en: 'Author of the Enterprise AI Guide',
  } satisfies Bi,
}

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: 'ki-governance-betriebsmodelle',
    publishedAt: '2026-08-02',
    category: { de: 'Governance', en: 'Governance' },
    eyebrow: { de: 'Blog · Governance', en: 'Blog · Governance' },
    title: {
      de: 'Wer entscheidet über KI? Drei Betriebsmodelle für KI-Governance',
      en: 'Who Decides on AI? Three Operating Models for AI Governance',
    },
    metaDescription: {
      de: 'Zentrales Center of Excellence, föderiertes Modell oder eingebettet in bestehende Gremien: Welches Betriebsmodell für KI-Governance zu Ihrer Organisation passt — und woran Sie die Fehlentscheidung erkennen.',
      en: 'Central center of excellence, federated model, or embedded in existing committees: which AI governance operating model fits your organization — and how to spot the wrong choice early.',
    },
    lead: {
      de: 'Die meisten Governance-Diskussionen beginnen bei Richtlinien und Formularen. Die eigentliche Weichenstellung liegt früher: Wer trifft die Entscheidung, ob ein KI-Vorhaben startet — und wer trägt die Verantwortung, wenn es schiefgeht? Drei Betriebsmodelle haben sich herausgebildet. Keines ist grundsätzlich besser, aber jedes scheitert auf seine eigene Weise.',
      en: 'Most governance discussions start with policies and forms. The real fork in the road comes earlier: who decides whether an AI initiative goes ahead — and who carries the responsibility when it goes wrong? Three operating models have emerged. None is inherently better, but each fails in its own particular way.',
    },
    readingMinutes: 7,
    ctaToolSlug: 'governance-check',
    relatedGuideSlugs: ['ai-governance-aufbauen', 'governance-entscheidungsbaum'],
    sections: [
      {
        heading: {
          de: 'Governance ist eine Organisationsfrage, keine Dokumentenfrage',
          en: 'Governance is an organizational question, not a document question',
        },
        paragraphs: [
          {
            de: 'In vielen Unternehmen entsteht KI-Governance als Nebenprodukt einer Compliance-Anforderung. Jemand fordert eine Richtlinie, jemand schreibt sie, und das Dokument wandert ins Intranet. Sechs Monate später starten trotzdem Vorhaben an der Richtlinie vorbei — nicht aus bösem Willen, sondern weil nie geklärt wurde, wer überhaupt zuständig ist.',
            en: 'In many organizations, AI governance emerges as a by-product of a compliance requirement. Someone asks for a policy, someone writes it, and the document lands on the intranet. Six months later, initiatives still start outside the policy — not out of bad faith, but because nobody ever settled who is actually accountable.',
          },
          {
            de: 'Eine Richtlinie beschreibt, was gelten soll. Ein Betriebsmodell beschreibt, wer entscheidet, wer prüft, wer eskaliert und wie lange das dauert. Ohne das Zweite bleibt das Erste folgenlos. Die Frage nach dem Betriebsmodell lässt sich auf drei Grundmuster reduzieren.',
            en: 'A policy describes what should apply. An operating model describes who decides, who reviews, who escalates, and how long that takes. Without the second, the first has no consequences. The operating model question reduces to three basic patterns.',
          },
        ],
      },
      {
        heading: {
          de: 'Modell A: Zentrales Center of Excellence',
          en: 'Model A: Central center of excellence',
        },
        paragraphs: [
          {
            de: 'Eine benannte Einheit bündelt KI-Kompetenz, bewertet jedes Vorhaben und gibt es frei. Fachbereiche bringen Ideen ein, das Zentrum entscheidet über Priorisierung, Risikoklasse und Umsetzungspfad.',
            en: 'A named unit concentrates AI expertise, assesses every initiative, and approves it. Business units submit ideas; the center decides on prioritization, risk class, and delivery path.',
          },
        ],
        bullets: [
          {
            de: 'Passt, wenn KI-Kompetenz knapp ist und Sie eine konsistente Risikobewertung über sehr unterschiedliche Fachbereiche hinweg brauchen.',
            en: 'Fits when AI expertise is scarce and you need consistent risk assessment across very different business units.',
          },
          {
            de: 'Passt, wenn regulatorischer Druck hoch ist und Nachweisführung an einer Stelle gebündelt werden soll.',
            en: 'Fits when regulatory pressure is high and evidence needs to be consolidated in one place.',
          },
          {
            de: 'Typisches Scheitern: Das Zentrum wird zum Nadelöhr. Die Warteschlange wächst, Fachbereiche weichen aus, und es entsteht eine Schatten-KI-Landschaft, die niemand mehr überblickt.',
            en: 'Typical failure: the center becomes a bottleneck. The queue grows, business units route around it, and a shadow AI landscape appears that nobody can see any more.',
          },
        ],
      },
      {
        heading: {
          de: 'Modell B: Föderiert mit zentralem Regelwerk',
          en: 'Model B: Federated with a central rulebook',
        },
        paragraphs: [
          {
            de: 'Ein kleines Kernteam definiert Regeln, Risikoklassen und Mindestanforderungen. Entscheiden dürfen die Fachbereiche selbst — solange sie sich innerhalb der Klassifizierung bewegen. Erst oberhalb einer definierten Schwelle greift die zentrale Prüfung.',
            en: 'A small core team defines rules, risk classes, and minimum requirements. Business units decide for themselves — as long as they stay within the classification. Central review only kicks in above a defined threshold.',
          },
          {
            de: 'Dieses Modell setzt voraus, dass die Schwelle wirklich trennscharf ist. Wer „hohes Risiko" nur unscharf beschreibt, erzeugt entweder Dauerbelastung des Kernteams oder stillschweigendes Durchwinken.',
            en: 'This model depends on the threshold being genuinely sharp. If "high risk" is only loosely described, you get either a permanently overloaded core team or quiet rubber-stamping.',
          },
        ],
        bullets: [
          {
            de: 'Passt, wenn Fachbereiche eigene Umsetzungskapazität haben und Geschwindigkeit zählt.',
            en: 'Fits when business units have their own delivery capacity and speed matters.',
          },
          {
            de: 'Typisches Scheitern: Die Selbsteinstufung wird zur Formsache. Fast alles landet in der niedrigsten Klasse, weil die höhere Klasse spürbar mehr Aufwand bedeutet.',
            en: 'Typical failure: self-classification becomes a formality. Almost everything ends up in the lowest class, because the higher class means noticeably more work.',
          },
        ],
        callout: {
          tag: { de: 'Praxishinweis', en: 'From practice' },
          body: {
            de: 'Prüfen Sie die Verteilung der Selbsteinstufungen nach sechs Monaten. Landen über neunzig Prozent der Vorhaben in der niedrigsten Risikoklasse, ist das selten ein Befund über die Vorhaben — sondern über die Anreize der Einstufung.',
            en: 'Review the distribution of self-classifications after six months. If more than ninety percent of initiatives land in the lowest risk class, that rarely says something about the initiatives — it says something about the incentives built into the classification.',
          },
        },
      },
      {
        heading: {
          de: 'Modell C: Eingebettet in bestehende Gremien',
          en: 'Model C: Embedded in existing committees',
        },
        paragraphs: [
          {
            de: 'KI-Vorhaben durchlaufen keine eigene Instanz, sondern die vorhandenen Wege: Architekturboard, Datenschutzprüfung, Investitionsfreigabe. Ergänzt wird lediglich um KI-spezifische Prüfpunkte in bestehenden Checklisten.',
            en: 'AI initiatives go through no dedicated body, but through existing paths: architecture board, data protection review, investment approval. The only addition is AI-specific checkpoints inside existing checklists.',
          },
          {
            de: 'Der Reiz liegt im geringen Aufbauaufwand und in der Akzeptanz — niemand muss ein neues Gremium anerkennen. Der Preis ist fehlende Sichtbarkeit: Ohne eine Stelle, die den Gesamtbestand kennt, lässt sich kaum beantworten, wie viele KI-Systeme im Haus betrieben werden.',
            en: 'The appeal is low setup cost and acceptance — nobody has to recognize a new committee. The price is missing visibility: without one place that knows the overall portfolio, it is hard to answer how many AI systems the organization actually runs.',
          },
        ],
        bullets: [
          {
            de: 'Passt bei kleiner KI-Landschaft und gut funktionierenden bestehenden Gremien.',
            en: 'Fits with a small AI landscape and existing committees that already work well.',
          },
          {
            de: 'Typisches Scheitern: Es gibt kein Verzeichnis. Bei der ersten Nachfrage von außen kann niemand sagen, welche Systeme betroffen sind.',
            en: 'Typical failure: there is no inventory. At the first external inquiry, nobody can say which systems are affected.',
          },
        ],
      },
      {
        heading: {
          de: 'Woran Sie das passende Modell erkennen',
          en: 'How to recognize the model that fits',
        },
        paragraphs: [
          {
            de: 'Die Wahl hängt weniger an der Unternehmensgröße als an zwei Größen: der Verteilung der Umsetzungskompetenz und der Höhe des regulatorischen Drucks. Liegt die Kompetenz zentral und der Druck hoch, ist Modell A folgerichtig. Liegt Kompetenz verteilt vor und der Druck ist hoch, führt Modell B weiter. Ist beides gering, genügt zunächst Modell C — solange ein Verzeichnis mitgeführt wird.',
            en: 'The choice depends less on company size than on two variables: how delivery capability is distributed, and how high regulatory pressure is. Central capability plus high pressure makes model A consistent. Distributed capability plus high pressure points to model B. If both are low, model C is enough for now — as long as an inventory is maintained.',
          },
          {
            de: 'Wichtiger als die erste Wahl ist, das Modell überhaupt explizit zu benennen. Die teuerste Variante ist das unausgesprochene Modell, bei dem jeder Beteiligte eine andere Annahme darüber hat, wer zuständig ist.',
            en: 'More important than the initial choice is naming the model explicitly at all. The most expensive variant is the unspoken model, where every participant holds a different assumption about who is accountable.',
          },
        ],
        callout: {
          tag: { de: 'Was in jedem Modell gleich bleibt', en: 'What stays the same in every model' },
          body: {
            de: 'Drei Dinge müssen unabhängig vom Betriebsmodell geklärt sein: ein Verzeichnis aller KI-Systeme, eine benannte verantwortliche Person je System und ein definierter Eskalationsweg. Fehlt eines davon, hilft auch das durchdachteste Modell nicht.',
            en: 'Three things must be settled regardless of operating model: an inventory of all AI systems, a named accountable person per system, and a defined escalation path. If one of them is missing, even the best-designed model will not help.',
          },
        },
      },
    ],
  },
]

export function getBlogPost(slug: string): BlogPost | undefined {
  return BLOG_POSTS.find((post) => post.slug === slug)
}

/** Beiträge absteigend nach Veröffentlichungsdatum (neueste zuerst). */
export function getSortedBlogPosts(): BlogPost[] {
  return [...BLOG_POSTS].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
}
