<?php
/**
 * PW Sync — get_chars.php
 * Retorna os personagens iniciais (clsconfig id 16) em JSON.
 *
 * Formato de retorno:
 * [
 *   { "class": "Warrior", "hp": 120, "mp": 60, "items": [101, 102] },
 *   ...
 * ]
 *
 * Por padrão lê de chars.json no mesmo diretório.
 * Adapte o bloco "TODO: integrar com seu banco" para puxar do seu DB real.
 */

declare(strict_types=1);

// ===== CORS =====
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Accept');
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

// ===== Config =====
$DATA_FILE = __DIR__ . '/chars.json';

// Defaults caso o arquivo não exista ainda
$DEFAULT_CHARS = [
    ['class' => 'Warrior',  'hp' => 120, 'mp' => 60,  'items' => [101, 102]],
    ['class' => 'Mage',     'hp' => 80,  'mp' => 150, 'items' => [201, 202, 203]],
    ['class' => 'Archer',   'hp' => 95,  'mp' => 80,  'items' => [301, 302]],
    ['class' => 'Priest',   'hp' => 90,  'mp' => 140, 'items' => [401, 402, 403]],
    ['class' => 'Assassin', 'hp' => 100, 'mp' => 70,  'items' => [501, 502]],
];

try {
    // ----- TODO: integrar com seu banco -----
    // Exemplo (pseudo):
    //   $pdo = new PDO(...);
    //   $stmt = $pdo->query("SELECT class, hp, mp, items FROM starter_chars WHERE clsconfig_id = 16");
    //   $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
    //   foreach ($rows as &$r) { $r['items'] = json_decode($r['items'], true) ?: []; }
    //   echo json_encode($rows); exit;
    // ----------------------------------------

    if (!file_exists($DATA_FILE)) {
        // Cria o arquivo com defaults na primeira execução
        file_put_contents(
            $DATA_FILE,
            json_encode($DEFAULT_CHARS, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE)
        );
    }

    $raw = file_get_contents($DATA_FILE);
    $data = json_decode($raw, true);

    if (!is_array($data)) {
        throw new RuntimeException('chars.json inválido');
    }

    echo json_encode(array_values($data), JSON_UNESCAPED_UNICODE);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
