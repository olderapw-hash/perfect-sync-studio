<?php
/**
 * API CLS - busca templates da clsconfig e dados completos de personagem via gamedbd.
 *
 * Uso HTTP:
 *   GET /apicls/api_cls.php?action=getClsconfig&secret=SEU_SECRET
 *   GET /apicls/api_cls.php?action=getRoleEditable&roleid=12345&secret=SEU_SECRET
 *   GET /apicls/api_cls.php?action=getRolesEditable&roleids=123,456&secret=SEU_SECRET
 *   POST /apicls/api_cls.php?action=exportClsconfig&secret=SEU_SECRET
 *   POST /apicls/api_cls.php?action=saveClsconfigTemplate&roleid=12345&secret=SEU_SECRET
 *   GET  /apicls/api_cls.php?action=getBackupContent&name=roleid-...json&secret=SEU_SECRET
 *   POST /apicls/api_cls.php?action=restoreBackup&secret=SEU_SECRET
 */

$CONFIG = [
    'gamedbd_ip'   => '127.0.0.1',
    'gamedbd_port' => 29400,
    'api_secret'   => '91639268',
    'game_version' => '101',
    'clsconfig_export_workdir' => '/',
    'clsconfig_export_command' => '/usr/bin/sudo -n /usr/local/sbin/exportclsconfig-api.sh',
    'clsconfig_export_attempts' => 5,
    'clsconfig_export_retry_delay_us' => 500000,
    'clsconfig_export_after_save' => 'deferred',
    'clsconfig_export_deferred_delay_seconds' => 5,
    'clsconfig_export_log_dir' => __DIR__ . '/backups/clsconfig/export-logs',
    'clsconfig_backup_dir' => __DIR__ . '/backups/clsconfig',
    'clsconfig_file_path' => '/home/gamedbd/clsconfig',
    'clsconfig_file_backup_dir' => __DIR__ . '/backups/clsconfig/files',
    'gamedbd_backup_enabled' => true,
    'gamedbd_backup_required' => true,
    'gamedbd_backup_command' => '/usr/bin/sudo -n /usr/local/sbin/backupgamedbd-api.sh',
    'gamedbd_backup_dir' => __DIR__ . '/backups/gamedbd',
    'gamedbd_backup_min_interval_seconds' => 300,
    // Templates reais do painel antigo. Ignora placeholders vazios/level 1 do clsconfig.
    'clsconfig_template_roleids' => [16, 17, 18, 19, 20, 21, 22, 23, 24, 27, 28, 31],
    'item_catalog_paths' => [
        '/home/gamed/config/webtradeid.txt',
        '/home/gdeliveryd/auctionid.txt',
        '/home/gamedbd/valuables_list.txt',
        '/home/gamedbd/visibleid.txt',
    ],
    // === Correio (sendMailItem / sendMailGold) ===
    // O handler do PHP delega ao script externo, que usa gdeliveryd para
    // entregar a mail+anexo. Com isso o api_cls.php nao precisa abrir
    // nenhum socket de jogo direto — quem fala com gdeliveryd e o script.
    'mail_send_enabled'        => true,
    'mail_send_command'        => '/usr/bin/sudo -n /usr/local/sbin/sendreward-api.sh',
    'mail_send_workdir'        => __DIR__,
    'mail_send_default_subject' => 'PW Admin',
    'mail_send_default_body'    => 'Mensagem do administrador.',
    'mail_send_max_count'       => 9999,
    'mail_send_max_amount'      => 2000000000,
    'mail_send_log_dir'         => __DIR__ . '/backups/mail-logs',
];

$CULTIVATION_MAP = [
    0  => 'Leal',
    1  => 'Astuto',
    2  => 'Harmonioso',
    3  => 'Lucido',
    4  => 'Enigmatico',
    5  => 'Ameacador',
    6  => 'Sinistro',
    7  => 'Nirvana',
    8  => 'Mahayana',
    20 => 'God 1',
    21 => 'Evil 1',
    22 => 'God 3',
    30 => 'God 2',
    31 => 'Evil 2',
    32 => 'Evil 3',
    40 => 'Caotico',
    41 => 'Celestial',
];

$CLASS_INFO = [
    0  => ['id' => 0,  'name' => 'Guerreiro',       'icon' => 'guerreiro.png',       'icon_path' => 'img/guerreiro.png',       'race' => 'Humano'],
    1  => ['id' => 1,  'name' => 'Mago',            'icon' => 'mago.png',            'icon_path' => 'img/mago.png',            'race' => 'Humano'],
    2  => ['id' => 2,  'name' => 'Espiritualista',  'icon' => 'espiritualista.png',  'icon_path' => 'img/espiritualista.png',  'race' => 'Abissal'],
    3  => ['id' => 3,  'name' => 'Feiticeira',      'icon' => 'feiticeira.png',      'icon_path' => 'img/feiticeira.png',      'race' => 'Selvagem'],
    4  => ['id' => 4,  'name' => 'Barbaro',         'icon' => 'barbaro.png',         'icon_path' => 'img/barbaro.png',         'race' => 'Selvagem'],
    5  => ['id' => 5,  'name' => 'Mercenario',      'icon' => 'mercenario.png',      'icon_path' => 'img/mercenario.png',      'race' => 'Abissal'],
    6  => ['id' => 6,  'name' => 'Arqueiro',        'icon' => 'arqueiro.png',        'icon_path' => 'img/arqueiro.png',        'race' => 'Alada'],
    7  => ['id' => 7,  'name' => 'Sacerdote',       'icon' => 'sacerdote.png',       'icon_path' => 'img/sacerdote.png',       'race' => 'Alada'],
    8  => ['id' => 8,  'name' => 'Arcano',          'icon' => 'arcano.png',          'icon_path' => 'img/arcano.png',          'race' => 'Guardiao'],
    9  => ['id' => 9,  'name' => 'Mistico',         'icon' => 'mistico.png',         'icon_path' => 'img/mistico.png',         'race' => 'Guardiao'],
    10 => ['id' => 10, 'name' => 'Retalhador',      'icon' => 'retalhador.png',      'icon_path' => 'img/retalhador.png',      'race' => 'Sombria'],
    11 => ['id' => 11, 'name' => 'Tormentador',     'icon' => 'tormentador.png',     'icon_path' => 'img/tormentador.png',     'race' => 'Sombria'],
];

function array_value($array, $key, $default = null)
{
    return (is_array($array) && array_key_exists($key, $array)) ? $array[$key] : $default;
}

function cultivation_name($level2)
{
    return isset($GLOBALS['CULTIVATION_MAP'][$level2]) ? $GLOBALS['CULTIVATION_MAP'][$level2] : 'Desconhecido';
}

function class_info($cls)
{
    $cls = intval($cls);
    if (isset($GLOBALS['CLASS_INFO'][$cls])) {
        return $GLOBALS['CLASS_INFO'][$cls];
    }

    return [
        'id' => $cls,
        'name' => 'Desconhecida',
        'icon' => 'todos.png',
        'icon_path' => 'img/todos.png',
        'race' => 'Desconhecida',
    ];
}

function class_options()
{
    $classes = array_values($GLOBALS['CLASS_INFO']);
    usort($classes, function ($a, $b) {
        return intval($a['id']) <=> intval($b['id']);
    });
    return $classes;
}

function decode_octet_text($hex)
{
    if (!is_string($hex) || $hex === '') {
        return '';
    }

    $binary = @hex2bin($hex);
    if ($binary === false || $binary === '') {
        return '';
    }

    if (function_exists('mb_convert_encoding')) {
        return mb_convert_encoding($binary, 'UTF-8', 'UTF-16LE');
    }

    if (function_exists('iconv')) {
        return iconv('UTF-16LE', 'UTF-8//IGNORE', $binary);
    }

    return '';
}

class GamedProtocol
{
    public $cycle = false;

    const OP_PUT_ROLE            = 8002;
    const OP_PUT_ROLE_BASE       = 3012;
    const OP_GET_ROLE            = 8003;
    const OP_GET_ROLE_BASE       = 3013;
    const OP_PUT_ROLE_STATUS     = 3014;
    const OP_GET_ROLE_STATUS     = 3015;
    const OP_PUT_ROLE_EQUIPMENT  = 3016;
    const OP_GET_ROLE_INVENTORY  = 3053;
    const OP_GET_ROLE_EQUIPMENT  = 3017;
    const OP_PUT_ROLE_TASK       = 3018;
    const OP_GET_ROLE_STOREHOUSE = 3027;
    const OP_GET_ROLE_TASK       = 3019;
    const OP_PUT_ROLE_STOREHOUSE = 3026;
    const OP_PUT_ROLE_INVENTORY  = 3050;
    const OP_GET_RAW_TABLE       = 3055;

    private $struct_base = [
        'version' => 'byte',
        'id' => 'int',
        'name' => 'name',
        'race' => 'int',
        'cls' => 'int',
        'gender' => 'byte',
        'custom_data' => 'octets',
        'config_data' => 'octets',
        'custom_stamp' => 'int',
        'status' => 'byte',
        'delete_time' => 'int',
        'create_time' => 'int',
        'lastlogin_time' => 'int',
        'forbidcount' => 'cuint',
        'forbid' => [
            'type' => 'byte',
            'time' => 'int',
            'createtime' => 'int',
            'reason' => 'name',
        ],
        'help_states' => 'octets',
        'spouse' => 'int',
        'userid' => 'int',
        'cross_data' => 'octets',
        'reserved2' => 'byte',
        'reserved3' => 'byte',
        'reserved4' => 'byte',
    ];

    private $struct_status = [
        'sversion' => 'byte',
        'level' => 'int',
        'level2' => 'int',
        'exp' => 'int',
        'sp' => 'int',
        'pp' => 'int',
        'hp' => 'int',
        'mp' => 'int',
        'posx' => 'float',
        'posy' => 'float',
        'posz' => 'float',
        'worldtag' => 'int',
        'invader_state' => 'int',
        'invader_time' => 'int',
        'pariah_time' => 'int',
        'reputation' => 'int',
        'custom_status' => 'octets',
        'filter_data' => 'octets',
        'charactermode' => 'octets',
        'instancekeylist' => 'octets',
        'dbltime_expire' => 'int',
        'dbltime_mode' => 'int',
        'dbltime_begin' => 'int',
        'dbltime_used' => 'int',
        'dbltime_max' => 'int',
        'time_used' => 'int',
        'dbltime_data' => 'octets',
        'storesize' => 'short',
        'petcorral' => 'octets',
        'property' => 'octets',
        'var_data' => 'octets',
        'skills' => 'octets',
        'storehousepasswd' => 'octets',
        'waypointlist' => 'octets',
        'coolingtime' => 'octets',
        'npc_relation' => 'octets',
        'multi_exp_ctrl' => 'octets',
        'storage_task' => 'octets',
        'faction_contrib' => 'octets',
        'force_data' => 'octets',
        'online_award' => 'octets',
        'profit_time_data' => 'octets',
        'country_data' => 'octets',
        'king_data' => 'octets',
        'meridian_data' => 'octets',
        'extraprop' => 'octets',
        'title_data' => 'octets',
        'reincarnation_data' => 'octets',
        'realm_data' => 'octets',
        'reserved2' => 'byte',
        'reserved3' => 'byte',
    ];

    private $struct_db_base = [
        'version' => 'byte',
        'id' => 'int',
        'name' => 'octets',
        'race' => 'int',
        'cls' => 'int',
        'gender' => 'byte',
        'custom_data' => 'octets',
        'config_data' => 'octets',
        'custom_stamp' => 'int',
        'status' => 'byte',
        'delete_time' => 'int',
        'create_time' => 'int',
        'lastlogin_time' => 'int',
        'forbidcount' => 'cuint',
        'forbid' => [
            'type' => 'byte',
            'time' => 'int',
            'createtime' => 'int',
            'reason' => 'octets',
        ],
        'help_states' => 'octets',
        'spouse' => 'int',
        'userid' => 'int',
        'cross_data' => 'octets',
        'hd_custom_data' => 'octets',
        'reserved3' => 'byte',
        'reserved4' => 'byte',
    ];

    private $struct_inventory = [
        'icapacity' => 'int',
        'timestamp' => 'int',
        'money' => 'int',
        'invcount' => 'cuint',
        'inv' => [
            'id' => 'int',
            'pos' => 'int',
            'count' => 'int',
            'max_count' => 'int',
            'data' => 'octets',
            'proctype' => 'int',
            'expire_date' => 'int',
            'guid1' => 'int',
            'guid2' => 'int',
            'mask' => 'int',
        ],
        'reserved6' => 'int',
        'reserved7' => 'int',
    ];

    private $struct_equipment = [
        'eqpcount' => 'cuint',
        'eqp' => [
            'id' => 'int',
            'pos' => 'int',
            'count' => 'int',
            'max_count' => 'int',
            'data' => 'octets',
            'proctype' => 'int',
            'expire_date' => 'int',
            'guid1' => 'int',
            'guid2' => 'int',
            'mask' => 'int',
        ],
    ];

    private $struct_storehouse = [
        'capacity' => 'int',
        'money' => 'int',
        'storecount' => 'cuint',
        'store' => [
            'id' => 'int',
            'pos' => 'int',
            'count' => 'int',
            'max_count' => 'int',
            'data' => 'octets',
            'proctype' => 'int',
            'expire_date' => 'int',
            'guid1' => 'int',
            'guid2' => 'int',
            'mask' => 'int',
        ],
        'size1' => 'byte',
        'size2' => 'byte',
        'dresscount' => 'cuint',
        'dress' => [
            'id' => 'int',
            'pos' => 'int',
            'count' => 'int',
            'max_count' => 'int',
            'data' => 'octets',
            'proctype' => 'int',
            'expire_date' => 'int',
            'guid1' => 'int',
            'guid2' => 'int',
            'mask' => 'int',
        ],
        'materialcount' => 'cuint',
        'material' => [
            'id' => 'int',
            'pos' => 'int',
            'count' => 'int',
            'max_count' => 'int',
            'data' => 'octets',
            'proctype' => 'int',
            'expire_date' => 'int',
            'guid1' => 'int',
            'guid2' => 'int',
            'mask' => 'int',
        ],
        'size3' => 'byte',
        'generalcardcount' => 'cuint',
        'generalcard' => [
            'id' => 'int',
            'pos' => 'int',
            'count' => 'int',
            'max_count' => 'int',
            'data' => 'octets',
            'proctype' => 'int',
            'expire_date' => 'int',
            'guid1' => 'int',
            'guid2' => 'int',
            'mask' => 'int',
        ],
        'reserved' => 'short',
    ];

    private $struct_task = [
        'task_data' => 'octets',
        'task_complete' => 'octets',
        'task_finishtime' => 'octets',
        'task_inventorycount' => 'cuint',
        'task_inventory' => [
            'id' => 'int',
            'pos' => 'int',
            'count' => 'int',
            'max_count' => 'int',
            'data' => 'octets',
            'proctype' => 'int',
            'expire_date' => 'int',
            'guid1' => 'int',
            'guid2' => 'int',
            'mask' => 'int',
        ],
    ];

    private $struct_raw_read = [
        'handle' => 'octets',
        'Rawcount' => 'cuint',
        'Raw' => [
            'key' => 'octets',
            'value' => 'octets',
        ],
    ];

    private $struct_octets = [
        'var_data' => [
            'version' => 'lint',
            'pk_count' => 'lint',
            'pvp_cooldown' => 'lint',
            'pvp_flag' => 'byte',
            'dead_flag' => 'byte',
            'is_drop' => 'byte',
            'resurrect_state' => 'byte',
            'resurrect_exp_reduce' => 'float',
            'instance_hash_key1' => 'lint',
            'instance_hash_key2' => 'lint',
            'trashbox_size' => 'lint',
            'last_instance_timestamp' => 'lint',
            'last_instance_tag' => 'lint',
            'last_instance_pos' => [
                'x' => 'float',
                'y' => 'float',
                'z' => 'float',
            ],
            'dir' => 'lint',
            'resurrect_hp_factor' => 'float',
            'resurrect_mp_factor' => 'float',
        ],
        'property' => [
            'id' => 'lint',
            'hp' => 'lint',
            'mp' => 'lint',
            'damage_low' => 'lint',
            'damage_high' => 'lint',
            'damage_magic_low' => 'lint',
            'damage_magic_high' => 'lint',
            'defense' => 'lint',
            'resistance' => [
                1 => 'int',
                2 => 'int',
                3 => 'int',
                4 => 'int',
                5 => 'int',
            ],
            'attack' => 'lint',
            'armor' => 'lint',
            'attack_speed' => 'lint',
            'run_speed' => 'lint',
            'attack_degree' => 'lint',
            'defend_degree' => 'lint',
            'damage_reduce' => 'lint',
            'prayspeed' => 'lint',
            'crit_damage_bonus' => 'lint',
            'invisible_degree' => 'lint',
            'anti_invisible_degree' => 'lint',
        ],
        'force_data' => [
            'cur_force_id' => 'int',
            'forcecount' => 'cuint',
            'force' => [
                'force_id' => 'int',
                'reputation' => 'int',
                'contribution' => 'int',
            ],
        ],
        'faction_contrib' => [
            'consume_contrib' => 'lint',
            'exp_contrib' => 'lint',
            'cumulate_contrib' => 'lint',
        ],
        'title_data' => [
            'cur_title_id' => 'lshort',
        ],
    ];

    public function cuint($data)
    {
        if ($data < 0x80) {
            return strrev(pack('C', $data));
        }
        if ($data < 0x4000) {
            return strrev(pack('S', ($data | 0x8000)));
        }
        if ($data < 0x20000000) {
            return strrev(pack('I', ($data | 0xC0000000)));
        }
        return strrev(pack('c', -32) . pack('i', $data));
    }

    public function unpackCuint($data, &$p)
    {
        $hex = hexdec(bin2hex(substr($data, $p, 1)));
        $min = 0;
        if ($hex < 0x80) {
            $size = 1;
        } elseif ($hex < 0xC0) {
            $size = 2;
            $min = 0x8000;
        } elseif ($hex < 0xE0) {
            $size = 4;
            $min = 0xC0000000;
        } else {
            $p++;
            $size = 4;
        }
        $val = hexdec(bin2hex(substr($data, $p, $size)));
        $p += $size;
        return $val - $min;
    }

    public function packString($data)
    {
        $data = is_scalar($data) ? (string) $data : '';
        $data = iconv('UTF-8', 'UTF-16LE', $data);
        return $this->cuint(strlen($data)) . $data;
    }

    public function packInt($data)
    {
        return pack('N', intval($data));
    }

    public function packByte($data)
    {
        return pack('C', intval($data));
    }

    public function packFloat($data)
    {
        return strrev(pack('f', floatval($data)));
    }

    public function packShort($data)
    {
        return pack('n', intval($data));
    }

    public function packLongOctet($data)
    {
        return pack('n', strlen($data) + 32768) . $data;
    }

    public function packOctet($hex)
    {
        $binary = ($hex === '') ? '' : pack('H*', (string) $hex);
        return $this->cuint(strlen($binary)) . $binary;
    }

    public function unpackOctet($data, &$tmp)
    {
        $p = 0;
        $size = $this->unpackCuint($data, $p);
        $octet = bin2hex(substr($data, $p, $size));
        $tmp = $tmp + $p + $size;
        return $octet;
    }

