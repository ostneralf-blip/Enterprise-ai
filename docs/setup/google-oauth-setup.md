# Google OAuth aktivieren (Config-Schritte für Daniel)

Der **Code** ist fertig (Buttons auf Login + Register, Callback-Route
`/api/auth/callback`). Es fehlt nur die Provider-Konfiguration — die kann nur mit
Zugang zu Google Cloud + Supabase erledigt werden.

## 1. Google Cloud Console — OAuth-Client anlegen
1. https://console.cloud.google.com → Projekt anlegen/wählen.
2. **APIs & Services → OAuth consent screen**: External, App-Name „AI Navigator",
   Support-E-Mail, Domain `enterprise-ai.biz`. Speichern.
3. **APIs & Services → Credentials → Create Credentials → OAuth client ID**:
   - Application type: **Web application**
   - **Authorized JavaScript origins**: `https://enterprise-ai.biz` (+ `http://localhost:3001` für lokal)
   - **Authorized redirect URIs**: die Supabase-Callback-URL — Format:
     `https://<PROJECT-REF>.supabase.co/auth/v1/callback`
     (PROJECT-REF = `vfnvqzmkvphszwdzjulz`, also
     `https://vfnvqzmkvphszwdzjulz.supabase.co/auth/v1/callback`)
4. **Client ID** + **Client Secret** kopieren.

## 2. Supabase — Google-Provider aktivieren
1. Supabase Dashboard → **Authentication → Providers → Google**.
2. **Enable** anschalten, **Client ID** + **Client Secret** aus Schritt 1 einfügen.
3. Speichern.

## 3. Redirect-URLs in Supabase prüfen
**Authentication → URL Configuration**:
- **Site URL**: `https://enterprise-ai.biz`
- **Redirect URLs** (Allow-List) muss enthalten:
  `https://enterprise-ai.biz/api/auth/callback` und
  `http://localhost:3001/api/auth/callback`

## 4. Testen
- Auf `/login` und `/register` erscheint „Mit Google anmelden".
- Klick → Google-Consent → zurück auf `/api/auth/callback` → `/dashboard`.
- Bei Fehler: Redirect-URI-Mismatch (Schritt 1.3 ↔ 3) ist die häufigste Ursache.

## Hinweis Apple/Microsoft
Analoges Vorgehen, aber Apple braucht das Apple Developer Program (99 $/Jahr) +
Schlüssel-Rotation alle 6 Monate; Microsoft (Entra) eine App-Registrierung im
Azure-Portal. Beide sind code-seitig noch nicht gebaut (nur Google gewünscht).
