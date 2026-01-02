<?php
require_once __DIR__ . '/../config.php';

$db = Database::getInstance();
$method = $_SERVER['REQUEST_METHOD'];

try {
    if ($method === 'GET') {
        $priorities = $db->getResults("SELECT * FROM priorities ORDER BY order_index ASC");
        ApiResponse::success($priorities, 'Priorities retrieved successfully');
    } else {
        ApiResponse::error('Method not allowed', 405);
    }
} catch (Exception $e) {
    ApiResponse::error($e->getMessage(), 500);
}