    public function unpackString($data, &$tmp)
    {
        $size = (hexdec(bin2hex(substr($data, $tmp, 1))) >= 128) ? 2 : 1;
        $octetLen = (hexdec(bin2hex(substr($data, $tmp, $size))) >= 128)
            ? hexdec(bin2hex(substr($data, $tmp, $size))) - 32768
            : hexdec(bin2hex(substr($data, $tmp, $size)));

        $pp = $tmp;
        $tmp += $size + $octetLen;
        $value = substr($data, $pp + $size, $octetLen);

        if (function_exists('mb_convert_encoding')) {
            return mb_convert_encoding($value, 'UTF-8', 'UTF-16LE');
        }

        if (function_exists('iconv')) {
            return iconv('UTF-16LE', 'UTF-8//IGNORE', $value);
        }

        throw new Exception('Nem mbstring nem iconv estao disponiveis no PHP.');
    }

    public function createHeader($opcode, $data)
    {
        return $this->cuint($opcode) . $this->cuint(strlen($data)) . $data;
    }

    public function deleteHeader($data)
    {
        $length = 0;
        $this->unpackCuint($data, $length);
        $this->unpackCuint($data, $length);
        $length += 8;
        return substr($data, $length);
    }

    public function sendToGamedBD($data, $ip, $port)
    {
        if (!function_exists('socket_create')) {
            throw new Exception('Extensao PHP sockets nao instalada.');
        }

        $fp = @fsockopen($ip, $port, $errno, $errstr, 2);
        if (!$fp) {
            throw new Exception("Nao foi possivel conectar ao gamedbd ($ip:$port): $errstr");
        }

        $sock = socket_create(AF_INET, SOCK_STREAM, SOL_TCP);
        if (!$sock) {
            fclose($fp);
            throw new Exception('Falha ao criar socket');
        }

        socket_set_option($sock, SOL_SOCKET, SO_RCVTIMEO, ['sec' => 5, 'usec' => 0]);
        socket_set_option($sock, SOL_SOCKET, SO_SNDTIMEO, ['sec' => 5, 'usec' => 0]);

        if (!@socket_connect($sock, $ip, $port)) {
            socket_close($sock);
            fclose($fp);
            throw new Exception('Falha ao conectar socket ao gamedbd');
        }

        socket_send($sock, $data, strlen($data), 0);

        $response = '';
        $attempts = 0;

        while ($attempts < 10) {
            $attempts++;

            $packet = @socket_read($sock, 8, PHP_BINARY_READ);
            if ($packet === false || $packet === '') {
                break;
            }

            $tmpIdx = 0;
            $opcode = $this->unpackCuint($packet, $tmpIdx);
            $length = $this->unpackCuint($packet, $tmpIdx);
            $expected = $length + $tmpIdx;

            while (strlen($packet) < $expected) {
                $missing = $expected - strlen($packet);
                $more = @socket_read($sock, $missing, PHP_BINARY_READ);
                if ($more === false || $more === '') {
                    break;
                }
                $packet .= $more;
            }

            if ($opcode > 150) {
                $response = $packet;
                break;
            }
        }

        socket_close($sock);
        fclose($fp);

        if ($response === '') {
            throw new Exception('Resposta vazia do gamedbd');
        }

        return $response;
    }

    public function sendToGamedBDWithMeta($data, $ip, $port)
    {
        if (!function_exists('socket_create')) {
            throw new Exception('Extensao PHP sockets nao instalada.');
        }

        $fp = @fsockopen($ip, $port, $errno, $errstr, 2);
        if (!$fp) {
            throw new Exception("Nao foi possivel conectar ao gamedbd ($ip:$port): $errstr");
        }

        $sock = socket_create(AF_INET, SOCK_STREAM, SOL_TCP);
        if (!$sock) {
            fclose($fp);
            throw new Exception('Falha ao criar socket');
        }

        socket_set_option($sock, SOL_SOCKET, SO_RCVTIMEO, ['sec' => 5, 'usec' => 0]);
        socket_set_option($sock, SOL_SOCKET, SO_SNDTIMEO, ['sec' => 5, 'usec' => 0]);

        if (!@socket_connect($sock, $ip, $port)) {
            socket_close($sock);
            fclose($fp);
            throw new Exception('Falha ao conectar socket ao gamedbd');
        }

        socket_send($sock, $data, strlen($data), 0);

        $response = '';
        $meta = [];
        $attempts = 0;

        while ($attempts < 10) {
            $attempts++;

            $packet = @socket_read($sock, 8, PHP_BINARY_READ);
            if ($packet === false || $packet === '') {
                break;
            }

            $tmpIdx = 0;
            $opcode = $this->unpackCuint($packet, $tmpIdx);
            $length = $this->unpackCuint($packet, $tmpIdx);
            $expected = $length + $tmpIdx;

            while (strlen($packet) < $expected) {
                $missing = $expected - strlen($packet);
                $more = @socket_read($sock, $missing, PHP_BINARY_READ);
                if ($more === false || $more === '') {
                    break;
                }
                $packet .= $more;
            }

            $payload0 = substr($packet, $tmpIdx);
            $payload8 = (strlen($payload0) >= 8) ? substr($payload0, 8) : '';

            $meta[] = [
                'attempt' => $attempts,
                'opcode' => $opcode,
                'length' => $length,
                'header_size' => $tmpIdx,
                'packet_len' => strlen($packet),
                'packet_prefix' => substr(bin2hex($packet), 0, 96),
                'payload0_prefix' => substr(bin2hex($payload0), 0, 96),
                'payload8_prefix' => substr(bin2hex($payload8), 0, 96),
            ];

            if ($opcode > 150) {
                $response = $packet;
                break;
            }
        }

        socket_close($sock);
        fclose($fp);

        if ($response === '') {
            throw new Exception('Resposta vazia do gamedbd');
        }

        return [
            'packet_len' => strlen($response),
            'packet_prefix' => substr(bin2hex($response), 0, 256),
            'attempts' => $meta,
        ];
    }

    public function unmarshal(&$rb, $struct)
    {
        $data = [];

        foreach ($struct as $key => $val) {
            if (is_array($val)) {
                if ($this->cycle) {
                    $cycle = $this->cycle;
                    $this->cycle = false;
                    if ($cycle > 0) {
                        for ($i = 0; $i < $cycle; $i++) {
                            $data[$key][$i] = $this->unmarshal($rb, $val);
                            if (!$data[$key][$i]) {
                                return false;
                            }
                        }
                    }
                } else {
                    $data[$key] = $this->unmarshal($rb, $val);
                }
                continue;
            }

            $tmp = 0;
            if (!isset($rb) || strlen($rb) < 1) {
                return false;
            }

            switch ($val) {
                case 'int':
                    if (strlen($rb) < 4) {
                        return false;
                    }
                    $un = unpack('N', substr($rb, 0, 4));
                    $rb = substr($rb, 4);
                    $data[$key] = $un[1];
                    break;

                case 'byte':
                    if (strlen($rb) < 1) {
                        return false;
                    }
                    $un = unpack('C', substr($rb, 0, 1));
                    $rb = substr($rb, 1);
                    $data[$key] = $un[1];
                    break;

                case 'short':
                    if (strlen($rb) < 2) {
                        return false;
                    }
                    $un = unpack('n', substr($rb, 0, 2));
                    $rb = substr($rb, 2);
                    $data[$key] = $un[1];
                    break;

                case 'lint':
                    if (strlen($rb) < 4) {
                        return false;
                    }
                    $un = unpack('V', substr($rb, 0, 4));
                    $rb = substr($rb, 4);
                    $data[$key] = $un[1];
                    break;

                case 'lshort':
                    if (strlen($rb) < 2) {
                        return false;
                    }
                    $un = unpack('v', substr($rb, 0, 2));
                    $rb = substr($rb, 2);
                    $data[$key] = $un[1];
                    break;

                case 'float':
                    if (strlen($rb) < 4) {
                        return false;
                    }
                    $un = unpack('f', strrev(substr($rb, 0, 4)));
                    $rb = substr($rb, 4);
                    $data[$key] = $un[1];
                    break;

                case 'cuint':
                    $cui = $this->unpackCuint($rb, $tmp);
                    $rb = substr($rb, $tmp);
                    $this->cycle = ($cui > 0) ? $cui : -1;
                    break;

                case 'octets':
                    $data[$key] = $this->unpackOctet($rb, $tmp);
                    $rb = substr($rb, $tmp);
                    break;

                case 'name':
                    $data[$key] = $this->unpackString($rb, $tmp);
                    $rb = substr($rb, $tmp);
                    break;
            }

            if ($val !== 'cuint' && (!isset($data[$key]) || is_null($data[$key]))) {
                return false;
            }
        }

        return $data;
    }

    public function unmarshalTrace(&$rb, $struct, $path = '')
    {
        $data = [];

        foreach ($struct as $key => $val) {
            $fieldPath = ($path === '') ? (string) $key : ($path . '.' . $key);

            if (is_array($val)) {
                if ($this->cycle) {
                    $cycle = $this->cycle;
                    $this->cycle = false;

                    if ($cycle > 0) {
                        for ($i = 0; $i < $cycle; $i++) {
                            $itemPath = $fieldPath . '[' . $i . ']';
                            $item = $this->unmarshalTrace($rb, $val, $itemPath);
                            if (!$item['ok']) {
                                return $item;
                            }
                            $data[$key][$i] = $item['data'];
                        }
                    }
                } else {
                    $nested = $this->unmarshalTrace($rb, $val, $fieldPath);
                    if (!$nested['ok']) {
                        return $nested;
                    }
                    $data[$key] = $nested['data'];
                }
                continue;
            }

            $tmp = 0;
            if (!isset($rb) || strlen($rb) < 1) {
                return [
                    'ok' => false,
                    'error' => [
                        'path' => $fieldPath,
                        'reason' => 'buffer vazio',
                        'remaining_len' => strlen($rb),
                    ],
                ];
            }

            switch ($val) {
                case 'int':
                    if (strlen($rb) < 4) {
                        return [
                            'ok' => false,
                            'error' => [
                                'path' => $fieldPath,
                                'reason' => 'faltam 4 bytes para int',
                                'remaining_len' => strlen($rb),
                            ],
                        ];
                    }
                    $un = unpack('N', substr($rb, 0, 4));
                    $rb = substr($rb, 4);
                    $data[$key] = $un[1];
                    break;

                case 'byte':
                    if (strlen($rb) < 1) {
                        return [
                            'ok' => false,
                            'error' => [
                                'path' => $fieldPath,
                                'reason' => 'faltam 1 byte para byte',
                                'remaining_len' => strlen($rb),
                            ],
                        ];
                    }
                    $un = unpack('C', substr($rb, 0, 1));
                    $rb = substr($rb, 1);
                    $data[$key] = $un[1];
                    break;

                case 'short':
                    if (strlen($rb) < 2) {
                        return [
                            'ok' => false,
                            'error' => [
                                'path' => $fieldPath,
                                'reason' => 'faltam 2 bytes para short',
                                'remaining_len' => strlen($rb),
                            ],
                        ];
                    }
                    $un = unpack('n', substr($rb, 0, 2));
                    $rb = substr($rb, 2);
                    $data[$key] = $un[1];
                    break;

                case 'lint':
                    if (strlen($rb) < 4) {
                        return [
                            'ok' => false,
                            'error' => [
                                'path' => $fieldPath,
                                'reason' => 'faltam 4 bytes para lint',
                                'remaining_len' => strlen($rb),
                            ],
                        ];
                    }
                    $un = unpack('V', substr($rb, 0, 4));
                    $rb = substr($rb, 4);
                    $data[$key] = $un[1];
                    break;

                case 'lshort':
                    if (strlen($rb) < 2) {
                        return [
                            'ok' => false,
                            'error' => [
                                'path' => $fieldPath,
                                'reason' => 'faltam 2 bytes para lshort',
                                'remaining_len' => strlen($rb),
                            ],
                        ];
                    }
                    $un = unpack('v', substr($rb, 0, 2));
                    $rb = substr($rb, 2);
                    $data[$key] = $un[1];
                    break;

                case 'float':
                    if (strlen($rb) < 4) {
                        return [
                            'ok' => false,
                            'error' => [
                                'path' => $fieldPath,
                                'reason' => 'faltam 4 bytes para float',
                                'remaining_len' => strlen($rb),
                            ],
                        ];
                    }
                    $un = unpack('f', strrev(substr($rb, 0, 4)));
                    $rb = substr($rb, 4);
                    $data[$key] = $un[1];
                    break;

                case 'cuint':
                    $cui = $this->unpackCuint($rb, $tmp);
                    $rb = substr($rb, $tmp);
                    $this->cycle = ($cui > 0) ? $cui : -1;
                    break;

                case 'octets':
                    $data[$key] = $this->unpackOctet($rb, $tmp);
                    $rb = substr($rb, $tmp);
                    break;

                case 'name':
                    $data[$key] = $this->unpackString($rb, $tmp);
                    $rb = substr($rb, $tmp);
                    break;
            }

            if ($val !== 'cuint' && (!isset($data[$key]) || is_null($data[$key]))) {
                return [
                    'ok' => false,
                    'error' => [
                        'path' => $fieldPath,
                        'reason' => 'campo nulo apos decode',
                        'remaining_len' => strlen($rb),
                    ],
                ];
            }
        }

        return [
            'ok' => true,
            'data' => $data,
            'remaining_len' => strlen($rb),
        ];
    }

    public function marshal($pack, $struct)
    {
        $this->cycle = false;
        $data = '';

        foreach ($struct as $key => $val) {
            if (is_array($val)) {
                if ($this->cycle) {
                    $count = $this->cycle;
                    $this->cycle = false;

                    if ($count > 0) {
                        for ($i = 0; $i < $count; $i++) {
                            $item = array_value(array_value($pack, $key, []), $i, []);
                            $data .= $this->marshal(is_array($item) ? $item : [], $val);
                        }
                    }
                } else {
                    $nested = array_value($pack, $key, []);
                    $data .= $this->marshal(is_array($nested) ? $nested : [], $val);
                }
                continue;
            }

            switch ($val) {
                case 'int':
                    $data .= $this->packInt(array_value($pack, $key, 0));
                    break;

                case 'byte':
                    $data .= $this->packByte(array_value($pack, $key, 0));
                    break;

                case 'cuint':
                    $arrkey = substr($key, 0, -5);
                    $items = array_value($pack, $arrkey, []);
                    if (!is_array($items)) {
                        $items = [];
                    }
                    if (isset($items['id'])) {
                        $items = [$items];
                    }
                    $count = count($items);
                    $this->cycle = ($count > 0) ? $count : -1;
                    $data .= $this->cuint($count);
                    break;

                case 'octets':
                    $data .= $this->packOctet(array_value($pack, $key, ''));
                    break;

                case 'name':
                    $data .= $this->packString(array_value($pack, $key, ''));
                    break;

                case 'short':
                    $data .= $this->packShort(array_value($pack, $key, 0));
                    break;

                case 'float':
                    $data .= $this->packFloat(array_value($pack, $key, 0));
                    break;

                case 'cat1':
                case 'cat2':
                case 'cat4':
                    $data .= array_value($pack, $key, '');
                    break;
            }
        }

        return $data;
    }

    public function traceDecodeHexStruct($hex, $struct)
    {
        if (!is_string($hex) || $hex === '') {
            return [
                'ok' => false,
                'error' => [
                    'path' => '',
                    'reason' => 'hex vazio',
                    'remaining_len' => 0,
                ],
            ];
        }

        $binary = @hex2bin($hex);
        if ($binary === false || $binary === '') {
            return [
                'ok' => false,
                'error' => [
                    'path' => '',
                    'reason' => 'hex invalido',
                    'remaining_len' => 0,
                ],
            ];
        }

        $this->cycle = false;
        return $this->unmarshalTrace($binary, $struct, '');
    }

    public function getRoleBase($roleid, $ip, $port)
    {
        $pack = pack('N*', -1, $roleid);
        $pack = $this->createHeader(self::OP_GET_ROLE_BASE, $pack);
        $send = $this->sendToGamedBD($pack, $ip, $port);
        $data = $this->deleteHeader($send);
        $this->cycle = false;
        return $this->unmarshal($data, $this->struct_base);
    }

    public function getRoleStatus($roleid, $ip, $port)
    {
        $pack = pack('N*', -1, $roleid);
        $pack = $this->createHeader(self::OP_GET_ROLE_STATUS, $pack);
        $send = $this->sendToGamedBD($pack, $ip, $port);
        $data = $this->deleteHeader($send);
        $this->cycle = false;
        return $this->unmarshal($data, $this->struct_status);
    }

    public function getRoleInventory($roleid, $ip, $port)
    {
        $pack = pack('N*', -1, $roleid);
        $pack = $this->createHeader(self::OP_GET_ROLE_INVENTORY, $pack);
        $send = $this->sendToGamedBD($pack, $ip, $port);
        $data = $this->deleteHeader($send);
        $this->cycle = false;
        return $this->unmarshal($data, $this->struct_inventory);
    }

    public function getRoleEquipment($roleid, $ip, $port)
    {
        $pack = pack('N*', -1, $roleid);
        $pack = $this->createHeader(self::OP_GET_ROLE_EQUIPMENT, $pack);
        $send = $this->sendToGamedBD($pack, $ip, $port);
        $data = $this->deleteHeader($send);
        $this->cycle = false;
        return $this->unmarshal($data, $this->struct_equipment);
    }

    public function getRoleStorehouse($roleid, $ip, $port)
    {
        $pack = pack('N*', -1, $roleid);
        $pack = $this->createHeader(self::OP_GET_ROLE_STOREHOUSE, $pack);
        $send = $this->sendToGamedBD($pack, $ip, $port);
        $data = $this->deleteHeader($send);
        $this->cycle = false;
        return $this->unmarshal($data, $this->struct_storehouse);
    }

    public function getRoleTask($roleid, $ip, $port)
    {
        $pack = pack('N*', -1, $roleid);
        $pack = $this->createHeader(self::OP_GET_ROLE_TASK, $pack);
        $send = $this->sendToGamedBD($pack, $ip, $port);
        $data = $this->deleteHeader($send);
        $this->cycle = false;
        return $this->unmarshal($data, $this->struct_task);
    }

    private function decodeHexStruct($hex, $struct)
    {
        if (!is_string($hex) || $hex === '') {
            return null;
        }

        $binary = @hex2bin($hex);
        if ($binary === false || $binary === '') {
            return null;
        }

        $this->cycle = false;
        $decoded = $this->unmarshal($binary, $struct);
        return ($decoded === false) ? null : $decoded;
    }

    public function decodeStatusOctets(array $status)
    {
        $decoded = [];
        foreach ($this->struct_octets as $field => $struct) {
            $parsed = $this->decodeHexStruct(array_value($status, $field, ''), $struct);
            if ($parsed !== null) {
                $decoded[$field] = $parsed;
            }
        }
        return $decoded;
    }

    private function normalizeItemList($items)
    {
        if (!is_array($items) || empty($items)) {
            return [];
        }

        if (isset($items['id'])) {
            return [$items];
        }

        return array_values($items);
    }

