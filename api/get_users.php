<?php
session_start();
header('Content-Type: application/json');

require_once '../config.php';

// Check if user is logged in and is admin
if (!isset($_SESSION['logged_in']) || !$_SESSION['logged_in']) {
    echo json_encode([
        'success' => false,
        'message' => 'Not authenticated'
    ]);
    exit;
}

if ($_SESSION['user_type'] !== 'admin') {
    echo json_encode([
        'success' => false,
        'message' => 'Access denied. Admin only.'
    ]);
    exit;
}

try {
    $db = Database::getInstance();
    $conn = $db->getConnection();
    
    // Get all users except the current admin
    $currentUserId = $_SESSION['user_id'];
    $stmt = $conn->prepare("
        SELECT 
            u.id,
            u.username,
            u.email,
            u.full_name,
            u.user_type,
            u.is_active,
            u.created_at,
            u.updated_at,
            COUNT(DISTINCT t.id) as total_tasks,
            SUM(CASE WHEN ts.name = 'Completed' THEN 1 ELSE 0 END) as completed_tasks
        FROM users u
        LEFT JOIN tasks t ON u.id = t.user_id
        LEFT JOIN task_statuses ts ON t.status_id = ts.id
        GROUP BY u.id
        ORDER BY u.created_at DESC
    ");
    
    $stmt->execute();
    $result = $stmt->get_result();
    
    $users = [];
    while ($row = $result->fetch_assoc()) {
        $users[] = $row;
    }
    
    echo json_encode([
        'success' => true,
        'users' => $users
    ]);
    
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Database error: ' . $e->getMessage()
    ]);
}
?>
