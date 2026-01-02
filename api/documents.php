<?php
// Enable error reporting for debugging - log to file, not to output
error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once '../config.php';

// Get database connection
$db = Database::getInstance();
$conn = $db->getConnection();

$method = $_SERVER['REQUEST_METHOD'];

try {
    // Get all documents for a user
    if ($method === 'GET' && isset($_GET['user_id'])) {
        $userId = intval($_GET['user_id']);
        $category = isset($_GET['category']) ? $_GET['category'] : 'all';
        
        $sql = "SELECT * FROM documents WHERE user_id = ?";
        
        if ($category !== 'all') {
            $sql .= " AND category = ?";
            $stmt = $conn->prepare($sql);
            $stmt->bind_param("is", $userId, $category);
        } else {
            $stmt = $conn->prepare($sql);
            $stmt->bind_param("i", $userId);
        }
        
        $stmt->execute();
        $result = $stmt->get_result();
        $documents = $result->fetch_all(MYSQLI_ASSOC);
        
        echo json_encode([
            'success' => true,
            'data' => $documents
        ]);
        
    // Upload new document
    } elseif ($method === 'POST') {
        // Debug: Log incoming data
        error_log("POST data: " . print_r($_POST, true));
        error_log("FILES data: " . print_r($_FILES, true));
        
        if (!isset($_POST['user_id']) || !isset($_POST['name']) || !isset($_POST['category'])) {
            throw new Exception('Missing required fields: user_id, name, or category');
        }
        
        $userId = intval($_POST['user_id']);
        $name = $_POST['name'];
        $description = isset($_POST['description']) ? $_POST['description'] : '';
        $category = $_POST['category'];
        
        // Handle file upload
        if (!isset($_FILES['file'])) {
            throw new Exception('No file uploaded');
        }
        
        if ($_FILES['file']['error'] !== UPLOAD_ERR_OK) {
            $errorMessages = [
                UPLOAD_ERR_INI_SIZE => 'File exceeds upload_max_filesize in php.ini',
                UPLOAD_ERR_FORM_SIZE => 'File exceeds MAX_FILE_SIZE',
                UPLOAD_ERR_PARTIAL => 'File was only partially uploaded',
                UPLOAD_ERR_NO_FILE => 'No file was uploaded',
                UPLOAD_ERR_NO_TMP_DIR => 'Missing temporary folder',
                UPLOAD_ERR_CANT_WRITE => 'Failed to write file to disk',
                UPLOAD_ERR_EXTENSION => 'PHP extension stopped the upload'
            ];
            $errorMsg = isset($errorMessages[$_FILES['file']['error']]) ? 
                        $errorMessages[$_FILES['file']['error']] : 
                        'Unknown upload error: ' . $_FILES['file']['error'];
            throw new Exception($errorMsg);
        }
        
        $file = $_FILES['file'];
        $fileName = $file['name'];
        $fileSize = $file['size'];
        $fileTmpName = $file['tmp_name'];
        $fileType = $file['type'];
        
        // Get file extension
        $fileExtension = strtolower(pathinfo($fileName, PATHINFO_EXTENSION));
        
        // Allowed extensions
        $allowedExtensions = ['pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png', 'gif', 'txt', 'xlsx', 'xls', 'ppt', 'pptx'];
        
        if (!in_array($fileExtension, $allowedExtensions)) {
            throw new Exception('File type not allowed. Allowed types: ' . implode(', ', $allowedExtensions));
        }
        
        // Check file size (10MB max)
        if ($fileSize > 10 * 1024 * 1024) {
            throw new Exception('File size exceeds 10MB limit');
        }
        
        // Create uploads directory if it doesn't exist
        $uploadDir = __DIR__ . '/../uploads/documents/';
        error_log("Upload directory: " . $uploadDir);
        
        if (!file_exists($uploadDir)) {
            if (!mkdir($uploadDir, 0777, true)) {
                throw new Exception('Failed to create upload directory');
            }
        }
        
        if (!is_writable($uploadDir)) {
            throw new Exception('Upload directory is not writable');
        }
        
        // Generate unique filename
        $newFileName = uniqid() . '_' . time() . '.' . $fileExtension;
        $filePath = $uploadDir . $newFileName;
        $relativePath = 'uploads/documents/' . $newFileName;
        
        error_log("Attempting to move file to: " . $filePath);
        
        // Move uploaded file
        if (move_uploaded_file($fileTmpName, $filePath)) {
            error_log("File moved successfully");
            
            // Save to database
            $sql = "INSERT INTO documents (user_id, name, description, category, file_name, file_path, file_size, file_type, file_extension) 
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)";
            
            $stmt = $conn->prepare($sql);
            if (!$stmt) {
                throw new Exception('Database prepare error: ' . $conn->error);
            }
            
            $stmt->bind_param("isssssiis", $userId, $name, $description, $category, $fileName, $relativePath, $fileSize, $fileType, $fileExtension);
            
            if ($stmt->execute()) {
                $documentId = $conn->insert_id;
                error_log("Document saved to database with ID: " . $documentId);
                
                echo json_encode([
                    'success' => true,
                    'message' => 'Document uploaded successfully',
                    'data' => [
                        'id' => $documentId,
                        'name' => $name,
                        'file_name' => $fileName
                    ]
                ]);
            } else {
                // Delete uploaded file if database insert fails
                unlink($filePath);
                throw new Exception('Failed to save document to database: ' . $stmt->error);
            }
        } else {
            throw new Exception('Failed to move uploaded file from temp to destination');
        }
        
    // Delete document
    } elseif ($method === 'DELETE') {
        $documentId = isset($_GET['id']) ? intval($_GET['id']) : 0;
        
        // Get file path before deleting from database
        $sql = "SELECT file_path FROM documents WHERE id = ?";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("i", $documentId);
        $stmt->execute();
        $result = $stmt->get_result();
        $document = $result->fetch_assoc();
        
        if ($document) {
            // Delete from database
            $sql = "DELETE FROM documents WHERE id = ?";
            $stmt = $conn->prepare($sql);
            $stmt->bind_param("i", $documentId);
            
            if ($stmt->execute()) {
                // Delete physical file
                $fullPath = __DIR__ . '/../' . $document['file_path'];
                if (file_exists($fullPath)) {
                    unlink($fullPath);
                }
                
                echo json_encode([
                    'success' => true,
                    'message' => 'Document deleted successfully'
                ]);
            } else {
                throw new Exception('Failed to delete document');
            }
        } else {
            throw new Exception('Document not found');
        }
        
    } else {
        throw new Exception('Invalid request method');
    }
    
} catch (Exception $e) {
    http_response_code(400);
    error_log("Document upload error: " . $e->getMessage());
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage(),
        'debug' => [
            'method' => $_SERVER['REQUEST_METHOD'],
            'post_keys' => isset($_POST) ? array_keys($_POST) : [],
            'files_keys' => isset($_FILES) ? array_keys($_FILES) : []
        ]
    ]);
}

$conn->close();
?>
