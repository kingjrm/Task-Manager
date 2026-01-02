<?php
require_once __DIR__ . '/../config.php';

$db = Database::getInstance();
$method = $_SERVER['REQUEST_METHOD'];

try {
    if ($method === 'GET') {
        $categories = $db->getResults("SELECT * FROM categories ORDER BY name ASC");
        ApiResponse::success($categories, 'Categories retrieved successfully');
    } else {
        ApiResponse::error('Method not allowed', 405);
    }
} catch (Exception $e) {
    ApiResponse::error($e->getMessage(), 500);
}
