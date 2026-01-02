<?php
require_once __DIR__ . '/../config.php';

$db = Database::getInstance();
$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

try {
    if ($method === 'GET') {
        if ($action === 'list') {
            $userId = $_GET['user_id'] ?? 1;
            $status = $_GET['status'] ?? null;
            $category = $_GET['category'] ?? null;
            
            $sql = "SELECT t.*, c.name as category_name, p.level as priority_name, ts.name as status_name
                    FROM tasks t
                    LEFT JOIN categories c ON t.category_id = c.id
                    LEFT JOIN priorities p ON t.priority_id = p.id
                    LEFT JOIN task_statuses ts ON t.status_id = ts.id
                    WHERE t.user_id = ?";
            $params = [$userId];
            
            if ($status) {
                $sql .= " AND ts.name = ?";
                $params[] = $status;
            }
            
            if ($category) {
                $sql .= " AND c.id = ?";
                $params[] = $category;
            }
            
            $sql .= " ORDER BY t.due_date ASC, t.priority_id ASC";
            
            $tasks = $db->getResults($sql, $params);
            ApiResponse::success($tasks, 'Tasks retrieved successfully');
        } else if ($action === 'get') {
            $taskId = $_GET['id'] ?? null;
            if (!$taskId) {
                ApiResponse::error('Task ID required', 400);
            }
            
            $task = $db->getResult(
                "SELECT t.*, c.name as category_name, p.level as priority_name, ts.name as status_name
                 FROM tasks t
                 LEFT JOIN categories c ON t.category_id = c.id
                 LEFT JOIN priorities p ON t.priority_id = p.id
                 LEFT JOIN task_statuses ts ON t.status_id = ts.id
                 WHERE t.id = ?",
                [$taskId]
            );
            
            if (!$task) {
                ApiResponse::error('Task not found', 404);
            }
            
            ApiResponse::success($task, 'Task retrieved successfully');
        }
    } else if ($method === 'POST') {
        $data = json_decode(file_get_contents('php://input'), true);
        
        if (!isset($data['user_id']) || !isset($data['title'])) {
            ApiResponse::error('User ID and Title are required', 400);
        }
        
        $userId = $data['user_id'];
        $title = trim($data['title']);
        $description = isset($data['description']) ? trim($data['description']) : null;
        $categoryId = $data['category_id'] ?? null;
        $priorityId = $data['priority_id'] ?? null;
        $statusId = $data['status_id'] ?? 1;
        $dueDate = $data['due_date'] ?? null;
        $estimatedHours = $data['estimated_hours'] ?? null;
        
        // Log the incoming request
        error_log("[TASK CREATE] User: $userId, Title: $title, Category: $categoryId, Priority: $priorityId");
        
        // Execute the insert
        $insertResult = $db->execute(
            "INSERT INTO tasks (user_id, title, description, category_id, priority_id, status_id, due_date, estimated_hours, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())",
            [$userId, $title, $description, $categoryId, $priorityId, $statusId, $dueDate, $estimatedHours]
        );
        
        if (!$insertResult) {
            error_log("[TASK CREATE FAILED] Insert returned false");
            ApiResponse::error('Failed to create task', 500);
        }
        
        $taskId = $db->lastInsertId();
        error_log("[TASK CREATE SUCCESS] New Task ID: $taskId");
        
        // Log activity
        $db->execute(
            "INSERT INTO activity_logs (user_id, task_id, action_type, description, created_at)
             VALUES (?, ?, ?, ?, NOW())",
            [$userId, $taskId, 'task_created', 'Task created: ' . $title]
        );
        
        ApiResponse::success(['id' => $taskId], 'Task created successfully', 201);
    } else if ($method === 'PUT') {
        $data = json_decode(file_get_contents('php://input'), true);
        $taskId = $_GET['id'] ?? null;
        
        if (!$taskId) {
            ApiResponse::error('Task ID required', 400);
        }
        
        $updates = [];
        $params = [];
        $allowedFields = ['title', 'description', 'category_id', 'priority_id', 'status_id', 'due_date', 'estimated_hours', 'actual_hours', 'completion_percentage'];
        
        foreach ($allowedFields as $field) {
            if (isset($data[$field])) {
                $updates[] = "$field = ?";
                $params[] = $data[$field];
            }
        }
        
        if (empty($updates)) {
            ApiResponse::error('No fields to update', 400);
        }
        
        $updates[] = "updated_at = NOW()";
        $params[] = $taskId;
        
        $sql = "UPDATE tasks SET " . implode(', ', $updates) . " WHERE id = ?";
        $db->execute($sql, $params);
        
        // Log activity
        if (isset($data['user_id'])) {
            $db->execute(
                "INSERT INTO activity_logs (user_id, task_id, action_type, description)
                 VALUES (?, ?, ?, ?)",
                [$data['user_id'], $taskId, 'task_updated', 'Task updated']
            );
        }
        
        ApiResponse::success(null, 'Task updated successfully');
    } else if ($method === 'DELETE') {
        $taskId = $_GET['id'] ?? null;
        
        if (!$taskId) {
            ApiResponse::error('Task ID required', 400);
        }
        
        error_log("[TASK DELETE] Deleting task ID: $taskId");
        
        // Get task info before deletion
        $task = $db->getResult("SELECT user_id FROM tasks WHERE id = ?", [$taskId]);
        
        if (!$task) {
            error_log("[TASK DELETE] Task not found: $taskId");
            ApiResponse::error('Task not found', 404);
        }
        
        // Log activity BEFORE deleting task (to avoid foreign key issues)
        try {
            $db->execute(
                "INSERT INTO activity_logs (user_id, task_id, action_type, description, created_at)
                 VALUES (?, ?, ?, ?, NOW())",
                [$task['user_id'], $taskId, 'task_deleted', 'Task deleted']
            );
        } catch (Exception $logError) {
            // Continue even if logging fails
            error_log("Activity log error: " . $logError->getMessage());
        }
        
        // Now delete the task
        $deleteResult = $db->execute("DELETE FROM tasks WHERE id = ?", [$taskId]);
        
        if ($deleteResult) {
            error_log("[TASK DELETE SUCCESS] Task $taskId deleted");
            ApiResponse::success(null, 'Task deleted successfully');
        } else {
            error_log("[TASK DELETE FAILED] Delete query failed for task $taskId");
            ApiResponse::error('Failed to delete task', 500);
        }
    } else {
        ApiResponse::error('Method not allowed', 405);
    }
} catch (Exception $e) {
    error_log("[API ERROR] " . $e->getMessage());
    ApiResponse::error($e->getMessage(), 500);
}
