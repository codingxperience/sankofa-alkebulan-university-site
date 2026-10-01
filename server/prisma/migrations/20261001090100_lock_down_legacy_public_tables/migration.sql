-- The previous backend created its tables in the `public` schema, which
-- Supabase serves through its Data API to anyone holding the project's anon
-- key — including `app_user`, which stores password hashes.
--
-- Turning on row level security with no policies closes that door. Nothing is
-- dropped or changed: the database owner still sees every row, and each table
-- can be inspected, exported, or removed deliberately later.
DO $$
DECLARE
    legacy text;
BEGIN
    FOREACH legacy IN ARRAY ARRAY[
        'app_user', 'Post', 'Comment', 'Like', 'Media', 'Product', 'OrderItem', 'Order',
        'Event', 'EventRegistration', 'Book', 'BookFile', 'Entitlement', 'PaymentEvent',
        'university_inquiry'
    ] LOOP
        IF to_regclass(format('public.%I', legacy)) IS NOT NULL THEN
            EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', legacy);
        END IF;
    END LOOP;
END
$$;
