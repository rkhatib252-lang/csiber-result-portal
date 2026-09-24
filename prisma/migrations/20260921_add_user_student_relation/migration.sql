-- Add userId column to Student table
ALTER TABLE "Student" ADD COLUMN "userId" TEXT;

-- Add unique constraint on userId
CREATE UNIQUE INDEX "Student_userId_key" ON "Student"("userId");

-- Add foreign key constraint
ALTER TABLE "Student" ADD CONSTRAINT "Student_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;