// Content data for the Leitfaden (Guide) hub, all 8 guide articles, and the pricing page.
// Sourced from docs/design/*-mockup.html (DE) and docs/design/en/*-mockup.html (EN).
// Kept separate from next-intl messages/*.json (which holds short reusable UI strings) —
// this is long-form article content, following the same convention as
// src/config/architecture-data.ts / compliance-data.ts / assessment-data.ts.

export type Locale = 'de' | 'en'

export interface Bi {
  de: string
  en: string
}

export interface GuideCard {
  tag: Bi
  title: Bi
  body: Bi
}

export interface GuideFact {
  label: Bi
  body: Bi
}

export interface GuideStat {
  n: Bi
  l: Bi
}

export interface GuideSection {
  heading: Bi
  intro?: Bi
  cards?: GuideCard[]
  facts?: GuideFact[]
  stats?: GuideStat[]
  extraBody?: Bi
  patternBox?: { tag: Bi; body: Bi }
}

export interface GuideFaq {
  q: Bi
  a: Bi
}

export interface Guide {
  slug: string
  category: Bi
  navLabel: Bi
  title: Bi
  metaDescription: Bi
  eyebrow: Bi
  kurzantwort: Bi
  sections: GuideSection[]
  glossary: Bi[]
  ctaBand: { title: Bi; body: Bi; linkLabel: Bi }
  faq: GuideFaq[]
  bookChapter: Bi
  relatedSlugs: string[]
}

export const AMAZON_BOOK_URL = 'https://www.amazon.de/dp/B0H6GN7LJQ'

// „Zuletzt geprüft"-Datum für die Guide-Seiten (GEO-Format, Issue #220).
// ISO-Datum; wird auf jeder Guide-Seite als Vertrauens-/Aktualitätssignal angezeigt.
// Bei inhaltlicher Überarbeitung eines Guides hochziehen.
export const GUIDES_REVIEWED_AT = '2026-07-23'

