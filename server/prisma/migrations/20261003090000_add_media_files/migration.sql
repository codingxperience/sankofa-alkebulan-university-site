-- Photographs uploaded from the console (journal covers and article images),
-- stored in the database and served by the API at /api/media/{id}.
CREATE TABLE "media_files" (
    "id" UUID NOT NULL,
    "content_type" TEXT NOT NULL,
    "bytes" BYTEA NOT NULL,
    "byte_size" INTEGER NOT NULL,
    "sha256" TEXT NOT NULL,
    "file_name" TEXT,
    "uploaded_by_id" UUID,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "media_files_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "media_files_sha256_key" ON "media_files"("sha256");

ALTER TABLE "media_files" ADD CONSTRAINT "media_files_uploaded_by_id_fkey" FOREIGN KEY ("uploaded_by_id") REFERENCES "staff_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Only the image types the console accepts, and never an empty or oversized file.
ALTER TABLE "media_files" ADD CONSTRAINT "media_files_content_type_allowed" CHECK ("content_type" IN ('image/jpeg', 'image/png', 'image/webp', 'image/gif'));
ALTER TABLE "media_files" ADD CONSTRAINT "media_files_size_consistent" CHECK ("byte_size" > 0 AND "byte_size" <= 4194304 AND "byte_size" = octet_length("bytes"));

-- Like every table here: closed to Supabase's Data API roles.
ALTER TABLE "media_files" ENABLE ROW LEVEL SECURITY;
