<?php
require_once 'config.php';

$db = Database::getInstance();
$conn = $db->getConnection();

echo "<!DOCTYPE html><html><head><title>Setup</title><style>body{font-family:Arial;padding:40px;background:#f5f5f5;max-width:800px;margin:0 auto;}h2{color:#333;}.success{color:green;}.error{color:red;}.info{color:blue;}.box{background:white;padding:20px;border-radius:8px;margin:20px 0;box-shadow:0 2px 8px rgba(0,0,0,0.1);}a{display:inline-block;padding:12px 24px;background:linear-gradient(135deg,#667eea,#764ba2);color:white;text-decoration:none;border-radius:8px;font-weight:600;margin-top:20px;}</style></head><body>";

echo "<h2>🔧 OJT Organizer - Database Setup</h2>";

try {
    // First, let's check if users table exists
    $result = $conn->query("SHOW TABLES LIKE 'users'");
    if ($result->num_rows == 0) {
        echo "<div class='box error'>❌ Error: Users table doesn't exist. Please import the ojtapp.sql file first.</div>";
        exit;
    }
    
    // Check current columns
    $result = $conn->query("DESCRIBE users");
    $columns = [];
    while ($row = $result->fetch_assoc()) {
        $columns[] = $row['Field'];
    }
    
    echo "<div class='box'><h3>Current users table columns:</h3><ul>";
    foreach ($columns as $col) {
        echo "<li>$col</li>";
    }
    echo "</ul></div>";
    
    // Add user_type if not exists
    if (!in_array('user_type', $columns)) {
        echo "<div class='box'>Adding user_type column...</div>";
        $conn->query("ALTER TABLE users ADD COLUMN user_type ENUM('admin', 'user') NOT NULL DEFAULT 'user' AFTER full_name");
        echo "<div class='box success'>✅ user_type column added</div>";
    } else {
        echo "<div class='box info'>✅ user_type column already exists</div>";
    }
    
    // Add remember_token if not exists
    if (!in_array('remember_token', $columns)) {
        echo "<div class='box'>Adding remember_token column...</div>";
        $conn->query("ALTER TABLE users ADD COLUMN remember_token VARCHAR(255) DEFAULT NULL AFTER password_hash");
        echo "<div class='box success'>✅ remember_token column added</div>";
    } else {
        echo "<div class='box info'>✅ remember_token column already exists</div>";
    }
    
    // Delete existing test users
    $conn->query("DELETE FROM users WHERE username IN ('admin', 'user')");
    echo "<div class='box'>Cleared existing test users...</div>";
    
    // Create admin user with known hash
    $adminPass = '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'; // This is bcrypt hash for "password"
    $sql = "INSERT INTO users (username, email, password_hash, full_name, user_type, is_active) 
            VALUES ('admin', 'admin@ojtorganizer.com', ?, 'Administrator', 'admin', 1)";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("s", $adminPass);
    if ($stmt->execute()) {
        echo "<div class='box success'>✅ Admin user created<br><strong>Username:</strong> admin<br><strong>Password:</strong> password</div>";
    } else {
        echo "<div class='box error'>❌ Failed to create admin: " . $stmt->error . "</div>";
    }
    
    // Create regular user
    $sql = "INSERT INTO users (username, email, password_hash, full_name, user_type, is_active) 
            VALUES ('user', 'user@ojtorganizer.com', ?, 'Regular User', 'user', 1)";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("s", $adminPass);
    if ($stmt->execute()) {
        echo "<div class='box success'>✅ Regular user created<br><strong>Username:</strong> user<br><strong>Password:</strong> password</div>";
    } else {
        echo "<div class='box error'>❌ Failed to create user: " . $stmt->error . "</div>";
    }
    
    // Verify users were created
    $result = $conn->query("SELECT id, username, email, user_type FROM users WHERE username IN ('admin', 'user')");
    echo "<div class='box'><h3>Created Users:</h3><table border='1' cellpadding='10' style='border-collapse:collapse;width:100%;'><tr><th>ID</th><th>Username</th><th>Email</th><th>Type</th></tr>";
    while ($row = $result->fetch_assoc()) {
        echo "<tr><td>{$row['id']}</td><td>{$row['username']}</td><td>{$row['email']}</td><td>{$row['user_type']}</td></tr>";
    }
    echo "</table></div>";
    
    echo "<div class='box success'>";
    echo "<h2>✅ Setup Complete!</h2>";
    echo "<h3>Login Credentials:</h3>";
    echo "<p><strong>Admin:</strong><br>Username: <code>admin</code><br>Password: <code>password</code></p>";
    echo "<p><strong>User:</strong><br>Username: <code>user</code><br>Password: <code>password</code></p>";
    echo "<a href='login.html'>Go to Login Page →</a>";
    echo "</div>";
    
} catch (Exception $e) {
    echo "<div class='box error'>❌ Error: " . $e->getMessage() . "</div>";
}

$conn->close();
echo "</body></html>";
?>
