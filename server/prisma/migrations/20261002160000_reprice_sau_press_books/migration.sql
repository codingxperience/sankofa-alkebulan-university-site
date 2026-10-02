-- Beneath the Quiet Skin and Pan-African Strategic Mobilization in the 21st
-- Century are now sold; Africa's Next Century and Reengineering Global
-- Governance are now free to read.
--
-- The seed never overwrites a price, so a catalogue already in the database
-- needs this one correction. Each change is written to the activity log the
-- way a change made in the console would be. On an empty database nothing
-- matches, and the seed then inserts the new prices.
WITH "changed" AS (
    SELECT p."id", p."name", p."price_cents" AS "old_cents", v."new_cents"
    FROM "products" p
    JOIN (VALUES
        ('bk-quiet-skin', 2200),
        ('bk-pan-african', 2200),
        ('bk-next-century', 0),
        ('bk-governance', 0)
    ) AS v("sku", "new_cents") ON v."sku" = p."sku"
    WHERE p."price_cents" <> v."new_cents"
), "updated" AS (
    UPDATE "products" p
    SET "price_cents" = c."new_cents", "updated_at" = CURRENT_TIMESTAMP
    FROM "changed" c
    WHERE p."id" = c."id"
)
INSERT INTO "audit_events" ("id", "actor_label", "action", "entity_type", "entity_id", "summary")
SELECT
    gen_random_uuid(),
    'System',
    'product.updated',
    'product',
    c."id"::text,
    format(
        'System updated %s: price %s → %s USD.',
        c."name",
        to_char(c."old_cents" / 100.0, 'FM999999990.00'),
        to_char(c."new_cents" / 100.0, 'FM999999990.00')
    )
FROM "changed" c;
