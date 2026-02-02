-- Crear tabla para clientes de WhatsApp
CREATE TABLE IF NOT EXISTS `whatsapp_clientes` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `telefono` VARCHAR(20) NOT NULL UNIQUE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_telefono` (`telefono`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
