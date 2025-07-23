<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT");
header("Access-Control-Allow-Headers: Content-Type");

// Database configuration
$host = "localhost";
$user = "pwgrupo6_alessandro";
$pass = "bombardeensaint";
$db = "pwgrupo6_restas";

// Connect to database
$conn = new mysqli($host, $user, $pass, $db);
if ($conn->connect_error) {
    http_response_code(500);
    die(json_encode([
        "error" => "Database connection failed",
        "message" => $conn->connect_error
    ]));
}

// Get request method and endpoint
$method = $_SERVER['REQUEST_METHOD'];
$endpoint = '';
if (isset($_SERVER['PATH_INFO'])) {
    $request = explode('/', trim($_SERVER['PATH_INFO'], '/'));
    $endpoint = array_shift($request);
}

// Function to generate random exercises
function generarEjercicios($conn, $usuario_id) {
    // Delete old exercises
    if (!$conn->query("DELETE FROM ejercicios WHERE usuario_id = $usuario_id")) {
        throw new Exception("Failed to delete old exercises");
    }
    
    // Generate 8 new exercises
    $ejercicios = [];
    for ($i = 0; $i < 8; $i++) {
        $a = rand(10000, 99999);
        $b = rand(10000, $a);
        $resultado = $a - $b;
        
        $stmt = $conn->prepare("INSERT INTO ejercicios (usuario_id, minuendo, sustraendo, resultado) VALUES (?, ?, ?, ?)");
        if (!$stmt) {
            throw new Exception("Prepare failed: " . $conn->error);
        }
        
        $stmt->bind_param("iiii", $usuario_id, $a, $b, $resultado);
        if (!$stmt->execute()) {
            throw new Exception("Execute failed: " . $stmt->error);
        }
        
        $ejercicios[] = [
            'id' => $stmt->insert_id,
            'minuendo' => $a,
            'sustraendo' => $b,
            'resultado' => $resultado,
            'usuario_id' => $usuario_id,
        ];
        $stmt->close();
    }
    return $ejercicios;
}

try {
    switch ($method) {
        case 'GET':
            if ($endpoint == 'ejercicios') {
                if (!isset($_GET['usuario_id'])) {
                    throw new Exception("usuario_id parameter is required");
                }
                $usuario_id = (int)$_GET['usuario_id'];
                
                $result = $conn->query("SELECT * FROM ejercicios WHERE usuario_id = $usuario_id");
                if (!$result) {
                    throw new Exception("Query failed: " . $conn->error);
                }
                
                if ($result->num_rows == 0) {
                    $ejercicios = generarEjercicios($conn, $usuario_id);
                    echo json_encode($ejercicios);
                } else {
                    $ejercicios = [];
                    while ($row = $result->fetch_assoc()) {
                        $completado = $conn->query("SELECT completado FROM usuarios_progreso 
                                                   WHERE usuario_id = $usuario_id AND ejercicio_id = {$row['id']}")->fetch_assoc();
                        
                        $ejercicios[] = [
                            'id' => $row['id'],
                            'minuendo' => $row['minuendo'],
                            'sustraendo' => $row['sustraendo'],
                            'resultado' => $row['resultado'],
                            'completado' => $completado ? (bool)$completado['completado'] : false
                        ];
                    }
                    echo json_encode($ejercicios);
                }
            }
            break;

        case 'POST':
            if ($endpoint == 'reiniciar-ejercicios') {
                $data = json_decode(file_get_contents('php://input'), true);
                if (!isset($data['usuario_id'])) {
                    throw new Exception("usuario_id is required");
                }
                $usuario_id = (int)$data['usuario_id'];
                
                $ejercicios = generarEjercicios($conn, $usuario_id);
                if (!$conn->query("DELETE FROM usuarios_progreso WHERE usuario_id = $usuario_id")) {
                    throw new Exception("Failed to delete progress");
                }
                
                echo json_encode([
                    "success" => true,
                    "message" => "Ejercicios reiniciados",
                    "data" => $ejercicios
                ]);
            }
            break;

        case 'PUT':
            if ($endpoint == 'actualizar-progreso') {
                $data = json_decode(file_get_contents('php://input'), true);
                if (!isset($data['usuario_id']) || !isset($data['ejercicio_id'])) {
                    throw new Exception("usuario_id and ejercicio_id are required");
                }
                
                $stmt = $conn->prepare("INSERT INTO usuarios_progreso (usuario_id, ejercicio_id, completado) 
                                       VALUES (?, ?, TRUE) 
                                       ON DUPLICATE KEY UPDATE completado = TRUE");
                if (!$stmt) {
                    throw new Exception("Prepare failed: " . $conn->error);
                }
                
                $stmt->bind_param("ii", $data['usuario_id'], $data['ejercicio_id']);
                if (!$stmt->execute()) {
                    throw new Exception("Execute failed: " . $stmt->error);
                }
                
                echo json_encode(["success" => true, "message" => "Progreso actualizado"]);
                $stmt->close();
            }
            break;

        default:
            http_response_code(405);
            echo json_encode(["error" => "Method not allowed"]);
            break;
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        "error" => "Server error",
        "message" => $e->getMessage(),
        "trace" => $e->getTraceAsString()
    ]);
}

$conn->close();
?>