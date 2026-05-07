<?php
/**
 * API CLS - busca templates da clsconfig e dados completos de personagem via gamedbd.
 * Desenvolvida Por: Sath~
 * Uso HTTP:
 *   GET /apicls/api_cls.php?action=getClsconfig&secret=SEU_SECRET
 *   GET /apicls/api_cls.php?action=getRoleEditable&roleid=12345&secret=SEU_SECRET
 *   GET /apicls/api_cls.php?action=getRolesEditable&roleids=123,456&secret=SEU_SECRET
 *   POST /apicls/api_cls.php?action=exportClsconfig&secret=SEU_SECRET
 *   POST /apicls/api_cls.php?action=saveClsconfigTemplate&roleid=12345&secret=SEU_SECRET
 *   POST /apicls/api_cls.php?action=sendMailItem&secret=SEU_SECRET
 *   POST /apicls/api_cls.php?action=sendMailGold&secret=SEU_SECRET
 *   POST /apicls/api_cls.php?action=grantMallCash&secret=SEU_SECRET
 *   GET  /apicls/api_cls.php?action=getMallCashBalance&secret=SEU_SECRET
 *   POST /apicls/api_cls.php?action=sendSystemMessage&secret=SEU_SECRET
 *   GET  /apicls/api_cls.php?action=getGmCommandCatalog&secret=SEU_SECRET
 *   GET  /apicls/api_cls.php?action=getGmActionHistory&secret=SEU_SECRET
 *   GET  /apicls/api_cls.php?action=getGmPermissionCatalog&secret=SEU_SECRET
 *   GET  /apicls/api_cls.php?action=getGmPermissionState&secret=SEU_SECRET
 *   GET  /apicls/api_cls.php?action=getMaintenanceMode&secret=SEU_SECRET
 *   GET  /apicls/api_cls.php?action=getManageableServices&secret=SEU_SECRET
 *   GET  /apicls/api_cls.php?action=getManageableInstances&secret=SEU_SECRET
 *   GET  /apicls/api_cls.php?action=getControlCenterSnapshot&secret=SEU_SECRET
 *   GET  /apicls/api_cls.php?action=getServerOperationStatus&secret=SEU_SECRET
 *   GET  /apicls/api_cls.php?action=getServerOperationsHistory&secret=SEU_SECRET
 *   GET  /apicls/api_cls.php?action=getWatchdogStatus&secret=SEU_SECRET
 *   GET  /apicls/api_cls.php?action=getWatchdogHistory&secret=SEU_SECRET
 *   POST /apicls/api_cls.php?action=setMaintenanceMode&secret=SEU_SECRET
 *   POST /apicls/api_cls.php?action=saveWatchdogConfig&secret=SEU_SECRET
 *   POST /apicls/api_cls.php?action=enableWatchdog&secret=SEU_SECRET
 *   POST /apicls/api_cls.php?action=disableWatchdog&secret=SEU_SECRET
 *   POST /apicls/api_cls.php?action=runWatchdogCheckNow&secret=SEU_SECRET
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
 *   POST /apicls/api_cls.php?action=muteAccount&secret=SEU_SECRET
 *   POST /apicls/api_cls.php?action=muteRole&secret=SEU_SECRET
 *   POST /apicls/api_cls.php?action=grantGmPermission&secret=SEU_SECRET
 *   POST /apicls/api_cls.php?action=revokeGmPermission&secret=SEU_SECRET
 *   POST /apicls/api_cls.php?action=teleportRole&secret=SEU_SECRET
 *   POST /apicls/api_cls.php?action=backupNow&secret=SEU_SECRET
 *   GET  /apicls/api_cls.php?action=getBackupContent&name=roleid-...json&secret=SEU_SECRET
 *   GET  /apicls/api_cls.php?action=getRestorePlan&name=backup.ext&secret=SEU_SECRET
 *   GET  /apicls/api_cls.php?action=getRestoreHistory&secret=SEU_SECRET
 *   POST /apicls/api_cls.php?action=restoreNow&secret=SEU_SECRET
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
    'clsconfig_archive_backup_enabled' => true,
    'clsconfig_archive_backup_command' => '/usr/bin/sudo -n /usr/local/sbin/backupclsconfig-api.sh',
    'clsconfig_archive_backup_dir' => __DIR__ . '/backups/clsconfig/archives',
    'gamedbd_backup_enabled' => true,
    'gamedbd_backup_required' => true,
    'gamedbd_backup_command' => '/usr/bin/sudo -n /usr/local/sbin/backupgamedbd-api.sh',
    'gamedbd_backup_dir' => __DIR__ . '/backups/gamedbd',
    'gamedbd_backup_min_interval_seconds' => 300,
    'mysql_backup_enabled' => true,
    'mysql_backup_command' => '/usr/bin/sudo -n /usr/local/sbin/backupmysql-api.sh',
    'mysql_backup_dir' => __DIR__ . '/backups/mysql',
    'mysql_restore_command' => '/usr/bin/sudo -n /usr/local/sbin/restoremysql-api.sh',
    'mall_cash_enabled' => true,
    'mall_cash_grant_command' => '/usr/bin/sudo -n /usr/local/sbin/grantmallcash-api.sh',
    'mall_cash_db_name' => 'pw',
    'mall_cash_units_per_gold' => 100,
    'mall_cash_max_amount' => 1000000,
    'mall_cash_max_cash_units' => 100000000,
    'mall_cash_verify_timeout_seconds' => 6,
    'mall_cash_verify_poll_interval_us' => 250000,
    'gm_permission_enabled' => true,
    'gm_permission_command' => '/usr/bin/sudo -n /usr/local/sbin/gmpermission-api.sh',
    'gm_permission_db_name' => 'pw',
    'gm_permission_auth_table' => 'auth',
    'gm_permission_auth_userid_field' => 'userid',
    'gm_permission_auth_zoneid_field' => 'zoneid',
    'gm_permission_auth_rid_field' => 'rid',
    'gm_permission_zoneid' => 1,
    'gm_permission_rule_ids' => [],
    'gm_permission_template_min_rules' => 30,
    'security_account_forbid_mode' => 'auto',
    'security_account_forbid_command' => '/usr/bin/sudo -n /usr/local/sbin/accountforbid-api.sh',
    'security_account_forbid_db_name' => 'pw',
    'security_account_forbid_table' => 'forbid',
    'security_account_forbid_userid_field' => 'userid',
    'security_account_forbid_type_field' => 'type',
    'security_account_forbid_ctime_field' => 'ctime',
    'security_account_forbid_time_field' => 'forbid_time',
    'security_account_forbid_reason_field' => 'reason',
    'security_account_forbid_gmroleid_field' => 'gmroleid',
    'security_account_forbid_gmroleid' => 0,
    'security_account_forbid_types' => [0],
    'uniquenamed_backup_enabled' => true,
    'uniquenamed_backup_command' => '/usr/bin/sudo -n /usr/local/sbin/backupuniquenamed-api.sh',
    'uniquenamed_backup_dir' => __DIR__ . '/backups/uniquenamed',
    'uniquenamed_restore_command' => '/usr/bin/sudo -n /usr/local/sbin/restoreuniquenamed-api.sh',
    'panel_backup_enabled' => true,
    'panel_backup_command' => '/usr/bin/sudo -n /usr/local/sbin/backuppanel-api.sh',
    'panel_backup_dir' => __DIR__ . '/backups/panel',
    'full_backup_enabled' => true,
    'full_backup_command' => '/usr/bin/sudo -n /usr/local/sbin/backupfull-api.sh',
    'full_backup_dir' => __DIR__ . '/backups/full',
    'backup_now_timeout_seconds' => 1800,
    'restore_now_timeout_seconds' => 1800,
    'gdeliveryd_ip' => '127.0.0.1',
    'gdeliveryd_port' => 29100,
    'mail_send_command' => '/usr/bin/sudo -n /usr/local/sbin/sendreward-api.sh',
    'gacd_ip' => '127.0.0.1',
    'gacd_port' => 29300,
    'gm_delivery_sid_default' => 0,
    'gm_history_file' => __DIR__ . '/backups/gm-actions/history.log',
    'system_message_enabled' => true,
    'system_message_default_channel' => 9,
    'system_message_max_length' => 200,
    'system_message_log_dir' => __DIR__ . '/backups/sysmsg-logs',
    'gm_v2_enabled' => true,
    'gm_v2_state_dir' => __DIR__ . '/backups/gm-commander-v2',
    'gm_v2_queue_jobs_dir' => __DIR__ . '/backups/gm-commander-v2/queue/jobs',
    'gm_v2_queue_attempts_dir' => __DIR__ . '/backups/gm-commander-v2/queue/attempts',
    'gm_v2_queue_logs_dir' => __DIR__ . '/backups/gm-commander-v2/queue/logs',
    'gm_v2_audit_file' => __DIR__ . '/backups/gm-commander-v2/audit/history.log',
    'gm_v2_queue_lock_file' => __DIR__ . '/backups/gm-commander-v2/queue/worker.lock',
    'gm_v2_schedules_dir' => __DIR__ . '/backups/gm-commander-v2/schedules/items',
    'gm_v2_schedule_logs_dir' => __DIR__ . '/backups/gm-commander-v2/schedules/logs',
    'gm_v2_schedule_lock_file' => __DIR__ . '/backups/gm-commander-v2/schedules/worker.lock',
    'gm_v2_directory_limit' => 200,
    'gm_v2_preview_sample_size' => 20,
    'gm_v2_max_targets_per_job' => 500,
    'gm_v2_queue_batch_size' => 10,
    'gm_v2_queue_retry_limit' => 3,
    'gm_v2_queue_backoff_seconds' => 30,
    'gm_v2_queue_scan_limit' => 20,
    'gm_v2_queue_allowed_commands' => ['sendMailItem', 'sendMailGold', 'grantMallCash', 'sendSystemMessage'],
    'gm_v2_schedule_allowed_commands' => ['sendMailItem', 'sendMailGold', 'grantMallCash'],
    'gm_v2_schedule_scan_limit' => 50,
    'gm_v2_schedule_retry_backoff_seconds' => 300,
    'gm_v2_schedule_default_timezone' => 'America/Sao_Paulo',
    'maintenance_reason_max_length' => 240,
    'maintenance_eta_max_minutes' => 1440,
    'maintenance_state_file' => __DIR__ . '/backups/maintenance/state.json',
    'maintenance_history_file' => __DIR__ . '/backups/maintenance/history.log',
    'watchdog_enabled_default' => false,
    'watchdog_config_file' => __DIR__ . '/backups/watchdog/config.json',
    'watchdog_state_file' => __DIR__ . '/backups/watchdog/state.json',
    'watchdog_history_file' => __DIR__ . '/backups/watchdog/history.log',
    'watchdog_lock_file' => __DIR__ . '/backups/watchdog/runner.lock',
    'watchdog_runner_script' => '/usr/local/sbin/pw-watchdog-runner.sh',
    'watchdog_cron_file' => '/etc/cron.d/apicls-watchdog',
    'watchdog_check_interval_seconds' => 60,
    'watchdog_failure_threshold' => 2,
    'watchdog_cooldown_seconds' => 300,
    'watchdog_max_restart_attempts' => 3,
    'watchdog_verify_restart' => true,
    'watchdog_pause_during_maintenance' => true,
    'watchdog_recent_history_limit' => 20,
    'watchdog_critical_services' => ['logservice', 'uniquenamed', 'authd', 'gamedbd', 'gacd', 'gfactiond', 'gdeliveryd', 'glinkd', 'gamed'],
    'restore_history_file' => __DIR__ . '/backups/restore/history.log',
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
    'control_center_disk_path' => '/',
    'control_center_ping_target' => '127.0.0.1',
    'control_center_ping_timeout_seconds' => 1,
    'control_center_cpu_sample_microseconds' => 200000,
    'control_center_recent_operations_limit' => 5,
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
    const OP_GET_USER            = 3002;
    const OP_GET_NEW_ROLE_DETAIL = 13013;
    const OP_SET_NEW_ROLE_DETAIL = 13014;
    const OP_PUT_ROLE_FORBID     = 3030;
    const OP_GET_ROLE_FORBID     = 3031;
    const OP_GET_ROLEID          = 3033;
    const OP_FORBID_ROLE         = 360;
    const OP_FORBID_ACC          = 5035;
    const OP_GET_PLAYER_ID_BY_NAME = 118;
    const OP_QUERY_USERID        = 8001;
    const OP_GM_ONLINE_NUM       = 350;
    const OP_GM_LIST_ONLINE_USER = 352;
    const OP_GET_USER_FACTION    = 4607;
    const OP_GET_FACTION_DETAIL  = 4608;

    private function normalizedConfiguredVersion()
    {
        $raw = strtolower(trim((string) array_value($GLOBALS['CONFIG'], 'game_version', '')));
        if ($raw !== '' && preg_match('/(\d+)/', $raw, $m)) {
            return $m[1];
        }
        return $raw;
    }

    private function gmDeliveryOpcodeMap()
    {
        $version = $this->normalizedConfiguredVersion();
        $map = [
            'muteAccount' => 0,
            'muteRole' => 0,
            'teleportRole' => 0,
        ];

        if (in_array($version, ['101', '155'], true)) {
            $map['muteAccount'] = 362;
            $map['muteRole'] = 356;
        } elseif ($version === '352') {
            $map['muteAccount'] = 356;
            $map['muteRole'] = 362;
            $map['teleportRole'] = 13010;
        }

        return $map;
    }

    private function gmDeliveryOpcode($action)
    {
        $action = trim((string) $action);
        $map = $this->gmDeliveryOpcodeMap();
        $opcode = intval(array_value($map, $action, 0));
        if ($opcode <= 0) {
            throw new Exception('Acao GM nao suportada para game_version ' . $this->normalizedConfiguredVersion() . ': ' . $action);
        }
        return $opcode;
    }

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

    private $struct_new_role_detail = [
        'roleid' => 'int',
        'pk_time' => 'int',
        'pk_status' => 'int',
        'money_silver' => 'int',
        'color_name' => 'int',
        'pvp_rank' => 'int',
        'pvp_rank_exp' => 'int',
        'player_kill' => 'int',
        'monster_kill' => 'int',
        'player_death' => 'int',
        'monster_death' => 'int',
        'diary_exp' => 'int',
        'realm_day_verify' => 'int',
        'verify_itens_valid' => 'int',
        'has_astrolabe_lock' => 'byte',
        'enabled_fashion_weapon' => 'byte',
        'double_factor_exp' => 'byte',
        'double_factor_sp' => 'byte',
        'double_factor_realm' => 'byte',
        'autoswap' => 'octets',
        'skillsender' => 'octets',
        'glyph' => 'octets',
        'carrier' => 'octets',
        'repository' => 'octets',
        'treasure' => 'octets',
        'lottery' => 'octets',
        'treasure_items' => 'octets',
        'lib_items' => 'octets',
        'pet_skill_temp' => 'octets',
        'pet_skin' => 'octets',
        'passwd_safe' => 'octets',
        'day_world_points' => 'octets',
        'activity' => 'octets',
        'celestial' => 'octets',
        'question_data' => 'octets',
        'speak_cost' => 'octets',
        'rank_pvp' => 'octets',
        'person_data' => 'octets',
        'get_old_values' => 'octets',
        'codex' => 'octets',
        'reserve6' => 'octets',
        'reserve7' => 'octets',
        'reserve8' => 'octets',
        'reserve9' => 'octets',
        'first_new_db_login' => 'int',
        'reserve11' => 'int',
        'reserve12' => 'int',
        'reserve13' => 'int',
        'reserve14' => 'int',
        'reserve15' => 'int',
        'reserve16' => 'int',
        'reserve17' => 'int',
        'reserve18' => 'int',
        'reserve19' => 'int',
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

    private $struct_role_forbid_table = [
        'forbidcount' => 'cuint',
        'forbid' => [
            'type' => 'byte',
            'time' => 'int',
            'createtime' => 'int',
            'reason' => 'octets',
        ],
    ];

    private $struct_user_info = [
        'logicuid' => 'int',
        'rolelist' => 'int',
        'cash' => 'int',
        'money' => 'int',
        'cash_add' => 'int',
        'cash_buy' => 'int',
        'cash_sell' => 'int',
        'cash_used' => 'int',
        'add_serial' => 'int',
        'use_serial' => 'int',
        'exp_logcount' => 'cuint',
        'exg_log' => [
            'tid' => 'int',
            'time' => 'int',
            'result' => 'short',
            'volume' => 'short',
            'cost' => 'int',
        ],
        'addiction' => 'octets',
        'cash_password' => 'octets',
        'autolockcount' => 'cuint',
        'autolock' => [
            'key' => 'int',
            'value' => 'int',
        ],
        'status' => 'byte',
        'forbidcount' => 'cuint',
        'forbid' => [
            'type' => 'byte',
            'time' => 'int',
            'createtime' => 'int',
            'reason' => 'name',
        ],
        'reference' => 'octets',
        'consume_reward' => 'octets',
        'taskcounter' => 'octets',
        'cash_sysauction' => 'octets',
        'login_record' => 'octets',
        'mall_consumption' => 'octets',
        'reserved32' => 'short',
    ];

    private $struct_query_userid_response = [
        'result' => 'int',
        'userid' => 'int',
        'roleid' => 'int',
        'level' => 'int',
    ];

    private $struct_get_player_id_by_name_response = [
        'retcode' => 'int',
        'localsid' => 'int',
        'rolename' => 'octets',
        'roleid' => 'int',
        'reason' => 'byte',
    ];

    private $struct_gm_player_info = [
        'userid' => 'int',
        'roleid' => 'int',
        'linkid' => 'int',
        'localsid' => 'int',
        'gsid' => 'int',
        'status' => 'byte',
        'name' => 'octets',
    ];

    private $struct_gm_online_num_response = [
        'gmroleid' => 'int',
        'localsid' => 'int',
        'total_num' => 'int',
        'local_num' => 'int',
    ];

    private $struct_gm_list_online_user_response = [
        'retcode' => 'int',
        'gmroleid' => 'int',
        'localsid' => 'int',
        'handler' => 'int',
        'userlistcount' => 'cuint',
        'userlist' => [
            'userid' => 'int',
            'roleid' => 'int',
            'linkid' => 'int',
            'localsid' => 'int',
            'gsid' => 'int',
            'status' => 'byte',
            'name' => 'octets',
        ],
    ];

    private $struct_legacy_role_list_response = [
        'localsid' => 'int',
        'handler' => 'int',
        'userscount' => 'cuint',
        'users' => [
            'userid' => 'int',
            'roleid' => 'int',
            'linkid' => 'int',
            'localsid' => 'int',
            'gsid' => 'int',
            'status' => 'byte',
            'name' => 'name',
        ],
    ];

    private $struct_user_faction = [
        'rid' => 'int',
        'name' => 'octets',
        'fid' => 'int',
        'cls' => 'byte',
        'role' => 'byte',
        'delayexpel' => 'octets',
        'extend' => 'octets',
        'nickname' => 'octets',
    ];

    private $struct_user_faction_response = [
        'retcode' => 'int',
        'value' => [
            'rid' => 'int',
            'name' => 'octets',
            'fid' => 'int',
            'cls' => 'byte',
            'role' => 'byte',
            'delayexpel' => 'octets',
            'extend' => 'octets',
            'nickname' => 'octets',
        ],
        'level' => 'int',
        'contrib' => 'int',
        'reputation' => 'int',
        'reincarn_times' => 'byte',
        'gender' => 'byte',
    ];

    private $struct_faction_detail_response = [
        'fid' => 'int',
        'name' => 'octets',
        'level' => 'byte',
        'master' => 'int',
        'announce' => 'name',
        'sysinfo' => 'octets',
        'membercount' => 'cuint',
        'member' => [
            'roleid' => 'int',
            'level' => 'byte',
            'occupation' => 'byte',
            'froleid' => 'byte',
            'login_day' => 'short',
            'online_status' => 'byte',
            'name' => 'name',
            'nickname' => 'name',
            'contrib' => 'int',
            'delayexpel' => 'byte',
            'expeltime' => 'int',
        ],
        'last_op_time' => 'int',
        'alliancecount' => 'cuint',
        'alliance' => [
            'fid' => 'int',
            'end_time' => 'int',
        ],
        'hostilecount' => 'cuint',
        'hostile' => [
            'fid' => 'int',
            'end_time' => 'int',
        ],
        'applycount' => 'cuint',
        'apply' => [
            'type' => 'int',
            'fid' => 'int',
            'end_time' => 'int',
        ],
    ];

    private $struct_faction_detail_wrapped_response = [
        'retcode' => 'int',
        'value' => [
            'fid' => 'int',
            'name' => 'octets',
            'level' => 'byte',
            'master' => 'int',
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

    public function packLInt($data)
    {
        return pack('V', intval($data));
    }

    public function packLShort($data)
    {
        return pack('v', intval($data));
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

    public function deleteProtocolHeader($data)
    {
        $offset = 0;
        $this->unpackCuint($data, $offset);
        $this->unpackCuint($data, $offset);
        return substr($data, $offset);
    }

    public function deleteProtocolHeaderWithSession($data)
    {
        $offset = 0;
        $this->unpackCuint($data, $offset);
        $this->unpackCuint($data, $offset);
        $offset += 8;
        return substr($data, $offset);
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
        $wire = $this->sendToDeliveryRaw($data, $ip, $port);

        return [
            'hello_len' => intval(array_value($wire, 'hello_len', 0)),
            'sent_bytes' => intval(array_value($wire, 'sent_bytes', 0)),
            'response_hex' => (string) array_value($wire, 'response_hex', ''),
            'response_len' => intval(array_value($wire, 'response_len', 0)),
        ];
    }

    public function sendToDeliveryRaw($data, $ip, $port)
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
        $header = '';
        @socket_recv($sock, $header, 8, PHP_BINARY_READ);
        if (is_string($header) && $header !== '') {
            $response = $header;
            $tmpIdx = 0;
            $opcode = $this->unpackCuint($response, $tmpIdx);
            $length = $this->unpackCuint($response, $tmpIdx);
            $expected = max($tmpIdx, 0) + max(intval($length), 0);

            while (strlen($response) < $expected) {
                $missing = $expected - strlen($response);
                $chunk = '';
                @socket_recv($sock, $chunk, $missing, PHP_BINARY_READ);
                if (!is_string($chunk) || $chunk === '') {
                    break;
                }
                $response .= $chunk;
            }
        }

        socket_close($sock);
        fclose($fp);

        return [
            'hello' => $hello,
            'hello_len' => strlen($hello),
            'sent_bytes' => intval($sentBytes),
            'response' => $response,
            'response_hex' => ($response !== '') ? bin2hex($response) : '',
            'response_len' => strlen($response),
        ];
    }

    public function sendToDeliveryRawLegacyCompat($data, $ip, $port)
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
            throw new Exception('Falha ao enviar pacote legacy para gdeliveryd: ' . $err);
        }

        $buf = '';
        $chunk = @socket_read($sock, 1024, PHP_BINARY_READ);
        if (is_string($chunk) && $chunk !== '') {
            $buf .= $chunk;
            if (strlen($buf) >= 8) {
                $tmpIdx = 0;
                $this->unpackCuint($buf, $tmpIdx);
                $length = $this->unpackCuint($buf, $tmpIdx);
                while (strlen($buf) < intval($length)) {
                    $more = @socket_read($sock, 1024, PHP_BINARY_READ);
                    if (!is_string($more) || $more === '') {
                        break;
                    }
                    $buf .= $more;
                }
            }
        }

        socket_close($sock);
        fclose($fp);

        return [
            'hello' => $hello,
            'hello_len' => strlen($hello),
            'sent_bytes' => intval($sentBytes),
            'response' => $buf,
            'response_hex' => ($buf !== '') ? bin2hex($buf) : '',
            'response_len' => strlen($buf),
            'legacy_compat' => true,
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

    public function muteAccount($sid, $userid, $seconds, $reason, $ip, $port)
    {
        $pack = pack('N*', -1, intval($sid), intval($userid), intval($seconds)) . $this->packString((string) $reason);
        return $this->sendToDelivery($this->createHeader($this->gmDeliveryOpcode('muteAccount'), $pack), $ip, $port);
    }

    public function muteRole($sid, $roleid, $seconds, $reason, $ip, $port)
    {
        $pack = pack('N*', -1, intval($sid), intval($roleid), intval($seconds)) . $this->packString((string) $reason);
        return $this->sendToDelivery($this->createHeader($this->gmDeliveryOpcode('muteRole'), $pack), $ip, $port);
    }

    public function playerTeleport($roleid, $worldtag, $x, $y, $z, $ip, $port)
    {
        $pack = pack('NNf*', intval($roleid), intval($worldtag), floatval($x), floatval($y), floatval($z));
        return $this->sendToDelivery($this->createHeader($this->gmDeliveryOpcode('teleportRole'), $pack), $ip, $port);
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

        $current = $this->getEditableRole($roleid, $ip, $port);
        if (!is_array($current)) {
            throw new Exception('Nao foi possivel ler role completo para o roleid ' . $roleid);
        }

        $before = array_value(array_value($current, 'base', []), 'forbid', []);
        $before = is_array($before) ? array_values($before) : [];

        $prepared = $this->prepareEditableRoleForSave($roleid, [
            'base' => [
                'forbid' => [],
            ],
        ], $ip, $port, $current);
        $prepared['base']['forbid'] = [];
        $this->putPreparedRoleSections($roleid, $prepared, $ip, $port);

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

    public function clearRoleForbidTypes($roleid, array $types, $ip, $port)
    {
        $roleid = intval($roleid);
        if ($roleid <= 0) {
            throw new Exception('roleid invalido para limpeza seletiva de forbid');
        }

        $normalizedTypes = [];
        foreach ($types as $type) {
            $type = intval($type);
            if ($type >= 0) {
                $normalizedTypes[] = $type;
            }
        }
        $normalizedTypes = array_values(array_unique($normalizedTypes));
        if (empty($normalizedTypes)) {
            throw new Exception('nenhum tipo de forbid informado para limpeza seletiva');
        }

        $current = $this->getEditableRole($roleid, $ip, $port);
        if (!is_array($current)) {
            throw new Exception('Nao foi possivel ler role completo para o roleid ' . $roleid);
        }

        $before = array_value(array_value($current, 'base', []), 'forbid', []);
        $before = is_array($before) ? array_values($before) : [];
        $afterWanted = [];
        $removed = [];
        foreach ($before as $entry) {
            $entryType = intval(array_value($entry, 'type', -1));
            if (in_array($entryType, $normalizedTypes, true)) {
                $removed[] = $entry;
                continue;
            }
            $afterWanted[] = $entry;
        }

        if (count($removed) === 0) {
            return [
                'roleid' => $roleid,
                'types' => $normalizedTypes,
                'before' => $before,
                'after' => $before,
                'removed' => [],
                'removed_count' => 0,
                'cleared' => true,
                'changed' => false,
            ];
        }

        $prepared = $this->prepareEditableRoleForSave($roleid, [
            'base' => [
                'forbid' => $afterWanted,
            ],
        ], $ip, $port, $current);
        $prepared['base']['forbid'] = $afterWanted;
        $this->putPreparedRoleSections($roleid, $prepared, $ip, $port);

        $fresh = $this->getRoleBase($roleid, $ip, $port);
        $after = is_array($fresh) ? array_value($fresh, 'forbid', []) : [];
        $after = is_array($after) ? array_values($after) : [];

        $remainingTypes = array_map(function ($entry) {
            return intval(array_value($entry, 'type', -1));
        }, $after);
        $remainingTypes = array_values(array_unique($remainingTypes));
        $stillPresent = array_values(array_intersect($normalizedTypes, $remainingTypes));

        return [
            'roleid' => $roleid,
            'types' => $normalizedTypes,
            'before' => $before,
            'after' => $after,
            'removed' => $removed,
            'removed_count' => count($removed),
            'cleared' => empty($stillPresent),
            'changed' => true,
        ];
    }

    private function normalizeRoleForbidTableEntries($entries)
    {
        if (is_array($entries) && isset($entries['type'])) {
            $entries = [$entries];
        }
        $entries = is_array($entries) ? array_values($entries) : [];
        $normalized = [];
        foreach ($entries as $entry) {
            if (!is_array($entry)) {
                continue;
            }
            $normalized[] = $this->sanitizeFields($entry, [
                'type' => 'int',
                'time' => 'int',
                'createtime' => 'int',
                'reason' => 'hex',
            ]);
        }
        return $normalized;
    }

    public function getRoleForbidTable($roleid, $ip, $port)
    {
        $roleid = intval($roleid);
        if ($roleid <= 0) {
            throw new Exception('roleid invalido para getRoleForbidTable');
        }

        $pack = pack('N*', -1, $roleid);
        $send = $this->sendToGamedBD($this->createHeader(self::OP_GET_ROLE_FORBID, $pack), $ip, $port);
        $data = $this->deleteHeader($send);
        $this->cycle = false;

        $wrappedBuffer = $data;
        $wrapped = $this->unmarshal($wrappedBuffer, [
            'retcode' => 'int',
            'value' => $this->struct_role_forbid_table,
        ]);
        if (is_array($wrapped) && intval(array_value($wrapped, 'retcode', -1)) === 0) {
            return $this->normalizeRoleForbidTableEntries(array_value(array_value($wrapped, 'value', []), 'forbid', []));
        }

        $directBuffer = $data;
        $direct = $this->unmarshal($directBuffer, $this->struct_role_forbid_table);
        if (is_array($direct)) {
            return $this->normalizeRoleForbidTableEntries(array_value($direct, 'forbid', []));
        }

        throw new Exception('Falha ao interpretar GetRoleForbid');
    }

    public function putRoleForbidTable($roleid, array $forbid, $ip, $port)
    {
        $roleid = intval($roleid);
        if ($roleid <= 0) {
            throw new Exception('roleid invalido para putRoleForbidTable');
        }

        $forbid = $this->normalizeRoleForbidTableEntries($forbid);
        $pack = pack('N*', -1, $roleid) . $this->marshal([
            'forbid' => $forbid,
        ], $this->struct_role_forbid_table);
        $send = $this->sendToGamedBD($this->createHeader(self::OP_PUT_ROLE_FORBID, $pack), $ip, $port);
        $data = $this->deleteHeader($send);
        $this->cycle = false;
        $decoded = $this->unmarshal($data, [
            'retcode' => 'int',
        ]);
        if (!is_array($decoded)) {
            throw new Exception('Falha ao interpretar PutRoleForbid');
        }
        if (intval(array_value($decoded, 'retcode', -1)) !== 0) {
            throw new Exception('PutRoleForbid retornou retcode ' . intval(array_value($decoded, 'retcode', -1)));
        }

        return [
            'success' => true,
            'roleid' => $roleid,
            'retcode' => 0,
            'forbid' => $forbid,
        ];
    }

    public function clearRoleForbidTableTypes($roleid, array $types, $ip, $port)
    {
        $roleid = intval($roleid);
        if ($roleid <= 0) {
            throw new Exception('roleid invalido para limpeza seletiva de GetRoleForbid');
        }

        $normalizedTypes = [];
        foreach ($types as $type) {
            $type = intval($type);
            if ($type >= 0) {
                $normalizedTypes[] = $type;
            }
        }
        $normalizedTypes = array_values(array_unique($normalizedTypes));
        if (empty($normalizedTypes)) {
            throw new Exception('nenhum tipo informado para limpeza seletiva de GetRoleForbid');
        }

        $before = $this->getRoleForbidTable($roleid, $ip, $port);
        $afterWanted = [];
        $removed = [];
        foreach ($before as $entry) {
            $entryType = intval(array_value($entry, 'type', -1));
            if (in_array($entryType, $normalizedTypes, true)) {
                $removed[] = $entry;
                continue;
            }
            $afterWanted[] = $entry;
        }

        if (count($removed) === 0) {
            return [
                'roleid' => $roleid,
                'types' => $normalizedTypes,
                'before' => $before,
                'after' => $before,
                'removed' => [],
                'removed_count' => 0,
                'cleared' => true,
                'changed' => false,
            ];
        }

        $this->putRoleForbidTable($roleid, $afterWanted, $ip, $port);
        $after = $this->getRoleForbidTable($roleid, $ip, $port);
        $remainingTypes = array_map(function ($entry) {
            return intval(array_value($entry, 'type', -1));
        }, $after);
        $remainingTypes = array_values(array_unique($remainingTypes));
        $stillPresent = array_values(array_intersect($normalizedTypes, $remainingTypes));

        return [
            'roleid' => $roleid,
            'types' => $normalizedTypes,
            'before' => $before,
            'after' => $after,
            'removed' => $removed,
            'removed_count' => count($removed),
            'cleared' => empty($stillPresent),
            'changed' => true,
        ];
    }

    private function extractNewRoleDetailPkState(array $detail)
    {
        return [
            'roleid' => intval(array_value($detail, 'roleid', 0)),
            'pk_time' => intval(array_value($detail, 'pk_time', 0)),
            'pk_status' => intval(array_value($detail, 'pk_status', 0)),
            'color_name' => intval(array_value($detail, 'color_name', 0)),
            'player_kill' => intval(array_value($detail, 'player_kill', 0)),
            'player_death' => intval(array_value($detail, 'player_death', 0)),
        ];
    }

    public function inspectRolePkState($roleid, $ip, $port)
    {
        $roleid = intval($roleid);
        if ($roleid <= 0) {
            throw new Exception('roleid invalido para leitura de PK');
        }

        $editable = $this->getEditableRole($roleid, $ip, $port);
        if (!is_array($editable)) {
            throw new Exception('Nao foi possivel ler role completo para o roleid ' . $roleid);
        }

        $newRoleDetail = null;
        try {
            $newRoleDetail = $this->getNewRoleDetail($roleid, $ip, $port);
        } catch (Exception $e) {
            $newRoleDetail = null;
        }

        $roleForbidTable = null;
        try {
            $roleForbidTable = $this->getRoleForbidTable($roleid, $ip, $port);
        } catch (Exception $e) {
            $roleForbidTable = null;
        }

        return $this->extractRolePkState($roleid, $editable, $newRoleDetail, $roleForbidTable);
    }

    private function extractRolePkState($roleid, array $editable, $newRoleDetail = null, $roleForbidTable = null)
    {
        $base = array_value($editable, 'base', []);
        $status = array_value($editable, 'status', []);
        $decoded = array_value($status, 'decoded', []);
        if (!is_array($decoded) || empty($decoded)) {
            $decoded = $this->decodeStatusOctets(is_array($status) ? $status : []);
        }

        $varData = array_value($decoded, 'var_data', null);
        if (!is_array($varData)) {
            $varData = $this->decodeHexStruct(array_value($status, 'var_data', ''), $this->struct_octets['var_data']);
        }

        $pkCount = is_array($varData) ? intval(array_value($varData, 'pk_count', 0)) : null;
        $roleForbid = is_array($base) ? array_value($base, 'forbid', []) : [];
        $roleForbid = is_array($roleForbid) ? array_values($roleForbid) : [];
        $roleForbidTable = $this->normalizeRoleForbidTableEntries($roleForbidTable);
        $state = [
            'roleid' => intval($roleid),
            'pk_count' => $pkCount,
            'invader_state' => intval(array_value($status, 'invader_state', 0)),
            'invader_time' => intval(array_value($status, 'invader_time', 0)),
            'pariah_time' => intval(array_value($status, 'pariah_time', 0)),
            'var_data_available' => is_array($varData),
            'role_forbid_count' => count($roleForbid),
            'role_forbid_table_count' => count($roleForbidTable),
            'custom_status_hex' => strtoupper((string) array_value($status, 'custom_status', '')),
            'filter_data_hex' => strtoupper((string) array_value($status, 'filter_data', '')),
            'charactermode_hex' => strtoupper((string) array_value($status, 'charactermode', '')),
        ];
        if (is_array($newRoleDetail) && !empty($newRoleDetail)) {
            $detailState = $this->extractNewRoleDetailPkState($newRoleDetail);
            $state['new_role_detail_available'] = true;
            $state['new_pk_time'] = intval(array_value($detailState, 'pk_time', 0));
            $state['new_pk_status'] = intval(array_value($detailState, 'pk_status', 0));
            $state['new_color_name'] = intval(array_value($detailState, 'color_name', 0));
            $state['new_player_kill'] = intval(array_value($detailState, 'player_kill', 0));
            $state['new_player_death'] = intval(array_value($detailState, 'player_death', 0));
        } else {
            $state['new_role_detail_available'] = false;
        }
        $state['cleared'] = $state['pk_count'] === 0
            && $state['invader_state'] === 0
            && $state['invader_time'] === 0
            && $state['pariah_time'] === 0
            && (!array_key_exists('new_pk_time', $state) || intval($state['new_pk_time']) === 0)
            && (!array_key_exists('new_pk_status', $state) || intval($state['new_pk_status']) === 0);

        return [
            'state' => $state,
            'var_data' => is_array($varData) ? $varData : null,
            'role_forbid' => $roleForbid,
            'role_forbid_table' => $roleForbidTable,
            'new_role_detail' => is_array($newRoleDetail) ? $newRoleDetail : null,
        ];
    }

    public function clearRolePk($roleid, $ip, $port)
    {
        $roleid = intval($roleid);
        if ($roleid <= 0) {
            throw new Exception('roleid invalido para limpeza de PK');
        }

        $current = $this->getEditableRole($roleid, $ip, $port);
        if (!is_array($current)) {
            throw new Exception('Nao foi possivel ler role completo para o roleid ' . $roleid);
        }

        $newRoleDetailBefore = null;
        $newRoleDetailError = '';
        try {
            $newRoleDetailBefore = $this->getNewRoleDetail($roleid, $ip, $port);
        } catch (Exception $e) {
            $newRoleDetailBefore = null;
            $newRoleDetailError = $e->getMessage();
        }

        $roleForbidTableBefore = null;
        $roleForbidTableBeforeError = '';
        try {
            $roleForbidTableBefore = $this->getRoleForbidTable($roleid, $ip, $port);
        } catch (Exception $e) {
            $roleForbidTableBefore = null;
            $roleForbidTableBeforeError = $e->getMessage();
        }

        $beforeBundle = $this->extractRolePkState($roleid, $current, $newRoleDetailBefore, $roleForbidTableBefore);
        $before = array_value($beforeBundle, 'state', []);
        $varData = array_value($beforeBundle, 'var_data', null);
        if (!is_array($varData)) {
            throw new Exception('Nao foi possivel decodificar status.var_data para limpar PK do roleid ' . $roleid);
        }

        $varData['pk_count'] = 0;
        $payload = [
            'status' => [
                'invader_state' => 0,
                'invader_time' => 0,
                'pariah_time' => 0,
                'var_data' => $this->encodeHexStruct($varData, $this->struct_octets['var_data']),
            ],
        ];
        $prepared = $this->prepareEditableRoleForSave($roleid, $payload, $ip, $port, $current);

        try {
            $this->putPreparedRoleSections($roleid, $prepared, $ip, $port);
            if (is_array($newRoleDetailBefore)) {
                $newRoleDetailPayload = $newRoleDetailBefore;
                $newRoleDetailPayload['pk_time'] = 0;
                $newRoleDetailPayload['pk_status'] = 0;
                $this->putNewRoleDetail($roleid, $newRoleDetailPayload, $ip, $port);
            }
        } catch (Exception $e) {
            $rollbackMessage = 'rollback nao executado';
            try {
                $rollbackPrepared = $this->prepareEditableRoleForSave($roleid, $current, $ip, $port, $current);
                $this->putPreparedRoleSections($roleid, $rollbackPrepared, $ip, $port);
                $rollbackMessage = 'rollback automatico concluido';
            } catch (Exception $rollbackError) {
                $rollbackMessage = 'rollback falhou: ' . $rollbackError->getMessage();
            }

            throw new Exception('Falha ao limpar PK do roleid ' . $roleid . ': ' . $e->getMessage() . ' (' . $rollbackMessage . ')');
        }

        $fresh = $this->getEditableRole($roleid, $ip, $port);
        if (!is_array($fresh)) {
            throw new Exception('PK limpo, mas nao foi possivel reler o roleid ' . $roleid . ' para confirmacao');
        }

        $newRoleDetailAfter = null;
        $newRoleDetailAfterError = '';
        try {
            $newRoleDetailAfter = $this->getNewRoleDetail($roleid, $ip, $port);
        } catch (Exception $e) {
            $newRoleDetailAfter = null;
            $newRoleDetailAfterError = $e->getMessage();
        }

        $roleForbidTableAfter = null;
        $roleForbidTableAfterError = '';
        try {
            $roleForbidTableAfter = $this->getRoleForbidTable($roleid, $ip, $port);
        } catch (Exception $e) {
            $roleForbidTableAfter = null;
            $roleForbidTableAfterError = $e->getMessage();
        }

        $afterBundle = $this->extractRolePkState($roleid, $fresh, $newRoleDetailAfter, $roleForbidTableAfter);
        $after = array_value($afterBundle, 'state', []);

        $response = [
            'roleid' => $roleid,
            'before' => $before,
            'after' => $after,
            'role_forbid_before' => array_value($beforeBundle, 'role_forbid', []),
            'role_forbid_after' => array_value($afterBundle, 'role_forbid', []),
            'role_forbid_table_before' => array_value($beforeBundle, 'role_forbid_table', []),
            'role_forbid_table_after' => array_value($afterBundle, 'role_forbid_table', []),
            'new_role_detail_before' => is_array($newRoleDetailBefore) ? $this->extractNewRoleDetailPkState($newRoleDetailBefore) : null,
            'new_role_detail_after' => is_array($newRoleDetailAfter) ? $this->extractNewRoleDetailPkState($newRoleDetailAfter) : null,
            'cleared' => truthyValue(array_value($after, 'cleared', false)),
            'changed' => intval(array_value($before, 'pk_count', 0)) !== intval(array_value($after, 'pk_count', 0))
                || intval(array_value($before, 'invader_state', 0)) !== intval(array_value($after, 'invader_state', 0))
                || intval(array_value($before, 'invader_time', 0)) !== intval(array_value($after, 'invader_time', 0))
                || intval(array_value($before, 'pariah_time', 0)) !== intval(array_value($after, 'pariah_time', 0))
                || intval(array_value($before, 'role_forbid_table_count', 0)) !== intval(array_value($after, 'role_forbid_table_count', 0))
                || intval(array_value($before, 'new_pk_time', 0)) !== intval(array_value($after, 'new_pk_time', 0))
                || intval(array_value($before, 'new_pk_status', 0)) !== intval(array_value($after, 'new_pk_status', 0)),
        ];

        if ($newRoleDetailError !== '') {
            $response['new_role_detail_before_error'] = $newRoleDetailError;
        }
        if ($newRoleDetailAfterError !== '') {
            $response['new_role_detail_after_error'] = $newRoleDetailAfterError;
        }
        if ($roleForbidTableBeforeError !== '') {
            $response['role_forbid_table_before_error'] = $roleForbidTableBeforeError;
        }
        if ($roleForbidTableAfterError !== '') {
            $response['role_forbid_table_after_error'] = $roleForbidTableAfterError;
        }

        return $response;
    }

    public function inspectRoleReviveState($roleid, $ip, $port)
    {
        $roleid = intval($roleid);
        if ($roleid <= 0) {
            throw new Exception('roleid invalido para leitura de revive');
        }

        $editable = $this->getEditableRole($roleid, $ip, $port);
        if (!is_array($editable)) {
            throw new Exception('Nao foi possivel ler role completo para o roleid ' . $roleid);
        }

        return $this->extractRoleReviveState($roleid, $editable);
    }

    private function extractRoleReviveState($roleid, array $editable)
    {
        $status = array_value($editable, 'status', []);
        $decoded = array_value($status, 'decoded', []);
        if (!is_array($decoded) || empty($decoded)) {
            $decoded = $this->decodeStatusOctets(is_array($status) ? $status : []);
        }

        $varData = array_value($decoded, 'var_data', null);
        if (!is_array($varData)) {
            $varData = $this->decodeHexStruct(array_value($status, 'var_data', ''), $this->struct_octets['var_data']);
        }

        $property = array_value($decoded, 'property', null);
        if (!is_array($property)) {
            $property = $this->decodeHexStruct(array_value($status, 'property', ''), $this->struct_octets['property']);
        }

        $deadFlag = is_array($varData) ? intval(array_value($varData, 'dead_flag', 0)) : null;
        $resurrectState = is_array($varData) ? intval(array_value($varData, 'resurrect_state', 0)) : null;
        $state = [
            'roleid' => intval($roleid),
            'hp' => intval(array_value($status, 'hp', 0)),
            'mp' => intval(array_value($status, 'mp', 0)),
            'property_hp' => is_array($property) ? intval(array_value($property, 'hp', 0)) : null,
            'property_mp' => is_array($property) ? intval(array_value($property, 'mp', 0)) : null,
            'dead_flag' => $deadFlag,
            'resurrect_state' => $resurrectState,
            'resurrect_exp_reduce' => is_array($varData) ? floatval(array_value($varData, 'resurrect_exp_reduce', 0)) : null,
            'resurrect_hp_factor' => is_array($varData) ? floatval(array_value($varData, 'resurrect_hp_factor', 0)) : null,
            'resurrect_mp_factor' => is_array($varData) ? floatval(array_value($varData, 'resurrect_mp_factor', 0)) : null,
            'var_data_available' => is_array($varData),
            'property_available' => is_array($property),
        ];
        $state['revivable'] = $state['hp'] <= 0
            || intval(array_value($state, 'dead_flag', 0)) > 0
            || intval(array_value($state, 'resurrect_state', 0)) > 0;
        $state['revived'] = $state['hp'] > 0
            && intval(array_value($state, 'dead_flag', 0)) === 0
            && intval(array_value($state, 'resurrect_state', 0)) === 0;

        return [
            'state' => $state,
            'var_data' => is_array($varData) ? $varData : null,
            'property' => is_array($property) ? $property : null,
        ];
    }

    public function reviveRole($roleid, $ip, $port)
    {
        $roleid = intval($roleid);
        if ($roleid <= 0) {
            throw new Exception('roleid invalido para revive');
        }

        $current = $this->getEditableRole($roleid, $ip, $port);
        if (!is_array($current)) {
            throw new Exception('Nao foi possivel ler role completo para o roleid ' . $roleid);
        }

        $beforeBundle = $this->extractRoleReviveState($roleid, $current);
        $before = array_value($beforeBundle, 'state', []);
        $varData = array_value($beforeBundle, 'var_data', null);
        if (!is_array($varData)) {
            throw new Exception('Nao foi possivel decodificar status.var_data para reviver o roleid ' . $roleid);
        }

        $persistedAlreadyAlive = truthyValue(array_value($before, 'revived', false));
        $targetHp = max(
            1,
            intval(array_value($before, 'hp', 0)),
            intval(array_value($before, 'property_hp', 0))
        );
        $targetMp = max(
            1,
            intval(array_value($before, 'mp', 0)),
            intval(array_value($before, 'property_mp', 0))
        );

        $varData['dead_flag'] = 0;
        $varData['resurrect_state'] = 0;
        $varData['resurrect_exp_reduce'] = 0.0;
        $varData['resurrect_hp_factor'] = 1.0;
        $varData['resurrect_mp_factor'] = 1.0;

        $payload = [
            'status' => [
                'hp' => $targetHp,
                'mp' => $targetMp,
                'var_data' => $this->encodeHexStruct($varData, $this->struct_octets['var_data']),
            ],
        ];
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

            throw new Exception('Falha ao reviver o roleid ' . $roleid . ': ' . $e->getMessage() . ' (' . $rollbackMessage . ')');
        }

        $fresh = $this->getEditableRole($roleid, $ip, $port);
        if (!is_array($fresh)) {
            throw new Exception('Role revivido, mas nao foi possivel reler o roleid ' . $roleid . ' para confirmacao');
        }

        $afterBundle = $this->extractRoleReviveState($roleid, $fresh);
        $after = array_value($afterBundle, 'state', []);

        return [
            'roleid' => $roleid,
            'before' => $before,
            'after' => $after,
            'revived' => truthyValue(array_value($after, 'revived', false)),
            'forced_write' => true,
            'persisted_state_already_alive' => $persistedAlreadyAlive,
            'changed' => intval(array_value($before, 'hp', 0)) !== intval(array_value($after, 'hp', 0))
                || intval(array_value($before, 'mp', 0)) !== intval(array_value($after, 'mp', 0))
                || intval(array_value($before, 'dead_flag', 0)) !== intval(array_value($after, 'dead_flag', 0))
                || intval(array_value($before, 'resurrect_state', 0)) !== intval(array_value($after, 'resurrect_state', 0)),
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

                case 'lint':
                    $data .= $this->packLInt(array_value($pack, $key, 0));
                    break;

                case 'lshort':
                    $data .= $this->packLShort(array_value($pack, $key, 0));
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

    public function getNewRoleDetail($roleid, $ip, $port)
    {
        $roleid = intval($roleid);
        if ($roleid <= 0) {
            throw new Exception('roleid invalido para getNewRoleDetail');
        }

        $pack = pack('N*', -1, $roleid);
        $send = $this->sendToGamedBD($this->createHeader(self::OP_GET_NEW_ROLE_DETAIL, $pack), $ip, $port);
        $data = $this->deleteHeader($send);
        $this->cycle = false;
        $decoded = $this->unmarshal($data, [
            'retcode' => 'int',
            'detail' => $this->struct_new_role_detail,
        ]);
        if (!is_array($decoded)) {
            throw new Exception('Falha ao interpretar GetNewRoleDetail');
        }
        if (intval(array_value($decoded, 'retcode', -1)) !== 0) {
            throw new Exception('GetNewRoleDetail retornou retcode ' . intval(array_value($decoded, 'retcode', -1)));
        }

        $detail = array_value($decoded, 'detail', []);
        if (!is_array($detail)) {
            throw new Exception('GetNewRoleDetail retornou detail invalido');
        }

        return $detail;
    }

    public function putNewRoleDetail($roleid, array $detail, $ip, $port)
    {
        $roleid = intval($roleid);
        if ($roleid <= 0) {
            throw new Exception('roleid invalido para putNewRoleDetail');
        }

        $detail['roleid'] = $roleid;
        $pack = pack('N*', -1, $roleid) . $this->marshal($detail, $this->struct_new_role_detail);
        $send = $this->sendToGamedBD($this->createHeader(self::OP_SET_NEW_ROLE_DETAIL, $pack), $ip, $port);
        $data = $this->deleteHeader($send);
        $this->cycle = false;
        $decoded = $this->unmarshal($data, [
            'retcode' => 'int',
        ]);
        if (!is_array($decoded)) {
            throw new Exception('Falha ao interpretar SetNewRoleDetail');
        }
        if (intval(array_value($decoded, 'retcode', -1)) !== 0) {
            throw new Exception('SetNewRoleDetail retornou retcode ' . intval(array_value($decoded, 'retcode', -1)));
        }

        return [
            'success' => true,
            'roleid' => $roleid,
            'retcode' => 0,
        ];
    }

    public function getUserInfo($userid, $ip, $port)
    {
        $userid = intval($userid);
        if ($userid <= 0) {
            throw new Exception('userid invalido para getUserInfo');
        }

        $pack = pack('N*', -1, $userid, 1, 1);
        $send = $this->sendToGamedBD($this->createHeader(self::OP_GET_USER, $pack), $ip, $port);

        $offset = 11;
        $flag = @unpack('H', substr($send, 2, 1));
        if (is_array($flag) && isset($flag[1]) && substr((string) $flag[1], 0, 1) === '8') {
            $offset = 12;
        }

        $data = substr($send, $offset);
        $this->cycle = false;
        $user = $this->unmarshal($data, $this->struct_user_info);
        if (!is_array($user)) {
            throw new Exception('Falha ao interpretar resposta user.info');
        }

        $loginRecord = strtolower((string) array_value($user, 'login_record', ''));
        if ($loginRecord !== '' && preg_match('/^[0-9a-f]+$/', $loginRecord) && strlen($loginRecord) >= 16) {
            $loginTime = hexdec(substr($loginRecord, 0, 8));
            $ipHex = substr($loginRecord, 8, 8);
            $user['login_time_unix'] = intval($loginTime);
            $user['login_time'] = ($loginTime > 0) ? gmdate('c', intval($loginTime)) : null;
            $user['login_ip'] = long2ip(hexdec(substr($ipHex, 6, 2) . substr($ipHex, 4, 2) . substr($ipHex, 2, 2) . substr($ipHex, 0, 2)));
        } else {
            $user['login_time_unix'] = 0;
            $user['login_time'] = null;
            $user['login_ip'] = '';
        }

        return $user;
    }

    public function queryUseridByRoleName($roleName, $ip, $port)
    {
        $roleName = trim((string) $roleName);
        if ($roleName === '') {
            throw new Exception('nome invalido para QueryUserid');
        }

        $pack = pack('N', 0xFFFFFFFF) . $this->packString($roleName);
        $send = $this->sendToGamedBD($this->createHeader(self::OP_QUERY_USERID, $pack), $ip, $port);
        $data = $this->deleteHeader($send);
        $this->cycle = false;
        $decoded = $this->unmarshal($data, $this->struct_query_userid_response);
        if (!is_array($decoded)) {
            throw new Exception('Falha ao interpretar QueryUserid');
        }

        $decoded['name'] = $roleName;
        $decoded['found'] = intval(array_value($decoded, 'userid', 0)) > 0 && intval(array_value($decoded, 'roleid', 0)) > 0;
        return $decoded;
    }

    public function getPlayerIdByName($roleName, $ip, $port, $localsid = 0, $reason = 0)
    {
        $roleName = trim((string) $roleName);
        if ($roleName === '') {
            throw new Exception('nome invalido para GetPlayerIDByName');
        }

        $pack = $this->packString($roleName)
            . pack('N', intval($localsid))
            . pack('C', intval($reason));
        $wire = $this->sendToDeliveryRaw($this->createHeader(self::OP_GET_PLAYER_ID_BY_NAME, $pack), $ip, $port);
        $response = (string) array_value($wire, 'response', '');
        if ($response === '') {
            throw new Exception('GetPlayerIDByName retornou resposta vazia');
        }

        $data = $this->deleteProtocolHeader($response);
        $this->cycle = false;
        $decoded = $this->unmarshal($data, $this->struct_get_player_id_by_name_response);
        if (!is_array($decoded)) {
            $data = $this->deleteProtocolHeaderWithSession($response);
            $this->cycle = false;
            $decoded = $this->unmarshal($data, $this->struct_get_player_id_by_name_response);
        }
        if (!is_array($decoded)) {
            throw new Exception('Falha ao interpretar GetPlayerIDByName');
        }

        $decoded['name_text'] = decode_octet_text((string) array_value($decoded, 'rolename', ''));
        $decoded['found'] = intval(array_value($decoded, 'retcode', -1)) === 0 && intval(array_value($decoded, 'roleid', 0)) > 0;
        $decoded['wire'] = [
            'hello_len' => intval(array_value($wire, 'hello_len', 0)),
            'sent_bytes' => intval(array_value($wire, 'sent_bytes', 0)),
            'response_hex' => (string) array_value($wire, 'response_hex', ''),
            'response_len' => intval(array_value($wire, 'response_len', 0)),
        ];
        return $decoded;
    }

    public function getRoleIdByName($roleName, $ip, $port)
    {
        $roleName = trim((string) $roleName);
        if ($roleName === '') {
            throw new Exception('nome invalido para getRoleid');
        }

        $pack = pack('N', 0xFFFFFFFF) . $this->packString($roleName) . pack('C', 1);
        $send = $this->sendToGamedBD($this->createHeader(self::OP_GET_ROLEID, $pack), $ip, $port);
        $data = $this->deleteHeader($send);
        if (!is_string($data) || strlen($data) < 4) {
            throw new Exception('getRoleid retornou resposta vazia');
        }

        $unsigned = unpack('Nroleid', substr($data, 0, 4));
        $rawRoleId = intval(array_value($unsigned, 'roleid', 0));
        $found = ($rawRoleId > 0 && $rawRoleId !== 0xFFFFFFFF);
        return [
            'name' => $roleName,
            'roleid' => $found ? $rawRoleId : 0,
            'found' => $found,
        ];
    }

    private function decodeMaybePackedName($value)
    {
        $value = (string) $value;
        if ($value !== '' && preg_match('/^[0-9a-f]+$/i', $value) && (strlen($value) % 2) === 0) {
            $decoded = decode_octet_text($value);
            if ($decoded !== '') {
                return $decoded;
            }
        }

        return $value;
    }

    private function normalizeOnlineUserRows(array $rows)
    {
        $userlist = [];
        foreach ($rows as $row) {
            if (!is_array($row)) {
                continue;
            }
            $row['name_text'] = $this->decodeMaybePackedName(array_value($row, 'name', ''));
            $row['online'] = true;
            $userlist[] = $row;
        }
        return $userlist;
    }

    private function maxOnlineUserid(array $rows)
    {
        $max = 0;
        foreach ($rows as $row) {
            $userid = intval(array_value($row, 'userid', 0));
            if ($userid > $max) {
                $max = $userid;
            }
        }
        return ($max > 0) ? ($max + 1) : 0;
    }

    private function listOnlineUsersLegacy($ip, $port)
    {
        $cursor = 0;
        $pages = 0;
        $userlist = [];
        $lastLocalsid = -1;
        $lastHandler = 1;
        $lastWire = [];

        while ($pages < 256) {
            $pack = pack('N*', 0xFFFFFFFF, 1, intval($cursor)) . $this->packString('1');
            $wire = $this->sendToDeliveryRawLegacyCompat($this->createHeader(self::OP_GM_LIST_ONLINE_USER, $pack), $ip, $port);
            $response = (string) array_value($wire, 'response', '');
            if ($response === '') {
                throw new Exception('GMListOnlineUser legado retornou resposta vazia');
            }

            $data = $this->deleteProtocolHeaderWithSession($response);
            $this->cycle = false;
            $decoded = $this->unmarshal($data, $this->struct_legacy_role_list_response);
            if (!is_array($decoded)) {
                throw new Exception('Falha ao interpretar GMListOnlineUser legado');
            }

            $rows = $this->normalizeOnlineUserRows((array) array_value($decoded, 'users', []));
            $lastLocalsid = intval(array_value($decoded, 'localsid', $lastLocalsid));
            $lastHandler = intval(array_value($decoded, 'handler', $lastHandler));
            $lastWire = [
                'hello_len' => intval(array_value($wire, 'hello_len', 0)),
                'sent_bytes' => intval(array_value($wire, 'sent_bytes', 0)),
                'response_hex' => (string) array_value($wire, 'response_hex', ''),
                'response_len' => intval(array_value($wire, 'response_len', 0)),
            ];

            if (empty($rows)) {
                break;
            }

            foreach ($rows as $row) {
                $roleid = intval(array_value($row, 'roleid', 0));
                if ($roleid <= 0) {
                    continue;
                }
                $userlist[$roleid] = $row;
            }

            $nextCursor = $this->maxOnlineUserid($rows);
            if ($nextCursor <= $cursor) {
                break;
            }

            $cursor = $nextCursor;
            $pages++;
        }

        return [
            'retcode' => 0,
            'gmroleid' => 0,
            'localsid' => $lastLocalsid,
            'handler' => $lastHandler,
            'userlist' => array_values($userlist),
            'wire' => $lastWire,
            'legacy_paged' => true,
        ];
    }

    public function getOnlineCounts($gmroleid, $localsid, $ip, $port)
    {
        $pack = pack('NN', intval($gmroleid), intval($localsid));
        $wire = $this->sendToDeliveryRawLegacyCompat($this->createHeader(self::OP_GM_ONLINE_NUM, $pack), $ip, $port);
        $response = (string) array_value($wire, 'response', '');
        if ($response === '') {
            throw new Exception('GMOnlineNum retornou resposta vazia');
        }

        $data = $this->deleteProtocolHeaderWithSession($response);
        $this->cycle = false;
        $decoded = $this->unmarshal($data, $this->struct_gm_online_num_response);
        if (!is_array($decoded)) {
            throw new Exception('Falha ao interpretar GMOnlineNum');
        }

        $decoded['wire'] = [
            'hello_len' => intval(array_value($wire, 'hello_len', 0)),
            'sent_bytes' => intval(array_value($wire, 'sent_bytes', 0)),
            'response_hex' => (string) array_value($wire, 'response_hex', ''),
            'response_len' => intval(array_value($wire, 'response_len', 0)),
        ];
        return $decoded;
    }

    public function listOnlineUsers($gmroleid, $localsid, $handler, $ip, $port, $condHex = '')
    {
        $primaryError = null;
        $primaryResult = null;

        try {
            $pack = pack('NNN', intval($gmroleid), intval($localsid), intval($handler))
                . $this->packOctet(preg_replace('/[^0-9a-f]/i', '', (string) $condHex));
            $wire = $this->sendToDeliveryRaw($this->createHeader(self::OP_GM_LIST_ONLINE_USER, $pack), $ip, $port);
            $response = (string) array_value($wire, 'response', '');
            if ($response === '') {
                throw new Exception('GMListOnlineUser retornou resposta vazia');
            }

            $data = $this->deleteProtocolHeader($response);
            $this->cycle = false;
            $decoded = $this->unmarshal($data, $this->struct_gm_list_online_user_response);
            if (!is_array($decoded) || (intval(array_value($decoded, 'retcode', 0)) === 0 && intval(array_value($decoded, 'gmroleid', 0)) === 0 && intval(array_value($decoded, 'localsid', 0)) === 0 && intval(array_value($decoded, 'handler', 0)) === 0 && empty(array_value($decoded, 'userlist', [])))) {
                $data = $this->deleteProtocolHeaderWithSession($response);
                $this->cycle = false;
                $decoded = $this->unmarshal($data, $this->struct_gm_list_online_user_response);
            }
            if (!is_array($decoded)) {
                throw new Exception('Falha ao interpretar GMListOnlineUser');
            }

            $primaryResult = [
                'retcode' => intval(array_value($decoded, 'retcode', 0)),
                'gmroleid' => intval(array_value($decoded, 'gmroleid', 0)),
                'localsid' => intval(array_value($decoded, 'localsid', 0)),
                'handler' => intval(array_value($decoded, 'handler', 0)),
                'userlist' => $this->normalizeOnlineUserRows((array) array_value($decoded, 'userlist', [])),
                'wire' => [
                    'hello_len' => intval(array_value($wire, 'hello_len', 0)),
                    'sent_bytes' => intval(array_value($wire, 'sent_bytes', 0)),
                    'response_hex' => (string) array_value($wire, 'response_hex', ''),
                    'response_len' => intval(array_value($wire, 'response_len', 0)),
                ],
            ];
        } catch (Exception $e) {
            $primaryError = $e;
        }

        $version = $this->normalizedConfiguredVersion();
        $shouldUseLegacyFallback = ($version !== '352');
        if (!$shouldUseLegacyFallback) {
            if ($primaryError instanceof Exception) {
                throw $primaryError;
            }
            return $primaryResult;
        }

        if (is_array($primaryResult) && !empty($primaryResult['userlist'])) {
            return $primaryResult;
        }

        try {
            return $this->listOnlineUsersLegacy($ip, $port);
        } catch (Exception $legacyError) {
            if ($primaryError instanceof Exception) {
                throw $primaryError;
            }
            throw $legacyError;
        }
    }

    public function getUserFaction($roleid, $ip, $port, $reason = 0)
    {
        $roleid = intval($roleid);
        if ($roleid <= 0) {
            throw new Exception('roleid invalido para GetUserFaction');
        }

        $pack = pack('N*', -1, 1, $roleid);
        $send = $this->sendToGamedBD($this->createHeader(self::OP_GET_USER_FACTION, $pack), $ip, $port);
        $data = $this->deleteHeader($send);
        $this->cycle = false;
        $value = $this->unmarshal($data, $this->struct_user_faction);

        if (!is_array($value)) {
            $this->cycle = false;
            $decoded = $this->unmarshal($data, $this->struct_user_faction_response);
            if (!is_array($decoded)) {
                throw new Exception('Falha ao interpretar GetUserFaction');
            }
            if (intval(array_value($decoded, 'retcode', -1)) !== 0) {
                throw new Exception('GetUserFaction retornou retcode ' . intval(array_value($decoded, 'retcode', -1)));
            }
            $value = array_value($decoded, 'value', []);
            if (!is_array($value)) {
                throw new Exception('GetUserFaction retornou value invalido');
            }
        }
        $value['name_text'] = decode_octet_text((string) array_value($value, 'name', ''));
        $value['nickname_text'] = decode_octet_text((string) array_value($value, 'nickname', ''));

        return [
            'retcode' => 0,
            'value' => $value,
            'level' => intval(array_value($decoded, 'level', 0)),
            'contrib' => intval(array_value($decoded, 'contrib', 0)),
            'reputation' => intval(array_value($decoded, 'reputation', 0)),
            'reincarn_times' => intval(array_value($decoded, 'reincarn_times', 0)),
            'gender' => intval(array_value($decoded, 'gender', 0)),
        ];
    }

    public function getFactionDetail($factionId, $ip, $port)
    {
        $factionId = intval($factionId);
        if ($factionId <= 0) {
            throw new Exception('factionid invalido para GetFactionDetail');
        }

        $pack = pack('N*', -1, $factionId);
        $send = $this->sendToGamedBD($this->createHeader(self::OP_GET_FACTION_DETAIL, $pack), $ip, $port);
        $data = $this->deleteHeader($send);
        $this->cycle = false;
        $value = $this->unmarshal($data, $this->struct_faction_detail_response);
        if (!is_array($value)) {
            $this->cycle = false;
            $decoded = $this->unmarshal($data, $this->struct_faction_detail_wrapped_response);
            if (!is_array($decoded)) {
                throw new Exception('Falha ao interpretar GetFactionDetail');
            }
            if (intval(array_value($decoded, 'retcode', -1)) !== 0) {
                throw new Exception('GetFactionDetail retornou retcode ' . intval(array_value($decoded, 'retcode', -1)));
            }
            $value = array_value($decoded, 'value', []);
            if (!is_array($value)) {
                throw new Exception('GetFactionDetail retornou value invalido');
            }
        }
        $value['name_text'] = decode_octet_text((string) array_value($value, 'name', ''));
        $value['announce_text'] = trim((string) array_value($value, 'announce', ''));
    $members = [];
    foreach ((array) array_value($value, 'member', []) as $member) {
        if (!is_array($member)) {
            continue;
        }
        $member['name_text'] = trim((string) array_value($member, 'name', ''));
        $member['nickname_text'] = trim((string) array_value($member, 'nickname', ''));
        $members[] = $member;
    }
    $value['member'] = $members;
    return $value;
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

    private function encodeHexStruct(array $data, array $struct)
    {
        return bin2hex($this->marshal($data, $struct));
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

function gmV2Enabled(array $config)
{
    return truthyValue(array_value($config, 'gm_v2_enabled', true));
}

function gmV2StateDir(array $config)
{
    return trim((string) array_value($config, 'gm_v2_state_dir', __DIR__ . '/backups/gm-commander-v2'));
}

function gmV2QueueJobsDir(array $config)
{
    return trim((string) array_value($config, 'gm_v2_queue_jobs_dir', gmV2StateDir($config) . '/queue/jobs'));
}

function gmV2QueueAttemptsDir(array $config)
{
    return trim((string) array_value($config, 'gm_v2_queue_attempts_dir', gmV2StateDir($config) . '/queue/attempts'));
}

function gmV2QueueLogsDir(array $config)
{
    return trim((string) array_value($config, 'gm_v2_queue_logs_dir', gmV2StateDir($config) . '/queue/logs'));
}

function gmV2AuditFile(array $config)
{
    return trim((string) array_value($config, 'gm_v2_audit_file', gmV2StateDir($config) . '/audit/history.log'));
}

function gmV2QueueLockFile(array $config)
{
    return trim((string) array_value($config, 'gm_v2_queue_lock_file', gmV2StateDir($config) . '/queue/worker.lock'));
}

function gmV2SchedulesDir(array $config)
{
    return trim((string) array_value($config, 'gm_v2_schedules_dir', gmV2StateDir($config) . '/schedules/items'));
}

function gmV2ScheduleLogsDir(array $config)
{
    return trim((string) array_value($config, 'gm_v2_schedule_logs_dir', gmV2StateDir($config) . '/schedules/logs'));
}

function gmV2ScheduleLockFile(array $config)
{
    return trim((string) array_value($config, 'gm_v2_schedule_lock_file', gmV2StateDir($config) . '/schedules/worker.lock'));
}

function gmV2EnsureEnvironment(array $config)
{
    if (!gmV2Enabled($config)) {
        throw new Exception('GM Commander V2 esta desabilitado na configuracao');
    }

    $dirs = [
        gmV2StateDir($config),
        gmV2QueueJobsDir($config),
        gmV2QueueAttemptsDir($config),
        gmV2QueueLogsDir($config),
        gmV2SchedulesDir($config),
        gmV2ScheduleLogsDir($config),
        dirname(gmV2AuditFile($config)),
        dirname(gmV2QueueLockFile($config)),
        dirname(gmV2ScheduleLockFile($config)),
    ];

    foreach ($dirs as $dir) {
        ensureWritableDirectory($dir);
    }

    return [
        'state_dir' => gmV2StateDir($config),
        'jobs_dir' => gmV2QueueJobsDir($config),
        'attempts_dir' => gmV2QueueAttemptsDir($config),
        'logs_dir' => gmV2QueueLogsDir($config),
        'schedules_dir' => gmV2SchedulesDir($config),
        'schedule_logs_dir' => gmV2ScheduleLogsDir($config),
        'audit_file' => gmV2AuditFile($config),
        'lock_file' => gmV2QueueLockFile($config),
        'schedule_lock_file' => gmV2ScheduleLockFile($config),
    ];
}

function gmV2AllowedBulkCommands(array $config)
{
    $configured = array_value($config, 'gm_v2_queue_allowed_commands', []);
    $commands = [];
    foreach ((array) $configured as $candidate) {
        $definition = gmCommandDefinition($config, $candidate);
        if (!is_array($definition)) {
            continue;
        }

        $canonical = trim((string) array_value($definition, 'key', ''));
        if ($canonical !== '' && !in_array($canonical, $commands, true)) {
            $commands[] = $canonical;
        }
    }

    return $commands;
}

function gmV2AllowedScheduleCommands(array $config)
{
    $configured = array_value($config, 'gm_v2_schedule_allowed_commands', []);
    $commands = [];
    foreach ((array) $configured as $candidate) {
        $definition = gmCommandDefinition($config, $candidate);
        if (!is_array($definition)) {
            continue;
        }

        $canonical = trim((string) array_value($definition, 'key', ''));
        if ($canonical !== '' && !in_array($canonical, $commands, true)) {
            $commands[] = $canonical;
        }
    }

    return $commands;
}

function gmV2RequestIp()
{
    $candidates = [
        isset($_SERVER['HTTP_CF_CONNECTING_IP']) ? $_SERVER['HTTP_CF_CONNECTING_IP'] : '',
        isset($_SERVER['HTTP_X_FORWARDED_FOR']) ? explode(',', (string) $_SERVER['HTTP_X_FORWARDED_FOR'])[0] : '',
        isset($_SERVER['REMOTE_ADDR']) ? $_SERVER['REMOTE_ADDR'] : '',
    ];

    foreach ($candidates as $candidate) {
        $candidate = trimOneLineText($candidate);
        if ($candidate !== '') {
            return $candidate;
        }
    }

    return '';
}

function gmV2RequestActor(array $request)
{
    $actor = trimOneLineText(firstArrayValue($request, [
        'actor',
        'admin',
        'admin_user',
        'adminUser',
        'operator',
        'requested_by',
        'requestedBy',
    ], ''));

    if ($actor === '' && isset($_SERVER['HTTP_X_SYNC_ACTOR'])) {
        $actor = trimOneLineText($_SERVER['HTTP_X_SYNC_ACTOR']);
    }

    if ($actor === '' && isset($_SERVER['PHP_AUTH_USER'])) {
        $actor = trimOneLineText($_SERVER['PHP_AUTH_USER']);
    }

    if ($actor === '') {
        $actor = 'api';
    }

    return containsControlChars($actor) ? 'api' : truncateUtf8Text($actor, 120);
}

function gmV2AppendAudit(array $config, $event, array $entry = [])
{
    gmV2EnsureEnvironment($config);
    $payload = array_merge([
        'type' => 'gm_v2_audit',
        'event' => trim((string) $event),
        'created_at' => gmdate('c'),
        'ip' => gmV2RequestIp(),
    ], $entry);
    appendLogLine(gmV2AuditFile($config), safeJsonEncode($payload));
    return gmV2AuditFile($config);
}

function gmV2NormalizeIntList($value)
{
    $items = [];
    if (is_array($value)) {
        $items = $value;
    } elseif (is_string($value)) {
        $items = preg_split('/[\s,;|]+/', trim($value));
    } elseif ($value !== null && $value !== '') {
        $items = [$value];
    }

    $normalized = [];
    foreach ((array) $items as $item) {
        $intValue = intval($item);
        if ($intValue > 0 && !in_array($intValue, $normalized, true)) {
            $normalized[] = $intValue;
        }
    }

    return $normalized;
}

function gmV2NormalizeTextList($value)
{
    $items = [];
    if (is_array($value)) {
        $items = $value;
    } elseif (is_string($value)) {
        $items = preg_split('/[\r\n,;|]+/', trim($value));
    } elseif ($value !== null && $value !== '') {
        $items = [$value];
    }

    $normalized = [];
    foreach ((array) $items as $item) {
        $text = trimOneLineText($item);
        if ($text === '' || containsControlChars($text)) {
            continue;
        }
        if (!in_array($text, $normalized, true)) {
            $normalized[] = $text;
        }
    }

    return $normalized;
}

function gmV2SelectionHasExplicitTargets(array $selection)
{
    return !empty($selection['roleids']) || !empty($selection['userids']) || !empty($selection['names']) || !empty($selection['guild_ids']);
}

function gmV2SelectionHasAnyCriteria(array $selection)
{
    return !empty($selection['roleids'])
        || !empty($selection['userids'])
        || !empty($selection['names'])
        || trim((string) array_value($selection, 'query', '')) !== ''
        || trim((string) array_value($selection, 'guild', '')) !== ''
        || !empty($selection['guild_ids'])
        || !empty($selection['class_ids'])
        || intval(array_value($selection, 'level_min', 0)) > 0
        || intval(array_value($selection, 'level_max', 0)) > 0
        || !empty($selection['all_online'])
        || !empty($selection['online_only'])
        || trim((string) array_value($selection, 'ranking_key', '')) !== '';
}

function gmV2NormalizeSelection(array $request, array $config)
{
    $selection = is_array(array_value($request, 'selection', null)) ? array_value($request, 'selection', []) : [];
    $source = array_merge($selection, $request);

    $roleids = gmV2NormalizeIntList(firstArrayValue($source, ['roleids', 'roles', 'role_ids'], []));
    $singleRoleId = intval(firstArrayValue($source, ['roleid', 'role_id'], 0));
    if ($singleRoleId > 0 && !in_array($singleRoleId, $roleids, true)) {
        $roleids[] = $singleRoleId;
    }

    $userids = gmV2NormalizeIntList(firstArrayValue($source, ['userids', 'users', 'user_ids', 'account_ids'], []));
    $singleUserId = intval(firstArrayValue($source, ['userid', 'user_id', 'account_id', 'accountId'], 0));
    if ($singleUserId > 0 && !in_array($singleUserId, $userids, true)) {
        $userids[] = $singleUserId;
    }

    $names = gmV2NormalizeTextList(firstArrayValue($source, ['names', 'role_names'], []));
    $singleName = trimOneLineText(firstArrayValue($source, ['name', 'player_name', 'role_name'], ''));
    $query = trimOneLineText(firstArrayValue($source, ['q', 'query', 'search'], ''));
    if ($singleName !== '' && $query === '') {
        $names[] = $singleName;
    }
    $names = array_values(array_unique($names));

    $classIds = gmV2NormalizeIntList(firstArrayValue($source, ['class_ids', 'classes', 'cls', 'class_id'], []));
    $guild = trimOneLineText(firstArrayValue($source, ['guild', 'guild_name', 'faction', 'faction_name'], ''));
    $guildIds = gmV2NormalizeIntList(firstArrayValue($source, ['guild_ids', 'guild_id', 'faction_ids', 'faction_id'], []));
    $levelMin = max(0, intval(firstArrayValue($source, ['level_min', 'min_level', 'minLevel'], 0)));
    $levelMax = max(0, intval(firstArrayValue($source, ['level_max', 'max_level', 'maxLevel'], 0)));
    $allOnline = truthyValue(firstArrayValue($source, ['all_online', 'allOnline', 'everyone_online'], false));
    $onlineOnly = $allOnline || truthyValue(firstArrayValue($source, ['online_only', 'onlineOnly', 'online'], false));
    $rankingKey = trimOneLineText(firstArrayValue($source, ['ranking_key', 'rankingKey'], ''));
    $rankingLimit = max(0, intval(firstArrayValue($source, ['ranking_limit', 'rankingLimit'], 0)));
    $limit = max(1, intval(firstArrayValue($source, ['limit', 'directory_limit'], array_value($config, 'gm_v2_directory_limit', 200))));
    $limit = min($limit, max(1, intval(array_value($config, 'gm_v2_directory_limit', 200))));

    return [
        'roleids' => $roleids,
        'userids' => $userids,
        'names' => $names,
        'query' => $query,
        'guild' => $guild,
        'guild_ids' => $guildIds,
        'class_ids' => $classIds,
        'level_min' => $levelMin,
        'level_max' => $levelMax,
        'all_online' => $allOnline,
        'online_only' => $onlineOnly,
        'ranking_key' => $rankingKey,
        'ranking_limit' => $rankingLimit,
        'limit' => $limit,
    ];
}

function gmV2NormalizeCommandKey(array $config, $commandKey, $bulkOnly = true)
{
    $definition = gmCommandDefinition($config, trim((string) $commandKey));
    if (!is_array($definition)) {
        throw new InvalidArgumentException('command_key invalido');
    }

    $canonical = trim((string) array_value($definition, 'key', ''));
    if ($canonical === '' || empty($definition['supported'])) {
        throw new InvalidArgumentException('command_key nao esta suportado nesta VPS');
    }

    if ($bulkOnly && !in_array($canonical, gmV2AllowedBulkCommands($config), true)) {
        throw new InvalidArgumentException('command_key nao esta liberado para Fase A bulk/queue');
    }

    return $canonical;
}

function gmV2NormalizeScheduleCommandKey(array $config, $commandKey)
{
    $canonical = gmV2NormalizeCommandKey($config, $commandKey, true);
    if (!in_array($canonical, gmV2AllowedScheduleCommands($config), true)) {
        throw new InvalidArgumentException('command_key nao esta liberado para agendamento semanal');
    }

    return $canonical;
}

function gmV2NormalizeWeekdayToken($value)
{
    if (is_int($value) || (is_string($value) && preg_match('/^-?\d+$/', trim($value)))) {
        $weekday = intval($value);
        if ($weekday === 0) {
            $weekday = 7;
        }
        return ($weekday >= 1 && $weekday <= 7) ? $weekday : 0;
    }

    $token = strtolower(trim((string) $value));
    $map = [
        '1' => 1, 'mon' => 1, 'monday' => 1, 'seg' => 1, 'segunda' => 1, 'segunda-feira' => 1,
        '2' => 2, 'tue' => 2, 'tuesday' => 2, 'ter' => 2, 'terca' => 2, 'terça' => 2, 'terca-feira' => 2, 'terça-feira' => 2,
        '3' => 3, 'wed' => 3, 'wednesday' => 3, 'qua' => 3, 'quarta' => 3, 'quarta-feira' => 3,
        '4' => 4, 'thu' => 4, 'thursday' => 4, 'qui' => 4, 'quinta' => 4, 'quinta-feira' => 4,
        '5' => 5, 'fri' => 5, 'friday' => 5, 'sex' => 5, 'sexta' => 5, 'sexta-feira' => 5,
        '6' => 6, 'sat' => 6, 'saturday' => 6, 'sab' => 6, 'sábado' => 6, 'sabado' => 6,
        '7' => 7, 'sun' => 7, 'sunday' => 7, 'dom' => 7, 'domingo' => 7,
    ];

    return isset($map[$token]) ? intval($map[$token]) : 0;
}

function gmV2NormalizeWeekdayList($value)
{
    $items = [];
    if (is_array($value)) {
        $items = $value;
    } elseif (is_string($value)) {
        $items = preg_split('/[\s,;|]+/', trim($value));
    } elseif ($value !== null && $value !== '') {
        $items = [$value];
    }

    $normalized = [];
    foreach ((array) $items as $item) {
        $weekday = gmV2NormalizeWeekdayToken($item);
        if ($weekday > 0 && !in_array($weekday, $normalized, true)) {
            $normalized[] = $weekday;
        }
    }

    sort($normalized, SORT_NUMERIC);
    return $normalized;
}

function gmV2NormalizeTimeOfDay($value)
{
    $text = trim((string) $value);
    if ($text === '') {
        return '';
    }

    if (!preg_match('/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/', $text, $matches)) {
        return '';
    }

    $hour = intval($matches[1]);
    $minute = intval($matches[2]);
    $second = isset($matches[3]) ? intval($matches[3]) : 0;
    if ($hour < 0 || $hour > 23 || $minute < 0 || $minute > 59 || $second < 0 || $second > 59) {
        return '';
    }

    return sprintf('%02d:%02d:%02d', $hour, $minute, $second);
}

function gmV2NormalizeTimezoneName($value, array $config)
{
    $candidate = trim((string) $value);
    if ($candidate === '') {
        $candidate = trim((string) array_value($config, 'gm_v2_schedule_default_timezone', date_default_timezone_get()));
    }

    try {
        $timezone = new DateTimeZone($candidate);
        return $timezone->getName();
    } catch (Exception $e) {
        throw new InvalidArgumentException('timezone invalida');
    }
}

function gmV2ComputeNextScheduleRunAt(array $weekdays, $timeOfDay, $timezoneName, $from = null)
{
    if (empty($weekdays)) {
        throw new InvalidArgumentException('weekdays obrigatorio');
    }

    $timeOfDay = gmV2NormalizeTimeOfDay($timeOfDay);
    if ($timeOfDay === '') {
        throw new InvalidArgumentException('time_of_day invalido');
    }

    $timezone = new DateTimeZone($timezoneName);
    if ($from instanceof DateTimeInterface) {
        $base = DateTimeImmutable::createFromInterface($from)->setTimezone($timezone);
    } else {
        $base = new DateTimeImmutable('now', $timezone);
    }

    $parts = array_map('intval', explode(':', $timeOfDay));
    $startOfDay = $base->setTime(0, 0, 0);
    for ($offset = 0; $offset <= 14; $offset++) {
        $candidateDay = ($offset === 0) ? $startOfDay : $startOfDay->modify('+' . $offset . ' day');
        $weekday = intval($candidateDay->format('N'));
        if (!in_array($weekday, $weekdays, true)) {
            continue;
        }

        $candidate = $candidateDay->setTime($parts[0], $parts[1], $parts[2]);
        if ($candidate > $base) {
            return $candidate->format(DateTimeInterface::ATOM);
        }
    }

    $fallback = $startOfDay->modify('+7 day')->setTime($parts[0], $parts[1], $parts[2]);
    return $fallback->format(DateTimeInterface::ATOM);
}

function gmV2OnlineLookup(array $config, GamedProtocol $proto)
{
    $handler = rand(1000, 999999999);
    $localsid = intval(array_value($config, 'gm_delivery_sid_default', 0));
    $counts = [];
    try {
        $counts = $proto->getOnlineCounts(0, $localsid, $config['gdeliveryd_ip'], $config['gdeliveryd_port']);
    } catch (Exception $ignored) {
    }
    $response = $proto->listOnlineUsers(0, $localsid, $handler, $config['gdeliveryd_ip'], $config['gdeliveryd_port']);
    $lookup = [];
    foreach ((array) array_value($response, 'userlist', []) as $row) {
        $roleid = intval(array_value($row, 'roleid', 0));
        if ($roleid <= 0) {
            continue;
        }
        $lookup[$roleid] = $row;
    }
    return [
        'lookup' => $lookup,
        'counts' => $counts,
        'response' => $response,
    ];
}

function gmV2RoleProfileSort(array &$profiles)
{
    usort($profiles, function ($a, $b) {
        $onlineCmp = intval(!empty($b['online'])) <=> intval(!empty($a['online']));
        if ($onlineCmp !== 0) {
            return $onlineCmp;
        }

        $levelCmp = intval(array_value($b, 'level', 0)) <=> intval(array_value($a, 'level', 0));
        if ($levelCmp !== 0) {
            return $levelCmp;
        }

        return strnatcasecmp((string) array_value($a, 'name', ''), (string) array_value($b, 'name', ''));
    });
}

function gmV2RoleProfileKey(array $profile)
{
    $roleid = intval(array_value($profile, 'roleid', 0));
    if ($roleid > 0) {
        return 'role:' . $roleid;
    }

    $userid = intval(array_value($profile, 'userid', 0));
    if ($userid > 0) {
        return 'account:' . $userid;
    }

    return 'anon:' . md5(safeJsonEncode($profile));
}

function gmV2BuildAccountOnlyProfile($userid)
{
    $userid = intval($userid);
    return [
        'roleid' => 0,
        'userid' => $userid,
        'name' => '',
        'cls' => 0,
        'class_name' => '',
        'level' => 0,
        'guild' => '',
        'guild_id' => 0,
        'online' => false,
        'target_scope' => 'account',
        'resolution_note' => 'Conta resolvida sem rolelist detalhada neste legado',
    ];
}

function gmV2HydrateRoleProfile(array $config, GamedProtocol $proto, $roleid, array $onlineLookup = [], $includeGuild = false)
{
    $roleid = intval($roleid);
    if ($roleid <= 0) {
        throw new InvalidArgumentException('roleid invalido para perfil de alvo');
    }

    $role = $proto->getEditableRole($roleid, $config['gamedbd_ip'], $config['gamedbd_port']);
    if (!is_array($role)) {
        throw new Exception('Nao foi possivel carregar o roleid ' . $roleid);
    }

    $base = is_array(array_value($role, 'base', null)) ? array_value($role, 'base', []) : [];
    $status = is_array(array_value($role, 'status', null)) ? array_value($role, 'status', []) : [];
    $name = trim((string) array_value($base, 'name', array_value($role, 'name', '')));
    $cls = intval(array_value($base, 'cls', array_value($role, 'cls', 0)));
    $level = intval(array_value($status, 'level', array_value($role, 'level', 0)));
    $userid = intval(array_value($base, 'userid', array_value($role, 'userid', 0)));
    $onlineRow = isset($onlineLookup[$roleid]) && is_array($onlineLookup[$roleid]) ? $onlineLookup[$roleid] : [];
    $classInfo = class_info($cls);

    $profile = [
        'roleid' => $roleid,
        'userid' => $userid,
        'name' => $name,
        'cls' => $cls,
        'class_name' => trim((string) array_value($classInfo, 'name', '')),
        'level' => $level,
        'guild' => '',
        'guild_id' => 0,
        'online' => !empty($onlineRow),
        'linkid' => intval(array_value($onlineRow, 'linkid', 0)),
        'localsid' => intval(array_value($onlineRow, 'localsid', 0)),
        'gsid' => intval(array_value($onlineRow, 'gsid', 0)),
        'target_scope' => 'role',
    ];

    if ($includeGuild) {
        try {
            $faction = $proto->getUserFaction($roleid, $config['gamedbd_ip'], $config['gamedbd_port']);
            $value = is_array(array_value($faction, 'value', null)) ? array_value($faction, 'value', []) : [];
            $guildId = intval(array_value($value, 'fid', 0));
            $guildName = trim((string) array_value($value, 'name_text', ''));
            if ($guildId > 0) {
                try {
                    $detail = $proto->getFactionDetail($guildId, $config['gamedbd_ip'], $config['gamedbd_port']);
                    $guildName = trim((string) array_value($detail, 'name_text', $guildName));
                } catch (Exception $ignored) {
                }
            }
            $profile['guild_id'] = $guildId;
            $profile['guild'] = $guildName;
        } catch (Exception $ignored) {
        }
    }

    return $profile;
}

function gmV2ResolveGuildMembers(array $config, GamedProtocol $proto, $guildId)
{
    $guildId = intval($guildId);
    if ($guildId <= 0) {
        throw new InvalidArgumentException('guild_id invalido');
    }

    $detail = $proto->getFactionDetail($guildId, $config['gamedbd_ip'], $config['gamedbd_port']);
    $memberRoleIds = [];
    foreach ((array) array_value($detail, 'member', []) as $member) {
        $roleid = intval(array_value($member, 'roleid', 0));
        if ($roleid > 0 && !in_array($roleid, $memberRoleIds, true)) {
            $memberRoleIds[] = $roleid;
        }
    }

    return [
        'guild_id' => $guildId,
        'guild_name' => trim((string) array_value($detail, 'name_text', '')),
        'roleids' => $memberRoleIds,
        'detail' => $detail,
    ];
}

function gmV2ApplyProfileFilters(array $profiles, array $selection)
{
    $filtered = [];
    $query = strtolower((string) array_value($selection, 'query', ''));
    $guild = strtolower((string) array_value($selection, 'guild', ''));
    $guildIds = (array) array_value($selection, 'guild_ids', []);
    $classIds = (array) array_value($selection, 'class_ids', []);
    $levelMin = intval(array_value($selection, 'level_min', 0));
    $levelMax = intval(array_value($selection, 'level_max', 0));
    $onlineOnly = !empty($selection['online_only']);
    $userids = (array) array_value($selection, 'userids', []);

    foreach ($profiles as $profile) {
        if (!is_array($profile)) {
            continue;
        }

        if (!empty($userids) && intval(array_value($profile, 'userid', 0)) > 0 && !in_array(intval(array_value($profile, 'userid', 0)), $userids, true)) {
            continue;
        }

        if ($onlineOnly && empty($profile['online'])) {
            continue;
        }

        if (!empty($guildIds) && !in_array(intval(array_value($profile, 'guild_id', 0)), $guildIds, true)) {
            continue;
        }

        if (!empty($classIds) && !in_array(intval(array_value($profile, 'cls', 0)), $classIds, true)) {
            continue;
        }

        $level = intval(array_value($profile, 'level', 0));
        if ($levelMin > 0 && $level < $levelMin) {
            continue;
        }
        if ($levelMax > 0 && $level > $levelMax) {
            continue;
        }

        if ($guild !== '') {
            $profileGuild = strtolower(trim((string) array_value($profile, 'guild', '')));
            if ($profileGuild === '' || strpos($profileGuild, $guild) === false) {
                continue;
            }
        }

        if ($query !== '') {
            $haystack = strtolower(trim((string) array_value($profile, 'name', '') . ' ' . array_value($profile, 'guild', '')));
            if ($haystack === '' || strpos($haystack, $query) === false) {
                continue;
            }
        }

        $filtered[] = $profile;
    }

    return $filtered;
}

function gmV2ResolveRoleIdByName(array $config, GamedProtocol $proto, $name, array $onlineLookup = [])
{
    $name = trim((string) $name);
    if ($name === '') {
        return [
            'found' => false,
            'roleid' => 0,
            'source' => '',
            'errors' => [],
        ];
    }

    $errors = [];

    try {
        $legacy = $proto->getRoleIdByName($name, $config['gamedbd_ip'], $config['gamedbd_port']);
        if (!empty($legacy['found'])) {
            return [
                'found' => true,
                'roleid' => intval(array_value($legacy, 'roleid', 0)),
                'source' => 'gamedbd_getRoleid',
                'errors' => $errors,
            ];
        }
    } catch (Exception $e) {
        $errors[] = $e->getMessage();
    }

    try {
        $match = $proto->getPlayerIdByName($name, $config['gdeliveryd_ip'], $config['gdeliveryd_port'], intval(array_value($config, 'gm_delivery_sid_default', 0)));
        if (!empty($match['found'])) {
            return [
                'found' => true,
                'roleid' => intval(array_value($match, 'roleid', 0)),
                'source' => 'gdeliveryd_GetPlayerIDByName',
                'errors' => $errors,
            ];
        }
    } catch (Exception $e) {
        $errors[] = $e->getMessage();
    }

    foreach ($onlineLookup as $onlineRoleId => $onlineRow) {
        $onlineName = trim((string) array_value($onlineRow, 'name_text', ''));
        if ($onlineName !== '' && strcasecmp($onlineName, $name) === 0) {
            return [
                'found' => true,
                'roleid' => intval($onlineRoleId),
                'source' => 'online_lookup',
                'errors' => $errors,
            ];
        }
    }

    return [
        'found' => false,
        'roleid' => 0,
        'source' => '',
        'errors' => $errors,
    ];
}

function gmV2ResolveProfiles(array $config, array $request, $commandKey = '')
{
    gmV2EnsureEnvironment($config);
    $selection = gmV2NormalizeSelection($request, $config);
    $proto = new GamedProtocol();
    $warnings = [];
    $profiles = [];
    $profileMap = [];
    $onlineLookup = [];
    $onlineCounts = [];
    $needsGuild = ($selection['guild'] !== '' || !empty($selection['guild_ids']));

    $needsOnlineDirectory = $selection['all_online']
        || $selection['online_only']
        || !empty($selection['guild_ids'])
        || !empty($selection['names'])
        || $selection['query'] !== ''
        || (!gmV2SelectionHasExplicitTargets($selection) && $commandKey !== 'sendSystemMessage');

    if ($needsOnlineDirectory) {
        try {
            $onlineSnapshot = gmV2OnlineLookup($config, $proto);
            $onlineLookup = (array) array_value($onlineSnapshot, 'lookup', []);
            $onlineCounts = (array) array_value($onlineSnapshot, 'counts', []);
        } catch (Exception $e) {
            $warnings[] = 'Nao foi possivel listar jogadores online: ' . $e->getMessage();
        }
    }

    $reportedOnlineTotal = intval(array_value($onlineCounts, 'total_num', 0));
    if (($selection['all_online'] || $selection['online_only']) && $reportedOnlineTotal > 0 && empty($onlineLookup)) {
        $warnings[] = 'GMOnlineNum reportou ' . $reportedOnlineTotal . ' jogador(es) online, mas a listagem detalhada retornou 0 entradas';
    }

    $appendProfile = function ($profile) use (&$profileMap) {
        if (!is_array($profile)) {
            return;
        }
        $profileMap[gmV2RoleProfileKey($profile)] = $profile;
    };

    foreach ((array) array_value($selection, 'guild_ids', []) as $guildId) {
        try {
            $guildMembers = gmV2ResolveGuildMembers($config, $proto, $guildId);
            foreach ((array) array_value($guildMembers, 'roleids', []) as $memberRoleId) {
                $appendProfile(gmV2HydrateRoleProfile($config, $proto, $memberRoleId, $onlineLookup, true));
            }
        } catch (Exception $e) {
            $warnings[] = 'Falha ao resolver guild_id ' . intval($guildId) . ': ' . $e->getMessage();
        }
    }

    foreach ((array) array_value($selection, 'roleids', []) as $roleid) {
        try {
            $appendProfile(gmV2HydrateRoleProfile($config, $proto, $roleid, $onlineLookup, $needsGuild));
        } catch (Exception $e) {
            $warnings[] = 'Falha ao resolver roleid ' . intval($roleid) . ': ' . $e->getMessage();
        }
    }

    foreach ((array) array_value($selection, 'names', []) as $name) {
        try {
            $match = gmV2ResolveRoleIdByName($config, $proto, $name, $onlineLookup);
            if (empty($match['found'])) {
                $warnings[] = 'Nome nao encontrado: ' . $name;
                continue;
            }
            $appendProfile(gmV2HydrateRoleProfile($config, $proto, intval(array_value($match, 'roleid', 0)), $onlineLookup, $needsGuild));
        } catch (Exception $e) {
            $warnings[] = 'Falha ao resolver nome ' . $name . ': ' . $e->getMessage();
        }
    }

    foreach ((array) array_value($selection, 'userids', []) as $userid) {
        $appendProfile(gmV2BuildAccountOnlyProfile($userid));
    }

    if ($selection['all_online'] || (!gmV2SelectionHasExplicitTargets($selection) && !empty($onlineLookup))) {
        foreach (array_keys($onlineLookup) as $roleid) {
            try {
                $appendProfile(gmV2HydrateRoleProfile($config, $proto, $roleid, $onlineLookup, $needsGuild));
            } catch (Exception $e) {
                $warnings[] = 'Falha ao carregar perfil online ' . intval($roleid) . ': ' . $e->getMessage();
            }
        }
    }

    $profiles = array_values($profileMap);
    $profiles = gmV2ApplyProfileFilters($profiles, $selection);
    gmV2RoleProfileSort($profiles);
    $limit = max(1, intval(array_value($selection, 'limit', array_value($config, 'gm_v2_directory_limit', 200))));
    if (count($profiles) > $limit) {
        $warnings[] = 'Resultado limitado aos primeiros ' . $limit . ' alvos';
        $profiles = array_slice($profiles, 0, $limit);
    }

    if ($selection['ranking_key'] !== '') {
        $warnings[] = 'Selecao por ranking ainda depende de fonte de ranking configurada nesta VPS';
    }

    if (!empty($selection['userids'])) {
        $warnings[] = 'Neste legado, userid sem roleid retorna alvo de conta sem rolelist detalhada';
    }

    return [
        'profiles' => $profiles,
        'selection' => $selection,
        'warnings' => array_values(array_unique($warnings)),
        'online_lookup_count' => count($onlineLookup),
    ];
}

function gmV2TargetFromProfile(array $profile, $commandKey, array &$warnings)
{
    $commandKey = trim((string) $commandKey);
    if ($commandKey === 'sendSystemMessage') {
        return [
            'target_type' => 'broadcast',
            'target_key' => 'broadcast:global',
            'roleid' => 0,
            'userid' => 0,
            'name' => 'global-broadcast',
            'online' => null,
        ];
    }

    if ($commandKey === 'grantMallCash') {
        $userid = intval(array_value($profile, 'userid', 0));
        if ($userid <= 0) {
            $warnings[] = 'Alvo ignorado sem userid para grantMallCash';
            return null;
        }

        return [
            'target_type' => 'account',
            'target_key' => gmV2RoleProfileKey($profile),
            'roleid' => intval(array_value($profile, 'roleid', 0)),
            'userid' => $userid,
            'name' => trim((string) array_value($profile, 'name', '')),
            'guild' => trim((string) array_value($profile, 'guild', '')),
            'cls' => intval(array_value($profile, 'cls', 0)),
            'level' => intval(array_value($profile, 'level', 0)),
            'online' => !empty($profile['online']),
        ];
    }

    $roleid = intval(array_value($profile, 'roleid', 0));
    if ($roleid <= 0) {
        $warnings[] = 'Alvo ignorado sem roleid para ' . $commandKey;
        return null;
    }

    return [
        'target_type' => 'role',
        'target_key' => gmV2RoleProfileKey($profile),
        'roleid' => $roleid,
        'userid' => intval(array_value($profile, 'userid', 0)),
        'name' => trim((string) array_value($profile, 'name', '')),
        'guild' => trim((string) array_value($profile, 'guild', '')),
        'cls' => intval(array_value($profile, 'cls', 0)),
        'level' => intval(array_value($profile, 'level', 0)),
        'online' => !empty($profile['online']),
    ];
}

function gmV2BuildTargetsFromProfiles(array $profiles, $commandKey, array &$warnings)
{
    $targets = [];
    $targetMap = [];

    foreach ($profiles as $profile) {
        $target = gmV2TargetFromProfile($profile, $commandKey, $warnings);
        if (!is_array($target)) {
            continue;
        }
        $targetMap[(string) array_value($target, 'target_key', md5(safeJsonEncode($target)))] = $target;
    }

    if ($commandKey === 'sendSystemMessage' && empty($targetMap)) {
        $targetMap['broadcast:global'] = gmV2TargetFromProfile([], $commandKey, $warnings);
    }

    foreach ($targetMap as $target) {
        $targets[] = $target;
    }

    return $targets;
}

function gmV2ResolveBulkTargetsPayload(array $config, array $request)
{
    $commandKey = gmV2NormalizeCommandKey($config, firstArrayValue($request, ['command_key', 'commandKey', 'command'], ''), true);
    $resolved = gmV2ResolveProfiles($config, $request, $commandKey);
    $warnings = (array) array_value($resolved, 'warnings', []);
    $targets = gmV2BuildTargetsFromProfiles((array) array_value($resolved, 'profiles', []), $commandKey, $warnings);

    if ($commandKey === 'sendSystemMessage' && gmV2SelectionHasExplicitTargets((array) array_value($resolved, 'selection', []))) {
        $warnings[] = 'sendSystemMessage e global nesta fase e ignora filtros/alvos especificos';
    }

    return [
        'success' => true,
        'command_key' => $commandKey,
        'selection' => array_value($resolved, 'selection', []),
        'count' => count($targets),
        'targets' => $targets,
        'profiles' => array_value($resolved, 'profiles', []),
        'warnings' => array_values(array_unique($warnings)),
        'resolved_at' => gmdate('c'),
    ];
}

function gmV2CommandPayloadFromRequest($commandKey, array $request)
{
    $merged = $request;
    foreach (['command', 'payload', 'mail', 'broadcast', 'grant', 'cash', 'reward'] as $field) {
        $candidate = array_value($request, $field, null);
        if (is_array($candidate)) {
            $merged = array_merge($merged, $candidate);
        }
    }

    unset(
        $merged['selection'],
        $merged['roleids'],
        $merged['userids'],
        $merged['names'],
        $merged['guild'],
        $merged['class_ids'],
        $merged['level_min'],
        $merged['level_max'],
        $merged['all_online'],
        $merged['online_only'],
        $merged['ranking_key'],
        $merged['ranking_limit'],
        $merged['limit']
    );

    $merged['command_key'] = $commandKey;
    $merged['dry_run'] = false;
    return $merged;
}

function gmV2BulkCommandConfirmationMeta($commandKey, array $commandPayload = [])
{
    switch (trim((string) $commandKey)) {
        case 'grantMallCash':
            return [
                'required' => true,
                'token' => 'GRANT_MALL_CASH',
                'provided' => grantMallCashConfirmOk($commandPayload),
            ];
    }

    return [
        'required' => false,
        'token' => '',
        'provided' => false,
    ];
}

function gmV2ValidateBulkCommandTemplate($commandKey, array $commandPayload, $requireConfirmation = false)
{
    switch (trim((string) $commandKey)) {
        case 'sendMailItem':
            if (intval(firstArrayValue($commandPayload, ['item_id', 'itemId'], 0)) <= 0) {
                throw new InvalidArgumentException('item_id obrigatorio para sendMailItem');
            }
            if (intval(firstArrayValue($commandPayload, ['count', 'quantity'], 1)) <= 0) {
                throw new InvalidArgumentException('count obrigatorio para sendMailItem');
            }
            return;

        case 'sendMailGold':
            if (intval(firstArrayValue($commandPayload, ['money'], 0)) <= 0) {
                throw new InvalidArgumentException('money obrigatorio para sendMailGold');
            }
            return;

        case 'grantMallCash':
            $amount = firstArrayValue($commandPayload, ['amount', 'gold', 'cash_gold', 'mall_gold', 'value'], null);
            $cashUnits = firstArrayValue($commandPayload, ['cash_units', 'cashUnits', 'raw_cash_units'], null);
            if (floatval($amount) <= 0 && intval($cashUnits) <= 0) {
                throw new InvalidArgumentException('amount ou cash_units obrigatorio para grantMallCash');
            }
            if ($requireConfirmation && !grantMallCashConfirmOk($commandPayload)) {
                throw new InvalidArgumentException('Confirmacao obrigatoria para grantMallCash em bulk. Envie confirm=GRANT_MALL_CASH');
            }
            return;
    }
}

function gmV2PreviewBulkTargetsPayload(array $config, array $request)
{
    $resolved = gmV2ResolveBulkTargetsPayload($config, $request);
    $previewLimit = max(1, intval(array_value($config, 'gm_v2_preview_sample_size', 20)));
    $sample = array_slice((array) array_value($resolved, 'targets', []), 0, $previewLimit);
    $commandKey = trim((string) array_value($resolved, 'command_key', ''));
    $commandPayload = gmV2CommandPayloadFromRequest($commandKey, $request);
    $confirmation = gmV2BulkCommandConfirmationMeta($commandKey, $commandPayload);

    return [
        'success' => true,
        'command_key' => $commandKey,
        'count' => intval(array_value($resolved, 'count', 0)),
        'sample_size' => count($sample),
        'sample_targets' => $sample,
        'selection' => array_value($resolved, 'selection', []),
        'warnings' => array_value($resolved, 'warnings', []),
        'command_payload_preview' => [
            'item_id' => intval(firstArrayValue($commandPayload, ['item_id', 'itemId'], 0)),
            'count' => intval(firstArrayValue($commandPayload, ['count', 'quantity'], 0)),
            'money' => intval(firstArrayValue($commandPayload, ['money'], 0)),
            'amount' => firstArrayValue($commandPayload, ['amount', 'gold', 'cash_units'], null),
            'message' => trim((string) firstArrayValue($commandPayload, ['message', 'title'], '')),
            'confirm' => trim((string) firstArrayValue($commandPayload, ['confirm', 'confirmation', 'confirm_token'], '')),
        ],
        'confirmation' => $confirmation,
        'previewed_at' => gmdate('c'),
    ];
}

function gmV2SearchPlayerDirectoryPayload(array $config, array $request)
{
    $resolved = gmV2ResolveProfiles($config, $request, '');
    $onlineDiagnostics = [];
    try {
        $proto = new GamedProtocol();
        $snapshot = gmV2OnlineLookup($config, $proto);
        $onlineDiagnostics = [
            'total_num' => intval(array_value(array_value($snapshot, 'counts', []), 'total_num', 0)),
            'local_num' => intval(array_value(array_value($snapshot, 'counts', []), 'local_num', 0)),
            'listed_count' => count((array) array_value(array_value($snapshot, 'response', []), 'userlist', [])),
        ];
    } catch (Exception $ignored) {
    }
    return [
        'success' => true,
        'entries' => array_values((array) array_value($resolved, 'profiles', [])),
        'count' => count((array) array_value($resolved, 'profiles', [])),
        'selection' => array_value($resolved, 'selection', []),
        'warnings' => array_value($resolved, 'warnings', []),
        'online_diagnostics' => $onlineDiagnostics,
        'capabilities' => [
            'name_exact' => true,
            'name_partial_online' => true,
            'online_directory' => true,
            'guild_filter' => true,
            'class_filter' => true,
            'account_scope_limited' => true,
            'ranking_source_configured' => false,
        ],
        'searched_at' => gmdate('c'),
    ];
}

function gmV2GetPlayerTargetProfilePayload(array $config, array $request)
{
    gmV2EnsureEnvironment($config);
    $proto = new GamedProtocol();
    $onlineLookup = [];

    try {
        $onlineSnapshot = gmV2OnlineLookup($config, $proto);
        $onlineLookup = (array) array_value($onlineSnapshot, 'lookup', []);
    } catch (Exception $ignored) {
    }

    $roleid = intval(firstArrayValue($request, ['roleid', 'role_id'], 0));
    if ($roleid <= 0) {
        $name = trimOneLineText(firstArrayValue($request, ['name', 'player_name', 'role_name'], ''));
        if ($name === '') {
            throw new InvalidArgumentException('roleid ou name obrigatorio');
        }
        $match = gmV2ResolveRoleIdByName($config, $proto, $name, $onlineLookup);
        if (empty($match['found'])) {
            throw new InvalidArgumentException('Personagem nao encontrado');
        }
        $roleid = intval(array_value($match, 'roleid', 0));
    }

    $profile = gmV2HydrateRoleProfile($config, $proto, $roleid, $onlineLookup, true);
    return [
        'success' => true,
        'profile' => $profile,
        'resolved_at' => gmdate('c'),
    ];
}

function gmV2GetQueueJobPayload(array $config, $jobId)
{
    $job = gmV2ReadJob($config, $jobId);
    if (!is_array($job)) {
        throw new InvalidArgumentException('Job nao encontrado');
    }

    return [
        'success' => true,
        'job' => $job,
        'summary' => gmV2JobSummary($job),
        'job_file' => gmV2QueueJobPath($config, $jobId),
    ];
}

function gmV2QueueJobPath(array $config, $jobId)
{
    return rtrim(gmV2QueueJobsDir($config), '/\\') . DIRECTORY_SEPARATOR . trim((string) $jobId) . '.json';
}

function gmV2QueueAttemptPath(array $config, $jobId, $attemptId)
{
    return rtrim(gmV2QueueAttemptsDir($config), '/\\') . DIRECTORY_SEPARATOR . trim((string) $jobId) . '-' . trim((string) $attemptId) . '.json';
}

function gmV2ReadJob(array $config, $jobId)
{
    $path = gmV2QueueJobPath($config, $jobId);
    if (!is_file($path) || !is_readable($path)) {
        return null;
    }

    $raw = @file_get_contents($path);
    if (!is_string($raw) || trim($raw) === '') {
        return null;
    }

    $decoded = json_decode($raw, true);
    return (json_last_error() === JSON_ERROR_NONE && is_array($decoded)) ? $decoded : null;
}

function gmV2WriteJob(array $config, array $job)
{
    gmV2EnsureEnvironment($config);
    $job['updated_at'] = gmdate('c');
    $path = gmV2QueueJobPath($config, array_value($job, 'id', ''));
    writeAtomicFile($path, safeJsonEncode($job));
    return $path;
}

function gmV2JobSummary(array $job)
{
    return [
        'id' => trim((string) array_value($job, 'id', '')),
        'command_key' => trim((string) array_value($job, 'command_key', '')),
        'status' => trim((string) array_value($job, 'status', 'queued')),
        'created_at' => array_value($job, 'created_at', null),
        'updated_at' => array_value($job, 'updated_at', null),
        'actor' => array_value($job, 'actor', []),
        'target_count' => intval(array_value($job, 'target_count', 0)),
        'pending_count' => count((array) array_value($job, 'targets_pending', [])),
        'retry_count' => count((array) array_value($job, 'targets_retry', [])),
        'completed_count' => count((array) array_value($job, 'targets_completed', [])),
        'failed_count' => count((array) array_value($job, 'targets_failed', [])),
        'warnings' => array_value($job, 'warnings', []),
        'next_retry_at' => array_value($job, 'next_retry_at', null),
    ];
}

function gmV2ListJobs(array $config, $limit = 20)
{
    gmV2EnsureEnvironment($config);
    $files = glob(rtrim(gmV2QueueJobsDir($config), '/\\') . DIRECTORY_SEPARATOR . '*.json');
    if (!is_array($files)) {
        return [];
    }

    usort($files, function ($a, $b) {
        return intval(@filemtime($b)) <=> intval(@filemtime($a));
    });

    $limit = max(1, min(200, intval($limit)));
    $items = [];
    foreach (array_slice($files, 0, $limit) as $file) {
        $raw = @file_get_contents($file);
        $decoded = json_decode((string) $raw, true);
        if (is_array($decoded)) {
            $items[] = gmV2JobSummary($decoded);
        }
    }

    return $items;
}

function gmV2CreateQueuedJob(array $config, array $request)
{
    $resolved = gmV2ResolveBulkTargetsPayload($config, $request);
    $commandKey = trim((string) array_value($resolved, 'command_key', ''));
    $targets = array_values((array) array_value($resolved, 'targets', []));
    $commandPayload = gmV2CommandPayloadFromRequest($commandKey, $request);
    gmV2ValidateBulkCommandTemplate($commandKey, $commandPayload, true);
    $maxTargets = max(1, intval(array_value($config, 'gm_v2_max_targets_per_job', 500)));
    if (count($targets) > $maxTargets) {
        throw new InvalidArgumentException('Quantidade de alvos excede o limite de ' . $maxTargets . ' por job');
    }

    $jobId = buildOperationId('gmv2-job');
    $job = [
        'type' => 'gm_v2_job',
        'id' => $jobId,
        'command_key' => $commandKey,
        'status' => 'queued',
        'created_at' => gmdate('c'),
        'updated_at' => gmdate('c'),
        'actor' => [
            'name' => gmV2RequestActor($request),
            'ip' => gmV2RequestIp(),
        ],
        'selection' => array_value($resolved, 'selection', []),
        'warnings' => array_value($resolved, 'warnings', []),
        'command_payload' => $commandPayload,
        'target_count' => count($targets),
        'targets_pending' => $targets,
        'targets_retry' => [],
        'targets_completed' => [],
        'targets_failed' => [],
        'batch_size' => max(1, min(intval(array_value($config, 'gm_v2_queue_batch_size', 10)), $maxTargets)),
        'retry_limit' => max(1, intval(array_value($config, 'gm_v2_queue_retry_limit', 3))),
        'retry_backoff_seconds' => max(5, intval(array_value($config, 'gm_v2_queue_backoff_seconds', 30))),
        'next_retry_at' => null,
        'preview' => [
            'sample_targets' => array_slice($targets, 0, max(1, intval(array_value($config, 'gm_v2_preview_sample_size', 20)))),
        ],
    ];

    $jobFile = gmV2WriteJob($config, $job);
    gmV2AppendAudit($config, 'job_queued', [
        'job_id' => $jobId,
        'command_key' => $commandKey,
        'actor' => array_value($job, 'actor', []),
        'target_count' => count($targets),
        'warnings' => array_value($resolved, 'warnings', []),
    ]);

    return [
        'success' => true,
        'job' => gmV2JobSummary($job),
        'job_file' => $jobFile,
        'audit_file' => gmV2AuditFile($config),
    ];
}

function gmV2ExecuteQueuedMailCommand(array $config, $commandKey, array $request)
{
    $payload = ($commandKey === 'sendMailItem')
        ? buildSendMailItemPayload($request, $config)
        : buildSendMailGoldPayload($request, $config);
    $delivery = executeMailSendCommand($config, $payload);

    $gmHistoryWarning = '';
    $gmEntry = gmHistoryEntryBase($config, $commandKey, [
        'status' => 'success',
        'success' => true,
        'dry_run' => false,
        'target' => [
            'roleid' => intval(array_value($payload, 'roleid', 0)),
        ],
        'mail' => [
            'kind' => array_value($payload, 'kind', ''),
            'title' => array_value($payload, 'title', ''),
            'message' => array_value($payload, 'message', ''),
            'item_id' => intval(array_value($payload, 'item_id', 0)),
            'count' => intval(array_value($payload, 'count', 0)),
            'money' => intval(array_value($payload, 'money', 0)),
        ],
        'delivery' => $delivery,
        'source' => 'gm_v2_queue',
    ]);
    gmAppendHistoryBestEffort($config, $gmEntry, $gmHistoryWarning);

    return [
        'success' => true,
        'delivery' => $delivery,
        'gm_history_warning' => $gmHistoryWarning,
    ];
}

function gmV2ExecuteSingleTargetCommand(array $config, $commandKey, array $commandPayload, array $target)
{
    $request = $commandPayload;
    $request['dry_run'] = false;

    switch ($commandKey) {
        case 'sendMailItem':
        case 'sendMailGold':
            $request['roleid'] = intval(array_value($target, 'roleid', 0));
            return gmV2ExecuteQueuedMailCommand($config, $commandKey, $request);

        case 'grantMallCash':
            $request['userid'] = intval(array_value($target, 'userid', 0));
            if (intval(array_value($target, 'roleid', 0)) > 0) {
                $request['roleid'] = intval(array_value($target, 'roleid', 0));
            }
            return handleGrantMallCashRequest($config, $request);

        case 'sendSystemMessage':
            return handleSendSystemMessageRequest($config, $request);
    }

    throw new InvalidArgumentException('command_key sem executor bulk nesta fase');
}

function gmV2ProcessQueueJob(array $config, array $job)
{
    $jobId = trim((string) array_value($job, 'id', ''));
    if ($jobId === '') {
        throw new InvalidArgumentException('Job invalido sem id');
    }

    $status = trim((string) array_value($job, 'status', 'queued'));
    if (in_array($status, ['completed', 'completed_with_errors', 'failed'], true)) {
        return $job;
    }

    $now = time();
    $nextRetryAt = trim((string) array_value($job, 'next_retry_at', ''));
    if ($nextRetryAt !== '' && strtotime($nextRetryAt) > $now && empty($job['targets_pending'])) {
        return $job;
    }

    if (empty($job['targets_pending']) && !empty($job['targets_retry'])) {
        $job['targets_pending'] = array_values((array) array_value($job, 'targets_retry', []));
        $job['targets_retry'] = [];
        $job['next_retry_at'] = null;
    }

    $batchSize = max(1, intval(array_value($job, 'batch_size', array_value($config, 'gm_v2_queue_batch_size', 10))));
    $retryLimit = max(1, intval(array_value($job, 'retry_limit', array_value($config, 'gm_v2_queue_retry_limit', 3))));
    $backoffSeconds = max(5, intval(array_value($job, 'retry_backoff_seconds', array_value($config, 'gm_v2_queue_backoff_seconds', 30))));
    $commandKey = trim((string) array_value($job, 'command_key', ''));
    $commandPayload = (array) array_value($job, 'command_payload', []);

    $job['status'] = 'processing';
    $job['started_at'] = array_value($job, 'started_at', gmdate('c'));
    $attemptRecord = [
        'job_id' => $jobId,
        'started_at' => gmdate('c'),
        'command_key' => $commandKey,
        'batch_size' => $batchSize,
        'items' => [],
    ];

    for ($processed = 0; $processed < $batchSize && !empty($job['targets_pending']); $processed++) {
        $target = array_shift($job['targets_pending']);
        if (!is_array($target)) {
            continue;
        }

        $attempts = max(0, intval(array_value($target, 'attempts', 0)));
        try {
            $result = gmV2ExecuteSingleTargetCommand($config, $commandKey, $commandPayload, $target);
            $job['targets_completed'][] = [
                'target' => $target,
                'result' => $result,
                'executed_at' => gmdate('c'),
                'attempts' => ($attempts + 1),
            ];
            $attemptRecord['items'][] = [
                'target' => $target,
                'success' => true,
                'attempts' => ($attempts + 1),
            ];
        } catch (InvalidArgumentException $e) {
            $error = $e->getMessage();
            $attemptRecord['items'][] = [
                'target' => $target,
                'success' => false,
                'attempts' => ($attempts + 1),
                'error' => $error,
                'retryable' => false,
            ];
            $job['targets_failed'][] = [
                'target' => $target,
                'error' => $error,
                'failed_at' => gmdate('c'),
                'attempts' => ($attempts + 1),
                'retryable' => false,
            ];
        } catch (Exception $e) {
            $error = $e->getMessage();
            $attemptRecord['items'][] = [
                'target' => $target,
                'success' => false,
                'attempts' => ($attempts + 1),
                'error' => $error,
                'retryable' => true,
            ];

            if (($attempts + 1) < $retryLimit) {
                $target['attempts'] = $attempts + 1;
                $target['last_error'] = $error;
                $job['targets_retry'][] = $target;
                $job['next_retry_at'] = gmdate('c', $now + $backoffSeconds);
            } else {
                $job['targets_failed'][] = [
                    'target' => $target,
                    'error' => $error,
                    'failed_at' => gmdate('c'),
                    'attempts' => ($attempts + 1),
                ];
            }
        }
    }

    $attemptRecord['finished_at'] = gmdate('c');
    $attemptRecord['remaining_pending'] = count((array) array_value($job, 'targets_pending', []));
    $attemptRecord['remaining_retry'] = count((array) array_value($job, 'targets_retry', []));
    $attemptPath = gmV2QueueAttemptPath($config, $jobId, buildOperationId('attempt'));
    writeAtomicFile($attemptPath, safeJsonEncode($attemptRecord));

    if (empty($job['targets_pending']) && empty($job['targets_retry'])) {
        $job['status'] = empty($job['targets_failed']) ? 'completed' : 'completed_with_errors';
        $job['completed_at'] = gmdate('c');
        $job['next_retry_at'] = null;
    } elseif (empty($job['targets_pending']) && !empty($job['targets_retry'])) {
        $job['status'] = 'retry_wait';
    } else {
        $job['status'] = 'queued';
    }

    gmV2WriteJob($config, $job);
    gmV2AppendAudit($config, 'job_progress', [
        'job_id' => $jobId,
        'status' => array_value($job, 'status', 'queued'),
        'completed_count' => count((array) array_value($job, 'targets_completed', [])),
        'failed_count' => count((array) array_value($job, 'targets_failed', [])),
        'pending_count' => count((array) array_value($job, 'targets_pending', [])),
        'retry_count' => count((array) array_value($job, 'targets_retry', [])),
    ]);

    return $job;
}

function gmV2RunQueueWorker(array $config, array $options = [])
{
    $paths = gmV2EnsureEnvironment($config);
    $lockHandle = @fopen($paths['lock_file'], 'c+');
    if (!is_resource($lockHandle)) {
        throw new Exception('Nao foi possivel abrir lock do worker da fila');
    }

    if (!@flock($lockHandle, LOCK_EX | LOCK_NB)) {
        return [
            'success' => true,
            'skipped' => true,
            'reason' => 'worker_locked',
            'checked_at' => gmdate('c'),
        ];
    }

    $result = [
        'success' => true,
        'checked_at' => gmdate('c'),
        'processed_jobs' => [],
        'scan_limit' => max(1, intval(array_value($config, 'gm_v2_queue_scan_limit', 20))),
    ];

    try {
        $files = glob(rtrim(gmV2QueueJobsDir($config), '/\\') . DIRECTORY_SEPARATOR . '*.json');
        if (!is_array($files)) {
            $files = [];
        }

        usort($files, function ($a, $b) {
            return intval(@filemtime($a)) <=> intval(@filemtime($b));
        });

        $scanLimit = max(1, intval(array_value($config, 'gm_v2_queue_scan_limit', 20)));
        foreach (array_slice($files, 0, $scanLimit) as $file) {
            $raw = @file_get_contents($file);
            $job = json_decode((string) $raw, true);
            if (!is_array($job)) {
                continue;
            }

            $status = trim((string) array_value($job, 'status', 'queued'));
            if (!in_array($status, ['queued', 'processing', 'retry_wait'], true)) {
                continue;
            }

            $due = trim((string) array_value($job, 'next_retry_at', ''));
            if ($due !== '' && strtotime($due) > time() && $status === 'retry_wait') {
                continue;
            }

            $processedJob = gmV2ProcessQueueJob($config, $job);
            $result['processed_jobs'][] = gmV2JobSummary($processedJob);
        }
    } finally {
        @flock($lockHandle, LOCK_UN);
        @fclose($lockHandle);
    }

    return $result;
}

function gmV2SchedulePath(array $config, $scheduleId)
{
    return rtrim(gmV2SchedulesDir($config), '/\\') . DIRECTORY_SEPARATOR . trim((string) $scheduleId) . '.json';
}

function gmV2ReadSchedule(array $config, $scheduleId)
{
    $path = gmV2SchedulePath($config, $scheduleId);
    if (!is_file($path) || !is_readable($path)) {
        return null;
    }

    $raw = @file_get_contents($path);
    if (!is_string($raw) || trim($raw) === '') {
        return null;
    }

    $decoded = json_decode($raw, true);
    return (json_last_error() === JSON_ERROR_NONE && is_array($decoded)) ? $decoded : null;
}

function gmV2WriteSchedule(array $config, array $schedule)
{
    gmV2EnsureEnvironment($config);
    $schedule['updated_at'] = gmdate('c');
    $path = gmV2SchedulePath($config, array_value($schedule, 'id', ''));
    writeAtomicFile($path, safeJsonEncode($schedule));
    return $path;
}

function gmV2ScheduleSummary(array $schedule)
{
    return [
        'id' => trim((string) array_value($schedule, 'id', '')),
        'name' => trim((string) array_value($schedule, 'name', '')),
        'command_key' => trim((string) array_value($schedule, 'command_key', '')),
        'enabled' => !empty($schedule['enabled']),
        'weekdays' => array_values((array) array_value($schedule, 'weekdays', [])),
        'time_of_day' => trim((string) array_value($schedule, 'time_of_day', '')),
        'timezone' => trim((string) array_value($schedule, 'timezone', '')),
        'created_at' => array_value($schedule, 'created_at', null),
        'updated_at' => array_value($schedule, 'updated_at', null),
        'actor' => array_value($schedule, 'actor', []),
        'updated_by' => array_value($schedule, 'updated_by', []),
        'selection' => array_value($schedule, 'selection', []),
        'preview_count' => intval(array_value(array_value($schedule, 'preview', []), 'count', 0)),
        'preview_warnings' => array_value(array_value($schedule, 'preview', []), 'warnings', []),
        'next_run_at' => array_value($schedule, 'next_run_at', null),
        'next_retry_at' => array_value($schedule, 'next_retry_at', null),
        'last_run_at' => array_value($schedule, 'last_run_at', null),
        'last_job_id' => array_value($schedule, 'last_job_id', null),
        'last_result' => array_value($schedule, 'last_result', null),
        'last_error' => array_value($schedule, 'last_error', null),
        'last_error_at' => array_value($schedule, 'last_error_at', null),
    ];
}

function gmV2ListSchedules(array $config, $limit = 50)
{
    gmV2EnsureEnvironment($config);
    $files = glob(rtrim(gmV2SchedulesDir($config), '/\\') . DIRECTORY_SEPARATOR . '*.json');
    if (!is_array($files)) {
        return [];
    }

    usort($files, function ($a, $b) {
        return intval(@filemtime($b)) <=> intval(@filemtime($a));
    });

    $limit = max(1, min(200, intval($limit)));
    $items = [];
    foreach (array_slice($files, 0, $limit) as $file) {
        $raw = @file_get_contents($file);
        $decoded = json_decode((string) $raw, true);
        if (is_array($decoded)) {
            $items[] = gmV2ScheduleSummary($decoded);
        }
    }

    return $items;
}

function gmV2BuildSchedulePreviewSnapshot(array $config, array $request)
{
    try {
        $preview = gmV2PreviewBulkTargetsPayload($config, $request);
        return [
            'available' => true,
            'count' => intval(array_value($preview, 'count', 0)),
            'sample_targets' => array_value($preview, 'sample_targets', []),
            'warnings' => array_value($preview, 'warnings', []),
            'previewed_at' => array_value($preview, 'previewed_at', gmdate('c')),
        ];
    } catch (Exception $e) {
        return [
            'available' => false,
            'count' => 0,
            'sample_targets' => [],
            'warnings' => [],
            'error' => $e->getMessage(),
            'previewed_at' => gmdate('c'),
        ];
    }
}

function gmV2NormalizeScheduleRequest(array $config, array $request, array $existing = [])
{
    $base = [];
    if (!empty($existing)) {
        $base = array_merge((array) array_value($existing, 'command_payload', []), [
            'command_key' => array_value($existing, 'command_key', ''),
            'selection' => array_value($existing, 'selection', []),
            'name' => array_value($existing, 'name', ''),
            'weekdays' => array_value($existing, 'weekdays', []),
            'time_of_day' => array_value($existing, 'time_of_day', ''),
            'timezone' => array_value($existing, 'timezone', array_value($config, 'gm_v2_schedule_default_timezone', 'America/Sao_Paulo')),
            'enabled' => !empty($existing['enabled']),
        ]);
    }

    $merged = $base;
    foreach ($request as $key => $value) {
        if ($key === 'selection' && is_array($value)) {
            $merged['selection'] = $value;
        } else {
            $merged[$key] = $value;
        }
    }

    $commandKey = gmV2NormalizeScheduleCommandKey($config, firstArrayValue($merged, ['command_key', 'commandKey', 'command'], ''));
    $selectionSource = $merged;
    unset(
        $selectionSource['name'],
        $selectionSource['label'],
        $selectionSource['schedule_name'],
        $selectionSource['weekdays'],
        $selectionSource['days_of_week'],
        $selectionSource['day_of_week'],
        $selectionSource['weekday'],
        $selectionSource['dow'],
        $selectionSource['time_of_day'],
        $selectionSource['time'],
        $selectionSource['run_time'],
        $selectionSource['run_at_time'],
        $selectionSource['timezone'],
        $selectionSource['tz'],
        $selectionSource['enabled'],
        $selectionSource['active'],
        $selectionSource['paused'],
        $selectionSource['schedule_id'],
        $selectionSource['scheduleId'],
        $selectionSource['id']
    );
    $selection = gmV2NormalizeSelection($selectionSource, $config);
    if (!gmV2SelectionHasAnyCriteria($selection)) {
        throw new InvalidArgumentException('Selecao obrigatoria para schedule bulk');
    }

    $weekdays = gmV2NormalizeWeekdayList(firstArrayValue($merged, ['weekdays', 'days_of_week', 'day_of_week', 'weekday', 'dow'], []));
    if (empty($weekdays)) {
        throw new InvalidArgumentException('weekdays obrigatorio');
    }

    $timeOfDay = gmV2NormalizeTimeOfDay(firstArrayValue($merged, ['time_of_day', 'time', 'run_time', 'run_at_time'], ''));
    if ($timeOfDay === '') {
        throw new InvalidArgumentException('time_of_day invalido');
    }

    $timezone = gmV2NormalizeTimezoneName(firstArrayValue($merged, ['timezone', 'tz'], ''), $config);
    $enabledValue = firstArrayValue($merged, ['enabled', 'active'], null);
    $pausedValue = firstArrayValue($merged, ['paused'], null);
    if ($enabledValue === null && $pausedValue === null) {
        $enabled = array_key_exists('enabled', $existing) ? !empty($existing['enabled']) : true;
    } elseif ($enabledValue !== null) {
        $enabled = truthyValue($enabledValue);
    } else {
        $enabled = !truthyValue($pausedValue);
    }

    $name = trimOneLineText(firstArrayValue($merged, ['name', 'label', 'schedule_name'], array_value($existing, 'name', '')));
    if ($name === '') {
        $name = 'Schedule ' . $commandKey . ' ' . implode(',', $weekdays) . ' ' . substr($timeOfDay, 0, 5);
    }

    $commandSource = $merged;
    unset(
        $commandSource['name'],
        $commandSource['label'],
        $commandSource['schedule_name'],
        $commandSource['weekdays'],
        $commandSource['days_of_week'],
        $commandSource['day_of_week'],
        $commandSource['weekday'],
        $commandSource['dow'],
        $commandSource['time_of_day'],
        $commandSource['time'],
        $commandSource['run_time'],
        $commandSource['run_at_time'],
        $commandSource['timezone'],
        $commandSource['tz'],
        $commandSource['enabled'],
        $commandSource['active'],
        $commandSource['paused'],
        $commandSource['schedule_id'],
        $commandSource['scheduleId'],
        $commandSource['id']
    );
    $commandPayload = gmV2CommandPayloadFromRequest($commandKey, $commandSource);
    gmV2ValidateBulkCommandTemplate($commandKey, $commandPayload, true);
    $preview = gmV2BuildSchedulePreviewSnapshot($config, array_merge($commandPayload, [
        'command_key' => $commandKey,
        'selection' => $selection,
    ]));

    $nextRunAt = null;
    if ($enabled) {
        $nextRunAt = gmV2ComputeNextScheduleRunAt($weekdays, $timeOfDay, $timezone);
    }

    return [
        'name' => $name,
        'command_key' => $commandKey,
        'selection' => $selection,
        'command_payload' => $commandPayload,
        'weekdays' => $weekdays,
        'time_of_day' => $timeOfDay,
        'timezone' => $timezone,
        'enabled' => $enabled,
        'preview' => $preview,
        'next_run_at' => $nextRunAt,
        'next_retry_at' => null,
    ];
}

function gmV2CreateBulkSchedule(array $config, array $request)
{
    gmV2EnsureEnvironment($config);
    $payload = gmV2NormalizeScheduleRequest($config, $request);
    $scheduleId = buildOperationId('gmv2-schedule');
    $actor = [
        'name' => gmV2RequestActor($request),
        'ip' => gmV2RequestIp(),
    ];

    $schedule = array_merge([
        'type' => 'gm_v2_schedule',
        'id' => $scheduleId,
        'created_at' => gmdate('c'),
        'updated_at' => gmdate('c'),
        'actor' => $actor,
        'updated_by' => $actor,
        'last_run_at' => null,
        'last_job_id' => null,
        'last_job_file' => null,
        'last_result' => null,
        'last_error' => null,
        'last_error_at' => null,
    ], $payload);

    $scheduleFile = gmV2WriteSchedule($config, $schedule);
    gmV2AppendAudit($config, 'schedule_created', [
        'schedule_id' => $scheduleId,
        'command_key' => array_value($schedule, 'command_key', ''),
        'actor' => $actor,
        'selection' => array_value($schedule, 'selection', []),
        'next_run_at' => array_value($schedule, 'next_run_at', null),
    ]);

    return [
        'success' => true,
        'schedule' => gmV2ScheduleSummary($schedule),
        'schedule_file' => $scheduleFile,
        'audit_file' => gmV2AuditFile($config),
    ];
}

function gmV2UpdateBulkSchedule(array $config, $scheduleId, array $request)
{
    $existing = gmV2ReadSchedule($config, $scheduleId);
    if (!is_array($existing)) {
        throw new InvalidArgumentException('Schedule nao encontrado');
    }

    $payload = gmV2NormalizeScheduleRequest($config, $request, $existing);
    $updatedBy = [
        'name' => gmV2RequestActor($request),
        'ip' => gmV2RequestIp(),
    ];

    $schedule = array_merge($existing, $payload, [
        'id' => array_value($existing, 'id', trim((string) $scheduleId)),
        'type' => 'gm_v2_schedule',
        'updated_by' => $updatedBy,
        'last_error' => null,
        'last_error_at' => null,
    ]);

    $scheduleFile = gmV2WriteSchedule($config, $schedule);
    gmV2AppendAudit($config, 'schedule_updated', [
        'schedule_id' => array_value($schedule, 'id', ''),
        'command_key' => array_value($schedule, 'command_key', ''),
        'actor' => $updatedBy,
        'selection' => array_value($schedule, 'selection', []),
        'next_run_at' => array_value($schedule, 'next_run_at', null),
    ]);

    return [
        'success' => true,
        'schedule' => gmV2ScheduleSummary($schedule),
        'schedule_file' => $scheduleFile,
        'audit_file' => gmV2AuditFile($config),
    ];
}

function gmV2DeleteBulkSchedule(array $config, $scheduleId, array $request = [])
{
    $schedule = gmV2ReadSchedule($config, $scheduleId);
    if (!is_array($schedule)) {
        throw new InvalidArgumentException('Schedule nao encontrado');
    }

    $path = gmV2SchedulePath($config, $scheduleId);
    if (is_file($path)) {
        @unlink($path);
    }

    gmV2AppendAudit($config, 'schedule_deleted', [
        'schedule_id' => trim((string) $scheduleId),
        'command_key' => array_value($schedule, 'command_key', ''),
        'actor' => [
            'name' => gmV2RequestActor($request),
            'ip' => gmV2RequestIp(),
        ],
    ]);

    return [
        'success' => true,
        'deleted' => true,
        'schedule_id' => trim((string) $scheduleId),
        'audit_file' => gmV2AuditFile($config),
    ];
}

function gmV2GetBulkSchedulePayload(array $config, $scheduleId)
{
    $schedule = gmV2ReadSchedule($config, $scheduleId);
    if (!is_array($schedule)) {
        throw new InvalidArgumentException('Schedule nao encontrado');
    }

    return [
        'success' => true,
        'schedule' => $schedule,
        'summary' => gmV2ScheduleSummary($schedule),
        'schedule_file' => gmV2SchedulePath($config, $scheduleId),
    ];
}

function gmV2GetBulkSchedulesPayload(array $config, $limit = 50)
{
    return [
        'success' => true,
        'schedules' => gmV2ListSchedules($config, $limit),
        'limit' => max(1, min(200, intval($limit))),
        'collected_at' => gmdate('c'),
    ];
}

function gmV2IsScheduleDue(array $schedule, $nowTs = null)
{
    if (empty($schedule['enabled'])) {
        return false;
    }

    $nowTs = ($nowTs === null) ? time() : intval($nowTs);
    $nextRunAt = trim((string) array_value($schedule, 'next_run_at', ''));
    if ($nextRunAt === '') {
        return false;
    }

    $nextRetryAt = trim((string) array_value($schedule, 'next_retry_at', ''));
    if ($nextRetryAt !== '' && strtotime($nextRetryAt) > $nowTs) {
        return false;
    }

    $runTs = strtotime($nextRunAt);
    return ($runTs !== false && $runTs <= $nowTs);
}

function gmV2ProcessDueSchedule(array $config, array $schedule)
{
    $scheduleId = trim((string) array_value($schedule, 'id', ''));
    if ($scheduleId === '') {
        throw new InvalidArgumentException('Schedule invalido sem id');
    }

    if (empty($schedule['enabled'])) {
        return $schedule;
    }

    if (!gmV2IsScheduleDue($schedule)) {
        return $schedule;
    }

    $request = array_merge((array) array_value($schedule, 'command_payload', []), [
        'command_key' => array_value($schedule, 'command_key', ''),
        'selection' => array_value($schedule, 'selection', []),
        'actor' => trim((string) array_value(array_value($schedule, 'actor', []), 'name', 'schedule')),
        'schedule_id' => $scheduleId,
    ]);

    try {
        $queued = gmV2CreateQueuedJob($config, $request);
        $jobId = trim((string) array_value(array_value($queued, 'job', []), 'id', ''));
        $from = new DateTimeImmutable(trim((string) array_value($schedule, 'next_run_at', 'now')));

        $schedule['last_run_at'] = gmdate('c');
        $schedule['last_job_id'] = $jobId;
        $schedule['last_job_file'] = array_value($queued, 'job_file', null);
        $schedule['last_result'] = 'queued';
        $schedule['last_error'] = null;
        $schedule['last_error_at'] = null;
        $schedule['next_retry_at'] = null;
        $schedule['next_run_at'] = gmV2ComputeNextScheduleRunAt(
            (array) array_value($schedule, 'weekdays', []),
            array_value($schedule, 'time_of_day', ''),
            array_value($schedule, 'timezone', array_value($config, 'gm_v2_schedule_default_timezone', 'America/Sao_Paulo')),
            $from->modify('+1 second')
        );

        gmV2WriteSchedule($config, $schedule);
        gmV2AppendAudit($config, 'schedule_triggered', [
            'schedule_id' => $scheduleId,
            'job_id' => $jobId,
            'command_key' => array_value($schedule, 'command_key', ''),
            'selection' => array_value($schedule, 'selection', []),
            'next_run_at' => array_value($schedule, 'next_run_at', null),
        ]);
    } catch (Exception $e) {
        $schedule['last_result'] = 'error';
        $schedule['last_error'] = $e->getMessage();
        $schedule['last_error_at'] = gmdate('c');
        $schedule['next_retry_at'] = gmdate('c', time() + max(60, intval(array_value($config, 'gm_v2_schedule_retry_backoff_seconds', 300))));
        gmV2WriteSchedule($config, $schedule);
        gmV2AppendAudit($config, 'schedule_error', [
            'schedule_id' => $scheduleId,
            'command_key' => array_value($schedule, 'command_key', ''),
            'error' => $e->getMessage(),
            'next_retry_at' => array_value($schedule, 'next_retry_at', null),
        ]);
    }

    return $schedule;
}

function gmV2RunScheduleWorker(array $config, array $options = [])
{
    $paths = gmV2EnsureEnvironment($config);
    $lockHandle = @fopen($paths['schedule_lock_file'], 'c+');
    if (!is_resource($lockHandle)) {
        throw new Exception('Nao foi possivel abrir lock do worker de schedules');
    }

    if (!@flock($lockHandle, LOCK_EX | LOCK_NB)) {
        return [
            'success' => true,
            'skipped' => true,
            'reason' => 'schedule_worker_locked',
            'checked_at' => gmdate('c'),
        ];
    }

    $result = [
        'success' => true,
        'checked_at' => gmdate('c'),
        'processed_schedules' => [],
        'scan_limit' => max(1, intval(array_value($config, 'gm_v2_schedule_scan_limit', 50))),
    ];

    try {
        $files = glob(rtrim(gmV2SchedulesDir($config), '/\\') . DIRECTORY_SEPARATOR . '*.json');
        if (!is_array($files)) {
            $files = [];
        }

        usort($files, function ($a, $b) {
            return intval(@filemtime($a)) <=> intval(@filemtime($b));
        });

        $scanLimit = max(1, intval(array_value($config, 'gm_v2_schedule_scan_limit', 50)));
        foreach (array_slice($files, 0, $scanLimit) as $file) {
            $raw = @file_get_contents($file);
            $schedule = json_decode((string) $raw, true);
            if (!is_array($schedule) || empty($schedule['enabled'])) {
                continue;
            }

            $nextRunAt = trim((string) array_value($schedule, 'next_run_at', ''));
            if ($nextRunAt === '') {
                $schedule['next_run_at'] = gmV2ComputeNextScheduleRunAt(
                    (array) array_value($schedule, 'weekdays', []),
                    array_value($schedule, 'time_of_day', ''),
                    array_value($schedule, 'timezone', array_value($config, 'gm_v2_schedule_default_timezone', 'America/Sao_Paulo'))
                );
                gmV2WriteSchedule($config, $schedule);
            }

            if (!gmV2IsScheduleDue($schedule)) {
                continue;
            }

            $processed = gmV2ProcessDueSchedule($config, $schedule);
            $result['processed_schedules'][] = gmV2ScheduleSummary($processed);
        }
    } finally {
        @flock($lockHandle, LOCK_UN);
        @fclose($lockHandle);
    }

    return $result;
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

function mallCashEnabled(array $config)
{
    return truthyValue(array_value($config, 'mall_cash_enabled', true));
}

function mallCashUnitsPerGold(array $config)
{
    return max(1, intval(array_value($config, 'mall_cash_units_per_gold', 100)));
}

function mallCashUnitsToGold($units, $unitsPerGold)
{
    $unitsPerGold = max(1, intval($unitsPerGold));
    return round(floatval($units) / $unitsPerGold, 2);
}

function mergeMallCashRequest(array $request)
{
    $merged = mergedSecurityRequest($request);

    foreach (['gm', 'account', 'cash', 'mall', 'reward', 'compensation'] as $field) {
        $candidate = array_value($request, $field, null);
        if (is_array($candidate)) {
            $merged = array_merge($merged, $candidate);
        }
    }

    return $merged;
}

function resolveMallCashTarget(array $request, array $config, GamedProtocol $proto)
{
    $merged = mergeMallCashRequest($request);
    $roleid = securityResolveRoleId($merged);
    $userid = intval(firstArrayValue($merged, ['userid', 'user_id', 'account_id', 'accountId', 'target_userid'], 0));
    $roleBase = null;
    $resolvedVia = 'userid';

    if ($roleid > 0) {
        $resolved = securityResolveUserIdFromRole($proto, $config, $roleid);
        $resolvedUserId = intval(array_value($resolved, 'userid', 0));
        $roleBase = is_array(array_value($resolved, 'base', null)) ? array_value($resolved, 'base', null) : null;
        if ($userid > 0 && $resolvedUserId > 0 && $userid !== $resolvedUserId) {
            throw new InvalidArgumentException('userid informado nao corresponde ao roleid informado');
        }
        if ($userid <= 0) {
            $userid = $resolvedUserId;
            $resolvedVia = 'roleid';
        } else {
            $resolvedVia = 'userid+roleid';
        }
    }

    if ($userid <= 0) {
        throw new InvalidArgumentException('userid ou roleid valido obrigatorio');
    }

    return [
        'userid' => $userid,
        'roleid' => $roleid,
        'role_name' => is_array($roleBase) ? trim((string) array_value($roleBase, 'name', '')) : '',
        'role_base' => $roleBase,
        'resolved_via' => $resolvedVia,
    ];
}

function buildMallCashWalletSnapshot(array $userInfo, array $config)
{
    $unitsPerGold = mallCashUnitsPerGold($config);
    $cash = intval(array_value($userInfo, 'cash', 0));
    $cashAdd = intval(array_value($userInfo, 'cash_add', 0));
    $cashBuy = intval(array_value($userInfo, 'cash_buy', 0));
    $cashSell = intval(array_value($userInfo, 'cash_sell', 0));
    $cashUsed = intval(array_value($userInfo, 'cash_used', 0));

    return [
        'units_per_gold' => $unitsPerGold,
        'cash_units' => $cash,
        'cash_gold' => mallCashUnitsToGold($cash, $unitsPerGold),
        'cash_total_units' => ($cash + $cashAdd),
        'cash_total_gold' => mallCashUnitsToGold($cash + $cashAdd, $unitsPerGold),
        'money' => intval(array_value($userInfo, 'money', 0)),
        'cash_add_units' => $cashAdd,
        'cash_add_gold' => mallCashUnitsToGold($cashAdd, $unitsPerGold),
        'cash_buy_units' => $cashBuy,
        'cash_buy_gold' => mallCashUnitsToGold($cashBuy, $unitsPerGold),
        'cash_sell_units' => $cashSell,
        'cash_sell_gold' => mallCashUnitsToGold($cashSell, $unitsPerGold),
        'cash_used_units' => $cashUsed,
        'cash_used_gold' => mallCashUnitsToGold($cashUsed, $unitsPerGold),
    ];
}

function fetchMallCashBalanceDetails(array $config, array $target, GamedProtocol $proto = null)
{
    if (!mallCashEnabled($config)) {
        throw new Exception('Gold da loja esta desabilitado na configuracao da API');
    }

    if (!$proto) {
        $proto = new GamedProtocol();
    }

    $userInfo = $proto->getUserInfo(intval(array_value($target, 'userid', 0)), $config['gamedbd_ip'], $config['gamedbd_port']);
    return [
        'target' => [
            'userid' => intval(array_value($target, 'userid', 0)),
            'roleid' => intval(array_value($target, 'roleid', 0)),
            'role_name' => trim((string) array_value($target, 'role_name', '')),
            'resolved_via' => trim((string) array_value($target, 'resolved_via', '')),
        ],
        'account' => [
            'logicuid' => intval(array_value($userInfo, 'logicuid', 0)),
            'rolelist' => intval(array_value($userInfo, 'rolelist', 0)),
            'status' => intval(array_value($userInfo, 'status', 0)),
        ],
        'wallet' => buildMallCashWalletSnapshot($userInfo, $config),
        'login' => [
            'ip' => trim((string) array_value($userInfo, 'login_ip', '')),
            'time' => array_value($userInfo, 'login_time', null),
            'time_unix' => intval(array_value($userInfo, 'login_time_unix', 0)),
        ],
    ];
}

function mallCashBalanceChangeFromSnapshots($before, $after, $unitsPerGold)
{
    if (!is_array($before) || !is_array($after)) {
        return null;
    }

    $beforeWallet = array_value($before, 'wallet', []);
    $afterWallet = array_value($after, 'wallet', []);

    $deltaUnits = intval(array_value($afterWallet, 'cash_units', 0)) - intval(array_value($beforeWallet, 'cash_units', 0));
    $deltaCashAddUnits = intval(array_value($afterWallet, 'cash_add_units', 0)) - intval(array_value($beforeWallet, 'cash_add_units', 0));
    $deltaTotalUnits = intval(array_value($afterWallet, 'cash_total_units', 0)) - intval(array_value($beforeWallet, 'cash_total_units', 0));

    return [
        'cash_units' => $deltaUnits,
        'cash_gold' => mallCashUnitsToGold($deltaUnits, $unitsPerGold),
        'cash_add_units' => $deltaCashAddUnits,
        'cash_add_gold' => mallCashUnitsToGold($deltaCashAddUnits, $unitsPerGold),
        'cash_total_units' => $deltaTotalUnits,
        'cash_total_gold' => mallCashUnitsToGold($deltaTotalUnits, $unitsPerGold),
    ];
}

function mallCashObservedAppliedUnits($balanceChange)
{
    if (!is_array($balanceChange)) {
        return 0;
    }

    return max(
        intval(array_value($balanceChange, 'cash_units', 0)),
        intval(array_value($balanceChange, 'cash_add_units', 0)),
        intval(array_value($balanceChange, 'cash_total_units', 0))
    );
}

function waitForMallCashGrantObservation(array $config, array $target, $before, $requestedCashUnits, GamedProtocol $proto)
{
    $requestedCashUnits = max(0, intval($requestedCashUnits));
    $unitsPerGold = mallCashUnitsPerGold($config);
    $timeoutSeconds = max(0, intval(array_value($config, 'mall_cash_verify_timeout_seconds', 6)));
    $pollIntervalUs = max(50000, intval(array_value($config, 'mall_cash_verify_poll_interval_us', 250000)));

    $lastAfter = null;
    $lastWarning = '';
    $lastBalanceChange = null;
    $attempts = 0;
    $deadline = microtime(true) + $timeoutSeconds;

    do {
        $attempts++;
        try {
            $lastAfter = fetchMallCashBalanceDetails($config, $target, $proto);
            $lastWarning = '';
            $lastBalanceChange = mallCashBalanceChangeFromSnapshots($before, $lastAfter, $unitsPerGold);
            if (mallCashObservedAppliedUnits($lastBalanceChange) >= $requestedCashUnits) {
                return [
                    'after' => $lastAfter,
                    'warning' => '',
                    'balance_change' => $lastBalanceChange,
                    'attempts' => $attempts,
                    'observed' => true,
                ];
            }
        } catch (Exception $e) {
            $lastWarning = $e->getMessage();
        }

        if (microtime(true) >= $deadline) {
            break;
        }
        usleep($pollIntervalUs);
    } while (true);

    return [
        'after' => $lastAfter,
        'warning' => $lastWarning,
        'balance_change' => $lastBalanceChange,
        'attempts' => $attempts,
        'observed' => (mallCashObservedAppliedUnits($lastBalanceChange) >= $requestedCashUnits),
    ];
}

function getMallCashBalanceSnapshot(array $config, array $request)
{
    $proto = new GamedProtocol();
    $target = resolveMallCashTarget($request, $config, $proto);
    $details = fetchMallCashBalanceDetails($config, $target, $proto);

    return [
        'success' => true,
        'target' => array_value($details, 'target', []),
        'account' => array_value($details, 'account', []),
        'wallet' => array_value($details, 'wallet', []),
        'login' => array_value($details, 'login', []),
        'collected_at' => gmdate('c'),
    ];
}

function grantMallCashConfirmOk(array $request)
{
    $confirm = strtoupper(trim((string) firstArrayValue($request, ['confirm', 'confirmation', 'confirm_token'], '')));
    return in_array($confirm, ['GRANT_MALL_CASH', 'GRANT_SHOP_GOLD', 'ADD_MALL_CASH'], true);
}

function buildGrantMallCashPayload(array $request, array $config, GamedProtocol $proto)
{
    if (!mallCashEnabled($config)) {
        throw new InvalidArgumentException('Gold da loja esta desabilitado na configuracao da API');
    }

    $merged = mergeMallCashRequest($request);
    $target = resolveMallCashTarget($merged, $config, $proto);
    $unitsPerGold = mallCashUnitsPerGold($config);

    $amountRaw = firstArrayValue($merged, ['amount', 'gold', 'cash_gold', 'mall_gold', 'value'], null);
    $cashUnitsRaw = firstArrayValue($merged, ['cash_units', 'cashUnits', 'raw_cash_units'], null);

    $amountProvided = ($amountRaw !== null && trim((string) $amountRaw) !== '');
    $cashUnitsProvided = ($cashUnitsRaw !== null && trim((string) $cashUnitsRaw) !== '');

    $amount = 0.0;
    if ($amountProvided) {
        if (!is_numeric($amountRaw)) {
            throw new InvalidArgumentException('amount invalido');
        }
        $amount = floatval($amountRaw);
    }

    $cashUnits = 0;
    if ($cashUnitsProvided) {
        if (!is_numeric($cashUnitsRaw)) {
            throw new InvalidArgumentException('cash_units invalido');
        }
        $cashUnits = intval(round(floatval($cashUnitsRaw)));
    }

    if (!$amountProvided && !$cashUnitsProvided) {
        throw new InvalidArgumentException('Informe amount ou cash_units para grantMallCash');
    }

    if ($amountProvided && $amount <= 0) {
        throw new InvalidArgumentException('amount invalido');
    }

    if ($cashUnitsProvided && $cashUnits <= 0) {
        throw new InvalidArgumentException('cash_units invalido');
    }

    if ($amountProvided && !$cashUnitsProvided) {
        $cashUnits = intval(round($amount * $unitsPerGold));
    } elseif (!$amountProvided && $cashUnitsProvided) {
        $amount = mallCashUnitsToGold($cashUnits, $unitsPerGold);
    } else {
        $calculatedCashUnits = intval(round($amount * $unitsPerGold));
        if ($calculatedCashUnits !== $cashUnits) {
            throw new InvalidArgumentException('amount e cash_units conflitantes');
        }
    }

    $maxAmount = max(1, intval(array_value($config, 'mall_cash_max_amount', 1000000)));
    $maxCashUnits = max($unitsPerGold, intval(array_value($config, 'mall_cash_max_cash_units', 100000000)));
    if ($amount > $maxAmount) {
        throw new InvalidArgumentException('amount excede o limite configurado de ' . $maxAmount . ' gold');
    }
    if ($cashUnits > $maxCashUnits) {
        throw new InvalidArgumentException('cash_units excede o limite configurado de ' . $maxCashUnits);
    }

    return [
        'action' => 'grantMallCash',
        'userid' => intval(array_value($target, 'userid', 0)),
        'roleid' => intval(array_value($target, 'roleid', 0)),
        'role_name' => trim((string) array_value($target, 'role_name', '')),
        'resolved_via' => trim((string) array_value($target, 'resolved_via', '')),
        'amount' => $amount,
        'cash_units' => $cashUnits,
        'units_per_gold' => $unitsPerGold,
        'reason' => securityReasonFromRequest($merged, $config),
        'dry_run' => truthyValue(firstArrayValue($merged, ['dry_run', 'dryRun'], false)),
        'db_name' => trim((string) array_value($config, 'mall_cash_db_name', 'pw')),
    ];
}

function executeMallCashGrantCommand(array $config, array $payload)
{
    $command = trim((string) array_value($config, 'mall_cash_grant_command', ''));
    if ($command === '') {
        throw new Exception('Comando de grantMallCash nao configurado');
    }

    $dbName = trim((string) array_value($payload, 'db_name', array_value($config, 'mall_cash_db_name', 'pw')));
    if ($dbName === '') {
        throw new Exception('Banco de dados do mall cash nao configurado');
    }

    $result = executeServerOpsCommand(
        $command
        . ' ' . escapeshellarg((string) intval(array_value($payload, 'userid', 0)))
        . ' ' . escapeshellarg((string) intval(array_value($payload, 'cash_units', 0)))
        . ' ' . escapeshellarg($dbName),
        max(0, intval(array_value($config, 'restore_now_timeout_seconds', 1800)))
    );

    $parsed = is_array(array_value($result, 'parsed', null)) ? array_value($result, 'parsed', []) : [];
    if (empty($result['success']) && empty($parsed)) {
        throw new Exception(
            'grantMallCash falhou (exit ' . intval(array_value($result, 'exit_code', 1)) . '): '
            . trim((string) array_value($result, 'stdout_excerpt', ''))
        );
    }
    if (empty($parsed)) {
        $parsed = [
            'stdout' => trim((string) array_value($result, 'stdout_excerpt', '')),
        ];
    }

    return $parsed;
}

function handleGrantMallCashRequest(array $config, array $request)
{
    $proto = new GamedProtocol();
    $payload = buildGrantMallCashPayload($request, $config, $proto);
    $target = [
        'userid' => intval(array_value($payload, 'userid', 0)),
        'roleid' => intval(array_value($payload, 'roleid', 0)),
        'role_name' => trim((string) array_value($payload, 'role_name', '')),
        'resolved_via' => trim((string) array_value($payload, 'resolved_via', '')),
    ];

    $before = null;
    $beforeWarning = '';
    try {
        $before = fetchMallCashBalanceDetails($config, $target, $proto);
    } catch (Exception $e) {
        $beforeWarning = $e->getMessage();
    }

    if (!empty($payload['dry_run'])) {
        $response = [
            'success' => true,
            'dry_run' => true,
            'gm_action' => [
                'action' => 'grantMallCash',
                'userid' => intval(array_value($payload, 'userid', 0)),
                'roleid' => intval(array_value($payload, 'roleid', 0)),
                'role_name' => trim((string) array_value($payload, 'role_name', '')),
                'amount' => floatval(array_value($payload, 'amount', 0)),
                'cash_units' => intval(array_value($payload, 'cash_units', 0)),
                'units_per_gold' => intval(array_value($payload, 'units_per_gold', 100)),
                'reason' => array_value($payload, 'reason', ''),
                'message' => 'Dry-run de grantMallCash validado com sucesso',
            ],
            'target' => $target,
            'wallet_before' => is_array($before) ? array_value($before, 'wallet', []) : null,
        ];
        if ($beforeWarning !== '') {
            $response['wallet_lookup_warning'] = $beforeWarning;
        }

        $gmHistoryWarning = '';
        $gmEntry = gmHistoryEntryBase($config, 'grantMallCash', [
            'status' => 'dry_run',
            'success' => true,
            'dry_run' => true,
            'reason' => array_value($payload, 'reason', ''),
            'target' => $target,
            'wallet_before' => is_array($before) ? array_value($before, 'wallet', []) : null,
            'grant' => [
                'amount' => floatval(array_value($payload, 'amount', 0)),
                'cash_units' => intval(array_value($payload, 'cash_units', 0)),
                'units_per_gold' => intval(array_value($payload, 'units_per_gold', 100)),
            ],
            'warning' => $beforeWarning,
            'message' => 'Dry-run de grantMallCash validado com sucesso',
        ]);
        if (gmAppendHistoryBestEffort($config, $gmEntry, $gmHistoryWarning)) {
            $response['gm_history_file'] = gmActionHistoryFile($config);
        } elseif ($gmHistoryWarning !== '') {
            $response['gm_history_warning'] = $gmHistoryWarning;
        }
        return $response;
    }

    if (!grantMallCashConfirmOk($request)) {
        throw new InvalidArgumentException('Confirmacao obrigatoria para grantMallCash. Envie confirm=GRANT_MALL_CASH');
    }

    $grantResult = executeMallCashGrantCommand($config, $payload);
    $after = null;
    $afterWarning = '';
    $verificationAttempts = 0;
    $balanceChange = null;
    if (is_array($before)) {
        $verification = waitForMallCashGrantObservation(
            $config,
            $target,
            $before,
            intval(array_value($payload, 'cash_units', 0)),
            $proto
        );
        $after = is_array(array_value($verification, 'after', null)) ? array_value($verification, 'after', null) : null;
        $afterWarning = trim((string) array_value($verification, 'warning', ''));
        $balanceChange = is_array(array_value($verification, 'balance_change', null)) ? array_value($verification, 'balance_change', null) : null;
        $verificationAttempts = intval(array_value($verification, 'attempts', 0));
    } else {
        try {
            $after = fetchMallCashBalanceDetails($config, $target, $proto);
        } catch (Exception $e) {
            $afterWarning = $e->getMessage();
        }
    }

    $requestedCashUnits = intval(array_value($payload, 'cash_units', 0));
    $errorCode = intval(array_value($grantResult, 'error_code', 0));
    $appliedUnits = mallCashObservedAppliedUnits($balanceChange);

    if ($errorCode !== 0 && $appliedUnits < $requestedCashUnits) {
        throw new Exception('Stored procedure usecash retornou error_code ' . $errorCode . ' sem refletir o credito esperado no saldo');
    }

    $response = [
        'success' => true,
        'message' => 'Gold da loja creditado com sucesso',
        'target' => $target,
        'grant' => [
            'amount' => floatval(array_value($payload, 'amount', 0)),
            'cash_units' => intval(array_value($payload, 'cash_units', 0)),
            'units_per_gold' => intval(array_value($payload, 'units_per_gold', 100)),
            'reason' => array_value($payload, 'reason', ''),
        ],
        'grant_result' => $grantResult,
        'wallet_before' => is_array($before) ? array_value($before, 'wallet', []) : null,
        'wallet_after' => is_array($after) ? array_value($after, 'wallet', []) : null,
        'balance_change' => $balanceChange,
        'verification_attempts' => $verificationAttempts,
    ];
    if ($errorCode !== 0) {
        $response['warning'] = 'usecash retornou error_code ' . $errorCode . ', mas o saldo refletiu o credito esperado.';
    }
    if ($beforeWarning !== '') {
        $response['wallet_before_warning'] = $beforeWarning;
    }
    if ($afterWarning !== '') {
        $response['wallet_after_warning'] = $afterWarning;
    }

    $gmHistoryWarning = '';
    $gmEntry = gmHistoryEntryBase($config, 'grantMallCash', [
        'status' => 'success',
        'success' => true,
        'dry_run' => false,
        'reason' => array_value($payload, 'reason', ''),
        'target' => $target,
        'grant' => [
            'amount' => floatval(array_value($payload, 'amount', 0)),
            'cash_units' => intval(array_value($payload, 'cash_units', 0)),
            'units_per_gold' => intval(array_value($payload, 'units_per_gold', 100)),
        ],
        'wallet_before' => is_array($before) ? array_value($before, 'wallet', []) : null,
        'wallet_after' => is_array($after) ? array_value($after, 'wallet', []) : null,
        'balance_change' => $balanceChange,
        'grant_result' => $grantResult,
        'warning' => trim(
            ($errorCode !== 0 ? ('usecash error_code=' . $errorCode . ' com credito confirmado no saldo') : '')
            . (($errorCode !== 0 && ($beforeWarning !== '' || $afterWarning !== '')) ? ' | ' : '')
            . $beforeWarning
            . (($beforeWarning !== '' && $afterWarning !== '') ? ' | ' : '')
            . $afterWarning
        ),
        'message' => 'Gold da loja creditado com sucesso',
    ]);
    if (gmAppendHistoryBestEffort($config, $gmEntry, $gmHistoryWarning)) {
        $response['gm_history_file'] = gmActionHistoryFile($config);
    } elseif ($gmHistoryWarning !== '') {
        $response['gm_history_warning'] = $gmHistoryWarning;
    }

    return $response;
}

function gmPermissionEnabled(array $config)
{
    return truthyValue(array_value($config, 'gm_permission_enabled', false))
        && trim((string) array_value($config, 'gm_permission_command', '')) !== '';
}

function gmPermissionRuleIdsFromValue($value)
{
    $items = [];
    if (is_array($value)) {
        $items = $value;
    } elseif (is_string($value) || is_numeric($value)) {
        $text = trim((string) $value);
        if ($text !== '') {
            $items = preg_split('/[\s,;:|]+/', $text, -1, PREG_SPLIT_NO_EMPTY);
        }
    }

    $ruleIds = [];
    foreach ((array) $items as $item) {
        if (!is_numeric($item)) {
            continue;
        }
        $rid = intval($item);
        if ($rid >= 0) {
            $ruleIds[] = $rid;
        }
    }

    $ruleIds = array_values(array_unique($ruleIds));
    sort($ruleIds, SORT_NUMERIC);
    return $ruleIds;
}

function gmPermissionRuleCatalog()
{
    return [
        0 => 'Alternar nome / ID',
        1 => 'Ocultar / ser Deus',
        2 => 'Online ou nao',
        3 => 'Conversa ou nao',
        4 => 'Mover para o papel',
        5 => 'Papel de busca',
        6 => 'Mover como sera',
        7 => 'Mover para NPC',
        8 => 'Mover para mapa (copiar)',
        9 => 'Melhore a velocidade',
        10 => 'Acompanhe o jogador',
        11 => 'Listar usuarios',
        100 => 'Forca offline',
        101 => 'Proibida conversa',
        102 => 'Proibir o comercio',
        103 => 'Proibir vender',
        104 => 'Transmissao',
        105 => 'Desligar o servidor',
        200 => 'Invocar monstro',
        201 => 'Dispel convocacao',
        202 => 'Pretender',
        203 => 'GM master',
        204 => 'Duplo exp',
        205 => 'Conexoes simultaneas (lambda)',
        206 => 'Gerente de atividades',
        207 => 'Nenhum comercio',
        208 => 'Sem leilao',
        209 => 'Sem correspondencia',
        210 => 'Nenhuma faccao',
        211 => 'Dinheiro Duplo',
        212 => 'Duplo Drop',
        213 => 'Duplo Alma',
        214 => 'Nenhum ponto de venda',
        215 => 'Interruptor PVP',
    ];
}

function gmPermissionDescribeRuleIds(array $ruleIds)
{
    $catalog = gmPermissionRuleCatalog();
    $described = [];
    foreach (gmPermissionRuleIdsFromValue($ruleIds) as $rid) {
        $described[] = [
            'rid' => $rid,
            'label' => array_key_exists($rid, $catalog) ? $catalog[$rid] : ('Regra GM ' . $rid),
            'known' => array_key_exists($rid, $catalog),
        ];
    }

    return $described;
}

function gmPermissionRuleIdsConfigured(array $config)
{
    return gmPermissionRuleIdsFromValue(array_value($config, 'gm_permission_rule_ids', []));
}

function mergeGmPermissionRequest(array $request)
{
    $merged = $request;
    foreach (['payload', 'permission', 'gm_permission', 'target', 'account'] as $field) {
        $candidate = array_value($request, $field, null);
        if (is_array($candidate)) {
            $merged = array_merge($merged, $candidate);
        }
    }

    return $merged;
}

function gmPermissionConfirmOk(array $request, $mode = 'grant')
{
    $confirm = strtoupper(trim((string) firstArrayValue($request, ['confirm', 'confirmation', 'confirm_token'], '')));
    if ($mode === 'revoke') {
        return in_array($confirm, ['REVOKE_GM_PERMISSION', 'REMOVE_GM_PERMISSION', 'UNSET_GM_PERMISSION'], true);
    }

    return in_array($confirm, ['GRANT_GM_PERMISSION', 'SET_GM_PERMISSION'], true);
}

function buildGmPermissionTargetPayload(array $request, array $config, GamedProtocol $proto)
{
    if (!gmPermissionEnabled($config)) {
        throw new InvalidArgumentException('Permissao GM esta desabilitada na configuracao da API');
    }

    $merged = mergeGmPermissionRequest($request);
    $target = resolveMallCashTarget($merged, $config, $proto);

    $ruleIds = gmPermissionRuleIdsFromValue(firstArrayValue($merged, ['rule_ids', 'ruleIds', 'rids'], gmPermissionRuleIdsConfigured($config)));
    $dbName = trim((string) array_value($config, 'gm_permission_db_name', 'pw'));
    $authTable = trim((string) array_value($config, 'gm_permission_auth_table', 'auth'));
    $useridField = trim((string) array_value($config, 'gm_permission_auth_userid_field', 'userid'));
    $zoneidField = trim((string) array_value($config, 'gm_permission_auth_zoneid_field', 'zoneid'));
    $ridField = trim((string) array_value($config, 'gm_permission_auth_rid_field', 'rid'));
    $zoneid = max(1, intval(array_value($config, 'gm_permission_zoneid', 1)));
    $templateMinRules = max(1, intval(array_value($config, 'gm_permission_template_min_rules', 30)));

    if ($dbName === '' || $authTable === '' || $useridField === '' || $zoneidField === '' || $ridField === '') {
        throw new InvalidArgumentException('Configuracao GM auth incompleta');
    }

    return [
        'userid' => intval(array_value($target, 'userid', 0)),
        'roleid' => intval(array_value($target, 'roleid', 0)),
        'role_name' => trim((string) array_value($target, 'role_name', '')),
        'resolved_via' => trim((string) array_value($target, 'resolved_via', '')),
        'rule_ids' => $ruleIds,
        'db_name' => $dbName,
        'auth_table' => $authTable,
        'userid_field' => $useridField,
        'zoneid_field' => $zoneidField,
        'rid_field' => $ridField,
        'zoneid' => $zoneid,
        'template_min_rules' => $templateMinRules,
    ];
}

function buildGmPermissionActionPayload(array $request, array $config, GamedProtocol $proto, $mode = 'grant')
{
    $mode = trim((string) $mode);
    if (!in_array($mode, ['grant', 'revoke'], true)) {
        throw new InvalidArgumentException('Modo de permissao GM invalido: ' . $mode);
    }

    $merged = mergeGmPermissionRequest($request);
    $payload = buildGmPermissionTargetPayload($merged, $config, $proto);
    $payload['mode'] = $mode;
    $payload['reason'] = securityReasonFromRequest($merged, $config);
    $payload['dry_run'] = truthyValue(firstArrayValue($merged, ['dry_run', 'dryRun'], false));
    $payload['permission_level'] = trim((string) firstArrayValue($merged, ['permission_level', 'permissionLevel', 'level'], ''));
    return $payload;
}

function executeGmPermissionCommand(array $config, array $payload, $mode = 'inspect')
{
    $mode = trim((string) $mode);
    if (!in_array($mode, ['inspect', 'grant', 'revoke'], true)) {
        throw new Exception('Modo invalido para wrapper de permissao GM: ' . $mode);
    }

    $command = trim((string) array_value($config, 'gm_permission_command', ''));
    if ($command === '') {
        throw new Exception('Comando de permissao GM nao configurado');
    }

    $ruleIdsCsv = implode(',', gmPermissionRuleIdsFromValue(array_value($payload, 'rule_ids', [])));
    $result = executeServerOpsCommand(
        $command
        . ' ' . escapeshellarg($mode)
        . ' ' . escapeshellarg((string) intval(array_value($payload, 'userid', 0)))
        . ' ' . escapeshellarg((string) intval(array_value($payload, 'zoneid', 1)))
        . ' ' . escapeshellarg((string) array_value($payload, 'db_name', 'pw'))
        . ' ' . escapeshellarg((string) array_value($payload, 'auth_table', 'auth'))
        . ' ' . escapeshellarg((string) array_value($payload, 'userid_field', 'userid'))
        . ' ' . escapeshellarg((string) array_value($payload, 'zoneid_field', 'zoneid'))
        . ' ' . escapeshellarg((string) array_value($payload, 'rid_field', 'rid'))
        . ' ' . escapeshellarg($ruleIdsCsv)
        . ' ' . escapeshellarg((string) intval(array_value($payload, 'template_min_rules', 30))),
        max(0, intval(array_value($config, 'restore_now_timeout_seconds', 1800)))
    );

    $parsed = is_array(array_value($result, 'parsed', null)) ? array_value($result, 'parsed', []) : [];
    if (empty($result['success']) && empty($parsed)) {
        throw new Exception(
            'Permissao GM falhou (exit ' . intval(array_value($result, 'exit_code', 1)) . '): '
            . trim((string) array_value($result, 'stdout_excerpt', ''))
        );
    }
    if (empty($parsed)) {
        $parsed = [
            'stdout' => trim((string) array_value($result, 'stdout_excerpt', '')),
        ];
    }

    return $parsed;
}

function summarizeGmPermissionState(array $state, $phase = 'current')
{
    $phase = trim((string) $phase);
    if (!in_array($phase, ['current', 'after'], true)) {
        $phase = 'current';
    }

    $templateRuleIds = gmPermissionRuleIdsFromValue(array_value($state, 'template_rule_ids', []));
    $ruleIds = ($phase === 'after')
        ? gmPermissionRuleIdsFromValue(array_value($state, 'after_rule_ids', array_value($state, 'current_rule_ids', [])))
        : gmPermissionRuleIdsFromValue(array_value($state, 'current_rule_ids', []));

    $currentCount = count($ruleIds);
    $templateCount = count($templateRuleIds);
    $matchingRuleIds = array_values(array_intersect($ruleIds, $templateRuleIds));
    $missingRuleIds = array_values(array_diff($templateRuleIds, $ruleIds));
    $extraRuleIds = array_values(array_diff($ruleIds, $templateRuleIds));
    $matchingCount = count($matchingRuleIds);
    $missingCount = count($missingRuleIds);
    $afterCount = ($phase === 'after') ? $currentCount : max(0, intval(array_value($state, 'after_rule_count', $currentCount)));

    $fullyMatchesTemplate = ($templateCount > 0 && $missingCount === 0 && $matchingCount === $templateCount);
    $partiallyMatchesTemplate = ($templateCount > 0 && $matchingCount > 0 && !$fullyMatchesTemplate);

    return [
        'template_source' => trim((string) array_value($state, 'template_source', '')),
        'template_userid' => intval(array_value($state, 'template_userid', 0)),
        'template_available' => $templateCount > 0,
        'has_any_rules' => $currentCount > 0,
        'current_rule_count' => $currentCount,
        'template_rule_count' => $templateCount,
        'matching_rule_count' => $matchingCount,
        'missing_rule_count' => $missingCount,
        'extra_rule_count' => count($extraRuleIds),
        'fully_matches_template' => $fullyMatchesTemplate,
        'partially_matches_template' => $partiallyMatchesTemplate,
        'after_rule_count' => $afterCount,
        'phase' => $phase,
    ];
}

function getGmPermissionStateSnapshot(array $config, array $request)
{
    $proto = new GamedProtocol();
    $payload = buildGmPermissionTargetPayload($request, $config, $proto);
    $state = executeGmPermissionCommand($config, $payload, 'inspect');
    $currentRuleIds = gmPermissionRuleIdsFromValue(array_value($state, 'current_rule_ids', []));
    $templateRuleIds = gmPermissionRuleIdsFromValue(array_value($state, 'template_rule_ids', []));
    $matchingRuleIds = gmPermissionRuleIdsFromValue(array_value($state, 'matching_rule_ids', []));
    $missingRuleIds = gmPermissionRuleIdsFromValue(array_value($state, 'missing_rule_ids', []));
    $afterRuleIds = gmPermissionRuleIdsFromValue(array_value($state, 'after_rule_ids', []));

    return [
        'success' => true,
        'target' => [
            'userid' => intval(array_value($payload, 'userid', 0)),
            'roleid' => intval(array_value($payload, 'roleid', 0)),
            'role_name' => trim((string) array_value($payload, 'role_name', '')),
            'resolved_via' => trim((string) array_value($payload, 'resolved_via', '')),
        ],
        'requested_rule_ids' => gmPermissionRuleIdsFromValue(array_value($payload, 'rule_ids', [])),
        'rule_catalog' => gmPermissionDescribeRuleIds(array_keys(gmPermissionRuleCatalog())),
        'permission_state' => $state,
        'permission_summary' => summarizeGmPermissionState($state, 'current'),
        'current_rules' => gmPermissionDescribeRuleIds($currentRuleIds),
        'template_rules' => gmPermissionDescribeRuleIds($templateRuleIds),
        'matching_rules' => gmPermissionDescribeRuleIds($matchingRuleIds),
        'missing_rules' => gmPermissionDescribeRuleIds($missingRuleIds),
        'after_rules' => gmPermissionDescribeRuleIds($afterRuleIds),
        'collected_at' => gmdate('c'),
    ];
}

function getGmPermissionCatalogSnapshot()
{
    return [
        'success' => true,
        'rules' => gmPermissionDescribeRuleIds(array_keys(gmPermissionRuleCatalog())),
        'count' => count(gmPermissionRuleCatalog()),
        'collected_at' => gmdate('c'),
    ];
}

function handleGmPermissionRequest(array $config, array $request, $mode = 'grant')
{
    $mode = trim((string) $mode);
    if (!in_array($mode, ['grant', 'revoke'], true)) {
        throw new InvalidArgumentException('Modo de permissao GM invalido: ' . $mode);
    }

    $proto = new GamedProtocol();
    $payload = buildGmPermissionActionPayload($request, $config, $proto, $mode);
    $before = executeGmPermissionCommand($config, $payload, 'inspect');
    $beforeSummary = summarizeGmPermissionState($before, 'current');
    $commandKey = ($mode === 'revoke') ? 'revokeGmPermission' : 'grantGmPermission';
    $target = [
        'userid' => intval(array_value($payload, 'userid', 0)),
        'roleid' => intval(array_value($payload, 'roleid', 0)),
        'role_name' => trim((string) array_value($payload, 'role_name', '')),
        'resolved_via' => trim((string) array_value($payload, 'resolved_via', '')),
    ];

    if (!empty($payload['dry_run'])) {
        $response = [
            'success' => true,
            'dry_run' => true,
            'mode' => $mode,
            'target' => $target,
            'gm_action' => [
                'action' => $commandKey,
                'mode' => $mode,
                'userid' => intval(array_value($payload, 'userid', 0)),
                'roleid' => intval(array_value($payload, 'roleid', 0)),
                'role_name' => trim((string) array_value($payload, 'role_name', '')),
                'reason' => array_value($payload, 'reason', ''),
                'message' => 'Dry-run de permissao GM validado com sucesso',
            ],
            'permission_before' => $before,
            'permission_summary_before' => $beforeSummary,
        ];

        $gmHistoryWarning = '';
        $gmEntry = gmHistoryEntryBase($config, $commandKey, [
            'status' => 'dry_run',
            'success' => true,
            'dry_run' => true,
            'reason' => array_value($payload, 'reason', ''),
            'target' => $target,
            'permission_before' => $before,
            'message' => 'Dry-run de permissao GM validado com sucesso',
        ]);
        if (gmAppendHistoryBestEffort($config, $gmEntry, $gmHistoryWarning)) {
            $response['gm_history_file'] = gmActionHistoryFile($config);
        } elseif ($gmHistoryWarning !== '') {
            $response['gm_history_warning'] = $gmHistoryWarning;
        }

        return $response;
    }

    if (!gmPermissionConfirmOk($request, $mode)) {
        if ($mode === 'revoke') {
            throw new InvalidArgumentException('Confirmacao obrigatoria para remover permissao GM. Envie confirm=REVOKE_GM_PERMISSION');
        }
        throw new InvalidArgumentException('Confirmacao obrigatoria para grant GM. Envie confirm=GRANT_GM_PERMISSION');
    }

    $after = executeGmPermissionCommand($config, $payload, $mode);
    $afterSummary = summarizeGmPermissionState($after, 'after');
    $change = [
        'before_rule_count' => intval(array_value($beforeSummary, 'current_rule_count', 0)),
        'after_rule_count' => intval(array_value($afterSummary, 'after_rule_count', array_value($afterSummary, 'current_rule_count', 0))),
        'matching_rule_count' => intval(array_value($afterSummary, 'matching_rule_count', 0)),
        'missing_rule_count' => intval(array_value($afterSummary, 'missing_rule_count', 0)),
        'inserted_rule_count' => max(0, intval(array_value($after, 'inserted_rule_count', 0))),
        'deleted_rule_count' => max(0, intval(array_value($after, 'deleted_rule_count', 0))),
        'changed' => array_value($before, 'current_rule_ids', []) !== array_value($after, 'after_rule_ids', []),
    ];
    $message = ($mode === 'revoke')
        ? 'Permissao GM removida com sucesso'
        : 'Permissao GM aplicada com sucesso';

    $response = [
        'success' => true,
        'mode' => $mode,
        'message' => $message,
        'target' => $target,
        'permission_before' => $before,
        'permission_summary_before' => $beforeSummary,
        'permission_after' => $after,
        'permission_summary_after' => $afterSummary,
        'permission_change' => $change,
        'gm_action' => [
            'action' => $commandKey,
            'mode' => $mode,
            'userid' => intval(array_value($payload, 'userid', 0)),
            'roleid' => intval(array_value($payload, 'roleid', 0)),
            'role_name' => trim((string) array_value($payload, 'role_name', '')),
            'reason' => array_value($payload, 'reason', ''),
            'message' => $message,
        ],
    ];

    $gmHistoryWarning = '';
    $gmEntry = gmHistoryEntryBase($config, $commandKey, [
        'status' => 'success',
        'success' => true,
        'dry_run' => false,
        'reason' => array_value($payload, 'reason', ''),
        'target' => $target,
        'permission_before' => $before,
        'permission_after' => $after,
        'message' => $message,
    ]);
    if (gmAppendHistoryBestEffort($config, $gmEntry, $gmHistoryWarning)) {
        $response['gm_history_file'] = gmActionHistoryFile($config);
    } elseif ($gmHistoryWarning !== '') {
        $response['gm_history_warning'] = $gmHistoryWarning;
    }

    return $response;
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

function securityValidateResolvedUserMatch($roleid, $providedUserid, array $resolved)
{
    $roleid = intval($roleid);
    $providedUserid = intval($providedUserid);
    $resolvedUserid = intval(array_value($resolved, 'userid', 0));

    if ($roleid > 0 && $providedUserid > 0 && $resolvedUserid > 0 && $providedUserid !== $resolvedUserid) {
        throw new InvalidArgumentException(
            'userid/account_id ' . $providedUserid . ' nao corresponde ao roleid ' . $roleid . ' (pertence ao userid ' . $resolvedUserid . ')'
        );
    }
}

function securityDurationFromRequest(array $request)
{
    return max(0, intval(firstArrayValue($request, ['duration_seconds', 'durationSeconds', 'duration', 'seconds', 'time'], 0)));
}

function securitySidFromRequest(array $request, array $config)
{
    return max(0, intval(firstArrayValue($request, ['sid', 'localsid', 'local_sid', 'gsid'], array_value($config, 'gm_delivery_sid_default', 0))));
}

function securityAccountForbidMode(array $config)
{
    $mode = strtolower(trim((string) array_value($config, 'security_account_forbid_mode', 'auto')));
    if (!in_array($mode, ['auto', 'gamedbd', 'table'], true)) {
        $mode = 'auto';
    }

    if ($mode !== 'auto') {
        return $mode;
    }

    $version = preg_replace('/[^0-9]/', '', (string) array_value($config, 'game_version', ''));
    if ($version !== '' && intval($version) > 0 && intval($version) <= 101) {
        return 'table';
    }

    return 'gamedbd';
}

function securityAccountForbidTableAvailable(array $config)
{
    return trim((string) array_value($config, 'security_account_forbid_command', '')) !== '';
}

function buildSecurityAccountForbidPayload(array $payload, array $config)
{
    $typeIds = gmPermissionRuleIdsFromValue(array_value($payload, 'type_ids', array_value($config, 'security_account_forbid_types', [0])));
    if (empty($typeIds) && !empty($payload['action']) && $payload['action'] === 'banAccount') {
        $typeIds = gmPermissionRuleIdsFromValue(array_value($config, 'security_account_forbid_types', [0]));
    }

    return [
        'userid' => intval(array_value($payload, 'userid', 0)),
        'seconds' => max(0, intval(array_value($payload, 'seconds', 0))),
        'reason' => trim((string) array_value($payload, 'reason', '')),
        'db_name' => trim((string) array_value(
            $config,
            'security_account_forbid_db_name',
            array_value($config, 'gm_permission_db_name', array_value($config, 'mall_cash_db_name', 'pw'))
        )),
        'forbid_table' => trim((string) array_value($config, 'security_account_forbid_table', 'forbid')),
        'userid_field' => trim((string) array_value($config, 'security_account_forbid_userid_field', 'userid')),
        'type_field' => trim((string) array_value($config, 'security_account_forbid_type_field', 'type')),
        'ctime_field' => trim((string) array_value($config, 'security_account_forbid_ctime_field', 'ctime')),
        'forbid_time_field' => trim((string) array_value($config, 'security_account_forbid_time_field', 'forbid_time')),
        'reason_field' => trim((string) array_value($config, 'security_account_forbid_reason_field', 'reason')),
        'gmroleid_field' => trim((string) array_value($config, 'security_account_forbid_gmroleid_field', 'gmroleid')),
        'gmroleid' => max(0, intval(array_value($config, 'security_account_forbid_gmroleid', 0))),
        'type_ids' => $typeIds,
    ];
}

function executeSecurityAccountForbidCommand(array $config, array $payload, $mode = 'inspect')
{
    $mode = strtolower(trim((string) $mode));
    if (!in_array($mode, ['inspect', 'ban', 'unban'], true)) {
        throw new Exception('Modo invalido para forbid de conta: ' . $mode);
    }

    $command = trim((string) array_value($config, 'security_account_forbid_command', ''));
    if ($command === '') {
        throw new Exception('Comando de forbid de conta nao configurado');
    }

    $wrapperPayload = buildSecurityAccountForbidPayload($payload, $config);
    $typeIdsCsv = implode(',', gmPermissionRuleIdsFromValue(array_value($wrapperPayload, 'type_ids', [])));
    $reasonB64 = base64_encode((string) array_value($wrapperPayload, 'reason', ''));

    $result = executeServerOpsCommand(
        $command
        . ' ' . escapeshellarg($mode)
        . ' ' . escapeshellarg((string) intval(array_value($wrapperPayload, 'userid', 0)))
        . ' ' . escapeshellarg((string) intval(array_value($wrapperPayload, 'seconds', 0)))
        . ' ' . escapeshellarg((string) array_value($wrapperPayload, 'db_name', 'pw'))
        . ' ' . escapeshellarg((string) array_value($wrapperPayload, 'forbid_table', 'forbid'))
        . ' ' . escapeshellarg((string) array_value($wrapperPayload, 'userid_field', 'userid'))
        . ' ' . escapeshellarg((string) array_value($wrapperPayload, 'type_field', 'type'))
        . ' ' . escapeshellarg((string) array_value($wrapperPayload, 'ctime_field', 'ctime'))
        . ' ' . escapeshellarg((string) array_value($wrapperPayload, 'forbid_time_field', 'forbid_time'))
        . ' ' . escapeshellarg((string) array_value($wrapperPayload, 'reason_field', 'reason'))
        . ' ' . escapeshellarg((string) array_value($wrapperPayload, 'gmroleid_field', 'gmroleid'))
        . ' ' . escapeshellarg($reasonB64)
        . ' ' . escapeshellarg((string) intval(array_value($wrapperPayload, 'gmroleid', 0)))
        . ' ' . escapeshellarg($typeIdsCsv),
        max(0, intval(array_value($config, 'restore_now_timeout_seconds', 1800)))
    );

    $parsed = is_array(array_value($result, 'parsed', null)) ? array_value($result, 'parsed', []) : [];
    if (empty($result['success']) && empty($parsed)) {
        throw new Exception(
            'Forbid de conta via tabela falhou (exit ' . intval(array_value($result, 'exit_code', 1)) . '): '
            . trim((string) array_value($result, 'stdout_excerpt', ''))
        );
    }
    if (empty($parsed)) {
        $parsed = [
            'stdout' => trim((string) array_value($result, 'stdout_excerpt', '')),
        ];
    }

    if (array_key_exists('success', $parsed) && !$parsed['success']) {
        throw new Exception(trim((string) array_value($parsed, 'error', 'Falha ao aplicar forbid de conta via tabela')));
    }

    return $parsed;
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

    if ($roleid > 0) {
        $resolved = securityResolveUserIdFromRole($proto, $config, $roleid);
        securityValidateResolvedUserMatch($roleid, $userid, $resolved);
        if ($userid <= 0) {
            $userid = intval(array_value($resolved, 'userid', 0));
        }
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

    $kickOnline = truthyValue(firstArrayValue($merged, [
        'kick_online',
        'kickOnline',
        'kick_after_ban',
        'kickAfterBan',
        'disconnect_online',
        'disconnectOnline',
        'force_logout',
        'forceLogout',
    ], false));

    $kickSeconds = intval(firstArrayValue($merged, [
        'kick_seconds',
        'kickSeconds',
        'kick_duration_seconds',
        'kickDurationSeconds',
    ], array_value($config, 'security_kick_default_seconds', 10)));
    if ($kickSeconds <= 0) {
        $kickSeconds = max(1, intval(array_value($config, 'security_kick_default_seconds', 10)));
    }

    $maxKickSeconds = max(1, intval(array_value($config, 'security_kick_max_seconds', 600)));
    if ($kickSeconds > $maxKickSeconds) {
        $kickSeconds = $maxKickSeconds;
    }

    if ($kickOnline && $roleid <= 0) {
        throw new InvalidArgumentException('roleid obrigatorio quando kick_online estiver ativo');
    }

    $kickReason = truncateUtf8Text(firstArrayValue($merged, ['kick_reason', 'kickReason'], ''), 250);
    if ($kickReason === '') {
        $kickReason = $reason;
    }

    return [
        'action' => 'banAccount',
        'userid' => $userid,
        'roleid' => $roleid,
        'seconds' => $seconds,
        'permanent' => $permanent,
        'reason' => $reason,
        'kick_online' => $kickOnline,
        'kick_seconds' => $kickSeconds,
        'kick_reason' => $kickReason,
        'type_ids' => gmPermissionRuleIdsFromValue(firstArrayValue($merged, ['type_ids', 'typeIds', 'types', 'forbid_types'], [])),
        'dry_run' => truthyValue(firstArrayValue($merged, ['dry_run', 'dryRun'], false)),
    ];
}

function buildUnbanAccountPayload(array $request, array $config, GamedProtocol $proto)
{
    $merged = mergedSecurityRequest($request);
    $roleid = securityResolveRoleId($merged);
    $userid = intval(firstArrayValue($merged, ['userid', 'user_id', 'account_id', 'accountId', 'target_userid'], 0));

    if ($roleid > 0) {
        $resolved = securityResolveUserIdFromRole($proto, $config, $roleid);
        securityValidateResolvedUserMatch($roleid, $userid, $resolved);
        if ($userid <= 0) {
            $userid = intval(array_value($resolved, 'userid', 0));
        }
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
        'type_ids' => gmPermissionRuleIdsFromValue(firstArrayValue($merged, ['type_ids', 'typeIds', 'types', 'forbid_types'], [])),
        'refresh_services' => securityUnbanRefreshServicesFromRequest($merged),
        'dry_run' => truthyValue(firstArrayValue($merged, ['dry_run', 'dryRun'], false)),
    ];
}

function securityUnbanRefreshServicesFromRequest(array $request)
{
    $refresh = truthyValue(firstArrayValue($request, ['refresh_login_cache', 'refreshLoginCache', 'refresh_auth_cache', 'refreshAuthCache', 'restart_authd', 'restartAuthd'], false));
    $raw = firstArrayValue($request, ['refresh_services', 'refreshServices', 'login_refresh_services', 'loginRefreshServices'], []);

    $values = [];
    if (is_array($raw)) {
        $values = $raw;
    } elseif (is_string($raw)) {
        $values = preg_split('/[\s,;]+/', trim($raw));
    } elseif ($raw !== null && $raw !== false && $raw !== '') {
        $values = [$raw];
    }

    if ($refresh && empty($values)) {
        $values = ['authd'];
    }

    $aliases = [
        'gauthd' => 'authd',
        'auth' => 'authd',
        'delivery' => 'gdeliveryd',
        'link' => 'glinkd',
    ];
    $allowed = ['authd', 'gdeliveryd', 'glinkd'];
    $normalized = [];
    foreach ($values as $value) {
        $value = strtolower(trim((string) $value));
        if ($value === '') {
            continue;
        }
        if (isset($aliases[$value])) {
            $value = $aliases[$value];
        }
        if (in_array($value, $allowed, true) && !in_array($value, $normalized, true)) {
            $normalized[] = $value;
        }
    }

    return $normalized;
}

function buildMuteAccountPayload(array $request, array $config, GamedProtocol $proto)
{
    $merged = mergedSecurityRequest($request);
    $reason = securityReasonFromRequest($merged, $config);
    $roleid = securityResolveRoleId($merged);
    $userid = intval(firstArrayValue($merged, ['userid', 'user_id', 'account_id', 'accountId', 'target_userid'], 0));
    if ($roleid > 0) {
        $resolved = securityResolveUserIdFromRole($proto, $config, $roleid);
        securityValidateResolvedUserMatch($roleid, $userid, $resolved);
        if ($userid <= 0) {
            $userid = intval(array_value($resolved, 'userid', 0));
        }
    }

    if ($userid <= 0) {
        throw new InvalidArgumentException('userid/account_id invalido');
    }

    $seconds = securityDurationFromRequest($merged);
    if ($seconds <= 0) {
        throw new InvalidArgumentException('duracao obrigatoria para muteAccount');
    }

    return [
        'action' => 'muteAccount',
        'userid' => $userid,
        'roleid' => $roleid,
        'sid' => securitySidFromRequest($merged, $config),
        'seconds' => min($seconds, 2147483647),
        'reason' => $reason,
        'dry_run' => truthyValue(firstArrayValue($merged, ['dry_run', 'dryRun'], false)),
    ];
}

function buildMuteRolePayload(array $request, array $config)
{
    $merged = mergedSecurityRequest($request);
    $roleid = securityResolveRoleId($merged);
    if ($roleid <= 0) {
        throw new InvalidArgumentException('roleid invalido');
    }

    $seconds = securityDurationFromRequest($merged);
    if ($seconds <= 0) {
        throw new InvalidArgumentException('duracao obrigatoria para muteRole');
    }

    return [
        'action' => 'muteRole',
        'roleid' => $roleid,
        'sid' => securitySidFromRequest($merged, $config),
        'seconds' => min($seconds, 2147483647),
        'reason' => securityReasonFromRequest($merged, $config),
        'dry_run' => truthyValue(firstArrayValue($merged, ['dry_run', 'dryRun'], false)),
    ];
}

function buildTeleportRolePayload(array $request, array $config)
{
    $merged = mergedSecurityRequest($request);
    $roleid = securityResolveRoleId($merged);
    if ($roleid <= 0) {
        throw new InvalidArgumentException('roleid invalido');
    }

    $tag = intval(firstArrayValue($merged, ['tag', 'worldtag', 'world_tag', 'map_id'], 0));
    if ($tag <= 0) {
        throw new InvalidArgumentException('tag/worldtag invalido');
    }

    foreach (['x', 'y', 'z'] as $axis) {
        if (!isset($merged[$axis]) && !isset($merged['pos' . $axis])) {
            throw new InvalidArgumentException('coordenada obrigatoria: ' . $axis);
        }
    }

    return [
        'action' => 'teleportRole',
        'roleid' => $roleid,
        'tag' => $tag,
        'x' => floatval(firstArrayValue($merged, ['x', 'posx'], 0)),
        'y' => floatval(firstArrayValue($merged, ['y', 'posy'], 0)),
        'z' => floatval(firstArrayValue($merged, ['z', 'posz'], 0)),
        'dry_run' => truthyValue(firstArrayValue($merged, ['dry_run', 'dryRun'], false)),
    ];
}

function buildClearRolePkPayload(array $request, array $config)
{
    $merged = mergedSecurityRequest($request);
    $roleid = securityResolveRoleId($merged);
    if ($roleid <= 0) {
        throw new InvalidArgumentException('roleid invalido');
    }

    return [
        'action' => 'clearRolePk',
        'roleid' => $roleid,
        'seconds' => 0,
        'reason' => securityReasonFromRequest($merged, $config),
        'dry_run' => truthyValue(firstArrayValue($merged, ['dry_run', 'dryRun'], false)),
        'kick_online' => truthyValue(firstArrayValue($merged, ['kick_online', 'kickOnline'], false)),
        'kick_seconds' => max(1, intval(firstArrayValue($merged, ['kick_seconds', 'kickSeconds'], array_value($config, 'security_kick_default_seconds', 10)))),
        'kick_reason' => trim((string) firstArrayValue($merged, ['kick_reason', 'kickReason'], '')),
    ];
}

function buildReviveRolePayload(array $request, array $config)
{
    $merged = mergedSecurityRequest($request);
    $roleid = securityResolveRoleId($merged);
    if ($roleid <= 0) {
        throw new InvalidArgumentException('roleid invalido');
    }

    return [
        'action' => 'reviveRole',
        'roleid' => $roleid,
        'seconds' => 0,
        'reason' => securityReasonFromRequest($merged, $config),
        'dry_run' => truthyValue(firstArrayValue($merged, ['dry_run', 'dryRun'], false)),
        'kick_online' => truthyValue(firstArrayValue($merged, ['kick_online', 'kickOnline'], false)),
        'kick_seconds' => max(1, intval(firstArrayValue($merged, ['kick_seconds', 'kickSeconds'], array_value($config, 'security_kick_default_seconds', 10)))),
        'kick_reason' => trim((string) firstArrayValue($merged, ['kick_reason', 'kickReason'], '')),
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
        'sid' => intval(array_value($payload, 'sid', 0)),
        'refresh_services' => array_values(array_map('strval', array_value($payload, 'refresh_services', []))),
    ];

    if ($result['action'] === 'banAccount') {
        $result['kick_online'] = truthyValue(array_value($payload, 'kick_online', false));
        $result['kick_seconds'] = intval(array_value($payload, 'kick_seconds', 0));
        $result['kick_reason'] = array_value($payload, 'kick_reason', '');
    } elseif ($result['action'] === 'clearRolePk') {
        $result['kick_online'] = truthyValue(array_value($payload, 'kick_online', false));
        $result['kick_seconds'] = intval(array_value($payload, 'kick_seconds', 0));
        $result['kick_reason'] = array_value($payload, 'kick_reason', '');
    }

    if ($result['action'] === 'teleportRole') {
        $result['tag'] = intval(array_value($payload, 'tag', 0));
        $result['x'] = floatval(array_value($payload, 'x', 0));
        $result['y'] = floatval(array_value($payload, 'y', 0));
        $result['z'] = floatval(array_value($payload, 'z', 0));
    }

    if ($result['dry_run']) {
        $result['message'] = 'Dry run de seguranca validado com sucesso';
        if ($result['action'] === 'banAccount') {
            $result['account_ban'] = [
                'blocks_login' => true,
                'scope' => 'account',
                'duration_seconds' => $result['seconds'],
                'permanent' => truthyValue(array_value($payload, 'permanent', false)),
                'kick_online' => truthyValue(array_value($payload, 'kick_online', false)),
                'kick_roleid' => intval(array_value($result, 'roleid', 0)),
            ];
        } elseif ($result['action'] === 'unbanAccount') {
            $refreshServices = array_values(array_map('strval', array_value($result, 'refresh_services', [])));
            if (!empty($refreshServices)) {
                $result['login_cache_refresh'] = [
                    'requested' => true,
                    'services' => $refreshServices,
                    'impact' => in_array('gdeliveryd', $refreshServices, true) || in_array('glinkd', $refreshServices, true)
                        ? 'may_affect_online_players'
                        : 'login_auth_only',
                ];
            }
        } elseif ($result['action'] === 'clearRolePk') {
            $pkState = $proto->inspectRolePkState($result['roleid'], $config['gamedbd_ip'], $config['gamedbd_port']);
            $result['pk_clear'] = [
                'roleid' => $result['roleid'],
                'before' => array_value($pkState, 'state', []),
                'after' => array_value($pkState, 'state', []),
                'role_forbid_before' => array_value($pkState, 'role_forbid', []),
                'role_forbid_after' => array_value($pkState, 'role_forbid', []),
                'cleared' => truthyValue(array_value(array_value($pkState, 'state', []), 'cleared', false)),
                'changed' => false,
            ];
            if (truthyValue(array_value($result, 'kick_online', false))) {
                $result['session_refresh'] = [
                    'requested' => true,
                    'method' => 'kickRole',
                    'roleid' => $result['roleid'],
                    'seconds' => max(1, intval(array_value($result, 'kick_seconds', 0))),
                    'reason' => trim((string) array_value($result, 'kick_reason', '')) !== ''
                        ? trim((string) array_value($result, 'kick_reason', ''))
                        : $result['reason'],
                ];
            } else {
                $result['warning'] = 'A limpeza do PK persistido foi validada, mas um personagem online pode manter o estado em memoria ate relog ou kick.';
            }
        } elseif ($result['action'] === 'reviveRole') {
            $reviveState = $proto->inspectRoleReviveState($result['roleid'], $config['gamedbd_ip'], $config['gamedbd_port']);
            $before = array_value($reviveState, 'state', []);
            $after = $before;
            $persistedAlreadyAlive = truthyValue(array_value($before, 'revived', false));
            $targetHp = max(
                1,
                intval(array_value($before, 'hp', 0)),
                intval(array_value($before, 'property_hp', 0))
            );
            $targetMp = max(
                1,
                intval(array_value($before, 'mp', 0)),
                intval(array_value($before, 'property_mp', 0))
            );
            $after['hp'] = $targetHp;
            $after['mp'] = $targetMp;
            $after['dead_flag'] = 0;
            $after['resurrect_state'] = 0;
            $after['resurrect_exp_reduce'] = 0.0;
            $after['resurrect_hp_factor'] = 1.0;
            $after['resurrect_mp_factor'] = 1.0;
            $after['revivable'] = false;
            $after['revived'] = true;
            if ($persistedAlreadyAlive) {
                $result['warning'] = 'O estado persistido indicou personagem vivo, mas a execucao real ainda forçara a escrita de revive. Se o alvo estiver online morto, use kick_online para recarregar a sessao.';
            }
            $result['revive'] = [
                'roleid' => $result['roleid'],
                'before' => $before,
                'after' => $after,
                'revived' => truthyValue(array_value($after, 'revived', false)),
                'forced_write' => true,
                'persisted_state_already_alive' => $persistedAlreadyAlive,
                'changed' => $before !== $after,
            ];
            if (truthyValue(array_value($payload, 'kick_online', false)) && $result['roleid'] > 0) {
                $result['session_refresh'] = [
                    'requested' => true,
                    'method' => 'kickRole',
                    'roleid' => $result['roleid'],
                    'seconds' => max(1, intval(array_value($payload, 'kick_seconds', array_value($config, 'security_kick_default_seconds', 10)))),
                    'reason' => trim((string) array_value($payload, 'kick_reason', '')) !== ''
                        ? trim((string) array_value($payload, 'kick_reason', ''))
                        : $result['reason'],
                ];
            }
        }
        $logFile = appendSecurityActionLog($config, array_merge($result, [
            'created_at' => gmdate('c'),
            'status' => 'dry_run',
        ]));
        if ($logFile) {
            $result['log_file'] = $logFile;
        }

        $gmHistoryWarning = '';
        $gmEntry = gmHistoryEntryBase($config, $result['action'], [
            'status' => 'dry_run',
            'success' => true,
            'dry_run' => true,
            'reason' => $result['reason'],
            'seconds' => $result['seconds'],
            'sid' => $result['sid'],
            'target' => [
                'roleid' => intval(array_value($result, 'roleid', 0)),
                'userid' => intval(array_value($result, 'userid', 0)),
            ],
            'kick' => ($result['action'] === 'banAccount' && truthyValue(array_value($result, 'kick_online', false))) ? [
                'requested' => true,
                'roleid' => intval(array_value($result, 'roleid', 0)),
                'seconds' => intval(array_value($result, 'kick_seconds', 0)),
                'reason' => array_value($result, 'kick_reason', ''),
            ] : null,
            'teleport' => ($result['action'] === 'teleportRole') ? [
                'tag' => intval(array_value($result, 'tag', 0)),
                'x' => floatval(array_value($result, 'x', 0)),
                'y' => floatval(array_value($result, 'y', 0)),
                'z' => floatval(array_value($result, 'z', 0)),
            ] : null,
            'pk_clear' => ($result['action'] === 'clearRolePk') ? array_value($result, 'pk_clear', null) : null,
            'session_refresh' => ($result['action'] === 'clearRolePk') ? array_value($result, 'session_refresh', null) : null,
            'revive' => ($result['action'] === 'reviveRole') ? array_value($result, 'revive', null) : null,
            'message' => $result['message'],
        ]);
        if (gmAppendHistoryBestEffort($config, $gmEntry, $gmHistoryWarning)) {
            $result['gm_history_file'] = gmActionHistoryFile($config);
        } elseif ($gmHistoryWarning !== '') {
            $result['gm_history_warning'] = $gmHistoryWarning;
        }
        return $result;
    }

    $delivery = null;
    $result['account_forbid_backend'] = null;
    if ($result['action'] === 'kickRole') {
        $delivery = $proto->forbidRole($result['roleid'], $result['seconds'], $result['reason'], $config['gdeliveryd_ip'], $config['gdeliveryd_port']);
        $result['message'] = 'Kick aplicado com sucesso';
    } elseif ($result['action'] === 'muteAccount') {
        $delivery = $proto->muteAccount($result['sid'], $result['userid'], $result['seconds'], $result['reason'], $config['gdeliveryd_ip'], $config['gdeliveryd_port']);
        $result['message'] = 'Mute de conta aplicado com sucesso';
    } elseif ($result['action'] === 'muteRole') {
        $delivery = $proto->muteRole($result['sid'], $result['roleid'], $result['seconds'], $result['reason'], $config['gdeliveryd_ip'], $config['gdeliveryd_port']);
        $result['message'] = 'Mute de personagem aplicado com sucesso';
    } elseif ($result['action'] === 'teleportRole') {
        $delivery = $proto->playerTeleport($result['roleid'], $result['tag'], $result['x'], $result['y'], $result['z'], $config['gdeliveryd_ip'], $config['gdeliveryd_port']);
        $result['message'] = 'Teleport enviado com sucesso';
    } elseif ($result['action'] === 'banAccount') {
        $forbidMode = securityAccountForbidMode($config);
        if ($forbidMode === 'table') {
            $delivery = executeSecurityAccountForbidCommand($config, $payload, 'ban');
            $result['account_forbid_backend'] = 'forbid_table';
            try {
                $result['deliveryd_forbid'] = $proto->forbidAccount(
                    $result['userid'],
                    $result['seconds'],
                    $result['reason'],
                    $config['gdeliveryd_ip'],
                    $config['gdeliveryd_port']
                );
            } catch (Exception $e) {
                $result['deliveryd_forbid'] = [
                    'success' => false,
                    'error' => $e->getMessage(),
                ];
                $warning = 'Ban gravado na tabela forbid, mas a notificacao complementar ao gdeliveryd falhou.';
                $result['warning'] = isset($result['warning']) && trim((string) $result['warning']) !== ''
                    ? (trim((string) $result['warning']) . ' ' . $warning)
                    : $warning;
            }
        } else {
            try {
                $delivery = $proto->accountForbidAction(1, $result['userid'], $result['seconds'], $result['reason'], $config['gamedbd_ip'], $config['gamedbd_port']);
                if (intval(array_value($delivery, 'retcode', -1)) !== 0) {
                    throw new Exception('Falha ao aplicar ban na conta (retcode ' . intval(array_value($delivery, 'retcode', -1)) . ')');
                }
                $result['account_forbid_backend'] = 'gamedbd';
            } catch (Exception $e) {
                if (!securityAccountForbidTableAvailable($config)) {
                    throw $e;
                }

                $delivery = executeSecurityAccountForbidCommand($config, $payload, 'ban');
                $result['account_forbid_backend'] = 'forbid_table';
                $result['warning'] = 'gamedbd nao respondeu para banAccount; fallback via tabela forbid aplicado.';
                $result['backend_error'] = $e->getMessage();
            }
        }
        $result['message'] = truthyValue(array_value($payload, 'permanent', false))
            ? 'Ban permanente aplicado com sucesso'
            : 'Ban temporario aplicado com sucesso';
        $result['permanent'] = truthyValue(array_value($payload, 'permanent', false));
        if (truthyValue(array_value($payload, 'kick_online', false)) && $result['roleid'] > 0) {
            try {
                $kickDelivery = $proto->forbidRole(
                    $result['roleid'],
                    max(1, intval(array_value($payload, 'kick_seconds', array_value($config, 'security_kick_default_seconds', 10)))),
                    (string) array_value($payload, 'kick_reason', $result['reason']),
                    $config['gdeliveryd_ip'],
                    $config['gdeliveryd_port']
                );
                $result['session_kick'] = [
                    'success' => true,
                    'roleid' => $result['roleid'],
                    'seconds' => max(1, intval(array_value($payload, 'kick_seconds', array_value($config, 'security_kick_default_seconds', 10)))),
                    'reason' => (string) array_value($payload, 'kick_reason', $result['reason']),
                    'delivery' => $kickDelivery,
                ];
                $result['message'] .= ' e sessao online derrubada';
            } catch (Exception $e) {
                $result['session_kick'] = [
                    'success' => false,
                    'roleid' => $result['roleid'],
                    'seconds' => max(1, intval(array_value($payload, 'kick_seconds', array_value($config, 'security_kick_default_seconds', 10)))),
                    'reason' => (string) array_value($payload, 'kick_reason', $result['reason']),
                    'error' => $e->getMessage(),
                ];
                $warning = 'Ban aplicado na conta, mas nao foi possivel derrubar a sessao online do personagem.';
                $result['warning'] = isset($result['warning']) && trim((string) $result['warning']) !== ''
                    ? (trim((string) $result['warning']) . ' ' . $warning)
                    : $warning;
            }
        }
        $banForbidUntilUnix = intval(array_value($delivery, 'forbid_until_unix', 0));
        $banForbidUntil = trim((string) array_value($delivery, 'forbid_until', ''));
        $result['account_ban'] = [
            'blocks_login' => true,
            'scope' => 'account',
            'duration_seconds' => $result['seconds'],
            'permanent' => truthyValue(array_value($payload, 'permanent', false)),
            'forbid_until_unix' => $banForbidUntilUnix > 0 ? $banForbidUntilUnix : null,
            'forbid_until' => $banForbidUntil !== '' ? $banForbidUntil : null,
            'kick_online' => truthyValue(array_value($payload, 'kick_online', false)),
            'kick_roleid' => intval(array_value($result, 'roleid', 0)),
        ];
    } elseif ($result['action'] === 'unbanAccount') {
        $forbidMode = securityAccountForbidMode($config);
        if ($forbidMode === 'table') {
            $accountDelivery = executeSecurityAccountForbidCommand($config, $payload, 'unban');
            $delivery = [
                'account' => $accountDelivery,
            ];
            $result['account_forbid_backend'] = 'forbid_table';
            try {
                $delivery['gamedbd_unforbid'] = $proto->accountForbidAction(
                    2,
                    $result['userid'],
                    0,
                    $result['reason'],
                    $config['gamedbd_ip'],
                    $config['gamedbd_port']
                );
                $delivery['gamedbd_account_state'] = $proto->accountForbidAction(
                    0,
                    $result['userid'],
                    0,
                    '',
                    $config['gamedbd_ip'],
                    $config['gamedbd_port']
                );
            } catch (Exception $e) {
                $result['warning'] = 'Conta liberada via tabela forbid, mas o gamedbd nao confirmou a limpeza imediata do bloqueio em memoria.';
                $result['gamedbd_unforbid_error'] = $e->getMessage();
            }
            try {
                $result['deliveryd_unforbid'] = $proto->forbidAccount(
                    $result['userid'],
                    0,
                    $result['reason'],
                    $config['gdeliveryd_ip'],
                    $config['gdeliveryd_port']
                );
            } catch (Exception $e) {
                $deliveryWarning = 'Conta liberada via tabela forbid, mas o gdeliveryd nao confirmou a limpeza imediata do bloqueio em memoria.';
                $result['warning'] = isset($result['warning']) && trim((string) $result['warning']) !== ''
                    ? (trim((string) $result['warning']) . ' ' . $deliveryWarning)
                    : $deliveryWarning;
                $result['deliveryd_unforbid_error'] = $e->getMessage();
            }
            if ($result['roleid'] > 0) {
                try {
                    $delivery['role_clear'] = $proto->clearRoleForbid($result['roleid'], $config['gamedbd_ip'], $config['gamedbd_port']);
                    if (!truthyValue(array_value(array_value($delivery, 'role_clear', []), 'cleared', false))) {
                        $roleWarning = 'Conta liberada via tabela forbid, mas o role ainda pode possuir forbid na base.';
                        $result['warning'] = isset($result['warning']) && trim((string) $result['warning']) !== ''
                            ? (trim((string) $result['warning']) . ' ' . $roleWarning)
                            : $roleWarning;
                    }
                } catch (Exception $e) {
                    $roleWarning = 'Conta liberada via tabela forbid, mas a limpeza de forbid do role falhou.';
                    $result['warning'] = isset($result['warning']) && trim((string) $result['warning']) !== ''
                        ? (trim((string) $result['warning']) . ' ' . $roleWarning)
                        : $roleWarning;
                    $result['role_clear_error'] = $e->getMessage();
                }
            }
        } else {
            try {
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
                $result['account_forbid_backend'] = 'gamedbd';
            } catch (Exception $e) {
                if (!securityAccountForbidTableAvailable($config)) {
                    throw $e;
                }

                $accountDelivery = executeSecurityAccountForbidCommand($config, $payload, 'unban');
                $delivery = [
                    'account' => $accountDelivery,
                ];
                $result['account_forbid_backend'] = 'forbid_table';
                $result['warning'] = 'gamedbd nao respondeu para unbanAccount; fallback via tabela forbid aplicado.';
                $result['backend_error'] = $e->getMessage();
                try {
                    $result['deliveryd_unforbid'] = $proto->forbidAccount(
                        $result['userid'],
                        0,
                        $result['reason'],
                        $config['gdeliveryd_ip'],
                        $config['gdeliveryd_port']
                    );
                } catch (Exception $deliveryError) {
                    $result['warning'] .= ' O gdeliveryd nao confirmou a limpeza imediata do bloqueio em memoria.';
                    $result['deliveryd_unforbid_error'] = $deliveryError->getMessage();
                }
                if ($result['roleid'] > 0) {
                    try {
                        $delivery['role_clear'] = $proto->clearRoleForbid($result['roleid'], $config['gamedbd_ip'], $config['gamedbd_port']);
                    } catch (Exception $roleError) {
                        $result['role_clear_error'] = $roleError->getMessage();
                    }
                }
            }
        }
        $refreshServices = array_values(array_map('strval', array_value($result, 'refresh_services', [])));
        if (!empty($refreshServices)) {
            $refreshResults = [];
            foreach ($refreshServices as $service) {
                try {
                    $commandResult = executeServiceControlCommand($config, 'restart', $service);
                    $refreshResults[] = [
                        'service' => $service,
                        'result' => $commandResult,
                    ];
                    if (empty($commandResult['success'])) {
                        throw new Exception('Falha ao reiniciar ' . $service . ' (exit ' . intval(array_value($commandResult, 'exit_code', 1)) . ')');
                    }
                } catch (Exception $e) {
                    $refreshWarning = 'Conta liberada, mas o refresh de login falhou em ' . $service . '.';
                    $result['warning'] = isset($result['warning']) && trim((string) $result['warning']) !== ''
                        ? (trim((string) $result['warning']) . ' ' . $refreshWarning)
                        : $refreshWarning;
                    $result['login_cache_refresh_error'] = $e->getMessage();
                    $refreshResults[] = [
                        'service' => $service,
                        'success' => false,
                        'error' => $e->getMessage(),
                    ];
                    break;
                }
            }
            $result['login_cache_refresh'] = [
                'requested' => true,
                'services' => $refreshServices,
                'impact' => in_array('gdeliveryd', $refreshServices, true) || in_array('glinkd', $refreshServices, true)
                    ? 'may_affect_online_players'
                    : 'login_auth_only',
                'results' => $refreshResults,
            ];
        }
        $result['message'] = 'Conta liberada com sucesso';
    } elseif ($result['action'] === 'clearRolePk') {
        $delivery = $proto->clearRolePk($result['roleid'], $config['gamedbd_ip'], $config['gamedbd_port']);
        $result['pk_clear'] = $delivery;
        if (!truthyValue(array_value($delivery, 'cleared', false))) {
            throw new Exception('Falha ao limpar estado PK do personagem');
        }
        $result['message'] = 'Estado PK limpo com sucesso';
        if (truthyValue(array_value($payload, 'kick_online', false)) && $result['roleid'] > 0) {
            try {
                $kickReason = trim((string) array_value($payload, 'kick_reason', '')) !== ''
                    ? trim((string) array_value($payload, 'kick_reason', ''))
                    : $result['reason'];
                $kickSeconds = max(1, intval(array_value($payload, 'kick_seconds', array_value($config, 'security_kick_default_seconds', 10))));
                $kickDelivery = $proto->forbidRole(
                    $result['roleid'],
                    $kickSeconds,
                    $kickReason,
                    $config['gdeliveryd_ip'],
                    $config['gdeliveryd_port']
                );
                $result['session_refresh'] = [
                    'success' => true,
                    'method' => 'kickRole',
                    'roleid' => $result['roleid'],
                    'seconds' => $kickSeconds,
                    'reason' => $kickReason,
                    'delivery' => $kickDelivery,
                ];
                try {
                    $roleForbidCleanup = $proto->clearRoleForbidTypes(
                        $result['roleid'],
                        [100],
                        $config['gamedbd_ip'],
                        $config['gamedbd_port']
                    );
                    $result['session_refresh']['role_forbid_cleanup'] = $roleForbidCleanup;
                    if (!truthyValue(array_value($roleForbidCleanup, 'cleared', false))) {
                        $cleanupWarning = 'A sessao foi derrubada, mas o forbid temporario do refresh ainda permaneceu no role.';
                        $result['warning'] = isset($result['warning']) && trim((string) $result['warning']) !== ''
                            ? (trim((string) $result['warning']) . ' ' . $cleanupWarning)
                            : $cleanupWarning;
                    }
                } catch (Exception $cleanupError) {
                    $result['session_refresh']['role_forbid_cleanup'] = [
                        'success' => false,
                        'types' => [100],
                        'error' => $cleanupError->getMessage(),
                    ];
                    $cleanupWarning = 'A sessao foi derrubada, mas nao foi possivel limpar o forbid temporario criado pelo refresh.';
                    $result['warning'] = isset($result['warning']) && trim((string) $result['warning']) !== ''
                        ? (trim((string) $result['warning']) . ' ' . $cleanupWarning)
                        : $cleanupWarning;
                }
                try {
                    $roleForbidTableCleanup = $proto->clearRoleForbidTableTypes(
                        $result['roleid'],
                        [100],
                        $config['gamedbd_ip'],
                        $config['gamedbd_port']
                    );
                    $result['session_refresh']['role_forbid_table_cleanup'] = $roleForbidTableCleanup;
                    if (!truthyValue(array_value($roleForbidTableCleanup, 'cleared', false))) {
                        $cleanupWarning = 'A sessao foi derrubada, mas o forbid temporario ainda permaneceu na tabela GetRoleForbid.';
                        $result['warning'] = isset($result['warning']) && trim((string) $result['warning']) !== ''
                            ? (trim((string) $result['warning']) . ' ' . $cleanupWarning)
                            : $cleanupWarning;
                    }
                } catch (Exception $cleanupError) {
                    $result['session_refresh']['role_forbid_table_cleanup'] = [
                        'success' => false,
                        'types' => [100],
                        'error' => $cleanupError->getMessage(),
                    ];
                }
                try {
                    $finalPkBundle = $proto->inspectRolePkState($result['roleid'], $config['gamedbd_ip'], $config['gamedbd_port']);
                    $finalAfter = array_value($finalPkBundle, 'state', []);
                    $finalRoleForbid = array_value($finalPkBundle, 'role_forbid', []);
                    $finalRoleForbidTable = array_value($finalPkBundle, 'role_forbid_table', []);
                    $result['pk_clear']['after'] = $finalAfter;
                    $result['pk_clear']['role_forbid_after'] = $finalRoleForbid;
                    $result['pk_clear']['role_forbid_table_after'] = $finalRoleForbidTable;
                    $result['pk_clear']['cleared'] = truthyValue(array_value($finalAfter, 'cleared', false));
                    $result['session_refresh']['post_refresh_state'] = $finalAfter;
                    $result['session_refresh']['post_refresh_role_forbid'] = $finalRoleForbid;
                    $result['session_refresh']['post_refresh_role_forbid_table'] = $finalRoleForbidTable;
                    $delivery = $result['pk_clear'];
                } catch (Exception $recheckError) {
                    $recheckWarning = 'O PK foi limpo, mas a releitura final apos o refresh nao pode ser confirmada.';
                    $result['warning'] = isset($result['warning']) && trim((string) $result['warning']) !== ''
                        ? (trim((string) $result['warning']) . ' ' . $recheckWarning)
                        : $recheckWarning;
                    $result['session_refresh']['post_refresh_state_error'] = $recheckError->getMessage();
                }
                $result['message'] .= ' e sessao online derrubada para recarregar o estado';
            } catch (Exception $e) {
                $result['session_refresh'] = [
                    'success' => false,
                    'method' => 'kickRole',
                    'roleid' => $result['roleid'],
                    'seconds' => max(1, intval(array_value($payload, 'kick_seconds', array_value($config, 'security_kick_default_seconds', 10)))),
                    'reason' => trim((string) array_value($payload, 'kick_reason', '')) !== ''
                        ? trim((string) array_value($payload, 'kick_reason', ''))
                        : $result['reason'],
                    'error' => $e->getMessage(),
                ];
                $refreshWarning = 'O PK persistido foi limpo, mas nao foi possivel derrubar a sessao online para recarregar o estado em memoria.';
                $result['warning'] = isset($result['warning']) && trim((string) $result['warning']) !== ''
                    ? (trim((string) $result['warning']) . ' ' . $refreshWarning)
                    : $refreshWarning;
            }
        } else {
            $result['warning'] = isset($result['warning']) && trim((string) $result['warning']) !== ''
                ? trim((string) $result['warning'])
                : 'O PK persistido foi limpo. Se o personagem estiver online, o estado visual pode continuar ate relog ou kick.';
        }
    } elseif ($result['action'] === 'reviveRole') {
        $delivery = $proto->reviveRole($result['roleid'], $config['gamedbd_ip'], $config['gamedbd_port']);
        $result['revive'] = $delivery;
        if (!truthyValue(array_value($delivery, 'revived', false))) {
            throw new Exception('Falha ao reviver o personagem');
        }
        $result['message'] = 'Personagem revivido com sucesso';
        if (truthyValue(array_value($payload, 'kick_online', false)) && $result['roleid'] > 0) {
            try {
                $kickReason = trim((string) array_value($payload, 'kick_reason', '')) !== ''
                    ? trim((string) array_value($payload, 'kick_reason', ''))
                    : $result['reason'];
                $kickSeconds = max(1, intval(array_value($payload, 'kick_seconds', array_value($config, 'security_kick_default_seconds', 10))));
                $kickDelivery = $proto->forbidRole(
                    $result['roleid'],
                    $kickSeconds,
                    $kickReason,
                    $config['gdeliveryd_ip'],
                    $config['gdeliveryd_port']
                );
                $result['session_refresh'] = [
                    'success' => true,
                    'method' => 'kickRole',
                    'roleid' => $result['roleid'],
                    'seconds' => $kickSeconds,
                    'reason' => $kickReason,
                    'delivery' => $kickDelivery,
                ];
                try {
                    $roleForbidCleanup = $proto->clearRoleForbidTypes(
                        $result['roleid'],
                        [100],
                        $config['gamedbd_ip'],
                        $config['gamedbd_port']
                    );
                    $result['session_refresh']['role_forbid_cleanup'] = $roleForbidCleanup;
                } catch (Exception $cleanupError) {
                    $result['session_refresh']['role_forbid_cleanup'] = [
                        'success' => false,
                        'types' => [100],
                        'error' => $cleanupError->getMessage(),
                    ];
                }
                $result['message'] .= ' e sessao online derrubada para recarregar o estado';
            } catch (Exception $e) {
                $result['session_refresh'] = [
                    'success' => false,
                    'method' => 'kickRole',
                    'roleid' => $result['roleid'],
                    'seconds' => max(1, intval(array_value($payload, 'kick_seconds', array_value($config, 'security_kick_default_seconds', 10)))),
                    'reason' => trim((string) array_value($payload, 'kick_reason', '')) !== ''
                        ? trim((string) array_value($payload, 'kick_reason', ''))
                        : $result['reason'],
                    'error' => $e->getMessage(),
                ];
                $refreshWarning = 'O revive persistido foi aplicado, mas nao foi possivel derrubar a sessao online para recarregar o estado em memoria.';
                $result['warning'] = isset($result['warning']) && trim((string) $result['warning']) !== ''
                    ? (trim((string) $result['warning']) . ' ' . $refreshWarning)
                    : $refreshWarning;
            }
        }
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

    $gmHistoryWarning = '';
    $gmEntry = gmHistoryEntryBase($config, $result['action'], [
        'status' => 'success',
        'success' => true,
        'dry_run' => false,
        'reason' => $result['reason'],
        'seconds' => $result['seconds'],
        'sid' => $result['sid'],
        'target' => [
            'roleid' => intval(array_value($result, 'roleid', 0)),
            'userid' => intval(array_value($result, 'userid', 0)),
        ],
        'ban' => ($result['action'] === 'banAccount') ? array_value($result, 'account_ban', null) : null,
        'kick' => ($result['action'] === 'banAccount')
            ? (array_value($result, 'session_kick', truthyValue(array_value($result, 'kick_online', false)) ? [
                'requested' => true,
                'roleid' => intval(array_value($result, 'roleid', 0)),
                'seconds' => intval(array_value($result, 'kick_seconds', 0)),
                'reason' => array_value($result, 'kick_reason', ''),
            ] : null))
            : null,
        'teleport' => ($result['action'] === 'teleportRole') ? [
            'tag' => intval(array_value($result, 'tag', 0)),
            'x' => floatval(array_value($result, 'x', 0)),
            'y' => floatval(array_value($result, 'y', 0)),
            'z' => floatval(array_value($result, 'z', 0)),
        ] : null,
        'pk_clear' => ($result['action'] === 'clearRolePk') ? array_value($result, 'pk_clear', null) : null,
        'session_refresh' => in_array($result['action'], ['clearRolePk', 'reviveRole'], true)
            ? array_value($result, 'session_refresh', null)
            : null,
        'revive' => ($result['action'] === 'reviveRole') ? array_value($result, 'revive', null) : null,
        'message' => $result['message'],
        'delivery' => $delivery,
        'deliveryd_forbid' => ($result['action'] === 'banAccount') ? array_value($result, 'deliveryd_forbid', null) : null,
        'deliveryd_unforbid' => ($result['action'] === 'unbanAccount') ? array_value($result, 'deliveryd_unforbid', null) : null,
        'login_cache_refresh' => ($result['action'] === 'unbanAccount') ? array_value($result, 'login_cache_refresh', null) : null,
    ]);
    if (gmAppendHistoryBestEffort($config, $gmEntry, $gmHistoryWarning)) {
        $result['gm_history_file'] = gmActionHistoryFile($config);
    } elseif ($gmHistoryWarning !== '') {
        $result['gm_history_warning'] = $gmHistoryWarning;
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
        'sha1' => (function_exists('sha1_file') && is_file($file)) ? sha1_file($file) : '',
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

function backupNowTypeDefinitions(array $config)
{
    return [
        'gamedbd' => [
            'key' => 'gamedbd',
            'label' => 'GameDB',
            'command_key' => 'gamedbd_backup_command',
            'dir_key' => 'gamedbd_backup_dir',
            'enabled_key' => 'gamedbd_backup_enabled',
            'file_pattern' => 'gamedbd-backup-*.tgz',
            'backup_item_type' => 'gamedbd_backup',
            'response_key' => 'gamedbd_backups',
        ],
        'clsconfig' => [
            'key' => 'clsconfig',
            'label' => 'CLSConfig',
            'command_key' => 'clsconfig_archive_backup_command',
            'dir_key' => 'clsconfig_archive_backup_dir',
            'enabled_key' => 'clsconfig_archive_backup_enabled',
            'file_pattern' => 'clsconfig-backup-*.tgz',
            'backup_item_type' => 'clsconfig_archive',
            'response_key' => 'clsconfig_archives',
        ],
        'mysql' => [
            'key' => 'mysql',
            'label' => 'MySQL/MariaDB',
            'command_key' => 'mysql_backup_command',
            'dir_key' => 'mysql_backup_dir',
            'enabled_key' => 'mysql_backup_enabled',
            'file_pattern' => 'mysql-backup-*.sql.gz',
            'backup_item_type' => 'mysql_backup',
            'response_key' => 'mysql_backups',
        ],
        'uniquenamed' => [
            'key' => 'uniquenamed',
            'label' => 'UniqueNamed',
            'command_key' => 'uniquenamed_backup_command',
            'dir_key' => 'uniquenamed_backup_dir',
            'enabled_key' => 'uniquenamed_backup_enabled',
            'file_pattern' => 'uniquenamed-backup-*.tgz',
            'backup_item_type' => 'uniquenamed_backup',
            'response_key' => 'uniquenamed_backups',
        ],
        'panel' => [
            'key' => 'panel',
            'label' => 'Painel Web',
            'command_key' => 'panel_backup_command',
            'dir_key' => 'panel_backup_dir',
            'enabled_key' => 'panel_backup_enabled',
            'file_pattern' => 'panel-backup-*.tgz',
            'backup_item_type' => 'panel_backup',
            'response_key' => 'panel_backups',
        ],
        'full' => [
            'key' => 'full',
            'label' => 'Backup Completo',
            'command_key' => 'full_backup_command',
            'dir_key' => 'full_backup_dir',
            'enabled_key' => 'full_backup_enabled',
            'file_pattern' => 'full-backup-*.tgz',
            'backup_item_type' => 'full_backup',
            'response_key' => 'full_backups',
        ],
    ];
}

function backupNowNormalizeType($type)
{
    $type = strtolower(trim((string) $type));
    $aliases = [
        'db' => 'gamedbd',
        'gamedb' => 'gamedbd',
        'database' => 'gamedbd',
        'mariadb' => 'mysql',
        'unique' => 'uniquenamed',
        'clsconfig_archive' => 'clsconfig',
        'web' => 'panel',
        'site' => 'panel',
        'all' => 'full',
    ];

    return isset($aliases[$type]) ? $aliases[$type] : $type;
}

function availableBackupNowTypes(array $config)
{
    $available = [];
    foreach (backupNowTypeDefinitions($config) as $key => $spec) {
        $enabledKey = trim((string) array_value($spec, 'enabled_key', ''));
        if ($enabledKey !== '' && !truthyValue(array_value($config, $enabledKey, true))) {
            continue;
        }
        $available[] = $key;
    }
    return $available;
}

function backupNowDefinition(array $config, $type)
{
    $type = backupNowNormalizeType($type);
    $definitions = backupNowTypeDefinitions($config);
    if (!isset($definitions[$type])) {
        throw new InvalidArgumentException('type de backup invalido: ' . $type . '. Use: ' . implode(', ', availableBackupNowTypes($config)));
    }

    return $definitions[$type];
}

function listClsconfigBackups(array $config, $limit = 100)
{
    $roleJson = listBackupFiles(array_value($config, 'clsconfig_backup_dir', ''), 'roleid-*.json', 'role_json', $limit);
    $clsconfigFiles = listBackupFiles(array_value($config, 'clsconfig_file_backup_dir', ''), 'clsconfig-roleid-*', 'clsconfig_file', $limit);
    $exportLogs = listBackupFiles(array_value($config, 'clsconfig_export_log_dir', ''), 'exportclsconfig-*.log', 'export_log', $limit);
    $definitions = backupNowTypeDefinitions($config);
    $gamedbdBackups = listBackupFiles(array_value($config, 'gamedbd_backup_dir', ''), array_value(array_value($definitions, 'gamedbd', []), 'file_pattern', 'gamedbd-backup-*.tgz'), 'gamedbd_backup', $limit);
    $clsconfigArchives = listBackupFiles(array_value($config, 'clsconfig_archive_backup_dir', ''), array_value(array_value($definitions, 'clsconfig', []), 'file_pattern', 'clsconfig-backup-*.tgz'), 'clsconfig_archive', $limit);
    $mysqlBackups = listBackupFiles(array_value($config, 'mysql_backup_dir', ''), array_value(array_value($definitions, 'mysql', []), 'file_pattern', 'mysql-backup-*.sql.gz'), 'mysql_backup', $limit);
    $uniquenamedBackups = listBackupFiles(array_value($config, 'uniquenamed_backup_dir', ''), array_value(array_value($definitions, 'uniquenamed', []), 'file_pattern', 'uniquenamed-backup-*.tgz'), 'uniquenamed_backup', $limit);
    $panelBackups = listBackupFiles(array_value($config, 'panel_backup_dir', ''), array_value(array_value($definitions, 'panel', []), 'file_pattern', 'panel-backup-*.tgz'), 'panel_backup', $limit);
    $fullBackups = listBackupFiles(array_value($config, 'full_backup_dir', ''), array_value(array_value($definitions, 'full', []), 'file_pattern', 'full-backup-*.tgz'), 'full_backup', $limit);

    $all = array_merge($roleJson, $clsconfigFiles, $exportLogs, $gamedbdBackups, $clsconfigArchives, $mysqlBackups, $uniquenamedBackups, $panelBackups, $fullBackups);
    usort($all, function ($a, $b) {
        return intval(array_value($b, 'mtime', 0)) <=> intval(array_value($a, 'mtime', 0));
    });

    return [
        'role_json' => $roleJson,
        'clsconfig_files' => $clsconfigFiles,
        'export_logs' => $exportLogs,
        'gamedbd_backups' => $gamedbdBackups,
        'clsconfig_archives' => $clsconfigArchives,
        'mysql_backups' => $mysqlBackups,
        'uniquenamed_backups' => $uniquenamedBackups,
        'panel_backups' => $panelBackups,
        'full_backups' => $fullBackups,
        'available_backup_types' => availableBackupNowTypes($config),
        'supported_types' => availableBackupNowTypes($config),
        'all' => array_slice($all, 0, max(1, intval($limit))),
        'dirs' => [
            'role_json' => safeBackupRealPath(array_value($config, 'clsconfig_backup_dir', '')),
            'clsconfig_files' => safeBackupRealPath(array_value($config, 'clsconfig_file_backup_dir', '')),
            'export_logs' => safeBackupRealPath(array_value($config, 'clsconfig_export_log_dir', '')),
            'gamedbd_backups' => safeBackupRealPath(array_value($config, 'gamedbd_backup_dir', '')),
            'clsconfig_archives' => safeBackupRealPath(array_value($config, 'clsconfig_archive_backup_dir', '')),
            'mysql_backups' => safeBackupRealPath(array_value($config, 'mysql_backup_dir', '')),
            'uniquenamed_backups' => safeBackupRealPath(array_value($config, 'uniquenamed_backup_dir', '')),
            'panel_backups' => safeBackupRealPath(array_value($config, 'panel_backup_dir', '')),
            'full_backups' => safeBackupRealPath(array_value($config, 'full_backup_dir', '')),
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

function backupNowReasonValue(array $request)
{
    $reason = trim((string) firstArrayValue($request, ['reason', 'label', 'note'], 'manual'));
    $backup = array_value($request, 'backup', null);
    if ($reason === '' && is_array($backup)) {
        $reason = trim((string) firstArrayValue($backup, ['reason', 'label', 'note'], 'manual'));
    }

    if ($reason === '') {
        $reason = 'manual';
    }

    $reason = preg_replace('/[^a-zA-Z0-9_.:-]+/', '_', $reason);
    $reason = trim((string) $reason, '_');
    return $reason !== '' ? $reason : 'manual';
}

function backupNowTypeValue(array $request)
{
    $type = trim((string) firstArrayValue($request, ['type', 'backup_type', 'backupType', 'kind'], ''));
    $backup = array_value($request, 'backup', null);
    if ($type === '' && is_array($backup)) {
        $type = trim((string) firstArrayValue($backup, ['type', 'backup_type', 'backupType', 'kind'], ''));
    }

    return backupNowNormalizeType($type);
}

function executeBackupNowByDefinition(array $config, array $definition, $reason, $dryRun = false)
{
    $type = trim((string) array_value($definition, 'key', ''));
    $label = trim((string) array_value($definition, 'label', strtoupper($type)));
    $dirKey = trim((string) array_value($definition, 'dir_key', ''));
    $commandKey = trim((string) array_value($definition, 'command_key', ''));
    $backupItemType = trim((string) array_value($definition, 'backup_item_type', $type));
    $filePattern = trim((string) array_value($definition, 'file_pattern', ''));
    $enabledKey = trim((string) array_value($definition, 'enabled_key', ''));

    if ($enabledKey !== '' && !truthyValue(array_value($config, $enabledKey, true))) {
        throw new Exception('Backup ' . $type . ' desabilitado na configuracao da API');
    }

    $backupDir = trim((string) array_value($config, $dirKey, ''));
    if ($backupDir === '') {
        throw new Exception('Diretorio de backup nao configurado para ' . $type);
    }

    if (!is_dir($backupDir) && !@mkdir($backupDir, 0750, true)) {
        throw new Exception('Nao foi possivel criar diretorio de backup para ' . $type . ': ' . $backupDir);
    }

    if (!is_dir($backupDir) || !is_writable($backupDir)) {
        throw new Exception('Diretorio de backup sem permissao de escrita para ' . $type . ': ' . $backupDir);
    }

    $command = trim((string) array_value($config, $commandKey, ''));
    if ($command === '') {
        throw new Exception('Comando de backup nao configurado para ' . $type);
    }

    $safeReason = backupNowReasonValue(['reason' => $reason]);
    if ($dryRun) {
        return [
            'type' => $type,
            'label' => $label,
            'dry_run' => true,
            'mode' => 'dry_run',
            'command' => $command,
            'target_dir' => safeBackupRealPath($backupDir),
            'file_pattern' => $filePattern,
            'backup_item_type' => $backupItemType,
            'reason' => $safeReason,
        ];
    }

    $result = executeServerOpsCommand(
        $command . ' ' . escapeshellarg($backupDir) . ' ' . escapeshellarg($safeReason),
        intval(array_value($config, 'backup_now_timeout_seconds', 1800))
    );

    if (empty($result['success'])) {
        throw new Exception(
            'Backup ' . $type . ' falhou (exit ' . intval(array_value($result, 'exit_code', 1)) . '): '
            . trim((string) array_value($result, 'stdout_excerpt', ''))
        );
    }

    $parsed = is_array(array_value($result, 'parsed', null)) ? array_value($result, 'parsed', []) : [];
    if (empty($parsed)) {
        $parsed = [
            'stdout' => trim((string) array_value($result, 'stdout_excerpt', '')),
        ];
    }

    $file = trim((string) array_value($parsed, 'file', ''));
    if ($file !== '' && is_file($file)) {
        $parsed = array_merge($parsed, backupFileInfo($file, $backupItemType));
    }

    $parsed['type'] = $type;
    $parsed['label'] = $label;
    $parsed['backup_item_type'] = $backupItemType;
    $parsed['mode'] = 'created';
    $parsed['reason'] = $safeReason;
    return $parsed;
}

function handleBackupNowRequest(array $config, array $request)
{
    $type = backupNowTypeValue($request);
    if ($type === '') {
        throw new InvalidArgumentException('Informe type para backupNow. Use: ' . implode(', ', availableBackupNowTypes($config)));
    }

    $dryRun = truthyValue(firstArrayValue($request, ['dry_run', 'dryRun'], false));
    $force = truthyValue(array_value($request, 'force', false));
    $reason = backupNowReasonValue($request);
    $definition = backupNowDefinition($config, $type);

    if ($type === 'gamedbd' && !$dryRun) {
        $backup = createGamedbdSafetyBackup($config, $reason, $force);
        $backup['type'] = 'gamedbd';
        $backup['label'] = trim((string) array_value($definition, 'label', 'GameDB'));
    } else {
        $backup = executeBackupNowByDefinition($config, $definition, $reason, $dryRun);
    }

    return [
        'success' => true,
        'backup' => $backup,
        'supported_types' => availableBackupNowTypes($config),
        'requested_at' => gmdate('c'),
    ];
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

function gmCommanderVersionValue(array $config)
{
    $raw = strtolower(trim((string) array_value($config, 'game_version', '')));
    if ($raw !== '' && preg_match('/(\d+)/', $raw, $m)) {
        return $m[1];
    }
    return $raw;
}

function gmCommanderFeatureMatrix(array $config)
{
    $version = gmCommanderVersionValue($config);
    $supported = [
        'muteAccount' => false,
        'muteRole' => false,
        'teleportRole' => false,
        'clearRolePk' => false,
        'reviveRole' => false,
    ];
    $opcodes = [
        'muteAccount' => 0,
        'muteRole' => 0,
        'teleportRole' => 0,
    ];

    if (in_array($version, ['101', '155'], true)) {
        $supported['muteAccount'] = true;
        $supported['muteRole'] = true;
        $supported['clearRolePk'] = true;
        $supported['reviveRole'] = true;
        $opcodes['muteAccount'] = 362;
        $opcodes['muteRole'] = 356;
    } elseif ($version === '352') {
        $supported['muteAccount'] = true;
        $supported['muteRole'] = true;
        $supported['teleportRole'] = true;
        $opcodes['muteAccount'] = 356;
        $opcodes['muteRole'] = 362;
        $opcodes['teleportRole'] = 13010;
    }

    return [
        'game_version' => $version,
        'supported' => $supported,
        'opcodes' => $opcodes,
        'delivery_sid_default' => intval(array_value($config, 'gm_delivery_sid_default', 0)),
    ];
}

function gmCommandDefinitions(array $config)
{
    $features = gmCommanderFeatureMatrix($config);
    $teleportSupported = !empty($features['supported']['teleportRole']);
    $clearRolePkSupported = !empty($features['supported']['clearRolePk']);
    $reviveRoleSupported = !empty($features['supported']['reviveRole']);
    $gmPermissionSupported = gmPermissionEnabled($config);
    $version = (string) array_value($features, 'game_version', '');
    $baseUrl = '/apicls/api_cls.php?action=';
    $sidHint = intval(array_value($features, 'delivery_sid_default', 0));

    return [
        'sendMailItem' => [
            'key' => 'sendMailItem',
            'label' => 'Enviar Item por Correio',
            'category' => 'compensation',
            'supported' => true,
            'status' => 'supported',
            'method' => 'POST',
            'endpoint' => $baseUrl . 'sendMailItem',
            'aliases' => ['mailItem', 'grantItem'],
            'required_fields' => ['roleid', 'item_id'],
            'optional_fields' => ['count', 'title', 'message', 'data_hex', 'proctype', 'expire_date', 'guid1', 'guid2', 'mask', 'money', 'dry_run'],
            'dry_run_supported' => true,
            'requires_confirmation' => false,
            'summary' => 'Entrega um item por correio interno para um personagem.',
            'notes' => ['Use getItemCatalog para pesquisar item_id antes do envio.'],
        ],
        'sendMailGold' => [
            'key' => 'sendMailGold',
            'label' => 'Enviar Moedas por Correio',
            'category' => 'compensation',
            'supported' => true,
            'status' => 'supported',
            'method' => 'POST',
            'endpoint' => $baseUrl . 'sendMailGold',
            'aliases' => ['mailGold', 'sendCoins'],
            'required_fields' => ['roleid', 'money'],
            'optional_fields' => ['title', 'message', 'dry_run'],
            'dry_run_supported' => true,
            'requires_confirmation' => false,
            'summary' => 'Entrega moedas normais do jogo ao personagem por correio interno.',
            'notes' => [
                'Este comando usa o campo money do correio interno.',
                'Nao altera o saldo de cash/gold da loja de itens da conta.',
            ],
        ],
        'grantMallCash' => [
            'key' => 'grantMallCash',
            'label' => 'Adicionar Gold da Loja',
            'category' => 'compensation',
            'supported' => mallCashEnabled($config),
            'status' => mallCashEnabled($config) ? 'supported' : 'disabled',
            'method' => 'POST',
            'endpoint' => $baseUrl . 'grantMallCash',
            'aliases' => ['addShopGold', 'grantCash', 'addCash', 'grantItemMallGold'],
            'required_fields' => ['amount', 'reason'],
            'optional_fields' => ['userid', 'roleid', 'cash_units', 'dry_run', 'confirm'],
            'dry_run_supported' => true,
            'requires_confirmation' => true,
            'summary' => 'Credita cash/gold da loja de itens diretamente na conta usando a rotina operacional usecash.',
            'notes' => [
                'Este gold e diferente das moedas normais enviadas por sendMailGold.',
                'Quando amount e informado, a API converte gold para cash_units usando units_per_gold=' . mallCashUnitsPerGold($config) . '.',
                'Voce pode informar userid diretamente ou resolver a conta a partir de um roleid.',
                'A confirmacao operacional deve observar o delta em cash e tambem em cash_add.',
            ],
        ],
        'grantGmPermission' => [
            'key' => 'grantGmPermission',
            'label' => 'Permissao GM para Conta',
            'category' => 'permissions',
            'supported' => $gmPermissionSupported,
            'status' => $gmPermissionSupported ? 'supported' : 'disabled',
            'method' => 'POST',
            'endpoint' => $baseUrl . 'grantGmPermission',
            'aliases' => ['setGmPermission'],
            'required_fields' => ['reason'],
            'optional_fields' => ['userid', 'roleid', 'permission_level', 'rule_ids', 'dry_run', 'confirm'],
            'dry_run_supported' => $gmPermissionSupported,
            'requires_confirmation' => true,
            'summary' => 'Concede permissao GM na conta usando a tabela auth do servidor e um template real de regras ja em uso.',
            'notes' => [
                'Voce pode enviar rule_ids para conceder apenas permissoes especificas, como no pwadmin.',
                'Use getGmPermissionState antes do grant para validar o template detectado para esta VPS.',
                'Quando gm_permission_rule_ids estiver vazio, a API tenta descobrir automaticamente um conjunto real de rid(s) a partir de uma conta GM existente.',
                'A acao opera no escopo de conta (userid), mesmo quando o alvo e resolvido via roleid.',
            ],
        ],
        'revokeGmPermission' => [
            'key' => 'revokeGmPermission',
            'label' => 'Remover Permissao GM',
            'category' => 'permissions',
            'supported' => $gmPermissionSupported,
            'status' => $gmPermissionSupported ? 'supported' : 'disabled',
            'method' => 'POST',
            'endpoint' => $baseUrl . 'revokeGmPermission',
            'aliases' => ['removeGmPermission', 'unsetGmPermission'],
            'required_fields' => ['reason'],
            'optional_fields' => ['userid', 'roleid', 'rule_ids', 'dry_run', 'confirm'],
            'dry_run_supported' => $gmPermissionSupported,
            'requires_confirmation' => true,
            'summary' => 'Remove da conta o mesmo conjunto de permissao GM identificado pelo template de auth configurado/detectado.',
            'notes' => [
                'Voce pode enviar rule_ids para remover apenas permissoes especificas, como no pwadmin.',
                'Use getGmPermissionState para revisar os rid(s) atuais antes de remover.',
                'A remocao usa o mesmo template de auth empregado para o grant nesta VPS.',
            ],
        ],
        'sendSystemMessage' => [
            'key' => 'sendSystemMessage',
            'label' => 'Mensagem Global',
            'category' => 'broadcast',
            'supported' => true,
            'status' => 'supported',
            'method' => 'POST',
            'endpoint' => $baseUrl . 'sendSystemMessage',
            'aliases' => ['systemBroadcast', 'broadcastMessage'],
            'required_fields' => ['message'],
            'optional_fields' => ['kind', 'priority', 'dry_run'],
            'dry_run_supported' => true,
            'requires_confirmation' => false,
            'summary' => 'Dispara mensagem global pelo gacd.',
            'notes' => [],
        ],
        'kickRole' => [
            'key' => 'kickRole',
            'label' => 'Kick de Personagem',
            'category' => 'moderation',
            'supported' => true,
            'status' => 'supported',
            'method' => 'POST',
            'endpoint' => $baseUrl . 'kickRole',
            'aliases' => ['kickCharacter'],
            'required_fields' => ['roleid', 'reason'],
            'optional_fields' => ['duration_seconds', 'dry_run'],
            'dry_run_supported' => true,
            'requires_confirmation' => false,
            'summary' => 'Expulsa o personagem da sessao atual usando a rotina de kick ja validada.',
            'notes' => [],
        ],
        'banAccount' => [
            'key' => 'banAccount',
            'label' => 'Banir Conta',
            'category' => 'moderation',
            'supported' => true,
            'status' => 'supported',
            'method' => 'POST',
            'endpoint' => $baseUrl . 'banAccount',
            'aliases' => ['forbidAccount'],
            'required_fields' => ['reason'],
            'optional_fields' => ['userid', 'account_id', 'roleid', 'duration_seconds', 'permanent', 'kick_online', 'kick_seconds', 'kick_reason', 'dry_run'],
            'dry_run_supported' => true,
            'requires_confirmation' => false,
            'summary' => 'Aplica ban temporario ou permanente em conta, podendo resolver userid via roleid.',
            'notes' => [
                'Em servidores legados como game_version 101, a API usa automaticamente a tabela MySQL forbid quando o caminho via gamedbd nao se aplica.',
                'A operacao age no escopo da conta (userid), mesmo quando o alvo e resolvido via roleid.',
                'Quando kick_online=true e roleid e informado, a API tenta derrubar a sessao online do personagem apos aplicar o ban da conta.',
            ],
        ],
        'unbanAccount' => [
            'key' => 'unbanAccount',
            'label' => 'Desbanir Conta',
            'category' => 'moderation',
            'supported' => true,
            'status' => 'supported',
            'method' => 'POST',
            'endpoint' => $baseUrl . 'unbanAccount',
            'aliases' => ['releaseAccount'],
            'required_fields' => [],
            'optional_fields' => ['userid', 'account_id', 'roleid', 'reason', 'refresh_login_cache', 'refresh_services', 'dry_run'],
            'dry_run_supported' => true,
            'requires_confirmation' => false,
            'summary' => 'Remove bloqueios da conta e tenta limpar forbid do role quando informado.',
            'notes' => [
                'Em servidores legados como game_version 101, a API usa automaticamente a tabela MySQL forbid quando o caminho via gamedbd nao se aplica.',
                'Quando roleid e informado, a API ainda tenta limpar o forbid persistido no base do personagem.',
                'Use refresh_login_cache=true para reiniciar apenas o authd apos o unban, reduzindo o risco de cache de login sem impactar jogadores online.',
                'Se ainda houver bloqueio preso, refresh_services pode receber authd, gdeliveryd e glinkd nessa ordem de escalada operacional.',
            ],
        ],
        'muteAccount' => [
            'key' => 'muteAccount',
            'label' => 'Mutar Conta',
            'category' => 'moderation',
            'supported' => !empty($features['supported']['muteAccount']),
            'status' => !empty($features['supported']['muteAccount']) ? 'supported' : 'version_gated',
            'method' => 'POST',
            'endpoint' => $baseUrl . 'muteAccount',
            'aliases' => ['muteAcc'],
            'required_fields' => ['reason', 'duration_seconds'],
            'optional_fields' => ['userid', 'account_id', 'roleid', 'sid', 'localsid', 'dry_run'],
            'dry_run_supported' => !empty($features['supported']['muteAccount']),
            'requires_confirmation' => false,
            'summary' => 'Bloqueia chat da conta no gdeliveryd usando o protocolo legado validado.',
            'notes' => [
                'Para game_version ' . $version . ', o SID padrao enviado para o delivery eh ' . $sidHint . '.',
            ],
        ],
        'muteRole' => [
            'key' => 'muteRole',
            'label' => 'Mutar Personagem',
            'category' => 'moderation',
            'supported' => !empty($features['supported']['muteRole']),
            'status' => !empty($features['supported']['muteRole']) ? 'supported' : 'version_gated',
            'method' => 'POST',
            'endpoint' => $baseUrl . 'muteRole',
            'aliases' => ['muteCharacter'],
            'required_fields' => ['roleid', 'reason', 'duration_seconds'],
            'optional_fields' => ['sid', 'localsid', 'dry_run'],
            'dry_run_supported' => !empty($features['supported']['muteRole']),
            'requires_confirmation' => false,
            'summary' => 'Bloqueia chat do personagem no gdeliveryd usando o protocolo legado validado.',
            'notes' => [
                'Para game_version ' . $version . ', o SID padrao enviado para o delivery eh ' . $sidHint . '.',
            ],
        ],
        'teleportRole' => [
            'key' => 'teleportRole',
            'label' => 'Teleport de Personagem',
            'category' => 'mobility',
            'supported' => $teleportSupported,
            'status' => $teleportSupported ? 'supported' : 'version_gated',
            'method' => 'POST',
            'endpoint' => $baseUrl . 'teleportRole',
            'aliases' => ['playerTeleport'],
            'required_fields' => ['roleid', 'tag', 'x', 'y', 'z'],
            'optional_fields' => ['worldtag', 'dry_run'],
            'dry_run_supported' => $teleportSupported,
            'requires_confirmation' => false,
            'summary' => $teleportSupported
                ? 'Teleporta o personagem usando o opcode legado validado para esta versao.'
                : 'Contrato reservado. Ainda nao ha prova tecnica suficiente para esta game_version.',
            'notes' => $teleportSupported
                ? []
                : ['Teleport so ficou validado no legado para protocolos com suporte equivalente ao v352.'],
        ],
        'summonRole' => [
            'key' => 'summonRole',
            'label' => 'Summon de Personagem',
            'category' => 'mobility',
            'supported' => false,
            'status' => 'contract_only',
            'method' => 'POST',
            'endpoint' => $baseUrl . 'summonRole',
            'aliases' => [],
            'required_fields' => ['roleid'],
            'optional_fields' => ['target_roleid', 'dry_run'],
            'dry_run_supported' => false,
            'requires_confirmation' => false,
            'summary' => 'Contrato reservado para comando futuro de summon.',
            'notes' => ['Sem prova tecnica local suficiente para habilitar com seguranca.'],
        ],
        'prisonRole' => [
            'key' => 'prisonRole',
            'label' => 'Prender Personagem',
            'category' => 'mobility',
            'supported' => false,
            'status' => 'contract_only',
            'method' => 'POST',
            'endpoint' => $baseUrl . 'prisonRole',
            'aliases' => [],
            'required_fields' => ['roleid'],
            'optional_fields' => ['reason', 'dry_run'],
            'dry_run_supported' => false,
            'requires_confirmation' => false,
            'summary' => 'Contrato reservado para especializar teleport em uma prisao operacional.',
            'notes' => ['Depende de teleport validado + coordenadas oficiais da prisao.'],
        ],
        'clearRolePk' => [
            'key' => 'clearRolePk',
            'label' => 'Limpar PK',
            'category' => 'advanced',
            'supported' => $clearRolePkSupported,
            'status' => $clearRolePkSupported ? 'supported' : 'contract_only',
            'method' => 'POST',
            'endpoint' => $baseUrl . 'clearRolePk',
            'aliases' => [],
            'required_fields' => ['roleid'],
            'optional_fields' => ['reason', 'dry_run', 'kick_online', 'kick_seconds', 'kick_reason'],
            'dry_run_supported' => $clearRolePkSupported,
            'requires_confirmation' => false,
            'summary' => $clearRolePkSupported
                ? 'Limpa o estado PK persistido do personagem, zerando contadores e timers relevantes.'
                : 'Contrato reservado para limpar estado de PK do personagem.',
            'notes' => $clearRolePkSupported
                ? [
                    'A limpeza zera pk_count em status.var_data e tambem invader_state, invader_time e pariah_time.',
                    'Se o personagem estiver online, a API pode opcionalmente derrubar a sessao com kick_online=true para forcar o recarregamento do estado em memoria.',
                ]
                : ['Sem prova tecnica local suficiente para habilitar com seguranca.'],
        ],
        'reviveRole' => [
            'key' => 'reviveRole',
            'label' => 'Reviver Personagem',
            'category' => 'advanced',
            'supported' => $reviveRoleSupported,
            'status' => $reviveRoleSupported ? 'supported' : 'version_gated',
            'method' => 'POST',
            'endpoint' => $baseUrl . 'reviveRole',
            'aliases' => [],
            'required_fields' => ['roleid'],
            'optional_fields' => ['reason', 'dry_run', 'kick_online', 'kick_seconds', 'kick_reason'],
            'dry_run_supported' => $reviveRoleSupported,
            'requires_confirmation' => false,
            'summary' => $reviveRoleSupported
                ? 'Revive o personagem limpando flags persistidas de morte e restaurando HP/MP para valores validos.'
                : 'Contrato reservado para revive operacional.',
            'notes' => $reviveRoleSupported
                ? [
                    'A rotina limpa dead_flag e resurrect_state em status.var_data, restaurando HP/MP a partir do status persistido do personagem.',
                    'Se o cliente estiver morto em sessao online mas o persistido parecer vivo, a API ainda forca a escrita de revive.',
                    'Quando kick_online=true, a API derruba a sessao para recarregar o estado persistido no proximo login.',
                ]
                : ['Sem prova tecnica local suficiente para habilitar com seguranca.'],
        ],
        'resetRoleQuest' => [
            'key' => 'resetRoleQuest',
            'label' => 'Resetar Quest',
            'category' => 'advanced',
            'supported' => false,
            'status' => 'contract_only',
            'method' => 'POST',
            'endpoint' => $baseUrl . 'resetRoleQuest',
            'aliases' => [],
            'required_fields' => ['roleid'],
            'optional_fields' => ['quest_id', 'dry_run'],
            'dry_run_supported' => false,
            'requires_confirmation' => false,
            'summary' => 'Contrato reservado para reset de quest.',
            'notes' => ['Sem prova tecnica local suficiente para habilitar com seguranca.'],
        ],
    ];
}

function gmCommandDefinition(array $config, $key)
{
    $definitions = gmCommandDefinitions($config);
    $key = trim((string) $key);
    if (isset($definitions[$key])) {
        return $definitions[$key];
    }

    foreach ($definitions as $definitionKey => $definition) {
        $aliases = array_value($definition, 'aliases', []);
        if (is_array($aliases) && in_array($key, $aliases, true)) {
            return $definitions[$definitionKey];
        }
    }

    return null;
}

function gmActionHistoryFile(array $config)
{
    return trim((string) array_value($config, 'gm_history_file', __DIR__ . '/backups/gm-actions/history.log'));
}

function gmHistoryEntryBase(array $config, $commandKey, array $entry = [])
{
    $definition = gmCommandDefinition($config, $commandKey);
    $canonicalKey = is_array($definition) ? array_value($definition, 'key', trim((string) $commandKey)) : trim((string) $commandKey);
    return array_merge([
        'type' => 'gm_action',
        'command_key' => $canonicalKey,
        'label' => is_array($definition) ? array_value($definition, 'label', $canonicalKey) : $canonicalKey,
        'category' => is_array($definition) ? array_value($definition, 'category', 'general') : 'general',
        'created_at' => gmdate('c'),
    ], $entry);
}

function gmAppendHistoryBestEffort(array $config, array $entry, &$warning = '')
{
    $warning = '';
    try {
        appendLogLine(gmActionHistoryFile($config), safeJsonEncode($entry));
        return true;
    } catch (Exception $e) {
        $warning = $e->getMessage();
        return false;
    }
}

function gmReadHistory(array $config, $limit)
{
    $limit = max(1, min(500, intval($limit)));
    $path = gmActionHistoryFile($config);
    if ($path === '' || !is_file($path) || !is_readable($path)) {
        return [];
    }

    $lines = @file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    if (!is_array($lines) || empty($lines)) {
        return [];
    }

    $lines = array_reverse(array_slice($lines, -$limit));
    $entries = [];
    foreach ($lines as $line) {
        $decoded = json_decode((string) $line, true);
        if (is_array($decoded)) {
            $entries[] = $decoded;
        } else {
            $entries[] = [
                'type' => 'raw',
                'line' => (string) $line,
            ];
        }
    }

    return $entries;
}

function gmCommandCatalogPayload(array $config)
{
    $definitions = gmCommandDefinitions($config);
    $items = array_values($definitions);
    usort($items, function ($a, $b) {
        return strnatcasecmp((string) array_value($a, 'label', ''), (string) array_value($b, 'label', ''));
    });

    $supported = [];
    $unsupported = [];
    foreach ($items as $item) {
        if (!empty($item['supported'])) {
            $supported[] = array_value($item, 'key', '');
        } else {
            $unsupported[] = array_value($item, 'key', '');
        }
    }

    return [
        'success' => true,
        'game_version' => gmCommanderVersionValue($config),
        'history_file' => gmActionHistoryFile($config),
        'commands' => $items,
        'supported_commands' => $supported,
        'unsupported_commands' => $unsupported,
        'helper_endpoints' => [
            'item_catalog' => '/apicls/api_cls.php?action=getItemCatalog',
            'history' => '/apicls/api_cls.php?action=getGmActionHistory',
            'mall_cash_balance' => '/apicls/api_cls.php?action=getMallCashBalance',
            'gm_permission_catalog' => '/apicls/api_cls.php?action=getGmPermissionCatalog',
            'gm_permission_state' => '/apicls/api_cls.php?action=getGmPermissionState',
            'player_directory' => '/apicls/api_cls.php?action=searchPlayerDirectory',
            'player_profile' => '/apicls/api_cls.php?action=getPlayerTargetProfile',
            'bulk_targets_preview' => '/apicls/api_cls.php?action=previewBulkTargets',
            'bulk_targets_resolve' => '/apicls/api_cls.php?action=resolveBulkTargets',
            'bulk_queue' => '/apicls/api_cls.php?action=queueBulkCommand',
            'bulk_job' => '/apicls/api_cls.php?action=getBulkCommandJob',
            'bulk_jobs' => '/apicls/api_cls.php?action=getBulkCommandJobs',
            'bulk_schedule_create' => '/apicls/api_cls.php?action=scheduleBulkCommand',
            'bulk_schedule' => '/apicls/api_cls.php?action=getBulkSchedule',
            'bulk_schedules' => '/apicls/api_cls.php?action=getBulkSchedules',
            'bulk_schedule_update' => '/apicls/api_cls.php?action=updateBulkSchedule',
            'bulk_schedule_delete' => '/apicls/api_cls.php?action=deleteBulkSchedule',
            'bulk_schedule_runner' => '/apicls/api_cls.php?action=runDueBulkSchedules',
        ],
        'collected_at' => gmdate('c'),
    ];
}

function restoreHistoryFile(array $config)
{
    return trim((string) array_value($config, 'restore_history_file', __DIR__ . '/backups/restore/history.log'));
}

function restoreTypeDefinitions(array $config)
{
    return [
        'role_json' => [
            'key' => 'role_json',
            'label' => 'Role JSON',
            'dir_key' => 'clsconfig_backup_dir',
            'file_regex' => '/^roleid-\d+-\d{8}-\d{6}-[a-f0-9]{8}\.json$/i',
            'supported' => true,
            'severity' => 'low',
            'restore_level' => 'light',
            'requires_confirmation' => true,
            'confirm_token' => 'RESTORE_ROLE_JSON',
            'dry_run_supported' => true,
            'requires_gamedbd_backup' => true,
            'safety_backup_types' => ['gamedbd_backup'],
            'affected_components' => ['gamedbd', 'clsconfig_template'],
            'affected_services' => [],
            'summary' => 'Restaura o template editavel do role a partir de um backup JSON seguro.',
        ],
        'clsconfig_file' => [
            'key' => 'clsconfig_file',
            'label' => 'CLSConfig File',
            'dir_key' => 'clsconfig_file_backup_dir',
            'file_regex' => '/^clsconfig-roleid-\d+-\d{8}-\d{6}-[a-f0-9]{8}$/i',
            'supported' => true,
            'severity' => 'low',
            'restore_level' => 'light',
            'requires_confirmation' => true,
            'confirm_token' => 'RESTORE_CLSCONFIG',
            'dry_run_supported' => true,
            'requires_gamedbd_backup' => true,
            'safety_backup_types' => ['gamedbd_backup', 'clsconfig_file'],
            'affected_components' => ['clsconfig_file'],
            'affected_services' => [],
            'summary' => 'Substitui o arquivo clsconfig atual por um backup de arquivo e cria backup de seguranca antes da troca.',
        ],
        'clsconfig_archive' => [
            'key' => 'clsconfig_archive',
            'label' => 'CLSConfig Archive',
            'dir_key' => 'clsconfig_archive_backup_dir',
            'file_regex' => '/^clsconfig-backup-\d{8}-\d{6}-[a-f0-9]{8}\.tgz$/i',
            'supported' => false,
            'severity' => 'medium',
            'restore_level' => 'intermediate',
            'requires_confirmation' => true,
            'confirm_token' => 'RESTORE_CLSCONFIG_ARCHIVE',
            'dry_run_supported' => false,
            'requires_gamedbd_backup' => true,
            'safety_backup_types' => ['gamedbd_backup'],
            'affected_components' => ['clsconfig_archive', 'gamedbd/dbdata/clsconfig'],
            'affected_services' => [],
            'summary' => 'Contrato reservado para restore futuro de pacote clsconfig compactado.',
        ],
        'gamedbd_backup' => [
            'key' => 'gamedbd_backup',
            'label' => 'GameDB Backup',
            'dir_key' => 'gamedbd_backup_dir',
            'file_regex' => '/^gamedbd-backup-\d{8}-\d{6}-[a-f0-9]{8}\.tgz$/i',
            'supported' => false,
            'severity' => 'critical',
            'restore_level' => 'critical',
            'requires_confirmation' => true,
            'confirm_token' => 'RESTORE_GAMEDBD',
            'dry_run_supported' => false,
            'requires_gamedbd_backup' => false,
            'safety_backup_types' => ['gamedbd_backup'],
            'affected_components' => ['gamedbd'],
            'affected_services' => ['gamedbd', 'gdeliveryd', 'glinkd', 'gamed'],
            'summary' => 'Contrato reservado para restore futuro do GameDB completo.',
        ],
        'mysql_backup' => [
            'key' => 'mysql_backup',
            'label' => 'MySQL/MariaDB Backup',
            'dir_key' => 'mysql_backup_dir',
            'file_regex' => '/^mysql-backup-\d{8}-\d{6}-[a-f0-9]{8}\.sql\.gz$/i',
            'supported' => true,
            'severity' => 'medium',
            'restore_level' => 'intermediate',
            'requires_confirmation' => true,
            'confirm_token' => 'RESTORE_MYSQL',
            'dry_run_supported' => true,
            'requires_gamedbd_backup' => true,
            'safety_backup_types' => ['mysql_backup', 'gamedbd_backup'],
            'affected_components' => ['mysql'],
            'affected_services' => ['mysql'],
            'summary' => 'Restaura um dump completo do MySQL/MariaDB usando o wrapper root da API e gera backups de seguranca antes da aplicacao real.',
        ],
        'uniquenamed_backup' => [
            'key' => 'uniquenamed_backup',
            'label' => 'UniqueNamed Backup',
            'dir_key' => 'uniquenamed_backup_dir',
            'file_regex' => '/^uniquenamed-backup-\d{8}-\d{6}-[a-f0-9]{8}\.tgz$/i',
            'supported' => true,
            'severity' => 'medium',
            'restore_level' => 'intermediate',
            'requires_confirmation' => true,
            'confirm_token' => 'RESTORE_UNIQUENAMED',
            'dry_run_supported' => true,
            'requires_gamedbd_backup' => true,
            'safety_backup_types' => ['uniquenamed_backup', 'gamedbd_backup'],
            'affected_components' => ['uniquenamed'],
            'affected_services' => ['uniquenamed', 'gdeliveryd', 'glinkd', 'gamed'],
            'summary' => 'Restaura os arquivos do UniqueNamed a partir do pacote .tgz oficial e cria backups de seguranca antes da aplicacao real.',
        ],
        'panel_backup' => [
            'key' => 'panel_backup',
            'label' => 'Panel Backup',
            'dir_key' => 'panel_backup_dir',
            'file_regex' => '/^panel-backup-\d{8}-\d{6}-[a-f0-9]{8}\.tgz$/i',
            'supported' => false,
            'severity' => 'medium',
            'restore_level' => 'intermediate',
            'requires_confirmation' => true,
            'confirm_token' => 'RESTORE_PANEL',
            'dry_run_supported' => false,
            'requires_gamedbd_backup' => false,
            'safety_backup_types' => ['panel_backup'],
            'affected_components' => ['panel'],
            'affected_services' => ['httpd'],
            'summary' => 'Contrato reservado para restore futuro do painel web.',
        ],
        'full_backup' => [
            'key' => 'full_backup',
            'label' => 'Full Backup',
            'dir_key' => 'full_backup_dir',
            'file_regex' => '/^full-backup-\d{8}-\d{6}-[a-f0-9]{8}\.tgz$/i',
            'supported' => false,
            'severity' => 'critical',
            'restore_level' => 'critical',
            'requires_confirmation' => true,
            'confirm_token' => 'RESTORE_FULL',
            'dry_run_supported' => false,
            'requires_gamedbd_backup' => false,
            'safety_backup_types' => ['full_backup'],
            'affected_components' => ['gamedbd', 'mysql', 'uniquenamed', 'clsconfig', 'panel'],
            'affected_services' => ['gamedbd', 'mysql', 'uniquenamed', 'gdeliveryd', 'glinkd', 'gamed', 'httpd'],
            'summary' => 'Contrato reservado para restore futuro de pacote completo do servidor.',
        ],
        'export_log' => [
            'key' => 'export_log',
            'label' => 'Export Log',
            'dir_key' => 'clsconfig_export_log_dir',
            'file_regex' => '/^exportclsconfig-\d{8}-\d{6}-[a-f0-9]{8}\.log$/i',
            'supported' => false,
            'severity' => 'none',
            'restore_level' => 'none',
            'requires_confirmation' => false,
            'confirm_token' => '',
            'dry_run_supported' => false,
            'requires_gamedbd_backup' => false,
            'safety_backup_types' => [],
            'affected_components' => [],
            'affected_services' => [],
            'summary' => 'Arquivo de log nao restauravel.',
        ],
    ];
}

function restoreNormalizeType($type)
{
    $type = strtolower(trim((string) $type));
    $aliases = [
        'role' => 'role_json',
        'role_backup' => 'role_json',
        'json' => 'role_json',
        'clsconfig' => 'clsconfig_archive',
        'clsconfigfile' => 'clsconfig_file',
        'clsconfig_backup' => 'clsconfig_archive',
        'gamedbd' => 'gamedbd_backup',
        'gamedb' => 'gamedbd_backup',
        'db' => 'gamedbd_backup',
        'mysql' => 'mysql_backup',
        'mariadb' => 'mysql_backup',
        'unique' => 'uniquenamed_backup',
        'uniquenamed' => 'uniquenamed_backup',
        'panel' => 'panel_backup',
        'web' => 'panel_backup',
        'full' => 'full_backup',
    ];

    return isset($aliases[$type]) ? $aliases[$type] : $type;
}

function restoreTypeDefinition(array $config, $type)
{
    $type = restoreNormalizeType($type);
    $definitions = restoreTypeDefinitions($config);
    return isset($definitions[$type]) ? $definitions[$type] : null;
}

function restoreCanExecuteType(array $definition)
{
    return !empty($definition['supported']);
}

function restoreDetectTypeFromName(array $config, $name)
{
    $name = basename(str_replace('\\', '/', trim((string) $name)));
    if ($name === '') {
        return '';
    }

    foreach (restoreTypeDefinitions($config) as $type => $definition) {
        $pattern = trim((string) array_value($definition, 'file_regex', ''));
        if ($pattern !== '' && preg_match($pattern, $name)) {
            return $type;
        }
    }

    return '';
}

function restoreTypeCatalog(array $config)
{
    $catalog = [];
    foreach (restoreTypeDefinitions($config) as $type => $definition) {
        $catalog[] = [
            'type' => $type,
            'label' => array_value($definition, 'label', $type),
            'supported' => restoreCanExecuteType($definition),
            'severity' => array_value($definition, 'severity', 'none'),
            'restore_level' => array_value($definition, 'restore_level', 'none'),
            'requires_confirmation' => !empty($definition['requires_confirmation']),
            'confirm_token' => (string) array_value($definition, 'confirm_token', ''),
            'dry_run_supported' => !empty($definition['dry_run_supported']),
            'requires_gamedbd_backup' => !empty($definition['requires_gamedbd_backup']),
            'safety_backup_types' => array_values(array_map('strval', array_value($definition, 'safety_backup_types', []))),
            'affected_components' => array_values(array_map('strval', array_value($definition, 'affected_components', []))),
            'affected_services' => array_values(array_map('strval', array_value($definition, 'affected_services', []))),
            'summary' => (string) array_value($definition, 'summary', ''),
        ];
    }

    return $catalog;
}

function restoreRequestActor(array $request)
{
    $actor = trimOneLineText(firstArrayValue($request, ['actor', 'updated_by', 'updatedBy'], 'api'));
    return $actor !== '' ? $actor : 'api';
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

function restoreRequestBackupType(array $config, array $request, $name)
{
    $type = restoreNormalizeType(array_value($request, 'type', ''));
    $backup = array_value($request, 'backup', null);
    if ($type === '' && is_array($backup)) {
        $type = restoreNormalizeType(array_value($backup, 'type', ''));
    }

    if ($type === '') {
        $type = restoreDetectTypeFromName($config, $name);
    }

    return $type;
}

function backupContentRequestType(array $config, array $request)
{
    $name = restoreRequestBackupName($request);
    return restoreRequestBackupType($config, $request, $name);
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

    if ($type === 'mysql_backup') {
        $allowed[] = 'RESTORE_MYSQL';
        $allowed[] = 'RESTORE_MARIADB';
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

function executeRestoreShellCommand($command, $backupFile, $timeoutSeconds = 0)
{
    $command = trim((string) $command);
    if ($command === '') {
        throw new Exception('Comando de restore nao configurado');
    }

    if (!is_file($backupFile) || !is_readable($backupFile)) {
        throw new Exception('Backup de restore nao encontrado ou sem leitura: ' . basename($backupFile));
    }

    $result = executeServerOpsCommand(
        $command . ' ' . escapeshellarg($backupFile),
        max(0, intval($timeoutSeconds))
    );

    if (empty($result['success'])) {
        throw new Exception(
            'Restore shell falhou (exit ' . intval(array_value($result, 'exit_code', 1)) . '): '
            . trim((string) array_value($result, 'stdout_excerpt', ''))
        );
    }

    $parsed = is_array(array_value($result, 'parsed', null)) ? array_value($result, 'parsed', []) : [];
    if (empty($parsed)) {
        $parsed = [
            'stdout' => trim((string) array_value($result, 'stdout_excerpt', '')),
        ];
    }

    return $parsed;
}

function createRestoreSafetyBackups(array $config, array $plan, $restoreType)
{
    $backupName = preg_replace('/[^a-zA-Z0-9_.:-]+/', '_', (string) array_value(array_value($plan, 'backup', []), 'name', 'backup'));
    $backupName = trim((string) $backupName, '_');
    if ($backupName === '') {
        $backupName = 'backup';
    }

    $reason = 'before_restoreNow_' . restoreNormalizeType($restoreType) . '_' . $backupName;
    $requestedTypes = array_values(array_unique(array_filter(array_map('strval', array_value($plan, 'safety_backup_types', [])))));
    if (empty($requestedTypes)) {
        return [];
    }

    $created = [];
    $backupNowMap = [
        'mysql_backup' => 'mysql',
        'uniquenamed_backup' => 'uniquenamed',
        'panel_backup' => 'panel',
        'full_backup' => 'full',
        'clsconfig_archive' => 'clsconfig',
    ];

    foreach ($requestedTypes as $safetyType) {
        if ($safetyType === 'clsconfig_file') {
            continue;
        }

        if ($safetyType === 'gamedbd_backup') {
            $created[$safetyType] = createGamedbdSafetyBackup($config, $reason);
            continue;
        }

        if (!isset($backupNowMap[$safetyType])) {
            continue;
        }

        $definition = backupNowDefinition($config, $backupNowMap[$safetyType]);
        $created[$safetyType] = executeBackupNowByDefinition($config, $definition, $reason, false);
    }

    return $created;
}

function resolveRestoreBackupFile(array $config, array $request, &$type)
{
    $name = restoreRequestBackupName($request);
    if ($name === '') {
        throw new Exception('Informe backup.name ou backup.file para restaurar');
    }

    $type = restoreRequestBackupType($config, $request, $name);
    $definition = restoreTypeDefinition($config, $type);
    if (!is_array($definition)) {
        throw new Exception('Tipo de backup invalido para restore: ' . ($type !== '' ? $type : $name));
    }

    $dirKey = trim((string) array_value($definition, 'dir_key', ''));
    $dir = $dirKey !== '' ? array_value($config, $dirKey, '') : '';
    $pattern = trim((string) array_value($definition, 'file_regex', ''));
    if ($pattern === '') {
        throw new Exception('Tipo de backup sem padrao seguro configurado: ' . $type);
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

function restoreMysqlBackup(array $config, $backupFile, array $request)
{
    if (!is_file($backupFile) || !is_readable($backupFile)) {
        throw new Exception('Backup MySQL inacessivel: ' . basename($backupFile));
    }

    $sourceInfo = backupFileInfo($backupFile, 'mysql_backup');
    if (restoreRequestDryRun($request)) {
        return [
            'type' => 'mysql_backup',
            'dry_run' => true,
            'source_backup' => $sourceInfo,
            'target' => 'all_databases',
            'service' => 'mysql',
            'warning' => 'Dry-run apenas valida o dump selecionado. Credenciais do MariaDB e aplicacao real do restore so sao verificadas sem dry-run.',
        ];
    }

    if (!restoreConfirmOk($request, 'mysql_backup')) {
        throw new Exception('Confirmacao obrigatoria para restore. Envie confirm=RESTORE_MYSQL');
    }

    $command = trim((string) array_value($config, 'mysql_restore_command', ''));
    if ($command === '') {
        throw new Exception('Comando de restore MySQL nao configurado');
    }

    $restored = executeRestoreShellCommand(
        $command,
        $backupFile,
        intval(array_value($config, 'restore_now_timeout_seconds', array_value($config, 'backup_now_timeout_seconds', 1800)))
    );

    return [
        'type' => 'mysql_backup',
        'source_backup' => $sourceInfo,
        'target' => 'all_databases',
        'service' => 'mysql',
        'restored' => $restored,
        'warning' => 'Dump MySQL/MariaDB aplicado sobre todas as bases presentes no backup selecionado.',
    ];
}

function restoreUniqueNamedBackup(array $config, $backupFile, array $request)
{
    if (!is_file($backupFile) || !is_readable($backupFile)) {
        throw new Exception('Backup UniqueNamed inacessivel: ' . basename($backupFile));
    }

    $sourceInfo = backupFileInfo($backupFile, 'uniquenamed_backup');
    if (restoreRequestDryRun($request)) {
        return [
            'type' => 'uniquenamed_backup',
            'dry_run' => true,
            'source_backup' => $sourceInfo,
            'target' => '/home/uniquenamed',
            'service' => 'uniquenamed',
            'warning' => 'Dry-run apenas valida o pacote selecionado. A reaplicacao real dos arquivos so e executada sem dry-run.',
        ];
    }

    if (!restoreConfirmOk($request, 'uniquenamed_backup')) {
        throw new Exception('Confirmacao obrigatoria para restore. Envie confirm=RESTORE_UNIQUENAMED');
    }

    $command = trim((string) array_value($config, 'uniquenamed_restore_command', ''));
    if ($command === '') {
        throw new Exception('Comando de restore UniqueNamed nao configurado');
    }

    $restored = executeRestoreShellCommand(
        $command,
        $backupFile,
        intval(array_value($config, 'restore_now_timeout_seconds', array_value($config, 'backup_now_timeout_seconds', 1800)))
    );

    return [
        'type' => 'uniquenamed_backup',
        'source_backup' => $sourceInfo,
        'target' => '/home/uniquenamed',
        'service' => 'uniquenamed',
        'restored' => $restored,
        'warning' => 'Arquivos do UniqueNamed reaplicados sobre /home/uniquenamed usando o pacote selecionado.',
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

    if ($type === 'mysql_backup') {
        return restoreMysqlBackup($config, $backupFile, $request);
    }

    if ($type === 'uniquenamed_backup') {
        return restoreUniqueNamedBackup($config, $backupFile, $request);
    }

    throw new Exception('Tipo de backup nao restauravel: ' . $type);
}

function restorePlanHistoryPayload(array $plan)
{
    return [
        'type' => array_value($plan, 'type', ''),
        'label' => array_value($plan, 'label', ''),
        'supported' => !empty($plan['supported']),
        'can_restore_now' => !empty($plan['can_restore_now']),
        'severity' => array_value($plan, 'severity', 'none'),
        'restore_level' => array_value($plan, 'restore_level', 'none'),
        'backup' => is_array(array_value($plan, 'backup', null)) ? array_value($plan, 'backup', null) : null,
        'target' => is_array(array_value($plan, 'target', null)) ? array_value($plan, 'target', null) : null,
    ];
}

function restoreReadHistory(array $config, $limit)
{
    $limit = max(1, min(500, intval($limit)));
    $path = restoreHistoryFile($config);
    if ($path === '' || !is_file($path) || !is_readable($path)) {
        return [];
    }

    $lines = @file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    if (!is_array($lines) || empty($lines)) {
        return [];
    }

    $lines = array_reverse(array_slice($lines, -$limit));
    $entries = [];
    foreach ($lines as $line) {
        $decoded = json_decode((string) $line, true);
        if (is_array($decoded)) {
            $entries[] = $decoded;
        } else {
            $entries[] = [
                'type' => 'raw',
                'line' => (string) $line,
            ];
        }
    }

    return $entries;
}

function restoreAppendHistoryBestEffort(array $config, array $entry, &$warning = '')
{
    $warning = '';
    try {
        appendLogLine(restoreHistoryFile($config), safeJsonEncode($entry));
        return true;
    } catch (Exception $e) {
        $warning = $e->getMessage();
        return false;
    }
}

function buildRestorePlanFromResolvedBackup(array $config, $backupFile, $type)
{
    $definition = restoreTypeDefinition($config, $type);
    if (!is_array($definition)) {
        throw new Exception('Tipo de backup invalido para plano de restore: ' . $type);
    }

    $backup = backupFileInfo($backupFile, $type);
    $warnings = [];
    $validationErrors = [];
    $target = [];

    if ($type === 'role_json') {
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

        $roleid = intval(array_value($decoded, 'roleid', array_value($template, 'roleid', array_value($backup, 'roleid', 0))));
        $sections = [];
        foreach (['base', 'status', 'inventory', 'equipment', 'storehouse', 'task'] as $section) {
            if (array_key_exists($section, $template)) {
                $sections[] = $section;
            }
        }
        if (empty($sections)) {
            $sections = ['template'];
        }

        $allowed = restoreAllowedRoleId($config, $roleid);
        if (!$allowed) {
            $validationErrors[] = 'roleid nao permitido para restore de clsconfig: ' . $roleid;
        }

        $target = [
            'roleid' => $roleid,
            'allowed_roleid' => $allowed,
            'sections' => $sections,
        ];
        $warnings[] = 'O save no gamedbd segue o modo de exportclsconfig configurado na API.';
    } elseif ($type === 'clsconfig_file') {
        $targetFile = trim((string) array_value($config, 'clsconfig_file_path', ''));
        if ($targetFile === '') {
            $validationErrors[] = 'Arquivo clsconfig de destino nao configurado';
        }

        $target = [
            'target_file' => $targetFile,
            'roleid' => intval(array_value($backup, 'roleid', 0)),
        ];
        $warnings[] = 'O restore cria backup de seguranca do clsconfig atual antes de substituir o arquivo.';
        $warnings[] = 'Nenhum exportclsconfig e executado automaticamente apos o restore do arquivo.';
    } elseif ($type === 'mysql_backup') {
        $target = [
            'scope' => 'all_databases',
            'service' => 'mysql',
            'restore_command' => (string) array_value($config, 'mysql_restore_command', ''),
        ];
        $warnings[] = 'O restore reaplica um dump completo com todas as bases, rotinas, triggers e eventos.';
        $warnings[] = 'A autenticacao do MariaDB depende do wrapper root da API, normalmente usando /root/.my.cnf quando necessario.';
        $warnings[] = 'Antes do restore real, a API cria backups de seguranca do MySQL e do GameDB.';
    } elseif ($type === 'uniquenamed_backup') {
        $target = [
            'target_dir' => '/home/uniquenamed',
            'service' => 'uniquenamed',
            'restore_command' => (string) array_value($config, 'uniquenamed_restore_command', ''),
        ];
        $warnings[] = 'O restore reaplica os arquivos do pacote sobre /home/uniquenamed.';
        $warnings[] = 'Antes do restore real, a API cria backups de seguranca do UniqueNamed e do GameDB.';
        $warnings[] = 'Se o servidor estiver em uso, pode ser necessario reiniciar o servico uniquenamed apos a restauracao.';
    } elseif (!restoreCanExecuteType($definition)) {
        $validationErrors[] = 'Backend ainda nao implementa restoreNow para este tipo de backup';
    }

    return [
        'type' => $type,
        'label' => (string) array_value($definition, 'label', $type),
        'supported' => restoreCanExecuteType($definition),
        'can_restore_now' => restoreCanExecuteType($definition) && empty($validationErrors),
        'severity' => (string) array_value($definition, 'severity', 'none'),
        'restore_level' => (string) array_value($definition, 'restore_level', 'none'),
        'summary' => (string) array_value($definition, 'summary', ''),
        'backup' => $backup,
        'target' => $target,
        'confirmation' => [
            'required' => !empty($definition['requires_confirmation']),
            'token' => (string) array_value($definition, 'confirm_token', ''),
        ],
        'dry_run_supported' => !empty($definition['dry_run_supported']),
        'requires_gamedbd_backup' => !empty($definition['requires_gamedbd_backup']),
        'safety_backup_types' => array_values(array_map('strval', array_value($definition, 'safety_backup_types', []))),
        'affected_components' => array_values(array_map('strval', array_value($definition, 'affected_components', []))),
        'affected_services' => array_values(array_map('strval', array_value($definition, 'affected_services', []))),
        'validation_errors' => $validationErrors,
        'warnings' => $warnings,
        'suggested_payload' => [
            'type' => $type,
            'name' => array_value($backup, 'name', ''),
            'dry_run' => true,
            'confirm' => (string) array_value($definition, 'confirm_token', ''),
        ],
    ];
}

function handleGetRestorePlanRequest(array $config, array $request)
{
    $name = restoreRequestBackupName($request);
    $payload = [
        'success' => true,
        'supported_types' => restoreTypeCatalog($config),
        'history_file' => restoreHistoryFile($config),
        'collected_at' => gmdate('c'),
    ];

    if ($name === '') {
        $payload['plan'] = null;
        $payload['message'] = 'Informe name ou file para obter o plano detalhado de restore';
        return $payload;
    }

    $type = '';
    $backupFile = resolveRestoreBackupFile($config, $request, $type);
    $payload['plan'] = buildRestorePlanFromResolvedBackup($config, $backupFile, $type);
    return $payload;
}

function handleGetRestoreHistoryRequest(array $config, $limit)
{
    return [
        'success' => true,
        'limit' => max(1, min(500, intval($limit))),
        'entries' => restoreReadHistory($config, $limit),
        'history_file' => restoreHistoryFile($config),
        'collected_at' => gmdate('c'),
    ];
}

function handleRestoreNowRequest(array $config, GamedProtocol $proto, array $request)
{
    $type = '';
    $backupFile = resolveRestoreBackupFile($config, $request, $type);
    $plan = buildRestorePlanFromResolvedBackup($config, $backupFile, $type);
    if (empty($plan['supported'])) {
        throw new InvalidArgumentException('Tipo de backup ainda nao suportado por restoreNow: ' . $type);
    }
    if (empty($plan['can_restore_now'])) {
        throw new InvalidArgumentException('Restore bloqueado: ' . implode('; ', array_value($plan, 'validation_errors', [])));
    }

    $operationId = buildOperationId('restore');
    $actor = restoreRequestActor($request);
    $dryRun = restoreRequestDryRun($request);
    $startedAt = gmdate('c');
    $safetyBackups = [];
    $historyWarning = '';

    if ($dryRun && empty($plan['dry_run_supported'])) {
        throw new InvalidArgumentException('Dry-run nao suportado para este tipo de restore: ' . $type);
    }

    try {
        if (!$dryRun) {
            $safetyBackups = createRestoreSafetyBackups($config, $plan, $type);
        }

        $result = restoreBackupFromRequest($config, $proto, $request);
        if (!empty($safetyBackups)) {
            $result['safety_backups'] = $safetyBackups;
        }
        if (is_array(array_value($safetyBackups, 'gamedbd_backup', null))) {
            $result['gamedbd_backup'] = array_value($safetyBackups, 'gamedbd_backup', null);
        }

        $historyEntry = [
            'type' => 'restore',
            'operation_id' => $operationId,
            'action' => 'restoreNow',
            'actor' => $actor,
            'created_at' => $startedAt,
            'completed_at' => gmdate('c'),
            'dry_run' => $dryRun,
            'success' => true,
            'restore_type' => $type,
            'plan' => restorePlanHistoryPayload($plan),
            'backup' => array_value($plan, 'backup', null),
            'result' => is_array($result) ? $result : null,
            'message' => $dryRun ? 'Dry-run de restore validado com sucesso' : 'Restore executado com sucesso',
        ];
        if (!empty($safetyBackups)) {
            $historyEntry['safety_backups'] = $safetyBackups;
        }
        if (is_array(array_value($safetyBackups, 'gamedbd_backup', null))) {
            $historyEntry['gamedbd_backup'] = array_value($safetyBackups, 'gamedbd_backup', null);
        }
        restoreAppendHistoryBestEffort($config, $historyEntry, $historyWarning);

        $payload = [
            'success' => true,
            'operation_id' => $operationId,
            'dry_run' => $dryRun,
            'plan' => $plan,
            'restored' => $result,
            'safety_backups' => $safetyBackups,
            'history_entry' => $historyEntry,
            'history_file' => restoreHistoryFile($config),
            'requested_at' => $startedAt,
            'completed_at' => array_value($historyEntry, 'completed_at', gmdate('c')),
        ];
        if ($historyWarning !== '') {
            $payload['history_warning'] = $historyWarning;
        }

        return $payload;
    } catch (Exception $e) {
        $historyEntry = [
            'type' => 'restore',
            'operation_id' => $operationId,
            'action' => 'restoreNow',
            'actor' => $actor,
            'created_at' => $startedAt,
            'completed_at' => gmdate('c'),
            'dry_run' => $dryRun,
            'success' => false,
            'restore_type' => $type,
            'plan' => restorePlanHistoryPayload($plan),
            'backup' => array_value($plan, 'backup', null),
            'error' => $e->getMessage(),
        ];
        if (!empty($safetyBackups)) {
            $historyEntry['safety_backups'] = $safetyBackups;
        }
        if (is_array(array_value($safetyBackups, 'gamedbd_backup', null))) {
            $historyEntry['gamedbd_backup'] = array_value($safetyBackups, 'gamedbd_backup', null);
        }
        restoreAppendHistoryBestEffort($config, $historyEntry, $historyWarning);
        throw $e;
    }
}

function getRoleJsonBackupContent(array $config, array $request)
{
    $requestedType = backupContentRequestType($config, $request);
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

function serverOpsCollectService(array $config, array $service, $instancesSnapshot = null)
{
    $key = trim((string) array_value($service, 'key', ''));
    $pids = serverOpsCollectPids(array_value($service, 'process_names', []));
    $port = intval(array_value($service, 'port', 0));
    $listening = serverOpsPortListening($port);
    $systemdState = serverOpsSystemctlState(array_value($service, 'systemd_units', []));

    if ($key === 'gamed') {
        if (!is_array($instancesSnapshot)) {
            $instancesSnapshot = getManageableInstancesSnapshot($config);
        }
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

function getServiceStatusSnapshot(array $config, $instancesSnapshot = null)
{
    $services = [];
    foreach (serverOpsKnownServices() as $service) {
        $services[] = serverOpsCollectService($config, $service, $instancesSnapshot);
    }

    return [
        'success' => true,
        'services' => $services,
        'collected_at' => gmdate('c'),
    ];
}

function getManageableServicesSnapshotFromStatus(array $config, array $status)
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

function getManageableServicesSnapshot(array $config)
{
    return getManageableServicesSnapshotFromStatus($config, getServiceStatusSnapshot($config));
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

function controlCenterRound($value, $precision = 2)
{
    if (!is_numeric($value)) {
        return null;
    }

    return round(floatval($value), intval($precision));
}

function controlCenterPercent($used, $total, $precision = 2)
{
    $used = floatval($used);
    $total = floatval($total);
    if ($total <= 0) {
        return null;
    }

    return controlCenterRound(($used / $total) * 100, $precision);
}

function controlCenterFormatDuration($seconds)
{
    $seconds = max(0, intval(round($seconds)));
    $days = intdiv($seconds, 86400);
    $seconds %= 86400;
    $hours = intdiv($seconds, 3600);
    $seconds %= 3600;
    $minutes = intdiv($seconds, 60);
    $seconds %= 60;

    $parts = [];
    if ($days > 0) {
        $parts[] = $days . 'd';
    }
    if ($hours > 0 || !empty($parts)) {
        $parts[] = $hours . 'h';
    }
    if ($minutes > 0 || !empty($parts)) {
        $parts[] = $minutes . 'm';
    }
    $parts[] = $seconds . 's';

    return implode(' ', $parts);
}

function controlCenterReadCpuCounters()
{
    $path = '/proc/stat';
    if (!is_file($path) || !is_readable($path)) {
        return null;
    }

    $lines = @file($path, FILE_IGNORE_NEW_LINES);
    if (!is_array($lines)) {
        return null;
    }

    foreach ($lines as $line) {
        $line = trim((string) $line);
        if (strpos($line, 'cpu ') !== 0) {
            continue;
        }

        $parts = preg_split('/\s+/', $line);
        if (!is_array($parts) || count($parts) < 5) {
            return null;
        }

        $total = 0.0;
        $idle = 0.0;
        foreach (array_values(array_slice($parts, 1)) as $idx => $value) {
            if (!is_numeric($value)) {
                continue;
            }
            $value = floatval($value);
            $total += $value;
            if ($idx === 3 || $idx === 4) {
                $idle += $value;
            }
        }

        if ($total <= 0) {
            return null;
        }

        return [
            'total' => $total,
            'idle' => $idle,
        ];
    }

    return null;
}

function controlCenterCpuSnapshot(array $config)
{
    $sampleUs = intval(array_value($config, 'control_center_cpu_sample_microseconds', 200000));
    $sampleUs = max(50000, min(500000, $sampleUs));

    $first = controlCenterReadCpuCounters();
    if (!is_array($first)) {
        return [
            'available' => false,
            'usage_percent' => null,
            'sample_ms' => intval(round($sampleUs / 1000)),
            'source' => '/proc/stat',
        ];
    }

    usleep($sampleUs);
    $second = controlCenterReadCpuCounters();
    if (!is_array($second)) {
        return [
            'available' => false,
            'usage_percent' => null,
            'sample_ms' => intval(round($sampleUs / 1000)),
            'source' => '/proc/stat',
        ];
    }

    $deltaTotal = floatval($second['total']) - floatval($first['total']);
    $deltaIdle = floatval($second['idle']) - floatval($first['idle']);
    $usage = null;
    if ($deltaTotal > 0) {
        $usage = (($deltaTotal - $deltaIdle) / $deltaTotal) * 100;
    }

    return [
        'available' => $usage !== null,
        'usage_percent' => ($usage !== null) ? controlCenterRound($usage, 2) : null,
        'sample_ms' => intval(round($sampleUs / 1000)),
        'source' => '/proc/stat',
    ];
}

function controlCenterMemorySnapshot()
{
    $path = '/proc/meminfo';
    if (!is_file($path) || !is_readable($path)) {
        return [
            'available' => false,
        ];
    }

    $lines = @file($path, FILE_IGNORE_NEW_LINES);
    if (!is_array($lines)) {
        return [
            'available' => false,
        ];
    }

    $mem = [];
    foreach ($lines as $line) {
        if (preg_match('/^([A-Za-z_]+):\s+(\d+)\s+kB$/', trim((string) $line), $matches)) {
            $mem[$matches[1]] = intval($matches[2]) * 1024;
        }
    }

    $total = intval(array_value($mem, 'MemTotal', 0));
    $available = intval(array_value($mem, 'MemAvailable', 0));
    if ($available <= 0) {
        $available = intval(array_value($mem, 'MemFree', 0))
            + intval(array_value($mem, 'Buffers', 0))
            + intval(array_value($mem, 'Cached', 0));
    }

    if ($total <= 0) {
        return [
            'available' => false,
        ];
    }

    $used = max(0, $total - $available);
    $swapTotal = intval(array_value($mem, 'SwapTotal', 0));
    $swapFree = intval(array_value($mem, 'SwapFree', 0));
    $swapUsed = max(0, $swapTotal - $swapFree);

    return [
        'available' => true,
        'total_bytes' => $total,
        'available_bytes' => $available,
        'used_bytes' => $used,
        'used_percent' => controlCenterPercent($used, $total, 2),
        'total_mb' => controlCenterRound($total / 1048576, 2),
        'available_mb' => controlCenterRound($available / 1048576, 2),
        'used_mb' => controlCenterRound($used / 1048576, 2),
        'swap_total_bytes' => $swapTotal,
        'swap_used_bytes' => $swapUsed,
        'swap_total_mb' => controlCenterRound($swapTotal / 1048576, 2),
        'swap_used_mb' => controlCenterRound($swapUsed / 1048576, 2),
        'swap_used_percent' => controlCenterPercent($swapUsed, $swapTotal, 2),
        'source' => '/proc/meminfo',
    ];
}

function controlCenterDiskSnapshot(array $config)
{
    $path = trim((string) array_value($config, 'control_center_disk_path', '/'));
    if ($path === '') {
        $path = '/';
    }

    $total = @disk_total_space($path);
    $free = @disk_free_space($path);
    if ($total === false || $free === false || $total <= 0) {
        return [
            'available' => false,
            'path' => $path,
        ];
    }

    $used = max(0, $total - $free);

    return [
        'available' => true,
        'path' => $path,
        'total_bytes' => $total,
        'free_bytes' => $free,
        'used_bytes' => $used,
        'used_percent' => controlCenterPercent($used, $total, 2),
        'total_gb' => controlCenterRound($total / 1073741824, 2),
        'free_gb' => controlCenterRound($free / 1073741824, 2),
        'used_gb' => controlCenterRound($used / 1073741824, 2),
    ];
}

function controlCenterUptimeSnapshot()
{
    $path = '/proc/uptime';
    if (!is_file($path) || !is_readable($path)) {
        return [
            'available' => false,
            'uptime_seconds' => null,
            'uptime_human' => '',
        ];
    }

    $raw = trim((string) @file_get_contents($path));
    if ($raw === '') {
        return [
            'available' => false,
            'uptime_seconds' => null,
            'uptime_human' => '',
        ];
    }

    $parts = preg_split('/\s+/', $raw);
    $seconds = isset($parts[0]) ? floatval($parts[0]) : 0;
    if ($seconds <= 0) {
        return [
            'available' => false,
            'uptime_seconds' => null,
            'uptime_human' => '',
        ];
    }

    return [
        'available' => true,
        'uptime_seconds' => intval(round($seconds)),
        'uptime_human' => controlCenterFormatDuration($seconds),
        'source' => '/proc/uptime',
    ];
}

function controlCenterLoadAverageSnapshot()
{
    $loads = function_exists('sys_getloadavg') ? @sys_getloadavg() : false;
    if (!is_array($loads) || count($loads) < 3) {
        $path = '/proc/loadavg';
        if (is_file($path) && is_readable($path)) {
            $raw = trim((string) @file_get_contents($path));
            if ($raw !== '') {
                $parts = preg_split('/\s+/', $raw);
                if (count($parts) >= 3) {
                    $loads = [floatval($parts[0]), floatval($parts[1]), floatval($parts[2])];
                }
            }
        }
    }

    if (!is_array($loads) || count($loads) < 3) {
        return [
            'available' => false,
            '1m' => null,
            '5m' => null,
            '15m' => null,
        ];
    }

    return [
        'available' => true,
        '1m' => controlCenterRound($loads[0], 2),
        '5m' => controlCenterRound($loads[1], 2),
        '15m' => controlCenterRound($loads[2], 2),
    ];
}

function controlCenterPingSnapshot(array $config)
{
    $target = trim((string) array_value($config, 'control_center_ping_target', ''));
    $timeout = max(1, min(5, intval(array_value($config, 'control_center_ping_timeout_seconds', 1))));

    if ($target === '') {
        return [
            'requested' => false,
            'target' => '',
            'reachable' => null,
            'latency_ms' => null,
            'warning' => 'Ping desabilitado na configuracao',
        ];
    }

    if (!serverOpsShellAvailable()) {
        return [
            'requested' => true,
            'target' => $target,
            'reachable' => null,
            'latency_ms' => null,
            'warning' => 'shell_exec indisponivel para ping',
        ];
    }

    $output = serverOpsRun('ping -c 1 -W ' . $timeout . ' ' . escapeshellarg($target) . ' 2>/dev/null');
    if ($output === '') {
        return [
            'requested' => true,
            'target' => $target,
            'reachable' => false,
            'latency_ms' => null,
            'warning' => 'Sem resposta do comando ping',
        ];
    }

    $reachable = (stripos($output, '0% packet loss') !== false)
        || preg_match('/\b1\s+(packets\s+)?received\b/i', $output);
    $latencyMs = null;
    if (preg_match('/time[=<]([0-9.]+)\s*ms/i', $output, $matches)) {
        $latencyMs = controlCenterRound($matches[1], 2);
    }

    return [
        'requested' => true,
        'target' => $target,
        'reachable' => (bool) $reachable,
        'latency_ms' => $latencyMs,
        'warning' => ($reachable ? '' : 'Alvo sem resposta ao ping'),
    ];
}

function controlCenterRecentOperationsSnapshot(array $config)
{
    $limit = max(1, min(20, intval(array_value($config, 'control_center_recent_operations_limit', 5))));

    try {
        $history = getServerOperationsHistoryHandler($config, ['limit' => $limit]);
        $recent = array_values(array_value($history, 'operations', []));
    } catch (Exception $e) {
        return [
            'latest' => null,
            'running' => null,
            'recent' => [],
            'count' => 0,
            'warning' => $e->getMessage(),
            'history_file' => rtrim(serverOpsLogDir($config), '/\\') . DIRECTORY_SEPARATOR . 'history.log',
        ];
    }

    $running = null;
    foreach ($recent as $operation) {
        if (!empty($operation['running'])) {
            $running = $operation;
            break;
        }
    }

    return [
        'latest' => !empty($recent) ? $recent[0] : null,
        'running' => $running,
        'recent' => $recent,
        'count' => count($recent),
        'warning' => '',
        'history_file' => array_value($history, 'history_file', rtrim(serverOpsLogDir($config), '/\\') . DIRECTORY_SEPARATOR . 'history.log'),
    ];
}

function controlCenterServiceSummary(array $config, array $serviceStatus, array $manageableServices)
{
    $summary = [
        'total' => 0,
        'online' => 0,
        'offline' => 0,
        'unknown' => 0,
        'manageable_total' => 0,
        'manageable_online' => 0,
        'manageable_offline' => 0,
        'manageable_unknown' => 0,
        'critical_offline' => [],
    ];

    $criticalKeys = array_values(array_unique(array_merge(
        array_values(array_map('strval', array_value($config, 'server_ops_verify_services', []))),
        ['mysql', 'httpd']
    )));

    foreach ((array) array_value($serviceStatus, 'services', []) as $item) {
        $summary['total']++;
        $state = trim((string) array_value($item, 'state', 'unknown'));
        if ($state === 'online') {
            $summary['online']++;
        } elseif ($state === 'offline') {
            $summary['offline']++;
        } else {
            $summary['unknown']++;
        }

        $key = trim((string) array_value($item, 'key', ''));
        if ($key !== '' && in_array($key, $criticalKeys, true) && $state !== 'online') {
            $summary['critical_offline'][] = $key;
        }
    }

    foreach ((array) array_value($manageableServices, 'services', []) as $item) {
        $summary['manageable_total']++;
        $state = trim((string) array_value($item, 'state', 'unknown'));
        if ($state === 'online') {
            $summary['manageable_online']++;
        } elseif ($state === 'offline') {
            $summary['manageable_offline']++;
        } else {
            $summary['manageable_unknown']++;
        }
    }

    $summary['critical_offline'] = array_values(array_unique($summary['critical_offline']));
    return $summary;
}

function controlCenterInstanceSummary(array $instancesSnapshot)
{
    $instances = (array) array_value($instancesSnapshot, 'instances', []);
    $configured = 0;
    $selectable = 0;

    foreach ($instances as $item) {
        if (!empty($item['configured'])) {
            $configured++;
        }
        if (!empty($item['selectable'])) {
            $selectable++;
        }
    }

    return [
        'total' => intval(array_value($instancesSnapshot, 'count', count($instances))),
        'running' => intval(array_value($instancesSnapshot, 'running_count', 0)),
        'stopped' => max(0, intval(array_value($instancesSnapshot, 'count', count($instances))) - intval(array_value($instancesSnapshot, 'running_count', 0))),
        'auto_start' => intval(array_value($instancesSnapshot, 'auto_start_count', 0)),
        'configured' => $configured,
        'selectable' => $selectable,
    ];
}

function controlCenterBuildAlerts(array $serviceSummary, array $instanceSummary, array $host, array $maintenance, array $operations, array $watchdog = [])
{
    $alerts = [];

    foreach ((array) array_value($serviceSummary, 'critical_offline', []) as $serviceKey) {
        $alerts[] = [
            'severity' => 'critical',
            'type' => 'service_offline',
            'scope' => 'service',
            'key' => $serviceKey,
            'message' => 'Servico critico offline: ' . $serviceKey,
        ];
    }

    if (!empty($maintenance['enabled'])) {
        $alerts[] = [
            'severity' => 'warning',
            'type' => 'maintenance_enabled',
            'scope' => 'server',
            'key' => 'maintenance',
            'message' => 'Modo de manutencao ativo',
        ];
    }

    $cpuUsage = array_value(array_value($host, 'cpu', []), 'usage_percent', null);
    if ($cpuUsage !== null && floatval($cpuUsage) >= 95) {
        $alerts[] = [
            'severity' => 'warning',
            'type' => 'cpu_high',
            'scope' => 'host',
            'key' => 'cpu',
            'message' => 'Uso de CPU elevado: ' . $cpuUsage . '%',
        ];
    }

    $memoryUsage = array_value(array_value($host, 'memory', []), 'used_percent', null);
    if ($memoryUsage !== null && floatval($memoryUsage) >= 90) {
        $alerts[] = [
            'severity' => 'warning',
            'type' => 'memory_high',
            'scope' => 'host',
            'key' => 'memory',
            'message' => 'Uso de memoria elevado: ' . $memoryUsage . '%',
        ];
    }

    $diskUsage = array_value(array_value($host, 'disk', []), 'used_percent', null);
    if ($diskUsage !== null && floatval($diskUsage) >= 90) {
        $alerts[] = [
            'severity' => 'critical',
            'type' => 'disk_high',
            'scope' => 'host',
            'key' => 'disk',
            'message' => 'Uso de disco elevado: ' . $diskUsage . '%',
        ];
    }

    $ping = array_value($host, 'ping', []);
    if (!empty($ping['requested']) && array_key_exists('reachable', $ping) && empty($ping['reachable'])) {
        $alerts[] = [
            'severity' => 'warning',
            'type' => 'ping_unreachable',
            'scope' => 'host',
            'key' => 'ping',
            'message' => 'Ping sem resposta para ' . array_value($ping, 'target', ''),
        ];
    }

    if (is_array(array_value($operations, 'running', null))) {
        $alerts[] = [
            'severity' => 'info',
            'type' => 'operation_running',
            'scope' => 'operations',
            'key' => trim((string) array_value(array_value($operations, 'running', []), 'id', '')),
            'message' => 'Operacao em andamento: ' . trim((string) array_value(array_value($operations, 'running', []), 'type', '')),
        ];
    }

    if (!empty($watchdog['enabled'])) {
        $unhealthyServices = array_values(array_map('strval', array_value($watchdog, 'unhealthy_services', [])));
        if (!empty($watchdog['critical_failure'])) {
            $alerts[] = [
                'severity' => 'critical',
                'type' => 'watchdog_critical_failure',
                'scope' => 'watchdog',
                'key' => 'watchdog',
                'message' => 'Watchdog detectou falha critica'
                    . (!empty($unhealthyServices) ? (': ' . implode(', ', $unhealthyServices)) : ''),
            ];
        } elseif (!empty($unhealthyServices)) {
            $alerts[] = [
                'severity' => 'warning',
                'type' => 'watchdog_degraded',
                'scope' => 'watchdog',
                'key' => 'watchdog',
                'message' => 'Watchdog detectou servicos degradados: ' . implode(', ', $unhealthyServices),
            ];
        }
    }

    if (intval(array_value($instanceSummary, 'running', 0)) <= 0 && intval(array_value($instanceSummary, 'auto_start', 0)) > 0) {
        $alerts[] = [
            'severity' => 'warning',
            'type' => 'instances_not_running',
            'scope' => 'instances',
            'key' => 'autostart',
            'message' => 'Nenhuma instancia ativa apesar de haver instancias marcadas para auto-start',
        ];
    }

    return $alerts;
}

function getControlCenterSnapshot(array $config)
{
    $startedAt = microtime(true);

    $instancesSnapshot = getManageableInstancesSnapshot($config);
    $serviceStatus = getServiceStatusSnapshot($config, $instancesSnapshot);
    $manageableServices = getManageableServicesSnapshotFromStatus($config, $serviceStatus);
    $maintenanceState = array_value(getMaintenanceModeHandler($config), 'maintenance', maintenanceDefaultState());
    $watchdogStatus = watchdogSummaryPayload($config);
    $operations = controlCenterRecentOperationsSnapshot($config);

    $host = [
        'hostname' => function_exists('gethostname') ? (gethostname() ?: php_uname('n')) : php_uname('n'),
        'os' => PHP_OS,
        'kernel' => php_uname('r'),
        'php_version' => PHP_VERSION,
        'php_sapi' => PHP_SAPI,
        'uptime' => controlCenterUptimeSnapshot(),
        'load_average' => controlCenterLoadAverageSnapshot(),
        'cpu' => controlCenterCpuSnapshot($config),
        'memory' => controlCenterMemorySnapshot(),
        'disk' => controlCenterDiskSnapshot($config),
        'ping' => controlCenterPingSnapshot($config),
    ];
    $host['response_time_ms'] = controlCenterRound((microtime(true) - $startedAt) * 1000, 2);

    $serviceSummary = controlCenterServiceSummary($config, $serviceStatus, $manageableServices);
    $instanceSummary = controlCenterInstanceSummary($instancesSnapshot);
    $alerts = controlCenterBuildAlerts($serviceSummary, $instanceSummary, $host, $maintenanceState, $operations, $watchdogStatus);

    return [
        'success' => true,
        'snapshot' => [
            'host' => $host,
            'services' => [
                'all' => array_values(array_value($serviceStatus, 'services', [])),
                'manageable' => array_values(array_value($manageableServices, 'services', [])),
                'summary' => $serviceSummary,
                'collected_at' => array_value($serviceStatus, 'collected_at', gmdate('c')),
            ],
            'instances' => [
                'items' => array_values(array_value($instancesSnapshot, 'instances', [])),
                'summary' => $instanceSummary,
                'source_files' => array_value($instancesSnapshot, 'source_files', []),
                'collected_at' => array_value($instancesSnapshot, 'collected_at', gmdate('c')),
            ],
            'maintenance' => $maintenanceState,
            'watchdog' => $watchdogStatus,
            'operations' => $operations,
            'alerts' => $alerts,
            'collected_at' => gmdate('c'),
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
        'logservice' => [
            '/root/logs/logservice.log',
            '/home/logs/logservice.log',
            '/var/log/logservice*.log',
        ],
        'uniquenamed' => [
            '/root/logs/uniquenamed.log',
            '/root/logs/uniquenamed*.log',
            '/home/logs/uniquenamed.log',
            '/home/logs/uniquenamed*.log',
            '/var/log/uniquenamed*.log',
        ],
        'authd' => [
            '/root/logs/authd.log',
            '/root/logs/authd*.log',
            '/home/logs/authd.log',
            '/home/logs/authd*.log',
            '/var/log/authd*.log',
        ],
        'gamedbd' => [
            '/root/logs/gamedbd.log',
            '/root/logs/gamedbd*_err.log',
            '/root/logs/gamedbd*_std.log',
            '/home/logs/gamedbd.log',
            '/home/logs/gamedbd*_err.log',
            '/home/logs/gamedbd*_std.log',
            '/var/log/gamedbd*.log',
        ],
        'gacd' => [
            '/root/logs/gacd.log',
            '/root/logs/gacd*.log',
            '/home/logs/gacd.log',
            '/home/logs/gacd*.log',
            '/var/log/gacd*.log',
        ],
        'gfactiond' => [
            '/root/logs/gfactiond.log',
            '/root/logs/gfactiond*.log',
            '/home/logs/gfactiond.log',
            '/home/logs/gfactiond*.log',
            '/var/log/gfactiond*.log',
        ],
        'gdeliveryd' => [
            '/root/logs/gdeliveryd.log',
            '/root/logs/gdeliveryd*.log',
            '/home/logs/gdeliveryd.log',
            '/home/logs/gdeliveryd*.log',
            '/var/log/gdeliveryd*.log',
        ],
        'glinkd' => [
            '/root/logs/glink*.log',
            '/home/logs/glink*.log',
            '/var/log/glink*.log',
        ],
        'gs01' => [
            '/root/logs/gs01.log',
            '/root/logs/gs01*.log',
            '/home/logs/gs01.log',
            '/home/logs/gs01*.log',
            '/var/log/gs01*.log',
        ],
        'world2' => [
            '/root/logs/world2.log',
            '/home/logs/world2.log',
            '/var/log/world2.log',
        ],
        'world2.formatlog' => [
            '/root/logs/world2.formatlog',
            '/home/logs/world2.formatlog',
            '/var/log/world2.formatlog',
        ],
        'mysql' => [
            '/var/log/mysqld.log',
            '/var/log/mysql/error.log',
            '/var/log/mariadb/mariadb.log',
            '/var/log/mariadb/mariadb.err',
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

function serverOpsAvailableLogSources(array $config)
{
    $sources = serverOpsLogSources($config);
    $keys = array_keys($sources);
    natcasesort($keys);
    return array_values($keys);
}

function serverOpsNormalizeLogSource($source)
{
    $source = strtolower(trim((string) $source));
    $aliases = [
        'gamed' => 'gs01',
        'world' => 'gs01',
        'worldserver' => 'gs01',
        'glink' => 'glinkd',
        'world2formatlog' => 'world2.formatlog',
        'world2_formatlog' => 'world2.formatlog',
        'world2format' => 'world2.formatlog',
    ];

    return isset($aliases[$source]) ? $aliases[$source] : $source;
}

function serverOpsResolveLogFile($source, array $config)
{
    $source = serverOpsNormalizeLogSource($source);
    $sources = serverOpsLogSources($config);
    if (!isset($sources[$source])) {
        throw new InvalidArgumentException(
            'source de log invalido: ' . $source . '. Use: ' . implode(', ', serverOpsAvailableLogSources($config))
        );
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
    $source = serverOpsNormalizeLogSource($source);
    $lines = max(1, min(500, intval($lines)));
    $query = trim((string) $query);
    $availableSources = serverOpsAvailableLogSources($config);
    $file = serverOpsResolveLogFile($source, $config);

    if ($file === '') {
        return [
            'success' => true,
            'source' => $source,
            'file' => '',
            'entries' => [],
            'available_sources' => $availableSources,
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
        'available_sources' => $availableSources,
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
        $response = [
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
        $gmHistoryWarning = '';
        $gmEntry = gmHistoryEntryBase($config, 'sendSystemMessage', [
            'status' => 'dry_run',
            'success' => true,
            'dry_run' => true,
            'message_payload' => [
                'message' => $payload['message'],
                'kind' => $payload['kind'],
                'priority' => $payload['priority'],
                'channel' => intval($payload['channel']),
            ],
        ]);
        if (gmAppendHistoryBestEffort($config, $gmEntry, $gmHistoryWarning)) {
            $response['gm_history_file'] = gmActionHistoryFile($config);
        } elseif ($gmHistoryWarning !== '') {
            $response['gm_history_warning'] = $gmHistoryWarning;
        }
        return $response;
    }

    $delivery = dispatchSystemMessage($payload);
    $entry['result'] = 'sent';
    $entry['delivery'] = $delivery;
    $logFile = logSystemMessage($config, $entry);

    $response = [
        'success' => true,
        'message' => 'Broadcast enviado com sucesso',
        'delivery' => $delivery,
        'log_file' => $logFile,
    ];
    $gmHistoryWarning = '';
    $gmEntry = gmHistoryEntryBase($config, 'sendSystemMessage', [
        'status' => 'success',
        'success' => true,
        'dry_run' => false,
        'message_payload' => [
            'message' => $payload['message'],
            'kind' => $payload['kind'],
            'priority' => $payload['priority'],
            'channel' => intval($payload['channel']),
        ],
        'delivery' => $delivery,
    ]);
    if (gmAppendHistoryBestEffort($config, $gmEntry, $gmHistoryWarning)) {
        $response['gm_history_file'] = gmActionHistoryFile($config);
    } elseif ($gmHistoryWarning !== '') {
        $response['gm_history_warning'] = $gmHistoryWarning;
    }
    return $response;
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

function watchdogConfigFile(array $config)
{
    return trim((string) array_value($config, 'watchdog_config_file', __DIR__ . '/backups/watchdog/config.json'));
}

function watchdogStateFile(array $config)
{
    return trim((string) array_value($config, 'watchdog_state_file', __DIR__ . '/backups/watchdog/state.json'));
}

function watchdogHistoryFile(array $config)
{
    return trim((string) array_value($config, 'watchdog_history_file', __DIR__ . '/backups/watchdog/history.log'));
}

function watchdogLockFile(array $config)
{
    return trim((string) array_value($config, 'watchdog_lock_file', __DIR__ . '/backups/watchdog/runner.lock'));
}

function watchdogDefaultConfig(array $config)
{
    $critical = array_value($config, 'watchdog_critical_services', serverOpsManageableServiceKeys($config));
    if (!is_array($critical)) {
        $critical = [$critical];
    }

    $critical = array_values(array_unique(array_filter(array_map(function ($value) {
        return trim((string) $value);
    }, $critical), function ($value) {
        return $value !== '';
    })));

    return [
        'enabled' => truthyValue(array_value($config, 'watchdog_enabled_default', false)),
        'critical_services' => $critical,
        'failure_threshold' => max(1, intval(array_value($config, 'watchdog_failure_threshold', 2))),
        'cooldown_seconds' => max(0, intval(array_value($config, 'watchdog_cooldown_seconds', 300))),
        'max_restart_attempts' => max(1, intval(array_value($config, 'watchdog_max_restart_attempts', 3))),
        'verify_restart' => !array_key_exists('watchdog_verify_restart', $config) || truthyValue(array_value($config, 'watchdog_verify_restart', true)),
        'pause_during_maintenance' => !array_key_exists('watchdog_pause_during_maintenance', $config) || truthyValue(array_value($config, 'watchdog_pause_during_maintenance', true)),
        'updated_by' => 'default',
        'updated_at' => null,
    ];
}

function watchdogDefaultState()
{
    return [
        'last_result' => 'idle',
        'last_check_at' => null,
        'last_success_at' => null,
        'last_error' => '',
        'last_action' => '',
        'last_action_at' => null,
        'last_run_source' => '',
        'cooldown_until' => null,
        'critical_failure' => false,
        'maintenance_blocked' => false,
        'failure_counts' => [],
        'restart_counts' => [],
        'tracked_services' => [],
        'healthy_services' => [],
        'unhealthy_services' => [],
        'trigger_services' => [],
        'services' => [],
        'last_operation' => null,
    ];
}

function watchdogNormalizeCounterMap($value)
{
    $normalized = [];
    if (!is_array($value)) {
        return $normalized;
    }

    foreach ($value as $key => $count) {
        $serviceKey = strtolower(trim((string) $key));
        if ($serviceKey === '') {
            continue;
        }
        $normalized[$serviceKey] = max(0, intval($count));
    }

    ksort($normalized);
    return $normalized;
}

function watchdogNormalizeServiceListValue($value, array $config, $required = false)
{
    return normalizeServerOpsServiceKeys(['services' => $value], $config, $required);
}

function watchdogReadConfig(array $config)
{
    $defaults = watchdogDefaultConfig($config);
    $path = watchdogConfigFile($config);
    if ($path === '' || !is_file($path) || !is_readable($path)) {
        return $defaults;
    }

    $raw = @file_get_contents($path);
    if (!is_string($raw) || trim($raw) === '') {
        return $defaults;
    }

    $decoded = json_decode($raw, true);
    if (json_last_error() !== JSON_ERROR_NONE || !is_array($decoded)) {
        return $defaults;
    }

    $normalized = $defaults;
    $normalized['enabled'] = array_key_exists('enabled', $decoded)
        ? truthyValue(array_value($decoded, 'enabled', $defaults['enabled']))
        : $defaults['enabled'];

    $criticalValue = array_key_exists('critical_services', $decoded)
        ? array_value($decoded, 'critical_services', [])
        : array_value($decoded, 'services', []);
    if (!empty($criticalValue)) {
        try {
            $normalized['critical_services'] = watchdogNormalizeServiceListValue($criticalValue, $config, true);
        } catch (Exception $e) {
            $normalized['critical_services'] = $defaults['critical_services'];
        }
    }

    $normalized['failure_threshold'] = max(
        1,
        intval(array_value($decoded, 'failure_threshold', array_value($decoded, 'failureThreshold', $defaults['failure_threshold'])))
    );
    $normalized['cooldown_seconds'] = max(
        0,
        intval(array_value($decoded, 'cooldown_seconds', array_value($decoded, 'cooldownSeconds', $defaults['cooldown_seconds'])))
    );
    $normalized['max_restart_attempts'] = max(
        1,
        intval(array_value($decoded, 'max_restart_attempts', array_value($decoded, 'maxRestartAttempts', $defaults['max_restart_attempts'])))
    );
    $normalized['verify_restart'] = array_key_exists('verify_restart', $decoded) || array_key_exists('verifyRestart', $decoded)
        ? truthyValue(array_value($decoded, 'verify_restart', array_value($decoded, 'verifyRestart', $defaults['verify_restart'])))
        : $defaults['verify_restart'];
    $normalized['pause_during_maintenance'] = array_key_exists('pause_during_maintenance', $decoded) || array_key_exists('pauseDuringMaintenance', $decoded)
        ? truthyValue(array_value($decoded, 'pause_during_maintenance', array_value($decoded, 'pauseDuringMaintenance', $defaults['pause_during_maintenance'])))
        : $defaults['pause_during_maintenance'];
    $normalized['updated_by'] = trimOneLineText(array_value($decoded, 'updated_by', array_value($decoded, 'updatedBy', $defaults['updated_by'])));
    $normalized['updated_at'] = array_value($decoded, 'updated_at', array_value($decoded, 'updatedAt', $defaults['updated_at']));

    return $normalized;
}

function watchdogReadState(array $config)
{
    $defaults = watchdogDefaultState();
    $path = watchdogStateFile($config);
    if ($path === '' || !is_file($path) || !is_readable($path)) {
        return $defaults;
    }

    $raw = @file_get_contents($path);
    if (!is_string($raw) || trim($raw) === '') {
        return $defaults;
    }

    $decoded = json_decode($raw, true);
    if (json_last_error() !== JSON_ERROR_NONE || !is_array($decoded)) {
        return $defaults;
    }

    $state = array_merge($defaults, $decoded);
    $state['critical_failure'] = truthyValue(array_value($state, 'critical_failure', false));
    $state['maintenance_blocked'] = truthyValue(array_value($state, 'maintenance_blocked', false));
    $state['failure_counts'] = watchdogNormalizeCounterMap(array_value($state, 'failure_counts', []));
    $state['restart_counts'] = watchdogNormalizeCounterMap(array_value($state, 'restart_counts', []));
    $state['tracked_services'] = array_values(array_map('strval', array_value($state, 'tracked_services', [])));
    $state['healthy_services'] = array_values(array_map('strval', array_value($state, 'healthy_services', [])));
    $state['unhealthy_services'] = array_values(array_map('strval', array_value($state, 'unhealthy_services', [])));
    $state['trigger_services'] = array_values(array_map('strval', array_value($state, 'trigger_services', [])));
    $state['services'] = is_array(array_value($state, 'services', null)) ? array_values(array_value($state, 'services', [])) : [];
    $state['last_operation'] = is_array(array_value($state, 'last_operation', null)) ? array_value($state, 'last_operation', null) : null;

    return $state;
}

function watchdogHydrateState(array $state)
{
    $state = array_merge(watchdogDefaultState(), $state);
    $cooldownUntilTs = serverOpsParseTimestamp(array_value($state, 'cooldown_until', null));
    $state['cooldown_remaining_seconds'] = $cooldownUntilTs > 0 ? max(0, $cooldownUntilTs - time()) : 0;
    return $state;
}

function watchdogFilesPayload(array $config)
{
    return [
        'config_file' => watchdogConfigFile($config),
        'state_file' => watchdogStateFile($config),
        'history_file' => watchdogHistoryFile($config),
        'lock_file' => watchdogLockFile($config),
    ];
}

function watchdogPersistConfig(array $config, array $watchdogConfig)
{
    writeAtomicFile(watchdogConfigFile($config), safeJsonEncode($watchdogConfig));
}

function watchdogPersistState(array $config, array $state)
{
    $persisted = $state;
    unset($persisted['cooldown_remaining_seconds']);
    writeAtomicFile(watchdogStateFile($config), safeJsonEncode($persisted));
}

function watchdogAppendHistory(array $config, array $entry)
{
    appendLogLine(watchdogHistoryFile($config), safeJsonEncode($entry));
}

function watchdogReadHistory(array $config, $limit)
{
    $limit = max(1, min(500, intval($limit)));
    $path = watchdogHistoryFile($config);
    if ($path === '' || !is_file($path) || !is_readable($path)) {
        return [];
    }

    $lines = @file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    if (!is_array($lines) || empty($lines)) {
        return [];
    }

    $lines = array_reverse(array_slice($lines, -$limit));
    $entries = [];
    foreach ($lines as $line) {
        $decoded = json_decode((string) $line, true);
        if (is_array($decoded)) {
            $entries[] = $decoded;
        } else {
            $entries[] = [
                'type' => 'raw',
                'line' => (string) $line,
            ];
        }
    }

    return $entries;
}

function watchdogAcquireLock(array $config)
{
    $path = watchdogLockFile($config);
    if ($path === '') {
        throw new Exception('watchdog_lock_file nao configurado');
    }

    ensureWritableDirectory(dirname($path));
    $handle = @fopen($path, 'c+');
    if (!is_resource($handle)) {
        throw new Exception('Falha ao abrir lockfile do watchdog');
    }

    if (!@flock($handle, LOCK_EX | LOCK_NB)) {
        @fclose($handle);
        return null;
    }

    @ftruncate($handle, 0);
    @fwrite($handle, json_encode([
        'pid' => function_exists('getmypid') ? getmypid() : null,
        'locked_at' => gmdate('c'),
    ], JSON_UNESCAPED_SLASHES));

    return $handle;
}

function watchdogReleaseLock($handle)
{
    if (is_resource($handle)) {
        @flock($handle, LOCK_UN);
        @fclose($handle);
    }
}

function watchdogBuildServiceHealth(array $trackedServices, array $snapshot, array $failureCounts, array $restartCounts, $incrementFailures = true)
{
    $index = [];
    foreach ((array) array_value($snapshot, 'services', []) as $service) {
        $key = strtolower(trim((string) array_value($service, 'key', '')));
        if ($key !== '') {
            $index[$key] = $service;
        }
    }

    $healthy = [];
    $unhealthy = [];
    $rows = [];
    foreach ($trackedServices as $key) {
        $item = isset($index[$key]) ? $index[$key] : [
            'key' => $key,
            'state' => 'unknown',
            'pid' => null,
            'process_count' => 0,
            'listening' => false,
            'port' => 0,
        ];
        $isHealthy = array_value($item, 'state', 'unknown') === 'online';

        if ($isHealthy) {
            $failureCounts[$key] = 0;
            $restartCounts[$key] = 0;
            $healthy[] = $key;
        } else {
            $failureCounts[$key] = $incrementFailures
                ? (intval(array_value($failureCounts, $key, 0)) + 1)
                : intval(array_value($failureCounts, $key, 0));
            $restartCounts[$key] = intval(array_value($restartCounts, $key, 0));
            $unhealthy[] = $key;
        }

        $rows[] = [
            'key' => $key,
            'state' => array_value($item, 'state', 'unknown'),
            'pid' => array_value($item, 'pid', null),
            'process_count' => intval(array_value($item, 'process_count', 0)),
            'listening' => truthyValue(array_value($item, 'listening', false)),
            'port' => intval(array_value($item, 'port', 0)),
            'healthy' => $isHealthy,
            'failure_count' => intval(array_value($failureCounts, $key, 0)),
            'restart_count' => intval(array_value($restartCounts, $key, 0)),
        ];
    }

    return [
        'services' => $rows,
        'healthy_services' => $healthy,
        'unhealthy_services' => $unhealthy,
        'failure_counts' => watchdogNormalizeCounterMap($failureCounts),
        'restart_counts' => watchdogNormalizeCounterMap($restartCounts),
        'collected_at' => array_value($snapshot, 'collected_at', gmdate('c')),
    ];
}

function watchdogTriggerServices(array $unhealthyServices, array $failureCounts, $threshold)
{
    $threshold = max(1, intval($threshold));
    $trigger = [];
    foreach ($unhealthyServices as $key) {
        if (intval(array_value($failureCounts, $key, 0)) >= $threshold) {
            $trigger[] = $key;
        }
    }
    return array_values(array_unique(array_map('strval', $trigger)));
}

function watchdogSummarizeOperationResult($result)
{
    if (!is_array($result)) {
        return null;
    }

    $operation = array_value($result, 'operation', null);
    return [
        'success' => truthyValue(array_value($result, 'success', false)),
        'dry_run' => truthyValue(array_value($result, 'dry_run', false)),
        'error' => trim((string) array_value($result, 'error', '')),
        'operation' => is_array($operation) ? [
            'id' => trim((string) array_value($operation, 'id', '')),
            'stage' => trim((string) array_value($operation, 'stage', '')),
            'log_file' => trim((string) array_value($operation, 'log_file', '')),
        ] : null,
    ];
}

function watchdogShouldLogHistory(array $previousState, array $currentState, array $options, $operationAttempted = false)
{
    if (!empty($options['manual']) || !empty($options['force']) || !empty($options['dry_run']) || $operationAttempted) {
        return true;
    }

    foreach (['last_result', 'critical_failure', 'maintenance_blocked', 'last_error', 'cooldown_until'] as $key) {
        if (array_value($previousState, $key, null) !== array_value($currentState, $key, null)) {
            return true;
        }
    }

    foreach (['unhealthy_services', 'trigger_services'] as $key) {
        if (array_values(array_map('strval', array_value($previousState, $key, []))) !== array_values(array_map('strval', array_value($currentState, $key, [])))) {
            return true;
        }
    }

    return false;
}

function watchdogSummaryPayload(array $config, array $watchdogConfig = null, array $state = null)
{
    $watchdogConfig = is_array($watchdogConfig) ? $watchdogConfig : watchdogReadConfig($config);
    $state = watchdogHydrateState(is_array($state) ? $state : watchdogReadState($config));

    return [
        'enabled' => !empty($watchdogConfig['enabled']),
        'critical_services' => array_values(array_map('strval', array_value($watchdogConfig, 'critical_services', []))),
        'failure_threshold' => intval(array_value($watchdogConfig, 'failure_threshold', 0)),
        'cooldown_seconds' => intval(array_value($watchdogConfig, 'cooldown_seconds', 0)),
        'max_restart_attempts' => intval(array_value($watchdogConfig, 'max_restart_attempts', 0)),
        'verify_restart' => truthyValue(array_value($watchdogConfig, 'verify_restart', true)),
        'pause_during_maintenance' => truthyValue(array_value($watchdogConfig, 'pause_during_maintenance', true)),
        'last_result' => trim((string) array_value($state, 'last_result', 'idle')),
        'last_check_at' => array_value($state, 'last_check_at', null),
        'last_success_at' => array_value($state, 'last_success_at', null),
        'last_error' => trim((string) array_value($state, 'last_error', '')),
        'last_action' => trim((string) array_value($state, 'last_action', '')),
        'last_action_at' => array_value($state, 'last_action_at', null),
        'last_run_source' => trim((string) array_value($state, 'last_run_source', '')),
        'cooldown_until' => array_value($state, 'cooldown_until', null),
        'cooldown_remaining_seconds' => intval(array_value($state, 'cooldown_remaining_seconds', 0)),
        'critical_failure' => truthyValue(array_value($state, 'critical_failure', false)),
        'maintenance_blocked' => truthyValue(array_value($state, 'maintenance_blocked', false)),
        'tracked_services' => array_values(array_map('strval', array_value($state, 'tracked_services', []))),
        'healthy_services' => array_values(array_map('strval', array_value($state, 'healthy_services', []))),
        'unhealthy_services' => array_values(array_map('strval', array_value($state, 'unhealthy_services', []))),
        'trigger_services' => array_values(array_map('strval', array_value($state, 'trigger_services', []))),
    ];
}

function watchdogMergedRequest(array $request)
{
    $nested = array_value($request, 'watchdog', null);
    if (!is_array($nested)) {
        return $request;
    }

    $merged = array_merge($nested, $request);
    unset($merged['watchdog']);
    return $merged;
}

function normalizeWatchdogConfigRequest(array $request, array $config, array $current = null)
{
    $request = watchdogMergedRequest($request);
    $current = is_array($current) ? $current : watchdogReadConfig($config);
    $updated = $current;

    if (array_key_exists('enabled', $request)) {
        $updated['enabled'] = truthyValue(array_value($request, 'enabled', $current['enabled']));
    }

    $hasCriticalServices = array_key_exists('critical_services', $request)
        || array_key_exists('criticalServices', $request)
        || array_key_exists('services', $request);
    if ($hasCriticalServices) {
        $criticalValue = array_key_exists('critical_services', $request)
            ? array_value($request, 'critical_services', [])
            : (array_key_exists('criticalServices', $request)
                ? array_value($request, 'criticalServices', [])
                : array_value($request, 'services', []));
        $updated['critical_services'] = watchdogNormalizeServiceListValue($criticalValue, $config, true);
    }

    if (empty($updated['critical_services'])) {
        throw new InvalidArgumentException('critical_services nao pode ficar vazio');
    }

    if (array_key_exists('failure_threshold', $request) || array_key_exists('failureThreshold', $request)) {
        $failureThreshold = intval(array_value($request, 'failure_threshold', array_value($request, 'failureThreshold', $current['failure_threshold'])));
        if ($failureThreshold < 1 || $failureThreshold > 20) {
            throw new InvalidArgumentException('failure_threshold deve ficar entre 1 e 20');
        }
        $updated['failure_threshold'] = $failureThreshold;
    }

    if (array_key_exists('cooldown_seconds', $request) || array_key_exists('cooldownSeconds', $request)) {
        $cooldownSeconds = intval(array_value($request, 'cooldown_seconds', array_value($request, 'cooldownSeconds', $current['cooldown_seconds'])));
        if ($cooldownSeconds < 0 || $cooldownSeconds > 86400) {
            throw new InvalidArgumentException('cooldown_seconds deve ficar entre 0 e 86400');
        }
        $updated['cooldown_seconds'] = $cooldownSeconds;
    }

    if (array_key_exists('max_restart_attempts', $request) || array_key_exists('maxRestartAttempts', $request)) {
        $maxRestartAttempts = intval(array_value($request, 'max_restart_attempts', array_value($request, 'maxRestartAttempts', $current['max_restart_attempts'])));
        if ($maxRestartAttempts < 1 || $maxRestartAttempts > 20) {
            throw new InvalidArgumentException('max_restart_attempts deve ficar entre 1 e 20');
        }
        $updated['max_restart_attempts'] = $maxRestartAttempts;
    }

    if (array_key_exists('verify_restart', $request) || array_key_exists('verifyRestart', $request)) {
        $updated['verify_restart'] = truthyValue(array_value($request, 'verify_restart', array_value($request, 'verifyRestart', $current['verify_restart'])));
    }

    if (array_key_exists('pause_during_maintenance', $request) || array_key_exists('pauseDuringMaintenance', $request)) {
        $updated['pause_during_maintenance'] = truthyValue(array_value($request, 'pause_during_maintenance', array_value($request, 'pauseDuringMaintenance', $current['pause_during_maintenance'])));
    }

    $updatedBy = trimOneLineText(array_value($request, 'updated_by', array_value($request, 'actor', 'api')));
    if (containsControlChars($updatedBy)) {
        throw new InvalidArgumentException('updated_by contem caracteres de controle invalidos');
    }
    $updated['updated_by'] = $updatedBy !== '' ? $updatedBy : 'api';
    $updated['updated_at'] = gmdate('c');

    return [
        'dry_run' => truthyValue(array_value($request, 'dry_run', array_value($request, 'dryRun', false))),
        'config' => $updated,
    ];
}

function applyWatchdogConfig(array $config, array $previous, array $current, $dryRun = false, $historyType = 'watchdog_config')
{
    $now = gmdate('c');
    $historyEntry = [
        'type' => $historyType,
        'changed_at' => $now,
        'previous' => $previous,
        'current' => $current,
        'dry_run' => !empty($dryRun),
    ];

    if (empty($dryRun)) {
        watchdogPersistConfig($config, $current);
        watchdogAppendHistory($config, $historyEntry);
    }

    return [
        'success' => true,
        'watchdog' => watchdogSummaryPayload($config, $current, watchdogReadState($config)),
        'config' => $current,
        'dry_run' => !empty($dryRun),
        'history_entry' => $historyEntry,
        'files' => watchdogFilesPayload($config),
    ];
}

function saveWatchdogConfigHandler(array $config, array $request)
{
    $previous = watchdogReadConfig($config);
    $payload = normalizeWatchdogConfigRequest($request, $config, $previous);
    return applyWatchdogConfig($config, $previous, $payload['config'], !empty($payload['dry_run']), 'watchdog_config');
}

function setWatchdogEnabledHandler(array $config, $enabled, array $request)
{
    $request = watchdogMergedRequest($request);
    $request['enabled'] = !empty($enabled);
    $previous = watchdogReadConfig($config);
    $payload = normalizeWatchdogConfigRequest($request, $config, $previous);
    return applyWatchdogConfig(
        $config,
        $previous,
        $payload['config'],
        !empty($payload['dry_run']),
        !empty($enabled) ? 'watchdog_enabled' : 'watchdog_disabled'
    );
}

function getWatchdogStatusHandler(array $config)
{
    $watchdogConfig = watchdogReadConfig($config);
    $state = watchdogHydrateState(watchdogReadState($config));
    $historyLimit = max(1, min(50, intval(array_value($config, 'watchdog_recent_history_limit', 20))));

    return [
        'success' => true,
        'watchdog' => array_merge(
            watchdogSummaryPayload($config, $watchdogConfig, $state),
            [
                'config' => $watchdogConfig,
                'state' => $state,
                'history_preview' => watchdogReadHistory($config, $historyLimit),
                'files' => watchdogFilesPayload($config),
                'runner' => [
                    'script' => trim((string) array_value($config, 'watchdog_runner_script', '/usr/local/sbin/pw-watchdog-runner.sh')),
                    'cron_file' => trim((string) array_value($config, 'watchdog_cron_file', '/etc/cron.d/apicls-watchdog')),
                    'check_interval_seconds' => max(30, intval(array_value($config, 'watchdog_check_interval_seconds', 60))),
                ],
            ]
        ),
        'collected_at' => gmdate('c'),
    ];
}

function getWatchdogHistoryHandler(array $config, array $request)
{
    $limit = max(1, min(500, intval(array_value($request, 'limit', array_value($config, 'watchdog_recent_history_limit', 20)))));
    return [
        'success' => true,
        'limit' => $limit,
        'entries' => watchdogReadHistory($config, $limit),
        'history_file' => watchdogHistoryFile($config),
        'collected_at' => gmdate('c'),
    ];
}

function runWatchdogCheck(array $config, array $options = [])
{
    $manual = !empty($options['manual']);
    $force = !empty($options['force']);
    $dryRun = !empty($options['dry_run']);
    $source = trim((string) array_value($options, 'source', $manual ? 'api' : 'runner'));
    if ($source === '') {
        $source = $manual ? 'api' : 'runner';
    }

    $lock = watchdogAcquireLock($config);
    if ($lock === null) {
        return [
            'success' => false,
            'result' => 'busy',
            'message' => 'Watchdog ja esta em execucao',
            'source' => $source,
            'manual' => $manual,
            'force' => $force,
            'dry_run' => $dryRun,
            'files' => watchdogFilesPayload($config),
            'checked_at' => gmdate('c'),
        ];
    }

    try {
        $watchdogConfig = watchdogReadConfig($config);
        $previousState = watchdogHydrateState(watchdogReadState($config));
        $state = array_merge(watchdogDefaultState(), $previousState);
        $now = gmdate('c');
        $message = 'Watchdog executado';
        $success = true;
        $operationAttempted = false;
        $operationSummary = null;

        $state['last_check_at'] = $now;
        $state['last_run_source'] = $source;
        $state['maintenance_blocked'] = false;
        $state['last_operation'] = null;

        if (!$manual && empty($watchdogConfig['enabled']) && !$force) {
            $state['last_result'] = 'disabled';
            $state['critical_failure'] = false;
            $state['last_error'] = '';
            $state['trigger_services'] = [];
            $message = 'Watchdog desabilitado';
        } else {
            $maintenance = array_value(getMaintenanceModeHandler($config), 'maintenance', maintenanceDefaultState());
            if (!empty($maintenance['enabled']) && !empty($watchdogConfig['pause_during_maintenance']) && !$force) {
                $state['last_result'] = 'skipped_maintenance';
                $state['critical_failure'] = false;
                $state['maintenance_blocked'] = true;
                $state['last_error'] = '';
                $state['trigger_services'] = [];
                $message = 'Watchdog pausado por manutencao ativa';
            } else {
                $trackedServices = array_values(array_map('strval', array_value($watchdogConfig, 'critical_services', [])));
                if (empty($trackedServices)) {
                    throw new Exception('Watchdog sem critical_services configurados');
                }

                $health = watchdogBuildServiceHealth(
                    $trackedServices,
                    getServiceStatusSnapshot($config),
                    watchdogNormalizeCounterMap(array_value($state, 'failure_counts', [])),
                    watchdogNormalizeCounterMap(array_value($state, 'restart_counts', [])),
                    true
                );

                $state['tracked_services'] = $trackedServices;
                $state['services'] = array_value($health, 'services', []);
                $state['healthy_services'] = array_value($health, 'healthy_services', []);
                $state['unhealthy_services'] = array_value($health, 'unhealthy_services', []);
                $state['failure_counts'] = array_value($health, 'failure_counts', []);
                $state['restart_counts'] = array_value($health, 'restart_counts', []);

                $cooldownUntilTs = serverOpsParseTimestamp(array_value($state, 'cooldown_until', null));
                $inCooldown = !$force && $cooldownUntilTs > time();

                if (empty($state['unhealthy_services'])) {
                    $state['last_result'] = 'healthy';
                    $state['critical_failure'] = false;
                    $state['last_error'] = '';
                    $state['cooldown_until'] = null;
                    $state['trigger_services'] = [];
                    $state['last_success_at'] = $now;
                    $message = 'Todos os servicos criticos estao online';
                } else {
                    $state['trigger_services'] = watchdogTriggerServices(
                        array_value($state, 'unhealthy_services', []),
                        array_value($state, 'failure_counts', []),
                        array_value($watchdogConfig, 'failure_threshold', 2)
                    );

                    if ($inCooldown) {
                        $state['last_result'] = 'cooldown';
                        $state['critical_failure'] = false;
                        $state['last_error'] = '';
                        $message = 'Watchdog em cooldown com servicos degradados';
                    } elseif (empty($state['trigger_services'])) {
                        $state['last_result'] = 'degraded';
                        $state['critical_failure'] = false;
                        $state['last_error'] = '';
                        $message = 'Servicos degradados abaixo do limiar de restart';
                    } else {
                        $blocked = [];
                        if (!$force) {
                            foreach ((array) $state['trigger_services'] as $serviceKey) {
                                if (intval(array_value($state['restart_counts'], $serviceKey, 0)) >= intval(array_value($watchdogConfig, 'max_restart_attempts', 3))) {
                                    $blocked[] = $serviceKey;
                                }
                            }
                        }

                        if (!empty($blocked)) {
                            $state['last_result'] = 'critical_failure';
                            $state['critical_failure'] = true;
                            $state['last_error'] = 'Limite de tentativas atingido para: ' . implode(', ', $blocked);
                            $message = $state['last_error'];
                            $success = false;
                        } else {
                            $operationAttempted = true;
                            $operation = handleServiceOperationRequest($config, 'restart', [
                                'services' => array_values($state['trigger_services']),
                                'verify' => !empty($watchdogConfig['verify_restart']),
                                'dry_run' => $dryRun,
                            ]);
                            $operationSummary = watchdogSummarizeOperationResult($operation);
                            $state['last_action'] = 'restart';
                            $state['last_action_at'] = $now;
                            $state['last_operation'] = $operationSummary;

                            if (!$dryRun) {
                                $restartCounts = watchdogNormalizeCounterMap(array_value($state, 'restart_counts', []));
                                foreach ((array) $state['trigger_services'] as $serviceKey) {
                                    $restartCounts[$serviceKey] = intval(array_value($restartCounts, $serviceKey, 0)) + 1;
                                }
                                $state['restart_counts'] = $restartCounts;

                                $cooldownSeconds = intval(array_value($watchdogConfig, 'cooldown_seconds', 0));
                                $state['cooldown_until'] = $cooldownSeconds > 0 ? gmdate('c', time() + $cooldownSeconds) : null;
                            }

                            if (!empty($operation['success'])) {
                                if ($dryRun) {
                                    $state['last_result'] = 'restart_dry_run';
                                    $state['critical_failure'] = false;
                                    $state['last_error'] = '';
                                    $message = 'Watchdog validou restart em dry_run';
                                } else {
                                    $postRestartHealth = watchdogBuildServiceHealth(
                                        $trackedServices,
                                        getServiceStatusSnapshot($config),
                                        watchdogNormalizeCounterMap(array_value($state, 'failure_counts', [])),
                                        watchdogNormalizeCounterMap(array_value($state, 'restart_counts', [])),
                                        false
                                    );

                                    $state['services'] = array_value($postRestartHealth, 'services', []);
                                    $state['healthy_services'] = array_value($postRestartHealth, 'healthy_services', []);
                                    $state['unhealthy_services'] = array_value($postRestartHealth, 'unhealthy_services', []);
                                    $state['failure_counts'] = array_value($postRestartHealth, 'failure_counts', []);
                                    $state['restart_counts'] = array_value($postRestartHealth, 'restart_counts', []);
                                    $state['trigger_services'] = watchdogTriggerServices(
                                        array_value($state, 'unhealthy_services', []),
                                        array_value($state, 'failure_counts', []),
                                        array_value($watchdogConfig, 'failure_threshold', 2)
                                    );

                                    if (empty($state['unhealthy_services'])) {
                                        $state['last_result'] = 'restart_success';
                                        $state['critical_failure'] = false;
                                        $state['last_error'] = '';
                                        $state['last_success_at'] = $now;
                                        $message = 'Watchdog executou restart automatico com sucesso';
                                    } else {
                                        $state['last_result'] = 'restart_partial';
                                        $state['critical_failure'] = true;
                                        $state['last_error'] = 'Restart executado, mas alguns servicos continuam degradados';
                                        $message = $state['last_error'];
                                        $success = false;
                                    }
                                }
                            } else {
                                $state['last_result'] = 'restart_failed';
                                $state['critical_failure'] = true;
                                $state['last_error'] = trim((string) array_value($operationSummary, 'error', 'Falha ao reiniciar servicos via watchdog'));
                                $message = $state['last_error'];
                                $success = false;
                            }
                        }
                    }
                }
            }
        }

        $state = watchdogHydrateState($state);
        if (empty($dryRun)) {
            watchdogPersistState($config, $state);
        }

        $historyEntry = [
            'type' => 'watchdog_check',
            'checked_at' => $now,
            'source' => $source,
            'manual' => $manual,
            'force' => $force,
            'dry_run' => $dryRun,
            'success' => $success,
            'result' => array_value($state, 'last_result', 'idle'),
            'message' => $message,
            'critical_failure' => truthyValue(array_value($state, 'critical_failure', false)),
            'unhealthy_services' => array_values(array_map('strval', array_value($state, 'unhealthy_services', []))),
            'trigger_services' => array_values(array_map('strval', array_value($state, 'trigger_services', []))),
            'failure_counts' => watchdogNormalizeCounterMap(array_value($state, 'failure_counts', [])),
            'restart_counts' => watchdogNormalizeCounterMap(array_value($state, 'restart_counts', [])),
            'operation' => $operationSummary,
        ];

        $historyLogged = false;
        $historyEntryPayload = null;
        if (watchdogShouldLogHistory($previousState, $state, $options, $operationAttempted)) {
            $historyEntryPayload = $historyEntry;
            if (empty($dryRun)) {
                watchdogAppendHistory($config, $historyEntry);
                $historyLogged = true;
            }
        }

        return [
            'success' => $success,
            'result' => array_value($state, 'last_result', 'idle'),
            'message' => $message,
            'source' => $source,
            'manual' => $manual,
            'force' => $force,
            'dry_run' => $dryRun,
            'history_logged' => $historyLogged,
            'history_entry' => $historyEntryPayload,
            'watchdog' => watchdogSummaryPayload($config, $watchdogConfig, $state),
            'state' => $state,
            'config' => $watchdogConfig,
            'operation' => $operationSummary,
            'files' => watchdogFilesPayload($config),
            'checked_at' => $now,
        ];
    } finally {
        watchdogReleaseLock($lock);
    }
}

function runWatchdogCheckNowHandler(array $config, array $request)
{
    $request = watchdogMergedRequest($request);
    return runWatchdogCheck($config, [
        'source' => trimOneLineText(array_value($request, 'source', 'api')),
        'manual' => true,
        'force' => truthyValue(array_value($request, 'force', false)),
        'dry_run' => truthyValue(array_value($request, 'dry_run', array_value($request, 'dryRun', false))),
    ]);
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

        case 'getGmCommandCatalog':
        case 'getGmCommanderCatalog':
            try {
                respondJson(gmCommandCatalogPayload($CONFIG));
            } catch (InvalidArgumentException $e) {
                respondJson(['error' => $e->getMessage()], 400);
            } catch (Exception $e) {
                respondJson(['error' => $e->getMessage()], 500);
            }
            break;

        case 'getGmActionHistory':
        case 'getGmCommanderHistory':
            try {
                $limit = isset($_GET['limit']) ? intval($_GET['limit']) : 20;
                $limit = max(1, min(200, $limit));
                respondJson([
                    'success' => true,
                    'limit' => $limit,
                    'entries' => gmReadHistory($CONFIG, $limit),
                    'history_file' => gmActionHistoryFile($CONFIG),
                    'collected_at' => gmdate('c'),
                ]);
            } catch (InvalidArgumentException $e) {
                respondJson(['error' => $e->getMessage()], 400);
            } catch (Exception $e) {
                respondJson(['error' => $e->getMessage()], 500);
            }
            break;

        case 'searchPlayerDirectory':
            $request = ($_SERVER['REQUEST_METHOD'] === 'POST') ? readRequestPayload() : $_GET;
            if (isset($request['__json_error'])) {
                respondJson(['error' => 'JSON invalido: ' . $request['__json_error']], 400);
                exit;
            }

            try {
                respondJson(gmV2SearchPlayerDirectoryPayload($CONFIG, is_array($request) ? $request : []));
            } catch (InvalidArgumentException $e) {
                respondJson(['error' => $e->getMessage()], 400);
            } catch (Exception $e) {
                respondJson(['error' => $e->getMessage()], 500);
            }
            break;

        case 'getPlayerTargetProfile':
            $request = ($_SERVER['REQUEST_METHOD'] === 'POST') ? readRequestPayload() : $_GET;
            if (isset($request['__json_error'])) {
                respondJson(['error' => 'JSON invalido: ' . $request['__json_error']], 400);
                exit;
            }

            try {
                respondJson(gmV2GetPlayerTargetProfilePayload($CONFIG, is_array($request) ? $request : []));
            } catch (InvalidArgumentException $e) {
                respondJson(['error' => $e->getMessage()], 400);
            } catch (Exception $e) {
                respondJson(['error' => $e->getMessage()], 500);
            }
            break;

        case 'resolveBulkTargets':
            if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
                respondJson(['error' => 'Use POST para resolveBulkTargets'], 405);
                exit;
            }

            $request = readRequestPayload();
            if (isset($request['__json_error'])) {
                respondJson(['error' => 'JSON invalido: ' . $request['__json_error']], 400);
                exit;
            }

            try {
                respondJson(gmV2ResolveBulkTargetsPayload($CONFIG, $request));
            } catch (InvalidArgumentException $e) {
                respondJson(['error' => $e->getMessage()], 400);
            } catch (Exception $e) {
                respondJson(['error' => $e->getMessage()], 500);
            }
            break;

        case 'previewBulkTargets':
            if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
                respondJson(['error' => 'Use POST para previewBulkTargets'], 405);
                exit;
            }

            $request = readRequestPayload();
            if (isset($request['__json_error'])) {
                respondJson(['error' => 'JSON invalido: ' . $request['__json_error']], 400);
                exit;
            }

            try {
                respondJson(gmV2PreviewBulkTargetsPayload($CONFIG, $request));
            } catch (InvalidArgumentException $e) {
                respondJson(['error' => $e->getMessage()], 400);
            } catch (Exception $e) {
                respondJson(['error' => $e->getMessage()], 500);
            }
            break;

        case 'queueBulkCommand':
            if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
                respondJson(['error' => 'Use POST para queueBulkCommand'], 405);
                exit;
            }

            $request = readRequestPayload();
            if (isset($request['__json_error'])) {
                respondJson(['error' => 'JSON invalido: ' . $request['__json_error']], 400);
                exit;
            }

            try {
                respondJson(gmV2CreateQueuedJob($CONFIG, $request));
            } catch (InvalidArgumentException $e) {
                respondJson(['error' => $e->getMessage()], 400);
            } catch (Exception $e) {
                respondJson(['error' => $e->getMessage()], 500);
            }
            break;

        case 'getBulkCommandJob':
            try {
                $jobId = trim((string) firstArrayValue($_GET, ['job_id', 'jobId', 'id'], ''));
                if ($jobId === '') {
                    throw new InvalidArgumentException('job_id obrigatorio');
                }
                respondJson(gmV2GetQueueJobPayload($CONFIG, $jobId));
            } catch (InvalidArgumentException $e) {
                respondJson(['error' => $e->getMessage()], 400);
            } catch (Exception $e) {
                respondJson(['error' => $e->getMessage()], 500);
            }
            break;

        case 'getBulkCommandJobs':
            try {
                $limit = max(1, min(200, intval(firstArrayValue($_GET, ['limit'], 20))));
                respondJson([
                    'success' => true,
                    'jobs' => gmV2ListJobs($CONFIG, $limit),
                    'limit' => $limit,
                    'collected_at' => gmdate('c'),
                ]);
            } catch (InvalidArgumentException $e) {
                respondJson(['error' => $e->getMessage()], 400);
            } catch (Exception $e) {
                respondJson(['error' => $e->getMessage()], 500);
            }
            break;

        case 'scheduleBulkCommand':
            if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
                respondJson(['error' => 'Use POST para scheduleBulkCommand'], 405);
                exit;
            }

            $request = readRequestPayload();
            if (isset($request['__json_error'])) {
                respondJson(['error' => 'JSON invalido: ' . $request['__json_error']], 400);
                exit;
            }

            try {
                respondJson(gmV2CreateBulkSchedule($CONFIG, $request));
            } catch (InvalidArgumentException $e) {
                respondJson(['error' => $e->getMessage()], 400);
            } catch (Exception $e) {
                respondJson(['error' => $e->getMessage()], 500);
            }
            break;

        case 'getBulkSchedule':
            try {
                $scheduleId = trim((string) firstArrayValue($_GET, ['schedule_id', 'scheduleId', 'id'], ''));
                if ($scheduleId === '') {
                    throw new InvalidArgumentException('schedule_id obrigatorio');
                }
                respondJson(gmV2GetBulkSchedulePayload($CONFIG, $scheduleId));
            } catch (InvalidArgumentException $e) {
                respondJson(['error' => $e->getMessage()], 400);
            } catch (Exception $e) {
                respondJson(['error' => $e->getMessage()], 500);
            }
            break;

        case 'getBulkSchedules':
            try {
                $limit = max(1, min(200, intval(firstArrayValue($_GET, ['limit'], 50))));
                respondJson(gmV2GetBulkSchedulesPayload($CONFIG, $limit));
            } catch (InvalidArgumentException $e) {
                respondJson(['error' => $e->getMessage()], 400);
            } catch (Exception $e) {
                respondJson(['error' => $e->getMessage()], 500);
            }
            break;

        case 'updateBulkSchedule':
            if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
                respondJson(['error' => 'Use POST para updateBulkSchedule'], 405);
                exit;
            }

            $request = readRequestPayload();
            if (isset($request['__json_error'])) {
                respondJson(['error' => 'JSON invalido: ' . $request['__json_error']], 400);
                exit;
            }

            try {
                $scheduleId = trim((string) firstArrayValue($request, ['schedule_id', 'scheduleId', 'id'], ''));
                if ($scheduleId === '') {
                    throw new InvalidArgumentException('schedule_id obrigatorio');
                }
                respondJson(gmV2UpdateBulkSchedule($CONFIG, $scheduleId, $request));
            } catch (InvalidArgumentException $e) {
                respondJson(['error' => $e->getMessage()], 400);
            } catch (Exception $e) {
                respondJson(['error' => $e->getMessage()], 500);
            }
            break;

        case 'deleteBulkSchedule':
            if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
                respondJson(['error' => 'Use POST para deleteBulkSchedule'], 405);
                exit;
            }

            $request = readRequestPayload();
            if (isset($request['__json_error'])) {
                respondJson(['error' => 'JSON invalido: ' . $request['__json_error']], 400);
                exit;
            }

            try {
                $scheduleId = trim((string) firstArrayValue($request, ['schedule_id', 'scheduleId', 'id'], ''));
                if ($scheduleId === '') {
                    throw new InvalidArgumentException('schedule_id obrigatorio');
                }
                respondJson(gmV2DeleteBulkSchedule($CONFIG, $scheduleId, $request));
            } catch (InvalidArgumentException $e) {
                respondJson(['error' => $e->getMessage()], 400);
            } catch (Exception $e) {
                respondJson(['error' => $e->getMessage()], 500);
            }
            break;

        case 'runDueBulkSchedules':
            if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
                respondJson(['error' => 'Use POST para runDueBulkSchedules'], 405);
                exit;
            }

            $request = readRequestPayload();
            if (isset($request['__json_error'])) {
                respondJson(['error' => 'JSON invalido: ' . $request['__json_error']], 400);
                exit;
            }

            try {
                respondJson(gmV2RunScheduleWorker($CONFIG, [
                    'source' => 'http',
                    'actor' => gmV2RequestActor($request),
                ]));
            } catch (InvalidArgumentException $e) {
                respondJson(['error' => $e->getMessage()], 400);
            } catch (Exception $e) {
                respondJson(['error' => $e->getMessage()], 500);
            }
            break;

        case 'getMallCashBalance':
        case 'getUserCashInfo':
        case 'getAccountMallCash':
            try {
                respondJson(getMallCashBalanceSnapshot($CONFIG, $_GET));
            } catch (InvalidArgumentException $e) {
                respondJson(['error' => $e->getMessage()], 400);
            } catch (Exception $e) {
                respondJson(['error' => $e->getMessage()], 500);
            }
            break;

        case 'getGmPermissionState':
        case 'getGmPermissionStatus':
            try {
                respondJson(getGmPermissionStateSnapshot($CONFIG, $_GET));
            } catch (InvalidArgumentException $e) {
                respondJson(['error' => $e->getMessage()], 400);
            } catch (Exception $e) {
                respondJson(['error' => $e->getMessage()], 500);
            }
            break;

        case 'getGmPermissionCatalog':
            respondJson(getGmPermissionCatalogSnapshot());
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
                $response = [
                    'success' => true,
                    'delivery' => $delivery,
                ];
                $gmHistoryWarning = '';
                $gmEntry = gmHistoryEntryBase($CONFIG, $action, [
                    'status' => !empty($mailPayload['dry_run']) ? 'dry_run' : 'success',
                    'success' => true,
                    'dry_run' => !empty($mailPayload['dry_run']),
                    'target' => [
                        'roleid' => intval(array_value($mailPayload, 'roleid', 0)),
                    ],
                    'mail' => [
                        'kind' => array_value($mailPayload, 'kind', ''),
                        'title' => array_value($mailPayload, 'title', ''),
                        'message' => array_value($mailPayload, 'message', ''),
                        'item_id' => intval(array_value($mailPayload, 'item_id', 0)),
                        'count' => intval(array_value($mailPayload, 'count', 0)),
                        'money' => intval(array_value($mailPayload, 'money', 0)),
                    ],
                    'delivery' => $delivery,
                ]);
                if (gmAppendHistoryBestEffort($CONFIG, $gmEntry, $gmHistoryWarning)) {
                    $response['gm_history_file'] = gmActionHistoryFile($CONFIG);
                } elseif ($gmHistoryWarning !== '') {
                    $response['gm_history_warning'] = $gmHistoryWarning;
                }
                respondJson($response);
            } catch (InvalidArgumentException $e) {
                gmAppendHistoryBestEffort($CONFIG, gmHistoryEntryBase($CONFIG, $action, [
                    'status' => 'error',
                    'success' => false,
                    'dry_run' => truthyValue(firstArrayValue($request, ['dry_run', 'dryRun'], false)),
                    'target' => [
                        'roleid' => intval(firstArrayValue($request, ['roleid', 'role_id', 'target_roleid', 'receiver_roleid'], 0)),
                    ],
                    'error' => $e->getMessage(),
                ]));
                respondJson(['error' => $e->getMessage()], 400);
            } catch (Exception $e) {
                gmAppendHistoryBestEffort($CONFIG, gmHistoryEntryBase($CONFIG, $action, [
                    'status' => 'error',
                    'success' => false,
                    'dry_run' => truthyValue(firstArrayValue($request, ['dry_run', 'dryRun'], false)),
                    'target' => [
                        'roleid' => intval(firstArrayValue($request, ['roleid', 'role_id', 'target_roleid', 'receiver_roleid'], 0)),
                    ],
                    'error' => $e->getMessage(),
                ]));
                respondJson(['error' => $e->getMessage()], 500);
            }
            break;

        case 'grantMallCash':
        case 'addShopGold':
        case 'grantCash':
        case 'addCash':
        case 'grantItemMallGold':
            if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
                respondJson(['error' => 'Use POST para grantMallCash'], 405);
                exit;
            }

            $request = readRequestPayload();
            if (isset($request['__json_error'])) {
                respondJson(['error' => 'JSON invalido: ' . $request['__json_error']], 400);
                exit;
            }

            try {
                respondJson(handleGrantMallCashRequest($CONFIG, $request));
            } catch (InvalidArgumentException $e) {
                gmAppendHistoryBestEffort($CONFIG, gmHistoryEntryBase($CONFIG, 'grantMallCash', [
                    'status' => 'error',
                    'success' => false,
                    'dry_run' => truthyValue(firstArrayValue($request, ['dry_run', 'dryRun'], false)),
                    'target' => [
                        'roleid' => intval(firstArrayValue($request, ['roleid', 'role_id', 'target_roleid'], 0)),
                        'userid' => intval(firstArrayValue($request, ['userid', 'user_id', 'account_id', 'accountId', 'target_userid'], 0)),
                    ],
                    'grant' => [
                        'amount' => firstArrayValue($request, ['amount', 'gold', 'cash_gold', 'mall_gold', 'value'], null),
                        'cash_units' => firstArrayValue($request, ['cash_units', 'cashUnits', 'raw_cash_units'], null),
                    ],
                    'error' => $e->getMessage(),
                ]));
                respondJson(['error' => $e->getMessage()], 400);
            } catch (Exception $e) {
                gmAppendHistoryBestEffort($CONFIG, gmHistoryEntryBase($CONFIG, 'grantMallCash', [
                    'status' => 'error',
                    'success' => false,
                    'dry_run' => truthyValue(firstArrayValue($request, ['dry_run', 'dryRun'], false)),
                    'target' => [
                        'roleid' => intval(firstArrayValue($request, ['roleid', 'role_id', 'target_roleid'], 0)),
                        'userid' => intval(firstArrayValue($request, ['userid', 'user_id', 'account_id', 'accountId', 'target_userid'], 0)),
                    ],
                    'grant' => [
                        'amount' => firstArrayValue($request, ['amount', 'gold', 'cash_gold', 'mall_gold', 'value'], null),
                        'cash_units' => firstArrayValue($request, ['cash_units', 'cashUnits', 'raw_cash_units'], null),
                    ],
                    'error' => $e->getMessage(),
                ]));
                respondJson(['error' => $e->getMessage()], 500);
            }
            break;

        case 'grantGmPermission':
        case 'setGmPermission':
        case 'revokeGmPermission':
        case 'removeGmPermission':
        case 'unsetGmPermission':
            if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
                respondJson(['error' => 'Use POST para permissao GM'], 405);
                exit;
            }

            $request = readRequestPayload();
            if (isset($request['__json_error'])) {
                respondJson(['error' => 'JSON invalido: ' . $request['__json_error']], 400);
                exit;
            }

            $permissionMode = in_array($action, ['revokeGmPermission', 'removeGmPermission', 'unsetGmPermission'], true)
                ? 'revoke'
                : 'grant';
            $permissionKey = ($permissionMode === 'revoke') ? 'revokeGmPermission' : 'grantGmPermission';

            try {
                respondJson(handleGmPermissionRequest($CONFIG, $request, $permissionMode));
            } catch (InvalidArgumentException $e) {
                gmAppendHistoryBestEffort($CONFIG, gmHistoryEntryBase($CONFIG, $permissionKey, [
                    'status' => 'error',
                    'success' => false,
                    'dry_run' => truthyValue(firstArrayValue($request, ['dry_run', 'dryRun'], false)),
                    'reason' => firstArrayValue($request, ['reason', 'message', 'note', 'moderation_reason'], ''),
                    'target' => [
                        'roleid' => intval(firstArrayValue($request, ['roleid', 'role_id', 'target_roleid'], 0)),
                        'userid' => intval(firstArrayValue($request, ['userid', 'user_id', 'account_id', 'accountId', 'target_userid'], 0)),
                    ],
                    'error' => $e->getMessage(),
                ]));
                respondJson(['error' => $e->getMessage()], 400);
            } catch (Exception $e) {
                gmAppendHistoryBestEffort($CONFIG, gmHistoryEntryBase($CONFIG, $permissionKey, [
                    'status' => 'error',
                    'success' => false,
                    'dry_run' => truthyValue(firstArrayValue($request, ['dry_run', 'dryRun'], false)),
                    'reason' => firstArrayValue($request, ['reason', 'message', 'note', 'moderation_reason'], ''),
                    'target' => [
                        'roleid' => intval(firstArrayValue($request, ['roleid', 'role_id', 'target_roleid'], 0)),
                        'userid' => intval(firstArrayValue($request, ['userid', 'user_id', 'account_id', 'accountId', 'target_userid'], 0)),
                    ],
                    'error' => $e->getMessage(),
                ]));
                respondJson(['error' => $e->getMessage()], 500);
            }
            break;

        case 'kickRole':
        case 'banAccount':
        case 'unbanAccount':
        case 'muteAccount':
        case 'muteAcc':
        case 'muteRole':
        case 'clearRolePk':
        case 'reviveRole':
        case 'teleportRole':
        case 'playerTeleport':
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
                } elseif ($action === 'unbanAccount') {
                    $payload = buildUnbanAccountPayload($request, $CONFIG, $proto);
                } elseif ($action === 'muteAccount' || $action === 'muteAcc') {
                    $payload = buildMuteAccountPayload($request, $CONFIG, $proto);
                } elseif ($action === 'muteRole') {
                    $payload = buildMuteRolePayload($request, $CONFIG);
                } elseif ($action === 'clearRolePk') {
                    $payload = buildClearRolePkPayload($request, $CONFIG);
                } elseif ($action === 'reviveRole') {
                    $payload = buildReviveRolePayload($request, $CONFIG);
                } else {
                    $payload = buildTeleportRolePayload($request, $CONFIG);
                }

                $gmDefinition = gmCommandDefinition($CONFIG, array_value($payload, 'action', $action));
                if (is_array($gmDefinition) && empty($gmDefinition['supported'])) {
                    throw new InvalidArgumentException('Acao GM nao suportada nesta game_version: ' . array_value($gmDefinition, 'key', $action));
                }

                $result = executeSecurityAction($CONFIG, $payload);
                respondJson([
                    'success' => true,
                    'gm_action' => $result,
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
                gmAppendHistoryBestEffort($CONFIG, gmHistoryEntryBase($CONFIG, $action, [
                    'status' => 'error',
                    'success' => false,
                    'dry_run' => truthyValue(firstArrayValue($request, ['dry_run', 'dryRun'], false)),
                    'target' => [
                        'roleid' => intval(firstArrayValue($request, ['roleid', 'role_id', 'target_roleid'], 0)),
                        'userid' => intval(firstArrayValue($request, ['userid', 'user_id', 'account_id', 'accountId', 'target_userid'], 0)),
                    ],
                    'error' => $e->getMessage(),
                ]));
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
                gmAppendHistoryBestEffort($CONFIG, gmHistoryEntryBase($CONFIG, $action, [
                    'status' => 'error',
                    'success' => false,
                    'dry_run' => truthyValue(firstArrayValue($request, ['dry_run', 'dryRun'], false)),
                    'target' => [
                        'roleid' => intval(firstArrayValue($request, ['roleid', 'role_id', 'target_roleid'], 0)),
                        'userid' => intval(firstArrayValue($request, ['userid', 'user_id', 'account_id', 'accountId', 'target_userid'], 0)),
                    ],
                    'error' => $e->getMessage(),
                ]));
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

        case 'getControlCenterSnapshot':
            try {
                respondJson(getControlCenterSnapshot($CONFIG));
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
                gmAppendHistoryBestEffort($CONFIG, gmHistoryEntryBase($CONFIG, 'sendSystemMessage', [
                    'status' => 'error',
                    'success' => false,
                    'dry_run' => truthyValue(array_value($request, 'dry_run', array_value($request, 'dryRun', false))),
                    'message_payload' => [
                        'message' => trim((string) array_value($request, 'message', '')),
                        'kind' => trim((string) array_value($request, 'kind', 'system')),
                    ],
                    'error' => $e->getMessage(),
                ]));
                respondJson(['error' => $e->getMessage()], 400);
            } catch (Exception $e) {
                gmAppendHistoryBestEffort($CONFIG, gmHistoryEntryBase($CONFIG, 'sendSystemMessage', [
                    'status' => 'error',
                    'success' => false,
                    'dry_run' => truthyValue(array_value($request, 'dry_run', array_value($request, 'dryRun', false))),
                    'message_payload' => [
                        'message' => trim((string) array_value($request, 'message', '')),
                        'kind' => trim((string) array_value($request, 'kind', 'system')),
                    ],
                    'error' => $e->getMessage(),
                ]));
                respondJson(['error' => $e->getMessage()], 500);
            }
            break;

        case 'summonRole':
        case 'prisonRole':
        case 'resetRoleQuest':
            $definition = gmCommandDefinition($CONFIG, $action);
            respondJson([
                'success' => false,
                'supported' => false,
                'error' => 'Acao GM ainda nao implementada com suporte real nesta game_version',
                'command' => $definition,
            ], 501);
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

        case 'getWatchdogStatus':
            try {
                respondJson(getWatchdogStatusHandler($CONFIG));
            } catch (InvalidArgumentException $e) {
                respondJson(['error' => $e->getMessage()], 400);
            } catch (Exception $e) {
                respondJson(['error' => $e->getMessage()], 500);
            }
            break;

        case 'getWatchdogHistory':
            try {
                respondJson(getWatchdogHistoryHandler($CONFIG, $_GET));
            } catch (InvalidArgumentException $e) {
                respondJson(['error' => $e->getMessage()], 400);
            } catch (Exception $e) {
                respondJson(['error' => $e->getMessage()], 500);
            }
            break;

        case 'saveWatchdogConfig':
        case 'enableWatchdog':
        case 'disableWatchdog':
        case 'runWatchdogCheckNow':
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
                if ($action === 'saveWatchdogConfig') {
                    $result = saveWatchdogConfigHandler($CONFIG, $request);
                } elseif ($action === 'enableWatchdog') {
                    $result = setWatchdogEnabledHandler($CONFIG, true, $request);
                } elseif ($action === 'disableWatchdog') {
                    $result = setWatchdogEnabledHandler($CONFIG, false, $request);
                } else {
                    $result = runWatchdogCheckNowHandler($CONFIG, $request);
                }

                respondJson($result, !empty($result['success']) ? 200 : 500);
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

        case 'backupNow':
            if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
                respondJson(['error' => 'Use POST para backupNow'], 405);
                exit;
            }

            $request = readRequestPayload();
            if (isset($request['__json_error'])) {
                respondJson(['error' => 'JSON invalido: ' . $request['__json_error']], 400);
                exit;
            }

            try {
                respondJson(handleBackupNowRequest($CONFIG, $request));
            } catch (InvalidArgumentException $e) {
                respondJson(['error' => $e->getMessage()], 400);
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

        case 'getRestorePlan':
            $request = array_merge($_GET, readRequestPayload());
            if (isset($request['__json_error'])) {
                respondJson(['error' => 'JSON invalido: ' . $request['__json_error']], 400);
                exit;
            }

            try {
                respondJson(handleGetRestorePlanRequest($CONFIG, $request));
            } catch (InvalidArgumentException $e) {
                respondJson(['error' => $e->getMessage()], 400);
            } catch (Exception $e) {
                respondJson(['error' => $e->getMessage()], 500);
            }
            break;

        case 'getRestoreHistory':
            $limit = isset($_GET['limit']) ? intval($_GET['limit']) : 20;
            try {
                respondJson(handleGetRestoreHistoryRequest($CONFIG, $limit));
            } catch (Exception $e) {
                respondJson(['error' => $e->getMessage()], 500);
            }
            break;

        case 'restoreNow':
            if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
                respondJson(['error' => 'Use POST para restoreNow'], 405);
                exit;
            }

            $request = readRequestPayload();
            if (isset($request['__json_error'])) {
                respondJson(['error' => 'JSON invalido: ' . $request['__json_error']], 400);
                exit;
            }

            $proto = new GamedProtocol();

            try {
                respondJson(handleRestoreNowRequest($CONFIG, $proto, $request));
            } catch (InvalidArgumentException $e) {
                respondJson(['error' => $e->getMessage()], 400);
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
                'error' => 'Acao invalida. Use: getRole, getRoles, getRoleEditable, getRolesEditable, getClasses, getClsconfig, getClsconfigDebug, getItemCatalog, getGmCommandCatalog, getGmActionHistory, getGmPermissionCatalog, getGmPermissionState, getMallCashBalance, searchPlayerDirectory, getPlayerTargetProfile, resolveBulkTargets, previewBulkTargets, queueBulkCommand, getBulkCommandJob, getBulkCommandJobs, scheduleBulkCommand, getBulkSchedule, getBulkSchedules, updateBulkSchedule, deleteBulkSchedule, runDueBulkSchedules, getServiceStatus, getControlCenterSnapshot, getManageableServices, getManageableInstances, setInstanceAutoStart, startInstance, startInstances, stopInstance, stopInstances, restartInstance, restartInstances, getServerOperationStatus, getServerOperationsHistory, getServerLogs, sendSystemMessage, getMaintenanceMode, setMaintenanceMode, getWatchdogStatus, getWatchdogHistory, saveWatchdogConfig, enableWatchdog, disableWatchdog, runWatchdogCheckNow, startServer, stopServer, restartServer, startService, stopService, restartService, sendMailItem, sendMailGold, grantMallCash, grantGmPermission, revokeGmPermission, kickRole, banAccount, unbanAccount, muteAccount, muteRole, clearRolePk, reviveRole, teleportRole, listBackups, backupGamedbd, backupNow, getBackupContent, getRestorePlan, getRestoreHistory, restoreNow, restoreBackup, exportClsconfig, saveRoleEditable, saveClsconfigTemplate',
            ], 400);
            break;
    }

    exit;
} elseif (php_sapi_name() === 'cli') {
    $cliAction = isset($argv[1]) ? trim((string) $argv[1]) : '';
    if ($cliAction === 'watchdog-runner') {
        try {
            $result = runWatchdogCheck($CONFIG, [
                'source' => 'cli',
                'manual' => false,
                'force' => false,
                'dry_run' => false,
            ]);
            echo safeJsonEncode($result) . PHP_EOL;
            exit(!empty($result['success']) ? 0 : 1);
        } catch (Exception $e) {
            $payload = [
                'success' => false,
                'result' => 'error',
                'error' => $e->getMessage(),
                'checked_at' => gmdate('c'),
            ];
            echo safeJsonEncode($payload) . PHP_EOL;
            exit(1);
        }
    } elseif ($cliAction === 'gm-queue-worker') {
        try {
            $result = gmV2RunQueueWorker($CONFIG, [
                'source' => 'cli',
            ]);
            echo safeJsonEncode($result) . PHP_EOL;
            exit(!empty($result['success']) ? 0 : 1);
        } catch (Exception $e) {
            $payload = [
                'success' => false,
                'error' => $e->getMessage(),
                'checked_at' => gmdate('c'),
            ];
            echo safeJsonEncode($payload) . PHP_EOL;
            exit(1);
        }
    } elseif ($cliAction === 'gm-schedule-worker') {
        try {
            $result = gmV2RunScheduleWorker($CONFIG, [
                'source' => 'cli',
            ]);
            echo safeJsonEncode($result) . PHP_EOL;
            exit(!empty($result['success']) ? 0 : 1);
        } catch (Exception $e) {
            $payload = [
                'success' => false,
                'error' => $e->getMessage(),
                'checked_at' => gmdate('c'),
            ];
            echo safeJsonEncode($payload) . PHP_EOL;
            exit(1);
        }
    }
}
