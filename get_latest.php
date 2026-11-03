
<?php
header("Content-Type: application/json; charset=utf-8");
header("Cache-Control: no-store");

require_once "db.php";

try {
    $sql = "
        SELECT
            id,
            temperature,
            humidity,
            tvoc,
            recorded_at
        FROM sensor_readings
        ORDER BY id DESC
        LIMIT 1
    ";

    $stmt = $pdo->query($sql);
    $record = $stmt->fetch(PDO::FETCH_ASSOC);

    echo json_encode($record ?: null);

} catch (PDOException $e) {
    error_log($e->getMessage());
    http_response_code(500);

    echo json_encode([
        "error" => "讀取最新感測資料失敗"
    ]);
}
?>
