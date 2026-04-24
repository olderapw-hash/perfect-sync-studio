<?php
/**
 * pw_send_mail.php — entrega real de correio (item ou gold) no Perfect World.
 *
 * Lido pelo wrapper sudo /usr/local/sbin/sendreward-api.sh chamado por
 * api_cls.php (handleSendMailRequest). NUNCA exposto via HTTP.
 *
 * Recebe um JSON via STDIN com a forma:
 *
 *   {
 *     "kind":      "item" | "gold",
 *     "roleid":    1024,
 *     "subject":   "Recompensa do evento",
 *     "body":      "Obrigado por participar!",
 *
 *     // somente kind=item:
 *     "item_id":   11530,
 *     "count":     5,
 *     "max_count": 999,
 *     "proctype":  0,
 *     "expire_date": 0,
 *     "mask":      0,
 *     "guid1":     0,
 *     "guid2":     0,
 *     "data":      ""
 *
 *     // somente kind=gold:
 *     "amount":    1000000
 *   }
 *
 * Imprime JSON no STDOUT no formato:
 *
 *   { "success": true, "roleid": 1024, "mail_id": 998877, "delivered": true }
 *
 * Em erro, devolve exit != 0 e mensagem no STDERR.
 *
 * --------------------------------------------------------------------
 *  COMO A ENTREGA E FEITA
 * --------------------------------------------------------------------
 *  Este script tenta, nesta ordem:
 *
 *    1. Console do gdeliveryd via "send_mail.lua" (se existir).
 *       Caminho default: /home/gdeliveryd/script/send_mail.lua
 *    2. Comando direto "deliveryd_console" se estiver no PATH.
 *    3. Fallback: registra em /var/www/html/apicls/backups/mail-logs/
 *       e devolve { delivered: false, queued: true } para o painel
 *       saber que ficou pendente.
 *
 *  Se sua VPS usa outro mecanismo (sql direto, telnetd, lua custom),
 *  basta editar a funcao deliver_to_pw() abaixo. O contrato JSON com
 *  o painel se mantem.
 */

declare(strict_types=1);

ini_set('display_errors', '0');

// ====== Configuracao local (pode ser sobrescrita por /etc/pw_send_mail.conf) ======
$CFG = [
    'gdeliveryd_dir'    => '/home/gdeliveryd',
    'send_mail_lua'     => '/home/gdeliveryd/script/send_mail.lua',
    'deliveryd_console' => '/home/gdeliveryd/gdeliveryd',
    'console_command'   => '', // se vazio, monta automatico
    'log_dir'           => '/var/www/html/apicls/backups/mail-logs',
    'queue_dir'         => '/var/www/html/apicls/backups/mail-queue',
];
$confFile = '/etc/pw_send_mail.conf';
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
    if (!is_string($raw) || $raw === '') {
        fail('payload vazio no STDIN');
    }
    $decoded = json_decode($raw, true);
    if (!is_array($decoded)) {
        fail('JSON invalido no STDIN: ' . json_last_error_msg());
    }
    return $decoded;
}

function v($arr, $key, $default = null)
{
    return is_array($arr) && array_key_exists($key, $arr) ? $arr[$key] : $default;
}

/**
 * Tenta entregar o mail via mecanismo nativo do PW. Retorna array com:
 *   ['delivered' => bool, 'mail_id' => int|null, 'method' => string, 'raw' => string]
 * ou null se nao foi possivel chamar nenhum mecanismo (queue/fallback).
 */
