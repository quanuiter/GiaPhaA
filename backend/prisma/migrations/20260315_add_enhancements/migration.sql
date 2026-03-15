-- ===== Enhancements to Member model =====
-- Add bio field for biographical information
ALTER TABLE `Member` ADD COLUMN `bio` LONGTEXT;

-- Add address field for current address
ALTER TABLE `Member` ADD COLUMN `address` VARCHAR(255);

-- Add deathDate field (alternative to Death model, for convenience)
ALTER TABLE `Member` ADD COLUMN `deathDate` DATETIME;

-- Add deletedAt field for soft deletes
ALTER TABLE `Member` ADD COLUMN `deletedAt` DATETIME;

-- Add indexes for frequent queries
CREATE INDEX `idx_Member_deletedAt` ON `Member`(`deletedAt`);

-- ===== Enhancements to Marriage model =====
-- Add location field for marriage location
ALTER TABLE `Marriage` ADD COLUMN `location` VARCHAR(200);

-- Add witnesses field for marriage witnesses (JSON format)
ALTER TABLE `Marriage` ADD COLUMN `witnesses` LONGTEXT;

-- Add deletedAt field for soft deletes
ALTER TABLE `Marriage` ADD COLUMN `deletedAt` DATETIME;

-- Add missing indexes
CREATE INDEX `idx_Marriage_husbandId` ON `Marriage`(`husbandId`);
CREATE INDEX `idx_Marriage_wifeId` ON `Marriage`(`wifeId`);
CREATE INDEX `idx_Marriage_deletedAt` ON `Marriage`(`deletedAt`);

-- ===== Enhancements to Achievement model =====
-- Add certificate URL field
ALTER TABLE `Achievement` ADD COLUMN `certificate` VARCHAR(500);

-- Add deletedAt field for soft deletes
ALTER TABLE `Achievement` ADD COLUMN `deletedAt` DATETIME;

-- Add missing indexes
CREATE INDEX `idx_Achievement_memberId` ON `Achievement`(`memberId`);
CREATE INDEX `idx_Achievement_year` ON `Achievement`(`year`);
CREATE INDEX `idx_Achievement_deletedAt` ON `Achievement`(`deletedAt`);
