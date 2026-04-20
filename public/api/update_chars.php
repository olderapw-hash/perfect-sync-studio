<?php
/**
 * PW Sync — update_chars.php
 * Recebe JSON (array de personagens) e grava em chars.json (ou seu banco).
 *
 * Corpo esperado:
 * [
 *   { "class": "Warrior", "hp": 120, "mp": 60, "items": [101, 102] },
 *   ...
 * ]
 */

declare(strict_types=1);

// ===== CORS =====
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Accept');
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

$DATA_FILE = __DIR__ . '/chars.json';

try {
    $body = file_get_contents('php://input');
    if ($body === false || $body === '') {
        throw new InvalidArgumentException('Corpo vazio');
    }

    $payload = json_decode($body, true);
    if (!is_array($payload)) {
        throw new InvalidArgumentException('JSON inválido');
    }

    // ===== Validação + sanitização =====
    $clean = [];
    foreach ($payload as $i => $row) {
        if (!is_array($row)) {
            throw new InvalidArgumentException("Item #$i inválido");
        }

        $class = isset($row['class']) ? trim((string)$row['class']) : '';
        $hp    = isset($row['hp']) ? (int)$row['hp'] : 0;
        $mp    = isset($row['mp']) ? (int)$row['mp'] : 0;
        $items = isset($row['items']) && is_array($row['items']) ? $row['items'] : [];

        if ($class === '' || strlen($class) > 64) {
            throw new InvalidArgumentException("Item #$i: class inválida");
        }
        if ($hp < 0 || $hp > 10_000_000) {
            throw new InvalidArgumentException("Item #$i: hp fora do intervalo");
        }
        if ($mp < 0 || $mp > 10_000_000) {
            throw new InvalidArgumentException("Item #$i: mp fora do intervalo");
        }

        $normItems = [];
        foreach ($items as $it) {
            $id = (int)$it;
            if ($id <= 0) continue;
            $normItems[] = $id;
        }

        $clean[] = [
            'class' => $class,
            'hp'    => $hp,
            'mp'    => $mp,
            'items' => $normItems,
        ];
    }

    // ----- TODO: integrar com seu banco -----
    // Exemplo (pseudo):
    //   $pdo->beginTransaction();
    //   foreach ($clean as $c) {
    //       $stmt = $pdo->prepare("UPDATE starter_chars SET hp = ?, mp = ?, items = ? WHERE clsconfig_id = 16 AND class = ?");
    //       $stmt->execute([$c['hp'], $c['mp'], json_encode($c['items']), $c['class']]);
    //   }
    //   $pdo->commit();
    // ----------------------------------------

    // Gravação atômica no arquivo
    $tmp = $DATA_FILE . '.tmp';
    $json = json_encode($clean, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    if (file_put_contents($tmp, $json, LOCK_EX) === false) {
        throw new RuntimeException('Falha ao gravar arquivo');
    }
    rename($tmp, $DATA_FILE);

    echo json_encode([
        'status'  => 'ok',
        'message' => 'Sincronizado com sucesso',
        'count'   => count($clean),
    ]);
} catch (InvalidArgumentException $e) {
    http_response_code(400);
    echo json_encode(['error' => $e->getMessage()]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
