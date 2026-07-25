# Post-Launch-Backlog (Stand 25.07.2026)

**Leitentscheidung (Daniel, 25.07.2026):** Wir gehen zeitnah live und bauen bis dahin
KEINE weiteren Funktionen ein. Alles hier ist bewusst **nach** dem Go-Live eingeplant.
Bis Launch nur noch: Stabilisierung, Bugfixes, Release-Vorbereitung, Branding/Feinschliff.

## Aus dem EAM-/Diagramm-Thema zurückgestellt (Phase 3 Rest / Phase 4)

1. **PDF-Export je Diagramm-Stil** — der PDF-/MERIDIAN-Export bildet die neuen Sichten
   (ConnectionLayer/UML-Kanten, DataFlowView, TOGAF-Gruppierung, Capability) noch NICHT
   stil-treu ab; er rendert weiterhin die Layers-/Bebauungsplan-Sicht. Grund: react-pdf
   hat kein DOM und kann das clientseitig gemessene SVG-Overlay nicht direkt nachbauen —
   braucht einen eigenen, serverseitig berechneten Renderer. → GitHub-Issue.
2. **Share-View je Diagramm-Stil** — analog: die öffentliche Share-Ansicht zeigt den
   Diagramm-Stil noch nicht stil-treu. → GitHub-Issue.
3. **Capability-Sicht in der Executive Summary** — die Portfolio-/Capability-Heatmap ist
   bisher nur im Architektur-Generator, nicht in der Executive Summary. → GitHub-Issue.
4. **Weitere Diagramm-Ideen (Daniel)** — noch nicht spezifiziert; sammeln, wenn wir das
   Thema nach Launch wieder aufnehmen. Platzhalter, bis Daniel die Ideen konkretisiert.

## Daten / DSGVO

6. **Anonymisierte Analyse-Daten bei Konto-Löschung behalten** (Daniel, 25.07.2026) →
   GitHub-Issue **#261**. Ziel: bei DSGVO-Löschung strukturelle/analytische Daten
   anonymisiert (kein user_id, keine PII, Freitext gescrubbt) in `analytics_snapshots`
   behalten für AI-Learnings. **DSGVO-sensibel — echte Anonymisierung + Datenschutz-Text +
   Rechts-Check nötig.** Für Launch bleibt die konservative Volllöschung (verifiziert 25.07.).

## Admin-Bereich

5. **Admin-User-Management verbessern** (Daniel, 25.07.2026) — das bestehende Panel kann
   `is_admin`/`is_banned`/`feature_flags` setzen, aber Nutzer NICHT vollständig löschen.
   Anforderungen (u. a.): Nutzer vollständig löschen direkt aus dem Admin-Panel (Profil
   **und** `auth.users`-Eintrag via `admin.deleteUser` — analog `/api/account/delete`,
   damit keine verwaisten Auth-User entstehen, siehe Incident 25.07.), Nutzerliste mit
   Suche/Filter (Tier, bestätigt/unbestätigt, gebannt), Detailansicht (Abo-Status, letzte
   Aktivität), ggf. Bestätigungsmail erneut senden. → GitHub-Issue.
   **Merke (Betrieb):** Konten NIEMALS per SQL/Tabellen-Editor löschen — nur über die
   DSGVO-Route (`/api/account/delete`) oder Supabase → Authentication → Users. Reines
   Löschen der `profiles`-Zeile lässt den Auth-User bestehen (kann sich weiter anmelden).

## Bereits gebaut & live (zur Abgrenzung, NICHT offen)

- EAM Phase 1 (Presets, CapabilityView, MaturityPips theme-sicher, Bebauungsplan).
- EAM Phase 2 (ConnectionLayer regelbasiert, DataFlowView, TOGAF-Gruppierung, „Ansicht anpassen"-Override).
- EAM Phase 3 (echte Katalog-Kanten requires/suggests + incompatible_with-Konflikte, Legende).
- Vergrößern der Diagramme (Vollbild, Ein-Instanz + ResizeObserver) + InfoHints.
- Branding: neues Logo/Favicon/PWA-Icons/OG-Bild.

## Verweis: bestehende PRIO-1-Go-Live-Punkte (siehe CLAUDE.md „Priorisierte Gesamt-Roadmap")

- Rechtstexte (Impressum/Datenschutz/AGB): Daniel bestätigt vorhanden — bei Go-Live final
  auf rechtliche Vollständigkeit prüfen (eRecht24/Anwalt).
- **Abo-Lebenszyklus-Kanten** (Zahlung fehlgeschlagen, Kündigung, Downgrade-Datenhandling):
  Webhook-Pipeline ist seit 24.07. reparant + gehärtet; die Abläufe für Grace-Period/
  Downgrade vor Launch einmal durchtesten (echtes Live-Event resenden, DB gegenprüfen).
- `stripe_subscription_id` wird vom Webhook noch nicht befüllt (nur `stripe_customer_id`) —
  klein, kein Blocker; bei Gelegenheit ergänzen.

## Nicht vor konkretem Bedarf (bewusst zurückgestellt, unverändert)

- Team-/Mandantenfunktion, Google/Apple OAuth, Compliance-Scanner-Cron — erst bei echtem Bedarf.
- Externe Sync-Quellen für den AI-Katalog (CNCF/Hugging Face/SAP API Hub).
