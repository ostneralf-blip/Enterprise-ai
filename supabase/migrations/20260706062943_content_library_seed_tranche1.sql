-- Wissens-Layer Erst-Tranche: 40 Content-Bloecke fuer alle 7 Module (Issue #80)
-- source = Kapitel-Verweis als Cross-Selling-Bruecke zum KDP-Buch.
-- ON CONFLICT DO NOTHING — idempotent wiederholbar.

INSERT INTO public.content_library
  (module, context_key, category, title, content, source, display_order, is_published)
VALUES

-- ============================================================
-- ASSESSMENT — assessment.dimensionen (6 Bloecke)
-- ============================================================

('assessment', 'assessment.dimensionen', 'definition',
 'Was messen die 6 Readiness-Dimensionen?',
 'Der AI-Readiness-Score bewertet Ihr Unternehmen in sechs Bereichen: **Strategie & Fuehrung**, **Daten & Infrastruktur**, **Prozesse & Organisation**, **Technologie & Architektur**, **Talent & Kultur** sowie **Compliance & Governance**. Jede Dimension wird auf einer Skala von 0–100 bewertet und fliesst gewichtet in den Gesamtscore ein. Ein Score >= 70 in allen Dimensionen ist Voraussetzung fuer einen nachhaltigen KI-Betrieb.',
 'Buch Kap. 2.1', 10, true),

('assessment', 'assessment.dimensionen', 'best_practice',
 'Welche Dimension zuerst staerken?',
 'Beginnen Sie immer mit **Daten & Infrastruktur** — sie ist Enabler aller anderen Dimensionen. Ohne saubere, zugaengliche Datenbasis scheitern selbst hochkaeraetige KI-Projekte in der Pilotphase. Faustregel: Investieren Sie 40 % des KI-Budgets in Datenqualitaet und -governance, bevor Sie in Modellentwicklung gehen.',
 'Buch Kap. 2.3', 20, true),

('assessment', 'assessment.dimensionen', 'best_practice',
 'Archetypen richtig interpretieren',
 '**Starter** (Score < 40): Fokus auf Quick Wins und Pilotprojekte, kein unternehmensweiter Rollout. **Scaler** (40–70): Systematisierung und Skalierung bestehender Piloten. **Transformer** (> 70): Strategische KI-Differenzierung und Oekosystem-Aufbau. Der Archetyp bestimmt den Startpunkt Ihrer Roadmap — nicht Ihr Budget.',
 'Buch Kap. 2.4', 30, true),

('assessment', 'assessment.dimensionen', 'anti_pattern',
 'Der "Technologie-zuerst"-Fehler',
 'Viele Unternehmen kaufen KI-Tools, bevor das Assessment abgeschlossen ist. Resultat: Tool-Friedhoeefe, weil Daten, Prozesse oder Governance fehlen. Die richtige Reihenfolge: Assessment → Strategie → Pilotauswahl → Technologieentscheidung. Technologie ist die letzte, nicht die erste Variable.',
 'Buch Kap. 2.2', 40, true),

('assessment', 'assessment.dimensionen', 'checkliste',
 'Vor dem Assessment: Was vorbereiten?',
 '- [ ] Organigramm + Entscheidungstraeger fuer alle 6 Dimensionen identifiziert
- [ ] Bestandsaufnahme vorhandener Datensysteme (ERP, CRM, DWH)
- [ ] Aktuelle IT-Sicherheitsrichtlinien verfuegbar
- [ ] Offene Compliance-Audits (DSGVO, ISO 27001) bekannt
- [ ] Budget-Rahmen fuer KI-Investitionen grob abgesteckt',
 'Buch Kap. 2.5', 50, true),

('assessment', 'assessment.dimensionen', 'hinweis',
 'Dim-Score vs. Gesamt-Score',
 'Ein hoher Gesamtscore kann niedrige Einzeldimensionen verdecken. Pruefen Sie immer den niedrigsten Dim-Score — er ist Ihr tatsaechlicher Engpass. Ein Transformer mit Score 75 insgesamt, aber nur 30 in "Compliance & Governance", wird beim EU AI Act High-Risk-Einsatz scheitern.',
 'Buch Kap. 2.6', 60, true),

-- ============================================================
-- USE-CASE SCORING — scoring.gates (6 Bloecke)
-- ============================================================

('usecase', 'scoring.gates', 'definition',
 'Das 5-Kriterien-Scoring-Modell',
 'Jeder Use Case wird nach fuenf gewichteten Kriterien bewertet: **Strategischer Fit** (Alignment mit Unternehmensstrategie), **Datenverfuegbarkeit**, **Technische Umsetzbarkeit**, **Wirtschaftlichkeit** (ROI-Potenzial) und **Risiko & Compliance**. Der gewichtete Score platziert Use Cases in einer 2x2-Portfolio-Matrix: Champions, Quick Wins, Strategische Wetten und Kandidaten zum Streichen.',
 'Buch Kap. 4.2', 10, true),

('usecase', 'scoring.gates', 'best_practice',
 'Optimale Portfolio-Groesse',
 'Halten Sie Ihr aktives KI-Portfolio auf **3–7 Use Cases** — mehr ueberfordert Organisation und Budget. Beginnen Sie mit einem Champion und einem Quick Win parallel. Jeder neue Use Case muss einen bestehenden verdraengen oder den Gesamtscore des Portfolios verbessern. Kontinuierliches Pruning ist wichtiger als kontinuierliches Hinzufuegen.',
 'Buch Kap. 4.4', 20, true),

('usecase', 'scoring.gates', 'best_practice',
 'Gewichtungen an Ihren Archetyp anpassen',
 'Die Standard-Gewichtungen sind ein Ausgangspunkt. **Starter** sollten Datenverfuegbarkeit hoeher gewichten — fehlende Daten sind der haeufigste Projektabbruchgrund. **Transformer** koennen strategischen Fit staerker betonen, da Infrastruktur und Daten bereits vorhanden sind. Passen Sie Gewichtungen im Einstellungs-Bereich an Ihre Unternehmensprioritaeten an.',
 'Buch Kap. 4.3', 30, true),

('usecase', 'scoring.gates', 'anti_pattern',
 'Quick-Win-Bias vermeiden',
 'Rein auf Quick Wins zu optimieren fuehrt zu einem Portfolio aus kleinen, isolierten KI-Projekten ohne strategische Wirkung. Planen Sie bewusst **mindestens einen strategischen Wetten-Use-Case** ein — selbst wenn ROI erst in 18–24 Monaten sichtbar wird. KI-Kompetenzaufbau passiert an strategischen Projekten, nicht an Quick Wins.',
 'Buch Kap. 4.5', 40, true),

('usecase', 'scoring.gates', 'checkliste',
 'Use-Case-Qualifizierungsgate',
 '- [ ] Klarer Business Owner mit Budget-Verantwortung benannt
- [ ] Datenquellen identifiziert und Zugang geklaert
- [ ] Datenschutz-Erstpruefung (DSGVO Art. 5/6) durchgefuehrt
- [ ] EU AI Act Risikoklasse vorab eingeschaetzt (Screening)
- [ ] Messbare Erfolgskriterien (KPI) definiert',
 'Buch Kap. 4.1', 50, true),

('usecase', 'scoring.gates', 'hinweis',
 'Canvas verknuepfen fuer tiefere Analyse',
 'Verknuepfen Sie jeden Use Case mit einem AI Use-Case Canvas — erst dann werden Compliance-Relevanz und Architektur-Anforderungen automatisch weitergeleitet. Use Cases ohne Canvas-Verknuepfung liefern nur einen Score, aber keine Handlungsempfehlungen fuer Governance und Architektur.',
 'Buch Kap. 4.6', 60, true),

-- ============================================================
-- CANVAS — canvas.intro (5 Bloecke)
-- ============================================================

('canvas', 'canvas.intro', 'definition',
 'Was ist der AI Use-Case Canvas?',
 'Der AI Use-Case Canvas ist ein strukturiertes Planungsinstrument mit 8 Feldern: **Problem & Ziel**, **Zielgruppe**, **Datenbasis**, **KI-Methode**, **Integration**, **Risiken & Compliance**, **Erfolgsmetriken** und **Naechste Schritte**. Er zwingt zur Vollstaendigkeit vor dem ersten Code und liefert automatisch Eingaben fuer Governance-Check, Compliance-Screening und Architektur-Generator.',
 'Buch Kap. 5.1', 10, true),

('canvas', 'canvas.intro', 'best_practice',
 'Iterative Canvas-Befuellung in 3 Runden',
 '**Runde 1 (30 min):** Stakeholder fuellen Canvas unabhaengig aus — Abweichungen zeigen Meinungsverschiedenheiten frueh. **Runde 2 (60 min):** Konsensworkshop zu den Unterschieden — hier entstehen oft die wertvollsten Erkenntnisse. **Runde 3 (nach Pilot-Sprint):** Canvas mit echten Daten aktualisieren. Ein Canvas ist nie "fertig" — er waechst mit dem Projekt.',
 'Buch Kap. 5.3', 20, true),

('canvas', 'canvas.intro', 'anti_pattern',
 'Technologiefixierung im Canvas',
 'Der haeufigste Canvas-Fehler: Das KI-Methode-Feld wird zuerst ausgefuellt ("wir wollen ein LLM nutzen"), bevor Problem und Datenbasis klar sind. Das Ergebnis ist eine Loesung auf der Suche nach einem Problem. Fuellen Sie die Felder immer in der Reihenfolge Problem → Daten → Methode — nicht umgekehrt.',
 'Buch Kap. 5.4', 30, true),

('canvas', 'canvas.intro', 'checkliste',
 'Canvas-Vollstaendigkeitspruefung',
 '- [ ] Alle 8 Felder ausgefuellt (keine Platzhalter)
- [ ] Datenbasis: Herkunft, Format, Volumen und Aktualitaet angegeben
- [ ] Compliance-Feld: DSGVO-Personenbezug und EU-AI-Act-Risikoklasse eingeschaetzt
- [ ] Erfolgsmetriken: mindestens eine messbare KPI mit Zielwert
- [ ] Naechste Schritte: Pilot-Sprint geplant (Datum, Owner, Budget)',
 'Buch Kap. 5.5', 40, true),

('canvas', 'canvas.intro', 'hinweis',
 'Compliance-Erkennung im Canvas',
 'Der Navigator erkennt automatisch Compliance-Relevanz anhand der Texte in Ihrem Canvas — DSGVO, EU AI Act, NIS2, ISO 27001 und weitere. Je praeziser Sie Ihr Vorhaben beschreiben (Branche, Datentypen, Schnittstellen), desto genauer die Compliance-Hinweise. Vage Texte liefern keine Treffer.',
 'Buch Kap. 5.6', 50, true),

-- ============================================================
-- GOVERNANCE — governance.raci (6 Bloecke)
-- ============================================================

('governance', 'governance.raci', 'definition',
 'Die 6 Governance Gates im Ueberblick',
 'Der Governance-Check fuehrt durch sechs sequenzielle Gates: **Gate 1** Risikoklassifizierung (EU AI Act), **Gate 2** Datenschutz-Vorabpruefung (DSGVO), **Gate 3** RACI & Verantwortlichkeiten, **Gate 4** Modell-Dokumentation & Erklaerbarkeit, **Gate 5** Pilot-Freigabe & Monitoring, **Gate 6** Produktions-Deployment-Genehmigung. Kein Gate kann uebersprungen werden.',
 'Buch Kap. 6.1', 10, true),

('governance', 'governance.raci', 'best_practice',
 'RACI-Matrix vor Gate 1 definieren',
 'Legen Sie Responsible, Accountable, Consulted und Informed vor dem ersten Gate fest — nicht danach. Typische Rollen: **Accountable** = CISO oder CDO, **Responsible** = Data-Science-Lead, **Consulted** = Datenschutzbeauftragter (Pflichtrolle bei DSGVO-Relevanz), **Informed** = Betriebsrat (bei KI-Systemen mit Mitarbeiterbezug). Fehlende RACI-Klaerung ist haeufigste Ursache fuer Projektabbrueche in Gate 3.',
 'Buch Kap. 6.2', 20, true),

('governance', 'governance.raci', 'best_practice',
 'Governance-Ergebnis in Roadmap ueberfuehren',
 'Ein "Bedingt freigegeben"-Verdict ist kein Projektende — es ist ein strukturierter Massnahmenplan. Uebertragen Sie alle offenen Punkte direkt in Phase 0 Ihrer Roadmap: Datenschutz-Luecken als Sprint-Tasks, fehlende Dokumentation als Definition-of-Done-Kriterium. Nutzen Sie den "An Roadmap"-Button, um den Kontext automatisch zu uebertragen.',
 'Buch Kap. 6.5', 30, true),

('governance', 'governance.raci', 'anti_pattern',
 'Governance als Bremse — ein Missverstaendnis',
 'Governance wird oft als Innovationsbremse wahrgenommen. Tatsaechlich reduziert ein strukturierter Governance-Prozess die Time-to-Production: Teams die Gate 1–6 vollstaendig durchlaufen, haben 60 % weniger Nacharbeitsloops im Rollout. Der Aufwand fuer Gates 1–4 (ca. 4–8 Stunden) ist marginal gegenueber Rückruf-Kosten eines nicht-konformen Systems.',
 'Buch Kap. 6.3', 40, true),

('governance', 'governance.raci', 'policy_template',
 'Eskalationspfad bei Governance-Konflikten',
 '**Level 1 — Projektebene:** Data-Science-Lead + Datenschutzbeauftragter klaeren intern (max. 5 Werktage).
**Level 2 — Bereichsebene:** CISO + Rechtsabteilung einbinden; formales Risk-Acceptance-Dokument erforderlich.
**Level 3 — Vorstandsebene:** Bei Hochrisiko-KI (EU AI Act Annex III) oder oeffentlicher Wahrnehmung; externe Rechtsberatung empfohlen.',
 'Buch Kap. 6.4', 50, true),

('governance', 'governance.raci', 'checkliste',
 'Gate 1: Risikoklassifizierungs-Checkliste',
 '- [ ] Anwendungsbereich EU AI Act geprueft (Art. 2 — geograf./personeller Geltungsbereich)
- [ ] Risikoklasse bestimmt: Verboten / Hochrisiko (Annex III) / Limitiert / Minimal
- [ ] Bei Hochrisiko: Conformity-Assessment-Pfad identifiziert
- [ ] Verwendungszweck dokumentiert (Bestimmungsgemasse Verwendung lt. Art. 9)
- [ ] Datenschutzbeauftragter informiert (bei personenbezogenen Daten Pflicht)',
 'Buch Kap. 6.6', 60, true),

-- ============================================================
-- COMPLIANCE — compliance.policies (6 Bloecke)
-- ============================================================

('compliance', 'compliance.policies', 'definition',
 'EU AI Act Risikoklassen auf einen Blick',
 '**Verbotene KI** (Art. 5): Social Scoring, subliminale Manipulation, Echtzeitbiometrie im oeffentlichen Raum. **Hochrisiko** (Annex III): KI in kritischer Infrastruktur, Bildung, Personalentscheidungen, Strafverfolgung, Medizinprodukte. **Limitiertes Risiko** (Art. 50): Chatbots — Transparenzpflicht. **Minimales Risiko**: Keine besonderen Anforderungen. Im Zweifel: Hochrisiko als Ausgangspunkt nehmen.',
 'Buch Kap. 8.1', 10, true),

('compliance', 'compliance.policies', 'best_practice',
 'Compliance vor dem Piloten — nicht danach',
 'DSGVO-Datenschutz-Folgenabschaetzung (DSFA) und EU-AI-Act-Compliance-Checks gehoeren in Phase 0, nicht in den Rollout. Nachtraegliche Compliance kostet im Durchschnitt 4x mehr als praeventive. Faustregel: Alles, was personenbezogene Daten verarbeitet oder automatisiert Entscheidungen trifft, braucht eine DSFA nach Art. 35 DSGVO.',
 'Buch Kap. 8.3', 20, true),

('compliance', 'compliance.policies', 'anti_pattern',
 'DSGVO-Einwilligung als Allheilmittel',
 'Viele Teams setzen auf Einwilligung (Art. 6 Abs. 1 lit. a DSGVO), weil sie am einfachsten klingt. Problem: Einwilligung muss freiwillig sein — im Arbeitsverhaeltnis ist das kaum gegeben. Fuer interne KI-Systeme mit Mitarbeiterdaten ist **Art. 6 Abs. 1 lit. b oder c** oder eine Betriebsvereinbarung der robustere Rechtsweg.',
 'Buch Kap. 8.4', 30, true),

('compliance', 'compliance.policies', 'policy_template',
 'Data Processing Agreement (DPA) Eckpunkte',
 'Ein DPA mit KI-Dienstleistern muss enthalten:
- **Art. 28 DSGVO**: Auftragsverarbeitung explizit vereinbart
- **Subunternehmer**: Liste aller Sub-Processor mit Widerrufsmoeglickeit
- **Drittlandtransfer**: EU-Standardvertragsklauseln (Art. 46) oder Ausschluss
- **Datenloeschung**: Frist und Nachweis nach Vertragsende
- **KI-spezifisch**: Keine Nutzung Ihrer Daten zum Modell-Training ohne Genehmigung',
 'Buch Kap. 8.5', 40, true),

('compliance', 'compliance.policies', 'checkliste',
 'EU AI Act High-Risk: Pflichten-Checkliste',
 '- [ ] Risikomanagementsystem (Art. 9) dokumentiert und getestet
- [ ] Trainingsdaten-Governance (Art. 10): Qualitaet, Repraesentativitaet, Bias-Pruefung
- [ ] Technische Dokumentation (Art. 11) erstellt
- [ ] Automatisches Logging (Art. 12) implementiert
- [ ] Transparenz gegenueber Nutzern (Art. 13) sichergestellt
- [ ] Menschliche Aufsicht (Art. 14) definiert und trainiert
- [ ] Genauigkeit, Robustheit & Cybersicherheit (Art. 15) getestet',
 'Buch Kap. 8.6', 50, true),

('compliance', 'compliance.policies', 'hinweis',
 'Compliance-Status in andere Module uebertragen',
 'Der hier festgelegte Compliance-Status (Risikoklasse, offene Massnahmen) wird automatisch in den Governance-Check und den Architektur-Generator weitergeleitet. Sie muessen die Risikoklasse nicht mehrfach eingeben. Stellen Sie sicher, dass der Compliance-Check aktuell ist, bevor Sie Governance oder Architektur starten.',
 'Buch Kap. 8.7', 60, true),

-- ============================================================
-- ARCHITECTURE — architecture.prinzipien (6 Bloecke)
-- ============================================================

('architecture', 'architecture.prinzipien', 'definition',
 'Herstellerneutrale Referenzarchitektur',
 'Die generierte Architektur folgt einem schichtenbasierten Modell: **Datenschicht** (Erfassung, Storage, Aufbereitung), **Plattformschicht** (Orchestrierung, MLOps, Monitoring), **Anwendungsschicht** (Modelle, APIs, Fachlogik), **Zugriffsschicht** (UI, Integrationen, Sicherheit). Herstellerneutralitaet bedeutet: Jede Komponente ist austauschbar — Entscheidungen werden nach Capabilities, nicht nach Markenname getroffen.',
 'Buch Kap. 9.1', 10, true),

('architecture', 'architecture.prinzipien', 'best_practice',
 'API-First als Grundprinzip',
 'Alle KI-Komponenten — Modelle, Datenpipelines, Monitoring — sollten ueber definierte APIs angesprochen werden, nie direkt. Vorteile: Testbarkeit, Versionierbarkeit und Austauschbarkeit einzelner Komponenten ohne Systemumbau. Ein Modellwechsel (z.B. von GPT-4 zu Claude) darf maximal eine API-Konfigurationsaenderung erfordern, keinen Applikationsumbau.',
 'Buch Kap. 9.3', 20, true),

('architecture', 'architecture.prinzipien', 'best_practice',
 'Datensouveraenitaet durch EU-Hosting sichern',
 'Fuer Systeme mit personenbezogenen Daten oder vertraulichen Geschaeftsdaten: Stellen Sie sicher, dass alle Daten — inklusive Trainings- und Inferenzdaten — ausschliesslich auf EU-basierten Servern verarbeitet werden. Vermeiden Sie "Multi-Region"-Defaults globaler Cloud-Anbieter, die Daten automatisch in die USA replizieren koennen. Dokumentieren Sie EU-Hosting im DPA.',
 'Buch Kap. 9.4', 30, true),

('architecture', 'architecture.prinzipien', 'anti_pattern',
 'Vendor Lock-In bei KI-Plattformen',
 'Proprietaere KI-Plattformen ohne Abstraktionsschicht schaffen starke Abhaengigkeiten: Preiserhoehungen, Feature-Deprecations und Vendor-Insolvenzen treffen dann das gesamte KI-Portfolio. Empfehlung: Open-Source-Orchestrierungsschicht zwischen Fachlogik und Cloud-Services. LLM-Anbieter hinter einem einheitlichen API-Gateway abstrahieren.',
 'Buch Kap. 9.5', 40, true),

('architecture', 'architecture.prinzipien', 'checkliste',
 'Sicherheitsanforderungen fuer KI-Systeme',
 '- [ ] Authentifizierung: OAuth 2.0 / OIDC fuer alle API-Zugriffe
- [ ] Autorisierung: Least-Privilege-Prinzip, keine Shared-Service-Accounts
- [ ] Datenverschluesselung: TLS 1.3 in Transit, AES-256 at Rest
- [ ] Prompt-Injection-Schutz: Input-Sanitierung bei LLM-Schnittstellen
- [ ] Modell-Monitoring: Drift-Erkennung + automatische Alerts
- [ ] Incident-Response-Plan: KI-spezifische Szenarien dokumentiert',
 'Buch Kap. 9.6', 50, true),

('architecture', 'architecture.prinzipien', 'hinweis',
 'Assessment-Archetyp bestimmt Architektur-Komplexitaet',
 'Der Navigator passt Architekturempfehlungen automatisch an Ihren Assessment-Archetypen an. **Starter** erhalten eine schlanke 2-Schicht-Architektur (PoC-optimiert). **Scaler** eine vollstaendige 4-Schicht-Referenzarchitektur mit MLOps. **Transformer** erhalten zusaetzlich Empfehlungen fuer KI-Oekosystem-Integration. Starten Sie das Assessment, um personalisierte Empfehlungen zu erhalten.',
 'Buch Kap. 9.2', 60, true),

-- ============================================================
-- ROADMAP — roadmap.phase0 (5 Bloecke)
-- ============================================================

('roadmap', 'roadmap.phase0', 'definition',
 'Phase 0: Quick Wins als Fundament',
 '**Phase 0 (0–3 Monate)** ist die Pilotphase: Waehlen Sie einen gut abgegrenzten Use Case mit hoher Datenverfuegbarkeit und niedrigem Compliance-Risiko. Ziel ist kein perfektes System, sondern ein funktionierender Proof-of-Value, der intern Vertrauen aufbaut und erste Lerneffekte liefert. Budget-Faustregel: Phase 0 kostet 5–15 % des Gesamtprojektbudgets.',
 'Buch Kap. 3.1', 10, true),

('roadmap', 'roadmap.phase0', 'best_practice',
 'Pilotprojekt-Kriterien: Was eignet sich?',
 'Ein gutes Pilotprojekt fuer Phase 0 erfuellt: **Klar messbarer Nutzen** (nicht "KI-Erfahrung sammeln"), **Daten bereits vorhanden** (keine Datenerfassungsphase noetig), **Kein Hochrisiko** nach EU AI Act (reduziert Compliance-Aufwand), **Begeisterter interner Champion** (Fachbereich, nicht IT), **Abschluss in 6–10 Wochen** realistisch. Beginnen Sie mit dem zweitbesten Use Case — der beste ist oft zu komplex fuer Phase 0.',
 'Buch Kap. 3.2', 20, true),

('roadmap', 'roadmap.phase0', 'anti_pattern',
 'Big-Bang-Einfuehrung vermeiden',
 'Unternehmensweite KI-Rollouts ohne vorherigen Pilot scheitern in ueber 70 % der Faelle (McKinsey 2024). Haeufige Gruende: fehlende Datenqualitaet erst im Echtbetrieb erkennbar, Nutzerakzeptanz ueberschaetzt, Governance-Luecken nicht antizipiert. Die Roadmap erzwingt bewusst drei Phasen — Phase 0 ist kein optionaler Schritt, sondern Risikopuffer.',
 'Buch Kap. 3.4', 30, true),

('roadmap', 'roadmap.phase0', 'checkliste',
 'Phase-0-Abnahmekriterien (Pilot zu Scale)',
 '- [ ] Use-Case-KPI erreicht (Zielwert aus Canvas)
- [ ] Technische Schulden dokumentiert (kein versteckter MVP-Debt)
- [ ] Governance-Check vollstaendig (Gates 1–6 abgezeichnet)
- [ ] Nutzer-Feedback eingeholt (min. 10 qualitative Interviews)
- [ ] Kosten/Nutzen Phase 0 rekapituliert — stimmt der Business Case noch?
- [ ] Skalierbarkeit der gewaehlten Architektur bestaetigt',
 'Buch Kap. 3.5', 40, true),

('roadmap', 'roadmap.phase0', 'hinweis',
 'Roadmap und Governance sind verknuepft',
 'Offene Governance-Punkte (Bedingt freigegeben) werden automatisch als Phase-0-Aufgaben in der Roadmap angezeigt. Schliessen Sie Governance-Luecken, bevor Sie Phase 1 starten — in Phase 1 steigt die Nutzeranzahl und damit das Risikoprofil. Eine offene DSFA in Phase 1 ist ein behoerdlich meldepflichtiger Verstoss, keine interne Aufgabe mehr.',
 'Buch Kap. 3.3', 50, true)

ON CONFLICT DO NOTHING;
