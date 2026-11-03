
<?php

// http://localhost/SmartAC/get_readings.php
header("Content-Type: application/json; charset=utf-8");
require_once "db.php";

$sql = "SELECT id, temperature, humidity, tvoc, recorded_at
        FROM sensor_readings
        ORDER BY recorded_at DESC, id DESC
        LIMIT 20";

$stmt = $pdo->query($sql);
$records = $stmt->fetchAll(PDO::FETCH_ASSOC);

echo json_encode($records);
?>
