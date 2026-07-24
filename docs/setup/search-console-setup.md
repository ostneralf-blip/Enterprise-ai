# Search Console + Bing Verifikation (Config-Schritte für Daniel)

Der **Code** ist fertig (`src/app/layout.tsx` liest die Tokens aus Env-Vars und
rendert die Meta-Verifikations-Tags automatisch, sobald sie gesetzt sind). Es
fehlt nur die Einrichtung der Konten + das Setzen der zwei Env-Vars.

## 1. Google Search Console
1. https://search.google.com/search-console → **Property hinzufügen** →
   Typ **„URL-Präfix"**: `https://enterprise-ai.biz`.
2. Verifizierungsmethode **„HTML-Tag"** wählen. Google zeigt ein Meta-Tag:
   `<meta name="google-site-verification" content="XXXXXXXX" />`
3. **Nur den `content`-Wert** (`XXXXXXXX`) kopieren.
4. In Vercel → Project → Settings → Environment Variables:
   `GOOGLE_SITE_VERIFICATION = XXXXXXXX` (Production).
5. Redeploy → in Search Console auf **„Bestätigen"**.
6. Danach **Sitemap einreichen**: `https://enterprise-ai.biz/sitemap.xml`.

## 2. Bing Webmaster Tools
1. https://www.bing.com/webmasters → Property `https://enterprise-ai.biz`.
   (Tipp: „Aus Google Search Console importieren" spart die erneute Verifizierung.)
2. Bei manueller Verifizierung zeigt Bing `<meta name="msvalidate.01" content="YYYY" />`.
3. In Vercel: `BING_SITE_VERIFICATION = YYYY` (Production). Redeploy → bestätigen.
4. Sitemap ebenfalls einreichen.

## 3. Verifikation im Deployment prüfen
Nach dem Redeploy im Seitenquelltext von `https://enterprise-ai.biz` prüfen, dass
`<meta name="google-site-verification" ...>` (und ggf. `msvalidate.01`) im `<head>`
steht. Erscheint es nicht, ist die Env-Var nicht gesetzt/nicht deployt.

## Was bereits code-seitig erledigt ist (kein To-do)
- `robots.txt` (via `robots.ts`): öffentliche Routen erlaubt, `/api/` + Dashboard
  gesperrt, AI-Crawler (GPTBot/ClaudeBot/PerplexityBot) bewusst erlaubt, Sitemap-Ref.
- `sitemap.xml` (via `sitemap.ts`): alle öffentlichen Routen + 8 Leitfäden + 7 Tool-
  Seiten, je DE+EN mit hreflang.
- Metadata je Route inkl. `alternates.languages` (hreflang de/en + x-default).
- Schema.org JSON-LD: Organization + SoftwareApplication (Landing), FAQPage +
  BreadcrumbList + Person (Guides/Tools).
- OG-Image-Template (`opengraph-image.tsx`) + Twitter-Cards.
