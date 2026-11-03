
<?php
header("Content-Type: application/json; charset=utf-8");
require_once "db.php";

try {
    $sql = "
        SELECT
            o.id,
            o.has_odor,
            o.reported_at,
            s.temperature,
            s.humidity,
            s.tvoc
        FROM odor_reports o
        JOIN sensor_readings s
            ON o.reading_id = s.id
        ORDER BY o.reported_at DESC, o.id DESC
        LIMIT 20
    ";

    $stmt = $pdo->query($sql);

    $records = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode($records);

} catch (PDOException $e) {
    error_log($e->getMessage());

    http_response_code(500);

    echo json_encode([
        "error" => "讀取異味紀錄失敗"
    ]);
}
?>
