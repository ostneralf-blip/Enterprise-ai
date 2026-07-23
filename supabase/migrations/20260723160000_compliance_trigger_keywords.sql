-- DB-getriebene Compliance-Erkennung (Folge-Feature): Trigger-Keywords je Regularie.
-- Bisher erkannten Canvas + Architektur Compliance über hardcodierte Regexe. Mit
-- trigger_keywords wird die Erkennung DB-getrieben — neue Regularien (per Admin
-- angelegt) tauchen automatisch in Canvas/Architektur auf, ohne Code-Änderung.
-- Keywords werden gegen den (kleingeschriebenen) Canvas-/Use-Case-Text gematcht.

alter table public.compliance_regulations
  add column if not exists trigger_keywords text[] not null default '{}';

-- Seed: bildet die bisherige hardcodierte Erkennung ab (+ BDSG). Beide Locale-Zeilen
-- je Slug bekommen dieselben Keywords (Detection kombiniert sie ohnehin).
update public.compliance_regulations set trigger_keywords = '{datenschutz,personenbezogen,"personenbezogene daten",dsgvo,gdpr}' where slug = 'dsgvo';
update public.compliance_regulations set trigger_keywords = '{"eu ai act","ki-verordnung",hochrisiko,biometrisch,"verbotene ki","ai act"}' where slug = 'eu_ai_act';
update public.compliance_regulations set trigger_keywords = '{"iso 27001",iso27001,isms,informationssicherheit,"soc 2",soc2,pentest}' where slug = 'iso_27001';
update public.compliance_regulations set trigger_keywords = '{nis2,nis-2,"nis 2",kritis,"kritische infrastruktur",cybersicherheit}' where slug = 'nis2';
update public.compliance_regulations set trigger_keywords = '{beschäftigt,mitarbeiter,arbeitnehmer,bewerber,recruiting,personalakte,personaldaten,leistungsbeurteilung,scoring,bonität,kreditwürdig,schufa}' where slug = 'bdsg';
update public.compliance_regulations set trigger_keywords = '{"iso 42001",iso42001,"ki-management","ai management",aims,"ki-governance"}' where slug = 'iso_42001';
update public.compliance_regulations set trigger_keywords = '{bait,bankaufsicht,bafin,finanzinstitut,kreditinstitut}' where slug = 'bait';
update public.compliance_regulations set trigger_keywords = '{lieferkette,sorgfaltspflicht,menschenrechte,lksg,lieferkettengesetz}' where slug = 'lksg';
