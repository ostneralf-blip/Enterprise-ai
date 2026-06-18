# Accessibility-Checkliste — Manuelle Verifikation

**Zweck:** `jest-axe` prüft automatisiert gegen jsdom, aber jsdom ist kein echter Browser und kann z. B. keine tatsächliche Bildschirmleser-Ausgabe oder echten Tastatur-Fokus-Verlauf über mehrere Komponenten hinweg simulieren. Diese Checkliste schließt diese Lücke. Relevant auch vertraglich: viele Enterprise-Einkaufsabteilungen verlangen WCAG-2.1-AA-Konformität als Beschaffungskriterium (VPAT).

---

## 1. Tastatur-Navigation (ohne Maus)

Gesamten Flow ausschließlich mit `Tab`, `Shift+Tab`, `Enter`, `Leertaste`, `Escape` durchgehen.

| # | Schritt | Erwartung | ✅/❌ |
|---|---|---|---|
| 1.1 | Von der Login-Seite aus: Tab-Reihenfolge durchgehen | Logische Reihenfolge: E-Mail → Passwort → Anmelden-Button → Google-Button → Registrieren-Link | |
| 1.2 | Im Dashboard: durch Sidebar-Navigation tabben | Alle 7 Module + Dashboard + Einstellungen erreichbar, sichtbarer Fokus-Indikator bei jedem | |
| 1.3 | Assessment-Intro: mit Tab zum Start-Button, mit Enter aktivieren | Startet das Assessment | |
| 1.4 | Innerhalb einer Frage: mit Tab durch die 5 Antwortoptionen navigieren | Jede Option fokussierbar, mit Enter/Leertaste auswählbar | |
| 1.5 | Nach Auswahl einer Antwort: Fokus-Verhalten prüfen | Fokus springt sinnvoll zur nächsten Frage (nicht verloren, nicht zurück zum Seitenanfang) | |
| 1.6 | "Zurück"-Button bei Frage 1 | Ist `disabled` und wird beim Tabben übersprungen oder als nicht-aktivierbar erkennbar | |
| 1.7 | UpgradeModal (durch Klick auf gesperrtes Pro-Feature öffnen) | Fokus wird automatisch in das Modal verschoben; `Escape` schließt das Modal; nach Schließen kehrt Fokus zum auslösenden Element zurück | |
| 1.8 | FeedbackWidget: 👎 klicken, dann Textarea, dann Senden-Button | Alles per Tastatur erreichbar | |

---

## 2. Screenreader-Test

**Tools:** NVDA (Windows, kostenlos) oder VoiceOver (macOS, integriert — `Cmd+F5`).

| # | Schritt | Erwartung | ✅/❌ |
|---|---|---|---|
| 2.1 | Login-Seite mit aktivem Screenreader öffnen | Seitentitel wird angesagt, Formularfelder mit Labels korrekt vorgelesen | |
| 2.2 | Assessment-Intro vorlesen lassen | "AI-Readiness Assessment" als Überschrift erkennbar, 6 Dimensionen werden sinnvoll vorgelesen | |
| 2.3 | Eine Frage vorlesen lassen | Frage-Text wird vor den Antwortoptionen angesagt, jede Option mit ihrem vollen Beschreibungstext | |
| 2.4 | Progress-Bar | Wird als "Fortschritt: X von 16 Fragen" angesagt (nicht nur als visueller Balken ohne Kontext) | |
| 2.5 | Auswahl einer Antwort | Screenreader gibt Rückmeldung über die Auswahl (z. B. "ausgewählt" / "gedrückt") | |
| 2.6 | Ergebnis-Seite | Gesamtscore und Archetyp werden in sinnvoller Reihenfolge vorgelesen, nicht nur als isolierte Zahl ohne Kontext | |
| 2.7 | Dimensions-Balken auf Ergebnis-Seite | Werden mit Label und Wert angesagt ("Datenqualität und -zugriff: 3,5 von 5"), nicht nur als stummer Fortschrittsbalken | |

---

## 3. Farbkontrast (WCAG AA: mind. 4,5:1 für Fließtext, 3:1 für große Texte)