    private function normalizeInventory($inventory)
    {
        if (!is_array($inventory)) {
            return [
                'capacity' => 0,
                'timestamp' => 0,
                'money' => 0,
                'items' => [],
            ];
        }

        return [
            'capacity' => intval(array_value($inventory, 'icapacity', 0)),
            'timestamp' => intval(array_value($inventory, 'timestamp', 0)),
            'money' => intval(array_value($inventory, 'money', 0)),
            'reserved6' => intval(array_value($inventory, 'reserved6', 0)),
            'reserved7' => intval(array_value($inventory, 'reserved7', 0)),
            'items' => $this->normalizeItemList(array_value($inventory, 'inv', [])),
        ];
    }

    private function normalizeEquipment($equipment)
    {
        if (!is_array($equipment)) {
            return ['items' => []];
        }

        return [
            'items' => $this->normalizeItemList(array_value($equipment, 'eqp', [])),
        ];
    }

    private function normalizeStorehouse($storehouse)
    {
        if (!is_array($storehouse)) {
            return [
                'capacity' => 0,
                'money' => 0,
                'items' => [],
                'dress' => [],
                'material' => [],
                'generalcard' => [],
            ];
        }

        return [
            'capacity' => intval(array_value($storehouse, 'capacity', 0)),
            'money' => intval(array_value($storehouse, 'money', 0)),
            'size1' => intval(array_value($storehouse, 'size1', 0)),
            'size2' => intval(array_value($storehouse, 'size2', 0)),
            'size3' => intval(array_value($storehouse, 'size3', 0)),
            'reserved' => intval(array_value($storehouse, 'reserved', 0)),
            'items' => $this->normalizeItemList(array_value($storehouse, 'store', [])),
            'dress' => $this->normalizeItemList(array_value($storehouse, 'dress', [])),
            'material' => $this->normalizeItemList(array_value($storehouse, 'material', [])),
            'generalcard' => $this->normalizeItemList(array_value($storehouse, 'generalcard', [])),
        ];
    }

    private function normalizeTask($task)
    {
        if (!is_array($task)) {
            return [
                'task_data' => '',
                'task_complete' => '',
                'task_finishtime' => '',
                'task_inventory' => [],
            ];
        }

        return [
            'task_data' => array_value($task, 'task_data', ''),
            'task_complete' => array_value($task, 'task_complete', ''),
            'task_finishtime' => array_value($task, 'task_finishtime', ''),
            'task_inventory' => $this->normalizeItemList(array_value($task, 'task_inventory', [])),
        ];
    }

    private function buildEditablePayload($roleid, $base, $status, $inventory, $equipment, $storehouse, $task = null)
    {
        $status = is_array($status) ? $status : [];
        $status['cultivation'] = cultivation_name(intval(array_value($status, 'level2', -1)));
        $status['decoded'] = $this->decodeStatusOctets($status);
        $classInfo = class_info(intval(array_value($base, 'cls', 0)));
        if (is_array($base)) {
            $base['class_name'] = array_value($classInfo, 'name', 'Desconhecida');
            $base['class_icon'] = array_value($classInfo, 'icon', 'todos.png');
            $base['class_icon_path'] = array_value($classInfo, 'icon_path', 'img/todos.png');
            $base['class_race'] = array_value($classInfo, 'race', 'Desconhecida');
            $base['class_info'] = $classInfo;
        }

        $normalizedInventory = $this->normalizeInventory($inventory);
        $normalizedEquipment = $this->normalizeEquipment($equipment);
        $normalizedStorehouse = $this->normalizeStorehouse($storehouse);

        $payload = [
            'roleid' => intval($roleid),
            'summary' => [
                'name' => array_value($base, 'name', ''),
                'cls' => intval(array_value($base, 'cls', 0)),
                'class_name' => array_value($classInfo, 'name', 'Desconhecida'),
                'class_icon' => array_value($classInfo, 'icon', 'todos.png'),
                'class_icon_path' => array_value($classInfo, 'icon_path', 'img/todos.png'),
                'class_race' => array_value($classInfo, 'race', 'Desconhecida'),
                'race' => intval(array_value($base, 'race', 0)),
                'gender' => intval(array_value($base, 'gender', 0)),
                'level' => intval(array_value($status, 'level', 0)),
                'level2' => intval(array_value($status, 'level2', 0)),
                'cultivation' => $status['cultivation'],
                'reputation' => intval(array_value($status, 'reputation', 0)),
                'inventory_money' => intval(array_value($normalizedInventory, 'money', 0)),
                'inventory_items' => count(array_value($normalizedInventory, 'items', [])),
                'equipment_items' => count(array_value($normalizedEquipment, 'items', [])),
                'storehouse_items' => count(array_value($normalizedStorehouse, 'items', [])),
            ],
            'base' => $base,
            'status' => $status,
            'inventory' => $normalizedInventory,
            'equipment' => $normalizedEquipment,
            'storehouse' => $normalizedStorehouse,
            'class_info' => $classInfo,
        ];

        if ($task !== null) {
            $payload['task'] = $this->normalizeTask($task);
        }

        return $payload;
    }

    public function getFullRole($roleid, $ip, $port)
    {
        $base = $this->getRoleBase($roleid, $ip, $port);
        if (!$base) {
            return false;
        }

        $status = $this->getRoleStatus($roleid, $ip, $port);
        $classInfo = class_info(intval(array_value($base, 'cls', 0)));

        return [
            'roleid' => intval($roleid),
            'name' => array_value($base, 'name', ''),
            'cls' => intval(array_value($base, 'cls', 0)),
            'class_name' => array_value($classInfo, 'name', 'Desconhecida'),
            'class_icon' => array_value($classInfo, 'icon', 'todos.png'),
            'class_icon_path' => array_value($classInfo, 'icon_path', 'img/todos.png'),
            'class_race' => array_value($classInfo, 'race', 'Desconhecida'),
            'class_info' => $classInfo,
            'race' => intval(array_value($base, 'race', 0)),
            'gender' => intval(array_value($base, 'gender', 0)),
            'level' => $status ? intval(array_value($status, 'level', 0)) : 0,
            'level2' => $status ? intval(array_value($status, 'level2', 0)) : 0,
        ];
    }

    public function getEditableRole($roleid, $ip, $port)
    {
        $base = $this->getRoleBase($roleid, $ip, $port);
        if (!$base) {
            return false;
        }

        $status = $this->getRoleStatus($roleid, $ip, $port) ?: [];
        $inventory = $this->getRoleInventory($roleid, $ip, $port) ?: [];
        $equipment = $this->getRoleEquipment($roleid, $ip, $port) ?: [];
        $storehouse = $this->getRoleStorehouse($roleid, $ip, $port) ?: [];
        $task = $this->getRoleTask($roleid, $ip, $port) ?: [];

        return $this->buildEditablePayload($roleid, $base, $status, $inventory, $equipment, $storehouse, $task);
    }

    public function getRawTable($table, $ip, $port, $handler = '', $key = '')
    {
        $pack = pack('N*', -1)
            . $this->packLongOctet($table)
            . $this->packOctet($handler)
            . $this->packOctet($key);

        $pack = $this->createHeader(self::OP_GET_RAW_TABLE, $pack);
        $send = $this->sendToGamedBD($pack, $ip, $port);
        $data = $this->deleteHeader($send);
        $this->cycle = false;
        return $this->unmarshal($data, $this->struct_raw_read);
    }

    private function getClsconfigStruct()
    {
        return [
            'version' => 'byte',
            'base' => $this->struct_db_base,
            'status' => $this->struct_status,
            'inventory' => $this->struct_inventory,
            'equipment' => $this->struct_equipment,
            'storehouse' => $this->struct_storehouse,
        ];
    }

    private function getWholeRoleStruct()
    {
        return [
            'base' => $this->struct_base,
            'status' => $this->struct_status,
            'pocket' => $this->struct_inventory,
            'equipment' => $this->struct_equipment,
            'storehouse' => $this->struct_storehouse,
            'task' => $this->struct_task,
        ];
    }

    private function shouldUseWholeRolePut()
    {
        $version = strtolower(trim((string) array_value($GLOBALS['CONFIG'], 'game_version', '')));
        return !in_array($version, ['7', '07', 'v7', 'v07'], true);
    }

    private function decodeClsconfigRows($rows, $source)
    {
        $entries = [];
        $structClsconfig = $this->getClsconfigStruct();

        foreach ($rows as $row) {
            $decoded = $this->decodeHexStruct(array_value($row, 'value', ''), $structClsconfig);
            if (!is_array($decoded) || empty($decoded['base'])) {
                continue;
            }

            $roleid = intval(array_value(array_value($decoded, 'base', []), 'id', 0));
            if (!$this->isAllowedClsconfigTemplateRoleId($roleid)) {
                continue;
            }

            $decoded['base']['name'] = decode_octet_text(array_value($decoded['base'], 'name', ''));

            $entries[] = [
                'source' => $source,
                'key_hex' => array_value($row, 'key', ''),
                'version' => intval(array_value($decoded, 'version', 0)),
                'template' => $this->buildEditablePayload(
                    $roleid,
                    $decoded['base'],
                    array_value($decoded, 'status', []),
                    array_value($decoded, 'inventory', []),
                    array_value($decoded, 'equipment', []),
                    array_value($decoded, 'storehouse', []),
                    null
                ),
            ];
        }

        return $entries;
    }

    private function decodeRoleIdFromHexKey($hex)
    {
        $hex = strtolower(trim((string) $hex));
        if ($hex === '' || strlen($hex) < 8 || preg_match('/^[0-9a-f]+$/', $hex) !== 1) {
            return 0;
        }

        $bin = @hex2bin(substr($hex, 0, 8));
        if ($bin === false || strlen($bin) !== 4) {
            return 0;
        }

        $un = unpack('Nroleid', $bin);
        return intval($un['roleid']);
    }

    private function getAllowedClsconfigTemplateRoleIds()
    {
        $configured = array_value($GLOBALS['CONFIG'], 'clsconfig_template_roleids', []);
        if (!is_array($configured) || empty($configured)) {
            return [];
        }

        $allowed = [];
        foreach ($configured as $roleid) {
            $roleid = intval($roleid);
            if ($roleid > 0) {
                $allowed[$roleid] = $roleid;
            }
        }

        return $allowed;
    }

    private function isAllowedClsconfigTemplateRoleId($roleid)
    {
        $allowed = $this->getAllowedClsconfigTemplateRoleIds();
        if (empty($allowed)) {
            return true;
        }

        return isset($allowed[intval($roleid)]);
    }

    private function extractRoleIdsFromClsconfigRows($rows)
    {
        if (!is_array($rows) || empty($rows)) {
            return [];
        }

        $roleids = [];
        foreach ($rows as $row) {
            $roleid = $this->decodeRoleIdFromHexKey(array_value($row, 'key', ''));
            if ($roleid > 0 && $this->isAllowedClsconfigTemplateRoleId($roleid)) {
                $roleids[$roleid] = $roleid;
            }
        }

        sort($roleids, SORT_NUMERIC);
        return array_values($roleids);
    }

    private function buildClsconfigRoleEntries($roleids, $rowsByRoleId, $ip, $port)
    {
        $entries = [];

        foreach ($roleids as $roleid) {
            $template = $this->getEditableRole($roleid, $ip, $port);
            if (!$template) {
                continue;
            }

            $row = isset($rowsByRoleId[$roleid]) ? $rowsByRoleId[$roleid] : [];
            $entries[] = [
                'source' => 'clsconfig_roleid',
                'key_hex' => array_value($row, 'key', ''),
                'version' => 0,
                'template' => $template,
            ];
        }

        return $entries;
    }

    private function parseDbDumpOutput($lines)
    {
        if (!is_array($lines) || empty($lines)) {
            return [];
        }

        $inData = false;
        $hexLines = [];

        foreach ($lines as $line) {
            $line = trim((string) $line);

            if ($line === 'HEADER=END') {
                $inData = true;
                continue;
            }

            if ($line === 'DATA=END') {
                break;
            }

            if (!$inData || $line === '') {
                continue;
            }

            if (preg_match('/^[0-9A-Fa-f]+$/', $line)) {
                $hexLines[] = strtolower($line);
            }
        }

        $rows = [];
        $count = count($hexLines);
        for ($i = 0; $i + 1 < $count; $i += 2) {
            $rows[] = [
                'key' => $hexLines[$i],
                'value' => $hexLines[$i + 1],
            ];
        }

        return $rows;
    }

    private function getClsconfigRowsFromLocalDump(&$debug = null)
    {
        $debug = [
            'used_command' => '',
            'used_path' => '',
            'attempts' => [],
        ];

        if (!function_exists('exec')) {
            $debug['error'] = 'exec() desabilitado no PHP';
            return [];
        }

        $paths = [
            '/home/gamedbd/dbdata/clsconfig',
            '/home/gamedbd/clsconfig',
            '/gamedbd/dbdata/clsconfig',
            '/gamedbd/clsconfig',
        ];

        $commands = [
            'db_dump',
            '/usr/bin/db_dump',
            'db5.3_dump',
            '/usr/bin/db5.3_dump',
            'db4.8_dump',
            '/usr/bin/db4.8_dump',
            'db4_dump',
            '/usr/bin/db4_dump',
        ];

        foreach ($paths as $path) {
            if (!file_exists($path) || !is_readable($path)) {
                $debug['attempts'][] = [
                    'path' => $path,
                    'status' => 'unreadable',
                ];
                continue;
            }

            foreach ($commands as $command) {
                $output = [];
                $exitCode = 0;
                @exec($command . ' -p ' . escapeshellarg($path) . ' 2>&1', $output, $exitCode);

                $rows = ($exitCode === 0) ? $this->parseDbDumpOutput($output) : [];
                $debug['attempts'][] = [
                    'path' => $path,
                    'command' => $command,
                    'exit_code' => $exitCode,
                    'row_count' => count($rows),
                    'sample' => isset($output[0]) ? $output[0] : '',
                ];

                if (!empty($rows)) {
                    $debug['used_command'] = $command;
                    $debug['used_path'] = $path;
                    return $rows;
                }
            }
        }

        return [];
    }

    public function exportClsconfig($workdir, $command, $attempts = 1, $retryDelayUs = 0)
    {
        if (!function_exists('exec')) {
            throw new Exception('exec() desabilitado no PHP');
        }

        $workdir = is_string($workdir) ? trim($workdir) : '';
        $command = is_string($command) ? trim($command) : '';
        $attempts = max(1, intval($attempts));
        $retryDelayUs = max(0, intval($retryDelayUs));

        if ($workdir === '' || !is_dir($workdir)) {
            throw new Exception('Diretorio do exportclsconfig invalido: ' . $workdir);
        }

        if ($command === '') {
            throw new Exception('Comando do exportclsconfig nao configurado');
        }

        $previousDir = getcwd();
        if (!@chdir($workdir)) {
            throw new Exception('Nao foi possivel acessar o diretorio do exportclsconfig: ' . $workdir);
        }

        $attemptResults = [];
        $lastOutput = [];
        $lastExitCode = 0;

        try {
            for ($attempt = 1; $attempt <= $attempts; $attempt++) {
                $output = [];
                $exitCode = 0;
                @exec($command . ' 2>&1', $output, $exitCode);

                $lastOutput = $output;
                $lastExitCode = $exitCode;
                $attemptResults[] = [
                    'attempt' => $attempt,
                    'exit_code' => $exitCode,
                    'output' => $output,
                ];

                if ($exitCode === 0) {
                    break;
                }

                if ($attempt < $attempts && $retryDelayUs > 0) {
                    usleep($retryDelayUs);
                }
            }
        } finally {
            if ($previousDir !== false) {
                @chdir($previousDir);
            }
        }

        $success = ($lastExitCode === 0);

        $result = [
            'workdir' => $workdir,
            'command' => $command,
            'exit_code' => $lastExitCode,
            'attempts' => count($attemptResults),
            'output' => $lastOutput,
            'attempt_results' => $attemptResults,
        ];

        if (!$success) {
            $summary = trim(implode("\n", array_slice($lastOutput, 0, 10)));
            $attemptSummary = [];
            foreach ($attemptResults as $attemptResult) {
                $attemptSummary[] = '#' . array_value($attemptResult, 'attempt', 0) . '=' . array_value($attemptResult, 'exit_code', 0);
            }
            $context = 'exit code ' . $lastExitCode
                . ', attempts ' . implode(',', $attemptSummary)
                . ', workdir ' . $workdir
                . ', command ' . $command;
            throw new Exception(
                $summary !== ''
                    ? 'exportclsconfig falhou (' . $context . '): ' . $summary
                    : 'exportclsconfig falhou (' . $context . ')'
            );
        }

        return $result;
    }

    public function exportClsconfigDeferred($workdir, $command, $delaySeconds, $logDir)
    {
        if (!function_exists('exec')) {
            throw new Exception('exec() desabilitado no PHP');
        }

        $workdir = is_string($workdir) ? trim($workdir) : '';
        $command = is_string($command) ? trim($command) : '';
        $delaySeconds = max(0, intval($delaySeconds));
        $logDir = is_string($logDir) ? trim($logDir) : '';

        if ($workdir === '' || !is_dir($workdir)) {
            throw new Exception('Diretorio do exportclsconfig invalido: ' . $workdir);
        }

        if ($command === '') {
            throw new Exception('Comando do exportclsconfig nao configurado');
        }

        if ($logDir === '') {
            throw new Exception('Diretorio de log do exportclsconfig nao configurado');
        }

        if (!is_dir($logDir) && !@mkdir($logDir, 0750, true)) {
            throw new Exception('Nao foi possivel criar diretorio de log do exportclsconfig: ' . $logDir);
        }

        if (!is_writable($logDir)) {
            throw new Exception('Diretorio de log do exportclsconfig sem permissao de escrita: ' . $logDir);
        }

        $timestamp = date('Ymd-His');
        $suffix = substr(sha1(microtime(true) . random_int(1000, 9999)), 0, 8);
        $logFile = rtrim($logDir, '/\\') . DIRECTORY_SEPARATOR . 'exportclsconfig-' . $timestamp . '-' . $suffix . '.log';
        $script = 'cd ' . escapeshellarg($workdir)
            . ' && sleep ' . $delaySeconds
            . ' && ' . $command
            . ' > ' . escapeshellarg($logFile) . ' 2>&1';
        $shellCommand = 'nohup /bin/sh -c ' . escapeshellarg($script) . ' >/dev/null 2>&1 & echo $!';

        $output = [];
        $exitCode = 0;
        @exec($shellCommand, $output, $exitCode);

        if ($exitCode !== 0) {
            throw new Exception('Falha ao agendar exportclsconfig em background, exit code ' . $exitCode);
        }

        return [
            'mode' => 'deferred',
            'scheduled' => true,
            'delay_seconds' => $delaySeconds,
            'pid' => isset($output[0]) ? trim((string) $output[0]) : '',
            'workdir' => $workdir,
            'command' => $command,
            'log_file' => $logFile,
        ];
    }

    private function isAssocArray($value)
    {
        if (!is_array($value)) {
            return false;
        }

        if ($value === []) {
            return false;
        }

        $keys = array_keys($value);
        return $keys !== range(0, count($keys) - 1);
    }

