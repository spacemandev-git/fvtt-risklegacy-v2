-- AlterTable
ALTER TABLE "User" ADD COLUMN "refreshToken" TEXT;
ALTER TABLE "User" ADD COLUMN "refreshTokenExpiry" DATETIME;
