<?php
<?php
header('Content-Type: application/json');
$dataFile = 'data.json';

// Valeurs par défaut si le fichier n'existe pas
$defaultData = json_encode([
    "xp" => 0,
    "maxXp" => 100,
    "level" => 0,
    "tasks" => [],
    "quests" => [],
    "malus" => []
], JSON_PRETTY_PRINT);

// Si le fichier n'existe pas, on le crée avec les valeurs par défaut
if (!file_exists($dataFile)) {
    file_put_contents($dataFile, $defaultData);
}

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