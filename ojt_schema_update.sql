-- OJT Task Management Schema Updates
-- Add OJT-specific columns to tasks table

ALTER TABLE `tasks` 
ADD COLUMN `date_performed` date DEFAULT NULL AFTER `due_date`,
ADD COLUMN `hours_rendered` decimal(5,2) DEFAULT NULL AFTER `actual_hours`,
ADD COLUMN `department` varchar(255) DEFAULT NULL AFTER `assigned_to`,
ADD COLUMN `supervisor` varchar(255) DEFAULT NULL AFTER `department`,
ADD COLUMN `remarks` text DEFAULT NULL AFTER `supervisor`,
ADD COLUMN `document_id` int(11) DEFAULT NULL AFTER `remarks`;

-- Add foreign key for document
ALTER TABLE `tasks`
ADD CONSTRAINT `tasks_ibfk_5` FOREIGN KEY (`document_id`) REFERENCES `documents` (`id`) ON DELETE SET NULL;

-- Create OJT Progress table for tracking OJT-specific metrics
CREATE TABLE IF NOT EXISTS `ojt_progress` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `task_id` int(11) NOT NULL,
  `total_hours_required` decimal(8,2) DEFAULT 480.00,
  `total_hours_completed` decimal(8,2) DEFAULT 0.00,
  `completion_percentage` decimal(5,2) DEFAULT 0.00,
  `ojt_status` enum('Not Started','In Progress','Completed','On Hold') DEFAULT 'Not Started',
  `start_date` date DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_task_id` (`task_id`),
  CONSTRAINT `ojt_progress_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `ojt_progress_ibfk_2` FOREIGN KEY (`task_id`) REFERENCES `tasks` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Create OJT Logs table for detailed activity tracking
CREATE TABLE IF NOT EXISTS `ojt_logs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `task_id` int(11) DEFAULT NULL,
  `activity_name` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `category` varchar(100) DEFAULT NULL,
  `date_performed` date NOT NULL,
  `hours_rendered` decimal(5,2) NOT NULL,
  `status` enum('Draft','Submitted','Approved','Rejected') DEFAULT 'Draft',
  `department` varchar(255) DEFAULT NULL,
  `supervisor` varchar(255) DEFAULT NULL,
  `remarks` text DEFAULT NULL,
  `document_file` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_task_id` (`task_id`),
  KEY `idx_date_performed` (`date_performed`),
  CONSTRAINT `ojt_logs_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `ojt_logs_ibfk_2` FOREIGN KEY (`task_id`) REFERENCES `tasks` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
