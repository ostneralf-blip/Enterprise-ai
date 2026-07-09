-- Policy Templates: DB-gesteuerte Vorlagen für den Compliance-Bereich
-- Ersetzt die hardcodierten POLICY_TEMPLATES in compliance-data.ts
-- Wird analog content_library verwaltet (Admin-CRUD, is_published, display_order)

create table if not exists policy_templates (
  id            uuid primary key default gen_random_uuid(),
  slug          text not null,
  locale        text not null default 'de',
  title         text not null,
  subtitle      text not null,
  content       text not null,
  is_published  boolean not null default true,
  display_order integer not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (slug, locale)
);

-- RLS aktivieren
alter table policy_templates enable row level security;

-- Authentifizierte User können veröffentlichte Templates lesen
create policy "published_templates_readable_by_auth_users"
  on policy_templates
  for select
  to authenticated
  using (is_published = true);

-- Admins dürfen alles (lesen, einfügen, bearbeiten, löschen)
create policy "admins_full_access_policy_templates"
  on policy_templates
  for all
  to authenticated
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
        and profiles.is_admin = true
    )
  );

-- Trigger: updated_at automatisch setzen
create or replace function update_policy_templates_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_policy_templates_updated_at
  before update on policy_templates
  for each row execute function update_policy_templates_updated_at();

-- ── Seed: 4 DE-Templates (aus compliance-data.ts übertragen) ──────────────────

