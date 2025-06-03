<?php
// filepath: c:\Users\Utilisateur\OneDrive\Bureau\site internet\data.php
header('Content-Type: application/json');
$dataFile = 'data.json';

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    readfile($dataFile);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $json = file_get_contents('php://input');
    file_put_contents($dataFile, $json);
    echo '{"success":true}';
    exit;
}
?>