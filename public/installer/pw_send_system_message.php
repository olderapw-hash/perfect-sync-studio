<?php
/**
 * pw_send_system_message.php — entrega real de mensagem global/system no PW.
 *
 * Lido pelo wrapper sudo /usr/local/sbin/sendsysmsg-api.sh chamado por
 * api_cls.php (handleSendSystemMessageRequest). NUNCA exposto via HTTP.
 *
 * Recebe JSON via STDIN no formato:
 *
 *   {
 *     "message":  "Servidor reiniciara em 5 minutos",
 *     "kind":     "system" | "broadcast" | "tip" | "world",
 *     "priority": "low" | "normal" | "high",
 *     "length":   42
 *   }
 *
 * Imprime JSON no STDOUT:
 *
 *   { "success": true, "delivered": true, "method": "lua_console" }
 *
 * --------------------------------------------------------------------
 *  COMO A ENTREGA E FEITA
 * --------------------------------------------------------------------
 *  Tenta, nesta ordem:
 *
 *    1. Console do gdeliveryd via send_system_message.lua (se existir).
 *       Caminho default: /home/gdeliveryd/script/send_system_message.lua
 *    2. console_command custom definido em /etc/pw_send_system_message.conf.
 *    3. Fallback: registra em /var/www/html/apicls/backups/sysmsg-queue/
 *       e devolve { delivered:false, queued:true } para o painel saber
 *       que ficou pendente.
 *
 *  Se sua VPS usa outro mecanismo, edite deliver_to_pw() ou aponte
 *  console_command em /etc/pw_send_system_message.conf.
 */

declare(strict_types=1);

ini_set('display_errors', '0');

$CFG = [
    'gdeliveryd_dir'        => '/home/gdeliveryd',
    'send_sysmsg_lua'       => '/home/gdeliveryd/script/send_system_message.lua',
    'deliveryd_console'     => '/home/gdeliveryd/gdeliveryd',
    'console_command'       => '', // se vazio, monta automatico com lua
    'log_dir'               => '/var/www/html/apicls/backups/sysmsg-logs',
    'queue_dir'             => '/var/www/html/apicls/backups/sysmsg-queue',
];
$confFile = '/etc/pw_send_system_message.conf';
if (is_readable($confFile)) {
    $local = @parse_ini_file($confFile, false, INI_SCANNER_TYPED);
    if (is_array($local)) {
        $CFG = array_merge($CFG, $local);
    }
}

function fail(string $msg, int $code = 1): void
{
    fwrite(STDERR, $msg . PHP_EOL);
    exit($code);
}

function read_payload(): array
{
    $raw = stream_get_contents(STDIN);
    if (!is_string($raw) || $raw === '') fail('payload vazio no STDIN');
    $decoded = json_decode($raw, true);
    if (!is_array($decoded)) fail('JSON invalido no STDIN: ' . json_last_error_msg());
    return $decoded;
}

function v($arr, $key, $default = null)
{
    return is_array($arr) && array_key_exists($key, $arr) ? $arr[$key] : $default;
}

function deliver_to_pw(array $payload, array $cfg): ?array
{
    // --- 1) send_system_message.lua via console gdeliveryd ---
    $lua = (string) v($cfg, 'send_sysmsg_lua', '');
    if ($lua !== '' && is_file($lua)) {
        $bin = (string) v($cfg, 'deliveryd_console', '');
        if ($bin !== '' && is_executable($bin)) {
            $args = implode(' ', [
                escapeshellarg((string) v($payload, 'kind', 'system')),
                escapeshellarg((string) v($payload, 'priority', 'normal')),
                escapeshellarg((string) v($payload, 'message', '')),
            ]);
            $cmd = escapeshellcmd($bin) . ' script ' . escapeshellarg($lua) . ' ' . $args;
            $out = []; $rc = 0;
            @exec($cmd . ' 2>&1', $out, $rc);
            $raw = trim(implode("\n", $out));
            if ($rc === 0) {
                return ['delivered' => true, 'method' => 'lua_console', 'raw' => $raw];
            }
            return ['delivered' => false, 'method' => 'lua_console_failed',
                    'raw' => $raw !== '' ? $raw : ('exit ' . $rc)];
        }
    }

    // --- 2) console_command custom ---
    $custom = (string) v($cfg, 'console_command', '');
    if ($custom !== '') {
        $json = json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        $cmd = $custom . ' ' . escapeshellarg((string) $json);
        $out = []; $rc = 0;
        @exec($cmd . ' 2>&1', $out, $rc);
        $raw = trim(implode("\n", $out));
        if ($rc === 0) {
            return ['delivered' => true, 'method' => 'custom', 'raw' => $raw];
        }
        return ['delivered' => false, 'method' => 'custom_failed',
                'raw' => $raw !== '' ? $raw : ('exit ' . $rc)];
    }

    return null;
}

function queue_for_later(array $payload, array $cfg, ?array $attempt): array
{
    $dir = (string) v($cfg, 'queue_dir', '');
    if ($dir !== '' && !is_dir($dir)) @mkdir($dir, 0750, true);
    $entry = [
        'queued_at_utc' => gmdate('c'),
        'payload'       => $payload,
        'attempt'       => $attempt,
    ];
    if ($dir !== '' && is_dir($dir) && is_writable($dir)) {
        $fname = $dir . '/queue-' . gmdate('Ymd-His') . '-' . v($payload, 'kind', 'system') . '.json';
        @file_put_contents($fname, json_encode($entry, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT));
    }
    return $entry;
}

// ====== Pipeline ======
$payload = read_payload();
$message = trim((string) v($payload, 'message', ''));
if ($message === '') fail('message obrigatorio');

$attempt = deliver_to_pw($payload, $CFG);

if (is_array($attempt) && $attempt['delivered']) {
    echo json_encode([
        'success'   => true,
        'delivered' => true,
        'method'    => $attempt['method'],
    ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit(0);
}

$queued = queue_for_later($payload, $CFG, $attempt);

echo json_encode([
    'success'   => true,
    'delivered' => false,
    'queued'    => true,
    'method'    => is_array($attempt) ? $attempt['method'] : 'no_native_handler',
    'note'      => 'Mensagem enfileirada: configure send_system_message.lua ou console_command em /etc/pw_send_system_message.conf para entrega imediata',
], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
exit(0);
