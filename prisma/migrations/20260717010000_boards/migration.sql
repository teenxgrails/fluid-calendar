-- Boards v1: user-defined boards with custom columns, saved views, and the
-- task fields that place a task on a board. Additive only — existing task
-- fields and the scheduling engine are untouched.

CREATE TABLE "Board" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "icon" TEXT,
    "position" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "groupBy" TEXT NOT NULL DEFAULT 'manual',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Board_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "BoardColumn" (
    "id" TEXT NOT NULL,
    "boardId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT,
    "position" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "mappingKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BoardColumn_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SavedView" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "boardId" TEXT,
    "type" TEXT NOT NULL,
    "groupBy" TEXT,
    "filters" JSONB,
    "sort" JSONB,
    "position" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SavedView_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Task" ADD COLUMN "boardId" TEXT;
ALTER TABLE "Task" ADD COLUMN "boardColumnId" TEXT;
ALTER TABLE "Task" ADD COLUMN "boardPosition" DOUBLE PRECISION;
ALTER TABLE "Task" ADD COLUMN "properties" JSONB;

CREATE INDEX "Board_userId_idx" ON "Board"("userId");
CREATE INDEX "BoardColumn_boardId_idx" ON "BoardColumn"("boardId");
CREATE INDEX "SavedView_userId_idx" ON "SavedView"("userId");
CREATE INDEX "SavedView_boardId_idx" ON "SavedView"("boardId");
CREATE INDEX "Task_boardId_idx" ON "Task"("boardId");
CREATE INDEX "Task_boardColumnId_idx" ON "Task"("boardColumnId");

ALTER TABLE "Board" ADD CONSTRAINT "Board_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BoardColumn" ADD CONSTRAINT "BoardColumn_boardId_fkey"
    FOREIGN KEY ("boardId") REFERENCES "Board"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SavedView" ADD CONSTRAINT "SavedView_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Task" ADD CONSTRAINT "Task_boardId_fkey"
    FOREIGN KEY ("boardId") REFERENCES "Board"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Task" ADD CONSTRAINT "Task_boardColumnId_fkey"
    FOREIGN KEY ("boardColumnId") REFERENCES "BoardColumn"("id") ON DELETE SET NULL ON UPDATE CASCADE;
