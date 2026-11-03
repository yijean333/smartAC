
<?php
$host = "localhost";
$dbname = "smartac";
$username = "root";
$password = ""; // XAMPP 預設可能為空，依實際設定調整

try {
    $pdo = new PDO(
        "mysql:host=$host;dbname=$dbname;charset=utf8mb4",
        $username,
        $password
    );

    $pdo->setAttribute(
        PDO::ATTR_ERRMODE,
        PDO::ERRMODE_EXCEPTION
    );

} catch (PDOException $e) {
    error_log($e->getMessage());
    http_response_code(500);
    exit("資料庫連線失敗");
}
?>