insert into policy_templates (slug, locale, title, subtitle, content, display_order) values
(
  'ai_usage',
  'de',
  'KI-Nutzungsrichtlinie',
  'Interne Richtlinie für den Einsatz von KI-Tools',
  '# KI-Nutzungsrichtlinie

**Version:** 1.0 | **Stand:** [Datum] | **Verantwortlich:** [Name/Rolle]

## 1. Geltungsbereich

Diese Richtlinie gilt für alle Mitarbeitenden von [Unternehmen], die KI-gestützte Tools und Systeme im Rahmen ihrer beruflichen Tätigkeit einsetzen.

## 2. Erlaubte Nutzung

- Produktivitätssteigerung bei klar definierten, risikoarmen Aufgaben
- Unterstützung bei Recherche, Textentwürfen und Datenanalyse
- Entwicklung und Test von Prototypen unter Aufsicht

## 3. Verbotene Nutzung

- Verarbeitung personenbezogener Daten ohne Datenschutzprüfung
- Entscheidungen mit rechtlicher oder erheblicher wirtschaftlicher Wirkung ohne menschliche Kontrolle
- Weitergabe vertraulicher Unternehmensdaten an externe KI-Dienste

## 4. Transparenzpflicht

Mitarbeitende kennzeichnen KI-generierte Inhalte als solche, sofern sie nach außen kommuniziert werden.

## 5. Verantwortlichkeit

Jede Person trägt die Verantwortung für die von ihr verwendeten oder weitergegebenen KI-Ausgaben.

---
*Genehmigt durch: [Geschäftsführung / CISO]
Nächste Überprüfung: [Datum]*',
  1
),
(
  'model_card',
  'de',
  'Model Card',
  'Transparenz-Dokument für KI-Modelle',
  '# Model Card: [Modellname]

## Modell-Steckbrief

| Feld | Wert |
|------|------|
| **Modellname** | [Name und Version] |
| **Typ** | [z. B. Large Language Model, Bildklassifikation] |
| **Anbieter** | [Anbieter / Open Source] |
| **Einsatzbereich** | [Beschreibung] |
| **EU AI Act Risikoklasse** | [Minimal / Begrenzt / Hochrisiko] |

## Trainingsdaten

- **Datenquelle:** [Beschreibung der Trainingsdaten]
- **Zeitraum:** [Von – Bis]
- **Bekannte Lücken:** [Fehlende Domänen, Sprachen, demografische Gruppen]

## Evaluierung & Leistung

| Metrik | Wert | Benchmark |
|--------|------|----------|
| Genauigkeit | [X%] | [Datensatz] |
| F1-Score | [X] | [Datensatz] |

## Bekannte Einschränkungen

- [Einschränkung 1]
- [Einschränkung 2]

## Datenschutz & Sicherheit

- Verarbeitung personenbezogener Daten: [Ja / Nein / Unter Bedingungen]
- DSGVO-Prüfung durchgeführt: [Ja / Nein / Ausstehend]

---
*Erstellt: [Datum] | Verantwortlich: [Name]*',
  2
),
(
  'incident_response',
  'de',
  'KI-Incident-Response-Plan',
  'Notfallplan für KI-bezogene Vorfälle',
  '# KI-Incident-Response-Plan

**Version:** 1.0 | **Stand:** [Datum]

## 1. Vorfallkategorien

| Schweregrad | Beschreibung | Reaktionszeit |
|-------------|--------------|---------------|
| **P1 – Kritisch** | Fehlerhafte Entscheidungen mit rechtlicher Wirkung | Sofort (< 1 Std.) |
| **P2 – Hoch** | Datenschutzverletzung oder Bias-Vorfall | < 4 Stunden |
| **P3 – Mittel** | Qualitätsabfall ohne unmittelbaren Schaden | < 24 Stunden |
| **P4 – Niedrig** | Technischer Fehler ohne Auswirkung | < 72 Stunden |

## 2. Eskalationspfad

1. **Ersterkennung:** Meldepflicht an direkten Vorgesetzten und KI-Verantwortlichen
2. **Erstbewertung:** KI-Verantwortlicher klassifiziert Schweregrad
3. **P1/P2:** Sofortige Eskalation an CISO und Datenschutzbeauftragten
4. **Dokumentation:** Incident-Log in [System] innerhalb von 2 Stunden

## 3. Sofortmaßnahmen

- [ ] KI-System deaktivieren oder auf manuellen Betrieb umschalten
- [ ] Betroffene Datensätze isolieren
- [ ] Stakeholder intern informieren
- [ ] Bei DSGVO-Verletzung: Meldepflicht innerhalb 72 Stunden prüfen

## 4. Nachsorge

- Root-Cause-Analyse innerhalb von 5 Werktagen
- Maßnahmenplan mit Verantwortlichen und Terminen
- Lessons-Learned-Dokumentation

---
*Verantwortlich: [CISO / KI-Beauftragter]
Letzte Übung: [Datum]*',
  3
),
(
  'supplier_checklist',
  'de',
  'KI-Lieferanten-Checkliste',
  'Due Diligence für externe KI-Anbieter',
  '# KI-Lieferanten-Checkliste

**Anbieter:** [Name] | **Produkt:** [Produktname] | **Datum:** [Datum]

## A. Rechtliche & Compliance-Anforderungen

- [ ] Auftragsverarbeitungsvertrag (AVV) nach Art. 28 DSGVO abgeschlossen
- [ ] Datenverarbeitung ausschließlich in der EU oder mit angemessenem Schutzniveau
- [ ] EU AI Act Konformität bestätigt (ggf. Zertifikat vorliegend)
- [ ] Technische und organisatorische Maßnahmen (TOMs) dokumentiert

## B. Technische Sicherheit

- [ ] SOC 2 Typ II oder ISO 27001 Zertifizierung vorhanden
- [ ] Penetrationstests regelmäßig durchgeführt (mind. jährlich)
- [ ] Verschlüsselung in Transit und at Rest bestätigt
- [ ] Incident-Response-Plan vorhanden und getestet

## C. KI-spezifische Anforderungen

- [ ] Model Cards oder vergleichbare Transparenz-Dokumentation verfügbar
- [ ] Bias-Testing und Fairness-Evaluierung nachgewiesen
- [ ] Möglichkeit zum Opt-out aus Training mit unseren Daten
- [ ] Erklärbarkeit von KI-Entscheidungen gewährleistet (falls relevant)

## D. Operatives

- [ ] SLA für Verfügbarkeit und Support definiert
- [ ] Exit-Strategie und Datenrückgabe-Prozess vereinbart
- [ ] Regelmäßige Compliance-Reviews vereinbart (mind. jährlich)

## Bewertung

| Bereich | Erfüllt | Offen | Nicht anwendbar |
|---------|---------|-------|-----------------|
| Rechtlich | | | |
| Technisch | | | |
| KI-spezifisch | | | |
| Operativ | | | |

**Empfehlung:** [ ] Freigabe  [ ] Freigabe mit Auflagen  [ ] Ablehnung

---
*Geprüft durch: [Name]
Freigegeben durch: [Name]*',
  4
);

-- ── Seed: 4 EN-Templates ──────────────────────────────────────────────────────

