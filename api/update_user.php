<?php
session_start();
header('Content-Type: application/json');

require_once '../config.php';

// Check if user is logged in
if (!isset($_SESSION['logged_in']) || !$_SESSION['logged_in']) {
    echo json_encode([
        'success' => false,
        'message' => 'Not authenticated'
    ]);
    exit;
}

// Get JSON input
$input = json_decode(file_get_contents('php://input'), true);

if (!isset($input['userId'])) {
    echo json_encode([
        'success' => false,
        'message' => 'User ID is required'
    ]);
    exit;
}

$userId = intval($input['userId']);
$currentUserId = $_SESSION['user_id'];
$isAdmin = $_SESSION['user_type'] === 'admin';

// Users can only edit their own profile unless they're admin
if (!$isAdmin && $userId !== $currentUserId) {
    echo json_encode([
        'success' => false,
        'message' => 'Access denied'
    ]);
    exit;
}

try {
    $db = Database::getInstance();
    $conn = $db->getConnection();
    
    // Build update query dynamically based on provided fields
    $updates = [];
    $params = [];
    $types = '';
    
    if (isset($input['fullName'])) {
        $updates[] = "full_name = ?";
        $params[] = trim($input['fullName']);
        $types .= 's';
    }
    
    if (isset($input['email'])) {
        // Check if email already exists for another user
        $stmt = $conn->prepare("SELECT id FROM users WHERE email = ? AND id != ?");
        $stmt->bind_param("si", $input['email'], $userId);
        $stmt->execute();
        $result = $stmt->get_result();
        
        if ($result->num_rows > 0) {
            echo json_encode([
                'success' => false,
                'message' => 'Email already exists'
            ]);
            exit;
        }
        
        $updates[] = "email = ?";
        $params[] = trim($input['email']);
        $types .= 's';
    }
    
    if (isset($input['username'])) {
        // Check if username already exists for another user
        $stmt = $conn->prepare("SELECT id FROM users WHERE username = ? AND id != ?");
        $stmt->bind_param("si", $input['username'], $userId);
        $stmt->execute();
        $result = $stmt->get_result();
        
        if ($result->num_rows > 0) {
            echo json_encode([
                'success' => false,
                'message' => 'Username already exists'
            ]);
            exit;
        }
        
        $updates[] = "username = ?";
        $params[] = trim($input['username']);
        $types .= 's';
    }
    
    // Only admin can change user type and active status
    if ($isAdmin) {
        if (isset($input['userType'])) {
            $updates[] = "user_type = ?";
            $params[] = $input['userType'];
            $types .= 's';
        }
        
        if (isset($input['isActive'])) {
            $updates[] = "is_active = ?";
            $params[] = $input['isActive'] ? 1 : 0;
            $types .= 'i';
        }
    }
    
    // Handle password change
    if (isset($input['password']) && !empty($input['password'])) {
        if (strlen($input['password']) < 6) {
            echo json_encode([
                'success' => false,
                'message' => 'Password must be at least 6 characters long'
            ]);
            exit;
        }
        
        $updates[] = "password_hash = ?";
        $params[] = password_hash($input['password'], PASSWORD_DEFAULT);
        $types .= 's';
    }
    
    if (empty($updates)) {
        echo json_encode([
            'success' => false,
            'message' => 'No fields to update'
        ]);
        exit;
    }
    
    // Add userId to params
    $params[] = $userId;
    $types .= 'i';
    
    // Build and execute update query
    $sql = "UPDATE users SET " . implode(', ', $updates) . " WHERE id = ?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param($types, ...$params);
    
    if ($stmt->execute()) {
        // Get updated user data
        $stmt = $conn->prepare("SELECT id, username, email, full_name, user_type, is_active FROM users WHERE id = ?");
        $stmt->bind_param("i", $userId);
        $stmt->execute();
        $result = $stmt->get_result();
        $user = $result->fetch_assoc();
        
        // Update session if user updated their own profile
        if ($userId === $currentUserId) {
            $_SESSION['username'] = $user['username'];
            $_SESSION['email'] = $user['email'];
            $_SESSION['full_name'] = $user['full_name'];
        }
        
        // Log the activity
        $stmt = $conn->prepare("INSERT INTO activity_logs (user_id, action_type, description) VALUES (?, 'profile_update', ?)");
        $description = "Profile updated for user: " . $user['username'];
        $stmt->bind_param("is", $currentUserId, $description);
        $stmt->execute();
        
        echo json_encode([
            'success' => true,
            'message' => 'User updated successfully',
            'user' => $user
        ]);
    } else {
        echo json_encode([
            'success' => false,
            'message' => 'Failed to update user'
        ]);
    }
    
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Database error: ' . $e->getMessage()
    ]);
}
?>
