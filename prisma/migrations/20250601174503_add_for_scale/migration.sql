/*
  Warnings:

  - You are about to drop the column `moodGateMax` on the `Question` table. All the data in the column will be lost.
  - You are about to drop the column `moodGateMin` on the `Question` table. All the data in the column will be lost.
  - Added the required column `forScale` to the `Question` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Question" DROP COLUMN "moodGateMax",
DROP COLUMN "moodGateMin",
ADD COLUMN     "forScale" INTEGER NOT NULL;