**Tool:** Browser-DevTools → Element inspizieren → Kontrast-Anzeige, oder [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/).

| # | Element | Vordergrund/Hintergrund | Erwartung | ✅/❌ |
|---|---|---|---|---|
| 3.1 | Fließtext auf weißem Hintergrund (`text-slate-700` o.ä.) | Prüfen | ≥ 4,5:1 | |
| 3.2 | Sidebar-Text auf dunklem Hintergrund (`text-slate-300` auf `bg-slate-900`) | Prüfen | ≥ 4,5:1 | |
| 3.3 | Button-Text auf blauem Hintergrund (`text-white` auf `bg-blue-600`) | Prüfen | ≥ 4,5:1 | |
| 3.4 | "Pro"-Badge Text (`text-blue-600` auf `bg-blue-50`) | Prüfen | ≥ 4,5:1, falls knapp: Badge-Größe als "große Schrift" einordnen (3:1 reicht dann) | |
| 3.5 | Fehlertext (`text-red-400` auf dunklem Hintergrund im Login-Formular) | Prüfen | ≥ 4,5:1 — **bekannter Risikopunkt**, da helle Rot-Töne auf dunklem Grund oft knapp ausfallen | |
| 3.6 | Score-Farben (rot/gelb/grün) in der Ergebnis-Anzeige | Prüfen | Farbe ist NICHT die einzige Information — Score-Zahl und Label sind textuell redundant vorhanden (bereits im Design berücksichtigt) | |

---

## 4. Zoom & Reflow (WCAG 1.4.10)

| # | Test | Erwartung | ✅/❌ |
|---|---|---|---|
| 4.1 | Browser-Zoom auf 200 % setzen, gesamten Assessment-Flow durchgehen | Kein horizontales Scrollen nötig, kein abgeschnittener Text, keine überlappenden Elemente | |
| 4.2 | Browser-Zoom auf 400 % (WCAG-Minimum-Anforderung) | Inhalt bleibt nutzbar, auch wenn Layout sich stark verändert | |
| 4.3 | Nur Text-Zoom (Browser-Einstellung, nicht Seiten-Zoom) erhöhen | Layout bricht nicht, Buttons bleiben klickbar | |

---

## 5. Bewegungsreduktion (WCAG 2.3.3, `prefers-reduced-motion`)

| # | Test | Erwartung | ✅/❌ |
|---|---|---|---|
| 5.1 | Betriebssystem-Einstellung "Bewegung reduzieren" aktivieren, dann Assessment durchlaufen | Übergänge (Progress-Bar-Animation, Modal-Einblendung) sind reduziert oder entfernt — **aktuell nicht implementiert, als Phase-2-Punkt vormerken** | |

---

## 6. Formulare & Fehlermeldungen

| # | Test | Erwartung | ✅/❌ |
|---|---|---|---|
| 6.1 | Login mit leerem E-Mail-Feld absenden | Browser-native Validierungsmeldung erscheint, wird vom Screenreader angesagt | |
| 6.2 | Login mit falschem Passwort | Fehlermeldung erscheint **sichtbar in der Nähe des Formulars**, nicht nur als Toast, der verschwindet bevor ein Screenreader-Nutzer reagieren kann | |
| 6.3 | Registrierungsformular: Pflichtfelder ohne `aria-required` oder visuelle Kennzeichnung? | Sollte erkennbar sein, welche Felder optional sind (z. B. "Unternehmen" ist mit "Optional" beschriftet — bereits umgesetzt) | |

---

## 7. Zusammenfassung & VPAT-Relevanz

Diese Checkliste deckt nicht den vollständigen WCAG-2.1-AA-Katalog ab, sondern die für das Assessment-Modul relevantesten Punkte. Für ein vollständiges VPAT (Voluntary Product Accessibility Template), das größere Enterprise-Kunden ggf. im Beschaffungsprozess verlangen, ist eine professionelle externe Accessibility-Prüfung in einer späteren Phase empfehlenswert — nicht Teil des Sprint-1-Scopes.

| Geprüft von | Datum | Kritische Barrieren gefunden? | Freigabe |
|---|---|---|---|
| | | ☐ Ja ☐ Nein | ☐ Ja ☐ Nein |
