# #205 — Einheitliche Grundelemente: Inventur & Stand (24.07.2026)

Akzeptanzkriterium 1 des Issues. Stand nach Audit + Auth-Formular-Migration.

## Element-Komponenten (Infrastruktur) — VOLLSTÄNDIG vorhanden

| Element | Komponente | Datei | Stand |
|---|---|---|---|
| 1 Hilfsmarker | `InfoHint` (`?`-Muster, Ruhezustand-Rahmen) | `components/shared/InfoHint.tsx` | ✓ |
| 2 Wissensbasis | `GuidancePanel` (Side-Drawer, oben rechts) | `components/modules/GuidancePanel.tsx` | ✓ |
| 3 Texthierarchie | `Eyebrow`, `SectionTitle`, `CardTitle`, `BodyText`, `HintText tone`, `MetaText`, `Badge tone` | `components/shared/typography.tsx` | ✓ (Komponenten da) |
| 4 Hinweisboxen | `AlertBox` (info/warning/error + Icon-Slot) | `components/shared/AlertBox.tsx` | ✓ |
| — Kontext-Banner | `UnifiedContextBanner` (inkl. Governance-Badge-`title`) | `components/shared/UnifiedContextBanner.tsx` | ✓ (Sprint 34) |

## Adoption je Modul

| Modul | Wissensbasis (GuidancePanel) | AlertBox statt Ad-hoc | InfoHint vorhanden |
|---|---|---|---|
| Assessment | ✓ | ✓ | teils |
| Use-Case | ✓ | ✓ | teils |
| Governance | ✓ | ✓ | ✓ |
| Roadmap | ✓ | ✓ | ✓ |
| Canvas | ✓ | ✓ | ✓ |
| Compliance | ✓ | ✓ | ✓ |
| Architektur | ✓ | ✓ | ✓ (Workbench/Landkarte/Investitionsrahmen) |

- **GuidancePanel**: in allen 7 Modulen (Element-2-Akzeptanz „≥ 2 Module" erfüllt).
- **AlertBox**: in 18 Dateien im Einsatz (Dashboard-Alert-Boxen migriert, Sprint 17.07.).

## Diese Runde migriert (24.07.2026)
- **Auth-Formulare** (Login/Register/ResetPassword): identische Ad-hoc-Fehlerbox
  (`bg-red-500/10 …`) → `AlertBox variant="error"`. Grep-Nachweis: `bg-red-500/10`
  in `components/modules/auth/` = 0.

## Bewusst NICHT als Alert-Box migriert (kein Verstoß gegen Kriterium 4)
Die verbliebenen `bg-amber-50`/`bg-red-50`-Treffer sind **keine Hinweisboxen**,
sondern legitime **Badges/Buttons/Status-Farben** — dürfen bleiben:
- Archetyp-Farbmapping (`zusammenfassung/page.tsx`), DSGVO-/Konflikt-Badges
  (`ComponentSelectionStep`), amber/rot Buttons (RasicSection, AIPanel, Settings-
  Löschen), Status-Punkte. Diese nutzen Farbe als Kategorie/Zustand, nicht als Box.

## Offen (braucht Daniels Design-Gate — Kriterium 4/5)
- **Element 3 breitere Adoption**: `typography.tsx`-Komponenten bislang in 6 Dateien
  genutzt; flächendeckender Umstieg (Eyebrow/SectionTitle/CardTitle statt Ad-hoc-
  `text-*`-Klassen) ist ein größerer, optischer Refactor → Screenshot-Abgleich nötig.
- **Element 1 InfoHint-Feinabdeckung**: einzelne Karten ohne Hint (z. B. manche
  Score-Anzeigen/Settings-Karten) — Ergänzung nach Priorisierung mit Daniel.
- **Screenshot-Serie 1440 (vorher/nachher)** + finale Freigabe.
