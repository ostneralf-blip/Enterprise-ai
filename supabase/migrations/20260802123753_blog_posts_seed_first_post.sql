-- Überführt den bestehenden Blogbeitrag aus src/config/blog-data.ts in die neuen Tabellen.
--
-- Status bewusst 'in_review' und NICHT 'published' (Entscheidung Daniel, 02.08.2026):
-- Der Beitrag wurde KI-unterstützt entworfen und ist noch nicht redaktionell geprüft.
-- Die Freigabe erfolgt über das Admin-Dashboard, damit sie mit Prüfer und Zeitpunkt
-- dokumentiert ist — das ist genau der Nachweis, den die Ausnahme in Art. 50 Abs. 4
-- EU AI Act verlangt. Bis dahin ist der Beitrag öffentlich nicht erreichbar (RLS lässt
-- nur status = 'published' nach außen).
--
-- ai_assisted = true ist gesetzt, weil der Entwurf von einem Sprachmodell stammt.
--
-- Das SQL wurde aus src/config/blog-data.ts generiert (nicht abgetippt), um
-- Übertragungsfehler im Fließtext auszuschließen. Dollar-Quoting ($txt$) umgeht
-- Escaping-Probleme bei Apostrophen und Anführungszeichen.

-- ── Beitrag: ki-governance-betriebsmodelle ──

insert into public.blog_posts
  (slug, status, published_at, reading_minutes, ai_assisted, reviewed_by, reviewed_at, cta_tool_slug, related_guide_slugs)
values
  ($txt$ki-governance-betriebsmodelle$txt$, 'in_review', $txt$2026-08-02$txt$::date, 7, true, null, null,
   $txt$governance-check$txt$, array[$txt$ai-governance-aufbauen$txt$, $txt$governance-entscheidungsbaum$txt$]::text[])
on conflict (slug) do nothing;

insert into public.blog_post_translations (post_id, locale, category, eyebrow, title, meta_description, lead)
select id, 'de', $txt$Governance$txt$, $txt$Blog · Governance$txt$, $txt$Wer entscheidet über KI? Drei Betriebsmodelle für KI-Governance$txt$, $txt$Zentrales Center of Excellence, föderiertes Modell oder eingebettet in bestehende Gremien: Welches Betriebsmodell für KI-Governance zu Ihrer Organisation passt — und woran Sie die Fehlentscheidung erkennen.$txt$, $txt$Die meisten Governance-Diskussionen beginnen bei Richtlinien und Formularen. Die eigentliche Weichenstellung liegt früher: Wer trifft die Entscheidung, ob ein KI-Vorhaben startet — und wer trägt die Verantwortung, wenn es schiefgeht? Drei Betriebsmodelle haben sich herausgebildet. Keines ist grundsätzlich besser, aber jedes scheitert auf seine eigene Weise.$txt$
from public.blog_posts where slug = $txt$ki-governance-betriebsmodelle$txt$
on conflict (post_id, locale) do nothing;

insert into public.blog_post_sections (post_id, locale, position, heading, paragraphs, bullets, callout_tag, callout_body)
select id, 'de', 0, $txt$Governance ist eine Organisationsfrage, keine Dokumentenfrage$txt$,
       array[$txt$In vielen Unternehmen entsteht KI-Governance als Nebenprodukt einer Compliance-Anforderung. Jemand fordert eine Richtlinie, jemand schreibt sie, und das Dokument wandert ins Intranet. Sechs Monate später starten trotzdem Vorhaben an der Richtlinie vorbei — nicht aus bösem Willen, sondern weil nie geklärt wurde, wer überhaupt zuständig ist.$txt$, $txt$Eine Richtlinie beschreibt, was gelten soll. Ein Betriebsmodell beschreibt, wer entscheidet, wer prüft, wer eskaliert und wie lange das dauert. Ohne das Zweite bleibt das Erste folgenlos. Die Frage nach dem Betriebsmodell lässt sich auf drei Grundmuster reduzieren.$txt$]::text[],
       '{}'::text[],
       null,
       null