    private function mergeEditableValue($current, $incoming)
    {
        if (!is_array($incoming)) {
            return $incoming;
        }

        if (!is_array($current)) {
            return $incoming;
        }

        if (!$this->isAssocArray($incoming) || !$this->isAssocArray($current)) {
            return $incoming;
        }

        $merged = $current;
        foreach ($incoming as $key => $value) {
            if (array_key_exists($key, $merged)) {
                $merged[$key] = $this->mergeEditableValue($merged[$key], $value);
            } else {
                $merged[$key] = $value;
            }
        }

        return $merged;
    }

    private function shouldApplySummaryField($payload, $current, $summaryKey, $section, $sectionKey)
    {
        $summary = array_value($payload, 'summary', []);
        if (!is_array($summary) || !array_key_exists($summaryKey, $summary)) {
            return false;
        }

        $sectionPayload = array_value($payload, $section, []);
        if (!is_array($sectionPayload) || !array_key_exists($sectionKey, $sectionPayload)) {
            return true;
        }

        $currentSection = array_value($current, $section, []);
        $currentSummary = array_value($current, 'summary', []);
        $targetValue = array_value($sectionPayload, $sectionKey, null);
        $currentTarget = is_array($currentSection) ? array_value($currentSection, $sectionKey, null) : null;
        $summaryValue = array_value($summary, $summaryKey, null);
        $currentSummaryValue = is_array($currentSummary) ? array_value($currentSummary, $summaryKey, null) : null;

        return $this->valuesMatchForVerification($targetValue, $currentTarget)
            && !$this->valuesMatchForVerification($summaryValue, $currentSummaryValue);
    }

    private function expandEditableSummaryPayload(array $payload, array $current)
    {
        $maps = [
            ['name', 'base', 'name'],
            ['cls', 'base', 'cls'],
            ['race', 'base', 'race'],
            ['gender', 'base', 'gender'],
            ['level', 'status', 'level'],
            ['level2', 'status', 'level2'],
            ['reputation', 'status', 'reputation'],
            ['inventory_money', 'inventory', 'money'],
        ];

        foreach ($maps as $map) {
            list($summaryKey, $section, $sectionKey) = $map;
            if (!$this->shouldApplySummaryField($payload, $current, $summaryKey, $section, $sectionKey)) {
                continue;
            }

            if (!isset($payload[$section]) || !is_array($payload[$section])) {
                $payload[$section] = [];
            }
            $payload[$section][$sectionKey] = array_value(array_value($payload, 'summary', []), $summaryKey, null);
        }

        return $payload;
    }

    private function normalizeHex($value)
    {
        if (!is_scalar($value)) {
            return '';
        }

        $hex = preg_replace('/[^0-9a-f]/i', '', (string) $value);
        if (!is_string($hex) || $hex === '') {
            return '';
        }

        if ((strlen($hex) % 2) !== 0) {
            $hex = '0' . $hex;
        }

        return strtolower($hex);
    }

    private function sanitizeFields($source, array $spec)
    {
        $source = is_array($source) ? $source : [];
        $result = [];

        foreach ($spec as $field => $type) {
            $value = array_value($source, $field, null);

            switch ($type) {
                case 'int':
                    $result[$field] = intval($value);
                    break;

                case 'float':
                    $result[$field] = floatval($value);
                    break;

                case 'string':
                    $result[$field] = is_scalar($value) ? (string) $value : '';
                    break;

                case 'hex':
                    $result[$field] = $this->normalizeHex($value);
                    break;
            }
        }

        return $result;
    }

    private function sanitizeEditableItems($items)
    {
        $items = $this->normalizeItemList($items);
        $result = [];

        foreach ($items as $item) {
            if (!is_array($item)) {
                continue;
            }

            $result[] = $this->sanitizeFields($item, [
                'id' => 'int',
                'pos' => 'int',
                'count' => 'int',
                'max_count' => 'int',
                'data' => 'hex',
                'proctype' => 'int',
                'expire_date' => 'int',
                'guid1' => 'int',
                'guid2' => 'int',
                'mask' => 'int',
            ]);
        }

        return $result;
    }

    private function sanitizeEditableBase($base, $roleid)
    {
        $source = is_array($base) ? $base : [];
        $base = $this->sanitizeFields($source, [
            'version' => 'int',
            'id' => 'int',
            'name' => 'string',
            'race' => 'int',
            'cls' => 'int',
            'gender' => 'int',
            'custom_data' => 'hex',
            'config_data' => 'hex',
            'custom_stamp' => 'int',
            'status' => 'int',
            'delete_time' => 'int',
            'create_time' => 'int',
            'lastlogin_time' => 'int',
            'help_states' => 'hex',
            'spouse' => 'int',
            'userid' => 'int',
            'cross_data' => 'hex',
            'reserved2' => 'int',
            'reserved3' => 'int',
            'reserved4' => 'int',
        ]);

        $base['id'] = intval($roleid);
        $base['forbid'] = [];

        $forbid = array_value($source, 'forbid', []);
        if (is_array($forbid) && isset($forbid['type'])) {
            $forbid = [$forbid];
        }
        $forbid = is_array($forbid) ? array_values($forbid) : [];
        foreach ($forbid as $entry) {
            if (!is_array($entry)) {
                continue;
            }

            $base['forbid'][] = $this->sanitizeFields($entry, [
                'type' => 'int',
                'time' => 'int',
                'createtime' => 'int',
                'reason' => 'string',
            ]);
        }

        return $base;
    }

    private function sanitizeEditableStatus($status)
    {
        return $this->sanitizeFields($status, [
            'sversion' => 'int',
            'level' => 'int',
            'level2' => 'int',
            'exp' => 'int',
            'sp' => 'int',
            'pp' => 'int',
            'hp' => 'int',
            'mp' => 'int',
            'posx' => 'float',
            'posy' => 'float',
            'posz' => 'float',
            'worldtag' => 'int',
            'invader_state' => 'int',
            'invader_time' => 'int',
            'pariah_time' => 'int',
            'reputation' => 'int',
            'custom_status' => 'hex',
            'filter_data' => 'hex',
            'charactermode' => 'hex',
            'instancekeylist' => 'hex',
            'dbltime_expire' => 'int',
            'dbltime_mode' => 'int',
            'dbltime_begin' => 'int',
            'dbltime_used' => 'int',
            'dbltime_max' => 'int',
            'time_used' => 'int',
            'dbltime_data' => 'hex',
            'storesize' => 'int',
            'petcorral' => 'hex',
            'property' => 'hex',
            'var_data' => 'hex',
            'skills' => 'hex',
            'storehousepasswd' => 'hex',
            'waypointlist' => 'hex',
            'coolingtime' => 'hex',
            'npc_relation' => 'hex',
            'multi_exp_ctrl' => 'hex',
            'storage_task' => 'hex',
            'faction_contrib' => 'hex',
            'force_data' => 'hex',
            'online_award' => 'hex',
            'profit_time_data' => 'hex',
            'country_data' => 'hex',
            'king_data' => 'hex',
            'meridian_data' => 'hex',
            'extraprop' => 'hex',
            'title_data' => 'hex',
            'reincarnation_data' => 'hex',
            'realm_data' => 'hex',
            'reserved2' => 'int',
            'reserved3' => 'int',
        ]);
    }

    private function sanitizeEditableInventory($inventory)
    {
        $inventory = is_array($inventory) ? $inventory : [];

        return [
            'icapacity' => intval(array_value($inventory, 'capacity', 0)),
            'timestamp' => intval(array_value($inventory, 'timestamp', 0)),
            'money' => intval(array_value($inventory, 'money', 0)),
            'inv' => $this->sanitizeEditableItems(array_value($inventory, 'items', [])),
            'reserved6' => intval(array_value($inventory, 'reserved6', 0)),
            'reserved7' => intval(array_value($inventory, 'reserved7', 0)),
        ];
    }

    private function sanitizeEditableEquipment($equipment)
    {
        $equipment = is_array($equipment) ? $equipment : [];

        return [
            'eqp' => $this->sanitizeEditableItems(array_value($equipment, 'items', [])),
        ];
    }

    private function sanitizeEditableStorehouse($storehouse)
    {
        $storehouse = is_array($storehouse) ? $storehouse : [];

        return [
            'capacity' => intval(array_value($storehouse, 'capacity', 0)),
            'money' => intval(array_value($storehouse, 'money', 0)),
            'store' => $this->sanitizeEditableItems(array_value($storehouse, 'items', [])),
            'size1' => intval(array_value($storehouse, 'size1', 0)),
            'size2' => intval(array_value($storehouse, 'size2', 0)),
            'dress' => $this->sanitizeEditableItems(array_value($storehouse, 'dress', [])),
            'material' => $this->sanitizeEditableItems(array_value($storehouse, 'material', [])),
            'size3' => intval(array_value($storehouse, 'size3', 0)),
            'generalcard' => $this->sanitizeEditableItems(array_value($storehouse, 'generalcard', [])),
            'reserved' => intval(array_value($storehouse, 'reserved', 0)),
        ];
    }

    private function sanitizeEditableTask($task)
    {
        $task = is_array($task) ? $task : [];

        return [
            'task_data' => $this->normalizeHex(array_value($task, 'task_data', '')),
            'task_complete' => $this->normalizeHex(array_value($task, 'task_complete', '')),
            'task_finishtime' => $this->normalizeHex(array_value($task, 'task_finishtime', '')),
            'task_inventory' => $this->sanitizeEditableItems(array_value($task, 'task_inventory', [])),
        ];
    }

    private function valuesMatchForVerification($expected, $actual)
    {
        if (is_numeric($expected) && is_numeric($actual)) {
            return abs(floatval($expected) - floatval($actual)) < 0.0001;
        }

        return (string) $expected === (string) $actual;
    }

    private function shouldSkipPersistenceVerification($prefix, $key, $value)
    {
        $commonSkipKeys = ['class_info', 'decoded'];
        if (in_array($key, $commonSkipKeys, true)) {
            return true;
        }

        $rawBaseKeys = ['custom_data', 'config_data', 'help_states', 'cross_data'];
        if ($prefix === 'base' && in_array($key, $rawBaseKeys, true)) {
            return true;
        }

        $rawStatusKeys = [
            'custom_status',
            'filter_data',
            'charactermode',
            'instancekeylist',
            'dbltime_data',
            'petcorral',
            'property',
            'var_data',
            'skills',
            'storehousepasswd',
            'waypointlist',
            'coolingtime',
            'npc_relation',
            'multi_exp_ctrl',
            'storage_task',
            'faction_contrib',
            'force_data',
            'online_award',
            'profit_time_data',
            'country_data',
            'king_data',
            'meridian_data',
            'extraprop',
            'title_data',
            'reincarnation_data',
            'realm_data',
            'cultivation',
        ];
        if ($prefix === 'status' && in_array($key, $rawStatusKeys, true)) {
            return true;
        }

        return false;
    }

    private function collectScalarPersistenceMismatches($expected, $actual, $prefix, array &$mismatches)
    {
        if (count($mismatches) >= 10 || !is_array($expected)) {
            return;
        }

        foreach ($expected as $key => $value) {
            if ($this->shouldSkipPersistenceVerification($prefix, $key, $value)) {
                continue;
            }

            $path = ($prefix === '') ? (string) $key : $prefix . '.' . $key;

            if (is_array($value)) {
                continue;
            }

            if (!is_scalar($value) && $value !== null) {
                continue;
            }

            $actualValue = is_array($actual) ? array_value($actual, $key, null) : null;
            if (!$this->valuesMatchForVerification($value, $actualValue)) {
                $mismatches[] = [
                    'path' => $path,
                    'expected' => $value,
                    'actual' => $actualValue,
                ];
            }
        }
    }

    private function verifyEditableRolePersisted(array $payload, array $freshRole)
    {
        $mismatches = [];

        foreach (['base', 'status'] as $section) {
            $expected = array_value($payload, $section, null);
            if (!is_array($expected)) {
                continue;
            }

            $actual = array_value($freshRole, $section, []);
            $this->collectScalarPersistenceMismatches($expected, $actual, $section, $mismatches);
        }

        return $mismatches;
    }

    public function createEditableRoleBackup($roleid, array $current, array $requestedPayload, $backupDir)
    {
        $backupDir = is_string($backupDir) ? trim($backupDir) : '';
        if ($backupDir === '') {
            throw new Exception('Diretorio de backup nao configurado');
        }

        if (!is_dir($backupDir) && !@mkdir($backupDir, 0750, true)) {
            throw new Exception('Nao foi possivel criar diretorio de backup: ' . $backupDir);
        }

        if (!is_writable($backupDir)) {
            throw new Exception('Diretorio de backup sem permissao de escrita: ' . $backupDir);
        }

        $timestamp = date('Ymd-His');
        $suffix = substr(sha1($roleid . microtime(true) . random_int(1000, 9999)), 0, 8);
        $file = rtrim($backupDir, '/\\') . DIRECTORY_SEPARATOR . 'roleid-' . intval($roleid) . '-' . $timestamp . '-' . $suffix . '.json';

        $payload = [
            'backup_version' => 1,
            'created_at' => date('c'),
            'roleid' => intval($roleid),
            'reason' => 'before_save_clsconfig_template',
            'template' => $current,
            'requested_payload' => $requestedPayload,
        ];

        $flags = JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT;
        if (defined('JSON_INVALID_UTF8_SUBSTITUTE')) {
            $flags |= JSON_INVALID_UTF8_SUBSTITUTE;
        }

        $json = json_encode($payload, $flags);
        if ($json === false) {
            throw new Exception('Falha ao gerar JSON do backup: ' . (function_exists('json_last_error_msg') ? json_last_error_msg() : 'json_encode falhou'));
        }

        if (@file_put_contents($file, $json . "\n", LOCK_EX) === false) {
            throw new Exception('Falha ao gravar backup: ' . $file);
        }

        return [
            'file' => $file,
            'roleid' => intval($roleid),
            'created_at' => $payload['created_at'],
            'bytes' => filesize($file),
        ];
    }

    public function createClsconfigFileBackup($roleid, $sourceFile, $backupDir)
    {
        $sourceFile = is_string($sourceFile) ? trim($sourceFile) : '';
        $backupDir = is_string($backupDir) ? trim($backupDir) : '';

        if ($sourceFile === '') {
            throw new Exception('Arquivo clsconfig de origem nao configurado');
        }

        if (!is_file($sourceFile) || !is_readable($sourceFile)) {
            throw new Exception('Arquivo clsconfig de origem inacessivel: ' . $sourceFile);
        }

        if ($backupDir === '') {
            throw new Exception('Diretorio de backup do arquivo clsconfig nao configurado');
        }

        if (!is_dir($backupDir) && !@mkdir($backupDir, 0750, true)) {
            throw new Exception('Nao foi possivel criar diretorio de backup do arquivo clsconfig: ' . $backupDir);
        }

        if (!is_writable($backupDir)) {
            throw new Exception('Diretorio de backup do arquivo clsconfig sem permissao de escrita: ' . $backupDir);
        }

        $timestamp = date('Ymd-His');
        $suffix = substr(sha1($sourceFile . $roleid . microtime(true) . random_int(1000, 9999)), 0, 8);
        $backupFile = rtrim($backupDir, '/\\') . DIRECTORY_SEPARATOR . 'clsconfig-roleid-' . intval($roleid) . '-' . $timestamp . '-' . $suffix;

        if (!@copy($sourceFile, $backupFile)) {
            throw new Exception('Falha ao copiar arquivo clsconfig para backup: ' . $backupFile);
        }

        @chmod($backupFile, 0640);

        return [
            'file' => $backupFile,
            'source_file' => $sourceFile,
            'roleid' => intval($roleid),
            'created_at' => date('c'),
            'bytes' => filesize($backupFile),
            'sha1' => function_exists('sha1_file') ? sha1_file($backupFile) : '',
        ];
    }

    public function prepareEditableRoleForSave($roleid, array $payload, $ip, $port, $current = null)
    {
        if ($current === null) {
            $current = $this->getEditableRole($roleid, $ip, $port);
        }
        if (!$current) {
            throw new Exception('Template base nao encontrado para roleid ' . $roleid);
        }

        $payload = $this->expandEditableSummaryPayload($payload, $current);
        $merged = $this->mergeEditableValue($current, $payload);

        return [
            'base' => $this->sanitizeEditableBase(array_value($merged, 'base', []), $roleid),
            'status' => $this->sanitizeEditableStatus(array_value($merged, 'status', [])),
            'inventory' => $this->sanitizeEditableInventory(array_value($merged, 'inventory', [])),
            'equipment' => $this->sanitizeEditableEquipment(array_value($merged, 'equipment', [])),
            'storehouse' => $this->sanitizeEditableStorehouse(array_value($merged, 'storehouse', [])),
            'task' => $this->sanitizeEditableTask(array_value($merged, 'task', [])),
        ];
    }

    private function putRoleBase($roleid, array $base, $ip, $port)
    {
        $pack = pack('N*', -1, $roleid) . $this->marshal($base, $this->struct_base);
        return $this->sendToGamedBD($this->createHeader(self::OP_PUT_ROLE_BASE, $pack), $ip, $port);
    }

    private function putRoleStatus($roleid, array $status, $ip, $port)
    {
        $pack = pack('N*', -1, $roleid) . $this->marshal($status, $this->struct_status);
        return $this->sendToGamedBD($this->createHeader(self::OP_PUT_ROLE_STATUS, $pack), $ip, $port);
    }

    private function putRoleInventory($roleid, array $inventory, $ip, $port)
    {
        $pack = pack('N*', -1, $roleid) . $this->marshal($inventory, $this->struct_inventory);
        return $this->sendToGamedBD($this->createHeader(self::OP_PUT_ROLE_INVENTORY, $pack), $ip, $port);
    }

    private function putRoleEquipment($roleid, array $equipment, $ip, $port)
    {
        $pack = pack('N*', -1, $roleid) . $this->marshal($equipment, $this->struct_equipment);
        return $this->sendToGamedBD($this->createHeader(self::OP_PUT_ROLE_EQUIPMENT, $pack), $ip, $port);
    }

    private function putRoleStorehouse($roleid, array $storehouse, $ip, $port)
    {
        $pack = pack('N*', -1, $roleid) . $this->marshal($storehouse, $this->struct_storehouse);
        return $this->sendToGamedBD($this->createHeader(self::OP_PUT_ROLE_STOREHOUSE, $pack), $ip, $port);
    }

    private function putRoleTask($roleid, array $task, $ip, $port)
    {
        $pack = pack('N*', -1, $roleid) . $this->marshal($task, $this->struct_task);
        return $this->sendToGamedBD($this->createHeader(self::OP_PUT_ROLE_TASK, $pack), $ip, $port);
    }

    private function putWholeRole($roleid, array $prepared, $ip, $port)
    {
        $role = [
            'base' => $prepared['base'],
            'status' => $prepared['status'],
            'pocket' => $prepared['inventory'],
            'equipment' => $prepared['equipment'],
            'storehouse' => $prepared['storehouse'],
            'task' => $prepared['task'],
        ];

        $pack = pack('NNC', -1, $roleid, 1) . $this->marshal($role, $this->getWholeRoleStruct());
        return $this->sendToGamedBD($this->createHeader(self::OP_PUT_ROLE, $pack), $ip, $port);
    }

