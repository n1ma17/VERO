-- One company name per user (case-insensitive). Merge existing duplicates first.

DO $$
DECLARE
  r record;
  keep_id uuid;
BEGIN
  FOR r IN
    SELECT user_id, lower(btrim(name)) AS norm
      FROM companies
     GROUP BY user_id, lower(btrim(name))
    HAVING count(*) > 1
  LOOP
    SELECT c.id
      INTO keep_id
      FROM companies AS c
     WHERE c.user_id = r.user_id
       AND lower(btrim(c.name)) = r.norm
     ORDER BY c.created_at ASC, c.id ASC
     LIMIT 1;

  UPDATE bills AS b
     SET company_id = keep_id
    FROM companies AS c
   WHERE b.company_id = c.id
     AND c.user_id = r.user_id
     AND lower(btrim(c.name)) = r.norm
     AND c.id <> keep_id;

    INSERT INTO company_logos (company_id, media_type, bytes)
    SELECT keep_id, dl.media_type, dl.bytes
      FROM companies AS dup
      JOIN company_logos AS dl ON dl.company_id = dup.id
     WHERE dup.user_id = r.user_id
       AND lower(btrim(dup.name)) = r.norm
       AND dup.id <> keep_id
       AND NOT EXISTS (SELECT 1 FROM company_logos WHERE company_id = keep_id)
     LIMIT 1;

    DELETE FROM companies AS c
     WHERE c.user_id = r.user_id
       AND lower(btrim(c.name)) = r.norm
       AND c.id <> keep_id;
  END LOOP;
END;
$$;

DROP INDEX IF EXISTS companies_user_name_idx;

CREATE UNIQUE INDEX companies_user_name_unique
  ON companies (user_id, lower(btrim(name)));

COMMENT ON INDEX companies_user_name_unique IS
  'Each user may have at most one company per name (case-insensitive).';

INSERT INTO schema_migrations (version)
VALUES ('010_companies_unique')
ON CONFLICT (version) DO NOTHING;