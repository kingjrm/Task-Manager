<?php
/**
 * Apply OJT Schema Updates
 * Run this file in browser to apply database schema changes
 * Access: http://localhost/OJTApp/apply-ojt-schema.php
 */

require_once __DIR__ . '/config.php';

$db = Database::getInstance();
$applied = [];
$errors = [];

try {
    // 1. Add OJT columns to tasks table
    $columnCheck = $db->getResult(
        "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
         WHERE TABLE_NAME = 'tasks' AND COLUMN_NAME = 'date_performed'"
    );
    
    if (!$columnCheck) {
        echo "<h3>Adding OJT columns to tasks table...</h3>";
        
        $db->execute(
            "ALTER TABLE `tasks` 
            ADD COLUMN `date_performed` date DEFAULT NULL AFTER `due_date`,
            ADD COLUMN `hours_rendered` decimal(5,2) DEFAULT NULL AFTER `actual_hours`,
            ADD COLUMN `department` varchar(255) DEFAULT NULL,
            ADD COLUMN `supervisor` varchar(255) DEFAULT NULL,
            ADD COLUMN `remarks` text DEFAULT NULL,
            ADD COLUMN `document_id` int(11) DEFAULT NULL"
        );
        
        $applied[] = "✓ Added OJT columns to tasks table";
        echo "<p style='color: green;'>" . end($applied) . "</p>";
    } else {
        echo "<p style='color: blue;'>ℹ OJT columns already exist in tasks table</p>";
    }
    
    // 2. Create ojt_progress table
    $tableCheck = $db->getResult(
        "SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES 
         WHERE TABLE_NAME = 'ojt_progress'"
    );
    
    if (!$tableCheck) {
        echo "<h3>Creating ojt_progress table...</h3>";
        
        $db->execute(
            "CREATE TABLE IF NOT EXISTS `ojt_progress` (
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
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci"
        );
        
        $applied[] = "✓ Created ojt_progress table";
        echo "<p style='color: green;'>" . end($applied) . "</p>";
    } else {
        echo "<p style='color: blue;'>ℹ ojt_progress table already exists</p>";
    }
    
    // 3. Create ojt_logs table
    $tableCheck = $db->getResult(
        "SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES 
         WHERE TABLE_NAME = 'ojt_logs'"
    );
    
    if (!$tableCheck) {
        echo "<h3>Creating ojt_logs table...</h3>";
        
        $db->execute(
            "CREATE TABLE IF NOT EXISTS `ojt_logs` (
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
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci"
        );
        
        $applied[] = "✓ Created ojt_logs table";
        echo "<p style='color: green;'>" . end($applied) . "</p>";
    } else {
        echo "<p style='color: blue;'>ℹ ojt_logs table already exists</p>";
    }
    
    echo "<h2 style='color: green; margin-top: 30px;'>✓ OJT Schema Update Complete!</h2>";
    echo "<p>All database tables have been successfully updated to support OJT tracking.</p>";
    echo "<p><a href='index.html' style='color: #0066cc;'>Return to Application</a></p>";
    
} catch (Exception $e) {
    echo "<h2 style='color: red;'>✗ Error applying schema updates</h2>";
    echo "<p>" . htmlspecialchars($e->getMessage()) . "</p>";
    echo "<p><a href='index.html' style='color: #0066cc;'>Return to Application</a></p>";
}
?>

<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>OJT Schema Update</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            max-width: 800px;
            margin: 40px auto;
            padding: 20px;
            background: #f5f5f5;
        }
        h2, h3 {
            color: #333;
        }
        p {
            line-height: 1.6;
            color: #666;
        }
    </style>
</head>
<body>
    <h1>OJT Schema Update Status</h1>
</body>
</html>
