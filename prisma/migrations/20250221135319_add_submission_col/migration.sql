/*
  Warnings:

  - You are about to drop the `ExecutionLog` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[submissionId]` on the table `ExecutionFingerprint` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `submissionId` to the `ExecutionFingerprint` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "ExecutionLog" DROP CONSTRAINT "ExecutionLog_submissionId_fkey";

-- DropForeignKey
ALTER TABLE "ExecutionLog" DROP CONSTRAINT "ExecutionLog_userId_fkey";

-- AlterTable
ALTER TABLE "ExecutionFingerprint" ADD COLUMN     "submissionId" TEXT NOT NULL;

-- DropTable
DROP TABLE "ExecutionLog";

-- CreateIndex
CREATE UNIQUE INDEX "ExecutionFingerprint_submissionId_key" ON "ExecutionFingerprint"("submissionId");

-- AddForeignKey
ALTER TABLE "ExecutionFingerprint" ADD CONSTRAINT "ExecutionFingerprint_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "Submission"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
