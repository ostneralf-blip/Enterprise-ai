// EU AI Act Art. 6 Klassifikator — deterministisch, kein LLM, Free-Tier-fähig
// Rechtsgrundlage: Art. 6 Abs. 2+3+4, Anhang III Nr. 4 (Beschäftigung)
// Stand: 15.07.2026 · Digital Omnibus (EP 16.06.2026, Rat 29.06.2026) berücksichtigt

export const AI_ACT_DATES = {
  annex3_deadline:             '02.12.2027',  // verschoben von 02.08.2026
  existing_systems_exempt:     '02.12.2027',  // Bestandssysteme ohne wesentliche Änderung
  public_authority_deadline:   '02.08.2030',
} as const

export type AiActDomain = 'employment' | 'none'
export type AiActResult = 'hochrisiko' | 'anhang_iii_ausgenommen' | 'nicht_anhang_iii'
export type AiActExemption = 'a' | 'b' | 'c' | 'd'

export interface AiActAnswers {
  affectsPersons:       boolean   // Trifft/beeinflusst das System Entscheidungen über natürliche Personen?
  involvesProfiling:    boolean   // Findet Profiling statt (Leistung, Verhalten, Zuverlässigkeit)?
  isNarrowProcedural:   boolean   // Eng gefasste prozedurale/vorbereitende Aufgabe (z. B. Datenextraktion)?
  humanReviewsBefore:   boolean   // Prüft ein Mensch das Ergebnis, bevor es wirksam wird?
}

export interface AiActClassification {
  result:           AiActResult
  exemption?:       AiActExemption
  profilingOverride: boolean
}

export interface AiActAssessment {
  domain:            AiActDomain
  answers:           AiActAnswers
  classification:    AiActClassification
  documentationText: { de: string; en: string }
  assessedAt:        string
}

// ─── Domain-Erkennung aus Canvas-Text ─────────────────────────────────────────

const EMPLOYMENT_PATTERNS = [
  /beschäftigung|personalmanagement|hr\b|human.?resources?/i,
  /recruiting|bewerbung|bewerbungs|bewerber|kandidaten/i,
  /onboarding|personalentwicklung|leistungsbeurteilung|leistungsbewertung/i,
  /kündigung|beförderung|gehalts|lohn|vergütung/i,
  /aufgabenzuweisung|mitarbeiter(?!in)|workforce/i,
  /successfactor|workday|sap hcm|personio|bamboohr/i,
]

export function detectAiActDomain(canvasText: string): AiActDomain {
  const lower = canvasText.toLowerCase()
  if (EMPLOYMENT_PATTERNS.some(p => p.test(lower))) return 'employment'
  return 'none'
}

// ─── Klassifikations-Logik (Art. 6 Abs. 2 + 3) ───────────────────────────────

export function classifyAiAct(
  domain: AiActDomain,
  answers: AiActAnswers,
): AiActClassification {
  if (domain === 'none') {
    return { result: 'nicht_anhang_iii', profilingOverride: false }
  }

  // Profiling-Override: immer hochrisiko, unabhängig von Ausnahmen (Art. 6 Abs. 3 a.E.)
  if (answers.involvesProfiling) {
    return { result: 'hochrisiko', profilingOverride: true }
  }

  // Kein Einfluss auf Entscheidungen über natürliche Personen → nicht Anhang III
  if (!answers.affectsPersons) {
    return { result: 'nicht_anhang_iii', profilingOverride: false }
  }

  // Eng gefasste prozedurale Aufgabe → Ausnahme lit. a (Art. 6 Abs. 3 lit. a)
  // Offizielles Beispiel der Kommission: Umwandlung unstrukturierter in strukturierte Daten
  if (answers.isNarrowProcedural) {
    return { result: 'anhang_iii_ausgenommen', exemption: 'a', profilingOverride: false }
  }

  // Mensch prüft Ergebnis → Ausnahme lit. b (Verbesserung einer abgeschlossenen menschlichen Tätigkeit)
  if (answers.humanReviewsBefore) {
    return { result: 'anhang_iii_ausgenommen', exemption: 'b', profilingOverride: false }
  }

  // Keiner der Ausnahme-Tatbestände → hochrisiko (Anhang III Nr. 4)
  return { result: 'hochrisiko', profilingOverride: false }
}

