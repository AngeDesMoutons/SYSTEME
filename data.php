<?php
header('Content-Type: application/json');
$dataFile = 'data.json';

// Valeurs par défaut si le fichier n'existe pas
$defaultData = [
    "xp" => 0,
    "maxXp" => 100,
    "level" => 0,
    "tasks" => [],
    "quests" => [],
    "malus" => []
];

// Si le fichier n'existe pas, on le crée avec les valeurs par défaut
if (!file_exists($dataFile)) {
    file_put_contents($dataFile, json_encode($defaultData, JSON_PRETTY_PRINT));
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    readfile($dataFile);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $json = file_get_contents('php://input');
    $data = json_decode($json, true);

    // Vérifie que toutes les clés attendues sont présentes
    if (
        is_array($data) &&
        isset($data['xp'], $data['maxXp'], $data['level'], $data['tasks'], $data['quests'], $data['malus'])
    ) {
        file_put_contents($dataFile, json_encode($data, JSON_PRETTY_PRINT));
        echo '{"success":true}';
    } else {
        // Ne pas écraser le fichier si les données sont invalides
        http_response_code(400);
        echo '{"success":false,"error":"Invalid data"}';
    }
    exit;
}
?>