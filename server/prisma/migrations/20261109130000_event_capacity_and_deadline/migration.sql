ALTER TABLE "Event" ADD COLUMN "registrationDeadline" DATETIME;
ALTER TABLE "Event" ADD COLUMN "capacity" INTEGER NOT NULL DEFAULT 100;
ALTER TABLE "Event" ADD COLUMN "remainingSlots" INTEGER NOT NULL DEFAULT 100;

UPDATE "Event"
SET "remainingSlots" = CASE
  WHEN 100 - (SELECT COUNT(*) FROM "Registration" WHERE "Registration"."eventId" = "Event"."id") > 0
  THEN 100 - (SELECT COUNT(*) FROM "Registration" WHERE "Registration"."eventId" = "Event"."id")
  ELSE 0
END;