// ─── Doku-Absatz (Art. 6 Abs. 4) ─────────────────────────────────────────────

const EXEMPTION_TEXT = {
  de: {
    a: 'Art. 6 Abs. 3 lit. a EU AI Act: Das System beschränkt sich auf eine eng gefasste prozedurale Aufgabe (z. B. Strukturierung oder Extraktion von Daten) ohne eigenständige Entscheidung über natürliche Personen.',
    b: 'Art. 6 Abs. 3 lit. b EU AI Act: Das System verbessert das Ergebnis einer bereits abgeschlossenen menschlichen Tätigkeit; ein Mensch prüft das Ergebnis, bevor es wirksam wird.',
    c: 'Art. 6 Abs. 3 lit. c EU AI Act: Das System erkennt Muster oder Anomalien, ersetzt jedoch nicht die menschliche Bewertung des Ergebnisses.',
    d: 'Art. 6 Abs. 3 lit. d EU AI Act: Das System führt eine vorbereitende Aufgabe aus, deren Output keine unmittelbare Entscheidungsrelevanz hat.',
  },
  en: {
    a: 'Art. 6(3)(a) EU AI Act: The system is limited to a narrowly defined procedural task (e.g. structuring or extracting data) without autonomous decisions affecting natural persons.',
    b: 'Art. 6(3)(b) EU AI Act: The system improves the result of a previously completed human activity; a human reviews the output before it takes effect.',
    c: 'Art. 6(3)(c) EU AI Act: The system detects patterns or anomalies but does not replace human evaluation of the result.',
    d: 'Art. 6(3)(d) EU AI Act: The system performs a preparatory task whose output has no direct decision-making relevance.',
  },
}