export const GUIDES: Guide[] = [
  {
    slug: 'warum-ai-projekte-scheitern',
    category: { de: 'AI-Readiness', en: 'AI Readiness' },
    navLabel: { de: 'Warum AI-Projekte scheitern', en: 'Why AI Projects Fail' },
    title: {
      de: 'Warum scheitern die meisten AI-Projekte wirklich?',
      en: 'Why Do Most AI Projects Really Fail?',
    },
    metaDescription: {
      de: '88 % der Unternehmen nutzen AI, nur 5,5 % erzielen messbaren ROI. Die drei echten Ursachen: fehlende Datenbasis, kein Workflow-Redesign, fehlende Governance.',
      en: '88% of companies use AI, only 5.5% see measurable ROI. The three real causes: missing data foundations, no workflow redesign, missing governance.',
    },
    eyebrow: { de: 'Leitfaden · Readiness', en: 'Guide · Readiness' },
    kurzantwort: {
      de: '88 % der Unternehmen setzen KI produktiv ein, nur 5,5 % erzielen messbaren finanziellen Rückfluss. Das liegt fast nie am Modell: fehlende Datenbasis, fehlendes Workflow-Redesign und fehlende Governance sind die drei eigentlichen Ursachen. Der stärkste einzelne Erfolgsprädiktor ist laut McKinsey nicht die Technologie, sondern das Workflow-Redesign vor der Einführung.',
      en: "88% of companies use AI productively, but only 5.5% see a measurable financial return. It's almost never the model: missing data foundations, no workflow redesign, and missing governance are the three real causes. According to McKinsey, the strongest single success predictor isn't technology — it's workflow redesign before rollout.",
    },
    sections: [
      {
        heading: { de: 'Was steckt hinter der Scheiternsrate wirklich?', en: "What's really behind the failure rate?" },
        intro: {
          de: '88 % der Unternehmen setzen KI in mindestens einer Funktion ein, nur 5,5 % erzielen messbaren finanziellen Rückfluss. Das ist kein Widerspruch, sondern der Stand der Enterprise-AI 2026. Und es ist kein Technologieproblem — es ist ein Führungsproblem, das sich in drei konkreten Ursachen zeigt.',
          en: "88% of companies use AI in at least one function, but only 5.5% see a measurable financial return. That's not a contradiction — it's the state of enterprise AI in 2026. And it isn't a technology problem, it's a leadership problem that shows up as three concrete causes.",
        },
        cards: [
          { tag: { de: 'Fehlende Datenbasis', en: 'Missing data foundation' }, title: { de: '60 % der Projekte abgebrochen', en: '60% of projects abandoned' }, body: { de: 'Jahrzehnte gewachsene Systeme und Silos — Daten existieren, sind aber nicht zugreifbar, nicht sauber, nicht semantisch verbunden.', en: "Systems and silos grown over decades — data exists, but isn't accessible, clean, or semantically connected." } },
          { tag: { de: 'Kein Workflow-Redesign', en: 'No workflow redesign' }, title: { de: 'Nur 25 % liefern erwarteten ROI', en: 'Only 25% deliver expected ROI' }, body: { de: 'AI wird auf bestehende Prozesse gelegt statt Prozesse neu zu gestalten. Workflow-Redesign schlägt Technologieauswahl.', en: 'AI gets bolted onto existing processes instead of redesigning them. Workflow redesign beats technology choice.' } },
          { tag: { de: 'Fehlende Governance', en: 'Missing governance' }, title: { de: '46 % aller PoCs verworfen', en: '46% of all PoCs discarded' }, body: { de: 'Kein klares Ownership, keine Risikobewertung. Projekte enden nicht sichtbar — sie verdampfen in Zuständigkeitslücken.', en: 'No clear ownership, no risk assessment. Projects don’t end visibly — they evaporate into ownership gaps.' } },
        ],
        patternBox: {
          tag: { de: 'Anti-Pattern', en: 'Anti-pattern' },
          body: {
            de: 'Das teuerste Missverständnis: AI ist kein IT-Projekt. Es ist ein Business-Transformationsprojekt mit technologischer Komponente. Unternehmen, die es als IT-Projekt behandeln, bauen die Infrastruktur — aber realisieren nie den Wert.',
            en: 'The most expensive misunderstanding: AI is not an IT project. It is a business transformation project with a technology component. Companies that treat it as an IT project build the infrastructure — but never realize the value.',
          },
        },
      },
      {
        heading: { de: 'Wie sieht der Markt 2026 tatsächlich aus?', en: 'What does the market actually look like in 2026?' },
        intro: {
          de: 'AI hat die Experimentierphase verlassen: Die globalen Investitionen haben 2026 die 300-Milliarden-Dollar-Marke überschritten, Budgets verschieben sich von Experiment zu Linienkosten. Die Frage ist nicht mehr, ob AI Wert schafft, sondern wie schnell — und wie stabil dieser Wert über mehrere Change-Zyklen bleibt.',
          en: "AI has left the experimentation phase: global investment passed $300 billion in 2026, and budgets are shifting from experiment to run-cost. The question is no longer whether AI creates value, but how fast — and how durable that value stays across multiple change cycles.",
        },
        stats: [
          { n: { de: '301 Mrd. $', en: '$301B' }, l: { de: 'Globale AI-Investitionen 2026', en: 'Global AI investment in 2026' } },
          { n: { de: '88 %', en: '88%' }, l: { de: 'Unternehmen nutzen AI produktiv', en: 'of companies use AI productively' } },
          { n: { de: 'Nur 28 %', en: 'Only 28%' }, l: { de: 'bezeichnen ihre Adoption als „reif"', en: 'call their adoption "mature"' } },
          { n: { de: '5,8×', en: '5.8x' }, l: { de: 'Ø ROI nach 14 Monaten Produktion', en: 'avg. ROI after 14 months in production' } },
        ],
        extraBody: {
          de: 'Die Zahlen erzählen zwei parallele Geschichten: eine breite Adoption ohne Tiefe — und eine schmale Gruppe, die AI systematisch skaliert und damit einen strukturellen, kaum kopierbaren Vorteil aufbaut.',
          en: 'The numbers tell two parallel stories: broad adoption without depth — and a narrow group that scales AI systematically, building a structural, hard-to-copy advantage.',
        },
        facts: [
          { label: { de: '70–85 %', en: '70–85%' }, body: { de: 'der AI-Projekte scheitern insgesamt — Technologie ist dabei selten das Problem.', en: 'of AI projects fail overall — technology is rarely the problem.' } },
          { label: { de: 'Nur 12 %', en: 'Only 12%' }, body: { de: 'der Unternehmen haben tatsächlich AI-ready Daten. Datenstrategie ist Voraussetzung, kein Begleitthema.', en: 'of companies actually have AI-ready data. Data strategy is a prerequisite, not a side topic.' } },
          { label: { de: '47 %', en: '47%' }, body: { de: 'der Mitarbeiter erwarten AI-Einsatz für über 30 % ihrer Arbeit — Kompetenzaufbau ist dringlicher als Tool-Auswahl.', en: 'of employees expect AI to handle over 30% of their work — building skills is more urgent than picking tools.' } },
        ],
      },
      {
        heading: { de: 'Welche technischen Bausteine braucht eine produktionsreife AI-Architektur?', en: 'What technical building blocks does a production-ready AI architecture need?' },
        intro: {
          de: 'Scheitern hat auch eine technische Seite: Wer die fünf Kernbausteine der AI-Schicht nicht sauber trennt, produziert Halluzinationen und Systeme, die niemand mehr sicher austauschen kann. Die gute Nachricht — die Architektur ist vendor-neutral aufbaubar, kein Anbieter ist dabei zwingend vorgeschrieben.',
          en: "Failure also has a technical side: if you don't cleanly separate the five core building blocks of the AI layer, you get hallucinations and systems nobody can safely swap out. The good news — the architecture can be built vendor-neutral; no single vendor is mandatory.",
        },
        stats: [
          { n: { de: '2–3', en: '2–3' }, l: { de: 'Modelle im Schnitt pro Produktivsystem im Einsatz', en: 'models used per production system on average' } },
          { n: { de: '~6 Monate', en: '~6 months' }, l: { de: 'bis sich die Modell-Rangliste neu sortiert', en: 'until the model leaderboard reshuffles' } },
          { n: { de: 'Dutzende', en: 'Dozens' }, l: { de: 'produktionsreife Foundation-Modelle, proprietär und Open-Source', en: 'of production-ready foundation models, proprietary and open-source' } },
          { n: { de: '5 Bausteine', en: '5 building blocks' }, l: { de: 'bilden die AI-Core-Schicht einer Plattform', en: 'form the AI core layer of a platform' } },
        ],
        cards: [
          { tag: { de: 'Baustein 1', en: 'Building block 1' }, title: { de: 'LLM Runtime', en: 'LLM Runtime' }, body: { de: 'Führt das Sprachmodell aus. Ohne Model Router entsteht eine Single-Model-Abhängigkeit ohne Fallback bei Ausfall oder Kostenspitzen.', en: 'Runs the language model. Without a model router you get a single-model dependency with no fallback for outages or cost spikes.' } },
          { tag: { de: 'Baustein 2', en: 'Building block 2' }, title: { de: 'RAG-Pipeline', en: 'RAG pipeline' }, body: { de: 'Reichert Modellantworten mit unternehmenseigenen Fakten an. Reduziert Halluzinationen, erhöht Aktualität und Domänenpräzision.', en: 'Enriches model answers with company-owned facts. Reduces hallucinations, improves freshness and domain precision.' } },
          { tag: { de: 'Baustein 3', en: 'Building block 3' }, title: { de: 'Vector Store', en: 'Vector store' }, body: { de: 'Speichert Embeddings für die semantische Suche. Ermöglicht Millisekunden-Retrieval auch bei Millionen von Dokumenten.', en: 'Stores embeddings for semantic search, enabling millisecond retrieval even across millions of documents.' } },
          { tag: { de: 'Baustein 4', en: 'Building block 4' }, title: { de: 'Prompt Engine', en: 'Prompt engine' }, body: { de: 'Versioniert System-Prompts und trennt sie sauber vom Anwendungscode — Grundlage für nachvollziehbares, wartbares Verhalten.', en: 'Versions system prompts and cleanly separates them from application code — the basis for traceable, maintainable behavior.' } },
          { tag: { de: 'Baustein 5', en: 'Building block 5' }, title: { de: 'Eval & Monitoring', en: 'Eval & monitoring' }, body: { de: 'Erkennt Halluzinationen und Modell-Drift kontinuierlich, nicht erst wenn Endnutzer sie in Produktion melden.', en: 'Detects hallucinations and model drift continuously, not only once end users report them in production.' } },
        ],
        patternBox: {
          tag: { de: 'Anti-Pattern', en: 'Anti-pattern' },
          body: {
            de: 'Fehlkonfigurationen genau an diesen fünf Schnittstellen sind die häufigste technische Ursache für Halluzinationen und inkonsistente Modellantworten — nicht die Wahl des Modells selbst. Wer Eval & Monitoring als Nachgedanke behandelt, entdeckt Qualitätsprobleme erst durch Beschwerden aus dem Fachbereich.',
            en: 'Misconfigurations at exactly these five interfaces are the most common technical cause of hallucinations and inconsistent model answers — not the choice of model itself. Treating eval & monitoring as an afterthought means quality problems only surface through complaints from the business.',
          },
        },
      },
    ],
    glossary: [
      { de: 'Pilot Purgatory', en: 'Pilot Purgatory' },
      { de: 'Workflow-Redesign', en: 'Workflow Redesign' },
      { de: 'RAG', en: 'RAG' },
      { de: 'Vector Store', en: 'Vector Store' },
      { de: 'Model Router', en: 'Model Router' },
    ],
    ctaBand: {
      title: { de: 'Nicht wissen, wo Sie anfangen sollen? Wir zeigen es.', en: "Don't know where to start? We'll show you." },
      body: { de: 'Der geführte Pfad nimmt Sie Schritt für Schritt durch Readiness, Use Case und Governance — in der Reihenfolge, die Scheitern verhindert.', en: 'The guided path takes you step by step through readiness, use case, and governance — in the order that prevents failure.' },
      linkLabel: { de: 'Geführten Pfad starten →', en: 'Start the guided path →' },
    },
    faq: [
      { q: { de: 'Liegt das Scheitern wirklich nicht an der KI-Technologie selbst?', en: "Is the failure really not about the AI technology itself?" }, a: { de: 'Kaum. Die drei häufigsten Ursachen sind fehlende Datenbasis, fehlendes Workflow-Redesign und fehlende Governance — nicht die Modellqualität.', en: 'Rarely. The three most common causes are missing data foundations, no workflow redesign, and missing governance — not model quality.' } },
      { q: { de: 'Was unterscheidet die 5,5 %, die messbaren ROI erzielen?', en: 'What sets apart the 5.5% who see measurable ROI?' }, a: { de: 'Sie behandeln AI als Business-Transformationsprojekt, nicht als IT-Projekt — und gestalten Workflows neu, bevor sie Technologie auswählen.', en: 'They treat AI as a business transformation project, not an IT project — and redesign workflows before picking technology.' } },
      { q: { de: 'Wie groß ist das Risiko, im „Pilot Purgatory" stecken zu bleiben?', en: 'How big is the risk of getting stuck in "Pilot Purgatory"?' }, a: { de: 'Hoch: Zwei Drittel aller AI-Initiativen bleiben in Pilotprojekten hängen, die nie zur Produktion skalieren.', en: 'High: two-thirds of all AI initiatives get stuck in pilots that never scale to production.' } },
      { q: { de: 'Reicht es, jetzt einfach mehr zu investieren?', en: 'Is it enough to just invest more right now?' }, a: { de: 'Nein — die globalen Investitionen haben 2026 bereits 301 Milliarden Dollar überschritten, während nur 28 % ihre Adoption als „reif" bezeichnen. Geld allein löst das Problem nicht.', en: "No — global investment already passed $301 billion in 2026, while only 28% call their adoption \"mature\". Money alone doesn't solve the problem." } },
    ],
    bookChapter: { de: 'Kapitel 1', en: 'Chapter 1' },
    relatedSlugs: ['ai-readiness-quick-scan', 'ai-reifegrad-starter-scaler-transformer'],
  },
  {
    slug: 'ai-readiness-quick-scan',
    category: { de: 'AI-Readiness', en: 'AI Readiness' },
    navLabel: { de: 'AI-Readiness Quick Scan', en: 'AI Readiness Quick Scan' },
    title: {
      de: 'Wie AI-ready ist Ihre Organisation? Die 6 Dimensionen im 10-Minuten-Quick-Scan',
      en: 'How AI-Ready Is Your Organization? The 6 Dimensions in a 10-Minute Quick Scan',
    },
    metaDescription: {
      de: 'AI-Readiness hat sechs unabhängige Dimensionen. Datenqualität allein steht hinter 85 % aller abgebrochenen Projekte. Der 10-Minuten-Quick-Scan zeigt, wo Sie stehen.',
      en: 'AI readiness has six independent dimensions. Data quality alone is behind 85% of abandoned projects. The 10-minute quick scan shows where you stand.',
    },
    eyebrow: { de: 'Leitfaden · Readiness', en: 'Guide · Readiness' },
    kurzantwort: {
      de: 'AI-Readiness ist kein einzelner Wert, sondern sechs unabhängige Dimensionen: Daten, Infrastruktur, Skills, Prozesse, Governance, Kultur. Schwäche in nur einer davon reicht, um ein AI-Projekt scheitern zu lassen — Datenqualität allein steht hinter 85 % aller abgebrochenen Projekte. Der 10-Minuten-Quick-Scan zeigt ehrlich, wo Sie stehen, bevor Sie investieren.',
      en: "AI readiness isn't a single number — it's six independent dimensions: data, infrastructure, skills, processes, governance, culture. Weakness in just one is enough to sink an AI project — data quality alone is behind 85% of abandoned projects. The 10-minute quick scan shows honestly where you stand before you invest.",
    },
    sections: [
      {
        heading: { de: 'Welche sechs Dimensionen entscheiden über AI-Readiness?', en: 'Which six dimensions determine AI readiness?' },
        intro: {
          de: 'Ein Unternehmen kann exzellente Daten haben und trotzdem an fehlender Governance scheitern. Es kann modernste Infrastruktur betreiben und an unveränderten Workflows hängen bleiben. Jede der sechs Dimensionen ist unabhängig zu bewerten — genau eine schwache Dimension genügt, um ein sonst solides AI-Projekt auszubremsen.',
          en: 'A company can have excellent data and still fail due to missing governance. It can run cutting-edge infrastructure and still get stuck on unchanged workflows. Each of the six dimensions must be assessed independently — just one weak dimension is enough to stall an otherwise solid AI project.',
        },
        cards: [
          { tag: { de: 'D1 · Daten', en: 'D1 · Data' }, title: { de: 'Sind unsere Daten AI-ready?', en: 'Is our data AI-ready?' }, body: { de: '85 % aller Projektabbrüche gehen laut Gartner auf mangelnde Datenqualität zurück — der häufigste Scheiternsfaktor überhaupt.', en: "According to Gartner, 85% of project abandonments trace back to poor data quality — the single most common failure factor." } },
          { tag: { de: 'D2 · Infrastruktur', en: 'D2 · Infrastructure' }, title: { de: 'Kann unsere Plattform AI deployen?', en: 'Can our platform deploy AI?' }, body: { de: 'Clean-Core-Schulden und fehlende API-Schichten blockieren Deployment-Geschwindigkeit direkt, unabhängig von der Modellqualität.', en: 'Clean-core debt and missing API layers directly block deployment speed, regardless of model quality.' } },
          { tag: { de: 'D3 · Skills', en: 'D3 · Skills' }, title: { de: 'Haben wir die Fähigkeiten?', en: 'Do we have the skills?' }, body: { de: 'Die Kompetenzlücke wächst schneller als der Markt sie schließen kann — MLOps-Rollen fehlen in 80 % der Unternehmen komplett.', en: 'The skills gap grows faster than the market can close it — MLOps roles are entirely missing at 80% of companies.' } },
          { tag: { de: 'D4 · Prozesse', en: 'D4 · Processes' }, title: { de: 'Sind Prozesse AI-tauglich redesigned?', en: 'Have processes been redesigned for AI?' }, body: { de: 'Der stärkste einzelne ROI-Prädiktor ist laut McKinsey nicht die Modellqualität, sondern das Workflow-Redesign vor der Einführung.', en: 'According to McKinsey, the strongest single ROI predictor is not model quality but workflow redesign before rollout.' } },
          { tag: { de: 'D5 · Governance', en: 'D5 · Governance' }, title: { de: 'Wer entscheidet, wer verantwortet?', en: 'Who decides, who is accountable?' }, body: { de: 'Fehlendes Ownership ist der häufigste Grund, warum AI-Projekte still sterben — nicht offen scheitern, sondern versanden.', en: "Missing ownership is the most common reason AI projects die quietly — not failing openly, just fading away." } },
          { tag: { de: 'D6 · Kultur', en: 'D6 · Culture' }, title: { de: 'Will die Organisation AI wirklich?', en: 'Does the organization actually want AI?' }, body: { de: '47 % der Mitarbeiter erwarten AI für einen Großteil ihrer Arbeit — Führungskräfte schätzen diesen Wert nur halb so hoch.', en: '47% of employees expect AI to handle much of their work — leaders estimate that figure at only half.' } },
        ],
      },
      {
        heading: { de: 'Wie funktioniert der 10-Minuten-Quick-Scan?', en: 'How does the 10-minute quick scan work?' },
        intro: {
          de: 'Der Scan stellt 18 Fragen, exakt drei pro Dimension, jeweils mit einem einfachen Ja oder Nein beantwortet. Sie zählen die Ja-Antworten pro Dimension und lesen das Ergebnis direkt ab: null bis eine Ja-Antwort markiert eine kritische Lücke, drei bedeuten, die Dimension trägt bereits eine Skalierung.',
          en: 'The scan asks 18 questions, exactly three per dimension, each answered with a simple yes or no. You count the yes-answers per dimension and read the result directly: zero to one yes marks a critical gap, three means the dimension already supports scaling.',
        },
        extraBody: {
          de: 'Drei Beispielfragen aus dem Scan: Können wir Geschäftsdaten über dokumentierte APIs abrufen, ohne manuelle Excel-Exports? Beginnen AI-Projekte bei uns mit Prozessanalyse oder mit Tool-Auswahl? Haben wir schon einmal ein AI-Experiment bewusst scheitern lassen und die Erkenntnisse dokumentiert? Alle 18 Fragen samt Auswertung stehen im AI-Readiness Assessment im Produkt.',
          en: 'Three sample questions from the scan: Can we pull business data via documented APIs without manual Excel exports? Do our AI projects start with process analysis or tool selection? Have we ever deliberately let an AI experiment fail and documented the lessons? All 18 questions with scoring live in the AI Readiness Assessment in the product.',
        },
        cards: [
          { tag: { de: '0–1 von 3 Ja', en: '0–1 of 3 yes' }, title: { de: 'Kritische Lücke', en: 'Critical gap' }, body: { de: 'Sofortiger Handlungsbedarf — empfehlenswert mit externer Beratung.', en: 'Immediate action needed — external advice recommended.' } },
          { tag: { de: '2 von 3 Ja', en: '2 of 3 yes' }, title: { de: 'Entwicklungsfeld', en: 'Development area' }, body: { de: 'Strukturierter Aufbau nötig — Gap-Analyse als nächster Schritt.', en: 'Structured buildup needed — gap analysis as next step.' } },
          { tag: { de: '3 von 3 Ja', en: '3 of 3 yes' }, title: { de: 'Dimension bereit', en: 'Dimension ready' }, body: { de: 'Skalierung möglich — Fokus auf die verbleibenden schwachen Dimensionen.', en: 'Scaling possible — focus on the remaining weak dimensions.' } },
        ],
        patternBox: {
          tag: { de: 'Anti-Pattern', en: 'Anti-pattern' },
          body: {
            de: 'Der Irrtum, der mir am häufigsten begegnet: Datenmigration wird mit Datenbereinigung verwechselt. ERP-Landschaften tragen oft jahrzehntealte Master-Data-Schulden — duplizierte Lieferantenstämme, inkonsistente Materialklassen — unverändert in jede Systemmigration und blockieren danach jeden KI-Agenten-Einsatz. Kundeneigenentwicklungen im ERP-Kern stehen Standard-KI-Modellen oft grundsätzlich nicht zur Verfügung. Wer einen hohen Anteil an Eigenentwicklungen hat, sollte vor jedem AI-Projekt prüfen, welche Use Cases ohne Bereinigung überhaupt realisierbar sind.',
            en: "The most common misconception I encounter: data migration gets confused with data cleansing. ERP landscapes often carry decades-old master data debt — duplicated vendor records, inconsistent material classes — unchanged through every system migration, blocking any AI agent deployment afterward. Custom developments in the ERP core are often simply unavailable to standard AI models. Companies with a high share of custom code should check, before any AI project, which use cases are even feasible without cleanup.",
          },
        },
      },
    ],
    glossary: [
      { de: 'AI-Readiness', en: 'AI Readiness' },
      { de: 'Clean Core', en: 'Clean Core' },
      { de: 'MLOps', en: 'MLOps' },
      { de: 'Data Stewardship', en: 'Data Stewardship' },
    ],
    ctaBand: {
      title: { de: 'Ihr Readiness-Profil in 10 Minuten', en: 'Your readiness profile in 10 minutes' },
      body: { de: 'Das AI-Readiness Assessment ordnet Ihre Organisation allen sechs Dimensionen zu und zeigt, wo zuerst gehandelt werden sollte.', en: 'The AI Readiness Assessment maps your organization across all six dimensions and shows where to act first.' },
      linkLabel: { de: 'Jetzt Quick Scan starten →', en: 'Start the quick scan now →' },
    },
    faq: [
      { q: { de: 'Reicht der Quick Scan, oder brauche ich das volle Assessment?', en: 'Is the quick scan enough, or do I need the full assessment?' }, a: { de: 'Der Quick Scan gibt in 10 Minuten ein grobes Profil über 18 Fragen. Für eine belastbare Grundlage vor Investitionsentscheidungen empfiehlt sich das vollständige 42-Fragen-Deep-Assessment im Produkt.', en: 'The quick scan gives a rough profile in 10 minutes across 18 questions. For a solid basis before investment decisions, the full 42-question deep assessment in the product is recommended.' } },
      { q: { de: 'Was, wenn wir in einer Dimension bei 0 von 3 liegen?', en: 'What if we score 0 of 3 in a dimension?' }, a: { de: 'Das markiert eine kritische Lücke mit sofortigem Handlungsbedarf. In dieser Situation lohnt sich meist externe Beratung, bevor weiter in AI-Projekte investiert wird.', en: 'That marks a critical gap needing immediate action. In this situation, external advice usually pays off before investing further in AI projects.' } },
      { q: { de: 'Ist Datenqualität wirklich wichtiger als die Wahl des KI-Modells?', en: 'Is data quality really more important than the choice of AI model?' }, a: { de: 'In der Praxis ja. 85 % aller abgebrochenen AI-Projekte scheitern an Datenqualität — die Modellwahl ist selten die Hauptursache.', en: 'In practice, yes. 85% of abandoned AI projects fail on data quality — model choice is rarely the main cause.' } },
      { q: { de: 'Welche Rolle spielt die Wahl des Tools für AI-Readiness?', en: 'What role does tool choice play for AI readiness?' }, a: { de: 'Eine kleinere, als viele denken. Laut McKinsey ist Workflow-Redesign vor der Einführung der stärkste einzelne ROI-Prädiktor — nicht die Technologie- oder Modellauswahl.', en: "A smaller one than most think. According to McKinsey, workflow redesign before rollout is the strongest single ROI predictor — not technology or model choice." } },
    ],
    bookChapter: { de: 'Kapitel 2', en: 'Chapter 2' },
    relatedSlugs: ['ai-reifegrad-starter-scaler-transformer', 'warum-ai-projekte-scheitern'],
  },
  {
    slug: 'ai-reifegrad-starter-scaler-transformer',
    category: { de: 'AI-Readiness', en: 'AI Readiness' },
    navLabel: { de: 'AI-Reifegrad', en: 'AI Maturity' },
    title: {
      de: 'Welcher AI-Archetyp ist Ihr Unternehmen — Starter, Scaler oder Transformer?',
      en: 'Which AI Archetype Is Your Company — Starter, Scaler, or Transformer?',
    },
    metaDescription: {
      de: 'Drei Archetypen fassen den AI-Reifegrad zusammen: Starter, Scaler, Transformer. Plus ein 5-Level-Reifegradmodell mit messbaren Kriterien statt Bauchgefühl.',
      en: 'Three archetypes summarize AI maturity: Starter, Scaler, Transformer. Plus a 5-level maturity model with measurable criteria instead of gut feeling.',
    },
    eyebrow: { de: 'Leitfaden · Readiness', en: 'Guide · Readiness' },
    kurzantwort: {
      de: 'Drei Archetypen fassen den AI-Reifegrad zusammen: AI Starter (kein produktiver Use Case), AI Scaler (1–3 Use Cases, Skalierung offen) und AI Transformer (5+ Use Cases, strategisch differenzierend). Kein Archetyp ist besser — jeder hat andere Prioritäten. Der entscheidende Test für Level 3: Läuft der Use Case auch ohne seine Kernteilnehmer?',
      en: "Three archetypes summarize AI maturity: AI Starter (no production use case), AI Scaler (1–3 use cases, scaling still open), and AI Transformer (5+ use cases, strategically differentiating). No archetype is better — each has different priorities. The decisive test for level 3: does the use case still run without its core people?",
    },
    sections: [
      {
        heading: { de: 'Was unterscheidet die drei Archetypen wirklich?', en: 'What really distinguishes the three archetypes?' },
        intro: {
          de: 'Ein Archetyp beschreibt Unternehmenstyp und AI-Reifegrad vereinfacht, aber belastbar — er hilft, Empfehlungen zu priorisieren, ohne jeden Kontext neu erklären zu müssen. Die drei Typen unterscheiden sich vor allem in der Zahl produktiver Use Cases, der Datenstrategie und dem Reifegrad der Governance.',
          en: 'An archetype describes company type and AI maturity in a simplified but reliable way — it helps prioritize recommendations without re-explaining context every time. The three types differ mainly in the number of production use cases, data strategy, and governance maturity.',
        },
        cards: [
          { tag: { de: 'AI Starter', en: 'AI Starter' }, title: { de: 'Kein produktiver Use Case', en: 'No production use case' }, body: { de: 'Meist nur ein PoC im Haus. Daten liegen in Silos, es gibt keine AI-spezifische Governance. Hauptfrage: Wo anfangen, was priorisieren?', en: 'Usually just one PoC in-house. Data sits in silos, no AI-specific governance exists. Main question: where to start, what to prioritize?' } },
          { tag: { de: 'AI Scaler', en: 'AI Scaler' }, title: { de: '1–3 Use Cases live', en: '1–3 use cases live' }, body: { de: 'Skalierung steht noch aus. Datenstrategie im Aufbau, Governance rudimentär und projektbezogen. Hauptfrage: Wie skaliere ich das Erreichte?', en: "Scaling is still pending. Data strategy under construction, governance rudimentary and project-based. Main question: how do I scale what I've achieved?" } },
          { tag: { de: 'AI Transformer', en: 'AI Transformer' }, title: { de: '5+ Use Cases, enterprise-weit', en: '5+ use cases, enterprise-wide' }, body: { de: 'AI läuft in kritischen Prozessen. Governed Data Fabric vorhanden, Enterprise-AI-Governance etabliert. Hauptfrage: Wie differenziere ich strategisch?', en: 'AI runs in critical processes. Governed data fabric in place, enterprise AI governance established. Main question: how do I differentiate strategically?' } },
        ],
      },
      {
        heading: { de: 'Wie schätze ich den Reifegrad präzise ein — jenseits der drei Archetypen?', en: 'How do I precisely assess maturity — beyond the three archetypes?' },
        intro: {
          de: 'Reifegradmodelle scheitern oft, wenn Level 3 zur Auffangkategorie für alles Mittelmäßige wird. Das folgende 5-Level-Modell definiert jede Stufe über messbare Kriterien statt über Bauchgefühl — von null produktiven Use Cases bis zur strategischen Differenzierung, die sich messbar im EBIT niederschlägt.',
          en: 'Maturity models often fail when level 3 becomes a catch-all for anything mediocre. The following 5-level model defines each stage with measurable criteria instead of gut feeling — from zero production use cases to strategic differentiation that shows up measurably in EBIT.',
        },
        facts: [
          { label: { de: 'L1 · Bewusstsein', en: 'L1 · Awareness' }, body: { de: 'Kein AI-Projekt aktiv, AI wird beobachtet, nicht priorisiert. Kein Budget, kein Owner, keine Datenstrategie. Messbar: 0 produktive Use Cases, 0 AI-Rollen.', en: 'No active AI project, AI is watched but not prioritized. No budget, no owner, no data strategy. Measurable: 0 production use cases, 0 AI roles.' } },
          { label: { de: 'L2 · Exploration', en: 'L2 · Exploration' }, body: { de: 'PoC läuft oder ist abgeschlossen, kein Produktiveinsatz. Piloten skalieren wegen Governance-Lücken nicht — „Pilot Purgatory". Messbar: 0–1 Use Case, Data Readiness unter 30 %.', en: 'PoC running or completed, no production use. Pilots fail to scale due to governance gaps — "Pilot Purgatory". Measurable: 0–1 use case, data readiness below 30%.' } },
          { label: { de: 'L3 · Produktion', en: 'L3 · Production' }, body: { de: 'Mindestens 1 Use Case live, aber begrenzte Skalierung. Schärfungstest: Läuft er ohne seine Kernteilnehmer? Nein bedeutet Level 2. Messbar: RACI vorhanden, Datenqualitäts-KPIs definiert.', en: 'At least 1 use case live, but limited scaling. Sharpening test: does it run without its core people? No means level 2. Measurable: RACI in place, data quality KPIs defined.' } },
          { label: { de: 'L4 · Skalierung', en: 'L4 · Scaling' }, body: { de: '3 oder mehr Use Cases live, MLOps etabliert, Governance greift operativ. AI ist reproduzierbar, nicht mehr von Einzelpersonen abhängig. Messbar: ROI messbar.', en: '3 or more use cases live, MLOps established, governance operating in practice. AI is reproducible, no longer dependent on individuals. Measurable: ROI measurable.' } },
          { label: { de: 'L5 · Transformation', en: 'L5 · Transformation' }, body: { de: 'AI ist kein Projekt mehr, sondern das Betriebsmodell. Agenten orchestrieren durchgängig, Daten sind vertrauenswürdig. Messbar: AI als KPI-Treiber, EBIT-Impact.', en: 'AI is no longer a project but the operating model. Agents orchestrate end to end, data is trustworthy. Measurable: AI as a KPI driver, EBIT impact.' } },
        ],
        patternBox: {
          tag: { de: 'Anti-Pattern', en: 'Anti-pattern' },
          body: {
            de: 'Reifegradmodelle scheitern, wenn Level 3 zur Auffangkategorie für alles Mittelmäßige wird — der Schärfungstest ist einfach: Läuft der Use Case ohne seine Kernteilnehmer? Wenn nein, ist es Level 2, nicht Level 3. Ebenso gefährlich ist der Durchschnittsscore: Ein Unternehmen mit hoher Infrastruktur-Reife und niedriger Governance-Reife hat ein fundamental anderes Problem als eines mit mittlerem Niveau in allen Dimensionen. Handeln Sie immer an der schwächsten Dimension — nicht am Durchschnitt.',
            en: "Maturity models fail when level 3 becomes a catch-all for anything mediocre — the sharpening test is simple: does the use case run without its core people? If not, it's level 2, not level 3. Equally dangerous is the average score: a company with high infrastructure maturity and low governance maturity has a fundamentally different problem than one at medium level across all dimensions. Always act on the weakest dimension — not the average.",
          },
        },
      },
    ],
    glossary: [
      { de: 'Archetyp', en: 'Archetype' },
      { de: 'Pilot Purgatory', en: 'Pilot Purgatory' },
      { de: 'Gap-Analyse', en: 'Gap Analysis' },
      { de: 'RACI', en: 'RACI' },
    ],
    ctaBand: {
      title: { de: 'Wo steht Ihr Unternehmen wirklich? Wir zeigen es in 10 Minuten.', en: 'Where does your company really stand? We show you in 10 minutes.' },
      body: { de: 'Das Reifegrad-Assessment ordnet Sie einem Archetyp zu und zeigt, welche Dimension zuerst Aufmerksamkeit braucht — bevor Sie in Skalierung investieren.', en: 'The maturity assessment maps you to an archetype and shows which dimension needs attention first — before you invest in scaling.' },
      linkLabel: { de: 'Reifegrad-Assessment starten →', en: 'Start the maturity assessment →' },
    },
    faq: [
      { q: { de: 'Ist ein AI-Archetyp eine Wertung — ist Transformer automatisch besser?', en: 'Is an AI archetype a value judgment — is Transformer automatically better?' }, a: { de: 'Nein. Jeder Archetyp hat andere Prioritäten, Quick Wins und Risiken. Ein Starter, der wie ein Transformer agieren will, scheitert typischerweise am fehlenden Fundament.', en: "No. Each archetype has different priorities, quick wins, and risks. A Starter trying to act like a Transformer typically fails due to a missing foundation." } },
      { q: { de: 'Woran erkenne ich, ob ein Use Case wirklich Level 3 erreicht hat?', en: 'How do I tell if a use case has really reached level 3?' }, a: { de: 'Am Schärfungstest: Läuft er ohne seine Kernteilnehmer weiter? Wenn nein, handelt es sich noch um Level 2 — einen Piloten im Pilot Purgatory.', en: "By the sharpening test: does it keep running without its core people? If not, it's still level 2 — a pilot stuck in Pilot Purgatory." } },
      { q: { de: 'Was ist der häufigste Fehler bei der Reifegrad-Selbsteinschätzung?', en: 'What is the most common mistake in self-assessing maturity?' }, a: { de: 'Einen Durchschnittsscore über alle Dimensionen zu bilden. Hohe Infrastruktur-Reife bei niedriger Governance-Reife ist ein anderes Problem als mittleres Niveau überall — handeln Sie an der schwächsten Dimension.', en: 'Computing an average score across all dimensions. High infrastructure maturity with low governance maturity is a different problem than medium everywhere — act on the weakest dimension.' } },
      { q: { de: 'Muss ich alle sechs Dimensionen gleich stark entwickeln, um zu skalieren?', en: 'Do I need to develop all six dimensions equally to scale?' }, a: { de: 'Nein, aber die schwächste Dimension begrenzt das Gesamttempo. Skalierung auf Level 4 setzt voraus, dass keine Dimension kritisch zurückbleibt.', en: 'No, but the weakest dimension caps your overall pace. Scaling to level 4 requires that no dimension lags critically behind.' } },
    ],
    bookChapter: { de: 'Kapitel 1 und 2', en: 'Chapters 1 and 2' },
    relatedSlugs: ['warum-ai-projekte-scheitern', 'ai-readiness-quick-scan'],
  },
  {
    slug: 'ai-governance-aufbauen',
    category: { de: 'AI-Governance', en: 'AI Governance' },
    navLabel: { de: 'AI-Governance aufbauen', en: 'Building AI Governance' },
    title: {
      de: 'Wie baut man AI-Governance auf, die nicht zum Papiertiger wird?',
      en: "How Do You Build AI Governance That Doesn't Become a Paper Tiger?",
    },
    metaDescription: {
      de: 'Tragfähige AI-Governance läuft auf drei Ebenen: strategisch, taktisch, operativ. Ein Minimalmodell mit 5 Rollen und 6 Kernentscheidungen reicht für den Start.',
      en: 'Solid AI governance runs on three levels: strategic, tactical, operational. A minimal model with 5 roles and 6 core decisions is enough to get started.',
    },
    eyebrow: { de: 'Leitfaden · Governance & Recht', en: 'Guide · Governance & Law' },
    kurzantwort: {
      de: 'Tragfähige AI-Governance läuft auf drei Ebenen gleichzeitig: strategisch, taktisch, operativ — und in genau dieser Reihenfolge aufgebaut. Der häufigste Fehler: operative Tools und Prozesse einführen, bevor der strategische Rahmen steht. Das Ergebnis ist Governance-Theater statt Governance. Ein Minimalmodell mit 5 Rollen und 6 Kernentscheidungen reicht für den Start.',
      en: 'Solid AI governance runs on three levels at once — strategic, tactical, operational — built in exactly that order. The most common mistake: rolling out operational tools and processes before the strategic frame is in place. The result is governance theater, not governance. A minimal model with 5 roles and 6 core decisions is enough to get started.',
    },
    sections: [
      {
        heading: { de: 'Welche drei Ebenen braucht ein tragfähiges Governance-Framework?', en: 'Which three levels does a solid governance framework need?' },
        intro: {
          de: 'Schwäche auf einer Ebene destabilisiert das Gesamtsystem: Strategische Richtung ohne operative Umsetzung bleibt Papier. Operative Kontrolle ohne strategischen Rahmen produziert inkonsistente Entscheidungen. Taktische Policies ohne Führung und Kultur werden schlicht umgangen — AI-Governance greift zudem in bestehende interne Regularien ein und muss mit diesen abgestimmt werden, nicht isoliert daneben stehen.',
          en: 'Weakness at one level destabilizes the whole system: strategic direction without operational execution stays paper. Operational control without a strategic frame produces inconsistent decisions. Tactical policies without leadership and culture simply get bypassed — AI governance also touches existing internal regulations and must be aligned with them, not sit isolated alongside them.',
        },
        cards: [
          { tag: { de: '01 · Strategische Ebene', en: '01 · Strategic level' }, title: { de: 'Ziele, Werte, Risikotoleranz', en: 'Goals, values, risk tolerance' }, body: { de: 'C-Level, Board, AI Ethics Committee. Klärt Risikotoleranz und Verantwortlichkeiten, bevor irgendein Tool beschafft wird.', en: 'C-level, board, AI ethics committee. Clarifies risk tolerance and accountability before any tool is procured.' } },
          { tag: { de: '02 · Taktische Ebene', en: '02 · Tactical level' }, title: { de: 'Policies, Prozesse, Standards', en: 'Policies, processes, standards' }, body: { de: 'CDO/CIO, AI Governance Officer, Legal & DPO. Übersetzt die strategische Richtung in konkrete, nutzbare Policies.', en: 'CDO/CIO, AI Governance Officer, Legal & DPO. Translates strategic direction into concrete, usable policies.' } },
          { tag: { de: '03 · Operative Ebene', en: '03 · Operational level' }, title: { de: 'Use Cases, Monitoring, Betrieb', en: 'Use cases, monitoring, operations' }, body: { de: 'AI Engineers, MLOps, Business Owner. Setzt Policies im Tagesgeschäft um — Reviews, Monitoring, Audit.', en: 'AI engineers, MLOps, business owner. Implements policies day to day — reviews, monitoring, audit.' } },
        ],
        patternBox: {
          tag: { de: 'Anti-Pattern', en: 'Anti-pattern' },
          body: {
            de: 'Reihenfolge entscheidet: Zuerst die strategische Ebene aufbauen — Risikotoleranz, Werte, Verantwortlichkeiten auf C-Level klären. Dann die taktische Ebene — Policies schreiben, die auf der Strategie aufbauen. Zuletzt die operative Ebene — Use-Case-Reviews, Monitoring, Audit. Der häufigste Fehler ist die umgekehrte Reihenfolge: operative Tools und Prozesse ohne strategischen Rahmen einführen. Das erzeugt Governance-Theater, keine Governance.',
            en: 'Order matters: first build the strategic level — clarify risk tolerance, values, accountability at C-level. Then the tactical level — write policies that build on the strategy. Last, the operational level — use case reviews, monitoring, audit. The most common mistake is the reverse order: rolling out operational tools and processes without a strategic frame. That produces governance theater, not governance.',
          },
        },
      },
      {
        heading: { de: 'Wer entscheidet was? Das Minimalmodell mit 5 Rollen', en: 'Who decides what? The minimal model with 5 roles' },
        intro: {
          de: 'Jedes Unternehmen braucht dieses Mindestmodell — unabhängig von Größe und Reifegrad. Fünf Rollen genügen, um sechs kritische Entscheidungen sauber zuzuordnen: CDO/CIO, AI Governance Officer, DPO/Legal, BU-Owner und AI Engineer. R steht für Responsible, A für Accountable, C für Consulted, I für Informed.',
          en: 'Every company needs this minimum model — regardless of size or maturity. Five roles are enough to cleanly assign six critical decisions: CDO/CIO, AI Governance Officer, DPO/Legal, BU owner, and AI engineer. R stands for Responsible, A for Accountable, C for Consulted, I for Informed.',
        },
        facts: [
          { label: { de: 'Use Case genehmigen', en: 'Approve use case' }, body: { de: 'Accountable: CDO/CIO. Responsible: AI Governance Officer. Legal und BU-Owner werden konsultiert.', en: 'Accountable: CDO/CIO. Responsible: AI Governance Officer. Legal and BU owner are consulted.' } },
          { label: { de: 'Risikoklasse einordnen', en: 'Classify risk level' }, body: { de: 'Accountable: CDO/CIO. Responsible: AI Governance Officer und Legal gemeinsam — nach EU AI Act.', en: 'Accountable: CDO/CIO. Responsible: AI Governance Officer and Legal jointly — per the EU AI Act.' } },
          { label: { de: 'Datenschutz-Folgeabschätzung', en: 'Data protection impact assessment' }, body: { de: 'Accountable und Responsible: DPO/Legal. AI Governance Officer und BU-Owner werden konsultiert.', en: 'Accountable and Responsible: DPO/Legal. AI Governance Officer and BU owner are consulted.' } },
          { label: { de: 'Go-Live-Freigabe', en: 'Go-live approval' }, body: { de: 'Accountable: CDO/CIO. Responsible: AI Governance Officer und AI Engineer gemeinsam.', en: 'Accountable: CDO/CIO. Responsible: AI Governance Officer and AI engineer jointly.' } },
          { label: { de: 'Modell deaktivieren (Incident)', en: 'Deactivate model (incident)' }, body: { de: 'Accountable: CDO/CIO. Responsible: AI Governance Officer und AI Engineer — sofort, ohne Rückfrage.', en: 'Accountable: CDO/CIO. Responsible: AI Governance Officer and AI engineer — immediately, no sign-off needed.' } },
          { label: { de: 'Policy-Änderung genehmigen', en: 'Approve policy change' }, body: { de: 'Accountable: CDO/CIO. Responsible: AI Governance Officer. BU-Owner und AI Engineer werden informiert.', en: 'Accountable: CDO/CIO. Responsible: AI Governance Officer. BU owner and AI engineer are informed.' } },
        ],
        extraBody: {
          de: 'Eskalationspfade gehören von Anfang an dazu, nicht erst nach dem ersten Vorfall. Fehlerhafte oder diskriminierende Ergebnisse eines AI-Systems eskalieren innerhalb von 4 Stunden an AI Governance Officer und BU-Owner, bei Bedarf weiter an CDO, DPO und Legal. Eine Datenpanne eskaliert innerhalb einer Stunde an DPO und CISO — die 72-Stunden-Meldefrist der DSGVO läuft parallel mit. Führt ein Agent mit Transaktionsberechtigung eine nicht autorisierte Aktion aus, eskaliert das an AI Engineer und BU-Owner, in der zweiten Stufe an CDO, CISO und den zuständigen Software-Anbieter.',
          en: "Escalation paths belong in place from day one, not after the first incident. Faulty or discriminatory output from an AI system escalates within 4 hours to the AI Governance Officer and BU owner, and further to CDO, DPO, and Legal if needed. A data breach escalates within one hour to DPO and CISO — GDPR's 72-hour notification clock runs in parallel. If an agent with transaction authority performs an unauthorized action, it escalates to the AI engineer and BU owner, then to CDO, CISO, and the relevant software vendor at the next stage.",
        },
      },
    ],
    glossary: [
      { de: 'RACI', en: 'RACI' },
      { de: 'AI Ethics Committee', en: 'AI Ethics Committee' },
      { de: 'Eskalationspfad', en: 'Escalation Path' },
      { de: 'Governance-Theater', en: 'Governance Theater' },
    ],
    ctaBand: {
      title: { de: 'Governance-Framework in einem Nachmittag aufsetzen', en: 'Set up a governance framework in one afternoon' },
      body: { de: 'Die Governance-Vorlage im Produkt liefert das Drei-Ebenen-Modell, die RACI-Matrix und die Eskalationspfade als ausfüllbares Template.', en: 'The governance template in the product delivers the three-level model, the RACI matrix, and escalation paths as a fillable template.' },
      linkLabel: { de: 'Governance-Vorlage öffnen →', en: 'Open the governance template →' },
    },
    faq: [
      { q: { de: 'Brauchen auch kleine Unternehmen alle drei Ebenen?', en: 'Do small companies need all three levels too?' }, a: { de: 'Ja, aber schlank: Ein AI-Starter braucht keine eigene Ethikkommission, aber jemanden, der auf C-Level Risikotoleranz und Verantwortlichkeit klärt — sonst fehlt der Rahmen für alles Weitere.', en: "Yes, but lean: an AI Starter doesn't need its own ethics committee, but does need someone at C-level clarifying risk tolerance and accountability — otherwise the frame for everything else is missing." } },
      { q: { de: 'Was ist Governance-Theater genau?', en: 'What exactly is governance theater?' }, a: { de: 'Operative Prozesse und Tools, die ohne strategischen Rahmen eingeführt wurden — sie sehen nach Governance aus, sind aber inkonsistent und werden bei der ersten Belastung umgangen.', en: 'Operational processes and tools rolled out without a strategic frame — they look like governance but are inconsistent and get bypassed under the first real load.' } },
      { q: { de: 'Reicht eine Person für alle fünf Rollen bei einem Starter?', en: 'Is one person enough for all five roles at a Starter?' }, a: { de: 'Übergangsweise ja — entscheidend ist, dass die sechs Kernentscheidungen jemandem klar zugeordnet sind, nicht dass fünf verschiedene Personen existieren.', en: "Temporarily, yes — what matters is that the six core decisions are clearly assigned to someone, not that five different people exist." } },
      { q: { de: 'Wie schnell sollte ein Governance-Prozess eine Freigabe ermöglichen?', en: 'How fast should a governance process enable approval?' }, a: { de: 'Ziel sind 5 Werktage, nicht 5 Monate. Klare Rollen und ein definierter Entscheidungsbaum sind dafür Voraussetzung, keine zusätzliche Bürokratie.', en: 'The target is 5 business days, not 5 months. Clear roles and a defined decision tree are prerequisites for that, not extra bureaucracy.' } },
    ],
    bookChapter: { de: 'Kapitel 4', en: 'Chapter 4' },
    relatedSlugs: ['governance-entscheidungsbaum', 'eu-ai-act-risikoklassen'],
  },
  {
    slug: 'governance-entscheidungsbaum',
    category: { de: 'AI-Governance', en: 'AI Governance' },
    navLabel: { de: 'Governance-Entscheidungsbaum', en: 'Governance Decision Tree' },
    title: {
      de: 'Wie kommt ein AI-Use-Case sauber durch die Freigabe?',
      en: 'How Does an AI Use Case Get Through Approval Cleanly?',
    },
    metaDescription: {
      de: 'Fünf Fragen entscheiden über die Freigabe eines AI-Use-Case. Wer den Entscheidungsbaum sauber durchläuft, erreicht eine Freigabe in 5 Werktagen statt 5 Monaten.',
      en: 'Five questions determine whether an AI use case gets approved. Following the decision tree cleanly means approval in 5 business days instead of 5 months.',
    },
    eyebrow: { de: 'Leitfaden · Governance & Recht', en: 'Guide · Governance & Law' },
    kurzantwort: {
      de: 'Fünf Fragen entscheiden über die Freigabe eines AI-Use-Case: personenbezogene Daten, automatisierte Personenentscheidungen, EU-AI-Act-Risikoklasse, externes Basismodell und menschliche Prüfbarkeit. Wer den Baum sauber durchläuft, erreicht eine Freigabe in 5 Werktagen statt in 5 Monaten — Governance wird zum Beschleuniger, nicht zur Hürde.',
      en: 'Five questions determine whether an AI use case gets approved: personal data, automated decisions about people, EU AI Act risk class, external foundation model, and human review capability. Following the tree cleanly means approval in 5 business days instead of 5 months — governance becomes an accelerator, not a hurdle.',
    },
    sections: [
      {
        heading: { de: 'Welche fünf Fragen entscheiden über die Freigabe?', en: 'Which five questions determine approval?' },
        intro: {
          de: 'Dieser Entscheidungsbaum führt durch den Freigabeprozess für jeden neuen AI-Use-Case. Er ersetzt keine Rechtsberatung, sondern gibt Orientierung für den internen Prozess — Schritt für Schritt, ohne Umwege.',
          en: 'This decision tree guides the approval process for every new AI use case. It does not replace legal advice — it gives orientation for the internal process, step by step, no detours.',
        },
        facts: [
          { label: { de: '1', en: '1' }, body: { de: 'Verarbeitet der Use Case personenbezogene Daten? Ja → weiter zu Frage 2. Nein → kein DSGVO-Review nötig, direkt weiter zu Frage 3.', en: 'Does the use case process personal data? Yes → go to question 2. No → no GDPR review needed, go directly to question 3.' } },
          { label: { de: '2', en: '2' }, body: { de: 'Trifft das System automatisiert Entscheidungen über Personen? Ja → DSGVO Art. 22 Review, explizite Einwilligung oder Ausnahmetatbestand prüfen. Nein → Standard-Datenschutzfolgeabschätzung, weiter zu Frage 3.', en: 'Does the system make automated decisions about people? Yes → GDPR Art. 22 review, check explicit consent or an exemption. No → standard data protection impact assessment, go to question 3.' } },
          { label: { de: '3', en: '3' }, body: { de: 'Fällt der Use Case in eine EU-AI-Act-Hochrisiko-Kategorie? Ja → Hochrisiko-Prozess: Konformitätsbewertung, technische Dokumentation, menschliche Aufsicht. Nein → weiter zu Frage 4.', en: 'Does the use case fall into an EU AI Act high-risk category? Yes → high-risk process: conformity assessment, technical documentation, human oversight. No → go to question 4.' } },
          { label: { de: '4', en: '4' }, body: { de: 'Nutzt der Use Case ein externes Basismodell (GPAI)? Ja → GPAI-Deployer-Pflichten prüfen: Nutzungspolitik, Output-Monitoring, Transparenzpflicht. Nein → weiter zu Frage 5.', en: 'Does the use case use an external foundation model (GPAI)? Yes → check GPAI deployer obligations: usage policy, output monitoring, transparency duty. No → go to question 5.' } },
          { label: { de: '5', en: '5' }, body: { de: 'Kann ein Mensch die Ergebnisse prüfen und überstimmen? Ja → Use Case kann genehmigt werden, Governance-Board-Freigabe einholen. Nein → menschliche Aufsicht einbauen oder Use Case nicht genehmigen.', en: 'Can a human review and override the results? Yes → the use case can be approved, obtain governance board sign-off. No → build in human oversight or do not approve the use case.' } },
        ],
      },
      {
        heading: { de: 'Wie schwer wiegt das Risiko wirklich?', en: 'How serious is the risk really?' },
        intro: {
          de: 'AI-Risiken unterscheiden sich fundamental von klassischen IT-Risiken: Sie sind emergent — sie entstehen durch Modellverhalten, nicht durch Konfigurationsfehler — und verändern sich durch Lernprozesse. Eine statische Bewertung reicht nicht, kontinuierliches Monitoring ist Pflicht.',
          en: 'AI risks differ fundamentally from classic IT risks: they are emergent — arising from model behavior, not configuration errors — and they change through learning processes. A static assessment is not enough; continuous monitoring is mandatory.',
        },
        cards: [
          { tag: { de: 'Datenrisiken', en: 'Data risks' }, title: { de: 'Von geringer Qualität bis kritisches Datenleck', en: 'From low quality to a critical data leak' }, body: { de: 'Kritische Ausprägung: eine Datenpanne im AI-System oder ein kritisches Datenleck.', en: 'Critical form: a data breach in the AI system or a critical data leak.' } },
          { tag: { de: 'Modellrisiken', en: 'Model risks' }, title: { de: 'Von sporadischen Halluzinationen bis autonomer Fehlentscheidung', en: 'From sporadic hallucinations to an autonomous bad decision' }, body: { de: 'Kritische Ausprägung: systematische Fehler oder eine autonome Fehlentscheidung ohne Aufsicht.', en: 'Critical form: systematic errors or an autonomous bad decision without oversight.' } },
          { tag: { de: 'Compliance-Risiken', en: 'Compliance risks' }, title: { de: 'Von Dokumentationslücken bis AI-Act-Verletzung', en: 'From documentation gaps to an AI Act violation' }, body: { de: 'Kritische Ausprägung: ein Hochrisiko-Use-Case ohne Review oder eine direkte EU-AI-Act-Verletzung.', en: 'Critical form: a high-risk use case without review or a direct EU AI Act violation.' } },
          { tag: { de: 'Operationale Risiken', en: 'Operational risks' }, title: { de: 'Von Adoptionslücken bis kritischem Systemausfall', en: 'From adoption gaps to a critical system outage' }, body: { de: 'Kritische Ausprägung: Vendor-Lock-in ohne Exit-Strategie oder ein kritischer Systemausfall.', en: 'Critical form: vendor lock-in without an exit strategy or a critical system outage.' } },
        ],
        patternBox: {
          tag: { de: 'Anti-Pattern', en: 'Anti-pattern' },
          body: {
            de: 'Das unterschätzte Risiko: Prompt Injection ist 2026 der meistgenutzte Angriffsvektor auf AI-Agenten. Ein Angreifer bettet manipulative Anweisungen in Daten ein, die der Agent verarbeitet — und bringt ihn dazu, unbeabsichtigte Aktionen auszuführen. Bei Agenten mit Transaktionsberechtigung, etwa für Zahlungen oder Bestellungen, ist das kein theoretisches Risiko, sondern ein operatives. Mitigationen: Input Validation, Output Sandboxing, minimale Agent-Berechtigungen.',
            en: "The underestimated risk: prompt injection is the most-used attack vector against AI agents in 2026. An attacker embeds manipulative instructions in data the agent processes — causing it to perform unintended actions. For agents with transaction authority, e.g. for payments or orders, this isn't a theoretical risk but an operational one. Mitigations: input validation, output sandboxing, minimal agent permissions.",
          },
        },
        extraBody: {
          de: 'Der Baum ist bewusst als wiederholbarer Prozess gedacht, nicht als Einzelfallprüfung: Jeder neue Use Case durchläuft dieselben fünf Fragen, jede Antwort wird protokolliert, jede Freigabe ist im Nachhinein nachvollziehbar. Genau das unterscheidet einen Governance-Prozess, der Vertrauen aufbaut, von einer Ad-hoc-Entscheidung, die bei der nächsten Prüfung nicht mehr erklärbar ist.',
          en: "The tree is deliberately designed as a repeatable process, not a case-by-case review: every new use case goes through the same five questions, every answer is logged, every approval is traceable afterward. That's exactly what separates a governance process that builds trust from an ad-hoc decision that can't be explained at the next audit.",
        },
      },
    ],
    glossary: [
      { de: 'Entscheidungsbaum', en: 'Decision Tree' },
      { de: 'DSFA', en: 'DPIA' },
      { de: 'GPAI-Deployer', en: 'GPAI Deployer' },
      { de: 'Prompt Injection', en: 'Prompt Injection' },
    ],
    ctaBand: {
      title: { de: 'Jeden Use Case in 5 Werktagen durch die Freigabe', en: 'Get every use case through approval in 5 business days' },
      body: { de: 'Das Compliance Center führt jeden neuen Use Case automatisch durch den Entscheidungsbaum und dokumentiert das Ergebnis auditierbar.', en: 'The Compliance Center automatically runs every new use case through the decision tree and documents the result in an auditable way.' },
      linkLabel: { de: 'Compliance Center öffnen →', en: 'Open the Compliance Center →' },
    },
    faq: [
      { q: { de: 'Ersetzt dieser Entscheidungsbaum eine Rechtsberatung?', en: 'Does this decision tree replace legal advice?' }, a: { de: 'Nein. Er gibt Orientierung für den internen Prozess. Die abschließende rechtliche Bewertung, insbesondere bei Hochrisiko-Fällen, gehört immer zu Legal oder externer Beratung.', en: 'No. It gives orientation for the internal process. The final legal assessment, especially for high-risk cases, always belongs with Legal or external counsel.' } },
      { q: { de: 'Was, wenn ein Use Case mehrere Fragen gleichzeitig betrifft?', en: 'What if a use case touches several questions at once?' }, a: { de: 'Der Baum wird trotzdem sequenziell durchlaufen — jede Ja-Antwort kann zusätzliche Pflichten auslösen, die sich addieren, statt sich gegenseitig zu ersetzen.', en: 'The tree is still run through sequentially — each yes-answer can trigger additional obligations that stack rather than replace each other.' } },
      { q: { de: 'Warum ist Prompt Injection gerade bei Agenten so kritisch?', en: 'Why is prompt injection especially critical for agents?' }, a: { de: 'Weil Agenten mit Transaktionsberechtigung reale Aktionen ausführen — eine erfolgreiche Injection wird so von einem Text- zu einem operativen Risiko.', en: 'Because agents with transaction authority carry out real actions — a successful injection turns from a text risk into an operational one.' } },
      { q: { de: 'Wie realistisch sind 5 Werktage bis zur Freigabe?', en: 'How realistic is 5 business days to approval?' }, a: { de: 'Realistisch, wenn Rollen und Entscheidungsbaum vorher klar definiert sind. Ohne beides dauert derselbe Prozess oft Monate, weil jede Frage neu diskutiert wird.', en: 'Realistic if roles and the decision tree are clearly defined beforehand. Without both, the same process often takes months because every question gets re-discussed.' } },
    ],
    bookChapter: { de: 'Kapitel 4', en: 'Chapter 4' },
    relatedSlugs: ['ai-governance-aufbauen', 'eu-ai-act-risikoklassen'],
  },
  {
    slug: 'ai-business-case',
    category: { de: 'Use-Case-Priorisierung', en: 'Use Case Prioritization' },
    navLabel: { de: 'Der AI-Business-Case', en: 'The AI Business Case' },
    title: {
      de: 'Wie baut man einen AI-Business-Case, dem der Vorstand zustimmt?',
      en: 'How Do You Build an AI Business Case the Board Will Approve?',
    },
    metaDescription: {
      de: 'Ein AI-Business-Case beantwortet vier Fragen in fester Reihenfolge. Nur 6 % der Unternehmen sehen AI-ROI unter einem Jahr — ehrliche Zeithorizonte schlagen Enthusiasmus.',
      en: 'An AI business case answers four questions in a fixed order. Only 6% of companies see AI ROI under a year — honest timelines beat enthusiasm.',
    },
    eyebrow: { de: 'Leitfaden · Business Value', en: 'Guide · Business Value' },
    kurzantwort: {
      de: 'Ein AI-Business-Case für den Vorstand beantwortet vier Fragen in fester Reihenfolge: Warum jetzt? Was bringt es? Können wir es umsetzen? Was kostet es, wann sehen wir was? Nur 6 % der Unternehmen sehen AI-ROI unter einem Jahr — wer trotzdem sechs Monate verspricht, verliert beim nächsten Budgetantrag die Glaubwürdigkeit.',
      en: "An AI business case for the board answers four questions in a fixed order: Why now? What does it deliver? Can we execute? What does it cost, and when do we see results? Only 6% of companies see AI ROI in under a year — promising six months anyway costs you credibility at the next budget request.",
    },
    sections: [
      {
        heading: { de: 'Welche vier Abschnitte erwartet der Vorstand?', en: 'Which four sections does the board expect?' },
        intro: {
          de: 'Ein AI-Business-Case folgt einer anderen Logik als ein klassischer Projektantrag. Er beantwortet vier Fragen in dieser Reihenfolge — und keiner anderen: Strategischer Imperativ, Business Value Projektion, Readiness & Risiko, Investment & Roadmap.',
          en: 'An AI business case follows different logic than a classic project proposal. It answers four questions in this order — and no other: strategic imperative, business value projection, readiness & risk, investment & roadmap.',
        },
        cards: [
          { tag: { de: '1 · Strategischer Imperativ · ½ Seite', en: '1 · Strategic imperative · ½ page' }, title: { de: 'Warum jetzt und nicht später?', en: 'Why now and not later?' }, body: { de: 'Marktdaten, Wettbewerbslage, das aktuelle Kompetenzfenster — der Rahmen, der die Dringlichkeit begründet.', en: 'Market data, competitive position, the current window of capability — the frame that justifies urgency.' } },
          { tag: { de: '2 · Business Value Projektion · 1 Seite', en: '2 · Business value projection · 1 page' }, title: { de: 'Was bringt es uns konkret?', en: 'What does it deliver concretely?' }, body: { de: 'Wertreiber, KPI-Ziele, ROI-Modell und Benchmarks — in Zahlen, die der Vorstand nachrechnen kann.', en: 'Value drivers, KPI targets, ROI model and benchmarks — in numbers the board can verify themselves.' } },
          { tag: { de: '3 · Readiness & Risiko · ½ Seite', en: '3 · Readiness & risk · ½ page' }, title: { de: 'Können wir das umsetzen?', en: 'Can we execute this?' }, body: { de: 'Readiness-Score, die drei größten Risiken und ihre Mitigationen — ehrlich, nicht schöngerechnet.', en: 'Readiness score, the three biggest risks and their mitigations — honest, not dressed up.' } },
          { tag: { de: '4 · Investment & Roadmap · 1 Seite', en: '4 · Investment & roadmap · 1 page' }, title: { de: 'Was kostet es, wann sehen wir was?', en: 'What does it cost, when do we see results?' }, body: { de: 'Investitionsplan, Meilensteine, Quick Wins und ein realistischer ROI-Zeithorizont.', en: 'Investment plan, milestones, quick wins, and a realistic ROI timeline.' } },
        ],
      },
      {
        heading: { de: 'Welche KPIs passen zu welchem Archetyp?', en: 'Which KPIs fit which archetype?' },
        intro: {
          de: 'Ein KPI-Framework, das für alle gleich ist, ist für keinen richtig. AI Starter messen primär Readiness — ob das Fundament trägt. AI Scaler messen Leading Indicators — ob die Skalierung auf Kurs ist. AI Transformer messen Lagging Indicators — ob AI messbar zum Ergebnis beiträgt.',
          en: 'A one-size-fits-all KPI framework fits nobody. AI Starters primarily measure readiness — whether the foundation holds. AI Scalers measure leading indicators — whether scaling is on track. AI Transformers measure lagging indicators — whether AI measurably contributes to results.',
        },
        facts: [
          { label: { de: 'Readiness-KPIs', en: 'Readiness KPIs' }, body: { de: 'Starter: Datenqualitäts-Score, Governance-Bootstrap. Scaler: API-Abdeckung, MLOps-Reife. Transformer: Knowledge-Graph-Qualität, Agent-Governance-Reife.', en: 'Starter: data quality score, governance bootstrap. Scaler: API coverage, MLOps maturity. Transformer: knowledge graph quality, agent governance maturity.' } },
          { label: { de: 'Leading-KPIs', en: 'Leading KPIs' }, body: { de: 'Starter: erster Use Case live, Readiness-Score. Scaler: Use Cases in Produktion, Adoption Rate. Transformer: Use Cases enterprise-weit, Automatisierungsgrad.', en: 'Starter: first use case live, readiness score. Scaler: use cases in production, adoption rate. Transformer: use cases enterprise-wide, automation level.' } },
          { label: { de: 'Lagging-KPIs', en: 'Lagging KPIs' }, body: { de: 'Starter: EBIT-Impact, Kostenreduktion. Scaler: ROI pro Use Case, Time-to-Value. Transformer: Revenue-Lift, Marktanteil.', en: 'Starter: EBIT impact, cost reduction. Scaler: ROI per use case, time-to-value. Transformer: revenue lift, market share.' } },
        ],
        extraBody: {
          de: 'Zwei Design-Regeln gelten unabhängig vom Archetyp: Jeder KPI braucht einen Ausgangswert — kein Messen ohne Vorher-Wert. Und maximal fünf aktive KPIs pro Use Case, mehr erzeugt Reporting-Aufwand statt Erkenntnis. Readiness-KPIs werden wöchentlich geprüft, Leading-KPIs monatlich, Lagging-KPIs quartalsweise.',
          en: 'Two design rules apply regardless of archetype: every KPI needs a baseline value — no measuring without a before-value. And a maximum of five active KPIs per use case; more creates reporting overhead, not insight. Readiness KPIs are reviewed weekly, leading KPIs monthly, lagging KPIs quarterly.',
        },
        stats: [
          { n: { de: 'Nur 6 %', en: 'Only 6%' }, l: { de: 'sehen AI-ROI unter 12 Monaten', en: 'see AI ROI in under 12 months' } },
          { n: { de: '13 %', en: '13%' }, l: { de: 'erreichen ROI innerhalb von 12 Monaten', en: 'reach ROI within 12 months' } },
          { n: { de: '2–4 Jahre', en: '2–4 years' }, l: { de: 'erwartet die Mehrheit bis zum vollen ROI', en: 'expected by the majority for full ROI' } },
        ],
        patternBox: {
          tag: { de: 'Anti-Pattern', en: 'Anti-pattern' },
          body: {
            de: 'Vorstandsregel: den ROI-Zeithorizont ehrlich kommunizieren. Ein Business Case, der Amortisation in sechs Monaten verspricht, verliert Glaubwürdigkeit — und damit den nächsten Budgetantrag. Ein ehrlicher Zeithorizont mit klar benannten Quick Wins überzeugt einen Vorstand zuverlässiger als eine optimistische Projektion, die beim ersten Quartalsreview widerlegt wird.',
            en: 'Board rule: communicate the ROI timeline honestly. A business case promising payback in six months loses credibility — and with it the next budget request. An honest timeline with clearly named quick wins convinces a board more reliably than an optimistic projection that gets disproven at the first quarterly review.',
          },
        },
      },
    ],
    glossary: [
      { de: 'Lagging Indicator', en: 'Lagging Indicator' },
      { de: 'Leading Indicator', en: 'Leading Indicator' },
      { de: 'AI Value Canvas', en: 'AI Value Canvas' },
      { de: 'Business Case', en: 'Business Case' },
    ],
    ctaBand: {
      title: { de: 'Den Business Case in einer Vorlage ausfüllen', en: 'Fill in the business case using a template' },
      body: { de: 'Das AI Value Canvas im Produkt führt durch alle vier Abschnitte und ordnet KPIs automatisch Ihrem Archetyp zu.', en: 'The AI Value Canvas in the product guides you through all four sections and automatically maps KPIs to your archetype.' },
      linkLabel: { de: 'AI Value Canvas öffnen →', en: 'Open the AI Value Canvas →' },
    },
    faq: [
      { q: { de: 'Wie lang sollte ein AI-Business-Case für den Vorstand sein?', en: 'How long should an AI business case for the board be?' }, a: { de: 'Drei Seiten insgesamt: eine halbe Seite Imperativ, eine Seite Business Value, eine halbe Seite Readiness & Risiko, eine Seite Investment & Roadmap. Länger wird selten gelesen.', en: "Three pages total: half a page imperative, one page business value, half a page readiness & risk, one page investment & roadmap. Anything longer rarely gets read." } },
      { q: { de: 'Was, wenn der ROI wirklich erst in 3 Jahren sichtbar wird?', en: 'What if ROI really only shows up after 3 years?' }, a: { de: 'Genau das ehrlich benennen — und mit konkreten Quick Wins im ersten Jahr unterlegen. Die Mehrheit der Unternehmen braucht 2 bis 4 Jahre bis zum vollen ROI, das ist kein Warnsignal, sondern Normalfall.', en: "Name that honestly — and back it up with concrete quick wins in year one. Most companies need 2 to 4 years for full ROI; that's not a red flag, it's the norm." } },
      { q: { de: 'Ändern sich die KPIs, wenn ein Unternehmen vom Starter zum Scaler wird?', en: 'Do KPIs change as a company moves from Starter to Scaler?' }, a: { de: 'Ja, bewusst. Readiness-KPIs treten in den Hintergrund, Leading-KPIs rücken in den Fokus — das Framework wächst mit dem Archetyp mit, nicht andersherum.', en: 'Yes, deliberately. Readiness KPIs fade into the background, leading KPIs move into focus — the framework grows with the archetype, not the other way around.' } },
      { q: { de: 'Wie viele KPIs sollte ein einzelner Use Case im Business Case zeigen?', en: 'How many KPIs should a single use case show in the business case?' }, a: { de: 'Maximal fünf aktive KPIs. Mehr KPIs pro Use Case erzeugen vor allem Reporting-Aufwand, nicht mehr Erkenntnis für die Entscheidung.', en: 'A maximum of five active KPIs. More per use case mostly creates reporting overhead, not more decision-relevant insight.' } },
    ],
    bookChapter: { de: 'Kapitel 3', en: 'Chapter 3' },
    relatedSlugs: ['ai-reifegrad-starter-scaler-transformer', 'ai-governance-aufbauen'],
  },
  {
    slug: 'eu-ai-act-risikoklassen',
    category: { de: 'EU AI Act', en: 'EU AI Act' },
    navLabel: { de: 'EU AI Act für Unternehmen', en: 'EU AI Act for Companies' },
    title: {
      de: 'EU AI Act für Unternehmen: Welche Risikoklasse gilt für Ihr System — und was ist bis wann zu tun?',
      en: 'EU AI Act for Companies: Which Risk Class Applies to Your System — and What Needs to Happen by When?',
    },
    metaDescription: {
      de: 'Vier Risikoklassen, gestaffelte Fristen bis Dezember 2027, und warum KI-gestütztes Recruiting fast immer als Hochrisiko gilt — der Digital-Omnibus-Stand für Unternehmen.',
      en: 'Four risk classes, staggered deadlines through December 2027, and why AI-powered recruiting is almost always high-risk — the Digital Omnibus status for companies.',
    },
    eyebrow: { de: 'Leitfaden · Governance & Recht', en: 'Guide · Governance & Law' },
    kurzantwort: {
      de: 'Der AI Act sortiert KI-Systeme nicht nach Modell, sondern nach Einsatzzweck: Dasselbe Basismodell kann in einem Anwendungsfall minimal riskant sein und im nächsten hochriskant. Vier Klassen entscheiden über die Pflichten: verboten, hochrisiko, begrenzt riskant, minimal riskant. Der Irrtum, der Unternehmen am häufigsten teuer wird: KI-gestütztes Recruiting gilt fast immer als Hochrisiko — auch wenn es sich nur wie eine Zusatzfunktion in der Bewerber-Software anfühlt.',
      en: "The AI Act doesn't classify AI systems by model, but by purpose: the same foundation model can be minimal-risk in one use case and high-risk in the next. Four classes determine the obligations: prohibited, high-risk, limited-risk, minimal-risk. The costliest misconception for companies: AI-powered recruiting is almost always high-risk — even if it feels like just an add-on feature in existing applicant software.",
    },
    sections: [
      {
        heading: { de: 'Welche vier Risikoklassen unterscheidet der AI Act?', en: 'Which four risk classes does the AI Act distinguish?' },
        intro: {
          de: 'Die Einstufung hängt am Einsatzzweck, nicht am Modell: Dasselbe Foundation Model kann in einem Use Case minimal riskant sein und im nächsten hochriskant. Die Klasse ist damit eine Eigenschaft des konkreten Anwendungsfalls — nicht der Technologie dahinter. Die meisten Unternehmens-Use-Cases landen in den beiden mittleren Klassen.',
          en: "The classification depends on purpose, not model: the same foundation model can be minimal-risk in one use case and high-risk in the next. The class is thus a property of the specific application — not the technology behind it. Most enterprise use cases fall into the two middle classes.",
        },
        cards: [
          { tag: { de: 'Verboten', en: 'Prohibited' }, title: { de: 'Art. 5 — seit Februar 2025', en: 'Art. 5 — since February 2025' }, body: { de: 'Social Scoring, manipulative Systeme, biometrische Echtzeit-Überwachung im öffentlichen Raum. Absolutes Verbot, keine Ausnahmen.', en: 'Social scoring, manipulative systems, real-time biometric surveillance in public spaces. Absolute ban, no exceptions.' } },
          { tag: { de: 'Hochrisiko', en: 'High-risk' }, title: { de: 'Annex III', en: 'Annex III' }, body: { de: 'Bewerbungsprüfung, Leistungsbeurteilung, Bonitätsbewertung, Predictive Policing. Konformitätsbewertung, Dokumentation, menschliche Aufsicht, Registrierung.', en: 'Applicant screening, performance evaluation, credit scoring, predictive policing. Conformity assessment, documentation, human oversight, registration.' } },
          { tag: { de: 'Begrenzt riskant', en: 'Limited-risk' }, title: { de: 'Art. 50 — Kennzeichnungspflicht', en: 'Art. 50 — labeling requirement' }, body: { de: 'Chatbots, KI-generierte Inhalte, Emotionserkennung. Nutzer müssen wissen, dass sie mit einer KI interagieren.', en: 'Chatbots, AI-generated content, emotion recognition. Users must know they are interacting with an AI.' } },
          { tag: { de: 'Minimal riskant', en: 'Minimal-risk' }, title: { de: 'Der Großteil aller Systeme', en: 'The vast majority of systems' }, body: { de: 'KI-gestützte Suchfunktionen, Spam-Filter, Empfehlungssysteme, einfache Automatisierung. Keine AI-Act-Pflichten, DSGVO bleibt aber anwendbar.', en: 'AI-powered search, spam filters, recommendation systems, simple automation. No AI Act obligations, but GDPR still applies.' } },
        ],
      },
      {
        heading: { de: 'Bis wann muss mein System die Anforderungen erfüllen?', en: 'By when does my system need to meet the requirements?' },
        intro: {
          de: 'Die Fristen laufen gestaffelt, nicht auf einen Stichtag: Verbote und Transparenzpflichten gelten längst, General-Purpose-AI-Pflichten seit August 2025. Die große Verschiebung betrifft Hochrisiko-Systeme nach Anhang III — deren Pflichten wurden vom Digital Omnibus um 16 Monate auf Dezember 2027 verschoben, während Kennzeichnungs- und Transparenzpflichten unverändert früher greifen.',
          en: 'The deadlines are staggered, not a single cutoff: bans and transparency duties have long applied, general-purpose AI obligations since August 2025. The big shift affects high-risk Annex III systems — their obligations were pushed back 16 months to December 2027 by the Digital Omnibus, while labeling and transparency duties still kick in earlier, unchanged.',
        },
        facts: [
          { label: { de: '02.02.2025', en: 'Feb 2, 2025' }, body: { de: 'Verbotene Praktiken in Kraft: Art. 5 (Social Scoring, manipulative Systeme u. Ä.) sowie KI-Kompetenzpflichten (Art. 4) gelten seither.', en: 'Prohibited practices take effect: Art. 5 (social scoring, manipulative systems, etc.) and AI literacy obligations (Art. 4) apply from this date.' } },
          { label: { de: '02.08.2025', en: 'Aug 2, 2025' }, body: { de: 'Pflichten für General-Purpose-AI: Anbieter von Basismodellen, Governance-Strukturen und Bußgeldregime greifen.', en: 'Obligations for general-purpose AI: foundation model provider duties, governance structures, and the fine regime take effect.' } },
          { label: { de: '02.08.2026', en: 'Aug 2, 2026' }, body: { de: 'Transparenz- & Registrierungspflichten: Allgemeine Informations- und Registrierungspflichten für KI-Systeme werden anwendbar.', en: 'Transparency & registration duties: general information and registration obligations for AI systems become applicable.' } },
          { label: { de: '02.12.2026', en: 'Dec 2, 2026' }, body: { de: 'Kennzeichnungspflicht für KI-Inhalte: Art. 50 Abs. 2 (Kennzeichnung KI-generierter Inhalte) wird anwendbar.', en: 'Labeling requirement for AI content: Art. 50(2) (labeling of AI-generated content) becomes applicable.' } },
          { label: { de: '02.12.2027', en: 'Dec 2, 2027' }, body: { de: 'Hochrisiko-Systeme (Anhang III) — verschoben: Neue Frist durch Digital Omnibus (Einigung 07.05.2026) — 16 Monate später als ursprünglich geplant. Inhaltliche Pflichten (Art. 6–27) unverändert.', en: 'High-risk systems (Annex III) — postponed: new deadline via the Digital Omnibus (agreement May 7, 2026) — 16 months later than originally planned. Substantive obligations (Art. 6–27) unchanged.' } },
          { label: { de: '02.08.2028', en: 'Aug 2, 2028' }, body: { de: 'Hochrisiko als Sicherheitsbauteil (Anhang I): KI als Sicherheitskomponente in bereits regulierten Produkten (z. B. Maschinen, Medizinprodukte) — eigene, spätere Frist.', en: 'High-risk as a safety component (Annex I): AI as a safety component in already-regulated products (e.g. machinery, medical devices) — its own, later deadline.' } },
        ],
      },
      {
        heading: { de: 'Was hat der Digital Omnibus konkret geändert?', en: 'What exactly did the Digital Omnibus change?' },
        intro: {
          de: 'Der Digital Omnibus verschiebt nur die Fristen, nicht die inhaltlichen Anforderungen. Grund: harmonisierte Normen, an denen sich Unternehmen orientieren sollen, waren vor Ende 2026 nicht verfügbar — die EU wollte keine Pflicht ohne verlässlichen Prüfmaßstab in Kraft setzen, entschied sich aber bewusst gegen eine Aufweichung der Inhalte selbst.',
          en: 'The Digital Omnibus only shifts deadlines, not the substantive requirements. Reason: harmonized standards for companies to follow were not available before the end of 2026 — the EU didn\'t want to impose an obligation without a reliable benchmark, but deliberately chose not to water down the content itself.',
        },
        extraBody: {
          de: 'Wichtig dabei: Kein Regelwerk ersetzt ein anderes. DSGVO, der freiwillige GPAI Code of Practice (mit „Safe Harbor"-Wirkung) und der Zertifizierungsstandard ISO/IEC 42001 gelten parallel und kumulativ zum AI Act — wer nur auf eine Frist schaut, übersieht die anderen drei. Wer 2026 noch abwartet, verschenkt außerdem Vorlaufzeit: Risikomanagement und Dokumentation lassen sich unabhängig vom exakten Stichtag aufbauen.',
          en: "Important: no framework replaces another. GDPR, the voluntary GPAI Code of Practice (with \"safe harbor\" effect), and the ISO/IEC 42001 certification standard all apply in parallel and cumulatively with the AI Act — focusing on just one deadline means missing the other three. Waiting through 2026 also wastes lead time: risk management and documentation can be built up independent of the exact deadline.",
        },
        patternBox: {
          tag: { de: 'Anti-Pattern', en: 'Anti-pattern' },
          body: {
            de: 'Der Irrtum, der mir in Projekten am häufigsten begegnet: HR-KI gilt fast immer als Hochrisiko. Annex III Punkt 4 nennt Beschäftigung und Personalmanagement ausdrücklich — dazu zählen KI-gestützte Bewerberauswahl, Beförderungsentscheidungen und Leistungsbeurteilung. Wer KI-Recruiting-Funktionen in bestehender HR-Software aktiviert, ist damit sehr wahrscheinlich Hochrisiko-Deployer. Diese Einordnung gehört vor den Go-Live geprüft, nicht danach.',
            en: 'The misconception I encounter most often in projects: HR AI is almost always high-risk. Annex III point 4 explicitly names employment and workforce management — including AI-powered candidate screening, promotion decisions, and performance evaluation. Activating AI recruiting features in existing HR software very likely makes you a high-risk deployer. That classification belongs checked before go-live, not after.',
          },
        },
      },
    ],
    glossary: [
      { de: 'Hochrisiko-KI', en: 'High-Risk AI' },
      { de: 'Konformitätsbewertung', en: 'Conformity Assessment' },
      { de: 'Anhang III', en: 'Annex III' },
      { de: 'GPAI', en: 'GPAI' },
    ],
    ctaBand: {
      title: { de: 'In 10 Minuten wissen, wo Sie stehen', en: 'Know where you stand in 10 minutes' },
      body: { de: 'Das Compliance Center ordnet Ihr System den vier Risikoklassen zu und zeigt die konkret geltenden Pflichten und Fristen.', en: 'The Compliance Center maps your system to the four risk classes and shows the concrete obligations and deadlines that apply.' },
      linkLabel: { de: 'Jetzt einordnen →', en: 'Classify now →' },
    },
    faq: [
      { q: { de: 'Gilt die neue Frist (Dezember 2027) auch für bereits laufende Systeme?', en: 'Does the new deadline (December 2027) also apply to systems already in operation?' }, a: { de: 'Ja — die Verschiebung gilt für alle Anhang-III-Systeme unabhängig davon, ob sie neu eingeführt oder bereits im Einsatz sind. Wer schon vorbereitet ist, muss nicht auf die Frist warten und kann früher konform gehen.', en: "Yes — the postponement applies to all Annex III systems regardless of whether they're newly introduced or already in use. Companies that are already prepared don't need to wait for the deadline and can become compliant earlier." } },
      { q: { de: 'Ist KI-gestütztes Recruiting automatisch Hochrisiko?', en: 'Is AI-powered recruiting automatically high-risk?' }, a: { de: 'In den allermeisten Fällen ja. Annex III nennt Beschäftigung und Personalmanagement ausdrücklich als Hochrisiko-Bereich — auch KI-Zusatzfunktionen in bestehender HR-Software wie Bewerber-Screening fallen darunter. Die Einstufung gehört vor dem Rollout geprüft, nicht danach.', en: 'In the vast majority of cases, yes. Annex III explicitly names employment and workforce management as a high-risk area — including AI add-on features in existing HR software like applicant screening. The classification belongs checked before rollout, not after.' } },
      { q: { de: 'Betrifft mich der AI Act auch außerhalb der EU?', en: 'Does the AI Act affect me outside the EU too?' }, a: { de: 'Ja, wenn das Ergebnis Ihres Systems in der EU genutzt wird (Marktortprinzip) — unabhängig davon, wo Anbieter oder Betreiber sitzen.', en: "Yes, if your system's output is used in the EU (market-location principle) — regardless of where the provider or deployer is based." } },
      { q: { de: 'Reicht die Frist bis 2027, um jetzt noch nichts zu tun?', en: 'Is the 2027 deadline enough reason to do nothing yet?' }, a: { de: 'Technisch ja, praktisch nein: Konformitätsbewertung, Risikomanagement und Dokumentation brauchen bei komplexeren Systemen mehrere Monate Vorlauf — die verlängerte Frist ist Puffer, kein Freibrief.', en: 'Technically yes, practically no: conformity assessment, risk management, and documentation need several months of lead time for more complex systems — the extended deadline is a buffer, not a free pass.' } },
    ],
    bookChapter: { de: 'Kapitel 4', en: 'Chapter 4' },
    relatedSlugs: ['ai-governance-aufbauen', 'governance-entscheidungsbaum'],
  },
  {
    slug: '8-architekturprinzipien',
    category: { de: 'Referenzarchitekturen', en: 'Reference Architectures' },
    navLabel: { de: '8 Architekturprinzipien', en: '8 Architecture Principles' },
    title: {
      de: 'Welche 8 Architekturprinzipien gelten für jede produktionsreife AI-Plattform?',
      en: 'What 8 Architecture Principles Apply to Every Production-Ready AI Platform?',
    },
    metaDescription: {
      de: 'Acht verbindliche Leitplanken für jede AI-Architektur — von API First bis Interop over Lock-in, jeweils mit konkretem Verletzungsindikator.',
      en: 'Eight binding guardrails for every AI architecture — from API First to Interop over Lock-in, each with a concrete violation indicator.',
    },
    eyebrow: { de: 'Leitfaden · Architektur', en: 'Guide · Architecture' },
    kurzantwort: {
      de: 'Acht Prinzipien bilden die verbindlichen Leitplanken für jede AI-Architektur: API First, Human in the Loop, Explainability by Design, Fail Safe, saubere Kernsysteme, eine zentrale AI-Runway-Plattform, Datenqualität als Agentenqualität und Interop over Lock-in. Jedes Prinzip hat einen Verletzungsindikator — ein konkretes Signal, wann es gebrochen wird. Kein Go-Live ohne Prüfung aller acht.',
      en: 'Eight principles form the binding guardrails for every AI architecture: API First, Human in the Loop, Explainability by Design, Fail Safe, clean core systems first, a single AI runway platform, data quality as agent quality, and Interop over Lock-in. Each principle has a violation indicator — a concrete signal for when it gets broken. No go-live without checking all eight.',
    },
    sections: [
      {
        heading: { de: 'Was bedeuten die 8 Prinzipien konkret?', en: 'What do the 8 principles mean in practice?' },
        intro: {
          de: 'Architekturprinzipien sind keine Wunschliste, sondern verbindliche Leitplanken, die vor jeder Technologieentscheidung geprüft werden. Sie sind bewusst herstellerneutral formuliert — sie gelten unabhängig davon, welche Plattform, welches ERP oder welche Cloud im Hintergrund läuft.',
          en: "Architecture principles aren't a wish list — they're binding guardrails checked before every technology decision. They're deliberately vendor-neutral: they apply regardless of which platform, ERP, or cloud runs underneath.",
        },
        facts: [
          { label: { de: 'P1 · API First', en: 'P1 · API First' }, body: { de: 'Jede Funktionalität wird über eine dokumentierte, versionierte API exponiert — keine Direktzugriffe auf Datenbanken oder interne Strukturen. Verletzt, wenn: Custom-Code direkt auf interne Tabellen zugreift, keine REST/OData-Schicht vorhanden ist.', en: 'Every capability is exposed via a documented, versioned API — no direct access to databases or internal structures. Violated when: custom code directly accesses internal tables, no REST/OData layer exists.' } },
          { label: { de: 'P2 · Human in the Loop', en: 'P2 · Human in the Loop' }, body: { de: 'Jede AI-Entscheidung mit erheblicher Wirkung auf Personen, Finanzen oder kritische Prozesse hat einen definierten menschlichen Prüfpfad. Verletzt, wenn: ein Agent Transaktionen autonom ohne Schwellenwert-Eskalation durchführt.', en: 'Every AI decision with significant impact on people, finances, or critical processes has a defined human review path. Violated when: an agent performs transactions autonomously without threshold-based escalation.' } },
          { label: { de: 'P3 · Explainability by Design', en: 'P3 · Explainability by Design' }, body: { de: 'AI-Systeme in Produktion dokumentieren ihre Entscheidungsgrundlage nachvollziehbar — für Audit, Compliance und Nutzervertrauen. Verletzt, wenn: ein Output ohne Quellenangabe, Konfidenzwert oder Begründungspfad geliefert wird.', en: 'Production AI systems document their decision basis traceably — for audit, compliance, and user trust. Violated when: output is delivered without source attribution, confidence value, or reasoning path.' } },
          { label: { de: 'P4 · Fail Safe & Graceful', en: 'P4 · Fail Safe & Graceful' }, body: { de: 'Jedes AI-System hat einen definierten Fallback-Pfad für Ausfälle, niedrige Konfidenz und Out-of-Scope-Anfragen. Verletzt, wenn: kein Fallback definiert ist und ein Ausfall den Kernprozess blockiert.', en: 'Every AI system has a defined fallback path for outages, low confidence, and out-of-scope requests. Violated when: no fallback is defined and an outage blocks the core process.' } },
          { label: { de: 'P5 · Saubere Kernsysteme First', en: 'P5 · Clean Core Systems First' }, body: { de: 'Kein AI-Deployment auf Basis eines nicht sanierten Kernsystems — ein sauberer Datenkern ist Eintrittsbedingung, nicht Zukunftsprojekt. Verletzt, wenn: AI-Investitionen auf stark individualisierten Systemen ohne Sanierungs-Roadmap laufen.', en: 'No AI deployment on top of an unremediated core system — a clean data core is an entry condition, not a future project. Violated when: AI investments run on heavily customized systems without a remediation roadmap.' } },
          { label: { de: 'P6 · Eine zentrale AI-Runway', en: 'P6 · A Single AI Runway' }, body: { de: 'Eine dokumentierte Plattform ist die primäre Basis für AI-Extensions und Custom Agents — kein paralleler proprietärer AI-Stack. Verletzt, wenn: ein eigener LLM-Stack außerhalb der zentralen Plattform aufgebaut wird.', en: 'A documented platform is the primary basis for AI extensions and custom agents — no parallel proprietary AI stack. Violated when: a separate LLM stack is built outside the central platform.' } },
          { label: { de: 'P7 · Datenqualität = Agentenqualität', en: 'P7 · Data Quality = Agent Quality' }, body: { de: 'Die Qualität jedes AI-Agenten ist eine direkte Funktion der Master-Data-Governance — keine Governance heißt keine zuverlässigen Agenten. Verletzt, wenn: ein Agent inkonsistente Ergebnisse liefert, weil Stammdaten dupliziert sind.', en: "Every AI agent's quality is a direct function of master data governance — no governance means no reliable agents. Violated when: an agent delivers inconsistent results because master data is duplicated." } },
          { label: { de: 'P8 · Interop over Lock-in', en: 'P8 · Interop over Lock-in' }, body: { de: 'Architekturentscheidungen priorisieren Interoperabilität (offene Protokolle, offene APIs) gegenüber herstellerspezifischen Stacks. Verletzt, wenn: ein vollständiger Agent-Stack eines Anbieters ohne Exit-Strategie besteht.', en: 'Architecture decisions prioritize interoperability (open protocols, open APIs) over vendor-specific stacks. Violated when: a complete single-vendor agent stack exists with no exit strategy.' } },
        ],
        patternBox: {
          tag: { de: 'Anti-Pattern', en: 'Anti-pattern' },
          body: {
            de: 'Die am häufigsten unterschätzte Schicht ist die Orchestrierung — nicht Daten, nicht Modell. Ohne Prompt Registry werden Prompts manuell im Code vergraben. Ohne MLOps veralten Modelle unbemerkt. Ohne Monitoring entstehen keine Feedback-Loops für Verbesserungen. Die Investition in diese Schicht zahlt sich spätestens ab dem zweiten produktiven Use Case aus — wer sie beim ersten Use Case überspringt, baut die Schulden für alle folgenden mit auf.',
            en: "The most underestimated layer is orchestration — not data, not the model. Without a prompt registry, prompts get buried manually in code. Without MLOps, models go stale unnoticed. Without monitoring, no feedback loops for improvement emerge. Investing in this layer pays off by the second production use case at the latest — skipping it on the first use case just builds debt into every one that follows.",
          },
        },
      },
    ],
    glossary: [
      { de: 'API First', en: 'API First' },
      { de: 'Human in the Loop', en: 'Human in the Loop' },
      { de: 'Explainability', en: 'Explainability' },
      { de: 'Interop over Lock-in', en: 'Interop over Lock-in' },
    ],
    ctaBand: {
      title: { de: 'Alle 8 Prinzipien vor jedem Go-Live prüfen', en: 'Check all 8 principles before every go-live' },
      body: { de: 'Die Architektur-Checkliste im Produkt führt jeden Use Case durch alle acht Prinzipien und dokumentiert Abweichungen automatisch.', en: 'The architecture checklist in the product runs every use case through all eight principles and documents deviations automatically.' },
      linkLabel: { de: 'Architektur-Checkliste öffnen →', en: 'Open the architecture checklist →' },
    },
    faq: [
      { q: { de: 'Müssen alle 8 Prinzipien gleichzeitig umgesetzt sein?', en: 'Do all 8 principles need to be implemented simultaneously?' }, a: { de: 'Vor jedem Go-Live müssen alle acht geprüft werden — das heißt aber nicht, dass jedes Prinzip zu 100 % erfüllt sein muss. Wichtiger ist, bewusste Abweichungen zu dokumentieren statt sie zu übersehen.', en: "All eight must be checked before every go-live — but that doesn't mean each principle must be 100% fulfilled. What matters more is documenting deliberate deviations instead of overlooking them." } },
      { q: { de: 'Was, wenn unser Kernsystem noch nicht sauber ist?', en: "What if our core system isn't clean yet?" }, a: { de: 'Dann sollte die Sanierungs-Roadmap Teil des AI-Projektplans werden, nicht eine separate Entscheidung. Prinzip P5 verlangt eine Roadmap, keine sofortige Perfektion.', en: 'Then the remediation roadmap should become part of the AI project plan, not a separate decision. Principle P5 requires a roadmap, not immediate perfection.' } },
      { q: { de: 'Bedeutet Interop over Lock-in, dass man keine Plattform-Standardprodukte nutzen darf?', en: 'Does Interop over Lock-in mean you can never use standard platform products?' }, a: { de: 'Nein. Es bedeutet, dass offene Protokolle und ein Exit-Pfad von Anfang an mitgeplant werden — auch wenn man sich bewusst für eine zentrale Plattform entscheidet.', en: 'No. It means open protocols and an exit path are planned in from the start — even when you deliberately choose a central platform.' } },
      { q: { de: 'Wer prüft die 8 Prinzipien vor Go-Live?', en: 'Who checks the 8 principles before go-live?' }, a: { de: 'In der Praxis das Architektur- oder AI-Governance-Board gemeinsam mit dem verantwortlichen AI Engineer — dieselben Rollen, die auch die Go-Live-Freigabe erteilen.', en: 'In practice, the architecture or AI governance board together with the responsible AI engineer — the same roles that grant go-live approval.' } },
    ],
    bookChapter: { de: 'Kapitel 5', en: 'Chapter 5' },
    relatedSlugs: ['warum-ai-projekte-scheitern', 'ai-governance-aufbauen'],
  },
]