insert into policy_templates (slug, locale, title, subtitle, content, display_order) values
(
  'ai_usage',
  'en',
  'AI Usage Policy',
  'Internal policy for the use of AI tools',
  '# AI Usage Policy

**Version:** 1.0 | **Date:** [Date] | **Owner:** [Name/Role]

## 1. Scope

This policy applies to all employees of [Company] who use AI-powered tools and systems in the course of their professional activities.

## 2. Permitted Use

- Productivity enhancement for clearly defined, low-risk tasks
- Support for research, drafting texts, and data analysis
- Development and testing of prototypes under supervision

## 3. Prohibited Use

- Processing personal data without a data protection review
- Decisions with legal or significant economic impact without human oversight
- Sharing confidential company data with external AI services

## 4. Transparency Obligation

Employees label AI-generated content as such when it is communicated externally.

## 5. Accountability

Each person bears responsibility for the AI outputs they use or pass on.

---
*Approved by: [Management / CISO]
Next review: [Date]*',
  1
),
(
  'model_card',
  'en',
  'Model Card',
  'Transparency document for AI models',
  '# Model Card: [Model Name]

## Model Overview

| Field | Value |
|-------|-------|
| **Model Name** | [Name and version] |
| **Type** | [e.g. Large Language Model, Image Classification] |
| **Provider** | [Provider / Open Source] |
| **Use Case** | [Description] |
| **EU AI Act Risk Class** | [Minimal / Limited / High Risk] |

## Training Data

- **Data source:** [Description of training data]
- **Period:** [From – To]
- **Known gaps:** [Missing domains, languages, demographic groups]

## Evaluation & Performance

| Metric | Value | Benchmark |
|--------|-------|----------|
| Accuracy | [X%] | [Dataset] |
| F1-Score | [X] | [Dataset] |

## Known Limitations

- [Limitation 1]
- [Limitation 2]

## Privacy & Security

- Processing personal data: [Yes / No / Under conditions]
- GDPR review completed: [Yes / No / Pending]

---
*Created: [Date] | Owner: [Name]*',
  2
),
(
  'incident_response',
  'en',
  'AI Incident Response Plan',
  'Emergency plan for AI-related incidents',
  '# AI Incident Response Plan

**Version:** 1.0 | **Date:** [Date]

## 1. Incident Categories

| Severity | Description | Response Time |
|----------|-------------|---------------|
| **P1 – Critical** | Faulty decisions with legal impact | Immediate (< 1 hr) |
| **P2 – High** | Data breach or bias incident | < 4 hours |
| **P3 – Medium** | Quality degradation without immediate harm | < 24 hours |
| **P4 – Low** | Technical error without impact | < 72 hours |

## 2. Escalation Path

1. **Initial detection:** Mandatory report to direct manager and AI owner
2. **Initial assessment:** AI owner classifies severity
3. **P1/P2:** Immediate escalation to CISO and Data Protection Officer
4. **Documentation:** Incident log in [System] within 2 hours

## 3. Immediate Actions

- [ ] Disable AI system or switch to manual operation
- [ ] Isolate affected data sets
- [ ] Inform internal stakeholders
- [ ] For GDPR violations: check 72-hour reporting obligation

## 4. Follow-Up

- Root cause analysis within 5 business days
- Action plan with owners and deadlines
- Lessons learned documentation

---
*Owner: [CISO / AI Officer]
Last exercise: [Date]*',
  3
),
(
  'supplier_checklist',
  'en',
  'AI Supplier Checklist',
  'Due diligence for external AI providers',
  '# AI Supplier Checklist

**Supplier:** [Name] | **Product:** [Product name] | **Date:** [Date]

## A. Legal & Compliance Requirements

- [ ] Data Processing Agreement (DPA) under Art. 28 GDPR in place
- [ ] Data processing exclusively within the EU or with adequate protection level
- [ ] EU AI Act compliance confirmed (certificate available if applicable)
- [ ] Technical and organisational measures (TOMs) documented

## B. Technical Security

- [ ] SOC 2 Type II or ISO 27001 certification available
- [ ] Penetration tests conducted regularly (at least annually)
- [ ] Encryption in transit and at rest confirmed
- [ ] Incident response plan available and tested

## C. AI-Specific Requirements

- [ ] Model cards or equivalent transparency documentation available
- [ ] Bias testing and fairness evaluation demonstrated
- [ ] Opt-out from training on our data possible
- [ ] Explainability of AI decisions ensured (where applicable)

## D. Operational

- [ ] SLA for availability and support defined
- [ ] Exit strategy and data return process agreed
- [ ] Regular compliance reviews agreed (at least annually)

## Assessment

| Area | Met | Open | Not applicable |
|------|-----|------|----------------|
| Legal | | | |
| Technical | | | |
| AI-specific | | | |
| Operational | | | |

**Recommendation:** [ ] Approve  [ ] Approve with conditions  [ ] Reject

---
*Reviewed by: [Name]
Approved by: [Name]*',
  4
);
