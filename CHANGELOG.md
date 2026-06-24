# Changelog — AI Navigator

Alle wesentlichen Änderungen werden hier dokumentiert.
Format: [Keep a Changelog](https://keepachangelog.com/de/1.0.0/)
Versionierung: [Semantische Versionierung](https://semver.org/lang/de/)

---

## [0.5.0] — 2026-06-24

### Sprint 6 — Infrastruktur & Vertrauen
- **#14** App-Versionierung: CHANGELOG, semantische Versionen, Version in Sidebar-Footer
- **#15** Vertrauenssignale: /trust-Seite (EU-Hosting, DSGVO, Sicherheit), Landing Page Trust-Bar
- **#18** UX-Feinschliff: Modul-Abschluss-Badges im Dashboard, Quer-Modul-Hinweise, Use-Case-Suchfilter

## [0.4.0] — 2026-06-24

### Sprint 5 — PDF-Button-Konsistenz, Mehrere Ergebnisse, Settings-Kontaktfelder, Sentry
- **#40** PDF-Button: alle Module zeigen Aktions-Leiste konsistent am Seitenende
- **#10** PATCH-Endpunkte für Architecture/Roadmap; Roadmap lädt gespeicherten Stand bei Aufruf
- **#21** Kontaktfelder in Settings: Telefon, Mobil, Straße, PLZ, Stadt
- **#12** Sentry Error-Tracking integriert (@sentry/nextjs)

## [0.3.0] — 2026-06-24

### Sprint 4 — Use-Case UX, Assessment-Texte, Roadmap-Milestones, Governance-History
- **#33** Use-Case Formular: Beschreibungen, Anker-Labels, barrierefreie Buttons
- **#39** Dashboard: Pro-Kacheln optisch gesperrt, Stat-Boxen, Feature-Vergleichstabelle;
  Settings: Passwort-Änderung mit Live-Validierung; RegisterForm: Passwort-Regeln live
- **#29** Roadmap: interaktives Milestone-Tracking, Top-Use-Cases aus Scoring integriert
- **#28** Governance: Prüfverlauf + Szenario-Vergleich

## [0.2.0] — 2026-06-22

### Sprint 2 & 3 — Compliance Redesign, Onboarding, Executive Summary, Versionierung/Sharing
- **#37** Executive Summary Seite + Sidebar-Navigation
- **#26** Compliance Center: vollständiges Redesign (Supabase statt localStorage, EU AI Act/DSGVO, Risikomatrix)
- **#22** Geführter Onboarding-Wizard (7 Schritte mit Fortschrittsanzeige)
- **#31** Ergebnis-Versionierung (result_versions)
- **#32** Link-Sharing (share_links)
- **#23** Assessment: 16 → 42 Fragen, L1–L5 Reifegradmodell
- **#25** Architecture Generator: Steps 3–5 implementiert
- **#24** PDF-Export: plattformunabhängige Chrome-Pfad-Auflösung, alle 7 Module

## [0.1.0] — 2026-06-21

### Sprint 1 — Produktfundament
- Supabase Auth (Register, Login, E-Mail-Bestätigung, Passwort-Reset)
- Dashboard mit Tier-Gating (Free / Pro / Enterprise)
- Use-Case Scoring (Gewichtung, Matrix, Portfolio)
- Stripe Checkout + Billing Portal + Webhooks
- RLS auf allen Tabellen, PostHog Analytics, Resend E-Mail
- Deployment auf Vercel (Frankfurt/fra1)