from public.blog_posts where slug = $txt$ki-governance-betriebsmodelle$txt$
on conflict (post_id, locale, position) do nothing;

insert into public.blog_post_sections (post_id, locale, position, heading, paragraphs, bullets, callout_tag, callout_body)
select id, 'de', 1, $txt$Modell A: Zentrales Center of Excellence$txt$,
       array[$txt$Eine benannte Einheit bündelt KI-Kompetenz, bewertet jedes Vorhaben und gibt es frei. Fachbereiche bringen Ideen ein, das Zentrum entscheidet über Priorisierung, Risikoklasse und Umsetzungspfad.$txt$]::text[],
       array[$txt$Passt, wenn KI-Kompetenz knapp ist und Sie eine konsistente Risikobewertung über sehr unterschiedliche Fachbereiche hinweg brauchen.$txt$, $txt$Passt, wenn regulatorischer Druck hoch ist und Nachweisführung an einer Stelle gebündelt werden soll.$txt$, $txt$Typisches Scheitern: Das Zentrum wird zum Nadelöhr. Die Warteschlange wächst, Fachbereiche weichen aus, und es entsteht eine Schatten-KI-Landschaft, die niemand mehr überblickt.$txt$]::text[],
       null,
       null
from public.blog_posts where slug = $txt$ki-governance-betriebsmodelle$txt$
on conflict (post_id, locale, position) do nothing;

