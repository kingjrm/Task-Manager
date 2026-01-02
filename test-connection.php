<?php
/**
 * Connection Test - Verify database and API connectivity
 * Visit: http://localhost/OJTApp/test-connection.php
 */

error_reporting(E_ALL);
ini_set('display_errors', 1);

?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>OJT App - Connection Test</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: #f3f4f6;
            padding: 20px;
        }
        .container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            border-radius: 8px;
            padding: 30px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        h1 {
            color: #1f2937;
            margin-bottom: 10px;
        }
        .subtitle {
            color: #6b7280;
            margin-bottom: 30px;
        }
        .test-section {
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 1px solid #e5e7eb;
        }
        .test-section:last-child {
            border-bottom: none;
        }
        .test-title {
            font-size: 18px;
            font-weight: 600;
            color: #374151;
            margin-bottom: 15px;
        }
        .test-item {
            display: flex;
            align-items: center;
            padding: 10px 0;
            gap: 15px;
        }
        .status-icon {
            width: 30px;
            height: 30px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            color: white;
            flex-shrink: 0;
        }
        .status-success {
            background: #10b981;
        }
        .status-error {
            background: #ef4444;
        }
        .status-warning {
            background: #f59e0b;
        }
        .test-details {
            flex: 1;
        }
        .test-label {
            font-weight: 600;
            color: #1f2937;
        }
        .test-message {
            font-size: 14px;
            color: #6b7280;
            margin-top: 5px;
        }
        .test-message.error {
            color: #ef4444;
        }
        .test-message.warning {
            color: #d97706;
        }
        .test-message.success {
            color: #10b981;
        }
        .button-group {
            margin-top: 30px;
            display: flex;
            gap: 10px;
        }
        a.button {
            padding: 10px 20px;
            border-radius: 6px;
            text-decoration: none;
            font-weight: 600;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            transition: all 0.3s;
        }
        .button-primary {
            background: #1f2937;
            color: white;
        }
        .button-primary:hover {
            background: #111827;
        }
        .button-success {
            background: #10b981;
            color: white;
        }
        .button-success:hover {
            background: #059669;
        }
        .code {
            background: #f3f4f6;
            padding: 5px 10px;
            border-radius: 4px;
            font-family: 'Courier New', monospace;
            font-size: 13px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🔍 OJT App - Connection Test</h1>
        <p class="subtitle">Verify that all systems are properly connected</p>

        <?php
        require_once __DIR__ . '/config.php';

        // Test 1: Database Connection
        echo '<div class="test-section">';
        echo '<div class="test-title">Database Connection</div>';
        
        try {
            $db = Database::getInstance();
            $testQuery = $db->getResult("SELECT 1 as test");
            if ($testQuery) {
                echo '<div class="test-item">';
                echo '<div class="status-icon status-success">✓</div>';
                echo '<div class="test-details">';
                echo '<div class="test-label">Database Connected</div>';
                echo '<div class="test-message success">Successfully connected to ' . getenv('DB_NAME') . ' database</div>';
                echo '</div></div>';
            }
        } catch (Exception $e) {
            echo '<div class="test-item">';
            echo '<div class="status-icon status-error">✕</div>';
            echo '<div class="test-details">';
            echo '<div class="test-label">Database Connection Failed</div>';
            echo '<div class="test-message error">' . htmlspecialchars($e->getMessage()) . '</div>';
            echo '</div></div>';
        }

        // Test 2: Database Tables
        echo '<div class="test-section">';
        echo '<div class="test-title">Database Tables</div>';
        
        try {
            $tables = $db->getResults(
                "SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = ?",
                [getenv('DB_NAME')]
            );
            
            if ($tables && count($tables) > 0) {
                echo '<div class="test-item">';
                echo '<div class="status-icon status-success">✓</div>';
                echo '<div class="test-details">';
                echo '<div class="test-label">Tables Found</div>';
                echo '<div class="test-message success">Found ' . count($tables) . ' tables</div>';
                echo '<div style="margin-top: 10px; padding: 10px; background: #f3f4f6; border-radius: 4px; font-size: 12px; max-height: 150px; overflow-y: auto;">';
                foreach ($tables as $t) {
                    echo htmlspecialchars($t['TABLE_NAME']) . '<br>';
                }
                echo '</div>';
                echo '</div></div>';
            } else {
                echo '<div class="test-item">';
                echo '<div class="status-icon status-warning">!</div>';
                echo '<div class="test-details">';
                echo '<div class="test-label">No Tables Found</div>';
                echo '<div class="test-message warning">Database exists but has no tables. Run import-db.php to create schema.</div>';
                echo '</div></div>';
            }
        } catch (Exception $e) {
            echo '<div class="test-item">';
            echo '<div class="status-icon status-error">✕</div>';
            echo '<div class="test-details">';
            echo '<div class="test-label">Table Check Failed</div>';
            echo '<div class="test-message error">' . htmlspecialchars($e->getMessage()) . '</div>';
            echo '</div></div>';
        }

        // Test 3: Users Table
        echo '<div class="test-section">';
        echo '<div class="test-title">Users</div>';
        
        try {
            $users = $db->getResults("SELECT id, username, email FROM users LIMIT 5");
            
            if ($users && count($users) > 0) {
                echo '<div class="test-item">';
                echo '<div class="status-icon status-success">✓</div>';
                echo '<div class="test-details">';
                echo '<div class="test-label">Users Found</div>';
                echo '<div class="test-message success">Found ' . count($users) . ' user(s)</div>';
                foreach ($users as $user) {
                    echo '<div style="margin-top: 8px; padding: 8px; background: #f3f4f6; border-radius: 4px; font-size: 12px;">';
                    echo 'ID: ' . $user['id'] . ' | ' . htmlspecialchars($user['username']) . ' (' . htmlspecialchars($user['email']) . ')';
                    echo '</div>';
                }
                echo '</div></div>';
            } else {
                echo '<div class="test-item">';
                echo '<div class="status-icon status-warning">!</div>';
                echo '<div class="test-details">';
                echo '<div class="test-label">No Users Found</div>';
                echo '<div class="test-message warning">Create a test user by running import-db.php</div>';
                echo '</div></div>';
            }
        } catch (Exception $e) {
            echo '<div class="test-item">';
            echo '<div class="status-icon status-error">✕</div>';
            echo '<div class="test-details">';
            echo '<div class="test-label">Users Query Failed</div>';
            echo '<div class="test-message error">' . htmlspecialchars($e->getMessage()) . '</div>';
            echo '</div></div>';
        }

        // Test 4: Tasks
        echo '<div class="test-section">';
        echo '<div class="test-title">Tasks</div>';
        
        try {
            $tasks = $db->getResults("SELECT COUNT(*) as count FROM tasks");
            $taskCount = $tasks[0]['count'] ?? 0;
            
            if ($taskCount >= 0) {
                echo '<div class="test-item">';
                echo '<div class="status-icon status-success">✓</div>';
                echo '<div class="test-details">';
                echo '<div class="test-label">Tasks Table Ready</div>';
                echo '<div class="test-message success">Table contains ' . $taskCount . ' task(s)</div>';
                echo '</div></div>';
            }
        } catch (Exception $e) {
            echo '<div class="test-item">';
            echo '<div class="status-icon status-error">✕</div>';
            echo '<div class="test-details">';
            echo '<div class="test-label">Tasks Query Failed</div>';
            echo '<div class="test-message error">' . htmlspecialchars($e->getMessage()) . '</div>';
            echo '</div></div>';
        }

        // Test 5: Categories
        echo '<div class="test-section">';
        echo '<div class="test-title">Categories</div>';
        
        try {
            $categories = $db->getResults("SELECT COUNT(*) as count FROM categories");
            $categoryCount = $categories[0]['count'] ?? 0;
            
            echo '<div class="test-item">';
            echo '<div class="status-icon status-success">✓</div>';
            echo '<div class="test-details">';
            echo '<div class="test-label">Categories Available</div>';
            echo '<div class="test-message success">Found ' . $categoryCount . ' categor' . ($categoryCount === 1 ? 'y' : 'ies') . '</div>';
            echo '</div></div>';
        } catch (Exception $e) {
            echo '<div class="test-item">';
            echo '<div class="status-icon status-error">✕</div>';
            echo '<div class="test-details">';
            echo '<div class="test-label">Categories Query Failed</div>';
            echo '<div class="test-message error">' . htmlspecialchars($e->getMessage()) . '</div>';
            echo '</div></div>';
        }

        // Test 6: Priorities
        echo '<div class="test-section">';
        echo '<div class="test-title">Priorities</div>';
        
        try {
            $priorities = $db->getResults("SELECT COUNT(*) as count FROM priorities");
            $priorityCount = $priorities[0]['count'] ?? 0;
            
            echo '<div class="test-item">';
            echo '<div class="status-icon status-success">✓</div>';
            echo '<div class="test-details">';
            echo '<div class="test-label">Priorities Available</div>';
            echo '<div class="test-message success">Found ' . $priorityCount . ' priorit' . ($priorityCount === 1 ? 'y' : 'ies') . '</div>';
            echo '</div></div>';
        } catch (Exception $e) {
            echo '<div class="test-item">';
            echo '<div class="status-icon status-error">✕</div>';
            echo '<div class="test-details">';
            echo '<div class="test-label">Priorities Query Failed</div>';
            echo '<div class="test-message error">' . htmlspecialchars($e->getMessage()) . '</div>';
            echo '</div></div>';
        }

        // Test 7: Activity Logs
        echo '<div class="test-section">';
        echo '<div class="test-title">Activity Logs</div>';
        
        try {
            $logs = $db->getResults("SELECT COUNT(*) as count FROM activity_logs");
            $logCount = $logs[0]['count'] ?? 0;
            
            echo '<div class="test-item">';
            echo '<div class="status-icon status-success">✓</div>';
            echo '<div class="test-details">';
            echo '<div class="test-label">Activity Logs Ready</div>';
            echo '<div class="test-message success">Found ' . $logCount . ' activit' . ($logCount === 1 ? 'y' : 'ies') . '</div>';
            echo '</div></div>';
        } catch (Exception $e) {
            echo '<div class="test-item">';
            echo '<div class="status-icon status-error">✕</div>';
            echo '<div class="test-details">';
            echo '<div class="test-label">Activity Logs Query Failed</div>';
            echo '<div class="test-message error">' . htmlspecialchars($e->getMessage()) . '</div>';
            echo '</div></div>';
        }

        echo '</div>'; // Close last section
        ?>

        <div class="button-group">
            <a href="http://localhost/OJTApp/" class="button button-success">← Go to App</a>
            <a href="import-db.php" class="button button-primary">📦 Import Database</a>
        </div>
    </div>
</body>
</html>