    private function putPreparedRoleSections($roleid, array $prepared, $ip, $port)
    {
        if ($this->shouldUseWholeRolePut()) {
            $this->putWholeRole($roleid, $prepared, $ip, $port);
            return;
        }

        $this->putRoleBase($roleid, $prepared['base'], $ip, $port);
        $this->putRoleStatus($roleid, $prepared['status'], $ip, $port);
        $this->putRoleInventory($roleid, $prepared['inventory'], $ip, $port);
        $this->putRoleEquipment($roleid, $prepared['equipment'], $ip, $port);
        $this->putRoleStorehouse($roleid, $prepared['storehouse'], $ip, $port);
        $this->putRoleTask($roleid, $prepared['task'], $ip, $port);
    }

    public function saveEditableRole($roleid, array $payload, $ip, $port, $exportWorkdir = '', $exportCommand = '', $exportClsconfig = false, $backupDir = '', $exportMode = 'sync', $exportDelaySeconds = 0, $exportLogDir = '', $clsconfigFilePath = '', $clsconfigFileBackupDir = '')
    {
        $roleid = intval($roleid);
        if ($roleid <= 0) {
            throw new Exception('roleid invalido');
        }

        $current = $this->getEditableRole($roleid, $ip, $port);
        if (!$current) {
            throw new Exception('Template base nao encontrado para roleid ' . $roleid);
        }

        $payload = $this->expandEditableSummaryPayload($payload, $current);
        $backup = $this->createEditableRoleBackup($roleid, $current, $payload, $backupDir);
        $fileBackup = $this->createClsconfigFileBackup($roleid, $clsconfigFilePath, $clsconfigFileBackupDir);
        $prepared = $this->prepareEditableRoleForSave($roleid, $payload, $ip, $port, $current);

        try {
            $this->putPreparedRoleSections($roleid, $prepared, $ip, $port);
        } catch (Exception $e) {
            $rollbackMessage = 'rollback nao executado';

            try {
                $rollbackPrepared = $this->prepareEditableRoleForSave($roleid, $current, $ip, $port, $current);
                $this->putPreparedRoleSections($roleid, $rollbackPrepared, $ip, $port);
                $rollbackMessage = 'rollback automatico concluido';
            } catch (Exception $rollbackError) {
                $rollbackMessage = 'rollback falhou: ' . $rollbackError->getMessage();
            }

            throw new Exception(
                'Falha ao salvar o template roleid ' . $roleid . ': ' . $e->getMessage()
                . '. Backup criado em ' . array_value($backup, 'file', '')
                . '. Backup do arquivo clsconfig criado em ' . array_value($fileBackup, 'file', '')
                . '. ' . $rollbackMessage
            );
        }

        $freshRole = $this->getEditableRole($roleid, $ip, $port);
        $mismatches = is_array($freshRole) ? $this->verifyEditableRolePersisted($payload, $freshRole) : [];
        if (!$freshRole || !empty($mismatches)) {
            $rollbackMessage = 'rollback nao executado';

            try {
                $rollbackPrepared = $this->prepareEditableRoleForSave($roleid, $current, $ip, $port, $current);
                $this->putPreparedRoleSections($roleid, $rollbackPrepared, $ip, $port);
                $rollbackMessage = 'rollback automatico concluido';
            } catch (Exception $rollbackError) {
                $rollbackMessage = 'rollback falhou: ' . $rollbackError->getMessage();
            }

            $details = !empty($mismatches) ? json_encode($mismatches, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) : 'releitura vazia';
            throw new Exception(
                'Template nao persistiu no gamedbd apos salvar roleid ' . $roleid
                . '. Diferencas: ' . $details
                . '. Backup criado em ' . array_value($backup, 'file', '')
                . '. Backup do arquivo clsconfig criado em ' . array_value($fileBackup, 'file', '')
                . '. ' . $rollbackMessage
            );
        }

        $result = [
            'roleid' => $roleid,
            'backup' => $backup,
            'clsconfig_file_backup' => $fileBackup,
            'backups' => [
                'role_json' => $backup,
                'clsconfig_file' => $fileBackup,
            ],
            'saved_sections' => ['base', 'status', 'inventory', 'equipment', 'storehouse', 'task'],
        ];

        if ($exportClsconfig && strtolower((string) $exportMode) === 'deferred') {
            try {
                $result['export'] = $this->exportClsconfigDeferred(
                    $exportWorkdir,
                    $exportCommand,
                    $exportDelaySeconds,
                    $exportLogDir
                );
            } catch (Exception $e) {
                throw new Exception(
                    'Template salvo e backup criado em ' . array_value($backup, 'file', '')
                    . ' e backup do clsconfig criado em ' . array_value($fileBackup, 'file', '')
                    . ', mas nao foi possivel agendar exportclsconfig: ' . $e->getMessage()
                );
            }
        } elseif ($exportClsconfig) {
            try {
                $result['export'] = $this->exportClsconfig(
                    $exportWorkdir,
                    $exportCommand,
                    intval(array_value($GLOBALS['CONFIG'], 'clsconfig_export_attempts', 5)),
                    intval(array_value($GLOBALS['CONFIG'], 'clsconfig_export_retry_delay_us', 500000))
                );
            } catch (Exception $e) {
                $rollbackMessage = 'rollback do export nao executado';

                try {
                    $rollbackPrepared = $this->prepareEditableRoleForSave($roleid, $current, $ip, $port, $current);
                    $this->putPreparedRoleSections($roleid, $rollbackPrepared, $ip, $port);
                    $rollbackMessage = 'rollback automatico concluido';
                } catch (Exception $rollbackError) {
                    $rollbackMessage = 'rollback falhou: ' . $rollbackError->getMessage();
                }

                throw new Exception(
                    'Template salvo e backup criado em ' . array_value($backup, 'file', '')
                    . ' e backup do clsconfig criado em ' . array_value($fileBackup, 'file', '')
                    . ', mas exportclsconfig falhou: ' . $e->getMessage()
                    . '. ' . $rollbackMessage
                );
            }
        }

        $result['role'] = $freshRole;
        $result['verified'] = true;
        return $result;
    }

    public function getClsconfigEntries($ip, $port)
    {
        $raw = [];
        try {
            $raw = $this->getRawTable('clsconfig', $ip, $port);
        } catch (Exception $e) {
            $raw = [];
        }
        if (is_array($raw) && !empty($raw['Raw'])) {
            $roleids = $this->extractRoleIdsFromClsconfigRows($raw['Raw']);
            if (!empty($roleids)) {
                $rowsByRoleId = [];
                foreach ($raw['Raw'] as $row) {
                    $roleid = $this->decodeRoleIdFromHexKey(array_value($row, 'key', ''));
                    if ($roleid > 0) {
                        $rowsByRoleId[$roleid] = $row;
                    }
                }
                $entries = $this->buildClsconfigRoleEntries($roleids, $rowsByRoleId, $ip, $port);
                if (!empty($entries)) {
                    return $entries;
                }
            }

            $decodedRows = $this->decodeClsconfigRows($raw['Raw'], 'clsconfig');
            if (!empty($decodedRows)) {
                return $decodedRows;
            }
        }

        $debug = [];
        $rows = $this->getClsconfigRowsFromLocalDump($debug);
        if (!empty($rows)) {
            $roleids = $this->extractRoleIdsFromClsconfigRows($rows);
            if (!empty($roleids)) {
                $rowsByRoleId = [];
                foreach ($rows as $row) {
                    $roleid = $this->decodeRoleIdFromHexKey(array_value($row, 'key', ''));
                    if ($roleid > 0) {
                        $rowsByRoleId[$roleid] = $row;
                    }
                }
                $entries = $this->buildClsconfigRoleEntries($roleids, $rowsByRoleId, $ip, $port);
                if (!empty($entries)) {
                    return $entries;
                }
            }

            $decodedRows = $this->decodeClsconfigRows($rows, 'clsconfig_dump');
            if (!empty($decodedRows)) {
                return $decodedRows;
            }
        }

        return [];
    }

    public function getClsconfigDebug($ip, $port)
    {
        $rawError = '';
        $rawWire = [];
        try {
            $raw = $this->getRawTable('clsconfig', $ip, $port);
        } catch (Exception $e) {
            $raw = [];
            $rawError = $e->getMessage();
        }

        try {
            $pack = pack('N*', -1)
                . $this->packLongOctet('clsconfig')
                . $this->packOctet('')
                . $this->packOctet('');
            $rawWire = $this->sendToGamedBDWithMeta($this->createHeader(self::OP_GET_RAW_TABLE, $pack), $ip, $port);
        } catch (Exception $e) {
            $rawWire = ['error' => $e->getMessage()];
        }

        $rawRows = (is_array($raw) && !empty($raw['Raw'])) ? $raw['Raw'] : [];
        $dumpDebug = [];
        $dumpRows = $this->getClsconfigRowsFromLocalDump($dumpDebug);
        $firstRawRow = !empty($rawRows[0]) ? $rawRows[0] : [];
        $trace = [];
        $rawSamples = [];
        $rawRoleIds = $this->extractRoleIdsFromClsconfigRows($rawRows);

        if (!empty($firstRawRow)) {
            $trace = $this->traceDecodeHexStruct(array_value($firstRawRow, 'value', ''), $this->getClsconfigStruct());
        }

        $sampleCount = min(4, count($rawRows));
        for ($i = 0; $i < $sampleCount; $i++) {
            $row = $rawRows[$i];
            $rawSamples[] = [
                'index' => $i,
                'key_len' => strlen(array_value($row, 'key', '')),
                'value_len' => strlen(array_value($row, 'value', '')),
                'key_prefix' => substr(array_value($row, 'key', ''), 0, 32),
                'value_prefix' => substr(array_value($row, 'value', ''), 0, 64),
            ];
        }

        return [
            'raw_error' => $rawError,
            'raw_handle_len' => strlen(array_value(is_array($raw) ? $raw : [], 'handle', '')),
            'raw_handle_prefix' => substr(array_value(is_array($raw) ? $raw : [], 'handle', ''), 0, 64),
            'raw_table_count' => count($rawRows),
            'raw_decoded_count' => count($this->decodeClsconfigRows($rawRows, 'clsconfig')),
            'raw_roleids' => $rawRoleIds,
            'raw_wire' => $rawWire,
            'raw_samples' => $rawSamples,
            'raw_first_row' => [
                'key_len' => strlen(array_value($firstRawRow, 'key', '')),
                'value_len' => strlen(array_value($firstRawRow, 'value', '')),
                'key_prefix' => substr(array_value($firstRawRow, 'key', ''), 0, 32),
                'value_prefix' => substr(array_value($firstRawRow, 'value', ''), 0, 64),
            ],
            'raw_first_trace' => $trace,
            'dump_row_count' => count($dumpRows),
            'dump_decoded_count' => count($this->decodeClsconfigRows($dumpRows, 'clsconfig_dump')),
            'dump_debug' => $dumpDebug,
        ];
    }
}

function fetchMultipleRoles($roleids, $config, $full = false)
{
    $proto = new GamedProtocol();
    $results = [];

    foreach ($roleids as $rid) {
        $rid = intval($rid);
        if ($rid <= 0) {
            continue;
        }

        try {
            $role = $full
                ? $proto->getEditableRole($rid, $config['gamedbd_ip'], $config['gamedbd_port'])
                : $proto->getFullRole($rid, $config['gamedbd_ip'], $config['gamedbd_port']);

            if ($role) {
                $results[] = $role;
            }
        } catch (Exception $e) {
            error_log('Erro ao buscar role ' . $rid . ': ' . $e->getMessage());
        }

        usleep(50000);
    }

    return $results;
}

function wantsFullPayload()
{
    $full = isset($_GET['full']) ? $_GET['full'] : (isset($_POST['full']) ? $_POST['full'] : '');
    return in_array(strtolower((string) $full), ['1', 'true', 'yes', 'on', 'full'], true);
}

function truthyValue($value)
{
    return in_array(strtolower((string) $value), ['1', 'true', 'yes', 'on', 'sim'], true);
}

function readRequestPayload()
{
    static $payload = null;

    if ($payload !== null) {
        return $payload;
    }

    $payload = [];
    $raw = @file_get_contents('php://input');

    if (is_string($raw) && trim($raw) !== '') {
        $trimmed = trim($raw);
        $contentType = isset($_SERVER['CONTENT_TYPE']) ? strtolower((string) $_SERVER['CONTENT_TYPE']) : '';
        $looksJson = (strpos($contentType, 'json') !== false)
            || substr($trimmed, 0, 1) === '{'
            || substr($trimmed, 0, 1) === '[';

        if ($looksJson) {
            $decoded = json_decode($raw, true);
            if (json_last_error() === JSON_ERROR_NONE && is_array($decoded)) {
                $payload = $decoded;
                return $payload;
            }

            $payload = [
                '__json_error' => function_exists('json_last_error_msg') ? json_last_error_msg() : 'JSON invalido',
            ];
            return $payload;
        }
    }

    if (!empty($_POST)) {
        $payload = $_POST;

        foreach (['role', 'template'] as $field) {
            if (isset($payload[$field]) && is_string($payload[$field])) {
                $decoded = json_decode($payload[$field], true);
                if (json_last_error() === JSON_ERROR_NONE && is_array($decoded)) {
                    $payload[$field] = $decoded;
                }
            }
        }
    }

    return $payload;
}

function extractEditableRolePayload(array $request)
{
    if (isset($request['template']) && is_array($request['template'])) {
        return $request['template'];
    }

    if (isset($request['role']) && is_array($request['role'])) {
        return $request['role'];
    }

    return $request;
}

function extractRoleIdFromRequest(array $request)
{
    if (isset($_GET['roleid'])) {
        return intval($_GET['roleid']);
    }

    if (isset($request['roleid'])) {
        return intval($request['roleid']);
    }

    if (isset($request['template']) && is_array($request['template']) && isset($request['template']['roleid'])) {
        return intval($request['template']['roleid']);
    }

    if (isset($request['role']) && is_array($request['role']) && isset($request['role']['roleid'])) {
        return intval($request['role']['roleid']);
    }

    return 0;
}

function wantsClsconfigExport(array $request)
{
    foreach (['export_clsconfig', 'exportClsconfig'] as $field) {
        if (isset($_GET[$field])) {
            return truthyValue($_GET[$field]);
        }

        if (isset($request[$field])) {
            return truthyValue($request[$field]);
        }
    }

    return false;
}

function itemCatalogQueryFromRequest(array $request)
{
    foreach (['q', 'query', 'search', 'term'] as $field) {
        if (isset($_GET[$field])) {
            return trim((string) $_GET[$field]);
        }

        if (isset($request[$field])) {
            return trim((string) $request[$field]);
        }
    }

    return '';
}

function itemCatalogIdFromRequest(array $request)
{
    foreach (['id', 'item_id', 'itemId'] as $field) {
        if (isset($_GET[$field]) && $_GET[$field] !== '') {
            return intval($_GET[$field]);
        }

        if (isset($request[$field]) && $request[$field] !== '') {
            return intval($request[$field]);
        }
    }

    return 0;
}

function itemCatalogLimitFromRequest(array $request)
{
    $limit = isset($_GET['limit']) ? intval($_GET['limit']) : intval(array_value($request, 'limit', 50));
    return max(1, min(200, $limit));
}

function normalizeItemCatalogText($text)
{
    $text = trim((string) $text);
    if ($text === '') {
        return '';
    }

    if (function_exists('mb_check_encoding') && function_exists('mb_convert_encoding') && !mb_check_encoding($text, 'UTF-8')) {
        foreach (['GB18030', 'GBK', 'GB2312', 'BIG5', 'ISO-8859-1'] as $encoding) {
            $converted = @mb_convert_encoding($text, 'UTF-8', $encoding);
            if (is_string($converted) && $converted !== '' && mb_check_encoding($converted, 'UTF-8')) {
                return trim($converted);
            }
        }
    }

    if (function_exists('iconv') && !preg_match('//u', $text)) {
        foreach (['GB18030', 'GBK', 'GB2312', 'BIG5', 'ISO-8859-1'] as $encoding) {
            $converted = @iconv($encoding, 'UTF-8//IGNORE', $text);
            if (is_string($converted) && $converted !== '' && preg_match('//u', $converted)) {
                return trim($converted);
            }
        }
    }

    return $text;
}

function itemCatalogIconPath($id)
{
    $id = intval($id);
    if ($id <= 0) {
        return '';
    }

    return 'items/' . $id . '.png';
}

function itemCatalogEntry($id, $name = '', $type = 'item', $source = '')
{
    $id = intval($id);
    $name = normalizeItemCatalogText($name);
    if ($name === '') {
        $name = 'Item ' . $id;
    }

    return [
        'id' => $id,
        'name' => $name,
        'icon' => $id . '.png',
        'icon_path' => itemCatalogIconPath($id),
        'max_count' => 1,
        'type' => $type,
        'description' => '',
        'source' => $source,
        'defaults' => [
            'count' => 1,
            'max_count' => 1,
            'proctype' => 0,
            'expire_date' => 0,
            'guid1' => 0,
            'guid2' => 0,
            'mask' => 0,
            'data' => '',
        ],
    ];
}

function addItemCatalogEntry(array &$items, $id, $name = '', $type = 'item', $source = '')
{
    $id = intval($id);
    if ($id <= 0) {
        return;
    }

    if (!isset($items[$id]) || array_value($items[$id], 'name', '') === 'Item ' . $id) {
        $items[$id] = itemCatalogEntry($id, $name, $type, $source);
    }
}

function readDelimitedItemCatalogFile($path, array &$items, $limitLines = 200000)
{
    if (!is_file($path) || !is_readable($path)) {
        return [
            'path' => $path,
            'loaded' => 0,
            'status' => 'unreadable',
        ];
    }

    $loaded = 0;
    $handle = @fopen($path, 'rb');
    if (!$handle) {
        return [
            'path' => $path,
            'loaded' => 0,
            'status' => 'open_failed',
        ];
    }

    $lineNo = 0;
    while (($line = fgets($handle)) !== false) {
        $lineNo++;
        if ($lineNo > $limitLines) {
            break;
        }

        $line = trim($line);
        if ($line === '' || $line[0] === '#') {
            continue;
        }

        $parts = preg_split('/\s+/', $line, 3);
        if (!is_array($parts) || empty($parts[0]) || !preg_match('/^\d+$/', $parts[0])) {
            continue;
        }

        $id = intval($parts[0]);
        $category = isset($parts[1]) && preg_match('/^\d+$/', $parts[1]) ? $parts[1] : '';
        $name = isset($parts[2]) ? $parts[2] : '';
        $type = $category !== '' ? 'category_' . $category : 'item';
        addItemCatalogEntry($items, $id, $name, $type, basename($path));
        $loaded++;
    }

    fclose($handle);
    return [
        'path' => $path,
        'loaded' => $loaded,
        'status' => 'ok',
    ];
}

function readIdOnlyItemCatalogFile($path, array &$items, $limitLines = 200000)
{
    if (!is_file($path) || !is_readable($path)) {
        return [
            'path' => $path,
            'loaded' => 0,
            'status' => 'unreadable',
        ];
    }

    $loaded = 0;
    $handle = @fopen($path, 'rb');
    if (!$handle) {
        return [
            'path' => $path,
            'loaded' => 0,
            'status' => 'open_failed',
        ];
    }

    $lineNo = 0;
    while (($line = fgets($handle)) !== false) {
        $lineNo++;
        if ($lineNo > $limitLines) {
            break;
        }

        $line = trim($line);
        if ($line === '' || !preg_match('/^\d+$/', $line)) {
            continue;
        }

        addItemCatalogEntry($items, intval($line), '', 'item', basename($path));
        $loaded++;
    }

    fclose($handle);
    return [
        'path' => $path,
        'loaded' => $loaded,
        'status' => 'ok',
    ];
}