function deliver_to_pw(array $payload, array $cfg): ?array
{
    // --- 1) send_mail.lua via console gdeliveryd ---
    $lua = (string) v($cfg, 'send_mail_lua', '');
    if ($lua !== '' && is_file($lua)) {
        $bin = (string) v($cfg, 'deliveryd_console', '');
        if ($bin !== '' && is_executable($bin)) {
            $args = build_lua_args($payload);
            $cmd = escapeshellcmd($bin) . ' script ' . escapeshellarg($lua) . ' ' . $args;
            $out = [];
            $rc = 0;
            @exec($cmd . ' 2>&1', $out, $rc);
            $raw = trim(implode("\n", $out));
            if ($rc === 0) {
                $mailId = parse_mail_id($raw);
                return [
                    'delivered' => true,
                    'mail_id'   => $mailId,
                    'method'    => 'lua_console',
                    'raw'       => $raw,
                ];
            }
            // Falhou — segue pro fallback de queue.
            return [
                'delivered' => false,
                'mail_id'   => null,
                'method'    => 'lua_console_failed',
                'raw'       => $raw !== '' ? $raw : ('exit ' . $rc),
            ];
        }
    }

    // --- 2) console_command custom ---
    $custom = (string) v($cfg, 'console_command', '');
    if ($custom !== '') {
        $json = json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        $cmd = $custom . ' ' . escapeshellarg((string) $json);
        $out = [];
        $rc = 0;
        @exec($cmd . ' 2>&1', $out, $rc);
        $raw = trim(implode("\n", $out));
        if ($rc === 0) {
            $mailId = parse_mail_id($raw);
            return [
                'delivered' => true,
                'mail_id'   => $mailId,
                'method'    => 'custom',
                'raw'       => $raw,
            ];
        }
        return [
            'delivered' => false,
            'mail_id'   => null,
            'method'    => 'custom_failed',
            'raw'       => $raw !== '' ? $raw : ('exit ' . $rc),
        ];
    }

    return null;
}

function build_lua_args(array $payload): string
{
    $kind = (string) v($payload, 'kind', 'item');
    $roleid = (int) v($payload, 'roleid', 0);
    $subject = (string) v($payload, 'subject', 'PW Admin');
    $body = (string) v($payload, 'body', '');

    if ($kind === 'gold') {
        return implode(' ', [
            escapeshellarg($roleid),
            escapeshellarg('gold'),
            escapeshellarg((string) (int) v($payload, 'amount', 0)),
            escapeshellarg($subject),
            escapeshellarg($body),
        ]);
    }

    return implode(' ', [
        escapeshellarg($roleid),
        escapeshellarg('item'),
        escapeshellarg((string) (int) v($payload, 'item_id', 0)),
        escapeshellarg((string) (int) v($payload, 'count', 0)),
        escapeshellarg((string) (int) v($payload, 'max_count', 0)),
        escapeshellarg($subject),
        escapeshellarg($body),
    ]);
}

function parse_mail_id(string $raw): ?int
{
    if ($raw === '') return null;
    if (preg_match('/mail[_\s-]?id[^0-9]*(\d+)/i', $raw, $m)) {
        return (int) $m[1];
    }
    if (preg_match('/^\s*(\d+)\s*$/', $raw, $m)) {
        return (int) $m[1];
    }
    return null;
}

function queue_for_later(array $payload, array $cfg, ?array $deliveryAttempt): array
{
    $dir = (string) v($cfg, 'queue_dir', '');
    if ($dir !== '' && !is_dir($dir)) {
        @mkdir($dir, 0750, true);
    }
    $entry = [
        'queued_at_utc' => gmdate('c'),
        'payload'       => $payload,
        'attempt'       => $deliveryAttempt,
    ];
    if ($dir !== '' && is_dir($dir) && is_writable($dir)) {
        $fname = $dir . '/queue-' . gmdate('Ymd-His') . '-' . (int) v($payload, 'roleid', 0) . '.json';
        @file_put_contents($fname, json_encode($entry, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT));
    }
    return $entry;
}

// ====== Pipeline ======
$payload = read_payload();
$kind = (string) v($payload, 'kind', '');
if (!in_array($kind, ['item', 'gold'], true)) {
    fail('kind invalido: ' . $kind);
}
$roleid = (int) v($payload, 'roleid', 0);
if ($roleid <= 0) {
    fail('roleid invalido');
}

$attempt = deliver_to_pw($payload, $CFG);

if (is_array($attempt) && $attempt['delivered']) {
    echo json_encode([
        'success'   => true,
        'roleid'    => $roleid,
        'mail_id'   => $attempt['mail_id'],
        'delivered' => true,
        'method'    => $attempt['method'],
    ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit(0);
}

// Sem mecanismo nativo OU mecanismo nativo falhou → enfileira e devolve queued.
$queued = queue_for_later($payload, $CFG, $attempt);

echo json_encode([
    'success'   => true,
    'roleid'    => $roleid,
    'mail_id'   => null,
    'delivered' => false,
    'queued'    => true,
    'method'    => is_array($attempt) ? $attempt['method'] : 'no_native_handler',
    'note'      => 'Mail enfileirado: configure send_mail.lua ou console_command em /etc/pw_send_mail.conf para entrega imediata',
], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
exit(0);
