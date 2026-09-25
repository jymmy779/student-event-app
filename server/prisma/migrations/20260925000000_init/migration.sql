CREATE TABLE "User" ("id" TEXT NOT NULL PRIMARY KEY, "name" TEXT NOT NULL, "email" TEXT NOT NULL, "passwordHash" TEXT);
CREATE TABLE "Event" ("id" TEXT NOT NULL PRIMARY KEY, "title" TEXT NOT NULL, "description" TEXT NOT NULL, "location" TEXT NOT NULL, "startsAt" DATETIME NOT NULL, "endsAt" DATETIME NOT NULL, "qrToken" TEXT NOT NULL, "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE "Registration" ("id" TEXT NOT NULL PRIMARY KEY, "userId" TEXT NOT NULL, "eventId" TEXT NOT NULL, "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, "checkedInAt" DATETIME, CONSTRAINT "Registration_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE, CONSTRAINT "Registration_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event" ("id") ON DELETE CASCADE ON UPDATE CASCADE);
CREATE TABLE "Note" ("id" TEXT NOT NULL PRIMARY KEY, "userId" TEXT NOT NULL, "eventId" TEXT NOT NULL, "content" TEXT NOT NULL, "summary" TEXT, "updatedAt" DATETIME NOT NULL, CONSTRAINT "Note_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE, CONSTRAINT "Note_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event" ("id") ON DELETE CASCADE ON UPDATE CASCADE);
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "Event_qrToken_key" ON "Event"("qrToken");
CREATE UNIQUE INDEX "Registration_userId_eventId_key" ON "Registration"("userId", "eventId");
CREATE UNIQUE INDEX "Note_userId_eventId_key" ON "Note"("userId", "eventId");
