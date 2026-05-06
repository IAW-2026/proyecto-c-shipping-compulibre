-- CreateTable
CREATE TABLE `admin_profiles` (
    `id` VARCHAR(191) NOT NULL,
    `clerk_user_id` VARCHAR(191) NOT NULL,
    `display_name` VARCHAR(191) NOT NULL,
    `role` ENUM('SUPERADMIN') NOT NULL DEFAULT 'SUPERADMIN',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `admin_profiles_clerk_user_id_key`(`clerk_user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `shipments` (
    `tracking_id` VARCHAR(191) NOT NULL,
    `external_seller_order_id` VARCHAR(191) NOT NULL,
    `courier` VARCHAR(191) NOT NULL,
    `origin_address` VARCHAR(191) NOT NULL,
    `destination_address` VARCHAR(191) NOT NULL,
    `status` ENUM('LABEL_CREATED', 'IN_TRANSIT', 'DELIVERED') NOT NULL DEFAULT 'LABEL_CREATED',
    `label_url` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `shipments_status_idx`(`status`),
    INDEX `shipments_external_seller_order_id_idx`(`external_seller_order_id`),
    PRIMARY KEY (`tracking_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `shipment_events` (
    `id` VARCHAR(191) NOT NULL,
    `tracking_id` VARCHAR(191) NOT NULL,
    `status_update` ENUM('LABEL_CREATED', 'IN_TRANSIT', 'DELIVERED') NOT NULL,
    `location` VARCHAR(191) NOT NULL,
    `timestamp` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `shipment_events_tracking_id_idx`(`tracking_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `shipment_events` ADD CONSTRAINT `shipment_events_tracking_id_fkey` FOREIGN KEY (`tracking_id`) REFERENCES `shipments`(`tracking_id`) ON DELETE CASCADE ON UPDATE CASCADE;
