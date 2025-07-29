<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

header("Content-Type: application/json");
header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Methods: POST, GET, PUT, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Max-Age: 3600");

// Database configuration
$host = "localhost";
$user = "pwgrupo6_alessandro";
$pass = "bombardeensaint*";
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

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Get request method and endpoint
$method = $_SERVER['REQUEST_METHOD'];
$endpoint = '';
if (isset($_SERVER['PATH_INFO'])) {
    $request = explode('/', trim($_SERVER['PATH_INFO'], '/'));
    $endpoint = array_shift($request);
}

function generarEjercicios($conn, $usuario_id, $pagina) {
    // First delete progress records for exercises on this page
    $deleteProgressQuery = "DELETE up FROM usuarios_progreso up
                          INNER JOIN ejercicios e ON up.ejercicio_id = e.id
                          WHERE e.usuario_id = ? AND e.pagina = ?";
    
    $stmt = $conn->prepare($deleteProgressQuery);
    if (!$stmt) {
        throw new Exception("Prepare failed (delete progress): " . $conn->error);
    }
    $stmt->bind_param("ii", $usuario_id, $pagina);
    if (!$stmt->execute()) {
        throw new Exception("Execute failed (delete progress): " . $stmt->error);
    }
    $stmt->close();
    
    // Now delete the exercises
    $deleteExercisesQuery = "DELETE FROM ejercicios WHERE usuario_id = ? AND pagina = ?";
    $stmt = $conn->prepare($deleteExercisesQuery);
    if (!$stmt) {
        throw new Exception("Prepare failed (delete exercises): " . $conn->error);
    }
    $stmt->bind_param("ii", $usuario_id, $pagina);
    if (!$stmt->execute()) {
        throw new Exception("Execute failed (delete exercises): " . $stmt->error);
    }
    $stmt->close();
    
    // Generate 8 new exercises (5-digit numbers)
    $ejercicios = [];
    for ($i = 0; $i < 8; $i++) {
        $minuendo = rand(10000, 99999);
        $sustraendo = rand(10000, $minuendo); // Ensure sustraendo is <= minuendo
        $resultado = $minuendo - $sustraendo;
        
        $stmt = $conn->prepare("INSERT INTO ejercicios (minuendo, sustraendo, resultado, usuario_id, pagina) VALUES (?, ?, ?, ?, ?)");
        if (!$stmt) {
            throw new Exception("Prepare failed (insert exercise): " . $conn->error);
        }
        
        $stmt->bind_param("iiiii", $minuendo, $sustraendo, $resultado, $usuario_id, $pagina);
        if (!$stmt->execute()) {
            throw new Exception("Execute failed (insert exercise): " . $stmt->error);
        }
        
        $ejercicios[] = [
            'id' => $stmt->insert_id,
            'minuendo' => $minuendo,
            'sustraendo' => $sustraendo,
            'resultado' => $resultado,
            'usuario_id' => $usuario_id,
            'pagina' => $pagina
        ];
        $stmt->close();
    }
    return $ejercicios;
}

function validateBirthdate($birthdateString) {
    $date = DateTime::createFromFormat('Y-m-d', $birthdateString);
    if (!$date || $date->format('Y-m-d') !== $birthdateString) {
        throw new Exception("Invalid birthdate format. Please use YYYY-MM-DD");
    }
    return $date->format('Y-m-d');
}