insert into public.blog_post_sections (post_id, locale, position, heading, paragraphs, bullets, callout_tag, callout_body)
select id, 'de', 2, $txt$Modell B: Föderiert mit zentralem Regelwerk$txt$,
       array[$txt$Ein kleines Kernteam definiert Regeln, Risikoklassen und Mindestanforderungen. Entscheiden dürfen die Fachbereiche selbst — solange sie sich innerhalb der Klassifizierung bewegen. Erst oberhalb einer definierten Schwelle greift die zentrale Prüfung.$txt$, $txt$Dieses Modell setzt voraus, dass die Schwelle wirklich trennscharf ist. Wer „hohes Risiko" nur unscharf beschreibt, erzeugt entweder Dauerbelastung des Kernteams oder stillschweigendes Durchwinken.$txt$]::text[],
       array[$txt$Passt, wenn Fachbereiche eigene Umsetzungskapazität haben und Geschwindigkeit zählt.$txt$, $txt$Typisches Scheitern: Die Selbsteinstufung wird zur Formsache. Fast alles landet in der niedrigsten Klasse, weil die höhere Klasse spürbar mehr Aufwand bedeutet.$txt$]::text[],
       $txt$Praxishinweis$txt$,
       $txt$Prüfen Sie die Verteilung der Selbsteinstufungen nach sechs Monaten. Landen über neunzig Prozent der Vorhaben in der niedrigsten Risikoklasse, ist das selten ein Befund über die Vorhaben — sondern über die Anreize der Einstufung.$txt$
from public.blog_posts where slug = $txt$ki-governance-betriebsmodelle$txt$
on conflict (post_id, locale, position) do nothing;

insert into public.blog_post_sections (post_id, locale, position, heading, paragraphs, bullets, callout_tag, callout_body)
select id, 'de', 3, $txt$Modell C: Eingebettet in bestehende Gremien$txt$,
       array[$txt$KI-Vorhaben durchlaufen keine eigene Instanz, sondern die vorhandenen Wege: Architekturboard, Datenschutzprüfung, Investitionsfreigabe. Ergänzt wird lediglich um KI-spezifische Prüfpunkte in bestehenden Checklisten.$txt$, $txt$Der Reiz liegt im geringen Aufbauaufwand und in der Akzeptanz — niemand muss ein neues Gremium anerkennen. Der Preis ist fehlende Sichtbarkeit: Ohne eine Stelle, die den Gesamtbestand kennt, lässt sich kaum beantworten, wie viele KI-Systeme im Haus betrieben werden.$txt$]::text[],
       array[$txt$Passt bei kleiner KI-Landschaft und gut funktionierenden bestehenden Gremien.$txt$, $txt$Typisches Scheitern: Es gibt kein Verzeichnis. Bei der ersten Nachfrage von außen kann niemand sagen, welche Systeme betroffen sind.$txt$]::text[],
       null,
       null
from public.blog_posts where slug = $txt$ki-governance-betriebsmodelle$txt$
on conflict (post_id, locale, position) do nothing;

insert into public.blog_post_sections (post_id, locale, position, heading, paragraphs, bullets, callout_tag, callout_body)
select id, 'de', 4, $txt$Woran Sie das passende Modell erkennen$txt$,
       array[$txt$Die Wahl hängt weniger an der Unternehmensgröße als an zwei Größen: der Verteilung der Umsetzungskompetenz und der Höhe des regulatorischen Drucks. Liegt die Kompetenz zentral und der Druck hoch, ist Modell A folgerichtig. Liegt Kompetenz verteilt vor und der Druck ist hoch, führt Modell B weiter. Ist beides gering, genügt zunächst Modell C — solange ein Verzeichnis mitgeführt wird.$txt$, $txt$Wichtiger als die erste Wahl ist, das Modell überhaupt explizit zu benennen. Die teuerste Variante ist das unausgesprochene Modell, bei dem jeder Beteiligte eine andere Annahme darüber hat, wer zuständig ist.$txt$]::text[],
       '{}'::text[],
       $txt$Was in jedem Modell gleich bleibt$txt$,
       $txt$Drei Dinge müssen unabhängig vom Betriebsmodell geklärt sein: ein Verzeichnis aller KI-Systeme, eine benannte verantwortliche Person je System und ein definierter Eskalationsweg. Fehlt eines davon, hilft auch das durchdachteste Modell nicht.$txt$
from public.blog_posts where slug = $txt$ki-governance-betriebsmodelle$txt$
on conflict (post_id, locale, position) do nothing;

insert into public.blog_post_translations (post_id, locale, category, eyebrow, title, meta_description, lead)
select id, 'en', $txt$Governance$txt$, $txt$Blog · Governance$txt$, $txt$Who Decides on AI? Three Operating Models for AI Governance$txt$, $txt$Central center of excellence, federated model, or embedded in existing committees: which AI governance operating model fits your organization — and how to spot the wrong choice early.$txt$, $txt$Most governance discussions start with policies and forms. The real fork in the road comes earlier: who decides whether an AI initiative goes ahead — and who carries the responsibility when it goes wrong? Three operating models have emerged. None is inherently better, but each fails in its own particular way.$txt$
from public.blog_posts where slug = $txt$ki-governance-betriebsmodelle$txt$
on conflict (post_id, locale) do nothing;

insert into public.blog_post_sections (post_id, locale, position, heading, paragraphs, bullets, callout_tag, callout_body)
select id, 'en', 0, $txt$Governance is an organizational question, not a document question$txt$,
       array[$txt$In many organizations, AI governance emerges as a by-product of a compliance requirement. Someone asks for a policy, someone writes it, and the document lands on the intranet. Six months later, initiatives still start outside the policy — not out of bad faith, but because nobody ever settled who is actually accountable.$txt$, $txt$A policy describes what should apply. An operating model describes who decides, who reviews, who escalates, and how long that takes. Without the second, the first has no consequences. The operating model question reduces to three basic patterns.$txt$]::text[],
       '{}'::text[],
       null,
       null
from public.blog_posts where slug = $txt$ki-governance-betriebsmodelle$txt$
on conflict (post_id, locale, position) do nothing;

insert into public.blog_post_sections (post_id, locale, position, heading, paragraphs, bullets, callout_tag, callout_body)
select id, 'en', 1, $txt$Model A: Central center of excellence$txt$,
       array[$txt$A named unit concentrates AI expertise, assesses every initiative, and approves it. Business units submit ideas; the center decides on prioritization, risk class, and delivery path.$txt$]::text[],
       array[$txt$Fits when AI expertise is scarce and you need consistent risk assessment across very different business units.$txt$, $txt$Fits when regulatory pressure is high and evidence needs to be consolidated in one place.$txt$, $txt$Typical failure: the center becomes a bottleneck. The queue grows, business units route around it, and a shadow AI landscape appears that nobody can see any more.$txt$]::text[],
       null,
       null
from public.blog_posts where slug = $txt$ki-governance-betriebsmodelle$txt$
on conflict (post_id, locale, position) do nothing;

insert into public.blog_post_sections (post_id, locale, position, heading, paragraphs, bullets, callout_tag, callout_body)
select id, 'en', 2, $txt$Model B: Federated with a central rulebook$txt$,
       array[$txt$A small core team defines rules, risk classes, and minimum requirements. Business units decide for themselves — as long as they stay within the classification. Central review only kicks in above a defined threshold.$txt$, $txt$This model depends on the threshold being genuinely sharp. If "high risk" is only loosely described, you get either a permanently overloaded core team or quiet rubber-stamping.$txt$]::text[],
       array[$txt$Fits when business units have their own delivery capacity and speed matters.$txt$, $txt$Typical failure: self-classification becomes a formality. Almost everything ends up in the lowest class, because the higher class means noticeably more work.$txt$]::text[],
       $txt$From practice$txt$,
       $txt$Review the distribution of self-classifications after six months. If more than ninety percent of initiatives land in the lowest risk class, that rarely says something about the initiatives — it says something about the incentives built into the classification.$txt$
from public.blog_posts where slug = $txt$ki-governance-betriebsmodelle$txt$
on conflict (post_id, locale, position) do nothing;

insert into public.blog_post_sections (post_id, locale, position, heading, paragraphs, bullets, callout_tag, callout_body)
select id, 'en', 3, $txt$Model C: Embedded in existing committees$txt$,
       array[$txt$AI initiatives go through no dedicated body, but through existing paths: architecture board, data protection review, investment approval. The only addition is AI-specific checkpoints inside existing checklists.$txt$, $txt$The appeal is low setup cost and acceptance — nobody has to recognize a new committee. The price is missing visibility: without one place that knows the overall portfolio, it is hard to answer how many AI systems the organization actually runs.$txt$]::text[],
       array[$txt$Fits with a small AI landscape and existing committees that already work well.$txt$, $txt$Typical failure: there is no inventory. At the first external inquiry, nobody can say which systems are affected.$txt$]::text[],
       null,
       null
from public.blog_posts where slug = $txt$ki-governance-betriebsmodelle$txt$
on conflict (post_id, locale, position) do nothing;

insert into public.blog_post_sections (post_id, locale, position, heading, paragraphs, bullets, callout_tag, callout_body)
select id, 'en', 4, $txt$How to recognize the model that fits$txt$,
       array[$txt$The choice depends less on company size than on two variables: how delivery capability is distributed, and how high regulatory pressure is. Central capability plus high pressure makes model A consistent. Distributed capability plus high pressure points to model B. If both are low, model C is enough for now — as long as an inventory is maintained.$txt$, $txt$More important than the initial choice is naming the model explicitly at all. The most expensive variant is the unspoken model, where every participant holds a different assumption about who is accountable.$txt$]::text[],
       '{}'::text[],
       $txt$What stays the same in every model$txt$,
       $txt$Three things must be settled regardless of operating model: an inventory of all AI systems, a named accountable person per system, and a defined escalation path. If one of them is missing, even the best-designed model will not help.$txt$
from public.blog_posts where slug = $txt$ki-governance-betriebsmodelle$txt$
on conflict (post_id, locale, position) do nothing;
