-- Replace legacy readable primary keys while preserving every foreign-key reference.
-- Prisma CUIDs begin with "c"; randomblob keeps each migrated ID unique.
UPDATE "Event"
SET "id" = 'c' || lower(hex(randomblob(12)))
WHERE "id" LIKE 'event-%';

UPDATE "User"
SET "id" = 'c' || lower(hex(randomblob(12)))
WHERE "id" LIKE 'demo-%';
