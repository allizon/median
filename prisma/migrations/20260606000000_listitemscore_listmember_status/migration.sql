-- Drop ListVote table
DROP TABLE "ListVote";

-- Create ListItemScore table
CREATE TABLE "ListItemScore" (
    "listItemId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ListItemScore_pkey" PRIMARY KEY ("listItemId","userId")
);

-- Add foreign keys for ListItemScore
ALTER TABLE "ListItemScore" ADD CONSTRAINT "ListItemScore_listItemId_fkey" FOREIGN KEY ("listItemId") REFERENCES "ListItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ListItemScore" ADD CONSTRAINT "ListItemScore_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Create ListMemberStatus enum
CREATE TYPE "ListMemberStatus" AS ENUM ('pending', 'accepted');

-- Add status and updatedAt columns to ListMember
-- Use 'accepted' as migration default so existing rows are backfilled correctly
ALTER TABLE "ListMember" ADD COLUMN "status" "ListMemberStatus" NOT NULL DEFAULT 'accepted';
ALTER TABLE "ListMember" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Change status default to 'pending' for future inserts (matches schema default)
ALTER TABLE "ListMember" ALTER COLUMN "status" SET DEFAULT 'pending';