function buildItemCatalog(array $config)
{
    static $cache = null;
    if ($cache !== null) {
        return $cache;
    }

    $items = [];
    $sources = [];
    $paths = array_value($config, 'item_catalog_paths', []);
    if (!is_array($paths)) {
        $paths = [];
    }

    foreach ($paths as $path) {
        $base = strtolower(basename((string) $path));
        if (in_array($base, ['visibleid.txt', 'invisibleid.txt', 'valuables_list.txt'], true)) {
            $sources[] = readIdOnlyItemCatalogFile($path, $items);
            continue;
        }

        $sources[] = readDelimitedItemCatalogFile($path, $items);
    }

    ksort($items, SORT_NUMERIC);
    $cache = [
        'items' => array_values($items),
        'sources' => $sources,
    ];
    return $cache;
}

function filterItemCatalog(array $catalog, $query = '', $id = 0, $limit = 50)
{
    $query = trim((string) $query);
    $id = intval($id);
    $limit = max(1, min(200, intval($limit)));
    $items = array_value($catalog, 'items', []);
    $matches = [];

    foreach ($items as $item) {
        if (!is_array($item)) {
            continue;
        }

        $itemId = intval(array_value($item, 'id', 0));
        $name = (string) array_value($item, 'name', '');

        if ($id > 0 && $itemId !== $id) {
            continue;
        }

        if ($query !== '') {
            $queryLower = function_exists('mb_strtolower') ? mb_strtolower($query, 'UTF-8') : strtolower($query);
            $nameLower = function_exists('mb_strtolower') ? mb_strtolower($name, 'UTF-8') : strtolower($name);
            $idMatches = (strpos((string) $itemId, $query) !== false);
            $nameMatches = (strpos($nameLower, $queryLower) !== false);
            if (!$idMatches && !$nameMatches) {
                continue;
            }
        }

        $matches[] = $item;
        if (count($matches) >= $limit) {
            break;
        }
    }

    if ($id > 0 && empty($matches)) {
        $matches[] = itemCatalogEntry($id, '', 'item', 'fallback_id');
    }

    return $matches;
}

function itemCatalogMatchesQuery(array $item, $query)
{
    $query = trim((string) $query);
    if ($query === '') {
        return true;
    }

    $itemId = intval(array_value($item, 'id', 0));
    $name = (string) array_value($item, 'name', '');
    $queryLower = function_exists('mb_strtolower') ? mb_strtolower($query, 'UTF-8') : strtolower($query);
    $nameLower = function_exists('mb_strtolower') ? mb_strtolower($name, 'UTF-8') : strtolower($name);

    return strpos((string) $itemId, $query) !== false || strpos($nameLower, $queryLower) !== false;
}

function addItemCatalogSearchMatch(array &$matches, array &$seen, array $item, $query, $id, $limit)
{
    $itemId = intval(array_value($item, 'id', 0));
    if ($itemId <= 0 || isset($seen[$itemId])) {
        return false;
    }

    if ($id > 0 && $itemId !== $id) {
        return false;
    }

    if (!itemCatalogMatchesQuery($item, $query)) {
        return false;
    }

    $seen[$itemId] = true;
    $matches[] = $item;
    return count($matches) >= $limit;
}

function searchDelimitedItemCatalogFile($path, $query, $id, $limit, array &$matches, array &$seen, $limitLines = 200000)
{
    $source = [
        'path' => $path,
        'loaded' => 0,
        'matched' => 0,
        'status' => 'unreadable',
    ];

    if (!is_file($path) || !is_readable($path)) {
        return $source;
    }

    $handle = @fopen($path, 'rb');
    if (!$handle) {
        $source['status'] = 'open_failed';
        return $source;
    }

    $source['status'] = 'ok';
    $lineNo = 0;
    while (($line = fgets($handle)) !== false) {
        $lineNo++;
        if ($lineNo > $limitLines) {
            $source['status'] = 'line_limit';
            break;
        }

        $line = trim($line);
        if ($line === '' || $line[0] === '#') {
            continue;
        }

        $parts = preg_split('/\s+/', $line, 3);
        if (!is_array($parts) || empty($parts[0]) || !preg_match('/^\d+$/', $parts[0])) {
            continue;
        }

        $source['loaded']++;
        $category = isset($parts[1]) && preg_match('/^\d+$/', $parts[1]) ? $parts[1] : '';
        $name = isset($parts[2]) ? $parts[2] : '';
        $type = $category !== '' ? 'category_' . $category : 'item';
        $item = itemCatalogEntry(intval($parts[0]), $name, $type, basename($path));

        if (addItemCatalogSearchMatch($matches, $seen, $item, $query, $id, $limit)) {
            $source['matched']++;
            break;
        }

        if (isset($seen[intval($parts[0])])) {
            $source['matched']++;
        }
    }

    fclose($handle);
    return $source;
}

function searchIdOnlyItemCatalogFile($path, $query, $id, $limit, array &$matches, array &$seen, $limitLines = 200000)
{
    $source = [
        'path' => $path,
        'loaded' => 0,
        'matched' => 0,
        'status' => 'unreadable',
    ];

    if (!is_file($path) || !is_readable($path)) {
        return $source;
    }

    $handle = @fopen($path, 'rb');
    if (!$handle) {
        $source['status'] = 'open_failed';
        return $source;
    }

    $source['status'] = 'ok';
    $lineNo = 0;
    while (($line = fgets($handle)) !== false) {
        $lineNo++;
        if ($lineNo > $limitLines) {
            $source['status'] = 'line_limit';
            break;
        }

        $line = trim($line);
        if ($line === '' || !preg_match('/^\d+$/', $line)) {
            continue;
        }

        $source['loaded']++;
        $item = itemCatalogEntry(intval($line), '', 'item', basename($path));
        if (addItemCatalogSearchMatch($matches, $seen, $item, $query, $id, $limit)) {
            $source['matched']++;
            break;
        }

        if (isset($seen[intval($line)])) {
            $source['matched']++;
        }
    }

    fclose($handle);
    return $source;
}

function searchItemCatalog(array $config, $query = '', $id = 0, $limit = 50)
{
    $paths = array_value($config, 'item_catalog_paths', []);
    if (!is_array($paths)) {
        $paths = [];
    }

    $matches = [];
    $seen = [];
    $sources = [];
    $limit = max(1, min(200, intval($limit)));

    foreach ($paths as $path) {
        if (count($matches) >= $limit) {
            break;
        }

        $base = strtolower(basename((string) $path));
        if (in_array($base, ['visibleid.txt', 'invisibleid.txt', 'valuables_list.txt'], true)) {
            $sources[] = searchIdOnlyItemCatalogFile($path, $query, $id, $limit, $matches, $seen);
        } else {
            $sources[] = searchDelimitedItemCatalogFile($path, $query, $id, $limit, $matches, $seen);
        }
    }

    if ($id > 0 && empty($matches)) {
        $matches[] = itemCatalogEntry($id, '', 'item', 'fallback_id');
    }

    return [
        'items' => array_slice($matches, 0, $limit),
        'sources' => $sources,
    ];
}

function buildUsedClassesFromEntries($entries)
{
    $used = [];

    if (!is_array($entries)) {
        return [];
    }

    foreach ($entries as $entry) {
        if (!is_array($entry)) {
            continue;
        }

        $template = array_value($entry, 'template', []);
        $summary = array_value($template, 'summary', []);
        $base = array_value($template, 'base', []);
        $cls = intval(array_value($summary, 'cls', array_value($base, 'cls', -1)));
        if ($cls < 0) {
            continue;
        }

        $roleid = intval(array_value($template, 'roleid', 0));
        $info = class_info($cls);

        if (!isset($used[$cls])) {
            $used[$cls] = $info;
            $used[$cls]['template_count'] = 0;
            $used[$cls]['roleids'] = [];
        }

        $used[$cls]['template_count']++;
        if ($roleid > 0 && !in_array($roleid, $used[$cls]['roleids'], true)) {
            $used[$cls]['roleids'][] = $roleid;
        }
    }

    $classes = array_values($used);
    usort($classes, function ($a, $b) {
        return intval($a['id']) <=> intval($b['id']);
    });

    return $classes;
}

function safeBackupRealPath($path)
{
    $real = realpath($path);
    return ($real !== false) ? $real : $path;
}

function backupFileInfo($file, $type)
{
    $name = basename($file);
    $roleid = null;
    if (preg_match('/roleid-(\d+)/', $name, $m)) {
        $roleid = intval($m[1]);
    }

    return [
        'type' => $type,
        'file' => safeBackupRealPath($file),
        'name' => $name,
        'roleid' => $roleid,
        'bytes' => is_file($file) ? filesize($file) : 0,
        'mtime' => is_file($file) ? filemtime($file) : 0,
        'created_at' => is_file($file) ? date('c', filemtime($file)) : '',
        'sha1' => (($type === 'clsconfig_file' || $type === 'gamedbd_backup') && function_exists('sha1_file') && is_file($file)) ? sha1_file($file) : '',
    ];
}

function listBackupFiles($dir, $pattern, $type, $limit)
{
    $dir = is_string($dir) ? rtrim($dir, '/\\') : '';
    if ($dir === '' || !is_dir($dir)) {
        return [];
    }

    $files = glob($dir . DIRECTORY_SEPARATOR . $pattern);
    if (!is_array($files)) {
        return [];
    }

    $items = [];
    foreach ($files as $file) {
        if (is_file($file)) {
            $items[] = backupFileInfo($file, $type);
        }
    }

    usort($items, function ($a, $b) {
        return intval(array_value($b, 'mtime', 0)) <=> intval(array_value($a, 'mtime', 0));
    });

    return array_slice($items, 0, max(1, intval($limit)));
}

function listClsconfigBackups(array $config, $limit = 100)
{
    $roleJson = listBackupFiles(array_value($config, 'clsconfig_backup_dir', ''), 'roleid-*.json', 'role_json', $limit);
    $clsconfigFiles = listBackupFiles(array_value($config, 'clsconfig_file_backup_dir', ''), 'clsconfig-roleid-*', 'clsconfig_file', $limit);
    $exportLogs = listBackupFiles(array_value($config, 'clsconfig_export_log_dir', ''), 'exportclsconfig-*.log', 'export_log', $limit);
    $gamedbdBackups = listBackupFiles(array_value($config, 'gamedbd_backup_dir', ''), 'gamedbd-backup-*.tgz', 'gamedbd_backup', $limit);

    $all = array_merge($roleJson, $clsconfigFiles, $exportLogs, $gamedbdBackups);
    usort($all, function ($a, $b) {
        return intval(array_value($b, 'mtime', 0)) <=> intval(array_value($a, 'mtime', 0));
    });

    return [
        'role_json' => $roleJson,
        'clsconfig_files' => $clsconfigFiles,
        'export_logs' => $exportLogs,
        'gamedbd_backups' => $gamedbdBackups,
        'all' => array_slice($all, 0, max(1, intval($limit))),
        'dirs' => [
            'role_json' => safeBackupRealPath(array_value($config, 'clsconfig_backup_dir', '')),
            'clsconfig_files' => safeBackupRealPath(array_value($config, 'clsconfig_file_backup_dir', '')),
            'export_logs' => safeBackupRealPath(array_value($config, 'clsconfig_export_log_dir', '')),
            'gamedbd_backups' => safeBackupRealPath(array_value($config, 'gamedbd_backup_dir', '')),
        ],
    ];
}

function latestGamedbdBackupInfo(array $config, $maxAgeSeconds)
{
    $dir = trim((string) array_value($config, 'gamedbd_backup_dir', ''));
    if ($dir === '' || !is_dir($dir)) {
        return null;
    }

    $files = glob(rtrim($dir, '/\\') . DIRECTORY_SEPARATOR . 'gamedbd-backup-*.tgz');
    if (!is_array($files) || empty($files)) {
        return null;
    }

    $latest = '';
    $latestMtime = 0;
    foreach ($files as $file) {
        if (!is_file($file)) {
            continue;
        }

        $mtime = filemtime($file);
        if ($mtime !== false && $mtime > $latestMtime) {
            $latest = $file;
            $latestMtime = $mtime;
        }
    }

    if ($latest === '' || $latestMtime <= 0) {
        return null;
    }

    if ($maxAgeSeconds > 0 && $latestMtime < (time() - $maxAgeSeconds)) {
        return null;
    }

    return backupFileInfo($latest, 'gamedbd_backup');
}

function parseBackupCommandOutput($output)
{
    $text = trim((string) $output);
    if ($text === '') {
        return null;
    }

    $decoded = json_decode($text, true);
    if (json_last_error() === JSON_ERROR_NONE && is_array($decoded)) {
        return $decoded;
    }

    $lines = preg_split('/\r\n|\r|\n/', $text);
    if (is_array($lines)) {
        for ($i = count($lines) - 1; $i >= 0; $i--) {
            $line = trim($lines[$i]);
            if ($line === '' || $line[0] !== '{') {
                continue;
            }

            $decoded = json_decode($line, true);
            if (json_last_error() === JSON_ERROR_NONE && is_array($decoded)) {
                return $decoded;
            }
        }
    }

    return null;
}

function createGamedbdSafetyBackup(array $config, $reason = 'manual', $force = false)
{
    if (!truthyValue(array_value($config, 'gamedbd_backup_enabled', true))) {
        if (truthyValue(array_value($config, 'gamedbd_backup_required', true))) {
            throw new Exception('Backup gamedbd esta desabilitado, mas e obrigatorio antes de operacoes sensiveis');
        }

        return [
            'mode' => 'disabled',
            'warning' => 'Backup gamedbd desabilitado na configuracao da API',
        ];
    }

    $backupDir = trim((string) array_value($config, 'gamedbd_backup_dir', ''));
    if ($backupDir === '') {
        throw new Exception('Diretorio de backup gamedbd nao configurado');
    }

    if (!is_dir($backupDir) && !@mkdir($backupDir, 0750, true)) {
        throw new Exception('Nao foi possivel criar diretorio de backup gamedbd: ' . $backupDir);
    }

    if (!is_dir($backupDir) || !is_writable($backupDir)) {
        throw new Exception('Diretorio de backup gamedbd sem permissao de escrita: ' . $backupDir);
    }

    $minInterval = max(0, intval(array_value($config, 'gamedbd_backup_min_interval_seconds', 300)));
    if (!$force && $minInterval > 0) {
        $recent = latestGamedbdBackupInfo($config, $minInterval);
        if (is_array($recent)) {
            $recent['mode'] = 'reused';
            $recent['reason'] = $reason;
            $recent['min_interval_seconds'] = $minInterval;
            return $recent;
        }
    }

    $command = trim((string) array_value($config, 'gamedbd_backup_command', ''));
    if ($command === '') {
        throw new Exception('Comando de backup gamedbd nao configurado');
    }

    $safeReason = preg_replace('/[^a-zA-Z0-9_.:-]+/', '_', (string) $reason);
    $cmd = $command . ' ' . escapeshellarg($backupDir) . ' ' . escapeshellarg($safeReason);
    $output = [];
    $exitCode = 0;
    @exec($cmd . ' 2>&1', $output, $exitCode);
    $rawOutput = trim(implode("\n", $output));

    if ($exitCode !== 0) {
        throw new Exception('Backup gamedbd falhou antes da operacao sensivel (exit ' . $exitCode . '): ' . $rawOutput);
    }

    $parsed = parseBackupCommandOutput($rawOutput);
    if (!is_array($parsed)) {
        $parsed = [
            'stdout' => $rawOutput,
        ];
    }

    $file = trim((string) array_value($parsed, 'file', ''));
    if ($file !== '' && is_file($file)) {
        $info = backupFileInfo($file, 'gamedbd_backup');
        $parsed = array_merge($parsed, $info);
    }

    $parsed['mode'] = 'created';
    $parsed['reason'] = $safeReason;
    return $parsed;
}

function restoreRequestBackupName(array $request)
{
    $candidates = [
        array_value($request, 'name', ''),
        array_value($request, 'file', ''),
    ];

    $backup = array_value($request, 'backup', null);
    if (is_array($backup)) {
        $candidates[] = array_value($backup, 'name', '');
        $candidates[] = array_value($backup, 'file', '');
    }

    foreach ($candidates as $candidate) {
        $candidate = trim((string) $candidate);
        if ($candidate === '') {
            continue;
        }

        $candidate = str_replace('\\', '/', $candidate);
        return basename($candidate);
    }

    return '';
}

function restoreRequestBackupType(array $request, $name)
{
    $type = trim((string) array_value($request, 'type', ''));
    $backup = array_value($request, 'backup', null);
    if ($type === '' && is_array($backup)) {
        $type = trim((string) array_value($backup, 'type', ''));
    }

    if ($type === '') {
        if (preg_match('/^roleid-\d+-/', $name)) {
            return 'role_json';
        }

        if (preg_match('/^clsconfig-roleid-\d+-/', $name)) {
            return 'clsconfig_file';
        }
    }

    return $type;
}

function backupContentRequestType(array $request)
{
    $name = restoreRequestBackupName($request);
    return restoreRequestBackupType($request, $name);
}

function restoreRequestDryRun(array $request)
{
    return truthyValue(array_value($request, 'dry_run', array_value($request, 'dryRun', false)));
}

function restoreConfirmOk(array $request, $type)
{
    $confirm = strtoupper(trim((string) array_value($request, 'confirm', '')));
    $allowed = [
        'RESTORE_BACKUP',
        'RESTORE_CLSCONFIG',
        'RESTORE_CLSCONFIG_BACKUP',
        'RESTORE_ROLE_JSON',
    ];

    if ($type === 'role_json') {
        $allowed[] = 'RESTORE_ROLE_BACKUP';
    }

    if ($type === 'clsconfig_file') {
        $allowed[] = 'RESTORE_FILE_BACKUP';
    }

    return in_array($confirm, $allowed, true);
}

function restoreAllowedRoleId(array $config, $roleid)
{
    $roleid = intval($roleid);
    if ($roleid <= 0) {
        return false;
    }

    $allowed = array_map('intval', array_value($config, 'clsconfig_template_roleids', []));
    if (empty($allowed)) {
        return true;
    }

    return in_array($roleid, $allowed, true);
}

