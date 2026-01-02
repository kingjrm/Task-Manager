<?php
require_once __DIR__ . '/../config.php';

$db = Database::getInstance();
$method = $_SERVER['REQUEST_METHOD'];

try {
    if ($method === 'GET') {
        $userId = $_GET['user_id'] ?? 1;
        
        // Get overall progress
        $progress = $db->getResult(
            "SELECT 
                COUNT(CASE WHEN 1=1 THEN 1 END) as total_tasks,
                COUNT(CASE WHEN ts.name = 'Completed' THEN 1 END) as completed_tasks,
                COUNT(CASE WHEN ts.name = 'In Progress' THEN 1 END) as in_progress_tasks,
                COUNT(CASE WHEN ts.name = 'Pending' THEN 1 END) as pending_tasks,
                ROUND(COUNT(CASE WHEN ts.name = 'Completed' THEN 1 END) / COUNT(CASE WHEN 1=1 THEN 1 END) * 100, 2) as completion_percentage
            FROM tasks t
            LEFT JOIN task_statuses ts ON t.status_id = ts.id
            WHERE t.user_id = ?",
            [$userId]
        );
        
        // Get progress by category
        $categoryProgress = $db->getResults(
            "SELECT 
                c.id,
                c.name,
                c.color_hex,
                COUNT(t.id) as total,
                COUNT(CASE WHEN ts.name = 'Completed' THEN 1 END) as completed,
                ROUND(COUNT(CASE WHEN ts.name = 'Completed' THEN 1 END) / COUNT(t.id) * 100, 2) as percentage
            FROM categories c
            LEFT JOIN tasks t ON c.id = t.category_id AND t.user_id = ?
            LEFT JOIN task_statuses ts ON t.status_id = ts.id
            WHERE t.id IS NOT NULL
            GROUP BY c.id",
            [$userId]
        );
        
        ApiResponse::success([
            'overall' => $progress,
            'by_category' => $categoryProgress
        ], 'Progress retrieved successfully');
    } else {
        ApiResponse::error('Method not allowed', 405);
    }
} catch (Exception $e) {
    ApiResponse::error($e->getMessage(), 500);
}