export function generateDocumentationText(
  domain: AiActDomain,
  classification: AiActClassification,
  answers: AiActAnswers,
  canvasTitle: string,
): { de: string; en: string } {
  const { result, exemption, profilingOverride } = classification

  if (result === 'nicht_anhang_iii') {
    return {
      de: `Das KI-System „${canvasTitle}" fällt nicht in den Anwendungsbereich von Anhang III EU AI Act, da kein Beschäftigungs-/Personalmanagement-Kontext erkannt wurde oder das System keine Entscheidungen über natürliche Personen trifft. Eine Hochrisiko-Einstufung nach Art. 6 Abs. 2 EU AI Act ist nicht einschlägig. Hinweis: Weitere Anhang-III-Kategorien (z. B. Bildung, Kredit, biometrische Identifikation) wurden nicht geprüft. Bewertung ersetzt keine Rechtsberatung.`,
      en: `The AI system "${canvasTitle}" does not fall within the scope of Annex III of the EU AI Act, as no employment/HR context was detected or the system does not make decisions affecting natural persons. High-risk classification under Art. 6(2) EU AI Act is not applicable. Note: Other Annex III categories (e.g. education, credit, biometric identification) were not assessed. This assessment does not replace legal advice.`,
    }
  }

  if (result === 'hochrisiko') {
    const profilingNote = profilingOverride
      ? { de: ' Das System führt Profiling natürlicher Personen durch (Bewertung von Leistung, Verhalten oder Zuverlässigkeit) — Art. 6 Abs. 3 Ausnahmen gelten gemäß dem vorletzten Satz nicht.', en: ' The system involves profiling of natural persons (assessment of performance, behaviour or reliability) — Art. 6(3) exceptions do not apply per the penultimate sentence.' }
      : { de: '', en: '' }
    return {
      de: `Das KI-System „${canvasTitle}" ist als Hochrisiko-KI-System gemäß Art. 6 Abs. 2 i. V. m. Anhang III Nr. 4 EU AI Act einzustufen (Beschäftigung und Personalverwaltung).${profilingNote.de} Die einschlägigen Hochrisiko-Pflichten (Art. 9–15 EU AI Act) gelten ab ${AI_ACT_DATES.annex3_deadline} (Digital Omnibus, EP 16.06.2026). Für bestehende Systeme ohne wesentliche Designänderung gilt Bestandsschutz bis ${AI_ACT_DATES.existing_systems_exempt}; für den Behördeneinsatz bis ${AI_ACT_DATES.public_authority_deadline}. Registrierung nach Art. 49 Abs. 1 EU AI Act erforderlich. Diese Bewertung ist gemäß Art. 6 Abs. 4 EU AI Act zu dokumentieren und aufzubewahren. Hinweis: Ersetzt keine Rechtsberatung.`,
      en: `The AI system "${canvasTitle}" must be classified as a high-risk AI system pursuant to Art. 6(2) in conjunction with Annex III No. 4 EU AI Act (employment and HR management).${profilingNote.en} The applicable high-risk obligations (Arts. 9–15 EU AI Act) apply from ${AI_ACT_DATES.annex3_deadline} (Digital Omnibus, EP 16 June 2026). Existing systems without significant design changes are exempt until ${AI_ACT_DATES.existing_systems_exempt}; for public authority deployment until ${AI_ACT_DATES.public_authority_deadline}. Registration under Art. 49(1) EU AI Act is required. This assessment must be documented and retained pursuant to Art. 6(4) EU AI Act. Note: This does not replace legal advice.`,
    }
  }

  // anhang_iii_ausgenommen
  const exemptionDe = exemption ? EXEMPTION_TEXT.de[exemption] : ''
  const exemptionEn = exemption ? EXEMPTION_TEXT.en[exemption] : ''
  const answersSummaryDe = [
    answers.affectsPersons ? 'betrifft Entscheidungen über natürliche Personen' : null,
    !answers.involvesProfiling ? 'kein Profiling' : null,
    answers.isNarrowProcedural ? 'eng gefasste prozedurale Aufgabe' : null,
    answers.humanReviewsBefore ? 'Mensch prüft vor Wirksamkeit' : null,
  ].filter(Boolean).join('; ')

  return {
    de: `Das KI-System „${canvasTitle}" fällt zwar in den Anwendungsbereich von Anhang III Nr. 4 EU AI Act (Beschäftigung), ist jedoch nach Art. 6 Abs. 3 EU AI Act von der Hochrisiko-Einstufung ausgenommen. Sachverhalt: ${answersSummaryDe}. Einschlägige Ausnahmeregelung: ${exemptionDe} Die Bewertung ist gemäß Art. 6 Abs. 4 EU AI Act zu dokumentieren; eine Registrierung nach Art. 49 Abs. 2 EU AI Act wird empfohlen. Fristen gemäß Digital Omnibus (EP 16.06.2026): Hochrisiko-Pflichten ab ${AI_ACT_DATES.annex3_deadline}. Hinweis: Ersetzt keine Rechtsberatung.`,
    en: `The AI system "${canvasTitle}" falls within the scope of Annex III No. 4 EU AI Act (employment) but is exempt from high-risk classification under Art. 6(3) EU AI Act. Facts: ${[answers.affectsPersons ? 'affects decisions about natural persons' : null, !answers.involvesProfiling ? 'no profiling' : null, answers.isNarrowProcedural ? 'narrow procedural task' : null, answers.humanReviewsBefore ? 'human reviews before effect' : null].filter(Boolean).join('; ')}. Applicable exemption: ${exemptionEn} The assessment must be documented pursuant to Art. 6(4) EU AI Act; registration under Art. 49(2) EU AI Act is recommended. Deadlines per Digital Omnibus (EP 16 June 2026): high-risk obligations from ${AI_ACT_DATES.annex3_deadline}. Note: This does not replace legal advice.`,
  }
}
