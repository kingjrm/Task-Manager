-- Add user_type column to users table
ALTER TABLE `users` 
ADD COLUMN `user_type` ENUM('admin', 'user') NOT NULL DEFAULT 'user' AFTER `full_name`,
ADD COLUMN `remember_token` VARCHAR(255) DEFAULT NULL AFTER `password_hash`;

-- Add documents table for file uploads
CREATE TABLE IF NOT EXISTS `documents` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `category` enum('resume','certificates','images','reports','others') NOT NULL DEFAULT 'others',
  `file_name` varchar(255) NOT NULL,
  `file_path` varchar(500) NOT NULL,
  `file_size` int(11) DEFAULT NULL,
  `file_type` varchar(100) DEFAULT NULL,
  `file_extension` varchar(10) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_category` (`category`),
  KEY `idx_created_at` (`created_at`),
  CONSTRAINT `documents_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Create default admin user (password: admin123)
-- Password hash for 'admin123' using PASSWORD_DEFAULT
INSERT INTO `users` (`username`, `email`, `password_hash`, `full_name`, `user_type`, `is_active`) 
VALUES ('admin', 'admin@ojtorganizer.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Administrator', 'admin', 1)
ON DUPLICATE KEY UPDATE username=username;

-- Create sample regular user (password: user123)
INSERT INTO `users` (`username`, `email`, `password_hash`, `full_name`, `user_type`, `is_active`) 
VALUES ('user', 'user@ojtorganizer.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Regular User', 'user', 1)
ON DUPLICATE KEY UPDATE username=username;
