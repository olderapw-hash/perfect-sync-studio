<?php
// PLACEHOLDER — substitua pelo api_cls.php real.
// Esta é apenas a estrutura mínima esperada para validar a conexão.
// O arquivo real implementa todas as actions usadas pelo painel.

header('Content-Type: application/json');

$SECRET = 'COLE_AQUI_O_SECRET_GERADO_NO_PAINEL';

$incoming = $_SERVER['HTTP_X_SYNC_SECRET'] ?? '';
if (!hash_equals($SECRET, $incoming)) {
  http_response_code(401);
  echo json_encode(['success' => false, 'error' => 'Unauthorized']);
  exit;
}

$action = $_GET['action'] ?? '';
switch ($action) {
  case 'getClsconfig':
    echo json_encode([
      'success' => true,
      'count' => 0,
      'entries' => [],
      'classes' => [],
      'used_classes' => [],
    ]);
    break;
  default:
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Acao invalida (placeholder).']);
}
