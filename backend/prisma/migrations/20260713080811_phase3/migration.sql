-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "senderId" TEXT NOT NULL,
    "receiverId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Message_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Message_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Shop" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "logoUrl" TEXT,
    "bannerUrl" TEXT,
    "description" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "whatsapp" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "socialLinks" TEXT NOT NULL,
    "followersCount" INTEGER NOT NULL DEFAULT 0,
    "rating" REAL NOT NULL DEFAULT 0.0,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "walletBalance" REAL NOT NULL DEFAULT 0.0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Shop_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Shop" ("bannerUrl", "createdAt", "description", "followersCount", "id", "isFeatured", "location", "logoUrl", "name", "ownerId", "rating", "slug", "socialLinks", "updatedAt", "whatsapp") SELECT "bannerUrl", "createdAt", "description", "followersCount", "id", "isFeatured", "location", "logoUrl", "name", "ownerId", "rating", "slug", "socialLinks", "updatedAt", "whatsapp" FROM "Shop";
DROP TABLE "Shop";
ALTER TABLE "new_Shop" RENAME TO "Shop";
CREATE UNIQUE INDEX "Shop_name_key" ON "Shop"("name");
CREATE UNIQUE INDEX "Shop_slug_key" ON "Shop"("slug");
CREATE UNIQUE INDEX "Shop_ownerId_key" ON "Shop"("ownerId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
