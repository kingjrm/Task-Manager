<?php
/**
 * Database Importer Script
 * Run this file in browser to import the database schema
 * Visit: http://localhost/OJTApp/import-db.php
 */

// Set error reporting
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Load config
require_once __DIR__ . '/config.php';

$db = Database::getInstance();

echo "<h1>OJT App - Database Setup</h1>";
echo "<hr>";

// Read the SQL file
$sqlFile = __DIR__ . '/ojtapp.sql';

if (!file_exists($sqlFile)) {
    echo "<p style='color:red;'><strong>ERROR:</strong> ojtapp.sql file not found!</p>";
    exit;
}

$sqlContent = file_get_contents($sqlFile);
echo "<p>SQL file loaded: " . filesize($sqlFile) . " bytes</p>";

// Split into individual queries
$queries = array_filter(
    array_map('trim', explode(';', $sqlContent)),
    function($query) {
        return !empty($query) && strpos($query, '--') !== 0;
    }
);

echo "<p>Found " . count($queries) . " SQL statements to execute</p>";
echo "<hr>";

$successCount = 0;
$errorCount = 0;
$errors = [];

foreach ($queries as $index => $query) {
    // Skip comments and empty lines
    if (empty(trim($query)) || strpos(trim($query), '--') === 0) {
        continue;
    }

    // Remove SET commands (these are for MySQL configuration, not data)
    if (stripos($query, 'SET ') === 0 || stripos($query, '/*!') === 0) {
        continue;
    }

    try {
        if ($db->execute($query)) {
            $successCount++;
        }
    } catch (Exception $e) {
        $errorCount++;
        $errors[] = [
            'query' => substr($query, 0, 100) . '...',
            'error' => $e->getMessage()
        ];
    }
}

echo "<h2>Import Results</h2>";
echo "<p style='color:green;'><strong>✓ Success:</strong> $successCount queries executed</p>";

if ($errorCount > 0) {
    echo "<p style='color:orange;'><strong>⚠ Warnings/Errors:</strong> $errorCount</p>";
    foreach ($errors as $err) {
        echo "<p style='color:orange;'>";
        echo "<strong>Query:</strong> " . htmlspecialchars($err['query']) . "<br>";
        echo "<strong>Error:</strong> " . htmlspecialchars($err['error']);
        echo "</p>";
    }
}

echo "<hr>";

// Verify tables were created
echo "<h2>Database Tables</h2>";
$tables = $db->getResults("SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = ?", [getenv('DB_NAME')]);

if ($tables) {
    echo "<p style='color:green;'><strong>✓ Database verified!</strong> Tables created:</p>";
    echo "<ul>";
    foreach ($tables as $table) {
        echo "<li>" . $table['TABLE_NAME'] . "</li>";
    }
    echo "</ul>";
} else {
    echo "<p style='color:red;'><strong>✗ No tables found!</strong> Import may have failed.</p>";
}

echo "<hr>";

// Test API connectivity
echo "<h2>API Endpoints Status</h2>";
echo "<p>Test these endpoints in your browser:</p>";
echo "<ul>";
echo "<li><a href='api/tasks.php?action=list&user_id=1' target='_blank'>tasks.php?action=list&user_id=1</a></li>";
echo "<li><a href='api/categories.php' target='_blank'>categories.php</a></li>";
echo "<li><a href='api/priorities.php' target='_blank'>priorities.php</a></li>";
echo "</ul>";

echo "<hr>";

// Create test user
echo "<h2>Create Test User</h2>";
$testUserExists = $db->getResult("SELECT id FROM users WHERE id = 1");

if ($testUserExists) {
    echo "<p style='color:green;'>✓ Test user already exists (user_id: " . $testUserExists['id'] . ")</p>";
} else {
    try {
        $db->execute(
            "INSERT INTO users (id, username, email, password_hash, full_name, is_active) VALUES (1, ?, ?, ?, ?, 1)",
            ['testuser', 'test@example.com', hash('sha256', 'password123'), 'Test User']
        );
        
        echo "<p style='color:green;'>✓ Test user created (user_id: 1)</p>";
        echo "<p><strong>Login credentials:</strong><br>";
        echo "Username: testuser<br>";
        echo "Password: password123</p>";
    } catch (Exception $e) {
        echo "<p style='color:orange;'>Could not create test user: " . $e->getMessage() . "</p>";
    }
}

echo "<hr>";

// Summary
echo "<h2>Next Steps</h2>";
echo "<ol>";
echo "<li>Verify all tables are created above ✓</li>";
echo "<li><a href='http://localhost/OJTApp/'>Open the OJT App</a></li>";
echo "<li>Create a new task to test</li>";
echo "<li>Check if it appears in <a href='http://localhost/phpmyadmin' target='_blank'>phpMyAdmin</a></li>";
echo "<li>If tasks don't save, check browser console (F12) for API errors</li>";
echo "</ol>";

echo "<hr>";
echo "<p><strong>Database Setup Complete!</strong> You can now delete this file (import-db.php) as it's no longer needed.</p>";

?>
