-- Skema Database MySQL HujanPantau IoT (Staging & Production)
-- Jalankan skrip ini jika ingin membuat tabel secara manual di phpMyAdmin atau MySQL CLI

CREATE DATABASE IF NOT EXISTS `hujan_iot_staging` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS `hujan_iot_prod` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS `hujan_iot` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Buat user database jika belum ada
CREATE USER IF NOT EXISTS 'hujan_user'@'localhost' IDENTIFIED BY 'dieBWzRk7si447bZ';
CREATE USER IF NOT EXISTS 'hujan_user'@'127.0.0.1' IDENTIFIED BY 'dieBWzRk7si447bZ';
ALTER USER 'hujan_user'@'localhost' IDENTIFIED BY 'dieBWzRk7si447bZ';
ALTER USER 'hujan_user'@'127.0.0.1' IDENTIFIED BY 'dieBWzRk7si447bZ';

GRANT ALL PRIVILEGES ON `hujan_iot_staging`.* TO 'hujan_user'@'localhost';
GRANT ALL PRIVILEGES ON `hujan_iot_staging`.* TO 'hujan_user'@'127.0.0.1';
GRANT ALL PRIVILEGES ON `hujan_iot_prod`.* TO 'hujan_user'@'localhost';
GRANT ALL PRIVILEGES ON `hujan_iot_prod`.* TO 'hujan_user'@'127.0.0.1';
GRANT ALL PRIVILEGES ON `hujan_iot`.* TO 'hujan_user'@'localhost';
GRANT ALL PRIVILEGES ON `hujan_iot`.* TO 'hujan_user'@'127.0.0.1';
FLUSH PRIVILEGES;

USE `hujan_iot_staging`;

-- Tabel Pengguna (Multi-User)
CREATE TABLE IF NOT EXISTS `users` (
  `id` VARCHAR(64) NOT NULL,
  `username` VARCHAR(64) NOT NULL,
  `name` VARCHAR(128) NOT NULL,
  `password_hash` VARCHAR(256) NOT NULL,
  `created_at` DATETIME(3) NULL,
  `updated_at` DATETIME(3) NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_users_username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabel Perangkat IoT
CREATE TABLE IF NOT EXISTS `devices` (
  `id` VARCHAR(64) NOT NULL,
  `user_id` VARCHAR(64) NULL,
  `name` VARCHAR(128) NOT NULL,
  `broker_url` VARCHAR(256) NULL,
  `lokasi_adm4` VARCHAR(32) NULL,
  `ambang_pct` INT DEFAULT 60,
  `status` VARCHAR(32) DEFAULT 'offline',
  `motor_position` VARCHAR(32) DEFAULT 'extended',
  `motor_status` VARCHAR(32) DEFAULT 'idle',
  `motor_last_moved_at` DATETIME(3) NULL,
  `last_seen_at` DATETIME(3) NULL,
  `created_at` DATETIME(3) NULL,
  `updated_at` DATETIME(3) NULL,
  PRIMARY KEY (`id`),
  KEY `idx_devices_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabel Telemetri Sensor Hujan & Lingkungan
CREATE TABLE IF NOT EXISTS `telemetries` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `device_id` VARCHAR(64) NULL,
  `timestamp` BIGINT NULL,
  `raw` INT NULL,
  `pct` INT NULL,
  `wet` TINYINT(1) NULL,
  `temp_c` DOUBLE NULL,
  `hum` DOUBLE NULL,
  `vbat` DOUBLE NULL,
  `rssi` INT NULL,
  `created_at` DATETIME(3) NULL,
  PRIMARY KEY (`id`),
  KEY `idx_telemetries_device_id` (`device_id`),
  KEY `idx_telemetries_timestamp` (`timestamp`),
  KEY `idx_telemetries_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabel Event Perangkat & Sistem
CREATE TABLE IF NOT EXISTS `events` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `device_id` VARCHAR(64) NULL,
  `event_type` VARCHAR(64) NULL,
  `timestamp` BIGINT NULL,
  `data_json` TEXT NULL,
  `created_at` DATETIME(3) NULL,
  PRIMARY KEY (`id`),
  KEY `idx_events_device_id` (`device_id`),
  KEY `idx_events_event_type` (`event_type`),
  KEY `idx_events_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabel Prediksi AI Cuaca & Jemuran
CREATE TABLE IF NOT EXISTS `ai_predictions` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `device_id` VARCHAR(64) NULL,
  `timestamp` BIGINT NULL,
  `window_mins` INT NULL,
  `probability` DOUBLE NULL,
  `status` VARCHAR(32) NULL,
  `confidence` DOUBLE NULL,
  `factors_json` TEXT NULL,
  `created_at` DATETIME(3) NULL,
  PRIMARY KEY (`id`),
  KEY `idx_ai_predictions_device_id` (`device_id`),
  KEY `idx_ai_predictions_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Data Default Demo User: admin / admin123
INSERT IGNORE INTO `users` (`id`, `username`, `name`, `password_hash`, `created_at`, `updated_at`)
VALUES (
  'usr-demo-admin',
  'admin',
  'Admin HujanPantau',
  '$2a$10$w81o96z7P5c8z.tP1i8fve8K5h16L/V0kH65e4D976oK2zS47eWma',
  NOW(),
  NOW()
);

-- Data Default Perangkat Demo
INSERT IGNORE INTO `devices` (`id`, `user_id`, `name`, `broker_url`, `lokasi_adm4`, `ambang_pct`, `status`, `motor_position`, `motor_status`, `created_at`, `updated_at`)
VALUES (
  'hs-24e1796dc9a1',
  'usr-demo-admin',
  'Jemuran ESP32 Utama',
  'wss://43-133-136-149.sslip.io/ws',
  '31.71.03.1001',
  60,
  'offline',
  'extended',
  'idle',
  NOW(),
  NOW()
);