try {
    switch ($method) {
        case 'GET':
            if ($endpoint == 'ejercicios') {
                if (!isset($_GET['usuario_id']) || !isset($_GET['pagina'])) {
                    throw new Exception("usuario_id and pagina parameters are required");
                }
                $usuario_id = (int)$_GET['usuario_id'];
                $pagina = (int)$_GET['pagina'];
                
                // First check if user exists
                $userCheck = $conn->query("SELECT id FROM usuarios WHERE id = $usuario_id");
                if ($userCheck->num_rows == 0) {
                    throw new Exception("User not found");
                }
                
                // Check if exercises exist for this user and page
                $result = $conn->query("SELECT * FROM ejercicios WHERE usuario_id = $usuario_id AND pagina = $pagina");
                if (!$result) {
                    throw new Exception("Query failed: " . $conn->error);
                }
                
                if ($result->num_rows == 0) {
                    // No exercises found, generate new ones for this page
                    $ejercicios = generarEjercicios($conn, $usuario_id, $pagina);
                    echo json_encode($ejercicios);
                } else {
                    // Return existing exercises with progress status
                    $ejercicios = [];
                    while ($row = $result->fetch_assoc()) {
                        // Check progress for each exercise
                        $progressQuery = $conn->query("SELECT completado FROM usuarios_progreso 
                                                     WHERE usuario_id = $usuario_id AND ejercicio_id = {$row['id']}");
                        $completado = $progressQuery->fetch_assoc();
                        
                        $ejercicios[] = [
                            'id' => $row['id'],
                            'minuendo' => $row['minuendo'],
                            'sustraendo' => $row['sustraendo'],
                            'resultado' => $row['resultado'],
                            'pagina' => $row['pagina'],
                            'completado' => $completado ? (bool)$completado['completado'] : false
                        ];
                    }
                    echo json_encode($ejercicios);
                }
            }
            break;

        case 'POST':
            if ($endpoint == 'registrar') {
                $data = json_decode(file_get_contents('php://input'), true);
                
                if (!isset($data['nombre']) || !isset($data['contraseña']) || !isset($data['fecha_nacimiento'])) {
                    throw new Exception("Nombre de usuario, contraseña y fecha de nacimiento are required");
                }

                try {
                    $formattedBirthdate = validateBirthdate($data['fecha_nacimiento']);
                } catch (Exception $e) {
                    http_response_code(400);
                    echo json_encode(["error" => $e->getMessage()]);
                    break;
                }
                
                // Check if username exists
                $stmt = $conn->prepare("SELECT id FROM usuarios WHERE nombre = ?");
                $stmt->bind_param("s", $data['nombre']);
                $stmt->execute();
                $result = $stmt->get_result();
                
                if ($result->num_rows > 0) {
                    http_response_code(409);
                    echo json_encode(["error" => "Nombre de usuario ya existe"]);
                    break;
                }
                $stmt->close();
                
                // Hash password and create user
                $hashedPassword = password_hash($data['contraseña'], PASSWORD_DEFAULT);
                
                $stmt = $conn->prepare("INSERT INTO usuarios (nombre, contraseña, fecha_nacimiento) VALUES (?, ?, ?)");
                $stmt->bind_param("sss", $data['nombre'], $hashedPassword, $formattedBirthdate);
                
                if (!$stmt->execute()) {
                    throw new Exception("Failed to register user: " . $stmt->error);
                }
                
                $user_id = $stmt->insert_id;
                $stmt->close();
                
                // Generate initial exercises for page 1 for the new user
                $ejercicios = generarEjercicios($conn, $user_id, 1);
                
                echo json_encode([
                    "success" => true,
                    "message" => "User registered successfully",
                    "user_id" => $user_id,
                    "exercises" => $ejercicios
                ]);
            }
            elseif ($endpoint == 'login') {
                $data = json_decode(file_get_contents('php://input'), true);
                
                if (!isset($data['nombre']) || !isset($data['contraseña'])) {
                    http_response_code(400);
                    echo json_encode(["error" => "Username and password are required"]);
                    break;
                }
                
                $stmt = $conn->prepare("SELECT id, nombre, contraseña, fecha_nacimiento FROM usuarios WHERE nombre = ?");
                $stmt->bind_param("s", $data['nombre']);
                $stmt->execute();
                $result = $stmt->get_result();
                
                if ($result->num_rows == 0) {
                    http_response_code(401);
                    echo json_encode(["error" => "Invalid username or password"]);
                    break;
                }
                
                $user = $result->fetch_assoc();
                
                if (!password_verify($data['contraseña'], $user['contraseña'])) {
                    http_response_code(401);
                    echo json_encode(["error" => "Invalid username or password"]);
                    break;
                }
                
                echo json_encode([
                    "success" => true,
                    "user" => [
                        "id" => $user['id'],
                        "username" => $user['nombre'],
                        "birthdate" => $user['fecha_nacimiento'],
                    ]
                ]);
            }
            elseif ($endpoint == 'reiniciar-ejercicios') {
                $data = json_decode(file_get_contents('php://input'), true);
                if (!isset($data['usuario_id']) || !isset($data['pagina'])) {
                    throw new Exception("usuario_id and pagina are required");
                }
                $usuario_id = (int)$data['usuario_id'];
                $pagina = (int)$data['pagina'];
                
                // Regenerate exercises for this specific page
                $ejercicios = generarEjercicios($conn, $usuario_id, $pagina);
                
                // Clear progress for these exercises
                $exerciseIds = array_column($ejercicios, 'id');
                if (!empty($exerciseIds)) {
                    $ids = implode(',', $exerciseIds);
                    if (!$conn->query("DELETE FROM usuarios_progreso WHERE usuario_id = $usuario_id AND ejercicio_id IN ($ids)")) {
                        throw new Exception("Failed to delete progress");
                    }
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
                
                $usuario_id = (int)$data['usuario_id'];
                $ejercicio_id = (int)$data['ejercicio_id'];
                
                // First verify the exercise belongs to the user
                $exerciseCheck = $conn->query("SELECT id FROM ejercicios WHERE id = $ejercicio_id AND usuario_id = $usuario_id");
                if ($exerciseCheck->num_rows == 0) {
                    throw new Exception("Exercise not found for this user");
                }
                
                // Update or insert progress
                $stmt = $conn->prepare("INSERT INTO usuarios_progreso (usuario_id, ejercicio_id, completado) 
                                     VALUES (?, ?, TRUE) 
                                     ON DUPLICATE KEY UPDATE completado = TRUE");
                if (!$stmt) {
                    throw new Exception("Prepare failed: " . $conn->error);
                }
                
                $stmt->bind_param("ii", $usuario_id, $ejercicio_id);
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