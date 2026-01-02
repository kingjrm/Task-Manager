<?php
require_once __DIR__ . '/../config.php';

$db = Database::getInstance();
$method = $_SERVER['REQUEST_METHOD'];

try {
    if ($method === 'GET') {
        $userId = $_GET['user_id'] ?? 1;
        $limit = $_GET['limit'] ?? 50;
        
        $activities = $db->getResults(
            "SELECT 
                a.*,
                t.title as task_title,
                u.username
            FROM activity_logs a
            LEFT JOIN tasks t ON a.task_id = t.id
            LEFT JOIN users u ON a.user_id = u.id
            WHERE a.user_id = ?
            ORDER BY a.created_at DESC
            LIMIT ?",
            [$userId, $limit]
        );
        
        ApiResponse::success($activities, 'Activities retrieved successfully');
    } else if ($method === 'POST') {
        $data = json_decode(file_get_contents('php://input'), true);
        
        $userId = $data['user_id'] ?? null;
        $taskId = $data['task_id'] ?? null;
        $actionType = $data['action_type'] ?? null;
        $description = $data['description'] ?? null;
        
        if (!$userId || !$actionType) {
            ApiResponse::error('User ID and Action Type are required', 400);
        }
        
        $db->execute(
            "INSERT INTO activity_logs (user_id, task_id, action_type, description)
             VALUES (?, ?, ?, ?)",
            [$userId, $taskId, $actionType, $description]
        );
        
        ApiResponse::success(null, 'Activity logged successfully', 201);
    } else {
        ApiResponse::error('Method not allowed', 405);
    }
} catch (Exception $e) {
    ApiResponse::error($e->getMessage(), 500);
}
