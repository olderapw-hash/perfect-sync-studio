<?php
/**
 * api_cls.php — bridge HTTP entre o painel PW Admin e a sua VPS Perfect World.
 *
 * Como funciona:
 *   - Recebe chamadas autenticadas via header X-Sync-Secret.
 *   - Lê / grava o clsconfig consolidado em disco e dispara o gamedbd
 *     `exportclsconfig` quando precisa regenerar o arquivo a partir do banco.
 *   - Mantém um diretório de backups versionados em /var/backups/clsconfig/.
 *
 * IMPORTANTE:
 *   - NUNCA exponha esta URL sem o secret correto.
 *   - Substitua __PW_API_SECRET__ pelo secret gerado em "Meus Servidores".
 *   - O usuário do PHP (apache/www-data/nginx) precisa de sudo NOPASSWD para
 *     /usr/local/sbin/exportclsconfig-api.sh — veja sudoers.example.
 */

declare(strict_types=1);
error_reporting(E_ALL);
ini_set('display_errors', '0');

// ============ CONFIG ============================================
// Substitua o valor abaixo pelo secret gerado no painel PW Admin → Meus Servidores.
$SECRET = '__PW_API_SECRET__';

// Caminhos no servidor — ajuste se o seu layout de gamedbd for diferente.
$GAMEDBD_DIR     = '/home/gamedbd';
$CLSCONFIG_PATH  = $GAMEDBD_DIR . '/clsconfig.data';
$BACKUP_DIR      = '/var/backups/clsconfig';
$EXPORT_SCRIPT   = '/usr/local/sbin/exportclsconfig-api.sh';
$MAX_BACKUPS     = 200;

// Timeout máximo de execução em segundos (export pode demorar).
set_time_limit(120);

// ============ HELPERS ===========================================
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

