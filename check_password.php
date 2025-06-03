<?php
header('Content-Type: application/json');
$data = json_decode(file_get_contents('php://input'), true);
$password = $data['password'] ?? '';
// Change ici le mot de passe si besoin
if ($password === 'Angelo8002!') {
    echo json_encode(['success' => true]);
} else {
    echo json_encode(['success' => false]);
}