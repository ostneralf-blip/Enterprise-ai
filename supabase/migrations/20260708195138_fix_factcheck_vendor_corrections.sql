-- Fact-Check-Korrekturen (08.07.2026)
-- TensorFlow: wurde nie an die Linux Foundation übergeben, bleibt unter Google-Governance
-- MLflow: seit 2020 bei der Linux Foundation — DB-Duplikat (vendor='Databricks/Apache') entfernen,
--         da bereits eine korrekte Zeile (vendor='Linux Foundation') aus der SQL-Migration existiert

UPDATE component_catalog SET vendor = 'Google' WHERE name = 'TensorFlow' AND vendor = 'Google/LF';

DELETE FROM component_catalog
WHERE name = 'MLflow' AND vendor = 'Databricks/Apache'
  AND EXISTS (SELECT 1 FROM component_catalog WHERE name = 'MLflow' AND vendor = 'Linux Foundation');
