<?php
header('Content-Type: application/json');
$data = json_decode(file_get_contents('php://input'), true);
$password = $data['password'] ?? '';
$sessionFile = 'session.json';

// Création automatique du fichier session.json s'il n'existe pas
if (!file_exists($sessionFile)) {
    file_put_contents($sessionFile, json_encode([]));
}

if ($password === 'Angelo8002!') {
    // Génère un nouvel identifiant de session
    $sessionId = uniqid('sess_', true);
    file_put_contents($sessionFile, json_encode([
        'sessionId' => $sessionId,
        'lastActive' => time()
    ]));
    echo json_encode(['success' => true, 'sessionId' => $sessionId]);
} else {
    echo json_encode(['success' => false]);
}