export function getGuide(slug: string): Guide | undefined {
  return GUIDES.find((g) => g.slug === slug)
}

export interface HubCategory {
  name: Bi
  count: Bi
  slugs: string[]
}

export const HUB_CATEGORIES: HubCategory[] = [
  { name: { de: 'AI-Readiness', en: 'AI Readiness' }, count: { de: '3 Guides', en: '3 guides' }, slugs: ['warum-ai-projekte-scheitern', 'ai-readiness-quick-scan', 'ai-reifegrad-starter-scaler-transformer'] },
  { name: { de: 'Use-Case-Priorisierung', en: 'Use Case Prioritization' }, count: { de: '1 Guide', en: '1 guide' }, slugs: ['ai-business-case'] },
  { name: { de: 'AI-Governance', en: 'AI Governance' }, count: { de: '2 Guides', en: '2 guides' }, slugs: ['ai-governance-aufbauen', 'governance-entscheidungsbaum'] },
  { name: { de: 'EU AI Act', en: 'EU AI Act' }, count: { de: '1 Guide', en: '1 guide' }, slugs: ['eu-ai-act-risikoklassen'] },
  { name: { de: 'Referenzarchitekturen', en: 'Reference Architectures' }, count: { de: '1 Guide', en: '1 guide' }, slugs: ['8-architekturprinzipien'] },
]

