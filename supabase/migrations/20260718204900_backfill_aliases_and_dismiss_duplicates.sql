-- Fix: "Zum Katalog hinzufügen" legte Komponenten unter ihrem angereicherten
-- Namen an (z. B. "Databricks Data Intelligence Platform"), ohne den
-- ursprünglichen kurzen KI-Namen ("Databricks") als Alias zu hinterlegen —
-- beim nächsten Wizard-Lauf nannte die KI wieder den kurzen Namen, der dann
-- erneut als "unbekannt" galt und die Komponente wiederholt als neuer
-- Vorschlag auftauchte (Bug-Report Daniel, 18.07.2026). Route legt Aliase
-- jetzt korrekt an — hier rückwirkend für bereits aufgelöste Vorschläge
-- nachtragen.
update component_catalog cc
set aliases = (
  select array(
    select distinct alias from unnest(
      coalesce(cc.aliases, '{}') || array(
        select cs.suggested_name
        from catalog_suggestions cs
        where cs.catalog_component_id = cc.id
          and cs.status = 'added'
          and lower(trim(cs.suggested_name)) <> lower(trim(cc.name))
      )
    ) as alias
  )
),
updated_at = now()
where exists (
  select 1 from catalog_suggestions cs
  where cs.catalog_component_id = cc.id
    and cs.status = 'added'
    and lower(trim(cs.suggested_name)) <> lower(trim(cc.name))
);

-- Bereits erneut aufgetauchte "pending"-Duplikate von längst aufgelösten
-- Vorschlägen (gleicher Name, andere Zeile schon status='added') als
-- verworfen markieren statt sie in der Review-Queue stehen zu lassen.
update catalog_suggestions dup
set status = 'dismissed', resolved_at = now()
where dup.status = 'pending'
  and exists (
    select 1 from catalog_suggestions resolved
    where resolved.status = 'added'
      and lower(trim(resolved.suggested_name)) = lower(trim(dup.suggested_name))
  );
