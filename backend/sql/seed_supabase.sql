-- Seed data for Supabase (run in Supabase SQL editor)
-- IMPORTANT: This matches Prisma table/column names from this repository.
-- Password is plaintext for bootstrap convenience; first successful login will re-hash in backend auth service.

INSERT INTO app_user ("id", "email", "name", "role", "password", "createdAt", "updatedAt")
VALUES (
  gen_random_uuid()::text,
  'admin@sankofa.local',
  'Site Admin',
  'admin',
  'AdminPass123!',
  now(),
  now()
)
ON CONFLICT ("email") DO NOTHING;

INSERT INTO "Post" ("id", "title", "slug", "content", "published", "authorId", "createdAt", "updatedAt")
VALUES (
  gen_random_uuid()::text,
  'Welcome to Sankofa',
  'welcome-to-sankofa',
  'This is a seeded welcome post. Replace with your real content.',
  true,
  (SELECT "id" FROM app_user WHERE "email" = 'admin@sankofa.local'),
  now(),
  now()
)
ON CONFLICT ("slug") DO NOTHING;

INSERT INTO "Comment" ("id", "postId", "authorId", "content", "createdAt")
VALUES (
  gen_random_uuid()::text,
  (SELECT "id" FROM "Post" WHERE "slug" = 'welcome-to-sankofa'),
  (SELECT "id" FROM app_user WHERE "email" = 'admin@sankofa.local'),
  'First seeded comment.',
  now()
);

INSERT INTO "Like" ("id", "postId", "userId", "createdAt")
VALUES (
  gen_random_uuid()::text,
  (SELECT "id" FROM "Post" WHERE "slug" = 'welcome-to-sankofa'),
  (SELECT "id" FROM app_user WHERE "email" = 'admin@sankofa.local'),
  now()
)
ON CONFLICT ("postId", "userId") DO NOTHING;

INSERT INTO "Media" ("id", "url", "filename", "mimetype", "size", "uploadedById", "createdAt")
VALUES
  (gen_random_uuid()::text, '/wp-content/uploads/library-pdfs/john_iliffe_africans_the_history_of_a_continentbookos.org_.pdf', 'john_iliffe_africans_the_history_of_a_continentbookos.org_.pdf', 'application/pdf', NULL, (SELECT "id" FROM app_user WHERE "email" = 'admin@sankofa.local'), now()),
  (gen_random_uuid()::text, '/wp-content/uploads/library-pdfs/Fondad-AfricaWorld-BookComplete.pdf', 'Fondad-AfricaWorld-BookComplete.pdf', 'application/pdf', NULL, (SELECT "id" FROM app_user WHERE "email" = 'admin@sankofa.local'), now()),
  (gen_random_uuid()::text, '/wp-content/uploads/library-pdfs/Decolonising the mind-Ngugi Wa Thiong''O.pdf', 'Decolonising the mind-Ngugi Wa Thiong''O.pdf', 'application/pdf', NULL, (SELECT "id" FROM app_user WHERE "email" = 'admin@sankofa.local'), now()),
  (gen_random_uuid()::text, '/wp-content/uploads/library-pdfs/africa-migration-report.pdf', 'africa-migration-report.pdf', 'application/pdf', NULL, (SELECT "id" FROM app_user WHERE "email" = 'admin@sankofa.local'), now()),
  (gen_random_uuid()::text, '/wp-content/uploads/library-pdfs/AEHN_Textbook_29_March_2023_final.pdf', 'AEHN_Textbook_29_March_2023_final.pdf', 'application/pdf', NULL, (SELECT "id" FROM app_user WHERE "email" = 'admin@sankofa.local'), now()),
  (gen_random_uuid()::text, '/wp-content/uploads/library-pdfs/accelerated_development_in_subsahara_africa_world_bank_document.pdf', 'accelerated_development_in_subsahara_africa_world_bank_document.pdf', 'application/pdf', NULL, (SELECT "id" FROM app_user WHERE "email" = 'admin@sankofa.local'), now()),
  (gen_random_uuid()::text, '/wp-content/uploads/library-pdfs/2023-facts-figures-global-africa.pdf', '2023-facts-figures-global-africa.pdf', 'application/pdf', NULL, (SELECT "id" FROM app_user WHERE "email" = 'admin@sankofa.local'), now());