export const HUB_GLOSSARY: { term: Bi; slug: string }[] = [
  { term: { de: 'Hochrisiko-KI', en: 'High-Risk AI' }, slug: 'eu-ai-act-risikoklassen' },
  { term: { de: 'Konformitätsbewertung', en: 'Conformity Assessment' }, slug: 'eu-ai-act-risikoklassen' },
  { term: { de: 'GPAI', en: 'GPAI' }, slug: 'eu-ai-act-risikoklassen' },
  { term: { de: 'Clean Core', en: 'Clean Core' }, slug: 'ai-readiness-quick-scan' },
  { term: { de: 'AI Value Canvas', en: 'AI Value Canvas' }, slug: 'ai-business-case' },
  { term: { de: 'Anhang III', en: 'Annex III' }, slug: 'eu-ai-act-risikoklassen' },
]

// ---------------------------------------------------------------------------
// Pricing page content (real prices sourced from src/config/tiers.ts)
// ---------------------------------------------------------------------------

export interface PricingRow {
  label: Bi
  why?: Bi
  free: 'yes' | 'no' | Bi
  freeNote?: Bi
  pro: 'yes' | 'no' | Bi
  proNote?: Bi
}

export interface PricingGroup {
  title: Bi
  rows: PricingRow[]
}

export const PRICING_GROUPS: PricingGroup[] = [
  {
    title: { de: 'Werkzeuge', en: 'Tools' },
    rows: [
      { label: { de: 'AI-Readiness Assessment', en: 'AI Readiness Assessment' }, why: { de: 'Free: kompakter Quick Scan · Pro: vollständiger Fragenkatalog über 6 Dimensionen', en: 'Free: compact quick scan · Pro: full question set across 6 dimensions' }, free: 'yes', freeNote: { de: 'Quick Scan', en: 'Quick Scan' }, pro: 'yes', proNote: { de: 'vollständig', en: 'full' } },
      { label: { de: 'AI Use-Case Canvas', en: 'AI Use-Case Canvas' }, free: 'yes', pro: 'yes' },
      { label: { de: 'Use-Case Scoring', en: 'Use-Case Scoring' }, why: { de: 'Free mit begrenztem Portfolio — Grenze wird live aus der Konfiguration angezeigt', en: 'Free with a limited portfolio — the limit is shown live from configuration' }, free: 'yes', freeNote: { de: 'begrenztes Portfolio', en: 'limited portfolio' }, pro: 'yes', proNote: { de: 'unbegrenzt', en: 'unlimited' } },
      { label: { de: 'Governance-Check', en: 'Governance Check' }, free: 'yes', pro: 'yes' },
      { label: { de: 'Roadmap-Generator', en: 'Roadmap Generator' }, free: 'yes', pro: 'yes' },
      { label: { de: 'Architektur-Generator', en: 'Architecture Generator' }, why: { de: 'Referenzarchitektur, EAM-Landkarte, RASIC', en: 'Reference architecture, EAM map, RASIC' }, free: 'no', pro: 'yes' },
      { label: { de: 'Compliance Center', en: 'Compliance Center' }, why: { de: 'EU AI Act, DSGVO-Checkliste, Risikomatrix, Policies', en: 'EU AI Act, GDPR checklist, risk matrix, policies' }, free: 'no', pro: 'yes' },
    ],
  },
  {
    title: { de: 'Arbeiten & Ergebnisse', en: 'Work & Results' },
    rows: [
      { label: { de: 'Ergebnisse speichern', en: 'Save results' }, why: { de: 'Free kann Ergebnisse speichern — mit einer limitierten Anzahl pro Tag je Werkzeug. Pro speichert unbegrenzt.', en: 'Free can save results — with a limited number per day per tool. Pro saves without limit.' }, free: 'yes', freeNote: { de: 'limitiert pro Tag', en: 'limited per day' }, pro: 'yes', proNote: { de: 'unbegrenzt', en: 'unlimited' } },
      { label: { de: 'PDF-Export', en: 'PDF export' }, free: 'no', pro: 'yes' },
      { label: { de: 'Teilen per Link', en: 'Share via link' }, free: 'no', pro: 'yes' },
      { label: { de: 'Versionen', en: 'Versions' }, free: 'no', pro: 'yes' },
      { label: { de: 'Präsentationsvorlagen (Boardroom, Blueprint)', en: 'Presentation templates (Boardroom, Blueprint)' }, free: 'no', pro: 'yes' },
    ],
  },
  {
    title: { de: 'Intelligenz', en: 'Intelligence' },
    rows: [
      { label: { de: 'Semantische Kontext-Erkennung', en: 'Semantic context detection' }, why: { de: 'Läuft lokal & regelbasiert — keine KI-Aufrufe nötig', en: 'Runs locally & rule-based — no AI calls needed' }, free: 'yes', freeNote: { de: 'unbegrenzt', en: 'unlimited' }, pro: 'yes', proNote: { de: 'unbegrenzt', en: 'unlimited' } },
      { label: { de: 'KI-Analysen', en: 'AI analyses' }, why: { de: 'Vorschläge, Einordnungen, Narrative — Kontingent täglich', en: 'Suggestions, classifications, narratives — daily allowance' }, free: 'yes', freeNote: { de: 'Probier-Kontingent', en: 'trial allowance' }, pro: 'yes', proNote: { de: 'erweitertes Kontingent', en: 'expanded allowance' } },
    ],
  },
  {
    title: { de: 'Vertrauen', en: 'Trust' },
    rows: [
      { label: { de: 'EU-Hosting (Frankfurt) · DSGVO · ohne Cookies', en: 'EU hosting (Frankfurt) · GDPR · no cookies' }, free: 'yes', pro: 'yes' },
    ],
  },
]
