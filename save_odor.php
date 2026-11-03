
<?php
header("Content-Type: application/json; charset=utf-8");
require_once "db.php";

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    http_response_code(405);
    echo json_encode(["error" => "只接受 POST"]);
    exit;
}

$data = json_decode(file_get_contents("php://input"), true);

$readingId = filter_var(
    $data["reading_id"] ?? null,
    FILTER_VALIDATE_INT
);

$hasOdor = $data["has_odor"] ?? null;

if (
    $readingId === false ||
    $readingId === null ||
    $readingId <= 0 ||
    !is_bool($hasOdor)
) {
    http_response_code(400);
    echo json_encode(["error" => "資料格式錯誤"]);
    exit;
}

try {
    $stmt = $pdo->prepare(
        "INSERT INTO odor_reports (reading_id, has_odor)
         VALUES (:reading_id, :has_odor)"
    );

    $stmt->bindValue(":reading_id", $readingId, PDO::PARAM_INT);
    $stmt->bindValue(":has_odor", (int)$hasOdor, PDO::PARAM_INT);
    $stmt->execute();

    echo json_encode(["success" => true]);

} catch (PDOException $e) {
    error_log($e->getMessage());
    http_response_code(500);
    echo json_encode(["error" => "儲存異味紀錄失敗"]);
}
?>
