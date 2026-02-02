-- Crear tabla para chats de WhatsApp
CREATE TABLE IF NOT EXISTS `whatsapp_chats` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `telefono` VARCHAR(20) NOT NULL,
  `estado` ENUM('nuevo', 'esperando_barbero', 'atendido') NOT NULL DEFAULT 'nuevo',
  `ultimo_mensaje` TEXT,
  `ultima_interaccion` DATETIME NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_telefono` (`telefono`),
  INDEX `idx_estado` (`estado`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
