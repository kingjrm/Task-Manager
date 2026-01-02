<?php
/**
 * Setup API - Initialize database and ensure test user exists
 * Prevents foreign key constraint errors
 */

require_once __DIR__ . '/../config.php';

header('Content-Type: application/json');

try {
    $db = Database::getInstance();
    
    // Ensure test user exists
    $testUser = $db->getResult("SELECT id FROM users WHERE id = 1");
    
    if (!$testUser) {
        // Create test user if it doesn't exist
        $db->execute(
            "INSERT INTO users (id, username, email, password_hash, full_name, is_active) 
             VALUES (1, ?, ?, ?, ?, 1)",
            [
                'testuser',
                'test@example.com',
                hash('sha256', 'password123'),
                'Test User'
            ]
        );
        
        echo json_encode([
            'success' => true,
            'message' => 'Test user created successfully',
            'user_id' => 1
        ]);
    } else {
        echo json_encode([
            'success' => true,
            'message' => 'Test user already exists',
            'user_id' => 1
        ]);
    }
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Setup error: ' . $e->getMessage()
    ]);
}
?>
