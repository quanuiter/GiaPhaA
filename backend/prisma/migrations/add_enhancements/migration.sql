-- AddColumn bioNote to Member
ALTER TABLE `Member` ADD COLUMN `bioNote` LONGTEXT;

-- AddColumn familyRole to Member
ALTER TABLE `Member` ADD COLUMN `familyRole` VARCHAR(50);

-- CreateTable RelationshipHistory
CREATE TABLE `RelationshipHistory` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `marriageId` INT NOT NULL,
    `memberId` INT NOT NULL,
    `oldStatus` VARCHAR(50) NOT NULL,
    `newStatus` VARCHAR(50) NOT NULL,
    `changeDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `note` LONGTEXT,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex on RelationshipHistory
CREATE INDEX `RelationshipHistory_marriageId_idx` ON `RelationshipHistory`(`marriageId`);
CREATE INDEX `RelationshipHistory_memberId_idx` ON `RelationshipHistory`(`memberId`);

-- AddForeignKey
ALTER TABLE `RelationshipHistory` ADD CONSTRAINT `RelationshipHistory_marriageId_fkey` FOREIGN KEY (`marriageId`) REFERENCES `Marriage`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `RelationshipHistory` ADD CONSTRAINT `RelationshipHistory_memberId_fkey` FOREIGN KEY (`memberId`) REFERENCES `Member`(`id`) ON UPDATE CASCADE;