function resolveRestoreBackupFile(array $config, array $request, &$type)
{
    $name = restoreRequestBackupName($request);
    if ($name === '') {
        throw new Exception('Informe backup.name ou backup.file para restaurar');
    }

    $type = restoreRequestBackupType($request, $name);
    if ($type === 'export_log') {
        throw new Exception('export_log nao e restauravel');
    }

    if ($type === 'role_json') {
        $dir = array_value($config, 'clsconfig_backup_dir', '');
        $pattern = '/^roleid-\d+-\d{8}-\d{6}-[a-f0-9]{8}\.json$/i';
    } elseif ($type === 'clsconfig_file') {
        $dir = array_value($config, 'clsconfig_file_backup_dir', '');
        $pattern = '/^clsconfig-roleid-\d+-\d{8}-\d{6}-[a-f0-9]{8}$/i';
    } else {
        throw new Exception('Tipo de backup invalido para restore: ' . $type);
    }

    if (!preg_match($pattern, $name)) {
        throw new Exception('Nome de backup invalido ou fora do padrao seguro: ' . $name);
    }

    $dir = is_string($dir) ? rtrim($dir, '/\\') : '';
    $dirReal = ($dir !== '') ? realpath($dir) : false;
    if ($dirReal === false || !is_dir($dirReal)) {
        throw new Exception('Diretorio de backups inacessivel para restore');
    }

    $file = $dirReal . DIRECTORY_SEPARATOR . $name;
    $fileReal = realpath($file);
    if ($fileReal === false || !is_file($fileReal) || !is_readable($fileReal)) {
        throw new Exception('Backup nao encontrado ou sem leitura: ' . $name);
    }

    $prefix = rtrim($dirReal, DIRECTORY_SEPARATOR) . DIRECTORY_SEPARATOR;
    if (strncmp($fileReal, $prefix, strlen($prefix)) !== 0) {
        throw new Exception('Backup fora do diretorio permitido');
    }

    return $fileReal;
}

function restoreRoleJsonBackup(array $config, GamedProtocol $proto, $backupFile, array $request)
{
    $raw = @file_get_contents($backupFile);
    if ($raw === false) {
        throw new Exception('Nao foi possivel ler backup JSON: ' . basename($backupFile));
    }

    $decoded = json_decode($raw, true);
    if (json_last_error() !== JSON_ERROR_NONE || !is_array($decoded)) {
        throw new Exception('Backup JSON invalido: ' . (function_exists('json_last_error_msg') ? json_last_error_msg() : 'json_decode falhou'));
    }

    $template = array_value($decoded, 'template', null);
    if (!is_array($template)) {
        throw new Exception('Backup JSON sem template restauravel');
    }

    $roleid = intval(array_value($decoded, 'roleid', array_value($template, 'roleid', 0)));
    if (!restoreAllowedRoleId($config, $roleid)) {
        throw new Exception('roleid nao permitido para restore de clsconfig: ' . $roleid);
    }

    if (restoreRequestDryRun($request)) {
        return [
            'type' => 'role_json',
            'dry_run' => true,
            'roleid' => $roleid,
            'source_backup' => backupFileInfo($backupFile, 'role_json'),
            'would_restore_sections' => ['base', 'status', 'inventory', 'equipment', 'storehouse', 'task'],
        ];
    }

    if (!restoreConfirmOk($request, 'role_json')) {
        throw new Exception('Confirmacao obrigatoria para restore. Envie confirm=RESTORE_ROLE_JSON');
    }

    $saved = $proto->saveEditableRole(
        $roleid,
        $template,
        $config['gamedbd_ip'],
        $config['gamedbd_port'],
        $config['clsconfig_export_workdir'],
        $config['clsconfig_export_command'],
        true,
        $config['clsconfig_backup_dir'],
        $config['clsconfig_export_after_save'],
        $config['clsconfig_export_deferred_delay_seconds'],
        $config['clsconfig_export_log_dir'],
        $config['clsconfig_file_path'],
        $config['clsconfig_file_backup_dir']
    );

    return [
        'type' => 'role_json',
        'roleid' => $roleid,
        'source_backup' => backupFileInfo($backupFile, 'role_json'),
        'saved' => $saved,
        'warning' => 'Restore aplicado no gamedbd usando o JSON do role. O exportclsconfig segue o modo configurado da API.',
    ];
}

function restoreClsconfigFileBackup(array $config, GamedProtocol $proto, $backupFile, array $request)
{
    $target = trim((string) array_value($config, 'clsconfig_file_path', ''));
    if ($target === '') {
        throw new Exception('Arquivo clsconfig de destino nao configurado');
    }

    if (!is_file($backupFile) || !is_readable($backupFile)) {
        throw new Exception('Backup clsconfig inacessivel: ' . basename($backupFile));
    }

    $sourceInfo = backupFileInfo($backupFile, 'clsconfig_file');
    $roleid = intval(array_value($sourceInfo, 'roleid', 0));
    $sourceSha1 = function_exists('sha1_file') ? sha1_file($backupFile) : '';
    $sourceBytes = filesize($backupFile);

    if (restoreRequestDryRun($request)) {
        return [
            'type' => 'clsconfig_file',
            'dry_run' => true,
            'source_backup' => $sourceInfo,
            'target_file' => $target,
            'would_create_safety_backup' => true,
            'warning' => 'Dry-run apenas valida o backup. Nenhum arquivo foi alterado.',
        ];
    }

    if (!restoreConfirmOk($request, 'clsconfig_file')) {
        throw new Exception('Confirmacao obrigatoria para restore. Envie confirm=RESTORE_CLSCONFIG');
    }

    if (!is_file($target) || !is_readable($target)) {
        throw new Exception('Arquivo clsconfig atual inacessivel para backup de seguranca: ' . $target);
    }

    $targetDir = dirname($target);
    if (!is_dir($targetDir) || !is_writable($targetDir)) {
        throw new Exception('Diretorio do clsconfig sem permissao de escrita: ' . $targetDir);
    }

    if (file_exists($target) && !is_writable($target)) {
        throw new Exception('Arquivo clsconfig atual sem permissao de escrita: ' . $target);
    }

    $safetyBackup = $proto->createClsconfigFileBackup($roleid, $target, $config['clsconfig_file_backup_dir']);
    $tmp = $targetDir . DIRECTORY_SEPARATOR . '.clsconfig-restore-' . date('Ymd-His') . '-' . substr(sha1($backupFile . microtime(true)), 0, 8);

    if (!@copy($backupFile, $tmp)) {
        throw new Exception('Falha ao copiar backup para arquivo temporario de restore: ' . $tmp);
    }

    $mode = @fileperms($target);
    $mode = ($mode === false) ? 0640 : ($mode & 0777);
    @chmod($tmp, $mode);

    if (!@rename($tmp, $target)) {
        @unlink($tmp);
        throw new Exception('Falha ao substituir clsconfig atual pelo backup restaurado');
    }

    clearstatcache(true, $target);
    $targetBytes = is_file($target) ? filesize($target) : 0;
    $targetSha1 = function_exists('sha1_file') && is_file($target) ? sha1_file($target) : '';

    if ($targetBytes !== $sourceBytes || ($sourceSha1 !== '' && $targetSha1 !== '' && $sourceSha1 !== $targetSha1)) {
        throw new Exception('Restore do clsconfig copiou, mas a verificacao de bytes/sha1 falhou');
    }

    return [
        'type' => 'clsconfig_file',
        'roleid' => $roleid,
        'source_backup' => $sourceInfo,
        'target_file' => $target,
        'safety_backup' => $safetyBackup,
        'bytes' => $targetBytes,
        'sha1' => $targetSha1,
        'warning' => 'Arquivo clsconfig restaurado. Nenhum exportclsconfig foi executado automaticamente para evitar sobrescrever o arquivo restaurado.',
    ];
}

function restoreBackupFromRequest(array $config, GamedProtocol $proto, array $request)
{
    $type = '';
    $backupFile = resolveRestoreBackupFile($config, $request, $type);

    if ($type === 'role_json') {
        return restoreRoleJsonBackup($config, $proto, $backupFile, $request);
    }

    if ($type === 'clsconfig_file') {
        return restoreClsconfigFileBackup($config, $proto, $backupFile, $request);
    }

    throw new Exception('Tipo de backup nao restauravel: ' . $type);
}

function getRoleJsonBackupContent(array $config, array $request)
{
    $requestedType = backupContentRequestType($request);
    if ($requestedType !== '' && $requestedType !== 'role_json') {
        throw new Exception('getBackupContent permite apenas type=role_json');
    }

    $type = 'role_json';
    $backupFile = resolveRestoreBackupFile($config, $request, $type);
    if ($type !== 'role_json') {
        throw new Exception('getBackupContent permite apenas backups role_json');
    }

    $raw = @file_get_contents($backupFile);
    if ($raw === false) {
        throw new Exception('Nao foi possivel ler backup JSON: ' . basename($backupFile));
    }

    $decoded = json_decode($raw, true);
    if (json_last_error() !== JSON_ERROR_NONE || !is_array($decoded)) {
        throw new Exception('Backup JSON invalido: ' . (function_exists('json_last_error_msg') ? json_last_error_msg() : 'json_decode falhou'));
    }

    $template = array_value($decoded, 'template', null);
    if (!is_array($template)) {
        throw new Exception('Backup JSON sem template');
    }

    $info = backupFileInfo($backupFile, 'role_json');
    $roleid = intval(array_value($decoded, 'roleid', array_value($template, 'roleid', array_value($info, 'roleid', 0))));
    if (!restoreAllowedRoleId($config, $roleid)) {
        throw new Exception('roleid nao permitido para leitura de backup clsconfig: ' . $roleid);
    }

    $backup = $info;
    $backup['backup_version'] = intval(array_value($decoded, 'backup_version', 0));
    $backup['created_at'] = array_value($decoded, 'created_at', array_value($backup, 'created_at', ''));
    $backup['roleid'] = $roleid;
    $backup['reason'] = array_value($decoded, 'reason', '');
    $backup['template'] = $template;
    $backup['requested_payload'] = array_value($decoded, 'requested_payload', null);

    return $backup;
}

/**
 * Handler comum para sendMailItem / sendMailGold.
 *
 * Valida payload, chama o wrapper sudo (sendreward-api.sh) que executa
 * /usr/local/bin/pw_send_mail.php no contexto do usuario gamedbd e retorna
 * a resposta normalizada para o painel.
 *
 * Suporta { "dry_run": true } — nesse caso a validacao roda mas nao chama
 * o gdeliveryd; util para o "Testar conexao" do painel.
 */