function out(array $payload, int $status = 200): void {
    http_response_code($status);
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function fail(string $error, int $status = 400, array $extra = []): void {
    out(array_merge(['success' => false, 'error' => $error], $extra), $status);
}

function readJsonBody(): array {
    $raw = file_get_contents('php://input');
    if ($raw === '' || $raw === false) return [];
    $j = json_decode($raw, true);
    if (!is_array($j)) fail('Invalid JSON body', 400);
    return $j;
}

function ensureDir(string $dir): void {
    if (!is_dir($dir)) {
        @mkdir($dir, 0750, true);
    }
}

// ============ AUTH ==============================================
$incoming = $_SERVER['HTTP_X_SYNC_SECRET'] ?? '';
if (!is_string($SECRET) || $SECRET === '' || $SECRET === '__PW_API_SECRET__') {
    fail('Server not configured: $SECRET still set to placeholder.', 500);
}
if (!is_string($incoming) || !hash_equals($SECRET, $incoming)) {
    fail('Unauthorized', 401);
}

ensureDir($BACKUP_DIR);

// ============ ACTIONS ===========================================
$action = $_GET['action'] ?? ($_POST['action'] ?? '');
if (!is_string($action) || $action === '') {
    fail('Missing action', 400);
}

switch ($action) {

    // ---- Health / metadata ----------------------------------------------------
    case 'ping':
        out([
            'success'    => true,
            'pong'       => true,
            'php'        => PHP_VERSION,
            'time'       => date('c'),
            'clsconfig'  => is_file($CLSCONFIG_PATH),
            'backup_dir' => is_dir($BACKUP_DIR),
        ]);

    case 'getClasses':
        if (!is_file($CLSCONFIG_PATH)) {
            out(['success' => true, 'classes' => [], 'count' => 0]);
        }
        $raw = @file_get_contents($CLSCONFIG_PATH);
        if ($raw === false) fail('Cannot read clsconfig', 500);
        $j = json_decode($raw, true);
        $classes = [];
        if (is_array($j) && isset($j['classes']) && is_array($j['classes'])) {
            $classes = array_values(array_unique(array_map('intval', $j['classes'])));
        }
        out(['success' => true, 'classes' => $classes, 'count' => count($classes)]);

    // ---- Clsconfig leitura ----------------------------------------------------
    case 'getClsconfig':
        if (!is_file($CLSCONFIG_PATH)) {
            out([
                'success'      => true,
                'count'        => 0,
                'entries'      => [],
                'classes'      => [],
                'used_classes' => [],
            ]);
        }
        $raw = @file_get_contents($CLSCONFIG_PATH);
        if ($raw === false) fail('Cannot read clsconfig', 500);
        $j = json_decode($raw, true);
        if (!is_array($j)) fail('clsconfig is not valid JSON', 500);
        $j['success'] = true;
        if (!isset($j['count']) && isset($j['entries']) && is_array($j['entries'])) {
            $j['count'] = count($j['entries']);
        }
        out($j);

    // ---- Clsconfig gravação por template/cls ----------------------------------
    case 'saveClsconfigTemplate': {
        $body = readJsonBody();
        $cls      = isset($body['cls']) ? (int)$body['cls'] : -1;
        $template = $body['template'] ?? null;
        if ($cls < 0 || !is_array($template)) {
            fail('Missing cls or template', 422);
        }
        if (!is_file($CLSCONFIG_PATH)) fail('clsconfig file not found', 404);

        $raw = @file_get_contents($CLSCONFIG_PATH);
        $j = json_decode($raw, true);
        if (!is_array($j) || !isset($j['entries']) || !is_array($j['entries'])) {
            fail('clsconfig structure invalid', 500);
        }

        $found = 0;
        foreach ($j['entries'] as &$entry) {
            if ((int)($entry['cls'] ?? -1) === $cls) {
                $entry = array_merge($entry, $template);
                $entry['cls'] = $cls;
                $found++;
            }
        }
        unset($entry);
        if ($found === 0) {
            $template['cls'] = $cls;
            $j['entries'][] = $template;
            $found = 1;
        }

        // Backup antes de escrever.
        @copy($CLSCONFIG_PATH, $BACKUP_DIR . '/clsconfig.' . date('Ymd-His') . '.bak');

        $j['count'] = count($j['entries']);
        $bytes = file_put_contents(
            $CLSCONFIG_PATH,
            json_encode($j, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
            LOCK_EX
        );
        if ($bytes === false) fail('Cannot write clsconfig', 500);

        out(['success' => true, 'updated_entries' => $found, 'bytes' => $bytes]);
    }

    // ---- Salvamento de um único role editável ---------------------------------
    case 'saveRoleEditable': {
        $body = readJsonBody();
        $roleid = isset($body['roleid']) ? (int)$body['roleid'] : 0;
        $patch  = $body['patch'] ?? null;
        if ($roleid <= 0 || !is_array($patch)) fail('Missing roleid or patch', 422);
        if (!is_file($CLSCONFIG_PATH)) fail('clsconfig file not found', 404);

        $raw = @file_get_contents($CLSCONFIG_PATH);
        $j = json_decode($raw, true);
        if (!is_array($j) || !isset($j['entries']) || !is_array($j['entries'])) {
            fail('clsconfig structure invalid', 500);
        }

        $found = false;
        foreach ($j['entries'] as &$entry) {
            if ((int)($entry['roleid'] ?? 0) === $roleid) {
                $entry = array_merge($entry, $patch);
                $entry['roleid'] = $roleid;
                $found = true;
                break;
            }
        }
        unset($entry);
        if (!$found) fail('roleid not found in clsconfig', 404);

        @copy($CLSCONFIG_PATH, $BACKUP_DIR . '/clsconfig.' . date('Ymd-His') . '.bak');

        $bytes = file_put_contents(
            $CLSCONFIG_PATH,
            json_encode($j, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
            LOCK_EX
        );
        if ($bytes === false) fail('Cannot write clsconfig', 500);

        out(['success' => true, 'roleid' => $roleid, 'bytes' => $bytes]);
    }

    // ---- Trigger de exportclsconfig pelo gamedbd ------------------------------
    case 'exportClsconfig': {
        if (!is_file($EXPORT_SCRIPT)) {
            fail('Export script not installed at ' . $EXPORT_SCRIPT, 500);
        }
        $cmd = 'sudo -n ' . escapeshellcmd($EXPORT_SCRIPT) . ' 2>&1';
        $output = [];
        $code = 0;
        exec($cmd, $output, $code);
        if ($code !== 0) {
            fail('Export script failed', 500, [
                'exit_code' => $code,
                'output'    => implode("\n", $output),
            ]);
        }
        out([
            'success'   => true,
            'exit_code' => $code,
            'output'    => implode("\n", $output),
        ]);
    }

    // ---- Backups --------------------------------------------------------------
    case 'listBackups': {
        $files = [];
        foreach (glob($BACKUP_DIR . '/clsconfig.*.bak') ?: [] as $f) {
            $files[] = [
                'name'     => basename($f),
                'size'     => filesize($f) ?: 0,
                'mtime'    => filemtime($f) ?: 0,
                'mtime_iso'=> date('c', filemtime($f) ?: 0),
            ];
        }
        usort($files, static fn($a, $b) => $b['mtime'] <=> $a['mtime']);
        // Trim antigos
        if (count($files) > $MAX_BACKUPS) {
            $extras = array_slice($files, $MAX_BACKUPS);
            foreach ($extras as $ex) @unlink($BACKUP_DIR . '/' . $ex['name']);
            $files = array_slice($files, 0, $MAX_BACKUPS);
        }
        out(['success' => true, 'backups' => $files, 'count' => count($files)]);
    }

    case 'getBackupContent': {
        $name = $_GET['name'] ?? '';
        if (!is_string($name) || !preg_match('/^clsconfig\.[\w\-]+\.bak$/', $name)) {
            fail('Invalid backup name', 400);
        }
        $path = $BACKUP_DIR . '/' . $name;
        if (!is_file($path)) fail('Backup not found', 404);
        $raw = @file_get_contents($path);
        if ($raw === false) fail('Cannot read backup', 500);
        $j = json_decode($raw, true);
        if (!is_array($j)) fail('Backup is not valid JSON', 500);
        $j['success'] = true;
        $j['_backup_name'] = $name;
        out($j);
    }

    case 'restoreBackup': {
        $body = readJsonBody();
        $name = $body['name'] ?? '';
        if (!is_string($name) || !preg_match('/^clsconfig\.[\w\-]+\.bak$/', $name)) {
            fail('Invalid backup name', 400);
        }
        $path = $BACKUP_DIR . '/' . $name;
        if (!is_file($path)) fail('Backup not found', 404);
        // Backup do estado atual antes de restaurar.
        if (is_file($CLSCONFIG_PATH)) {
            @copy($CLSCONFIG_PATH, $BACKUP_DIR . '/clsconfig.' . date('Ymd-His') . '.pre-restore.bak');
        }
        $ok = @copy($path, $CLSCONFIG_PATH);
        if (!$ok) fail('Restore failed', 500);
        out(['success' => true, 'restored_from' => $name]);
    }

    // ---- Item catalog (passa direto se existir um arquivo local) --------------
    case 'getItemCatalog': {
        $candidates = [
            $GAMEDBD_DIR . '/itemcatalog.json',
            '/var/www/html/apicls/itemcatalog.json',
        ];
        foreach ($candidates as $p) {
            if (is_file($p)) {
                $raw = @file_get_contents($p);
                if ($raw !== false) {
                    $j = json_decode($raw, true);
                    if (is_array($j)) {
                        $j['success'] = true;
                        out($j);
                    }
                }
            }
        }
        out(['success' => true, 'items' => [], 'count' => 0]);
    }

    default:
        fail('Unknown action: ' . $action, 400);
}
