
<?php
header("Content-Type: application/json; charset=utf-8");
require_once "db.php";

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    http_response_code(405);
    echo json_encode(["error" => "只接受 POST"]);
    exit;
}

$data = json_decode(file_get_contents("php://input"), true);

if (
    !is_array($data) ||
    !isset($data["temperature"], $data["humidity"])
) {
    http_response_code(400);
    echo json_encode(["error" => "資料不完整"]);
    exit;
}

$temperature = filter_var(
    $data["temperature"],
    FILTER_VALIDATE_FLOAT
);
$humidity = filter_var(
    $data["humidity"],
    FILTER_VALIDATE_FLOAT
);

$tvoc = null;
if (isset($data["tvoc"])) {
    $tvoc = filter_var(
        $data["tvoc"],
        FILTER_VALIDATE_INT
    );
}

if (
    $temperature === false ||
    $humidity === false ||
    $humidity < 0 ||
    $humidity > 100 ||
    $tvoc === false ||
    ($tvoc !== null && $tvoc < 0)
) {
    http_response_code(400);
    echo json_encode(["error" => "感測數值無效"]);
    exit;
}

$sql = "INSERT INTO sensor_readings
        (temperature, humidity, tvoc)
        VALUES (:temperature, :humidity, :tvoc)";

$stmt = $pdo->prepare($sql);

$stmt->execute([
    ":temperature" => $temperature,
    ":humidity" => $humidity,
    ":tvoc" => $tvoc
]);

echo json_encode([
    "success" => true,
    "id" => $pdo->lastInsertId()
]);
?>