function handleSendMailRequest(array $config, $action, array $request)
{
    if (!truthyValue(array_value($config, 'mail_send_enabled', true))) {
        throw new Exception('Envio de correio desabilitado nesta VPS');
    }

    $roleid = extractRoleIdFromRequest($request);
    if ($roleid <= 0) {
        throw new Exception('roleid invalido');
    }

    $subject = trim((string) array_value($request, 'subject', ''));
    if ($subject === '') {
        $subject = (string) array_value($config, 'mail_send_default_subject', 'PW Admin');
    }

    $body = trim((string) array_value($request, 'body', ''));
    if ($body === '') {
        $body = (string) array_value($config, 'mail_send_default_body', '');
    }

    $dryRun = truthyValue(array_value($request, 'dry_run', false));

    if ($action === 'sendMailItem') {
        $item = array_value($request, 'item', null);
        if (!is_array($item)) {
            throw new Exception('campo item ausente ou invalido');
        }
        $itemId = intval(array_value($item, 'item_id', 0));
        $count  = intval(array_value($item, 'count', 0));
        if ($itemId <= 0) {
            throw new Exception('item.item_id invalido');
        }
        if ($count <= 0) {
            throw new Exception('item.count deve ser > 0');
        }
        $maxCount = intval(array_value($config, 'mail_send_max_count', 9999));
        if ($maxCount > 0 && $count > $maxCount) {
            throw new Exception('item.count acima do limite (' . $maxCount . ')');
        }

        $kind = 'item';
        $payload = [
            'roleid'    => $roleid,
            'subject'   => $subject,
            'body'      => $body,
            'kind'      => 'item',
            'item_id'   => $itemId,
            'count'     => $count,
            'max_count' => intval(array_value($item, 'max_count', $count)),
            'proctype'  => intval(array_value($item, 'proctype', 0)),
            'expire_date' => intval(array_value($item, 'expire_date', 0)),
            'mask'      => intval(array_value($item, 'mask', 0)),
            'guid1'     => intval(array_value($item, 'guid1', 0)),
            'guid2'     => intval(array_value($item, 'guid2', 0)),
            'data'      => (string) array_value($item, 'data', ''),
        ];
    } else {
        $amount = intval(array_value($request, 'amount', 0));
        if ($amount <= 0) {
            throw new Exception('amount deve ser > 0');
        }
        $maxAmount = intval(array_value($config, 'mail_send_max_amount', 2000000000));
        if ($maxAmount > 0 && $amount > $maxAmount) {
            throw new Exception('amount acima do limite (' . $maxAmount . ')');
        }

        $kind = 'gold';
        $payload = [
            'roleid'  => $roleid,
            'subject' => $subject,
            'body'    => $body,
            'kind'    => 'gold',
            'amount'  => $amount,
        ];
    }

    if ($dryRun) {
        return [
            'success'   => true,
            'dry_run'   => true,
            'roleid'    => $roleid,
            'kind'      => $kind,
            'validated' => true,
            'payload'   => $payload,
        ];
    }

    $logDir = trim((string) array_value($config, 'mail_send_log_dir', ''));
    if ($logDir !== '' && !is_dir($logDir)) {
        @mkdir($logDir, 0750, true);
    }

    $command = trim((string) array_value($config, 'mail_send_command', ''));
    if ($command === '') {
        throw new Exception('Comando de envio de correio nao configurado');
    }

    $json = json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    if ($json === false) {
        throw new Exception('Falha ao serializar payload do correio');
    }

    // O wrapper sh recebe o JSON via stdin para evitar quoting fragil.
    $descriptors = [
        0 => ['pipe', 'r'],
        1 => ['pipe', 'w'],
        2 => ['pipe', 'w'],
    ];
    $cwd = (string) array_value($config, 'mail_send_workdir', __DIR__);
    $process = @proc_open($command, $descriptors, $pipes, $cwd);
    if (!is_resource($process)) {
        throw new Exception('Nao foi possivel iniciar comando de envio de correio');
    }

    fwrite($pipes[0], $json);
    fclose($pipes[0]);
    $stdout = stream_get_contents($pipes[1]);
    fclose($pipes[1]);
    $stderr = stream_get_contents($pipes[2]);
    fclose($pipes[2]);
    $exitCode = proc_close($process);

    if ($logDir !== '' && is_dir($logDir) && is_writable($logDir)) {
        $logName = $logDir . '/' . gmdate('Ymd-His') . '-' . $kind . '-' . $roleid . '.json';
        @file_put_contents($logName, json_encode([
            'sent_at_utc' => gmdate('c'),
            'action'      => $action,
            'request'     => $payload,
            'exit_code'   => $exitCode,
            'stdout'      => $stdout,
            'stderr'      => $stderr,
        ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT));
    }

    if ($exitCode !== 0) {
        $msg = trim((string) $stderr);
        if ($msg === '') {
            $msg = trim((string) $stdout);
        }
        if ($msg === '') {
            $msg = 'Falha ao enviar correio (exit ' . $exitCode . ')';
        }
        throw new Exception($msg);
    }

    $decoded = json_decode((string) $stdout, true);
    if (!is_array($decoded)) {
        return [
            'success'   => true,
            'roleid'    => $roleid,
            'mail_id'   => null,
            'delivered' => true,
            'raw'       => trim((string) $stdout),
        ];
    }

    if (!array_key_exists('success', $decoded)) {
        $decoded['success'] = true;
    }
    if (!array_key_exists('roleid', $decoded)) {
        $decoded['roleid'] = $roleid;
    }
    if (!array_key_exists('delivered', $decoded)) {
        $decoded['delivered'] = (bool) $decoded['success'];
    }

    return $decoded;
}

function respondJson($payload, $status = 200)
{
    http_response_code($status);
    $flags = JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES;
    if (defined('JSON_INVALID_UTF8_SUBSTITUTE')) {
        $flags |= JSON_INVALID_UTF8_SUBSTITUTE;
    }

    $json = json_encode($payload, $flags);
    if ($json === false) {
        $fallback = [
            'success' => false,
            'error' => 'Falha ao gerar JSON',
            'json_error' => function_exists('json_last_error_msg') ? json_last_error_msg() : 'json_encode falhou',
        ];
        $json = json_encode($fallback, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    }

    echo $json;
}

/* ============================================================
 * Operação do Servidor v1 — getServiceStatus / getServerLogs
 * Apenas LEITURA: pgrep + tail. Sem start/stop/kill.
 * ============================================================ */

function serverOpsKnownServices()
{
    return [
        ['gamedbd',     'Game DB Daemon',     29400],
        ['gdeliveryd',  'Delivery Daemon',    29100],
        ['gacd',        'Account Daemon',     29000],
        ['glink',       'Game Link',          29200],
        ['authd',       'Auth Daemon',        29300],
        ['uniquenamed', 'Unique Name',        29500],
        ['mysql',       'MySQL/MariaDB',      3306],
        ['httpd',       'Web (Apache/httpd)', 80],
    ];
}

/** Aliases por serviço — múltiplos nomes de processo aceitáveis. */
function serverOpsProcessAliases($name)
{
    $map = [
        'mysql' => ['mariadbd', 'mysqld', 'mysqld_safe', 'mysql'],
        'httpd' => ['httpd', 'apache2'],
    ];
    return isset($map[$name]) ? $map[$name] : [$name];
}

/** Lista PIDs vivos para um nome de processo (pgrep -x). */
function serverOpsPidsByName($procName, &$exit = 0)
{
    $output = [];
    $exit = 0;
    @exec('pgrep -x ' . escapeshellarg($procName) . ' 2>/dev/null', $output, $exit);
    $pids = [];
    foreach ($output as $line) {
        $pid = intval(trim($line));
        if ($pid > 0) $pids[] = $pid;
    }
    return $pids;
}

/** Verifica se uma porta TCP está em LISTEN (ss → netstat fallback). */
function serverOpsPortListening($port)
{
    if ($port <= 0) return false;
    $port = intval($port);

    // ss -lnt (mais rápido e moderno).
    $out = [];
    $exit = 127;
    @exec('ss -lnt 2>/dev/null', $out, $exit);
    if ($exit === 0 && !empty($out)) {
        foreach ($out as $line) {
            if (preg_match('/[:.]' . $port . '\s/', $line)) return true;
        }
        return false;
    }

    // Fallback: netstat -lnt.
    $out = [];
    @exec('netstat -lnt 2>/dev/null', $out, $exit);
    if ($exit === 0 && !empty($out)) {
        foreach ($out as $line) {
            if (preg_match('/[:.]' . $port . '\s/', $line)) return true;
        }
    }
    return false;
}

/** systemctl is-active <unit> — retorna true/false/null (indisponível). */
function serverOpsSystemctlActive($unit)
{
    $out = [];
    $exit = 127;
    @exec('systemctl is-active ' . escapeshellarg($unit) . ' 2>/dev/null', $out, $exit);
    if ($exit === 127) return null; // systemctl ausente
    $val = trim(implode('', $out));
    if ($val === 'active') return true;
    if ($val === '' || $val === 'unknown') return null;
    return false;
}

function serverOpsCollectService($name, $label, $port)
{
    $service = [
        'name'          => $name,
        'label'         => $label,
        'state'         => 'unknown',
        'pid'           => null,
        'process_count' => 0,
        'port'          => $port,
        'message'       => null,
    ];

    $needsFullMatch = in_array($name, ['gamedbd', 'gdeliveryd', 'gacd', 'glink', 'authd', 'uniquenamed'], true);

    if ($needsFullMatch) {
        $output = [];
        $exit = 0;
        @exec('pgrep -f ' . escapeshellarg($name) . ' 2>/dev/null', $output, $exit);
        $pids = [];
        foreach ($output as $line) {
            $pid = intval(trim($line));
            if ($pid > 0) $pids[] = $pid;
        }
        if (!empty($pids)) {
            $service['state']         = 'online';
            $service['pid']           = $pids[0];
            $service['process_count'] = count($pids);
        } elseif ($exit > 1) {
            $service['message'] = 'pgrep falhou (exit ' . $exit . ')';
        } else {
            $service['state'] = 'offline';
        }
        return $service;
    }

    // Detecção multi-estratégia para serviços de sistema (mysql/httpd).
    $aliases = serverOpsProcessAliases($name);
    $allPids = [];
    $matchedAlias = null;
    $pgrepFailed = false;
    foreach ($aliases as $alias) {
        $exit = 0;
        $pids = serverOpsPidsByName($alias, $exit);
        if ($exit > 1) { $pgrepFailed = true; continue; }
        if (!empty($pids)) {
            if ($matchedAlias === null) $matchedAlias = $alias;
            foreach ($pids as $p) $allPids[] = $p;
        }
    }

    if (!empty($allPids)) {
        $allPids = array_values(array_unique($allPids));
        $service['state']         = 'online';
        $service['pid']           = $allPids[0];
        $service['process_count'] = count($allPids);
        if ($matchedAlias && $matchedAlias !== $name) {
            $service['message'] = 'Detectado via ' . $matchedAlias;
        }
        return $service;
    }

    // Fallback 1: porta escutando.
    if (serverOpsPortListening($port)) {
        $service['state']   = 'online';
        $service['message'] = 'Detectado via porta :' . $port;
        return $service;
    }

    // Fallback 2: systemctl is-active (mysql/mariadb/httpd/apache2).
    if ($name === 'mysql') {
        foreach (['mariadb', 'mysql', 'mysqld'] as $unit) {
            $active = serverOpsSystemctlActive($unit);
            if ($active === true) {
                $service['state']   = 'online';
                $service['message'] = 'Detectado via systemctl ' . $unit;
                return $service;
            }
        }
    } elseif ($name === 'httpd') {
        foreach (['httpd', 'apache2'] as $unit) {
            $active = serverOpsSystemctlActive($unit);
            if ($active === true) {
                $service['state']   = 'online';
                $service['message'] = 'Detectado via systemctl ' . $unit;
                return $service;
            }
        }
    }

    if ($pgrepFailed) {
        $service['message'] = 'pgrep falhou em todos os aliases';
    } else {
        $service['state'] = 'offline';
    }
    return $service;
}

function getServiceStatusSnapshot()
{
    $services = [];
    foreach (serverOpsKnownServices() as $svc) {
        list($name, $label, $port) = $svc;
        $services[] = serverOpsCollectService($name, $label, $port);
    }
    return [
        'success'      => true,
        'collected_at' => time(),
        'services'     => $services,
    ];
}

function serverOpsLogSources($CONFIG)
{
    $apicls_dir = isset($CONFIG['clsconfig_export_log_dir'])
        ? $CONFIG['clsconfig_export_log_dir']
        : (__DIR__ . '/backups/clsconfig/export-logs');
    $mail_dir = isset($CONFIG['mail_send_log_dir'])
        ? $CONFIG['mail_send_log_dir']
        : (__DIR__ . '/backups/mail-logs');

    return [
        'gamedbd' => [
            '/home/gamedbd/logs/gamedbd.log',
            '/home/gamedbd/gamedbd.log',
            '/var/log/gamedbd.log',
        ],
        'exportclsconfig' => [
            $apicls_dir,
        ],
        'httpd' => [
            '/var/log/httpd/error_log',
            '/var/log/apache2/error.log',
            '/var/log/nginx/error.log',
        ],
        'mail' => [
            $mail_dir,
        ],
        'apicls' => [
            __DIR__ . '/backups/api_cls.log',
            '/var/log/api_cls.log',
        ],
    ];
}

function serverOpsResolveLogFile($candidates)
{
    foreach ($candidates as $path) {
        if (!is_string($path) || $path === '') continue;
        if (is_dir($path)) {
            $latest = null;
            $latestTime = 0;
            $dh = @opendir($path);
            if ($dh) {
                while (($entry = readdir($dh)) !== false) {
                    if ($entry === '.' || $entry === '..') continue;
                    $full = rtrim($path, '/') . '/' . $entry;
                    if (!is_file($full)) continue;
                    $mt = @filemtime($full);
                    if ($mt !== false && $mt > $latestTime) {
                        $latestTime = $mt;
                        $latest = $full;
                    }
                }
                closedir($dh);
            }
            if ($latest !== null) return $latest;
        } else if (is_file($path)) {
            return $path;
        }
    }
    return null;
}

function serverOpsTailFile($path, $maxLines)
{
    if ($maxLines <= 0) $maxLines = 200;
    if ($maxLines > 2000) $maxLines = 2000;

    $size = @filesize($path);
    if ($size !== false && $size > 5 * 1024 * 1024) {
        $cmd = 'tail -n ' . intval($maxLines) . ' ' . escapeshellarg($path) . ' 2>/dev/null';
        $out = [];
        @exec($cmd, $out);
        return $out;
    }

    $fh = @fopen($path, 'r');
    if (!$fh) return null;
    $lines = [];
    while (!feof($fh)) {
        $line = fgets($fh);
        if ($line === false) break;
        $lines[] = rtrim($line, "\r\n");
    }
    fclose($fh);
    if (count($lines) > $maxLines) {
        $lines = array_slice($lines, -$maxLines);
    }
    return $lines;
}

function serverOpsGuessLevel($line)
{
    $l = strtolower($line);
    if (strpos($l, 'error') !== false || strpos($l, 'fatal') !== false || strpos($l, 'critical') !== false) return 'error';
    if (strpos($l, 'warn') !== false) return 'warn';
    if (strpos($l, 'debug') !== false || strpos($l, 'trace') !== false) return 'debug';
    return 'info';
}

function getServerLogsSnapshot($CONFIG, $source, $lines, $query)
{
    $sources = serverOpsLogSources($CONFIG);
    if (!isset($sources[$source])) {
        return [
            'success' => false,
            'source'  => $source,
            'entries' => [],
            'error'   => 'Origem desconhecida: ' . $source,
        ];
    }

    $file = serverOpsResolveLogFile($sources[$source]);
    if ($file === null) {
        return [
            'success' => true,
            'source'  => $source,
            'entries' => [],
            'count'   => 0,
            'warning' => 'Nenhum arquivo de log encontrado para esta origem nesta VPS.',
        ];
    }
    if (!is_readable($file)) {
        return [
            'success' => true,
            'source'  => $source,
            'file'    => $file,
            'entries' => [],
            'count'   => 0,
            'warning' => 'Arquivo existe mas sem permissao de leitura para o usuario web.',
        ];
    }

    $rawLines = serverOpsTailFile($file, $lines);
    if ($rawLines === null) {
        return [
            'success' => true,
            'source'  => $source,
            'file'    => $file,
            'entries' => [],
            'warning' => 'Nao foi possivel abrir o arquivo (fopen falhou).',
        ];
    }

    $entries = [];
    foreach ($rawLines as $raw) {
        if ($query !== '' && stripos($raw, $query) === false) continue;
        $entries[] = [
            'line'  => $raw,
            'level' => serverOpsGuessLevel($raw),
        ];
    }

    return [
        'success' => true,
        'source'  => $source,
        'file'    => $file,
        'count'   => count($entries),
        'entries' => $entries,
    ];
}

if (php_sapi_name() !== 'cli' || isset($_GET['action'])) {

    $secret = isset($_SERVER['HTTP_X_SYNC_SECRET']) ? $_SERVER['HTTP_X_SYNC_SECRET'] : (isset($_GET['secret']) ? $_GET['secret'] : '');
    if ($secret !== $CONFIG['api_secret']) {
        respondJson(['error' => 'Unauthorized'], 401);
        exit;
    }

    $action = isset($_GET['action']) ? $_GET['action'] : (isset($_POST['action']) ? $_POST['action'] : '');

    switch ($action) {
        case 'getRole':
        case 'getRoleEditable':
            $roleid = intval(isset($_GET['roleid']) ? $_GET['roleid'] : 0);
            if ($roleid <= 0) {
                respondJson(['error' => 'roleid invalido'], 400);
                exit;
            }

            $proto = new GamedProtocol();

            try {
                $full = ($action === 'getRoleEditable') || wantsFullPayload();
                $role = $full
                    ? $proto->getEditableRole($roleid, $CONFIG['gamedbd_ip'], $CONFIG['gamedbd_port'])
                    : $proto->getFullRole($roleid, $CONFIG['gamedbd_ip'], $CONFIG['gamedbd_port']);

                if (!$role) {
                    respondJson(['error' => 'Personagem nao encontrado'], 404);
                    exit;
                }

                if (!$full) {
                    $role['cultivation'] = cultivation_name(intval(array_value($role, 'level2', -1)));
                }

                respondJson(['success' => true, 'classes' => class_options(), 'role' => $role]);
            } catch (Exception $e) {
                respondJson(['error' => $e->getMessage()], 500);
            }
            break;

        case 'getRoles':
        case 'getRolesEditable':
            $roleidsRaw = isset($_GET['roleids']) ? $_GET['roleids'] : '';
            $roleids = array_filter(array_map('intval', explode(',', $roleidsRaw)));
            if (empty($roleids)) {
                respondJson(['error' => 'roleids invalidos'], 400);
                exit;
            }

            $full = ($action === 'getRolesEditable') || wantsFullPayload();
            $results = fetchMultipleRoles($roleids, $CONFIG, $full);

            if (!$full) {
                foreach ($results as &$role) {
                    $role['cultivation'] = cultivation_name(intval(array_value($role, 'level2', -1)));
                }
                unset($role);
            }

            respondJson(['success' => true, 'classes' => class_options(), 'roles' => $results]);
            break;

        case 'getClasses':
            respondJson([
                'success' => true,
                'classes' => class_options(),
            ]);
            break;

        case 'getClsconfig':
            $proto = new GamedProtocol();

            try {
                $entries = $proto->getClsconfigEntries($CONFIG['gamedbd_ip'], $CONFIG['gamedbd_port']);
                respondJson([
                    'success' => true,
                    'count' => count($entries),
                    'classes' => class_options(),
                    'used_classes' => buildUsedClassesFromEntries($entries),
                    'entries' => $entries,
                ]);
            } catch (Exception $e) {
                respondJson(['error' => $e->getMessage()], 500);
            }
            break;

        case 'getClsconfigDebug':
            $proto = new GamedProtocol();

            try {
                $debug = $proto->getClsconfigDebug($CONFIG['gamedbd_ip'], $CONFIG['gamedbd_port']);
                respondJson([
                    'success' => true,
                    'debug' => $debug,
                ]);
            } catch (Exception $e) {
                respondJson(['error' => $e->getMessage()], 500);
            }
            break;

        case 'getItemCatalog':
        case 'getItemsCatalog':
        case 'obterCatalogoDeItens':
            $request = readRequestPayload();
            if (isset($request['__json_error'])) {
                respondJson(['error' => 'JSON invalido: ' . $request['__json_error']], 400);
                exit;
            }

            try {
                $query = itemCatalogQueryFromRequest($request);
                $id = itemCatalogIdFromRequest($request);
                $limit = itemCatalogLimitFromRequest($request);
                $catalog = searchItemCatalog($CONFIG, $query, $id, $limit);
                $items = array_value($catalog, 'items', []);

                respondJson([
                    'success' => true,
                    'query' => $query,
                    'id' => $id,
                    'limit' => $limit,
                    'count' => count($items),
                    'total' => null,
                    'items' => $items,
                    'sources' => array_value($catalog, 'sources', []),
                ]);
            } catch (Exception $e) {
                respondJson(['error' => $e->getMessage()], 500);
            }
            break;

        case 'listBackups':
            $limit = isset($_GET['limit']) ? intval($_GET['limit']) : 100;
            $limit = max(1, min(500, $limit));

            try {
                respondJson([
                    'success' => true,
                    'limit' => $limit,
                    'backups' => listClsconfigBackups($CONFIG, $limit),
                ]);
            } catch (Exception $e) {
                respondJson(['error' => $e->getMessage()], 500);
            }
            break;

        case 'backupGamedbd':
            if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
                respondJson(['error' => 'Use POST para backupGamedbd'], 405);
                exit;
            }

            $request = readRequestPayload();
            if (isset($request['__json_error'])) {
                respondJson(['error' => 'JSON invalido: ' . $request['__json_error']], 400);
                exit;
            }

            try {
                $reason = trim((string) array_value($request, 'reason', 'manual'));
                $force = truthyValue(array_value($request, 'force', false));
                $backup = createGamedbdSafetyBackup($CONFIG, $reason !== '' ? $reason : 'manual', $force);
                respondJson([
                    'success' => true,
                    'backup' => $backup,
                ]);
            } catch (Exception $e) {
                respondJson(['error' => $e->getMessage()], 500);
            }
            break;

        case 'getBackupContent':
            $request = readRequestPayload();
            if (isset($request['__json_error'])) {
                respondJson(['error' => 'JSON invalido: ' . $request['__json_error']], 400);
                exit;
            }

            try {
                $backup = getRoleJsonBackupContent($CONFIG, $request);
                respondJson([
                    'success' => true,
                    'backup' => $backup,
                ]);
            } catch (Exception $e) {
                respondJson(['error' => $e->getMessage()], 500);
            }
            break;

        case 'exportClsconfig':
            if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
                respondJson(['error' => 'Use POST para exportClsconfig'], 405);
                exit;
            }

            $proto = new GamedProtocol();

            try {
                $gamedbdBackup = createGamedbdSafetyBackup($CONFIG, 'before_exportClsconfig');
                $result = $proto->exportClsconfig(
                    $CONFIG['clsconfig_export_workdir'],
                    $CONFIG['clsconfig_export_command'],
                    $CONFIG['clsconfig_export_attempts'],
                    $CONFIG['clsconfig_export_retry_delay_us']
                );
                respondJson([
                    'success' => true,
                    'gamedbd_backup' => $gamedbdBackup,
                    'export' => $result,
                ]);
            } catch (Exception $e) {
                respondJson(['error' => $e->getMessage()], 500);
            }
            break;

        case 'restoreBackup':
            if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
                respondJson(['error' => 'Use POST para restoreBackup'], 405);
                exit;
            }

            $request = readRequestPayload();
            if (isset($request['__json_error'])) {
                respondJson(['error' => 'JSON invalido: ' . $request['__json_error']], 400);
                exit;
            }

            $proto = new GamedProtocol();

            try {
                $gamedbdBackup = null;
                if (!restoreRequestDryRun($request)) {
                    $gamedbdBackup = createGamedbdSafetyBackup($CONFIG, 'before_restoreBackup');
                }

                $result = restoreBackupFromRequest($CONFIG, $proto, $request);
                if (is_array($gamedbdBackup)) {
                    $result['gamedbd_backup'] = $gamedbdBackup;
                }

                respondJson([
                    'success' => true,
                    'restored' => $result,
                ]);
            } catch (Exception $e) {
                respondJson(['error' => $e->getMessage()], 500);
            }
            break;

        case 'saveRoleEditable':
        case 'saveClsconfigTemplate':
            if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
                respondJson(['error' => 'Use POST para salvar template'], 405);
                exit;
            }

            $request = readRequestPayload();
            if (isset($request['__json_error'])) {
                respondJson(['error' => 'JSON invalido: ' . $request['__json_error']], 400);
                exit;
            }

            $roleid = extractRoleIdFromRequest($request);
            if ($roleid <= 0) {
                respondJson(['error' => 'roleid invalido'], 400);
                exit;
            }

            if ($action === 'saveClsconfigTemplate') {
                $allowedRoleids = array_map('intval', array_value($CONFIG, 'clsconfig_template_roleids', []));
                if (!empty($allowedRoleids) && !in_array($roleid, $allowedRoleids, true)) {
                    respondJson([
                        'error' => 'roleid nao permitido para template clsconfig',
                        'roleid' => $roleid,
                        'allowed_roleids' => array_values($allowedRoleids),
                        'hint' => 'Use o template.roleid da entrada selecionada. Nao use o id da classe como roleid.',
                    ], 400);
                    exit;
                }
            }

            $payload = extractEditableRolePayload($request);
            $exportClsconfig = ($action === 'saveClsconfigTemplate') || wantsClsconfigExport($request);
            $proto = new GamedProtocol();

            try {
                $gamedbdBackup = createGamedbdSafetyBackup($CONFIG, 'before_' . $action . '_roleid_' . $roleid);
                $result = $proto->saveEditableRole(
                    $roleid,
                    $payload,
                    $CONFIG['gamedbd_ip'],
                    $CONFIG['gamedbd_port'],
                    $CONFIG['clsconfig_export_workdir'],
                    $CONFIG['clsconfig_export_command'],
                    $exportClsconfig,
                    $CONFIG['clsconfig_backup_dir'],
                    $CONFIG['clsconfig_export_after_save'],
                    $CONFIG['clsconfig_export_deferred_delay_seconds'],
                    $CONFIG['clsconfig_export_log_dir'],
                    $CONFIG['clsconfig_file_path'],
                    $CONFIG['clsconfig_file_backup_dir']
                );
                $result['gamedbd_backup'] = $gamedbdBackup;

                respondJson([
                    'success' => true,
                    'saved' => $result,
                ]);
            } catch (Exception $e) {
                respondJson(['error' => $e->getMessage()], 500);
            }

        case 'sendMailItem':
        case 'sendMailGold':
            if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
                respondJson(['error' => 'Use POST para ' . $action], 405);
                exit;
            }

            $request = readRequestPayload();
            if (isset($request['__json_error'])) {
                respondJson(['error' => 'JSON invalido: ' . $request['__json_error']], 400);
                exit;
            }

            try {
                $result = handleSendMailRequest($CONFIG, $action, $request);
                respondJson($result, 200);
            } catch (Exception $e) {
                respondJson([
                    'success' => false,
                    'error'   => $e->getMessage(),
                ], 400);
            }
            break;

        case 'getServiceStatus':
            try {
                respondJson(getServiceStatusSnapshot(), 200);
            } catch (Exception $e) {
                respondJson(['success' => false, 'error' => $e->getMessage()], 500);
            }
            break;

        case 'getServerLogs':
            $src   = isset($_GET['source']) ? trim((string)$_GET['source']) : 'gamedbd';
            $lines = isset($_GET['lines']) ? intval($_GET['lines']) : 200;
            $q     = isset($_GET['q']) ? trim((string)$_GET['q']) : '';
            try {
                $snap = getServerLogsSnapshot($CONFIG, $src, $lines, $q);
                respondJson($snap, isset($snap['success']) && $snap['success'] === false ? 400 : 200);
            } catch (Exception $e) {
                respondJson(['success' => false, 'error' => $e->getMessage()], 500);
            }
            break;

        default:
            respondJson([
                'error' => 'Acao invalida. Use: getRole, getRoles, getRoleEditable, getRolesEditable, getClasses, getClsconfig, getClsconfigDebug, getItemCatalog, listBackups, backupGamedbd, getBackupContent, restoreBackup, exportClsconfig, saveRoleEditable, saveClsconfigTemplate, sendMailItem, sendMailGold, getServiceStatus, getServerLogs',
            ], 400);
            break;
    }

    exit;
}
