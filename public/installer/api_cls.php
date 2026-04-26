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
 *   POST /apicls/api_cls.php?action=sendMailItem&secret=SEU_SECRET
 *   POST /apicls/api_cls.php?action=sendMailGold&secret=SEU_SECRET
 *   POST /apicls/api_cls.php?action=sendSystemMessage&secret=SEU_SECRET
 *   GET  /apicls/api_cls.php?action=getMaintenanceMode&secret=SEU_SECRET
 *   GET  /apicls/api_cls.php?action=getManageableServices&secret=SEU_SECRET
 *   GET  /apicls/api_cls.php?action=getManageableInstances&secret=SEU_SECRET
 *   GET  /apicls/api_cls.php?action=getServerOperationStatus&secret=SEU_SECRET
 *   GET  /apicls/api_cls.php?action=getServerOperationsHistory&secret=SEU_SECRET
 *   POST /apicls/api_cls.php?action=setMaintenanceMode&secret=SEU_SECRET
 *   POST /apicls/api_cls.php?action=setInstanceAutoStart&secret=SEU_SECRET
 *   POST /apicls/api_cls.php?action=startInstance&secret=SEU_SECRET
 *   POST /apicls/api_cls.php?action=startInstances&secret=SEU_SECRET
 *   POST /apicls/api_cls.php?action=stopInstance&secret=SEU_SECRET
 *   POST /apicls/api_cls.php?action=stopInstances&secret=SEU_SECRET
 *   POST /apicls/api_cls.php?action=restartInstance&secret=SEU_SECRET
 *   POST /apicls/api_cls.php?action=restartInstances&secret=SEU_SECRET
 *   POST /apicls/api_cls.php?action=startServer&secret=SEU_SECRET
 *   POST /apicls/api_cls.php?action=stopServer&secret=SEU_SECRET
 *   POST /apicls/api_cls.php?action=restartServer&secret=SEU_SECRET
 *   POST /apicls/api_cls.php?action=startService&secret=SEU_SECRET
 *   POST /apicls/api_cls.php?action=stopService&secret=SEU_SECRET
 *   POST /apicls/api_cls.php?action=restartService&secret=SEU_SECRET
 *   POST /apicls/api_cls.php?action=kickRole&secret=SEU_SECRET
 *   POST /apicls/api_cls.php?action=banAccount&secret=SEU_SECRET
 *   POST /apicls/api_cls.php?action=unbanAccount&secret=SEU_SECRET
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
    'gdeliveryd_ip' => '127.0.0.1',
    'gdeliveryd_port' => 29100,
    'mail_send_command' => '/usr/bin/sudo -n /usr/local/sbin/sendreward-api.sh',
    'gacd_ip' => '127.0.0.1',
    'gacd_port' => 29300,
    'system_message_enabled' => true,
    'system_message_default_channel' => 9,
    'system_message_max_length' => 200,
    'system_message_log_dir' => __DIR__ . '/backups/sysmsg-logs',
    'maintenance_reason_max_length' => 240,
    'maintenance_eta_max_minutes' => 1440,
    'maintenance_state_file' => __DIR__ . '/backups/maintenance/state.json',
    'maintenance_history_file' => __DIR__ . '/backups/maintenance/history.log',
    'server_ops_log_dir' => __DIR__ . '/backups/server-ops',
    'server_ops_start_command' => '/usr/bin/sudo -n /usr/local/sbin/panel_start.sh',
    'server_ops_stop_command' => '/usr/bin/sudo -n /usr/local/sbin/panel_stop.sh',
    'server_ops_restart_command' => '/usr/bin/sudo -n /usr/local/sbin/panel_restart.sh',
    'server_ops_service_control_command' => '/usr/bin/sudo -n /usr/local/sbin/panel_service_control.sh',
    'server_ops_restart_timeout_seconds' => 900,
    'server_ops_service_timeout_seconds' => 300,
    'server_ops_verify_timeout_seconds' => 45,
    'server_ops_verify_poll_interval_seconds' => 2,
    'server_ops_restart_countdown_marks' => [300, 180, 120, 60, 30, 10, 5, 4, 3, 2, 1],
    'server_ops_verify_services' => ['logservice', 'uniquenamed', 'authd', 'gamedbd', 'gacd', 'gfactiond', 'gdeliveryd', 'glinkd', 'gamed', 'httpd'],
    'server_ops_manageable_services' => ['logservice', 'uniquenamed', 'authd', 'gamedbd', 'gacd', 'gfactiond', 'gdeliveryd', 'glinkd', 'gamed'],
    'pwadmin_instance_catalog_path' => '/home/pwadmin/instance.txt',
    'pwadmin_autoinstance_path' => '/home/pwadmin/autoinstance.txt',
    'gamed_gs_conf_path' => '/home/gamed/gs.conf',
    'instance_ops_start_command' => '/usr/bin/sudo -n /usr/local/sbin/panel_instance_start.sh',
    'instance_ops_stop_command' => '/usr/bin/sudo -n /usr/local/sbin/panel_instance_stop.sh',
    'instance_ops_start_timeout_seconds' => 90,
    'instance_ops_stop_timeout_seconds' => 90,
    'instance_ops_verify_timeout_seconds' => 45,
    'instance_ops_verify_poll_interval_seconds' => 2,
    'instance_ops_server_autostart_initial_delay_seconds' => 5,
    'instance_ops_server_autostart_per_instance_delay_seconds' => 2,
    'security_kick_default_seconds' => 10,
    'security_kick_max_seconds' => 600,
    'security_unban_seconds' => 0,
    'security_ban_permanent_seconds' => 2147483647,
    'security_reason_min_length' => 3,
    'security_log_dir' => __DIR__ . '/backups/security-logs',
    // Templates reais do painel antigo. Ignora placeholders vazios/level 1 do clsconfig.
    'clsconfig_template_roleids' => [16, 17, 18, 19, 20, 21, 22, 23, 24, 27, 28, 31],
    'item_catalog_paths' => [
        '/home/gamed/config/webtradeid.txt',
        '/home/gdeliveryd/auctionid.txt',
        '/home/gamedbd/valuables_list.txt',
        '/home/gamedbd/visibleid.txt',
    ],
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
    const OP_FORBID_ROLE         = 360;
    const OP_FORBID_ACC          = 5035;

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

    private $struct_forbid_account_response = [
        'retcode' => 'int',
        'forbidcount' => 'cuint',
        'forbid' => [
            'type' => 'byte',
            'time' => 'int',
            'createtime' => 'int',
            'reason' => 'name',
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

    public function sendToDelivery($data, $ip, $port)
    {
        if (!function_exists('socket_create')) {
            throw new Exception('Extensao PHP sockets nao instalada.');
        }

        $fp = @fsockopen($ip, $port, $errno, $errstr, 2);
        if (!$fp) {
            throw new Exception("Nao foi possivel conectar ao gdeliveryd ($ip:$port): $errstr");
        }

        $sock = socket_create(AF_INET, SOCK_STREAM, SOL_TCP);
        if (!$sock) {
            fclose($fp);
            throw new Exception('Falha ao criar socket para gdeliveryd');
        }

        socket_set_option($sock, SOL_SOCKET, SO_RCVTIMEO, ['sec' => 5, 'usec' => 0]);
        socket_set_option($sock, SOL_SOCKET, SO_SNDTIMEO, ['sec' => 5, 'usec' => 0]);

        if (!@socket_connect($sock, $ip, $port)) {
            socket_close($sock);
            fclose($fp);
            throw new Exception('Falha ao conectar socket ao gdeliveryd');
        }

        $hello = '';
        @socket_recv($sock, $hello, 8192, 0);

        $sentBytes = @socket_send($sock, $data, strlen($data), 0);
        if ($sentBytes === false) {
            $err = socket_strerror(socket_last_error($sock));
            socket_close($sock);
            fclose($fp);
            throw new Exception('Falha ao enviar pacote para gdeliveryd: ' . $err);
        }

        $response = '';
        @socket_recv($sock, $response, 8192, 0);

        socket_close($sock);
        fclose($fp);

        return [
            'hello_len' => strlen($hello),
            'sent_bytes' => intval($sentBytes),
            'response_hex' => ($response !== '') ? bin2hex($response) : '',
            'response_len' => strlen($response),
        ];
    }

    public function forbidRole($roleid, $seconds, $reason, $ip, $port)
    {
        $pack = pack('N*', -1, 0, intval($roleid), intval($seconds)) . $this->packString((string) $reason);
        return $this->sendToDelivery($this->createHeader(self::OP_FORBID_ROLE, $pack), $ip, $port);
    }

    public function forbidAccount($userid, $seconds, $reason, $ip, $port)
    {
        $pack = pack('N*', -1, 0, intval($userid), intval($seconds)) . $this->packString((string) $reason);
        return $this->sendToDelivery($this->createHeader(self::OP_FORBID_ACC, $pack), $ip, $port);
    }

    public function accountForbidAction($provider, $userid, $seconds, $reason, $ip, $port)
    {
        $provider = intval($provider);
        if (!in_array($provider, [0, 1, 2], true)) {
            throw new Exception('provider de forbidAcc invalido');
        }

        $pack = pack(
            'NCN*',
            0xFFFFFFFF,
            $provider,
            0xFFFFFFFF,
            0xFFFFFFFF,
            intval($userid),
            intval($seconds)
        ) . $this->packString((string) $reason);

        $wire = $this->sendToGamedBD($this->createHeader(self::OP_FORBID_ACC, $pack), $ip, $port);
        $payload = $this->deleteHeader($wire);
        $this->cycle = false;
        $decoded = $this->unmarshal($payload, $this->struct_forbid_account_response);

        if (!is_array($decoded) || !array_key_exists('retcode', $decoded)) {
            throw new Exception('Falha ao interpretar resposta do forbidAcc');
        }

        $forbid = array_value($decoded, 'forbid', []);
        $forbid = is_array($forbid) ? array_values($forbid) : [];

        return [
            'provider' => $provider,
            'userid' => intval($userid),
            'seconds' => intval($seconds),
            'reason' => (string) $reason,
            'retcode' => intval(array_value($decoded, 'retcode', -1)),
            'forbid_count' => count($forbid),
            'forbid' => $forbid,
            'wire_prefix' => substr(bin2hex($wire), 0, 128),
        ];
    }

    public function clearRoleForbid($roleid, $ip, $port)
    {
        $roleid = intval($roleid);
        if ($roleid <= 0) {
            throw new Exception('roleid invalido para limpeza de forbid');
        }

        $base = $this->getRoleBase($roleid, $ip, $port);
        if (!is_array($base)) {
            throw new Exception('Nao foi possivel ler base do roleid ' . $roleid);
        }

        $before = array_value($base, 'forbid', []);
        $before = is_array($before) ? array_values($before) : [];

        $base['forbid'] = [];
        $this->putRoleBase($roleid, $base, $ip, $port);

        $fresh = $this->getRoleBase($roleid, $ip, $port);
        $after = is_array($fresh) ? array_value($fresh, 'forbid', []) : [];
        $after = is_array($after) ? array_values($after) : [];

        return [
            'roleid' => $roleid,
            'before' => $before,
            'after' => $after,
            'cleared' => empty($after),
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

function firstArrayValue(array $source, array $keys, $default = null)
{
    foreach ($keys as $key) {
        if (array_key_exists($key, $source)) {
            return $source[$key];
        }
    }

    return $default;
}

function mergeMailRequestPayload(array $request)
{
    $merged = $request;

    foreach (['payload', 'mail', 'reward', 'item'] as $field) {
        $candidate = array_value($request, $field, null);
        if (is_array($candidate)) {
            $merged = array_merge($merged, $candidate);
        }
    }

    return $merged;
}

function truncateUtf8Text($value, $maxLength)
{
    $text = trim((string) $value);
    $maxLength = max(0, intval($maxLength));

    if ($text === '' || $maxLength === 0) {
        return $text;
    }

    if (function_exists('mb_strlen') && function_exists('mb_substr')) {
        return mb_strlen($text, 'UTF-8') <= $maxLength
            ? $text
            : mb_substr($text, 0, $maxLength, 'UTF-8');
    }

    return strlen($text) <= $maxLength ? $text : substr($text, 0, $maxLength);
}

function normalizeMailEnvelope(array $request, array $config, $defaultTitle, $defaultMessage)
{
    $merged = mergeMailRequestPayload($request);
    $roleid = intval(firstArrayValue($merged, ['roleid', 'role_id', 'target_roleid', 'receiver_roleid'], 0));
    if ($roleid <= 0) {
        throw new InvalidArgumentException('roleid invalido');
    }

    $title = truncateUtf8Text(firstArrayValue($merged, ['title', 'subject', 'mail_title'], $defaultTitle), 120);
    if ($title === '') {
        $title = $defaultTitle;
    }

    $message = truncateUtf8Text(firstArrayValue($merged, ['message', 'body', 'content', 'mail_message'], $defaultMessage), 1000);
    if ($message === '') {
        $message = $defaultMessage;
    }

    return [
        'request' => $merged,
        'roleid' => $roleid,
        'title' => $title,
        'message' => $message,
        'gdelivery_ip' => trim((string) array_value($config, 'gdeliveryd_ip', '127.0.0.1')),
        'gdelivery_port' => max(1, intval(array_value($config, 'gdeliveryd_port', 29100))),
        'dry_run' => truthyValue(firstArrayValue($merged, ['dry_run', 'dryRun'], false)),
    ];
}

function buildSendMailItemPayload(array $request, array $config)
{
    $mail = normalizeMailEnvelope($request, $config, 'Recompensa do servidor', 'Voce recebeu um item no correio.');
    $merged = $mail['request'];

    $itemId = intval(firstArrayValue($merged, ['item_id', 'id'], 0));
    if ($itemId <= 0) {
        throw new InvalidArgumentException('item_id invalido');
    }

    $count = max(1, intval(firstArrayValue($merged, ['count', 'amount', 'quantity'], 1)));
    $maxStack = intval(firstArrayValue($merged, ['max_stack', 'max_count'], $count));
    if ($maxStack <= 0) {
        $maxStack = $count;
    }
    if ($maxStack < $count) {
        $maxStack = $count;
    }

    $dataHex = preg_replace('/[^0-9a-fA-F]/', '', (string) firstArrayValue($merged, ['data_hex', 'data', 'hex'], ''));
    if ($dataHex !== '' && (strlen($dataHex) % 2) !== 0) {
        throw new InvalidArgumentException('data/item hex invalido');
    }

    return [
        'kind' => 'item',
        'roleid' => $mail['roleid'],
        'title' => $mail['title'],
        'message' => $mail['message'],
        'item_id' => $itemId,
        'item_name' => truncateUtf8Text(firstArrayValue($merged, ['item_name', 'name'], ''), 120),
        'count' => $count,
        'max_stack' => $maxStack,
        'data_hex' => strtolower($dataHex),
        'proctype' => max(0, intval(firstArrayValue($merged, ['proctype'], 0))),
        'expire_date' => max(0, intval(firstArrayValue($merged, ['expire_date', 'expire'], 0))),
        'guid1' => max(0, intval(firstArrayValue($merged, ['guid1'], 0))),
        'guid2' => max(0, intval(firstArrayValue($merged, ['guid2'], 0))),
        'mask' => max(0, intval(firstArrayValue($merged, ['mask'], 0))),
        'money' => max(0, intval(firstArrayValue($merged, ['money', 'gold', 'coins'], 0))),
        'gdelivery_ip' => $mail['gdelivery_ip'],
        'gdelivery_port' => $mail['gdelivery_port'],
        'dry_run' => $mail['dry_run'],
    ];
}

function buildSendMailGoldPayload(array $request, array $config)
{
    $mail = normalizeMailEnvelope($request, $config, 'Recompensa do servidor', 'Voce recebeu moedas no correio.');
    $merged = $mail['request'];
    $money = max(0, intval(firstArrayValue($merged, ['money', 'gold', 'coins', 'amount', 'value'], 0)));
    if ($money <= 0) {
        throw new InvalidArgumentException('money invalido');
    }

    return [
        'kind' => 'gold',
        'roleid' => $mail['roleid'],
        'title' => $mail['title'],
        'message' => $mail['message'],
        'item_id' => 0,
        'item_name' => '',
        'count' => 0,
        'max_stack' => 0,
        'data_hex' => '',
        'proctype' => 0,
        'expire_date' => 0,
        'guid1' => 0,
        'guid2' => 0,
        'mask' => 0,
        'money' => $money,
        'gdelivery_ip' => $mail['gdelivery_ip'],
        'gdelivery_port' => $mail['gdelivery_port'],
        'dry_run' => $mail['dry_run'],
    ];
}

function mergedSecurityRequest(array $request)
{
    $merged = $request;

    foreach (['payload', 'moderation', 'target', 'ban', 'kick'] as $field) {
        $candidate = array_value($request, $field, null);
        if (is_array($candidate)) {
            $merged = array_merge($merged, $candidate);
        }
    }

    return $merged;
}

function securityReasonFromRequest(array $request, array $config)
{
    $reason = truncateUtf8Text(firstArrayValue($request, ['reason', 'message', 'note', 'moderation_reason'], ''), 250);
    $minLength = max(1, intval(array_value($config, 'security_reason_min_length', 3)));

    $tooShort = function_exists('mb_strlen')
        ? (mb_strlen($reason, 'UTF-8') < $minLength)
        : (strlen($reason) < $minLength);

    if ($reason === '' || $tooShort) {
        throw new InvalidArgumentException('motivo obrigatorio (minimo ' . $minLength . ' caracteres)');
    }

    return $reason;
}

function securityResolveRoleId(array $request)
{
    return intval(firstArrayValue($request, ['roleid', 'role_id', 'target_roleid'], 0));
}

function securityResolveUserIdFromRole(GamedProtocol $proto, array $config, $roleid)
{
    $roleid = intval($roleid);
    if ($roleid <= 0) {
        throw new InvalidArgumentException('roleid invalido');
    }

    $base = $proto->getRoleBase($roleid, $config['gamedbd_ip'], $config['gamedbd_port']);
    $userid = intval(array_value($base, 'userid', 0));
    if ($userid <= 0) {
        throw new Exception('Nao foi possivel resolver userid para o roleid ' . $roleid);
    }

    return [
        'userid' => $userid,
        'base' => $base,
    ];
}

function securityDurationFromRequest(array $request)
{
    return max(0, intval(firstArrayValue($request, ['duration_seconds', 'durationSeconds', 'duration', 'seconds', 'time'], 0)));
}

function buildKickRolePayload(array $request, array $config)
{
    $merged = mergedSecurityRequest($request);
    $roleid = securityResolveRoleId($merged);
    if ($roleid <= 0) {
        throw new InvalidArgumentException('roleid invalido');
    }

    $seconds = securityDurationFromRequest($merged);
    if ($seconds <= 0) {
        $seconds = max(1, intval(array_value($config, 'security_kick_default_seconds', 10)));
    }

    $maxSeconds = max(1, intval(array_value($config, 'security_kick_max_seconds', 600)));
    if ($seconds > $maxSeconds) {
        $seconds = $maxSeconds;
    }

    return [
        'action' => 'kickRole',
        'roleid' => $roleid,
        'seconds' => $seconds,
        'reason' => securityReasonFromRequest($merged, $config),
        'dry_run' => truthyValue(firstArrayValue($merged, ['dry_run', 'dryRun'], false)),
    ];
}

function buildBanAccountPayload(array $request, array $config, GamedProtocol $proto)
{
    $merged = mergedSecurityRequest($request);
    $reason = securityReasonFromRequest($merged, $config);
    $roleid = securityResolveRoleId($merged);
    $userid = intval(firstArrayValue($merged, ['userid', 'user_id', 'account_id', 'accountId', 'target_userid'], 0));
    $permanent = truthyValue(firstArrayValue($merged, ['permanent', 'is_permanent'], false))
        || in_array(strtolower((string) firstArrayValue($merged, ['ban_type', 'type', 'mode'], '')), ['permanent', 'perm'], true);

    if ($userid <= 0 && $roleid > 0) {
        $resolved = securityResolveUserIdFromRole($proto, $config, $roleid);
        $userid = intval(array_value($resolved, 'userid', 0));
    }

    if ($userid <= 0) {
        throw new InvalidArgumentException('userid/account_id invalido');
    }

    $seconds = $permanent
        ? max(1, intval(array_value($config, 'security_ban_permanent_seconds', 2147483647)))
        : securityDurationFromRequest($merged);

    if (!$permanent && $seconds <= 0) {
        throw new InvalidArgumentException('duracao obrigatoria para ban temporario');
    }

    return [
        'action' => 'banAccount',
        'userid' => $userid,
        'roleid' => $roleid,
        'seconds' => $seconds,
        'permanent' => $permanent,
        'reason' => $reason,
        'dry_run' => truthyValue(firstArrayValue($merged, ['dry_run', 'dryRun'], false)),
    ];
}

function buildUnbanAccountPayload(array $request, array $config, GamedProtocol $proto)
{
    $merged = mergedSecurityRequest($request);
    $roleid = securityResolveRoleId($merged);
    $userid = intval(firstArrayValue($merged, ['userid', 'user_id', 'account_id', 'accountId', 'target_userid'], 0));

    if ($userid <= 0 && $roleid > 0) {
        $resolved = securityResolveUserIdFromRole($proto, $config, $roleid);
        $userid = intval(array_value($resolved, 'userid', 0));
    }

    if ($userid <= 0) {
        throw new InvalidArgumentException('userid/account_id invalido');
    }

    $seconds = securityDurationFromRequest($merged);
    if ($seconds <= 0) {
        $seconds = max(0, intval(array_value($config, 'security_unban_seconds', 0)));
    }

    return [
        'action' => 'unbanAccount',
        'userid' => $userid,
        'roleid' => $roleid,
        'seconds' => $seconds,
        'reason' => securityReasonFromRequest($merged, $config),
        'dry_run' => truthyValue(firstArrayValue($merged, ['dry_run', 'dryRun'], false)),
    ];
}

function appendSecurityActionLog(array $config, array $entry)
{
    $dir = trim((string) array_value($config, 'security_log_dir', ''));
    if ($dir === '') {
        return null;
    }

    if (!is_dir($dir) && !@mkdir($dir, 0750, true)) {
        return null;
    }

    $file = rtrim($dir, '/\\') . DIRECTORY_SEPARATOR . 'security-' . gmdate('Y-m-d') . '.jsonl';
    $line = json_encode($entry, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) . "\n";
    if ($line === false || @file_put_contents($file, $line, FILE_APPEND) === false) {
        return null;
    }

    return $file;
}

function executeSecurityAction(array $config, array $payload)
{
    $proto = new GamedProtocol();

    $result = [
        'success' => true,
        'action' => array_value($payload, 'action', ''),
        'roleid' => intval(array_value($payload, 'roleid', 0)),
        'userid' => intval(array_value($payload, 'userid', 0)),
        'seconds' => intval(array_value($payload, 'seconds', 0)),
        'reason' => array_value($payload, 'reason', ''),
        'dry_run' => truthyValue(array_value($payload, 'dry_run', false)),
    ];

    if ($result['dry_run']) {
        $result['message'] = 'Dry run de seguranca validado com sucesso';
        $logFile = appendSecurityActionLog($config, array_merge($result, [
            'created_at' => gmdate('c'),
            'status' => 'dry_run',
        ]));
        if ($logFile) {
            $result['log_file'] = $logFile;
        }
        return $result;
    }

    $delivery = null;
    if ($result['action'] === 'kickRole') {
        $delivery = $proto->forbidRole($result['roleid'], $result['seconds'], $result['reason'], $config['gdeliveryd_ip'], $config['gdeliveryd_port']);
        $result['message'] = 'Kick aplicado com sucesso';
    } elseif ($result['action'] === 'banAccount') {
        $delivery = $proto->accountForbidAction(1, $result['userid'], $result['seconds'], $result['reason'], $config['gamedbd_ip'], $config['gamedbd_port']);
        if (intval(array_value($delivery, 'retcode', -1)) !== 0) {
            throw new Exception('Falha ao aplicar ban na conta (retcode ' . intval(array_value($delivery, 'retcode', -1)) . ')');
        }
        $result['message'] = truthyValue(array_value($payload, 'permanent', false))
            ? 'Ban permanente aplicado com sucesso'
            : 'Ban temporario aplicado com sucesso';
        $result['permanent'] = truthyValue(array_value($payload, 'permanent', false));
    } elseif ($result['action'] === 'unbanAccount') {
        $accountDelivery = $proto->accountForbidAction(2, $result['userid'], $result['seconds'], $result['reason'], $config['gamedbd_ip'], $config['gamedbd_port']);
        if (intval(array_value($accountDelivery, 'retcode', -1)) !== 0) {
            throw new Exception('Falha ao liberar conta no gamedbd (retcode ' . intval(array_value($accountDelivery, 'retcode', -1)) . ')');
        }
        $accountState = $proto->accountForbidAction(0, $result['userid'], 0, '', $config['gamedbd_ip'], $config['gamedbd_port']);
        $delivery = [
            'account' => $accountDelivery,
            'account_state' => $accountState,
        ];
        if ($result['roleid'] > 0) {
            $delivery['role_clear'] = $proto->clearRoleForbid($result['roleid'], $config['gamedbd_ip'], $config['gamedbd_port']);
        }

        $accountStillForbidden = intval(array_value($accountState, 'retcode', -1)) !== 0
            || intval(array_value($accountState, 'forbid_count', 0)) > 0;
        $roleStillForbidden = $result['roleid'] > 0
            && !truthyValue(array_value(array_value($delivery, 'role_clear', []), 'cleared', false));

        if ($accountStillForbidden || $roleStillForbidden) {
            $details = [];
            if ($accountStillForbidden) {
                $details[] = 'conta continua com bloqueios ativos';
            }
            if ($roleStillForbidden) {
                $details[] = 'role ainda possui forbid na base';
            }
            throw new Exception('Falha ao liberar personagem: ' . implode('; ', $details));
        }
        $result['message'] = 'Conta liberada com sucesso';
    } else {
        throw new InvalidArgumentException('acao de seguranca invalida');
    }

    $result['delivery'] = $delivery;
    $logFile = appendSecurityActionLog($config, array_merge($result, [
        'created_at' => gmdate('c'),
        'status' => 'success',
    ]));
    if ($logFile) {
        $result['log_file'] = $logFile;
    }

    return $result;
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

function parseCommandJsonOutput($output)
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

function parseBackupCommandOutput($output)
{
    return parseCommandJsonOutput($output);
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

function executeMailSendCommand(array $config, array $payload)
{
    $command = trim((string) array_value($config, 'mail_send_command', ''));
    if ($command === '') {
        throw new Exception('Comando de envio de correio nao configurado');
    }

    if (!function_exists('exec')) {
        throw new Exception('exec() desabilitado no PHP');
    }

    $tempFile = @tempnam(sys_get_temp_dir(), 'pwmail_');
    if ($tempFile === false || $tempFile === '') {
        throw new Exception('Nao foi possivel criar arquivo temporario para envio de correio');
    }

    $json = json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    if ($json === false || @file_put_contents($tempFile, $json) === false) {
        @unlink($tempFile);
        throw new Exception('Falha ao serializar payload de correio');
    }

    $output = [];
    $exitCode = 0;
    $cmd = $command . ' ' . escapeshellarg($tempFile);
    @exec($cmd . ' 2>&1', $output, $exitCode);
    @unlink($tempFile);

    $rawOutput = trim(implode("\n", $output));
    $parsed = parseCommandJsonOutput($rawOutput);

    if ($exitCode !== 0) {
        if (is_array($parsed)) {
            $error = trim((string) array_value($parsed, 'error', array_value($parsed, 'message', '')));
            if ($error !== '') {
                throw new Exception('Envio de correio falhou: ' . $error);
            }
        }

        throw new Exception('Envio de correio falhou (exit ' . $exitCode . '): ' . $rawOutput);
    }

    if (is_array($parsed)) {
        if (array_key_exists('success', $parsed) && !truthyValue(array_value($parsed, 'success', false))) {
            $error = trim((string) array_value($parsed, 'error', array_value($parsed, 'message', 'Falha ao enviar correio')));
            throw new Exception($error !== '' ? $error : 'Falha ao enviar correio');
        }

        return $parsed;
    }

    return [
        'success' => true,
        'message' => 'Correio enviado com sucesso',
        'stdout' => $rawOutput,
    ];
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

function serverOpsKnownServices()
{
    return [
        [
            'key' => 'logservice',
            'label' => 'Log Service',
            'display_process' => 'logservice',
            'process_names' => ['logservice'],
            'systemd_units' => ['logservice'],
            'port' => 0,
        ],
        [
            'key' => 'gamedbd',
            'label' => 'Game DB Daemon',
            'display_process' => 'gamedbd',
            'process_names' => ['gamedbd'],
            'systemd_units' => ['gamedbd'],
            'port' => 29400,
        ],
        [
            'key' => 'gdeliveryd',
            'label' => 'Delivery Daemon',
            'display_process' => 'gdeliveryd',
            'process_names' => ['gdeliveryd'],
            'systemd_units' => ['gdeliveryd'],
            'port' => 29100,
        ],
        [
            'key' => 'gacd',
            'label' => 'Account Daemon',
            'display_process' => 'gacd',
            'process_names' => ['gacd'],
            'systemd_units' => ['gacd'],
            'port' => 29000,
        ],
        [
            'key' => 'glinkd',
            'label' => 'Game Link',
            'display_process' => 'glink',
            'process_names' => ['glinkd', 'glink'],
            'systemd_units' => ['glinkd', 'glink'],
            'port' => 29200,
        ],
        [
            'key' => 'authd',
            'label' => 'Auth Daemon',
            'display_process' => 'authd',
            'process_names' => ['authd', 'gauthd'],
            'systemd_units' => ['authd', 'gauthd'],
            'port' => 29300,
        ],
        [
            'key' => 'uniquenamed',
            'label' => 'Unique Name',
            'display_process' => 'uniquenamed',
            'process_names' => ['uniquenamed'],
            'systemd_units' => ['uniquenamed'],
            'port' => 29500,
        ],
        [
            'key' => 'gfactiond',
            'label' => 'Faction Daemon',
            'display_process' => 'gfactiond',
            'process_names' => ['gfactiond'],
            'systemd_units' => ['gfactiond'],
            'port' => 0,
        ],
        [
            'key' => 'gamed',
            'label' => 'World',
            'display_process' => 'gs',
            'process_names' => ['gs', 'gamed'],
            'systemd_units' => ['gamed', 'gs'],
            'port' => 0,
        ],
        [
            'key' => 'mysql',
            'label' => 'MySQL/MariaDB',
            'display_process' => 'mysql',
            'process_names' => ['mariadbd', 'mysqld', 'mysqld_safe', 'mysql'],
            'systemd_units' => ['mariadb', 'mysqld', 'mysql'],
            'port' => 3306,
        ],
        [
            'key' => 'httpd',
            'label' => 'Web (Apache/httpd)',
            'display_process' => 'httpd',
            'process_names' => ['httpd', 'apache2'],
            'systemd_units' => ['httpd', 'apache2'],
            'port' => 80,
        ],
    ];
}

function serverOpsShellAvailable()
{
    if (!function_exists('shell_exec')) {
        return false;
    }

    $disabled = ini_get('disable_functions');
    if (!is_string($disabled) || trim($disabled) === '') {
        return true;
    }

    $parts = array_map('trim', explode(',', $disabled));
    return !in_array('shell_exec', $parts, true);
}

function serverOpsRun($command)
{
    if (!serverOpsShellAvailable()) {
        return '';
    }

    $output = @shell_exec($command);
    return is_string($output) ? $output : '';
}

function serverOpsParsePidList($output)
{
    $output = is_string($output) ? trim($output) : '';
    if ($output === '') {
        return [];
    }

    $pids = preg_split('/\s+/', $output);
    $pids = array_values(array_unique(array_filter(array_map('intval', $pids), function ($pid) {
        return $pid > 0;
    })));

    sort($pids);
    return $pids;
}

function serverOpsPidState($pid)
{
    $pid = intval($pid);
    if ($pid <= 0) {
        return '';
    }

    $output = trim(serverOpsRun('ps -o stat= -p ' . $pid . ' 2>/dev/null'));
    if ($output === '') {
        return '';
    }

    return strtoupper(substr($output, 0, 1));
}

function serverOpsPidIsActive($pid)
{
    $state = serverOpsPidState($pid);
    if ($state === '') {
        return false;
    }

    return !in_array($state, ['Z', 'X', 'T'], true);
}

function serverOpsCollectPids(array $processNames)
{
    $all = [];

    foreach ($processNames as $name) {
        $name = trim((string) $name);
        if ($name === '') {
            continue;
        }

        $exact = serverOpsRun('pgrep -x ' . escapeshellarg($name) . ' 2>/dev/null');
        $all = array_merge($all, serverOpsParsePidList($exact));

        if (empty($all)) {
            $fuzzy = serverOpsRun('pgrep -f ' . escapeshellarg($name) . ' 2>/dev/null');
            $all = array_merge($all, serverOpsParsePidList($fuzzy));
        }
    }

    $all = array_values(array_unique(array_filter(array_map('intval', $all), function ($pid) {
        return $pid > 0;
    })));
    $all = array_values(array_filter($all, function ($pid) {
        return serverOpsPidIsActive($pid);
    }));
    sort($all);

    return $all;
}

function serverOpsPortListening($port)
{
    $port = intval($port);
    if ($port <= 0) {
        return false;
    }

    $checks = [
        'ss -lnt 2>/dev/null',
        'netstat -lnt 2>/dev/null',
    ];

    foreach ($checks as $command) {
        $output = serverOpsRun($command);
        if ($output === '') {
            continue;
        }

        if (preg_match('/[:.]' . preg_quote((string) $port, '/') . '\b/', $output)) {
            return true;
        }
    }

    return false;
}

function serverOpsSystemctlState(array $units)
{
    foreach ($units as $unit) {
        $unit = trim((string) $unit);
        if ($unit === '') {
            continue;
        }

        $state = trim(serverOpsRun('systemctl is-active ' . escapeshellarg($unit) . ' 2>/dev/null'));
        if ($state !== '') {
            return $state;
        }
    }

    return '';
}

function serverOpsCollectService(array $config, array $service)
{
    $key = trim((string) array_value($service, 'key', ''));
    $pids = serverOpsCollectPids(array_value($service, 'process_names', []));
    $port = intval(array_value($service, 'port', 0));
    $listening = serverOpsPortListening($port);
    $systemdState = serverOpsSystemctlState(array_value($service, 'systemd_units', []));

    if ($key === 'gamed') {
        $instancesSnapshot = getManageableInstancesSnapshot($config);
        $worldIndex = [];
        foreach ((array) array_value($instancesSnapshot, 'instances', []) as $instance) {
            $code = trim((string) array_value($instance, 'code', ''));
            if ($code !== '') {
                $worldIndex[$code] = $instance;
            }
        }

        $world = array_value($worldIndex, 'gs01', []);
        if (!empty($world)) {
            $port = intval(array_value($world, 'listen_port', $port));
            $listening = truthyValue(array_value($world, 'listening', false));
            $pids = array_values(array_filter(array_map('intval', (array) array_value($world, 'pids', [])), function ($pid) {
                return $pid > 0;
            }));
            sort($pids);
        }
    }

    $state = 'unknown';
    if ($systemdState === 'active') {
        $state = 'online';
    } elseif ($port > 0) {
        $state = $listening ? 'online' : 'offline';
    } elseif (!empty($pids)) {
        $state = 'online';
    } elseif (in_array($systemdState, ['inactive', 'failed', 'dead'], true)) {
        $state = 'offline';
    } elseif (empty($pids)) {
        $state = 'offline';
    }

    return [
        'key' => array_value($service, 'key', ''),
        'label' => array_value($service, 'label', ''),
        'process_name' => array_value($service, 'display_process', ''),
        'port' => $port,
        'state' => $state,
        'pid' => !empty($pids) ? intval($pids[0]) : null,
        'process_count' => count($pids),
        'pids' => $pids,
        'systemd_state' => $systemdState,
        'listening' => $listening,
    ];
}

function getServiceStatusSnapshot(array $config)
{
    $services = [];
    foreach (serverOpsKnownServices() as $service) {
        $services[] = serverOpsCollectService($config, $service);
    }

    return [
        'success' => true,
        'services' => $services,
        'collected_at' => gmdate('c'),
    ];
}

function getManageableServicesSnapshot(array $config)
{
    $known = [];
    foreach (serverOpsKnownServices() as $service) {
        $key = trim((string) array_value($service, 'key', ''));
        if ($key !== '') {
            $known[$key] = $service;
        }
    }

    $aliasesByKey = [];
    foreach (serverOpsServiceAliases() as $alias => $key) {
        if (!isset($aliasesByKey[$key])) {
            $aliasesByKey[$key] = [];
        }
        $aliasesByKey[$key][] = (string) $alias;
    }

    $status = getServiceStatusSnapshot($config);
    $statusIndex = [];
    foreach (array_value($status, 'services', []) as $item) {
        $key = trim((string) array_value($item, 'key', ''));
        if ($key !== '') {
            $statusIndex[$key] = $item;
        }
    }

    $manageable = [];
    foreach (serverOpsManageableServiceKeys($config) as $key) {
        $meta = isset($known[$key]) ? $known[$key] : ['key' => $key, 'label' => $key, 'display_process' => $key, 'port' => 0];
        $item = isset($statusIndex[$key]) ? $statusIndex[$key] : ['state' => 'unknown', 'pid' => null, 'process_count' => 0, 'pids' => [], 'systemd_state' => '', 'listening' => false];
        $manageable[] = [
            'key' => $key,
            'label' => array_value($meta, 'label', $key),
            'process_name' => array_value($meta, 'display_process', $key),
            'port' => intval(array_value($item, 'port', array_value($meta, 'port', 0))),
            'state' => array_value($item, 'state', 'unknown'),
            'pid' => array_value($item, 'pid', null),
            'process_count' => intval(array_value($item, 'process_count', 0)),
            'pids' => array_value($item, 'pids', []),
            'systemd_state' => array_value($item, 'systemd_state', ''),
            'listening' => truthyValue(array_value($item, 'listening', false)),
            'aliases' => array_values(array_unique(array_value($aliasesByKey, $key, []))),
            'supported_actions' => ['start', 'stop', 'restart'],
            'selectable' => true,
        ];
    }

    return [
        'success' => true,
        'services' => $manageable,
        'count' => count($manageable),
        'collected_at' => array_value($status, 'collected_at', gmdate('c')),
    ];
}

function instanceControlNormalizeCode($code)
{
    return strtolower(trim((string) $code));
}

function instanceControlCatalogPath(array $config)
{
    return trim((string) array_value($config, 'pwadmin_instance_catalog_path', '/home/pwadmin/instance.txt'));
}

function instanceControlAutostartPath(array $config)
{
    return trim((string) array_value($config, 'pwadmin_autoinstance_path', '/home/pwadmin/autoinstance.txt'));
}

function instanceControlGsConfPath(array $config)
{
    return trim((string) array_value($config, 'gamed_gs_conf_path', '/home/gamed/gs.conf'));
}

function instanceControlReadLines($path)
{
    $path = trim((string) $path);
    if ($path === '' || !is_file($path) || !is_readable($path)) {
        return [];
    }

    $lines = @file($path, FILE_IGNORE_NEW_LINES);
    return is_array($lines) ? $lines : [];
}

function instanceControlReadCatalog($path)
{
    $catalog = [];
    $order = 0;

    foreach (instanceControlReadLines($path) as $line) {
        $line = trim((string) $line);
        if ($line === '' || strpos($line, '#') === 0 || strpos($line, ';') === 0) {
            continue;
        }

        $parts = explode('=', $line, 2);
        $code = instanceControlNormalizeCode(array_value($parts, 0, ''));
        if ($code === '') {
            continue;
        }

        $name = trim((string) array_value($parts, 1, ''));
        $catalog[$code] = [
            'code' => $code,
            'name' => ($name !== '') ? $name : strtoupper($code),
            'order' => $order++,
        ];
    }

    return $catalog;
}

function instanceControlReadAutostart($path)
{
    $codes = [];
    $order = 0;
    foreach (instanceControlReadLines($path) as $line) {
        $line = trim((string) $line);
        if ($line === '' || strpos($line, '#') === 0 || strpos($line, ';') === 0) {
            continue;
        }

        $code = instanceControlNormalizeCode($line);
        if ($code !== '') {
            $codes[$code] = $order++;
        }
    }

    return $codes;
}

function instanceControlSplitCodeList($value)
{
    $value = trim((string) $value);
    if ($value === '') {
        return [];
    }

    $tokens = preg_split('/[;,\s]+/', $value);
    $codes = [];
    foreach ((array) $tokens as $token) {
        $code = instanceControlNormalizeCode($token);
        if ($code !== '') {
            $codes[] = $code;
        }
    }

    return array_values(array_unique($codes));
}

function instanceControlReadGsConf($path)
{
    $result = [
        'world_servers' => [],
        'instance_servers' => [],
        'section_types' => [],
        'details' => [],
    ];

    $currentSectionType = '';
    $currentCode = '';

    foreach (instanceControlReadLines($path) as $line) {
        $trimmed = trim((string) $line);
        if ($trimmed === '' || strpos($trimmed, '#') === 0 || strpos($trimmed, ';') === 0) {
            continue;
        }

        if (preg_match('/^(world_servers|instance_servers)\s*=\s*(.+)$/i', $trimmed, $matches)) {
            $key = strtolower(trim((string) $matches[1]));
            $result[$key] = instanceControlSplitCodeList(array_value($matches, 2, ''));
            continue;
        }

        if (preg_match('/^\[([A-Za-z]+)_([A-Za-z0-9]+)\]$/', $trimmed, $matches)) {
            $currentSectionType = strtolower(trim((string) $matches[1]));
            $currentCode = instanceControlNormalizeCode(array_value($matches, 2, ''));
            if ($currentCode !== '') {
                if (!isset($result['section_types'][$currentCode])) {
                    $result['section_types'][$currentCode] = [];
                }
                if (!in_array($currentSectionType, $result['section_types'][$currentCode], true)) {
                    $result['section_types'][$currentCode][] = $currentSectionType;
                }
            }
            continue;
        }

        if ($currentCode !== '' && strpos($trimmed, '=') !== false) {
            $parts = explode('=', $trimmed, 2);
            $key = strtolower(trim((string) array_value($parts, 0, '')));
            $value = trim((string) array_value($parts, 1, ''));
            if (in_array($key, ['instance_capacity', 'player_per_instance', 'effect_player_per_instance', 'listen_addr'], true)) {
                if (!isset($result['details'][$currentCode])) {
                    $result['details'][$currentCode] = [];
                }
                if (!isset($result['details'][$currentCode][$key])) {
                    $result['details'][$currentCode][$key] = $value;
                }
                if (!isset($result['details'][$currentCode]['section_type']) && $currentSectionType !== '') {
                    $result['details'][$currentCode]['section_type'] = $currentSectionType;
                }
            }
        }
    }

    return $result;
}

function instanceControlPreferredSectionType(array $sectionTypes)
{
    $normalized = array_values(array_unique(array_filter(array_map(function ($value) {
        return strtolower(trim((string) $value));
    }, $sectionTypes), function ($value) {
        return $value !== '';
    })));

    foreach (['instance', 'world', 'terrain', 'msgreceivertcp', 'msgreceiverunix'] as $preferred) {
        if (in_array($preferred, $normalized, true)) {
            return $preferred;
        }
    }

    return !empty($normalized) ? (string) $normalized[0] : '';
}

function instanceControlPortFromListenAddr($listenAddr)
{
    $listenAddr = trim((string) $listenAddr);
    if ($listenAddr === '') {
        return 0;
    }

    if (preg_match('/:(\d+)$/', $listenAddr, $matches)) {
        return intval($matches[1]);
    }

    return 0;
}

function instanceControlCodeCategory($code)
{
    $code = instanceControlNormalizeCode($code);
    if (preg_match('/^gs\d+$/i', $code)) {
        return 'world';
    }
    if (preg_match('/^arena\d+$/i', $code)) {
        return 'arena';
    }
    if (preg_match('/^bg\d+$/i', $code)) {
        return 'battle';
    }
    if (preg_match('/^is\d+$/i', $code)) {
        return 'instance';
    }
    if (preg_match('/^rand\d+$/i', $code)) {
        return 'random';
    }
    if (preg_match('/^q\d+$/i', $code)) {
        return 'quest';
    }
    if (preg_match('/^b\d+$/i', $code)) {
        return 'special';
    }
    return 'other';
}

function instanceControlIsCodeToken($token)
{
    return preg_match('/^(gs\d+|is\d+|arena\d+|bg\d+|rand\d+|q\d+|b\d+)$/i', (string) $token) === 1;
}

function instanceControlExtractRunningCodesFromArgs($args)
{
    $args = trim((string) $args);
    if ($args === '') {
        return [];
    }

    $tokens = preg_split('/\s+/', $args);
    $binaryIndex = -1;
    foreach ((array) $tokens as $idx => $token) {
        $token = trim((string) $token, "\"'");
        if ($token === 'gs' || $token === './gs' || preg_match('/(^|[\/\\\\])gs$/i', $token)) {
            $binaryIndex = intval($idx);
            break;
        }
    }

    if ($binaryIndex < 0) {
        return [];
    }

    $codes = [];
    for ($i = $binaryIndex + 1; $i < count($tokens); $i++) {
        $token = trim((string) $tokens[$i], "\"'");
        if ($token === '' || preg_match('/\.conf$/i', $token)) {
            continue;
        }
        if (instanceControlIsCodeToken($token)) {
            $codes[] = instanceControlNormalizeCode($token);
        }
    }

    return array_values(array_unique($codes));
}

function instanceControlRunningIndex()
{
    $output = serverOpsRun('ps -eo pid=,args= 2>/dev/null');
    if ($output === '') {
        return [];
    }

    $index = [];
    $lines = preg_split("/\r\n|\n|\r/", trim($output));
    foreach ((array) $lines as $line) {
        $line = trim((string) $line);
        if ($line === '' || !preg_match('/^(\d+)\s+(.+)$/', $line, $matches)) {
            continue;
        }

        $pid = intval($matches[1]);
        $args = trim((string) $matches[2]);
        $codes = instanceControlExtractRunningCodesFromArgs($args);
        if (empty($codes)) {
            continue;
        }

        $batchSize = count($codes);
        foreach ($codes as $code) {
            if (!isset($index[$code])) {
                $index[$code] = [
                    'running' => true,
                    'pids' => [],
                    'command_excerpt' => $args,
                    'batch_size' => $batchSize,
                ];
            }
            $index[$code]['pids'][] = $pid;
            if ($batchSize > intval(array_value($index[$code], 'batch_size', 0))) {
                $index[$code]['batch_size'] = $batchSize;
            }
        }
    }

    foreach ($index as $code => $item) {
        $pids = array_values(array_unique(array_filter(array_map('intval', array_value($item, 'pids', [])), function ($pid) {
            return $pid > 0;
        })));
        sort($pids);
        $index[$code]['pids'] = $pids;
        $index[$code]['process_count'] = count($pids);
    }

    return $index;
}

function getManageableInstancesSnapshot(array $config)
{
    $catalogPath = instanceControlCatalogPath($config);
    $autostartPath = instanceControlAutostartPath($config);
    $gsConfPath = instanceControlGsConfPath($config);

    $catalog = instanceControlReadCatalog($catalogPath);
    $autostart = instanceControlReadAutostart($autostartPath);
    $gsConf = instanceControlReadGsConf($gsConfPath);
    $runningIndex = instanceControlRunningIndex();

    $allCodes = [];
    foreach ([$catalog, $autostart, array_flip(array_value($gsConf, 'world_servers', [])), array_flip(array_value($gsConf, 'instance_servers', [])), array_value($gsConf, 'section_types', []), $runningIndex] as $source) {
        foreach ((array) $source as $code => $value) {
            $normalized = instanceControlNormalizeCode($code);
            if ($normalized !== '') {
                $allCodes[$normalized] = true;
            }
        }
    }

    $worldIndex = array_fill_keys(array_value($gsConf, 'world_servers', []), true);
    $instanceIndex = array_fill_keys(array_value($gsConf, 'instance_servers', []), true);
    $instances = [];

    foreach (array_keys($allCodes) as $code) {
        $catalogItem = array_value($catalog, $code, []);
        $details = array_value(array_value($gsConf, 'details', []), $code, []);
        $sectionTypes = array_values(array_unique(array_value(array_value($gsConf, 'section_types', []), $code, [])));
        $sectionType = instanceControlPreferredSectionType($sectionTypes);
        $running = array_value($runningIndex, $code, []);
        $configured = isset($worldIndex[$code]) || isset($instanceIndex[$code]) || !empty($sectionTypes);
        $scope = isset($worldIndex[$code]) ? 'world_server' : (isset($instanceIndex[$code]) ? 'instance_server' : 'unassigned');
        $listenAddr = (is_array($details) && array_key_exists('listen_addr', $details)) ? trim((string) $details['listen_addr']) : '';
        $listenPort = instanceControlPortFromListenAddr($listenAddr);
        $portListening = ($listenPort > 0) ? serverOpsPortListening($listenPort) : false;
        $hasProcessMatch = truthyValue(array_value($running, 'running', false));
        $isRunning = $hasProcessMatch || $portListening;
        $autoStartOrder = array_key_exists($code, $autostart) ? intval($autostart[$code]) : null;

        $supportedActions = ['start'];
        if ($configured && $listenPort > 0) {
            $supportedActions = ['start', 'stop', 'restart'];
        }

        $instances[] = [
            'code' => $code,
            'key' => $code,
            'name' => trim((string) array_value($catalogItem, 'name', strtoupper($code))),
            'category' => instanceControlCodeCategory($code),
            'scope' => $scope,
            'configured' => $configured,
            'auto_start' => array_key_exists($code, $autostart),
            'auto_start_order' => $autoStartOrder,
            'running' => $isRunning,
            'state' => $isRunning ? 'running' : 'stopped',
            'running_source' => $hasProcessMatch ? 'process' : ($portListening ? 'listen_port' : 'none'),
            'pid' => !empty(array_value($running, 'pids', [])) ? intval(array_value(array_value($running, 'pids', []), 0, 0)) : null,
            'process_count' => intval(array_value($running, 'process_count', 0)),
            'pids' => array_value($running, 'pids', []),
            'command_excerpt' => trim((string) array_value($running, 'command_excerpt', '')),
            'batch_size' => intval(array_value($running, 'batch_size', 0)),
            'section_types' => $sectionTypes,
            'section_type' => $sectionType,
            'player_per_instance' => ($details !== [] && array_key_exists('player_per_instance', $details)) ? intval($details['player_per_instance']) : null,
            'effect_player_per_instance' => ($details !== [] && array_key_exists('effect_player_per_instance', $details)) ? intval($details['effect_player_per_instance']) : null,
            'instance_capacity' => ($details !== [] && array_key_exists('instance_capacity', $details)) ? intval($details['instance_capacity']) : null,
            'listen_addr' => $listenAddr,
            'listen_port' => $listenPort,
            'listening' => $portListening,
            'supported_actions' => $supportedActions,
            'selectable' => $configured,
            'order' => intval(array_value($catalogItem, 'order', 1000000)),
        ];
    }

    usort($instances, function ($a, $b) {
        $orderCompare = intval(array_value($a, 'order', 1000000)) <=> intval(array_value($b, 'order', 1000000));
        if ($orderCompare !== 0) {
            return $orderCompare;
        }
        return strnatcasecmp((string) array_value($a, 'code', ''), (string) array_value($b, 'code', ''));
    });

    $runningCount = 0;
    $autoStartCount = 0;
    foreach ($instances as $item) {
        if (!empty($item['running'])) {
            $runningCount++;
        }
        if (!empty($item['auto_start'])) {
            $autoStartCount++;
        }
    }

    $instances = array_map(function ($item) {
        unset($item['order']);
        return $item;
    }, $instances);

    return [
        'success' => true,
        'instances' => $instances,
        'count' => count($instances),
        'running_count' => $runningCount,
        'auto_start_count' => $autoStartCount,
        'collected_at' => gmdate('c'),
        'source_files' => [
            'catalog' => $catalogPath,
            'autostart' => $autostartPath,
            'gs_conf' => $gsConfPath,
        ],
    ];
}

function normalizeInstanceControlCodeListValue($value)
{
    $codes = [];
    $push = function ($candidate) use (&$codes) {
        $code = instanceControlNormalizeCode($candidate);
        if ($code !== '' && !in_array($code, $codes, true)) {
            $codes[] = $code;
        }
    };

    $walk = null;
    $walk = function ($item) use (&$walk, $push) {
        if (is_array($item)) {
            foreach (['code', 'key', 'instance', 'value'] as $field) {
                if (array_key_exists($field, $item)) {
                    $push(array_value($item, $field, ''));
                    return;
                }
            }

            foreach ($item as $nested) {
                $walk($nested);
            }
            return;
        }

        foreach (preg_split('/[\s,;]+/', trim((string) $item)) as $part) {
            $part = trim((string) $part);
            if ($part !== '') {
                $push($part);
            }
        }
    };

    $walk($value);
    return $codes;
}

function instanceControlAutostartCodesFromMap(array $autostart)
{
    asort($autostart, SORT_NUMERIC);
    return array_keys($autostart);
}

function validateInstanceAutoStartCodes(array $codes, array $instancesByCode)
{
    $validated = [];
    foreach ($codes as $code) {
        $code = instanceControlNormalizeCode($code);
        if ($code === '') {
            continue;
        }

        if (!isset($instancesByCode[$code])) {
            throw new InvalidArgumentException('instance invalida: ' . $code);
        }

        $instance = $instancesByCode[$code];
        if (empty($instance['configured']) || empty($instance['selectable'])) {
            throw new InvalidArgumentException('instance nao configurada para auto-start: ' . $code);
        }

        if (!in_array($code, $validated, true)) {
            $validated[] = $code;
        }
    }

    return $validated;
}

function normalizeInstanceAutoStartRequest(array $request)
{
    $replaceFields = ['codes', 'instances', 'auto_start_codes', 'autoStartCodes'];
    $addFields = ['add', 'enabled_codes', 'enabledCodes'];
    $removeFields = ['remove', 'disabled_codes', 'disabledCodes'];

    $replaceRequested = false;
    $replaceCodes = [];
    foreach ($replaceFields as $field) {
        if (!array_key_exists($field, $request)) {
            continue;
        }
        $replaceRequested = true;
        $replaceCodes = array_merge($replaceCodes, normalizeInstanceControlCodeListValue(array_value($request, $field, [])));
    }

    $addCodes = [];
    foreach ($addFields as $field) {
        if (!array_key_exists($field, $request)) {
            continue;
        }
        $addCodes = array_merge($addCodes, normalizeInstanceControlCodeListValue(array_value($request, $field, [])));
    }
    $addCodes = array_values(array_unique($addCodes));

    $removeCodes = [];
    foreach ($removeFields as $field) {
        if (!array_key_exists($field, $request)) {
            continue;
        }
        $removeCodes = array_merge($removeCodes, normalizeInstanceControlCodeListValue(array_value($request, $field, [])));
    }
    $removeCodes = array_values(array_unique($removeCodes));

    $toggleRequested = false;
    $toggleCode = '';
    foreach (['code', 'instance', 'key'] as $field) {
        if (!array_key_exists($field, $request)) {
            continue;
        }

        $toggleRequested = true;
        $codes = normalizeInstanceControlCodeListValue(array_value($request, $field, ''));
        if (count($codes) !== 1) {
            throw new InvalidArgumentException('code invalido');
        }
        $toggleCode = $codes[0];
        break;
    }

    if ($toggleRequested && !array_key_exists('enabled', $request)) {
        throw new InvalidArgumentException('enabled obrigatorio para code');
    }

    $clearRequested = array_key_exists('clear', $request) && truthyValue(array_value($request, 'clear', false));

    $modeCount = 0;
    if ($replaceRequested || $clearRequested) {
        $modeCount++;
    }
    if (!empty($addCodes) || !empty($removeCodes)) {
        $modeCount++;
    }
    if ($toggleRequested) {
        $modeCount++;
    }

    if ($modeCount === 0) {
        throw new InvalidArgumentException('Informe codes, add/remove ou code + enabled');
    }
    if ($modeCount > 1) {
        throw new InvalidArgumentException('Use somente um modo por vez: codes, add/remove ou code + enabled');
    }

    $conflicts = array_values(array_intersect($addCodes, $removeCodes));
    if (!empty($conflicts)) {
        throw new InvalidArgumentException('add/remove conflitantes para: ' . implode(', ', $conflicts));
    }

    $dryRun = truthyValue(array_value($request, 'dry_run', array_value($request, 'dryRun', false)));

    if ($replaceRequested || $clearRequested) {
        return [
            'mode' => 'replace',
            'codes' => $clearRequested ? [] : array_values(array_unique($replaceCodes)),
            'dry_run' => $dryRun,
        ];
    }

    if (!empty($addCodes) || !empty($removeCodes)) {
        return [
            'mode' => 'patch',
            'add' => $addCodes,
            'remove' => $removeCodes,
            'dry_run' => $dryRun,
        ];
    }

    return [
        'mode' => 'toggle',
        'code' => $toggleCode,
        'enabled' => truthyValue(array_value($request, 'enabled', false)),
        'dry_run' => $dryRun,
    ];
}

function persistInstanceAutoStartCodes($path, array $codes)
{
    $contents = empty($codes) ? '' : (implode(PHP_EOL, $codes) . PHP_EOL);
    writeAtomicFile($path, $contents);
    return $path;
}

function setInstanceAutoStartHandler(array $config, array $request)
{
    $payload = normalizeInstanceAutoStartRequest($request);
    $snapshot = getManageableInstancesSnapshot($config);
    $instancesByCode = [];
    foreach ((array) array_value($snapshot, 'instances', []) as $item) {
        $code = instanceControlNormalizeCode(array_value($item, 'code', ''));
        if ($code !== '') {
            $instancesByCode[$code] = $item;
        }
    }

    $autostartPath = instanceControlAutostartPath($config);
    $currentCodes = instanceControlAutostartCodesFromMap(instanceControlReadAutostart($autostartPath));

    if ($payload['mode'] === 'replace') {
        $targetCodes = validateInstanceAutoStartCodes(array_value($payload, 'codes', []), $instancesByCode);
    } elseif ($payload['mode'] === 'patch') {
        $removeSet = array_fill_keys(validateInstanceAutoStartCodes(array_value($payload, 'remove', []), $instancesByCode), true);
        $targetCodes = [];
        foreach ($currentCodes as $code) {
            if (!isset($removeSet[$code])) {
                $targetCodes[] = $code;
            }
        }
        foreach (validateInstanceAutoStartCodes(array_value($payload, 'add', []), $instancesByCode) as $code) {
            if (!in_array($code, $targetCodes, true)) {
                $targetCodes[] = $code;
            }
        }
    } else {
        $code = validateInstanceAutoStartCodes([array_value($payload, 'code', '')], $instancesByCode)[0];
        $isCurrentlyEnabled = in_array($code, $currentCodes, true);
        if (!empty($payload['enabled'])) {
            $targetCodes = $isCurrentlyEnabled ? $currentCodes : array_merge($currentCodes, [$code]);
        } else {
            $targetCodes = $isCurrentlyEnabled ? array_values(array_filter($currentCodes, function ($currentCode) use ($code) {
                return $currentCode !== $code;
            })) : $currentCodes;
        }
    }

    $added = array_values(array_filter($targetCodes, function ($code) use ($currentCodes) {
        return !in_array($code, $currentCodes, true);
    }));
    $removed = array_values(array_filter($currentCodes, function ($code) use ($targetCodes) {
        return !in_array($code, $targetCodes, true);
    }));
    $changed = ($currentCodes !== $targetCodes);

    if (empty($payload['dry_run']) && $changed) {
        persistInstanceAutoStartCodes($autostartPath, $targetCodes);
    }

    $selectedInstances = [];
    foreach ($targetCodes as $order => $code) {
        $item = array_value($instancesByCode, $code, []);
        $selectedInstances[] = [
            'code' => $code,
            'name' => trim((string) array_value($item, 'name', strtoupper($code))),
            'category' => trim((string) array_value($item, 'category', 'instance')),
            'scope' => trim((string) array_value($item, 'scope', 'unassigned')),
            'configured' => !empty($item['configured']),
            'selectable' => !empty($item['selectable']),
            'auto_start_order' => $order,
        ];
    }

    return [
        'success' => true,
        'mode' => $payload['mode'],
        'dry_run' => !empty($payload['dry_run']),
        'changed' => $changed,
        'auto_start_codes' => $targetCodes,
        'auto_start_count' => count($targetCodes),
        'auto_start_instances' => $selectedInstances,
        'added' => $added,
        'removed' => $removed,
        'previous_codes' => $currentCodes,
        'autostart_file' => $autostartPath,
    ];
}

function instanceControlIndexByCode(array $config)
{
    $snapshot = getManageableInstancesSnapshot($config);
    $index = [];
    foreach ((array) array_value($snapshot, 'instances', []) as $item) {
        if (!is_array($item)) {
            continue;
        }
        $code = instanceControlNormalizeCode(array_value($item, 'code', ''));
        if ($code !== '') {
            $index[$code] = $item;
        }
    }
    return $index;
}

function normalizeInstanceOperationRequest(array $request, $allowMultiple = false, $singularAction = 'startInstance')
{
    $raw = [];
    foreach (['code', 'instance', 'key'] as $field) {
        if (array_key_exists($field, $request)) {
            $raw = array_merge($raw, normalizeInstanceControlCodeListValue(array_value($request, $field, '')));
        }
    }
    foreach (['codes', 'instances', 'keys'] as $field) {
        if (array_key_exists($field, $request)) {
            $raw = array_merge($raw, normalizeInstanceControlCodeListValue(array_value($request, $field, [])));
        }
    }

    $codes = array_values(array_unique($raw));
    if (empty($codes)) {
        throw new InvalidArgumentException('Informe code ou codes');
    }
    if (!$allowMultiple && count($codes) !== 1) {
        throw new InvalidArgumentException($singularAction . ' aceita apenas um code');
    }

    return [
        'codes' => $codes,
        'dry_run' => truthyValue(array_value($request, 'dry_run', array_value($request, 'dryRun', false))),
        'verify' => !array_key_exists('verify', $request) || truthyValue(array_value($request, 'verify', true)),
    ];
}

function validateInstanceCodesForAction(array $codes, array $instancesByCode, $action = 'start', $requiresListenPort = false)
{
    $validated = [];
    foreach ($codes as $code) {
        $code = instanceControlNormalizeCode($code);
        if ($code === '') {
            continue;
        }
        if (!isset($instancesByCode[$code])) {
            throw new InvalidArgumentException('instance invalida: ' . $code);
        }

        $instance = $instancesByCode[$code];
        if (empty($instance['configured']) || empty($instance['selectable'])) {
            throw new InvalidArgumentException('instance nao configurada para ' . $action . ': ' . $code);
        }

        if ($requiresListenPort && intval(array_value($instance, 'listen_port', 0)) <= 0) {
            throw new InvalidArgumentException('instance sem listen_port para ' . $action . ': ' . $code);
        }

        if (!in_array($code, $validated, true)) {
            $validated[] = $code;
        }
    }
    return $validated;
}

function buildInstancePortSpecs(array $codes, array $instancesByCode, $action = 'stop')
{
    $specs = [];
    foreach ($codes as $code) {
        $code = instanceControlNormalizeCode($code);
        if ($code === '') {
            continue;
        }
        $instance = array_value($instancesByCode, $code, []);
        $listenPort = intval(array_value($instance, 'listen_port', 0));
        if ($listenPort <= 0) {
            throw new InvalidArgumentException('instance sem listen_port para ' . $action . ': ' . $code);
        }
        $specs[] = [
            'code' => $code,
            'listen_port' => $listenPort,
            'argument' => $code . ':' . $listenPort,
        ];
    }
    return $specs;
}

function verifyInstanceCodesState(array $config, array $wanted, $expectRunning = true)
{
    $index = instanceControlIndexByCode($config);
    $selected = [];
    $ok = true;

    foreach ($wanted as $code) {
        $code = instanceControlNormalizeCode($code);
        $item = isset($index[$code]) ? $index[$code] : [
            'code' => $code,
            'name' => strtoupper($code),
            'state' => 'unknown',
            'running' => false,
            'listen_port' => 0,
            'listening' => false,
            'scope' => 'unassigned',
            'category' => 'instance',
        ];

        $running = truthyValue(array_value($item, 'running', false));
        $selected[] = [
            'code' => $code,
            'name' => trim((string) array_value($item, 'name', strtoupper($code))),
            'state' => trim((string) array_value($item, 'state', $running ? 'running' : 'stopped')),
            'running' => $running,
            'scope' => trim((string) array_value($item, 'scope', 'unassigned')),
            'category' => trim((string) array_value($item, 'category', 'instance')),
            'listen_port' => intval(array_value($item, 'listen_port', 0)),
            'listening' => truthyValue(array_value($item, 'listening', false)),
        ];

        if ($expectRunning) {
            if (!$running) {
                $ok = false;
            }
        } else {
            if ($running) {
                $ok = false;
            }
        }
    }

    return [
        'requested' => true,
        'expect_running' => !empty($expectRunning),
        'success' => $ok,
        'instances' => $selected,
        'collected_at' => gmdate('c'),
    ];
}

function waitForInstanceCodesState(array $config, array $wanted, $expectRunning = true)
{
    $timeoutSeconds = max(5, intval(array_value($config, 'instance_ops_verify_timeout_seconds', 45)));
    $intervalSeconds = max(1, intval(array_value($config, 'instance_ops_verify_poll_interval_seconds', 2)));
    $deadline = time() + $timeoutSeconds;
    $last = verifyInstanceCodesState($config, $wanted, $expectRunning);
    while (time() < $deadline) {
        if (!empty($last['success'])) {
            return $last;
        }
        sleep($intervalSeconds);
        $last = verifyInstanceCodesState($config, $wanted, $expectRunning);
    }
    return $last;
}

function executeInstanceStartCommand(array $config, array $codes)
{
    $command = trim((string) array_value($config, 'instance_ops_start_command', ''));
    if ($command === '') {
        throw new Exception('Comando de start de instancia nao configurado');
    }

    $args = array_map(function ($code) {
        return escapeshellarg((string) $code);
    }, $codes);

    return executeServerOpsCommand(
        $command . ' ' . implode(' ', $args),
        intval(array_value($config, 'instance_ops_start_timeout_seconds', 90))
    );
}

function executeInstanceStopCommand(array $config, array $specs)
{
    $command = trim((string) array_value($config, 'instance_ops_stop_command', ''));
    if ($command === '') {
        throw new Exception('Comando de stop de instancia nao configurado');
    }

    $args = array_map(function ($item) {
        return escapeshellarg((string) array_value($item, 'argument', ''));
    }, $specs);

    return executeServerOpsCommand(
        $command . ' ' . implode(' ', $args),
        intval(array_value($config, 'instance_ops_stop_timeout_seconds', 90))
    );
}

function serverAutostartTimingConfig(array $config)
{
    return [
        'initial_delay_seconds' => max(0, intval(array_value($config, 'instance_ops_server_autostart_initial_delay_seconds', 5))),
        'per_instance_delay_seconds' => max(0, intval(array_value($config, 'instance_ops_server_autostart_per_instance_delay_seconds', 2))),
    ];
}

function handleStartInstanceRequest(array $config, array $request, $allowMultiple = false)
{
    $payload = normalizeInstanceOperationRequest($request, $allowMultiple, 'startInstance');
    $instancesByCode = instanceControlIndexByCode($config);
    $codes = validateInstanceCodesForAction(array_value($payload, 'codes', []), $instancesByCode, 'start', false);

    $alreadyRunning = [];
    $pending = [];
    foreach ($codes as $code) {
        if (truthyValue(array_value(array_value($instancesByCode, $code, []), 'running', false))) {
            $alreadyRunning[] = $code;
        } else {
            $pending[] = $code;
        }
    }

    $type = $allowMultiple ? 'startInstances' : 'startInstance';
    $operation = [
        'id' => buildOperationId($allowMultiple ? 'start-instances' : 'start-instance'),
        'type' => $type,
        'success' => false,
        'stage' => 'validated',
        'action' => 'start',
        'instances' => $codes,
        'dry_run' => !empty($payload['dry_run']),
        'verify' => !empty($payload['verify']),
        'created_at' => gmdate('c'),
        'already_running' => $alreadyRunning,
        'pending_instances' => $pending,
        'results' => [],
    ];
    $operation['log_file'] = writeRestartOperationSnapshot($config, $operation);

    if (!empty($payload['dry_run'])) {
        $operation['success'] = true;
        $operation['changed'] = !empty($pending);
        $operation['would_execute'] = trim((string) array_value($config, 'instance_ops_start_command', ''));
        $operation['would_start_instances'] = $pending;
        $operation['would_skip_running'] = $alreadyRunning;
        $operation['log_file'] = writeRestartOperationLog($config, $operation);
        return ['success' => true, 'dry_run' => true, 'operation' => $operation];
    }

    try {
        if (empty($pending)) {
            $operation['stage'] = 'noop';
            $operation['changed'] = false;
            $operation['verification'] = !empty($payload['verify'])
                ? verifyInstanceCodesState($config, $codes, true)
                : ['requested' => false];
            $operation['success'] = true;
            $operation['completed_at'] = gmdate('c');
            $operation['log_file'] = writeRestartOperationLog($config, $operation);
            return ['success' => true, 'operation' => $operation];
        }

        $operation['stage'] = 'start';
        $operation['result'] = executeInstanceStartCommand($config, $pending);
        $operation['results'][] = [
            'instances' => $pending,
            'result' => $operation['result'],
        ];
        $operation['log_file'] = writeRestartOperationSnapshot($config, $operation);
        if (empty($operation['result']['success'])) {
            throw new Exception('Wrapper de startInstance falhou (exit ' . intval(array_value($operation['result'], 'exit_code', 1)) . ')');
        }

        if (!empty($payload['verify'])) {
            $operation['stage'] = 'verify';
            $operation['verification'] = waitForInstanceCodesState($config, $codes, true);
            $operation['log_file'] = writeRestartOperationSnapshot($config, $operation);
            if (empty($operation['verification']['success'])) {
                throw new Exception('Verificacao apos start falhou para uma ou mais instancias');
            }
        } else {
            $operation['verification'] = ['requested' => false];
        }

        $operation['stage'] = 'done';
        $operation['changed'] = true;
        $operation['success'] = true;
        $operation['completed_at'] = gmdate('c');
        $operation['log_file'] = writeRestartOperationLog($config, $operation);
        return ['success' => true, 'operation' => $operation];
    } catch (Exception $e) {
        $operation['success'] = false;
        $operation['error'] = $e->getMessage();
        $operation['completed_at'] = gmdate('c');
        $operation['log_file'] = writeRestartOperationLog($config, $operation);
        return [
            'success' => false,
            'error' => $e->getMessage(),
            'operation' => [
                'id' => $operation['id'],
                'stage' => $operation['stage'],
                'log_file' => $operation['log_file'],
            ],
        ];
    }
}

function handleStopInstanceRequest(array $config, array $request, $allowMultiple = false)
{
    $payload = normalizeInstanceOperationRequest($request, $allowMultiple, 'stopInstance');
    $instancesByCode = instanceControlIndexByCode($config);
    $codes = validateInstanceCodesForAction(array_value($payload, 'codes', []), $instancesByCode, 'stop', true);

    $alreadyStopped = [];
    $pending = [];
    foreach ($codes as $code) {
        if (truthyValue(array_value(array_value($instancesByCode, $code, []), 'running', false))) {
            $pending[] = $code;
        } else {
            $alreadyStopped[] = $code;
        }
    }

    $type = $allowMultiple ? 'stopInstances' : 'stopInstance';
    $operation = [
        'id' => buildOperationId($allowMultiple ? 'stop-instances' : 'stop-instance'),
        'type' => $type,
        'success' => false,
        'stage' => 'validated',
        'action' => 'stop',
        'instances' => $codes,
        'dry_run' => !empty($payload['dry_run']),
        'verify' => !empty($payload['verify']),
        'created_at' => gmdate('c'),
        'already_stopped' => $alreadyStopped,
        'pending_instances' => $pending,
        'results' => [],
    ];
    $operation['log_file'] = writeRestartOperationSnapshot($config, $operation);

    if (!empty($payload['dry_run'])) {
        $operation['success'] = true;
        $operation['changed'] = !empty($pending);
        $operation['would_execute'] = trim((string) array_value($config, 'instance_ops_stop_command', ''));
        $operation['would_stop_instances'] = $pending;
        $operation['would_skip_stopped'] = $alreadyStopped;
        $operation['log_file'] = writeRestartOperationLog($config, $operation);
        return ['success' => true, 'dry_run' => true, 'operation' => $operation];
    }

    try {
        if (empty($pending)) {
            $operation['stage'] = 'noop';
            $operation['changed'] = false;
            $operation['verification'] = !empty($payload['verify'])
                ? verifyInstanceCodesState($config, $codes, false)
                : ['requested' => false];
            $operation['success'] = true;
            $operation['completed_at'] = gmdate('c');
            $operation['log_file'] = writeRestartOperationLog($config, $operation);
            return ['success' => true, 'operation' => $operation];
        }

        $specs = buildInstancePortSpecs($pending, $instancesByCode, 'stop');
        $operation['stage'] = 'stop';
        $operation['result'] = executeInstanceStopCommand($config, $specs);
        $operation['results'][] = [
            'instances' => $pending,
            'result' => $operation['result'],
        ];
        $operation['log_file'] = writeRestartOperationSnapshot($config, $operation);
        if (empty($operation['result']['success'])) {
            throw new Exception('Wrapper de stopInstance falhou (exit ' . intval(array_value($operation['result'], 'exit_code', 1)) . ')');
        }

        if (!empty($payload['verify'])) {
            $operation['stage'] = 'verify';
            $operation['verification'] = waitForInstanceCodesState($config, $codes, false);
            $operation['log_file'] = writeRestartOperationSnapshot($config, $operation);
            if (empty($operation['verification']['success'])) {
                throw new Exception('Verificacao apos stop falhou para uma ou mais instancias');
            }
        } else {
            $operation['verification'] = ['requested' => false];
        }

        $operation['stage'] = 'done';
        $operation['changed'] = true;
        $operation['success'] = true;
        $operation['completed_at'] = gmdate('c');
        $operation['log_file'] = writeRestartOperationLog($config, $operation);
        return ['success' => true, 'operation' => $operation];
    } catch (Exception $e) {
        $operation['success'] = false;
        $operation['error'] = $e->getMessage();
        $operation['completed_at'] = gmdate('c');
        $operation['log_file'] = writeRestartOperationLog($config, $operation);
        return [
            'success' => false,
            'error' => $e->getMessage(),
            'operation' => [
                'id' => $operation['id'],
                'stage' => $operation['stage'],
                'log_file' => $operation['log_file'],
            ],
        ];
    }
}

function handleRestartInstanceRequest(array $config, array $request, $allowMultiple = false)
{
    $payload = normalizeInstanceOperationRequest($request, $allowMultiple, 'restartInstance');
    $instancesByCode = instanceControlIndexByCode($config);
    $codes = validateInstanceCodesForAction(array_value($payload, 'codes', []), $instancesByCode, 'restart', true);

    $alreadyStopped = [];
    $alreadyRunning = [];
    foreach ($codes as $code) {
        if (truthyValue(array_value(array_value($instancesByCode, $code, []), 'running', false))) {
            $alreadyRunning[] = $code;
        } else {
            $alreadyStopped[] = $code;
        }
    }

    $type = $allowMultiple ? 'restartInstances' : 'restartInstance';
    $operation = [
        'id' => buildOperationId($allowMultiple ? 'restart-instances' : 'restart-instance'),
        'type' => $type,
        'success' => false,
        'stage' => 'validated',
        'action' => 'restart',
        'instances' => $codes,
        'dry_run' => !empty($payload['dry_run']),
        'verify' => !empty($payload['verify']),
        'created_at' => gmdate('c'),
        'already_running' => $alreadyRunning,
        'already_stopped' => $alreadyStopped,
        'stop_instances' => $alreadyRunning,
        'start_instances' => $codes,
        'results' => [],
    ];
    $operation['log_file'] = writeRestartOperationSnapshot($config, $operation);

    if (!empty($payload['dry_run'])) {
        $operation['success'] = true;
        $operation['changed'] = true;
        $operation['would_execute_stop'] = trim((string) array_value($config, 'instance_ops_stop_command', ''));
        $operation['would_execute_start'] = trim((string) array_value($config, 'instance_ops_start_command', ''));
        $operation['would_stop_instances'] = $alreadyRunning;
        $operation['would_start_instances'] = $codes;
        $operation['would_skip_stop'] = $alreadyStopped;
        $operation['log_file'] = writeRestartOperationLog($config, $operation);
        return ['success' => true, 'dry_run' => true, 'operation' => $operation];
    }

    try {
        if (!empty($alreadyRunning)) {
            $stopSpecs = buildInstancePortSpecs($alreadyRunning, $instancesByCode, 'restart');
            $operation['stage'] = 'stop';
            $operation['stop_result'] = executeInstanceStopCommand($config, $stopSpecs);
            $operation['results'][] = [
                'instances' => $alreadyRunning,
                'result' => $operation['stop_result'],
            ];
            $operation['log_file'] = writeRestartOperationSnapshot($config, $operation);
            if (empty($operation['stop_result']['success'])) {
                throw new Exception('Wrapper de restartInstance falhou na etapa de stop (exit ' . intval(array_value($operation['stop_result'], 'exit_code', 1)) . ')');
            }

            $operation['stage'] = 'wait_stop';
            $operation['stop_verification'] = waitForInstanceCodesState($config, $alreadyRunning, false);
            $operation['log_file'] = writeRestartOperationSnapshot($config, $operation);
            if (empty($operation['stop_verification']['success'])) {
                throw new Exception('Verificacao da etapa de stop falhou para uma ou mais instancias');
            }
        } else {
            $operation['stop_verification'] = ['requested' => false, 'success' => true, 'instances' => []];
        }

        $operation['stage'] = 'start';
        $operation['start_result'] = executeInstanceStartCommand($config, $codes);
        $operation['result'] = $operation['start_result'];
        $operation['results'][] = [
            'instances' => $codes,
            'result' => $operation['start_result'],
        ];
        $operation['log_file'] = writeRestartOperationSnapshot($config, $operation);
        if (empty($operation['start_result']['success'])) {
            throw new Exception('Wrapper de restartInstance falhou na etapa de start (exit ' . intval(array_value($operation['start_result'], 'exit_code', 1)) . ')');
        }

        if (!empty($payload['verify'])) {
            $operation['stage'] = 'verify';
            $operation['verification'] = waitForInstanceCodesState($config, $codes, true);
            $operation['log_file'] = writeRestartOperationSnapshot($config, $operation);
            if (empty($operation['verification']['success'])) {
                throw new Exception('Verificacao apos restart falhou para uma ou mais instancias');
            }
        } else {
            $operation['verification'] = ['requested' => false];
        }

        $operation['stage'] = 'done';
        $operation['changed'] = true;
        $operation['success'] = true;
        $operation['completed_at'] = gmdate('c');
        $operation['log_file'] = writeRestartOperationLog($config, $operation);
        return ['success' => true, 'operation' => $operation];
    } catch (Exception $e) {
        $operation['success'] = false;
        $operation['error'] = $e->getMessage();
        $operation['completed_at'] = gmdate('c');
        $operation['log_file'] = writeRestartOperationLog($config, $operation);
        return [
            'success' => false,
            'error' => $e->getMessage(),
            'operation' => [
                'id' => $operation['id'],
                'stage' => $operation['stage'],
                'log_file' => $operation['log_file'],
            ],
        ];
    }
}

function normalizeServerStartInstanceSelectionRequest(array $request, array $config)
{
    $explicitRequested = false;
    $rawCodes = [];
    foreach (['instances', 'instance_codes', 'instanceCodes', 'start_instances', 'startInstances', 'selected_instances', 'selectedInstances'] as $field) {
        if (!array_key_exists($field, $request)) {
            continue;
        }
        $fieldCodes = normalizeInstanceControlCodeListValue(array_value($request, $field, []));
        if (!empty($fieldCodes)) {
            $explicitRequested = true;
        }
        $rawCodes = array_merge($rawCodes, $fieldCodes);
    }

    $hasUseAutoStartFlag = array_key_exists('use_auto_start', $request) || array_key_exists('useAutoStart', $request);
    $useAutoStart = $hasUseAutoStartFlag
        ? truthyValue(array_value($request, 'use_auto_start', array_value($request, 'useAutoStart', false)))
        : !$explicitRequested;
    if (!$explicitRequested && !$useAutoStart) {
        return [
            'requested' => false,
            'use_auto_start' => false,
            'source' => 'none',
            'codes' => [],
        ];
    }

    $codes = [];
    if ($useAutoStart) {
        $codes = array_merge($codes, instanceControlAutostartCodesFromMap(instanceControlReadAutostart(instanceControlAutostartPath($config))));
    }
    $codes = array_merge($codes, $rawCodes);
    $codes = array_values(array_unique(array_filter(array_map('strval', $codes), function ($value) {
        return trim($value) !== '';
    })));

    $instancesByCode = instanceControlIndexByCode($config);
    $validatedCodes = validateInstanceCodesForAction($codes, $instancesByCode, 'start', false);

    return [
        'requested' => true,
        'use_auto_start' => $useAutoStart,
        'source' => ($explicitRequested && $useAutoStart) ? 'manual_plus_auto_start' : ($useAutoStart ? 'auto_start' : 'manual'),
        'codes' => $validatedCodes,
    ];
}

function executeServerSelectedInstanceStart(array $config, array &$operation, array $selection, $verify = true)
{
    $codes = array_values(array_map('strval', array_value($selection, 'codes', [])));
    $operation['instances'] = $codes;
    $operation['instance_selection'] = [
        'requested' => !empty($selection['requested']),
        'use_auto_start' => !empty($selection['use_auto_start']),
        'source' => trim((string) array_value($selection, 'source', 'none')),
    ];

    if (empty($selection['requested'])) {
        $operation['instance_verification'] = ['requested' => false];
        return;
    }

    $instancesByCode = instanceControlIndexByCode($config);
    $alreadyRunning = [];
    $pending = [];
    foreach ($codes as $code) {
        if (truthyValue(array_value(array_value($instancesByCode, $code, []), 'running', false))) {
            $alreadyRunning[] = $code;
        } else {
            $pending[] = $code;
        }
    }

    $operation['already_running_instances'] = $alreadyRunning;
    $operation['pending_instances'] = $pending;

    if (empty($pending)) {
        $operation['instance_start_result'] = [
            'success' => true,
            'skipped' => true,
            'already_running' => $alreadyRunning,
            'pending_instances' => [],
        ];
        $operation['instance_verification'] = $verify
            ? verifyInstanceCodesState($config, $codes, true)
            : ['requested' => false];
        if ($verify && empty($operation['instance_verification']['success'])) {
            throw new Exception('Verificacao das instancias selecionadas falhou');
        }
        return;
    }

    $timing = serverAutostartTimingConfig($config);
    $operation['instance_start_strategy'] = 'sequential';
    $operation['instance_start_timing'] = $timing;

    if (intval($timing['initial_delay_seconds']) > 0) {
        $operation['stage'] = 'wait_instances_initial';
        $operation['log_file'] = writeRestartOperationSnapshot($config, $operation);
        sleep(intval($timing['initial_delay_seconds']));
    }

    $aggregatedParsedInstances = [];
    $operation['results'] = is_array(array_value($operation, 'results', null)) ? $operation['results'] : [];
    foreach (array_values($pending) as $idx => $code) {
        if ($idx > 0 && intval($timing['per_instance_delay_seconds']) > 0) {
            $operation['stage'] = 'wait_instance_' . $code;
            $operation['log_file'] = writeRestartOperationSnapshot($config, $operation);
            sleep(intval($timing['per_instance_delay_seconds']));
        }

        $operation['stage'] = 'start_instance_' . $code;
        $operation['log_file'] = writeRestartOperationSnapshot($config, $operation);
        $singleResult = executeInstanceStartCommand($config, [$code]);
        $operation['results'][] = [
            'instances' => [$code],
            'result' => $singleResult,
        ];
        foreach ((array) array_value(array_value($singleResult, 'parsed', []), 'instances', []) as $parsedInstance) {
            if (is_array($parsedInstance)) {
                $aggregatedParsedInstances[] = $parsedInstance;
            }
        }
        $operation['log_file'] = writeRestartOperationSnapshot($config, $operation);
        if (empty($singleResult['success'])) {
            throw new Exception('Wrapper de start da instancia ' . $code . ' falhou (exit ' . intval(array_value($singleResult, 'exit_code', 1)) . ')');
        }

        if ($verify) {
            $operation['stage'] = 'verify_instance_' . $code;
            $operation['log_file'] = writeRestartOperationSnapshot($config, $operation);
            $stepVerification = waitForInstanceCodesState($config, [$code], true);
            if (empty($stepVerification['success'])) {
                $operation['instance_step_verification'] = $stepVerification;
                $operation['log_file'] = writeRestartOperationSnapshot($config, $operation);
                throw new Exception('Verificacao da instancia ' . $code . ' falhou durante o auto-start');
            }
        }
    }

    $operation['instance_start_result'] = [
        'success' => true,
        'sequential' => true,
        'count' => count($pending),
        'already_running' => $alreadyRunning,
        'pending_instances' => $pending,
        'instances' => $aggregatedParsedInstances,
    ];
    $operation['log_file'] = writeRestartOperationSnapshot($config, $operation);

    if ($verify) {
        $operation['stage'] = 'verify_instances';
        $operation['instance_verification'] = verifyInstanceCodesState($config, $codes, true);
        $operation['log_file'] = writeRestartOperationSnapshot($config, $operation);
        if (empty($operation['instance_verification']['success'])) {
            throw new Exception('Verificacao das instancias selecionadas falhou');
        }
    } else {
        $operation['instance_verification'] = ['requested' => false];
    }
}

function serverOpsLogSources(array $config)
{
    $exportDir = trim((string) array_value($config, 'clsconfig_export_log_dir', ''));
    $securityDir = trim((string) array_value($config, 'security_log_dir', ''));

    return [
        'gamedbd' => [
            '/root/logs/gamedbd*_err.log',
            '/root/logs/gamedbd*_std.log',
            '/home/logs/gamedbd*_err.log',
            '/home/logs/gamedbd*_std.log',
            '/var/log/gamedbd*.log',
        ],
        'exportclsconfig' => array_filter([
            ($exportDir !== '') ? rtrim($exportDir, '/\\') . DIRECTORY_SEPARATOR . '*.log' : '',
            ($exportDir !== '') ? rtrim($exportDir, '/\\') . DIRECTORY_SEPARATOR . '*.txt' : '',
        ]),
        'httpd' => [
            '/var/log/httpd/error_log',
            '/var/log/httpd/access_log',
            '/var/log/apache2/error.log',
            '/var/log/apache2/access.log',
        ],
        'mail' => [
            __DIR__ . '/backups/mail*.log',
            __DIR__ . '/backups/mail*.jsonl',
        ],
        'apicls' => array_filter([
            ($securityDir !== '') ? rtrim($securityDir, '/\\') . DIRECTORY_SEPARATOR . '*.jsonl' : '',
            __DIR__ . '/backups/*.log',
        ]),
    ];
}

function serverOpsResolveLogFile($source, array $config)
{
    $source = strtolower(trim((string) $source));
    $sources = serverOpsLogSources($config);
    if (!isset($sources[$source])) {
        throw new InvalidArgumentException('source de log invalido: ' . $source);
    }

    $candidates = [];
    foreach ($sources[$source] as $pattern) {
        $pattern = trim((string) $pattern);
        if ($pattern === '') {
            continue;
        }

        if (strpbrk($pattern, '*?[]') !== false) {
            $matches = @glob($pattern);
            if (is_array($matches)) {
                foreach ($matches as $match) {
                    if (is_file($match) && is_readable($match)) {
                        $candidates[] = $match;
                    }
                }
            }
        } elseif (is_file($pattern) && is_readable($pattern)) {
            $candidates[] = $pattern;
        }
    }

    if (empty($candidates)) {
        return '';
    }

    usort($candidates, function ($a, $b) {
        return (@filemtime($b) ?: 0) <=> (@filemtime($a) ?: 0);
    });

    return $candidates[0];
}

function serverOpsTailFile($file, $lines)
{
    $file = trim((string) $file);
    $lines = max(1, min(500, intval($lines)));

    if ($file === '' || !is_file($file) || !is_readable($file)) {
        throw new Exception('Arquivo de log nao encontrado ou sem leitura');
    }

    $size = @filesize($file);
    if ($size !== false && $size > (5 * 1024 * 1024) && serverOpsShellAvailable()) {
        $output = serverOpsRun('tail -n ' . $lines . ' ' . escapeshellarg($file) . ' 2>/dev/null');
        if ($output !== '') {
            return preg_split("/\r\n|\n|\r/", trim($output));
        }
    }

    $content = @file($file, FILE_IGNORE_NEW_LINES);
    if (!is_array($content)) {
        throw new Exception('Falha ao ler arquivo de log');
    }

    return array_slice($content, -1 * $lines);
}

function serverOpsGuessLevel($line)
{
    $line = strtolower((string) $line);
    if (strpos($line, 'fatal') !== false || strpos($line, 'error') !== false || strpos($line, 'erro') !== false) {
        return 'error';
    }
    if (strpos($line, 'warn') !== false || strpos($line, 'warning') !== false || strpos($line, 'aviso') !== false) {
        return 'warning';
    }
    return 'info';
}

function getServerLogsSnapshot(array $config, $source, $lines = 100, $query = '')
{
    $source = strtolower(trim((string) $source));
    $lines = max(1, min(500, intval($lines)));
    $query = trim((string) $query);
    $file = serverOpsResolveLogFile($source, $config);

    if ($file === '') {
        return [
            'success' => true,
            'source' => $source,
            'file' => '',
            'entries' => [],
            'warning' => 'Arquivo de log nao encontrado para a origem selecionada',
            'collected_at' => gmdate('c'),
        ];
    }

    $rawLines = serverOpsTailFile($file, $lines);
    $entries = [];
    $lineNo = 0;

    foreach ($rawLines as $line) {
        $lineNo++;
        $text = rtrim((string) $line);
        if ($text === '') {
            continue;
        }
        if ($query !== '' && stripos($text, $query) === false) {
            continue;
        }

        $entries[] = [
            'line_no' => $lineNo,
            'level' => serverOpsGuessLevel($text),
            'line' => $text,
        ];
    }

    return [
        'success' => true,
        'source' => $source,
        'file' => $file,
        'entries' => $entries,
        'warning' => '',
        'collected_at' => gmdate('c'),
    ];
}

function safeJsonEncode($payload)
{
    $flags = JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES;
    if (defined('JSON_INVALID_UTF8_SUBSTITUTE')) {
        $flags |= JSON_INVALID_UTF8_SUBSTITUTE;
    }

    $json = json_encode($payload, $flags);
    if ($json !== false) {
        return $json;
    }

    return json_encode([
        'success' => false,
        'error' => 'Falha ao gerar JSON',
        'json_error' => function_exists('json_last_error_msg') ? json_last_error_msg() : 'json_encode falhou',
    ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
}

function ensureWritableDirectory($dir, $mode = 0750)
{
    $dir = trim((string) $dir);
    if ($dir === '') {
        throw new Exception('Diretorio nao configurado');
    }

    if (!is_dir($dir) && !@mkdir($dir, $mode, true)) {
        throw new Exception('Nao foi possivel criar diretorio: ' . $dir);
    }

    if (!is_dir($dir) || !is_writable($dir)) {
        throw new Exception('Diretorio sem permissao de escrita: ' . $dir);
    }

    return $dir;
}

function writeAtomicFile($path, $contents)
{
    $path = trim((string) $path);
    if ($path === '') {
        throw new Exception('Arquivo de destino nao configurado');
    }

    $dir = dirname($path);
    ensureWritableDirectory($dir);
    $tmp = tempnam($dir, 'apicls_');
    if ($tmp === false || $tmp === '') {
        throw new Exception('Nao foi possivel criar arquivo temporario em ' . $dir);
    }

    if (@file_put_contents($tmp, $contents) === false) {
        @unlink($tmp);
        throw new Exception('Falha ao gravar arquivo temporario em ' . $dir);
    }

    if (!@rename($tmp, $path)) {
        @unlink($tmp);
        throw new Exception('Falha ao mover arquivo temporario para ' . $path);
    }

    @chmod($path, 0640);
}

function appendLogLine($path, $line)
{
    $path = trim((string) $path);
    if ($path === '') {
        throw new Exception('Arquivo de log nao configurado');
    }

    ensureWritableDirectory(dirname($path));
    if (@file_put_contents($path, $line . PHP_EOL, FILE_APPEND | LOCK_EX) === false) {
        throw new Exception('Falha ao gravar log em ' . $path);
    }
    @chmod($path, 0640);
}

function containsControlChars($text)
{
    return preg_match('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/', (string) $text) === 1;
}

function trimOneLineText($text)
{
    $text = preg_replace('/\s+/', ' ', trim((string) $text));
    return is_string($text) ? $text : '';
}

function buildOperationId($prefix)
{
    $prefix = preg_replace('/[^a-z0-9_-]+/i', '-', trim((string) $prefix));
    $prefix = trim((string) $prefix, '-');
    if ($prefix === '') {
        $prefix = 'op';
    }

    try {
        $rand = bin2hex(random_bytes(4));
    } catch (Exception $e) {
        $rand = substr(sha1(uniqid('', true)), 0, 8);
    }

    return strtolower($prefix . '-' . gmdate('Ymd-His') . '-' . $rand);
}

function excerptText($text, $maxLen = 1200)
{
    $text = trim((string) $text);
    $maxLen = max(0, intval($maxLen));
    if ($maxLen === 0 || strlen($text) <= $maxLen) {
        return $text;
    }
    return substr($text, 0, $maxLen) . '...';
}

function sysmsgCuint($value)
{
    $value = intval($value);
    if ($value < 64) {
        return strrev(pack('C', $value));
    } elseif ($value < 16384) {
        return strrev(pack('S', ($value | 0x8000)));
    } elseif ($value < 536870912) {
        return strrev(pack('I', ($value | 0xC0000000)));
    }
    return strrev(pack('c', -32) . pack('i', $value));
}

function sysmsgPackString($data)
{
    $encoded = @iconv('UTF-8', 'UTF-16LE//IGNORE', (string) $data);
    if ($encoded === false) {
        $encoded = (string) $data;
    }
    return sysmsgCuint(strlen($encoded)) . $encoded;
}

function sysmsgPackOctet($data)
{
    $data = preg_replace('/[^0-9a-fA-F]/', '', (string) $data);
    if ($data === '') {
        return sysmsgCuint(0);
    }
    return sysmsgCuint(strlen($data) / 2) . pack('H*', $data);
}

function sysmsgCreateHeader($opcode, $data)
{
    return sysmsgCuint(intval($opcode)) . sysmsgCuint(strlen($data)) . $data;
}

function systemMessageKinds()
{
    return [
        'system' => ['channel' => 9],
        'broadcast' => ['channel' => 9],
        'tip' => ['channel' => 9],
        'world' => ['channel' => 9],
    ];
}

function normalizeSystemMessageRequest(array $request, array $config)
{
    $message = trimOneLineText(array_value($request, 'message', ''));
    if ($message === '') {
        throw new InvalidArgumentException('message obrigatoria');
    }
    if (containsControlChars($message)) {
        throw new InvalidArgumentException('message contem caracteres de controle invalidos');
    }

    $maxLength = max(1, intval(array_value($config, 'system_message_max_length', 200)));
    if (strlen($message) > $maxLength) {
        throw new InvalidArgumentException('message excede o limite de ' . $maxLength . ' caracteres');
    }

    $kind = strtolower(trim((string) array_value($request, 'kind', 'system')));
    $kinds = systemMessageKinds();
    if (!isset($kinds[$kind])) {
        throw new InvalidArgumentException('kind invalido. Use: system, broadcast, tip ou world');
    }

    $priority = strtolower(trim((string) array_value($request, 'priority', 'normal')));
    if (!in_array($priority, ['low', 'normal', 'high'], true)) {
        throw new InvalidArgumentException('priority invalida. Use: low, normal ou high');
    }

    $dryRun = truthyValue(array_value($request, 'dry_run', array_value($request, 'dryRun', false)));

    return [
        'message' => $message,
        'kind' => $kind,
        'priority' => $priority,
        'channel' => intval(array_value($kinds[$kind], 'channel', array_value($config, 'system_message_default_channel', 9))),
        'host' => trim((string) array_value($config, 'gacd_ip', '127.0.0.1')),
        'port' => max(1, intval(array_value($config, 'gacd_port', 29300))),
        'dry_run' => $dryRun,
    ];
}

function logSystemMessage(array $config, array $entry)
{
    $logDir = ensureWritableDirectory(array_value($config, 'system_message_log_dir', __DIR__ . '/backups/sysmsg-logs'));
    $logFile = rtrim($logDir, '/\\') . DIRECTORY_SEPARATOR . 'sysmsg-' . gmdate('Y-m-d') . '.jsonl';
    appendLogLine($logFile, safeJsonEncode($entry));
    return $logFile;
}

function dispatchSystemMessage(array $payload)
{
    $pack = pack('CCN', intval($payload['channel']), 0, 0) . sysmsgPackString($payload['message']) . sysmsgPackOctet('');
    $packet = sysmsgCreateHeader(120, $pack);

    $sock = @fsockopen($payload['host'], intval($payload['port']), $errno, $errstr, 5);
    if (!$sock) {
        throw new Exception('Falha ao conectar no gacd (' . $payload['host'] . ':' . $payload['port'] . ') - ' . $errno . ': ' . $errstr);
    }

    @stream_set_timeout($sock, 2);
    $sent = @fwrite($sock, $packet);
    if ($sent === false) {
        @fclose($sock);
        throw new Exception('Falha ao enviar pacote de broadcast para o gacd');
    }

    $response = @fread($sock, 4096);
    @fclose($sock);

    return [
        'host' => $payload['host'],
        'port' => intval($payload['port']),
        'channel' => intval($payload['channel']),
        'sent_bytes' => intval($sent),
        'response_hex' => is_string($response) ? bin2hex($response) : '',
    ];
}

function handleSendSystemMessageRequest(array $config, array $request)
{
    if (!truthyValue(array_value($config, 'system_message_enabled', true))) {
        throw new Exception('Envio de mensagens globais esta desabilitado na configuracao da API');
    }

    $payload = normalizeSystemMessageRequest($request, $config);
    $entry = [
        'type' => 'system_message',
        'created_at' => gmdate('c'),
        'message' => $payload['message'],
        'kind' => $payload['kind'],
        'priority' => $payload['priority'],
        'channel' => intval($payload['channel']),
        'dry_run' => !empty($payload['dry_run']),
    ];

    if (!empty($payload['dry_run'])) {
        $entry['result'] = 'validated';
        $logFile = logSystemMessage($config, $entry);
        return [
            'success' => true,
            'dry_run' => true,
            'validated' => [
                'message' => $payload['message'],
                'kind' => $payload['kind'],
                'priority' => $payload['priority'],
                'channel' => intval($payload['channel']),
            ],
            'log_file' => $logFile,
        ];
    }

    $delivery = dispatchSystemMessage($payload);
    $entry['result'] = 'sent';
    $entry['delivery'] = $delivery;
    $logFile = logSystemMessage($config, $entry);

    return [
        'success' => true,
        'message' => 'Broadcast enviado com sucesso',
        'delivery' => $delivery,
        'log_file' => $logFile,
    ];
}

function tryHandleSendSystemMessageRequest(array $config, array $request)
{
    try {
        return handleSendSystemMessageRequest($config, $request);
    } catch (Exception $e) {
        return [
            'success' => false,
            'error' => $e->getMessage(),
        ];
    }
}

function maintenanceDefaultState()
{
    return [
        'enabled' => false,
        'reason' => '',
        'eta_minutes' => 0,
        'started_at' => null,
        'ends_at' => null,
        'updated_by' => '',
        'updated_at' => null,
    ];
}

function maintenanceStateFile(array $config)
{
    return trim((string) array_value($config, 'maintenance_state_file', __DIR__ . '/backups/maintenance/state.json'));
}

function maintenanceHistoryFile(array $config)
{
    return trim((string) array_value($config, 'maintenance_history_file', __DIR__ . '/backups/maintenance/history.log'));
}

function readMaintenanceState(array $config)
{
    $path = maintenanceStateFile($config);
    if ($path === '' || !is_file($path) || !is_readable($path)) {
        return maintenanceDefaultState();
    }

    $raw = @file_get_contents($path);
    if (!is_string($raw) || trim($raw) === '') {
        return maintenanceDefaultState();
    }

    $decoded = json_decode($raw, true);
    if (json_last_error() !== JSON_ERROR_NONE || !is_array($decoded)) {
        return maintenanceDefaultState();
    }

    return array_merge(maintenanceDefaultState(), $decoded);
}

function persistMaintenanceState(array $config, array $state, array $historyEntry)
{
    $stateFile = maintenanceStateFile($config);
    $historyFile = maintenanceHistoryFile($config);
    writeAtomicFile($stateFile, safeJsonEncode($state));
    appendLogLine($historyFile, safeJsonEncode($historyEntry));
    return [
        'state_file' => $stateFile,
        'history_file' => $historyFile,
    ];
}

function normalizeMaintenanceRequest(array $request, array $config)
{
    if (!array_key_exists('enabled', $request)) {
        throw new InvalidArgumentException('enabled obrigatorio');
    }

    $enabled = truthyValue(array_value($request, 'enabled', false));
    $reason = trimOneLineText(array_value($request, 'reason', ''));
    if (containsControlChars($reason)) {
        throw new InvalidArgumentException('reason contem caracteres de controle invalidos');
    }

    $reasonMax = max(1, intval(array_value($config, 'maintenance_reason_max_length', 240)));
    if (strlen($reason) > $reasonMax) {
        throw new InvalidArgumentException('reason excede o limite de ' . $reasonMax . ' caracteres');
    }

    $etaMinutes = intval(array_value($request, 'eta_minutes', array_value($request, 'etaMinutes', 0)));
    $etaMax = max(0, intval(array_value($config, 'maintenance_eta_max_minutes', 1440)));
    if ($etaMinutes < 0 || $etaMinutes > $etaMax) {
        throw new InvalidArgumentException('eta_minutes deve ficar entre 0 e ' . $etaMax);
    }

    return [
        'enabled' => $enabled,
        'reason' => $reason,
        'eta_minutes' => $etaMinutes,
        'broadcast' => !array_key_exists('broadcast', $request) || truthyValue(array_value($request, 'broadcast', true)),
        'dry_run' => truthyValue(array_value($request, 'dry_run', array_value($request, 'dryRun', false))),
        'updated_by' => trimOneLineText(array_value($request, 'updated_by', array_value($request, 'actor', 'api'))),
    ];
}

function applyMaintenanceMode(array $config, array $payload)
{
    $previous = readMaintenanceState($config);
    $now = gmdate('c');
    $startedAt = $payload['enabled']
        ? (!empty($previous['enabled']) && !empty($previous['started_at']) ? $previous['started_at'] : $now)
        : null;
    $endsAt = null;
    if ($payload['enabled'] && intval($payload['eta_minutes']) > 0) {
        $endsAt = gmdate('c', time() + (intval($payload['eta_minutes']) * 60));
    }

    $state = [
        'enabled' => !empty($payload['enabled']),
        'reason' => (string) $payload['reason'],
        'eta_minutes' => intval($payload['eta_minutes']),
        'started_at' => $startedAt,
        'ends_at' => $endsAt,
        'updated_by' => (string) $payload['updated_by'],
        'updated_at' => $now,
    ];

    $historyEntry = [
        'type' => 'maintenance',
        'changed_at' => $now,
        'previous' => $previous,
        'current' => $state,
        'dry_run' => !empty($payload['dry_run']),
    ];

    $broadcastResult = null;
    if (empty($payload['dry_run']) && !empty($payload['broadcast'])) {
        $message = $state['enabled']
            ? ('Servidor entrara em manutencao' . ($state['eta_minutes'] > 0 ? (' em ' . $state['eta_minutes'] . ' min') : ' em instantes') . ($state['reason'] !== '' ? ('. Motivo: ' . $state['reason']) : '.'))
            : 'Modo manutencao encerrado. Servidor liberado para operacao normal.';

        try {
            $broadcastResult = handleSendSystemMessageRequest($config, [
                'message' => $message,
                'kind' => 'system',
                'priority' => 'high',
                'dry_run' => false,
            ]);
        } catch (Exception $e) {
            $broadcastResult = [
                'success' => false,
                'error' => $e->getMessage(),
            ];
        }
    }

    $files = [
        'state_file' => maintenanceStateFile($config),
        'history_file' => maintenanceHistoryFile($config),
    ];

    if (empty($payload['dry_run'])) {
        $files = persistMaintenanceState($config, $state, $historyEntry);
    }

    return [
        'success' => true,
        'maintenance' => $state,
        'broadcast' => $broadcastResult,
        'dry_run' => !empty($payload['dry_run']),
        'state_file' => $files['state_file'],
        'history_file' => $files['history_file'],
    ];
}

function getMaintenanceModeHandler(array $config)
{
    return [
        'success' => true,
        'maintenance' => readMaintenanceState($config),
        'state_file' => maintenanceStateFile($config),
        'history_file' => maintenanceHistoryFile($config),
    ];
}

function setMaintenanceModeHandler(array $config, array $request)
{
    $payload = normalizeMaintenanceRequest($request, $config);
    return applyMaintenanceMode($config, $payload);
}

function restartOperationLogFiles(array $config, $operationId)
{
    $dir = ensureWritableDirectory(array_value($config, 'server_ops_log_dir', __DIR__ . '/backups/server-ops'));
    $id = preg_replace('/[^a-zA-Z0-9_.:-]+/', '-', (string) $operationId);
    $id = trim((string) $id, '-');
    if ($id === '') {
        $id = buildOperationId('restart');
    }

    return [
        'dir' => $dir,
        'json' => rtrim($dir, '/\\') . DIRECTORY_SEPARATOR . $id . '.json',
        'history' => rtrim($dir, '/\\') . DIRECTORY_SEPARATOR . 'history.log',
    ];
}

function writeRestartOperationLog(array $config, array $operation)
{
    $files = restartOperationLogFiles($config, array_value($operation, 'id', 'restart'));
    writeAtomicFile($files['json'], safeJsonEncode($operation));
    appendLogLine($files['history'], safeJsonEncode([
        'id' => array_value($operation, 'id', ''),
        'created_at' => gmdate('c'),
        'success' => truthyValue(array_value($operation, 'success', false)),
        'stage' => array_value($operation, 'stage', ''),
        'reason' => array_value($operation, 'reason', ''),
        'dry_run' => truthyValue(array_value($operation, 'dry_run', false)),
    ]));
    return $files['json'];
}

function writeRestartOperationSnapshot(array $config, array $operation)
{
    $files = restartOperationLogFiles($config, array_value($operation, 'id', 'restart'));
    writeAtomicFile($files['json'], safeJsonEncode($operation));
    return $files['json'];
}

function serverOpsLogDir(array $config)
{
    return trim((string) array_value($config, 'server_ops_log_dir', __DIR__ . '/backups/server-ops'));
}

function serverOpsListOperationFiles(array $config)
{
    $dir = serverOpsLogDir($config);
    if ($dir === '' || !is_dir($dir)) {
        return [];
    }

    $files = @glob(rtrim($dir, '/\\') . DIRECTORY_SEPARATOR . '*.json');
    if (!is_array($files)) {
        return [];
    }

    $files = array_values(array_filter($files, function ($file) {
        return is_file($file) && is_readable($file);
    }));

    usort($files, function ($a, $b) {
        return (@filemtime($b) ?: 0) <=> (@filemtime($a) ?: 0);
    });

    return $files;
}

function serverOpsReadOperationFile($file)
{
    $file = trim((string) $file);
    if ($file === '' || !is_file($file) || !is_readable($file)) {
        throw new Exception('Arquivo de operacao nao encontrado');
    }

    $raw = @file_get_contents($file);
    if ($raw === false) {
        throw new Exception('Falha ao ler arquivo de operacao');
    }

    $decoded = json_decode($raw, true);
    if (!is_array($decoded)) {
        throw new Exception('JSON de operacao invalido');
    }

    return $decoded;
}

function serverOpsInferOperationType(array $operation, $file = '')
{
    $explicit = trim((string) array_value($operation, 'type', ''));
    if ($explicit !== '') {
        return $explicit;
    }

    $id = trim((string) array_value($operation, 'id', ''));
    if ($id === '' && $file !== '') {
        $id = preg_replace('/\.json$/i', '', basename((string) $file));
    }

    if (strpos($id, 'start-server-') === 0) {
        return 'startServer';
    }
    if (strpos($id, 'start-instances-') === 0) {
        return 'startInstances';
    }
    if (strpos($id, 'start-instance-') === 0) {
        return 'startInstance';
    }
    if (strpos($id, 'stop-instances-') === 0) {
        return 'stopInstances';
    }
    if (strpos($id, 'stop-instance-') === 0) {
        return 'stopInstance';
    }
    if (strpos($id, 'restart-instances-') === 0) {
        return 'restartInstances';
    }
    if (strpos($id, 'restart-instance-') === 0) {
        return 'restartInstance';
    }
    if (strpos($id, 'stop-server-') === 0) {
        return 'stopServer';
    }
    if (strpos($id, 'restart-service-') === 0) {
        return 'restartService';
    }
    if (strpos($id, 'start-service-') === 0) {
        return 'startService';
    }
    if (strpos($id, 'stop-service-') === 0) {
        return 'stopService';
    }
    if (strpos($id, 'restart-') === 0) {
        return 'restartServer';
    }

    $action = trim((string) array_value($operation, 'action', ''));
    $hasServices = !empty(array_value($operation, 'services', []));
    if ($action !== '') {
        if ($action === 'start') {
            return $hasServices ? 'startService' : 'startServer';
        }
        if ($action === 'stop') {
            return $hasServices ? 'stopService' : 'stopServer';
        }
        if ($action === 'restart') {
            return $hasServices ? 'restartService' : 'restartServer';
        }
    }

    return 'unknown';
}

function serverOpsParseTimestamp($value)
{
    if (!is_string($value) || trim($value) === '') {
        return 0;
    }

    $ts = @strtotime($value);
    return ($ts === false) ? 0 : intval($ts);
}

function serverOpsTimeoutForOperation(array $config, array $operation, $type)
{
    $serviceTimeout = max(60, intval(array_value($config, 'server_ops_service_timeout_seconds', 300)));
    $restartTimeout = max(120, intval(array_value($config, 'server_ops_restart_timeout_seconds', 900)));
    $servicesCount = max(1, count(array_value($operation, 'services', [])));
    $instanceStartTimeout = max(30, intval(array_value($config, 'instance_ops_start_timeout_seconds', 90)));
    $instanceStopTimeout = max(30, intval(array_value($config, 'instance_ops_stop_timeout_seconds', 90)));
    $instanceVerifyTimeout = max(5, intval(array_value($config, 'instance_ops_verify_timeout_seconds', 45)));
    $autostartTiming = serverAutostartTimingConfig($config);
    $instancesCount = max(1, count(array_value($operation, 'instances', [])));
    $selectedInstancesCount = count(array_value($operation, 'instances', []));

    switch ($type) {
        case 'startInstance':
        case 'startInstances':
            return ($instanceStartTimeout * $instancesCount) + 60;

        case 'stopInstance':
        case 'stopInstances':
            return ($instanceStopTimeout * $instancesCount) + 60;

        case 'restartInstance':
        case 'restartInstances':
            return (($instanceStartTimeout + $instanceStopTimeout) * $instancesCount) + 90;

        case 'startService':
        case 'stopService':
        case 'restartService':
            return ($serviceTimeout * $servicesCount) + 60;

        case 'startServer':
        case 'stopServer':
            return $restartTimeout + 180 + ($type === 'startServer'
                ? (
                    ($selectedInstancesCount > 0 ? intval($autostartTiming['initial_delay_seconds']) : 0)
                    + (($instanceStartTimeout + $instanceVerifyTimeout + intval($autostartTiming['per_instance_delay_seconds'])) * $selectedInstancesCount)
                )
                : 0);

        case 'restartServer':
            return max(180, intval(array_value($operation, 'countdown_seconds', 0))) + $restartTimeout + 180
                + ($selectedInstancesCount > 0 ? intval($autostartTiming['initial_delay_seconds']) : 0)
                + (($instanceStartTimeout + $instanceVerifyTimeout + intval($autostartTiming['per_instance_delay_seconds'])) * $selectedInstancesCount);

        default:
            return $restartTimeout + 180;
    }
}

function serverOpsMaybeFinalizeStaleOperation(array $config, array $operation, $file = '')
{
    if ($file === '' || empty($operation['running']) || !empty($operation['dry_run'])) {
        return $operation;
    }

    $type = trim((string) array_value($operation, 'type', 'unknown'));
    $createdAtTs = serverOpsParseTimestamp(array_value($operation, 'created_at', null));
    if ($createdAtTs <= 0) {
        $createdAtTs = @filemtime($file) ?: 0;
    }
    if ($createdAtTs <= 0) {
        return $operation;
    }

    $timeoutSeconds = serverOpsTimeoutForOperation($config, $operation, $type);
    if ($timeoutSeconds <= 0 || (time() - $createdAtTs) < $timeoutSeconds) {
        return $operation;
    }

    $staleDetectedAt = gmdate('c');
    $operation['running'] = false;
    $operation['success'] = false;
    $operation['success_state'] = 'error';
    $operation['stale'] = true;
    $operation['stale_timeout_seconds'] = $timeoutSeconds;
    $operation['stale_detected_at'] = $staleDetectedAt;
    if (trim((string) array_value($operation, 'completed_at', '')) === '') {
        $operation['completed_at'] = $staleDetectedAt;
    }
    if (trim((string) array_value($operation, 'error', '')) === '') {
        $operation['error'] = 'Operacao marcada como stale apos exceder timeout de monitoramento';
    }

    $persisted = $operation;
    unset($persisted['running'], $persisted['success_state'], $persisted['source_file']);

    $originalMtime = @filemtime($file) ?: 0;
    try {
        writeAtomicFile($file, safeJsonEncode($persisted));
        if ($originalMtime > 0) {
            @touch($file, $originalMtime);
        }
    } catch (Exception $e) {
        // Mantem o retorno hidratado mesmo se nao conseguir persistir a marcacao stale.
    }

    return $operation;
}

function serverOpsHydrateOperationStatus(array $operation, $file = '', array $config = null)
{
    $type = serverOpsInferOperationType($operation, $file);
    $completedAt = array_value($operation, 'completed_at', null);
    $stage = trim((string) array_value($operation, 'stage', ''));
    $success = truthyValue(array_value($operation, 'success', false));
    $isDryRun = truthyValue(array_value($operation, 'dry_run', false));
    $running = !$isDryRun && ($completedAt === null || $completedAt === '') && $stage !== '' && $stage !== 'done';
    $successState = $running ? 'running' : ($success ? 'success' : 'error');

    $operation['type'] = $type;
    $operation['running'] = $running;
    $operation['success_state'] = $successState;
    if ($file !== '') {
        $operation['source_file'] = $file;
    }

    if (is_array($config)) {
        $operation = serverOpsMaybeFinalizeStaleOperation($config, $operation, $file);
    }

    return $operation;
}

function serverOpsAllowedOperationTypes()
{
    return ['restartServer', 'startServer', 'stopServer', 'startService', 'stopService', 'restartService', 'startInstance', 'startInstances', 'stopInstance', 'stopInstances', 'restartInstance', 'restartInstances'];
}

function getServerOperationStatusHandler(array $config, array $request)
{
    $operationId = trim((string) array_value($request, 'operation_id', array_value($request, 'operationId', '')));
    $type = trim((string) array_value($request, 'type', ''));

    if ($operationId !== '' && !preg_match('/^[a-zA-Z0-9_.:-]+$/', $operationId)) {
        throw new InvalidArgumentException('operation_id invalido');
    }

    $allowedTypes = serverOpsAllowedOperationTypes();
    if ($type !== '' && !in_array($type, $allowedTypes, true)) {
        throw new InvalidArgumentException('type invalido');
    }

    $dir = serverOpsLogDir($config);
    $candidateFile = '';

    if ($operationId !== '') {
        $candidateFile = rtrim($dir, '/\\') . DIRECTORY_SEPARATOR . $operationId . '.json';
        if (!is_file($candidateFile)) {
            throw new Exception('Operacao nao encontrada');
        }
        $operation = serverOpsReadOperationFile($candidateFile);
        $operation = serverOpsHydrateOperationStatus($operation, $candidateFile, $config);
        if ($type !== '' && array_value($operation, 'type', '') !== $type) {
            throw new Exception('Operacao nao encontrada');
        }
        return [
            'success' => true,
            'operation' => $operation,
        ];
    }

    $files = serverOpsListOperationFiles($config);
    foreach ($files as $file) {
        $operation = serverOpsReadOperationFile($file);
        $operation = serverOpsHydrateOperationStatus($operation, $file, $config);
        if ($type !== '' && array_value($operation, 'type', '') !== $type) {
            continue;
        }
        return [
            'success' => true,
            'operation' => $operation,
        ];
    }

    throw new Exception('Operacao nao encontrada');
}

function serverOpsSummarizeOperation(array $operation)
{
    $summary = [
        'id' => trim((string) array_value($operation, 'id', '')),
        'type' => trim((string) array_value($operation, 'type', 'unknown')),
        'stage' => trim((string) array_value($operation, 'stage', '')),
        'running' => truthyValue(array_value($operation, 'running', false)),
        'success' => truthyValue(array_value($operation, 'success', false)),
        'success_state' => trim((string) array_value($operation, 'success_state', 'error')),
        'created_at' => array_value($operation, 'created_at', null),
        'completed_at' => array_value($operation, 'completed_at', null),
        'action' => trim((string) array_value($operation, 'action', '')),
        'services' => array_values(array_map('strval', array_value($operation, 'services', []))),
        'instances' => array_values(array_map('strval', array_value($operation, 'instances', []))),
        'reason' => trim((string) array_value($operation, 'reason', '')),
        'dry_run' => truthyValue(array_value($operation, 'dry_run', false)),
        'log_file' => trim((string) array_value($operation, 'log_file', '')),
        'error' => array_value($operation, 'error', null),
    ];

    $verification = array_value($operation, 'verification', null);
    if (is_array($verification)) {
        $services = [];
        foreach (array_value($verification, 'services', []) as $service) {
            if (!is_array($service)) {
                continue;
            }
            $services[] = [
                'key' => trim((string) array_value($service, 'key', '')),
                'state' => trim((string) array_value($service, 'state', '')),
            ];
        }

        $summary['verification'] = [
            'requested' => truthyValue(array_value($verification, 'requested', false)),
            'success' => truthyValue(array_value($verification, 'success', false)),
            'services' => $services,
            'collected_at' => array_value($verification, 'collected_at', null),
        ];
        if (is_array(array_value($verification, 'instances', null))) {
            $instances = [];
            foreach (array_value($verification, 'instances', []) as $instance) {
                if (!is_array($instance)) {
                    continue;
                }
                $instances[] = [
                    'code' => trim((string) array_value($instance, 'code', '')),
                    'state' => trim((string) array_value($instance, 'state', '')),
                ];
            }
            $summary['verification']['instances'] = $instances;
        }
    }

    return $summary;
}

function getServerOperationsHistoryHandler(array $config, array $request)
{
    $type = trim((string) array_value($request, 'type', ''));
    $successState = trim((string) array_value($request, 'success_state', array_value($request, 'successState', '')));
    $limit = intval(array_value($request, 'limit', 50));

    if ($limit < 1 || $limit > 200) {
        throw new InvalidArgumentException('limit deve ficar entre 1 e 200');
    }

    $allowedTypes = serverOpsAllowedOperationTypes();
    if ($type !== '' && !in_array($type, $allowedTypes, true)) {
        throw new InvalidArgumentException('type invalido');
    }

    $allowedSuccessStates = ['running', 'success', 'error'];
    if ($successState !== '' && !in_array($successState, $allowedSuccessStates, true)) {
        throw new InvalidArgumentException('success_state invalido');
    }

    $operations = [];
    foreach (serverOpsListOperationFiles($config) as $file) {
        try {
            $operation = serverOpsReadOperationFile($file);
        } catch (Exception $e) {
            continue;
        }

        $operation = serverOpsHydrateOperationStatus($operation, $file, $config);
        if ($type !== '' && array_value($operation, 'type', '') !== $type) {
            continue;
        }
        if ($successState !== '' && array_value($operation, 'success_state', '') !== $successState) {
            continue;
        }

        $operations[] = serverOpsSummarizeOperation($operation);
        if (count($operations) >= $limit) {
            break;
        }
    }

    return [
        'success' => true,
        'operations' => $operations,
        'count' => count($operations),
        'filters' => [
            'type' => $type,
            'success_state' => $successState,
            'limit' => $limit,
        ],
        'history_file' => rtrim(serverOpsLogDir($config), '/\\') . DIRECTORY_SEPARATOR . 'history.log',
    ];
}

function validateRestartServerRequest(array $request)
{
    $reason = trimOneLineText(array_value($request, 'reason', ''));
    if ($reason === '' || strlen($reason) < 3) {
        throw new InvalidArgumentException('reason obrigatorio com pelo menos 3 caracteres');
    }
    if (containsControlChars($reason) || strlen($reason) > 240) {
        throw new InvalidArgumentException('reason invalido');
    }

    $countdown = intval(array_value($request, 'countdown_seconds', array_value($request, 'countdown', 0)));
    if ($countdown < 0 || $countdown > 3600) {
        throw new InvalidArgumentException('countdown_seconds deve ficar entre 0 e 3600');
    }

    return [
        'reason' => $reason,
        'countdown_seconds' => $countdown,
        'broadcast' => !array_key_exists('broadcast', $request) || truthyValue(array_value($request, 'broadcast', true)),
        'enable_maintenance' => !array_key_exists('enable_maintenance', $request) || truthyValue(array_value($request, 'enable_maintenance', true)),
        'backup_before_restart' => !array_key_exists('backup_before_restart', $request) || truthyValue(array_value($request, 'backup_before_restart', true)),
        'verify_after_restart' => !array_key_exists('verify_after_restart', $request) || truthyValue(array_value($request, 'verify_after_restart', true)),
        'dry_run' => truthyValue(array_value($request, 'dry_run', array_value($request, 'dryRun', false))),
    ];
}

function restartCountdownMarks(array $config, $countdownSeconds)
{
    $marks = array_map('intval', array_value($config, 'server_ops_restart_countdown_marks', [300, 180, 120, 60, 30, 10, 5, 4, 3, 2, 1]));
    $marks = array_values(array_unique(array_filter($marks, function ($mark) use ($countdownSeconds) {
        return $mark > 0 && $mark < intval($countdownSeconds);
    })));
    rsort($marks, SORT_NUMERIC);
    return $marks;
}

function restartAnnouncementMessage($remainingSeconds, $reason)
{
    $remainingSeconds = intval($remainingSeconds);
    $reason = trim((string) $reason);
    if ($remainingSeconds <= 0) {
        return 'Reinicio do servidor iniciando agora.' . ($reason !== '' ? (' Motivo: ' . $reason) : '');
    }

    if ($remainingSeconds >= 60 && ($remainingSeconds % 60) === 0) {
        $minutes = intval($remainingSeconds / 60);
        $label = $minutes === 1 ? '1 minuto' : $minutes . ' minutos';
    } else {
        $label = $remainingSeconds === 1 ? '1 segundo' : $remainingSeconds . ' segundos';
    }

    return 'Servidor sera reiniciado em ' . $label . '.' . ($reason !== '' ? (' Motivo: ' . $reason) : '');
}

function executeServerOpsCommand($command, $timeoutSeconds = 0)
{
    $command = trim((string) $command);
    if ($command === '') {
        throw new Exception('Comando de operacao do servidor nao configurado');
    }
    if (!function_exists('exec')) {
        throw new Exception('exec() desabilitado no PHP');
    }

    $wrapper = '';
    if ($timeoutSeconds > 0 && serverOpsShellAvailable()) {
        $timeoutBin = trim((string) serverOpsRun('command -v timeout 2>/dev/null'));
        if ($timeoutBin !== '') {
            $wrapper = $timeoutBin . ' ' . intval($timeoutSeconds) . ' ';
        }
    }

    $output = [];
    $exitCode = 0;
    @exec($wrapper . $command . ' 2>&1', $output, $exitCode);
    $rawOutput = trim(implode("\n", $output));
    $parsed = parseCommandJsonOutput($rawOutput);

    return [
        'success' => ($exitCode === 0),
        'exit_code' => intval($exitCode),
        'stdout_excerpt' => excerptText($rawOutput, 3000),
        'parsed' => $parsed,
    ];
}

function verifyRestartServices(array $config)
{
    $wanted = array_map('strval', array_value($config, 'server_ops_verify_services', []));
    return waitForServiceKeysState($config, $wanted, true);
}

function serverOpsServiceAliases()
{
    return [
        'world' => 'gamed',
        'gs' => 'gamed',
        'gauthd' => 'authd',
        'glink' => 'glinkd',
    ];
}

function serverOpsManageableServiceKeys(array $config)
{
    $configured = array_map('strval', array_value($config, 'server_ops_manageable_services', []));
    if (!empty($configured)) {
        return array_values(array_unique(array_filter(array_map('trim', $configured), function ($value) {
            return $value !== '';
        })));
    }

    $known = [];
    foreach (serverOpsKnownServices() as $service) {
        $key = trim((string) array_value($service, 'key', ''));
        if ($key !== '' && !in_array($key, ['mysql', 'httpd'], true)) {
            $known[] = $key;
        }
    }
    return array_values(array_unique($known));
}

function normalizeServerOpsServiceKeys(array $request, array $config, $required = true)
{
    $raw = [];
    if (array_key_exists('service', $request)) {
        $raw[] = array_value($request, 'service', '');
    }
    if (array_key_exists('services', $request)) {
        $services = array_value($request, 'services', []);
        if (is_array($services)) {
            $raw = array_merge($raw, $services);
        } else {
            $raw[] = $services;
        }
    }

    $values = [];
    foreach ($raw as $entry) {
        if (is_array($entry)) {
            $values = array_merge($values, $entry);
            continue;
        }
        foreach (preg_split('/[\s,;]+/', trim((string) $entry)) as $part) {
            $part = trim((string) $part);
            if ($part !== '') {
                $values[] = $part;
            }
        }
    }

    $aliases = serverOpsServiceAliases();
    $allowed = serverOpsManageableServiceKeys($config);
    $normalized = [];
    foreach ($values as $value) {
        $value = strtolower(trim((string) $value));
        if ($value === '') {
            continue;
        }
        if (isset($aliases[$value])) {
            $value = $aliases[$value];
        }
        if (!in_array($value, $allowed, true)) {
            throw new InvalidArgumentException('service invalido: ' . $value);
        }
        if (!in_array($value, $normalized, true)) {
            $normalized[] = $value;
        }
    }

    if ($required && empty($normalized)) {
        throw new InvalidArgumentException('Informe service ou services');
    }

    return $normalized;
}

function validateServerOpsActionRequest(array $request)
{
    return [
        'dry_run' => truthyValue(array_value($request, 'dry_run', array_value($request, 'dryRun', false))),
        'verify' => !array_key_exists('verify', $request) || truthyValue(array_value($request, 'verify', true)),
    ];
}

function verifyServiceKeysState(array $config, array $wanted, $expectOnline = true)
{
    $snapshot = getServiceStatusSnapshot($config);
    $services = array_value($snapshot, 'services', []);
    $index = [];
    foreach ($services as $service) {
        $key = trim((string) array_value($service, 'key', ''));
        if ($key !== '') {
            $index[$key] = $service;
        }
    }

    $selected = [];
    $ok = true;
    foreach ($wanted as $key) {
        $item = isset($index[$key]) ? $index[$key] : ['key' => $key, 'state' => 'unknown', 'process_count' => 0, 'listening' => false];
        $selected[] = [
            'key' => $key,
            'state' => array_value($item, 'state', 'unknown'),
            'pid' => array_value($item, 'pid', null),
            'process_count' => intval(array_value($item, 'process_count', 0)),
            'listening' => truthyValue(array_value($item, 'listening', false)),
        ];

        if ($expectOnline) {
            if (array_value($item, 'state', 'unknown') !== 'online') {
                $ok = false;
            }
        } else {
            if (intval(array_value($item, 'process_count', 0)) > 0 || truthyValue(array_value($item, 'listening', false)) || array_value($item, 'state', 'unknown') === 'online') {
                $ok = false;
            }
        }
    }

    return [
        'requested' => true,
        'expect_online' => $expectOnline,
        'success' => $ok,
        'services' => $selected,
        'collected_at' => array_value($snapshot, 'collected_at', gmdate('c')),
    ];
}

function waitForServiceKeysState(array $config, array $wanted, $expectOnline = true)
{
    $timeoutSeconds = max(5, intval(array_value($config, 'server_ops_verify_timeout_seconds', 45)));
    $intervalSeconds = max(1, intval(array_value($config, 'server_ops_verify_poll_interval_seconds', 2)));
    $deadline = microtime(true) + $timeoutSeconds;

    $last = verifyServiceKeysState($config, $wanted, $expectOnline);
    $attempts = 1;
    while (empty($last['success']) && microtime(true) < $deadline) {
        sleep($intervalSeconds);
        $last = verifyServiceKeysState($config, $wanted, $expectOnline);
        $attempts++;
    }

    $last['timeout_seconds'] = $timeoutSeconds;
    $last['poll_interval_seconds'] = $intervalSeconds;
    $last['attempts'] = $attempts;
    return $last;
}

function executeServiceControlCommand(array $config, $action, $service)
{
    $command = trim((string) array_value($config, 'server_ops_service_control_command', ''));
    if ($command === '') {
        throw new Exception('Comando de controle de servico nao configurado');
    }

    return executeServerOpsCommand(
        $command . ' ' . escapeshellarg((string) $action) . ' ' . escapeshellarg((string) $service),
        intval(array_value($config, 'server_ops_service_timeout_seconds', 300))
    );
}

function handleServiceOperationRequest(array $config, $action, array $request)
{
    $meta = validateServerOpsActionRequest($request);
    $services = normalizeServerOpsServiceKeys($request, $config, true);
    $operation = [
        'id' => buildOperationId($action . '-service'),
        'success' => false,
        'stage' => 'validated',
        'action' => $action,
        'services' => $services,
        'dry_run' => !empty($meta['dry_run']),
        'verify' => !empty($meta['verify']),
        'created_at' => gmdate('c'),
        'results' => [],
    ];
    $operation['log_file'] = writeRestartOperationSnapshot($config, $operation);

    if (!empty($meta['dry_run'])) {
        $operation['success'] = true;
        $operation['would_execute'] = trim((string) array_value($config, 'server_ops_service_control_command', ''));
        $operation['stage'] = 'validated';
        $operation['log_file'] = writeRestartOperationLog($config, $operation);
        return ['success' => true, 'dry_run' => true, 'operation' => $operation];
    }

    try {
        foreach ($services as $service) {
            $operation['stage'] = $action . '_' . $service;
            $operation['log_file'] = writeRestartOperationSnapshot($config, $operation);
            $result = executeServiceControlCommand($config, $action, $service);
            $operation['results'][] = [
                'service' => $service,
                'result' => $result,
            ];
            $operation['log_file'] = writeRestartOperationSnapshot($config, $operation);
            if (empty($result['success'])) {
                throw new Exception('Falha ao executar ' . $action . ' em ' . $service . ' (exit ' . intval(array_value($result, 'exit_code', 1)) . ')');
            }
        }

        if (!empty($meta['verify'])) {
            $operation['stage'] = 'verify';
            $operation['verification'] = waitForServiceKeysState($config, $services, $action !== 'stop');
            $operation['log_file'] = writeRestartOperationSnapshot($config, $operation);
            if (empty($operation['verification']['success'])) {
                throw new Exception('Verificacao apos ' . $action . ' falhou para um ou mais servicos');
            }
        } else {
            $operation['verification'] = ['requested' => false];
        }

        $operation['stage'] = 'done';
        $operation['success'] = true;
        $operation['completed_at'] = gmdate('c');
        $operation['log_file'] = writeRestartOperationLog($config, $operation);
        return ['success' => true, 'operation' => $operation];
    } catch (Exception $e) {
        $operation['success'] = false;
        $operation['error'] = $e->getMessage();
        $operation['completed_at'] = gmdate('c');
        $operation['log_file'] = writeRestartOperationLog($config, $operation);
        return [
            'success' => false,
            'error' => $e->getMessage(),
            'operation' => [
                'id' => $operation['id'],
                'stage' => $operation['stage'],
                'log_file' => $operation['log_file'],
            ],
        ];
    }
}

function handleServerPowerRequest(array $config, $action, array $request)
{
    $meta = validateServerOpsActionRequest($request);
    $commandKey = $action === 'start' ? 'server_ops_start_command' : 'server_ops_stop_command';
    $services = serverOpsManageableServiceKeys($config);
    $instanceSelection = ($action === 'start')
        ? normalizeServerStartInstanceSelectionRequest($request, $config)
        : ['requested' => false, 'use_auto_start' => false, 'source' => 'none', 'codes' => []];
    $operation = [
        'id' => buildOperationId($action . '-server'),
        'success' => false,
        'stage' => 'validated',
        'action' => $action,
        'dry_run' => !empty($meta['dry_run']),
        'verify' => !empty($meta['verify']),
        'services' => $services,
        'instances' => array_values(array_map('strval', array_value($instanceSelection, 'codes', []))),
        'created_at' => gmdate('c'),
    ];
    $operation['log_file'] = writeRestartOperationSnapshot($config, $operation);

    if (!empty($meta['dry_run'])) {
        $operation['success'] = true;
        $operation['would_execute'] = trim((string) array_value($config, $commandKey, ''));
        if ($action === 'start') {
            $operation['instance_selection'] = [
                'requested' => !empty($instanceSelection['requested']),
                'use_auto_start' => !empty($instanceSelection['use_auto_start']),
                'source' => trim((string) array_value($instanceSelection, 'source', 'none')),
            ];
            $instancesByCode = instanceControlIndexByCode($config);
            $alreadyRunning = [];
            $pending = [];
            foreach ((array) array_value($instanceSelection, 'codes', []) as $code) {
                if (truthyValue(array_value(array_value($instancesByCode, $code, []), 'running', false))) {
                    $alreadyRunning[] = $code;
                } else {
                    $pending[] = $code;
                }
            }
            $operation['would_start_instances'] = $pending;
            $operation['would_skip_running_instances'] = $alreadyRunning;
        }
        $operation['log_file'] = writeRestartOperationLog($config, $operation);
        return ['success' => true, 'dry_run' => true, 'operation' => $operation];
    }

    ignore_user_abort(true);
    @set_time_limit(max(120, serverOpsTimeoutForOperation($config, $operation, $action === 'start' ? 'startServer' : 'stopServer') + 30));

    try {
        $operation['stage'] = $action;
        $operation['log_file'] = writeRestartOperationSnapshot($config, $operation);
        $operation['result'] = executeServerOpsCommand(
            array_value($config, $commandKey, ''),
            intval(array_value($config, 'server_ops_restart_timeout_seconds', 900))
        );
        $operation['log_file'] = writeRestartOperationSnapshot($config, $operation);
        if (empty($operation['result']['success'])) {
            throw new Exception('Wrapper de ' . $action . ' falhou (exit ' . intval(array_value($operation['result'], 'exit_code', 1)) . ')');
        }

        if (!empty($meta['verify'])) {
            $operation['stage'] = 'verify';
            $operation['verification'] = waitForServiceKeysState($config, $services, $action === 'start');
            $operation['log_file'] = writeRestartOperationSnapshot($config, $operation);
            if (empty($operation['verification']['success'])) {
                throw new Exception('Verificacao apos ' . $action . ' falhou');
            }
        } else {
            $operation['verification'] = ['requested' => false];
        }

        if ($action === 'start') {
            executeServerSelectedInstanceStart($config, $operation, $instanceSelection, !empty($meta['verify']));
        } else {
            $operation['instance_verification'] = ['requested' => false];
        }

        $operation['stage'] = 'done';
        $operation['success'] = true;
        $operation['completed_at'] = gmdate('c');
        $operation['log_file'] = writeRestartOperationLog($config, $operation);
        return ['success' => true, 'operation' => $operation];
    } catch (Exception $e) {
        $operation['success'] = false;
        $operation['error'] = $e->getMessage();
        $operation['completed_at'] = gmdate('c');
        $operation['log_file'] = writeRestartOperationLog($config, $operation);
        return [
            'success' => false,
            'error' => $e->getMessage(),
            'operation' => [
                'id' => $operation['id'],
                'stage' => $operation['stage'],
                'log_file' => $operation['log_file'],
            ],
        ];
    }
}

function handleRestartServerRequest(array $config, array $request)
{
    $payload = validateRestartServerRequest($request);
    $instanceSelection = normalizeServerStartInstanceSelectionRequest($request, $config);
    $operation = [
        'id' => buildOperationId('restart'),
        'success' => false,
        'stage' => 'validated',
        'reason' => $payload['reason'],
        'countdown_seconds' => intval($payload['countdown_seconds']),
        'dry_run' => !empty($payload['dry_run']),
        'instances' => array_values(array_map('strval', array_value($instanceSelection, 'codes', []))),
        'created_at' => gmdate('c'),
        'countdown' => [],
    ];
    $operation['log_file'] = writeRestartOperationSnapshot($config, $operation);

    if (!empty($payload['dry_run'])) {
        $operation['success'] = true;
        $operation['would_enable_maintenance'] = !empty($payload['enable_maintenance']);
        $operation['would_broadcast'] = !empty($payload['broadcast']);
        $operation['would_backup'] = !empty($payload['backup_before_restart']);
        $operation['would_execute'] = trim((string) array_value($config, 'server_ops_restart_command', ''));
        $operation['would_verify_services'] = array_values(array_map('strval', array_value($config, 'server_ops_verify_services', [])));
        $operation['instance_selection'] = [
            'requested' => !empty($instanceSelection['requested']),
            'use_auto_start' => !empty($instanceSelection['use_auto_start']),
            'source' => trim((string) array_value($instanceSelection, 'source', 'none')),
        ];
        $instancesByCode = instanceControlIndexByCode($config);
        $alreadyRunning = [];
        $pending = [];
        foreach ((array) array_value($instanceSelection, 'codes', []) as $code) {
            if (truthyValue(array_value(array_value($instancesByCode, $code, []), 'running', false))) {
                $alreadyRunning[] = $code;
            } else {
                $pending[] = $code;
            }
        }
        $operation['would_start_instances_after_restart'] = array_values(array_map('strval', array_value($instanceSelection, 'codes', [])));
        $operation['would_skip_running_instances_before_restart'] = $alreadyRunning;
        $operation['would_pending_instances_before_restart'] = $pending;
        $operation['log_file'] = writeRestartOperationLog($config, $operation);
        return [
            'success' => true,
            'dry_run' => true,
            'operation' => $operation,
        ];
    }

    ignore_user_abort(true);
    @set_time_limit(max(120, serverOpsTimeoutForOperation($config, $operation, 'restartServer') + 30));

    try {
        if (!empty($payload['enable_maintenance'])) {
            $operation['stage'] = 'maintenance_enable';
            $operation['maintenance'] = applyMaintenanceMode($config, [
                'enabled' => true,
                'reason' => $payload['reason'],
                'eta_minutes' => intval(ceil($payload['countdown_seconds'] / 60)),
                'broadcast' => false,
                'dry_run' => false,
                'updated_by' => 'restartServer',
            ]);
            $operation['log_file'] = writeRestartOperationSnapshot($config, $operation);
        }

        if (!empty($payload['broadcast'])) {
            $operation['stage'] = 'broadcast_initial';
            $operation['broadcast'] = [
                'enabled' => true,
                'initial' => tryHandleSendSystemMessageRequest($config, [
                    'message' => restartAnnouncementMessage($payload['countdown_seconds'], $payload['reason']),
                    'kind' => 'system',
                    'priority' => 'high',
                    'dry_run' => false,
                ]),
            ];
            $operation['log_file'] = writeRestartOperationSnapshot($config, $operation);
        } else {
            $operation['broadcast'] = ['enabled' => false];
            $operation['log_file'] = writeRestartOperationSnapshot($config, $operation);
        }

        $marks = restartCountdownMarks($config, $payload['countdown_seconds']);
        $remaining = intval($payload['countdown_seconds']);
        foreach ($marks as $mark) {
            $sleepFor = $remaining - $mark;
            if ($sleepFor > 0) {
                sleep($sleepFor);
            }

            if (!empty($payload['broadcast'])) {
                $operation['stage'] = 'countdown_' . $mark;
                $operation['countdown'][] = [
                    'remaining_seconds' => $mark,
                    'broadcast' => tryHandleSendSystemMessageRequest($config, [
                        'message' => restartAnnouncementMessage($mark, $payload['reason']),
                        'kind' => 'system',
                        'priority' => ($mark <= 30 ? 'high' : 'normal'),
                        'dry_run' => false,
                    ]),
                ];
                $operation['log_file'] = writeRestartOperationSnapshot($config, $operation);
            }
            $remaining = $mark;
        }

        if ($remaining > 0) {
            sleep($remaining);
        }

        if (!empty($payload['backup_before_restart'])) {
            $operation['stage'] = 'backup';
            $operation['log_file'] = writeRestartOperationSnapshot($config, $operation);
            $operation['backup'] = createGamedbdSafetyBackup($config, 'before_restartServer_' . $operation['id'], true);
            $operation['log_file'] = writeRestartOperationSnapshot($config, $operation);
        } else {
            $operation['backup'] = ['requested' => false];
            $operation['log_file'] = writeRestartOperationSnapshot($config, $operation);
        }

        $operation['stage'] = 'restart';
        $operation['log_file'] = writeRestartOperationSnapshot($config, $operation);
        $operation['restart'] = executeServerOpsCommand(
            array_value($config, 'server_ops_restart_command', ''),
            intval(array_value($config, 'server_ops_restart_timeout_seconds', 900))
        );
        $operation['log_file'] = writeRestartOperationSnapshot($config, $operation);
        if (empty($operation['restart']['success'])) {
            throw new Exception('Wrapper de restart falhou (exit ' . intval(array_value($operation['restart'], 'exit_code', 1)) . ')');
        }

        if (!empty($payload['verify_after_restart'])) {
            $operation['stage'] = 'verify';
            $operation['log_file'] = writeRestartOperationSnapshot($config, $operation);
            $operation['verification'] = verifyRestartServices($config);
            $operation['log_file'] = writeRestartOperationSnapshot($config, $operation);
            if (empty($operation['verification']['success'])) {
                throw new Exception('Verificacao pos-restart falhou: nem todos os servicos criticos voltaram online');
            }
        } else {
            $operation['verification'] = ['requested' => false];
            $operation['log_file'] = writeRestartOperationSnapshot($config, $operation);
        }

        executeServerSelectedInstanceStart($config, $operation, $instanceSelection, !empty($payload['verify_after_restart']));

        if (!empty($payload['enable_maintenance'])) {
            $operation['stage'] = 'maintenance_disable';
            $operation['maintenance_after_restart'] = applyMaintenanceMode($config, [
                'enabled' => false,
                'reason' => 'Servidor reiniciado com sucesso',
                'eta_minutes' => 0,
                'broadcast' => false,
                'dry_run' => false,
                'updated_by' => 'restartServer',
            ]);
            $operation['log_file'] = writeRestartOperationSnapshot($config, $operation);
        }

        if (!empty($payload['broadcast'])) {
            $operation['stage'] = 'broadcast_final';
            $operation['broadcast']['final'] = tryHandleSendSystemMessageRequest($config, [
                'message' => 'Servidor reiniciado com sucesso.',
                'kind' => 'system',
                'priority' => 'high',
                'dry_run' => false,
            ]);
            $operation['log_file'] = writeRestartOperationSnapshot($config, $operation);
        }

        $operation['stage'] = 'done';
        $operation['success'] = true;
        $operation['completed_at'] = gmdate('c');
        $operation['log_file'] = writeRestartOperationLog($config, $operation);
        return [
            'success' => true,
            'operation' => $operation,
        ];
    } catch (Exception $e) {
        $operation['completed_at'] = gmdate('c');
        $operation['error'] = $e->getMessage();
        $operation['success'] = false;
        $operation['log_file'] = writeRestartOperationLog($config, $operation);
        return [
            'success' => false,
            'error' => $e->getMessage(),
            'operation' => [
                'id' => $operation['id'],
                'stage' => $operation['stage'],
                'log_file' => $operation['log_file'],
            ],
        ];
    }
}

function respondJson($payload, $status = 200)
{
    http_response_code($status);
    echo safeJsonEncode($payload);
}

if (php_sapi_name() !== 'cli' || isset($_GET['action'])) {
    header('Content-Type: application/json; charset=utf-8');

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

        case 'sendMailItem':
        case 'sendMailGold':
            if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
                respondJson(['error' => 'Use POST para envio de correio'], 405);
                exit;
            }

            $request = readRequestPayload();
            if (isset($request['__json_error'])) {
                respondJson(['error' => 'JSON invalido: ' . $request['__json_error']], 400);
                exit;
            }

            try {
                $mailPayload = ($action === 'sendMailItem')
                    ? buildSendMailItemPayload($request, $CONFIG)
                    : buildSendMailGoldPayload($request, $CONFIG);

                $delivery = executeMailSendCommand($CONFIG, $mailPayload);
                respondJson([
                    'success' => true,
                    'delivery' => $delivery,
                ]);
            } catch (InvalidArgumentException $e) {
                respondJson(['error' => $e->getMessage()], 400);
            } catch (Exception $e) {
                respondJson(['error' => $e->getMessage()], 500);
            }
            break;

        case 'kickRole':
        case 'banAccount':
        case 'unbanAccount':
            if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
                respondJson(['error' => 'Use POST para moderacao'], 405);
                exit;
            }

            $request = readRequestPayload();
            if (isset($request['__json_error'])) {
                respondJson(['error' => 'JSON invalido: ' . $request['__json_error']], 400);
                exit;
            }

            $proto = new GamedProtocol();

            try {
                if ($action === 'kickRole') {
                    $payload = buildKickRolePayload($request, $CONFIG);
                } elseif ($action === 'banAccount') {
                    $payload = buildBanAccountPayload($request, $CONFIG, $proto);
                } else {
                    $payload = buildUnbanAccountPayload($request, $CONFIG, $proto);
                }

                $result = executeSecurityAction($CONFIG, $payload);
                respondJson([
                    'success' => true,
                    'moderation' => $result,
                ]);
            } catch (InvalidArgumentException $e) {
                appendSecurityActionLog($CONFIG, [
                    'created_at' => gmdate('c'),
                    'status' => 'error',
                    'action' => $action,
                    'roleid' => intval(firstArrayValue($request, ['roleid', 'role_id', 'target_roleid'], 0)),
                    'userid' => intval(firstArrayValue($request, ['userid', 'user_id', 'account_id', 'accountId', 'target_userid'], 0)),
                    'error' => $e->getMessage(),
                ]);
                respondJson(['error' => $e->getMessage()], 400);
            } catch (Exception $e) {
                appendSecurityActionLog($CONFIG, [
                    'created_at' => gmdate('c'),
                    'status' => 'error',
                    'action' => $action,
                    'roleid' => intval(firstArrayValue($request, ['roleid', 'role_id', 'target_roleid'], 0)),
                    'userid' => intval(firstArrayValue($request, ['userid', 'user_id', 'account_id', 'accountId', 'target_userid'], 0)),
                    'error' => $e->getMessage(),
                ]);
                respondJson(['error' => $e->getMessage()], 500);
            }
            break;

        case 'getServiceStatus':
            try {
                respondJson(getServiceStatusSnapshot($CONFIG));
            } catch (InvalidArgumentException $e) {
                respondJson(['error' => $e->getMessage()], 400);
            } catch (Exception $e) {
                respondJson(['error' => $e->getMessage()], 500);
            }
            break;

        case 'getManageableServices':
            try {
                respondJson(getManageableServicesSnapshot($CONFIG));
            } catch (InvalidArgumentException $e) {
                respondJson(['error' => $e->getMessage()], 400);
            } catch (Exception $e) {
                respondJson(['error' => $e->getMessage()], 500);
            }
            break;

        case 'getManageableInstances':
            try {
                respondJson(getManageableInstancesSnapshot($CONFIG));
            } catch (InvalidArgumentException $e) {
                respondJson(['error' => $e->getMessage()], 400);
            } catch (Exception $e) {
                respondJson(['error' => $e->getMessage()], 500);
            }
            break;

        case 'setInstanceAutoStart':
            if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
                respondJson(['error' => 'Use POST para setInstanceAutoStart'], 405);
                exit;
            }

            $request = readRequestPayload();
            if (isset($request['__json_error'])) {
                respondJson(['error' => 'JSON invalido: ' . $request['__json_error']], 400);
                exit;
            }

            try {
                respondJson(setInstanceAutoStartHandler($CONFIG, $request));
            } catch (InvalidArgumentException $e) {
                respondJson(['error' => $e->getMessage()], 400);
            } catch (Exception $e) {
                respondJson(['error' => $e->getMessage()], 500);
            }
            break;

        case 'startInstance':
            if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
                respondJson(['error' => 'Use POST para startInstance'], 405);
                exit;
            }

            $request = readRequestPayload();
            if (isset($request['__json_error'])) {
                respondJson(['error' => 'JSON invalido: ' . $request['__json_error']], 400);
                exit;
            }

            try {
                $result = handleStartInstanceRequest($CONFIG, $request, false);
                respondJson($result, !empty($result['success']) ? 200 : 500);
            } catch (InvalidArgumentException $e) {
                respondJson(['error' => $e->getMessage()], 400);
            } catch (Exception $e) {
                respondJson(['error' => $e->getMessage()], 500);
            }
            break;

        case 'startInstances':
            if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
                respondJson(['error' => 'Use POST para startInstances'], 405);
                exit;
            }

            $request = readRequestPayload();
            if (isset($request['__json_error'])) {
                respondJson(['error' => 'JSON invalido: ' . $request['__json_error']], 400);
                exit;
            }

            try {
                $result = handleStartInstanceRequest($CONFIG, $request, true);
                respondJson($result, !empty($result['success']) ? 200 : 500);
            } catch (InvalidArgumentException $e) {
                respondJson(['error' => $e->getMessage()], 400);
            } catch (Exception $e) {
                respondJson(['error' => $e->getMessage()], 500);
            }
            break;

        case 'stopInstance':
            if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
                respondJson(['error' => 'Use POST para stopInstance'], 405);
                exit;
            }

            $request = readRequestPayload();
            if (isset($request['__json_error'])) {
                respondJson(['error' => 'JSON invalido: ' . $request['__json_error']], 400);
                exit;
            }

            try {
                $result = handleStopInstanceRequest($CONFIG, $request, false);
                respondJson($result, !empty($result['success']) ? 200 : 500);
            } catch (InvalidArgumentException $e) {
                respondJson(['error' => $e->getMessage()], 400);
            } catch (Exception $e) {
                respondJson(['error' => $e->getMessage()], 500);
            }
            break;

        case 'stopInstances':
            if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
                respondJson(['error' => 'Use POST para stopInstances'], 405);
                exit;
            }

            $request = readRequestPayload();
            if (isset($request['__json_error'])) {
                respondJson(['error' => 'JSON invalido: ' . $request['__json_error']], 400);
                exit;
            }

            try {
                $result = handleStopInstanceRequest($CONFIG, $request, true);
                respondJson($result, !empty($result['success']) ? 200 : 500);
            } catch (InvalidArgumentException $e) {
                respondJson(['error' => $e->getMessage()], 400);
            } catch (Exception $e) {
                respondJson(['error' => $e->getMessage()], 500);
            }
            break;

        case 'restartInstance':
            if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
                respondJson(['error' => 'Use POST para restartInstance'], 405);
                exit;
            }

            $request = readRequestPayload();
            if (isset($request['__json_error'])) {
                respondJson(['error' => 'JSON invalido: ' . $request['__json_error']], 400);
                exit;
            }

            try {
                $result = handleRestartInstanceRequest($CONFIG, $request, false);
                respondJson($result, !empty($result['success']) ? 200 : 500);
            } catch (InvalidArgumentException $e) {
                respondJson(['error' => $e->getMessage()], 400);
            } catch (Exception $e) {
                respondJson(['error' => $e->getMessage()], 500);
            }
            break;

        case 'restartInstances':
            if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
                respondJson(['error' => 'Use POST para restartInstances'], 405);
                exit;
            }

            $request = readRequestPayload();
            if (isset($request['__json_error'])) {
                respondJson(['error' => 'JSON invalido: ' . $request['__json_error']], 400);
                exit;
            }

            try {
                $result = handleRestartInstanceRequest($CONFIG, $request, true);
                respondJson($result, !empty($result['success']) ? 200 : 500);
            } catch (InvalidArgumentException $e) {
                respondJson(['error' => $e->getMessage()], 400);
            } catch (Exception $e) {
                respondJson(['error' => $e->getMessage()], 500);
            }
            break;

        case 'getServerOperationStatus':
            try {
                respondJson(getServerOperationStatusHandler($CONFIG, $_GET));
            } catch (InvalidArgumentException $e) {
                respondJson(['error' => $e->getMessage()], 400);
            } catch (Exception $e) {
                $message = $e->getMessage();
                $status = ($message === 'Operacao nao encontrada') ? 404 : 500;
                respondJson(['error' => $message], $status);
            }
            break;

        case 'getServerOperationsHistory':
            try {
                respondJson(getServerOperationsHistoryHandler($CONFIG, $_GET));
            } catch (InvalidArgumentException $e) {
                respondJson(['error' => $e->getMessage()], 400);
            } catch (Exception $e) {
                respondJson(['error' => $e->getMessage()], 500);
            }
            break;

        case 'getServerLogs':
            try {
                $source = isset($_GET['source']) ? (string) $_GET['source'] : 'apicls';
                $lines = isset($_GET['lines']) ? intval($_GET['lines']) : 100;
                $query = isset($_GET['q']) ? (string) $_GET['q'] : '';
                respondJson(getServerLogsSnapshot($CONFIG, $source, $lines, $query));
            } catch (InvalidArgumentException $e) {
                respondJson(['error' => $e->getMessage()], 400);
            } catch (Exception $e) {
                respondJson(['error' => $e->getMessage()], 500);
            }
            break;

        case 'sendSystemMessage':
            if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
                respondJson(['error' => 'Use POST para sendSystemMessage'], 405);
                exit;
            }

            $request = readRequestPayload();
            if (isset($request['__json_error'])) {
                respondJson(['error' => 'JSON invalido: ' . $request['__json_error']], 400);
                exit;
            }

            try {
                respondJson(handleSendSystemMessageRequest($CONFIG, $request));
            } catch (InvalidArgumentException $e) {
                respondJson(['error' => $e->getMessage()], 400);
            } catch (Exception $e) {
                respondJson(['error' => $e->getMessage()], 500);
            }
            break;

        case 'getMaintenanceMode':
            try {
                respondJson(getMaintenanceModeHandler($CONFIG));
            } catch (InvalidArgumentException $e) {
                respondJson(['error' => $e->getMessage()], 400);
            } catch (Exception $e) {
                respondJson(['error' => $e->getMessage()], 500);
            }
            break;

        case 'setMaintenanceMode':
            if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
                respondJson(['error' => 'Use POST para setMaintenanceMode'], 405);
                exit;
            }

            $request = readRequestPayload();
            if (isset($request['__json_error'])) {
                respondJson(['error' => 'JSON invalido: ' . $request['__json_error']], 400);
                exit;
            }

            try {
                respondJson(setMaintenanceModeHandler($CONFIG, $request));
            } catch (InvalidArgumentException $e) {
                respondJson(['error' => $e->getMessage()], 400);
            } catch (Exception $e) {
                respondJson(['error' => $e->getMessage()], 500);
            }
            break;

        case 'startServer':
        case 'stopServer':
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
                $result = handleServerPowerRequest($CONFIG, $action === 'startServer' ? 'start' : 'stop', $request);
                respondJson($result, !empty($result['success']) ? 200 : 500);
            } catch (InvalidArgumentException $e) {
                respondJson(['error' => $e->getMessage()], 400);
            } catch (Exception $e) {
                respondJson(['error' => $e->getMessage()], 500);
            }
            break;

        case 'restartServer':
            if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
                respondJson(['error' => 'Use POST para restartServer'], 405);
                exit;
            }

            $request = readRequestPayload();
            if (isset($request['__json_error'])) {
                respondJson(['error' => 'JSON invalido: ' . $request['__json_error']], 400);
                exit;
            }

            try {
                $result = handleRestartServerRequest($CONFIG, $request);
                respondJson($result, !empty($result['success']) ? 200 : 500);
            } catch (InvalidArgumentException $e) {
                respondJson(['error' => $e->getMessage()], 400);
            } catch (Exception $e) {
                respondJson(['error' => $e->getMessage()], 500);
            }
            break;

        case 'startService':
        case 'stopService':
        case 'restartService':
            if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
                respondJson(['error' => 'Use POST para ' . $action], 405);
                exit;
            }

            $request = readRequestPayload();
            if (isset($request['__json_error'])) {
                respondJson(['error' => 'JSON invalido: ' . $request['__json_error']], 400);
                exit;
            }

            $serviceAction = $action === 'startService'
                ? 'start'
                : ($action === 'stopService' ? 'stop' : 'restart');

            try {
                $result = handleServiceOperationRequest($CONFIG, $serviceAction, $request);
                respondJson($result, !empty($result['success']) ? 200 : 500);
            } catch (InvalidArgumentException $e) {
                respondJson(['error' => $e->getMessage()], 400);
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
            break;

        default:
            respondJson([
                'error' => 'Acao invalida. Use: getRole, getRoles, getRoleEditable, getRolesEditable, getClasses, getClsconfig, getClsconfigDebug, getItemCatalog, getServiceStatus, getManageableServices, getManageableInstances, setInstanceAutoStart, startInstance, startInstances, stopInstance, stopInstances, restartInstance, restartInstances, getServerOperationStatus, getServerOperationsHistory, getServerLogs, sendSystemMessage, getMaintenanceMode, setMaintenanceMode, startServer, stopServer, restartServer, startService, stopService, restartService, sendMailItem, sendMailGold, kickRole, banAccount, unbanAccount, listBackups, backupGamedbd, getBackupContent, restoreBackup, exportClsconfig, saveRoleEditable, saveClsconfigTemplate',
            ], 400);
            break;
    }

    exit;
}
