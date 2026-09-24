-- Add createdBy, changedBy, changedAt to Student table
ALTER TABLE "Student" ADD COLUMN "createdBy" VARCHAR(255);
ALTER TABLE "Student" ADD COLUMN "changedBy" VARCHAR(255);
ALTER TABLE "Student" ADD COLUMN "changedAt" TIMESTAMP(3);