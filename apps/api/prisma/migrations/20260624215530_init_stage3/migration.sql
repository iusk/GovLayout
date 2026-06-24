-- CreateTable
CREATE TABLE "Member" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "bioguideId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "party" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "district" INTEGER,
    "chamber" TEXT NOT NULL,
    "photoUrl" TEXT NOT NULL,
    "fecCandidateId" TEXT,
    "opensecretsUrl" TEXT NOT NULL,
    "pacPct" REAL,
    "lastSyncedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "moneySyncedAt" DATETIME
);

-- CreateTable
CREATE TABLE "Justice" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "fullName" TEXT NOT NULL,
    "photoUrl" TEXT NOT NULL,
    "appointedBy" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "source" TEXT NOT NULL,
    "order" INTEGER NOT NULL
);

-- CreateTable
CREATE TABLE "ExecutiveRole" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "roleKey" TEXT NOT NULL,
    "roleTitle" TEXT NOT NULL,
    "holderName" TEXT NOT NULL,
    "photoUrl" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "isPresident" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL
);

-- CreateTable
CREATE TABLE "Court" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "level" TEXT NOT NULL,
    "parentCourtId" TEXT,
    "clickable" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL
);

-- CreateTable
CREATE TABLE "SyncState" (
    "key" TEXT NOT NULL PRIMARY KEY,
    "lastRunAt" DATETIME,
    "cursor" TEXT,
    "status" TEXT NOT NULL DEFAULT 'idle',
    "message" TEXT,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Member_bioguideId_key" ON "Member"("bioguideId");

-- CreateIndex
CREATE INDEX "Member_chamber_idx" ON "Member"("chamber");

-- CreateIndex
CREATE UNIQUE INDEX "ExecutiveRole_roleKey_key" ON "ExecutiveRole"("roleKey");
