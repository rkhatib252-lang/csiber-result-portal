-- AlterTable
ALTER TABLE "Result" ADD COLUMN     "externalMarks" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "gradePoint" INTEGER,
ADD COLUMN     "internalMarks" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "maxExternalMarks" INTEGER NOT NULL DEFAULT 75,
ADD COLUMN     "maxInternalMarks" INTEGER NOT NULL DEFAULT 25,
ADD COLUMN     "remark" VARCHAR(20);

-- AlterTable
ALTER TABLE "Subject" ADD COLUMN     "isHalfCredit" BOOLEAN NOT NULL DEFAULT false;
