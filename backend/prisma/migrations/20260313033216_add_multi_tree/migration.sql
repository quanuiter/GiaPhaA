/*
  Warnings:

  - You are about to drop the column `role` on the `user` table. All the data in the column will be lost.
  - Added the required column `treeId` to the `FamilyEvent` table without a default value. This is not possible if the table is not empty.
  - Added the required column `treeId` to the `Marriage` table without a default value. This is not possible if the table is not empty.
  - Added the required column `treeId` to the `Member` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `auditlog` ADD COLUMN `treeId` INTEGER NULL;

-- AlterTable
ALTER TABLE `category` ADD COLUMN `treeId` INTEGER NULL;

-- AlterTable
ALTER TABLE `familyevent` ADD COLUMN `treeId` INTEGER NOT NULL;

-- AlterTable
ALTER TABLE `marriage` ADD COLUMN `treeId` INTEGER NOT NULL;

-- AlterTable
ALTER TABLE `member` ADD COLUMN `treeId` INTEGER NOT NULL;

-- AlterTable
ALTER TABLE `user` DROP COLUMN `role`;

-- CreateTable
CREATE TABLE `FamilyTree` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(200) NOT NULL,
    `description` TEXT NULL,
    `logoUrl` VARCHAR(500) NULL,
    `bannerUrl` VARCHAR(500) NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'active',
    `createdBy` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TreeUser` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `treeId` INTEGER NOT NULL,
    `userId` INTEGER NOT NULL,
    `role` VARCHAR(191) NOT NULL DEFAULT 'viewer',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `TreeUser_treeId_idx`(`treeId`),
    INDEX `TreeUser_userId_idx`(`userId`),
    UNIQUE INDEX `TreeUser_treeId_userId_key`(`treeId`, `userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TreeConfig` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `treeId` INTEGER NOT NULL,
    `key` VARCHAR(100) NOT NULL,
    `value` VARCHAR(500) NOT NULL,

    INDEX `TreeConfig_treeId_idx`(`treeId`),
    UNIQUE INDEX `TreeConfig_treeId_key_key`(`treeId`, `key`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `AuditLog_treeId_idx` ON `AuditLog`(`treeId`);

-- CreateIndex
CREATE INDEX `Category_treeId_idx` ON `Category`(`treeId`);

-- CreateIndex
CREATE INDEX `FamilyEvent_treeId_idx` ON `FamilyEvent`(`treeId`);

-- CreateIndex
CREATE INDEX `Marriage_treeId_idx` ON `Marriage`(`treeId`);

-- CreateIndex
CREATE INDEX `Member_treeId_idx` ON `Member`(`treeId`);

-- AddForeignKey
ALTER TABLE `FamilyTree` ADD CONSTRAINT `FamilyTree_createdBy_fkey` FOREIGN KEY (`createdBy`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TreeUser` ADD CONSTRAINT `TreeUser_treeId_fkey` FOREIGN KEY (`treeId`) REFERENCES `FamilyTree`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TreeUser` ADD CONSTRAINT `TreeUser_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TreeConfig` ADD CONSTRAINT `TreeConfig_treeId_fkey` FOREIGN KEY (`treeId`) REFERENCES `FamilyTree`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Member` ADD CONSTRAINT `Member_treeId_fkey` FOREIGN KEY (`treeId`) REFERENCES `FamilyTree`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `FamilyEvent` ADD CONSTRAINT `FamilyEvent_treeId_fkey` FOREIGN KEY (`treeId`) REFERENCES `FamilyTree`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AuditLog` ADD CONSTRAINT `AuditLog_treeId_fkey` FOREIGN KEY (`treeId`) REFERENCES `FamilyTree`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
