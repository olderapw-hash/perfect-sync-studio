#!/bin/bash
# Instala a bridge PW Admin / api_cls.php em CentOS 7.
#
# Uso comum:
#   bash install-apicls-centos7.sh --secret SEU_SECRET
#
# Se o api_cls.php estiver em outro lugar:
#   bash install-apicls-centos7.sh --secret SEU_SECRET --api-src /root/api_cls.php
#
# Para pagina /install hospedada:
#   bash install-apicls-centos7.sh --secret SEU_SECRET --api-url https://SEU-PAINEL/installer/api_cls.php

set -Eeuo pipefail

INSTALL_DIR="/var/www/html/apicls"
API_SRC=""
API_URL=""
SECRET="${PW_API_SECRET:-}"
WEB_USER=""
OPEN_FIREWALL=1
INSTALL_PACKAGES=1
INSTALL_REMI_PHP=1
BACKUP_EXISTING=1
SUDOERS_FILE="/etc/sudoers.d/apicls-pwadmin"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

log() {
  printf '\033[1;32m[OK]\033[0m %s\n' "$*"
}

warn() {
  printf '\033[1;33m[AVISO]\033[0m %s\n' "$*" >&2
}

die() {
  printf '\033[1;31m[ERRO]\033[0m %s\n' "$*" >&2
  exit 1
}

usage() {
  cat <<'EOF'
Instalador PW Admin API CLS para CentOS 7

Opcoes:
  --secret VALOR       Secret da VPS gerado no painel. Se omitir, gera um novo.
  --api-src CAMINHO    Caminho local do api_cls.php. Default: ./api_cls.php.
  --api-url URL        Baixa api_cls.php desta URL.
  --web-user USUARIO   Usuario do Apache/PHP. Default: auto-detecta apache.
  --install-dir DIR    Default: /var/www/html/apicls
  --no-yum             Nao tenta instalar httpd/php/curl/sudo.
  --no-remi            Nao tenta instalar Remi PHP 8.2 quando PHP for antigo.
  --no-firewall        Nao abre porta HTTP no firewalld.
  --no-backup-existing Nao cria copia do /var/www/html/apicls existente.
  -h, --help           Mostra esta ajuda.

Exemplo:
  bash install-apicls-centos7.sh --secret 8f74c4d4e7fbe1d0f3e420ef85a0a
EOF
}

while [ "$#" -gt 0 ]; do
  case "$1" in
    --secret)
      SECRET="${2:-}"
      shift 2
      ;;
    --api-src)
      API_SRC="${2:-}"
      shift 2
      ;;
    --api-url)
      API_URL="${2:-}"
      shift 2
      ;;
    --web-user)
      WEB_USER="${2:-}"
      shift 2
      ;;
    --install-dir)
      INSTALL_DIR="${2:-}"
      shift 2
      ;;
    --no-yum)
      INSTALL_PACKAGES=0
      shift
      ;;
    --no-remi)
      INSTALL_REMI_PHP=0
      shift
      ;;
    --no-firewall)
      OPEN_FIREWALL=0
      shift
      ;;
    --no-backup-existing)
      BACKUP_EXISTING=0
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      die "Opcao desconhecida: $1"
      ;;
  esac
done

[ "$(id -u)" = "0" ] || die "Execute como root."

if [ -z "$SECRET" ]; then
  if command -v openssl >/dev/null 2>&1; then
    SECRET="$(openssl rand -hex 20)"
  else
    SECRET="$(tr -dc 'a-zA-Z0-9' </dev/urandom 2>/dev/null | head -c 40 || true)"
  fi
  [ -n "$SECRET" ] || die "Nao foi possivel gerar secret automaticamente."
  warn "Nenhum --secret informado. Gerei um novo secret para cadastrar no painel."
fi

case "$SECRET" in
  *"'"*|*'"'*|*" "*)
    die "Secret invalido: nao use aspas ou espacos."
    ;;
esac

if [ "${#SECRET}" -lt 8 ]; then
  die "Secret muito curto. Use pelo menos 8 caracteres."
fi

if [ "$INSTALL_PACKAGES" = "1" ]; then
  if command -v yum >/dev/null 2>&1; then
    PKGS=()
    command -v httpd >/dev/null 2>&1 || PKGS+=("httpd")
    command -v sudo >/dev/null 2>&1 || PKGS+=("sudo")
    command -v curl >/dev/null 2>&1 || PKGS+=("curl")
    command -v tar >/dev/null 2>&1 || PKGS+=("tar" "gzip")
    if [ "${#PKGS[@]}" -gt 0 ]; then
      log "Instalando pacotes: ${PKGS[*]}"
      yum install -y "${PKGS[@]}"
    fi
  else
    warn "yum nao encontrado; pulando instalacao de pacotes."
  fi
fi

php_ok() {
  command -v php >/dev/null 2>&1 || return 1
  php -r 'exit(version_compare(PHP_VERSION, "7.0.0", ">=") ? 0 : 1);' >/dev/null 2>&1
}

if ! php_ok; then
  if [ "$INSTALL_PACKAGES" = "1" ] && [ "$INSTALL_REMI_PHP" = "1" ] && command -v yum >/dev/null 2>&1; then
    warn "PHP ausente ou antigo. Instalando/ativando PHP 8.2 via Remi para CentOS 7."
    yum install -y epel-release yum-utils
    if ! rpm -q remi-release >/dev/null 2>&1; then
      yum install -y https://rpms.remirepo.net/enterprise/remi-release-7.rpm
    fi
    yum-config-manager --enable remi-php82 >/dev/null 2>&1 || true
    yum install -y --enablerepo=remi-php82 php php-cli php-json php-mbstring php-process
  fi
fi

php_ok || die "PHP 7+ nao encontrado. Instale PHP 7.4/8.x ou rode sem --no-remi."
command -v sudo >/dev/null 2>&1 || die "sudo nao encontrado. Instale sudo antes de continuar."
command -v tar >/dev/null 2>&1 || die "tar nao encontrado."

if [ -z "$WEB_USER" ]; then
  if id apache >/dev/null 2>&1; then
    WEB_USER="apache"
  elif id nginx >/dev/null 2>&1; then
    WEB_USER="nginx"
  elif id www-data >/dev/null 2>&1; then
    WEB_USER="www-data"
  else
    WEB_USER="apache"
  fi
fi

id "$WEB_USER" >/dev/null 2>&1 || die "Usuario web '$WEB_USER' nao existe. Use --web-user."
PHP_CLI_BIN="$(command -v php 2>/dev/null || true)"
[ -n "$PHP_CLI_BIN" ] || die "php nao encontrado no sistema."

TMP_DIR="$(mktemp -d /tmp/apicls-install.XXXXXX)"
cleanup() {
  rm -rf "$TMP_DIR"
}
trap cleanup EXIT

TMP_API="$TMP_DIR/api_cls.php"

if [ -n "$API_URL" ]; then
  command -v curl >/dev/null 2>&1 || die "curl nao encontrado para baixar --api-url."
  log "Baixando api_cls.php de $API_URL"
  curl -fsSL "$API_URL" -o "$TMP_API"
else
  if [ -z "$API_SRC" ]; then
    API_SRC="$SCRIPT_DIR/api_cls.php"
  fi
  [ -f "$API_SRC" ] || die "api_cls.php nao encontrado em '$API_SRC'. Coloque api_cls.php ao lado deste instalador ou use --api-src/--api-url."
  cp -f "$API_SRC" "$TMP_API"
fi

sed -i 's/\r$//' "$TMP_API"

if ! grep -q "backupGamedbd" "$TMP_API"; then
  die "api_cls.php parece antigo/incompleto. Ele precisa conter a action backupGamedbd."
fi

if ! grep -q "sendMailItem" "$TMP_API" || ! grep -q "sendMailGold" "$TMP_API"; then
  die "api_cls.php parece desatualizado. Ele precisa conter sendMailItem e sendMailGold."
fi

if ! grep -q "kickRole" "$TMP_API" || ! grep -q "banAccount" "$TMP_API" || ! grep -q "unbanAccount" "$TMP_API"; then
  die "api_cls.php parece desatualizado. Ele precisa conter kickRole, banAccount e unbanAccount."
fi

if ! grep -q "getServiceStatus" "$TMP_API" || ! grep -q "getControlCenterSnapshot" "$TMP_API" || ! grep -q "getServerLogs" "$TMP_API"; then
  die "api_cls.php parece desatualizado. Ele precisa conter getServiceStatus, getControlCenterSnapshot e getServerLogs."
fi

if ! grep -q "sendSystemMessage" "$TMP_API" || ! grep -q "getGmCommandCatalog" "$TMP_API" || ! grep -q "getGmActionHistory" "$TMP_API" || ! grep -q "getGmPermissionCatalog" "$TMP_API" || ! grep -q "getGmPermissionState" "$TMP_API" || ! grep -q "grantGmPermission" "$TMP_API" || ! grep -q "revokeGmPermission" "$TMP_API" || ! grep -q "getMallCashBalance" "$TMP_API" || ! grep -q "grantMallCash" "$TMP_API" || ! grep -q "muteAccount" "$TMP_API" || ! grep -q "muteRole" "$TMP_API" || ! grep -q "teleportRole" "$TMP_API" || ! grep -q "getMaintenanceMode" "$TMP_API" || ! grep -q "getManageableServices" "$TMP_API" || ! grep -q "getManageableInstances" "$TMP_API" || ! grep -q "setInstanceAutoStart" "$TMP_API" || ! grep -q "startInstance" "$TMP_API" || ! grep -q "startInstances" "$TMP_API" || ! grep -q "stopInstance" "$TMP_API" || ! grep -q "stopInstances" "$TMP_API" || ! grep -q "restartInstance" "$TMP_API" || ! grep -q "restartInstances" "$TMP_API" || ! grep -q "getServerOperationStatus" "$TMP_API" || ! grep -q "getServerOperationsHistory" "$TMP_API" || ! grep -q "setMaintenanceMode" "$TMP_API" || ! grep -q "startServer" "$TMP_API" || ! grep -q "stopServer" "$TMP_API" || ! grep -q "restartServer" "$TMP_API" || ! grep -q "startService" "$TMP_API" || ! grep -q "stopService" "$TMP_API" || ! grep -q "restartService" "$TMP_API" || ! grep -q "backupNow" "$TMP_API" || ! grep -q "getRestorePlan" "$TMP_API" || ! grep -q "getRestoreHistory" "$TMP_API" || ! grep -q "restoreNow" "$TMP_API"; then
  die "api_cls.php parece desatualizado. Ele precisa conter sendSystemMessage, getGmCommandCatalog, getGmActionHistory, getGmPermissionCatalog, getGmPermissionState, grantGmPermission, revokeGmPermission, getMallCashBalance, grantMallCash, muteAccount, muteRole, teleportRole, getMaintenanceMode, getManageableServices, getManageableInstances, setInstanceAutoStart, startInstance, startInstances, stopInstance, stopInstances, restartInstance, restartInstances, getServerOperationStatus, getServerOperationsHistory, setMaintenanceMode, startServer, stopServer, restartServer, startService, stopService, restartService, backupNow, getRestorePlan, getRestoreHistory e restoreNow."
fi

if ! grep -q "scheduleBulkCommand" "$TMP_API" || ! grep -q "getBulkSchedules" "$TMP_API" || ! grep -q "runDueBulkSchedules" "$TMP_API"; then
  die "api_cls.php parece desatualizado. Ele precisa conter scheduleBulkCommand, getBulkSchedules e runDueBulkSchedules."
fi

if grep -q "'api_secret'" "$TMP_API"; then
  sed -i -E "s/('api_secret'[[:space:]]*=>[[:space:]]*)'[^']*'/\1'$SECRET'/" "$TMP_API"
elif grep -q "\$SECRET[[:space:]]*=" "$TMP_API"; then
  sed -i -E "s/(\$SECRET[[:space:]]*=[[:space:]]*)'[^']*'/\1'$SECRET'/" "$TMP_API"
else
  die "Nao encontrei campo api_secret/\$SECRET no api_cls.php."
fi

php -l "$TMP_API" >/dev/null || die "api_cls.php baixado/copied tem erro de sintaxe."

if [ -d "$INSTALL_DIR" ] && [ "$BACKUP_EXISTING" = "1" ]; then
  EXISTING_BAK="/root/apicls-before-install-$(date +%Y%m%d-%H%M%S).tgz"
  tar -czf "$EXISTING_BAK" -C "$(dirname "$INSTALL_DIR")" "$(basename "$INSTALL_DIR")" 2>/dev/null || true
  log "Backup da instalacao anterior: $EXISTING_BAK"
fi

mkdir -p "$INSTALL_DIR/backups/clsconfig/export-logs"
mkdir -p "$INSTALL_DIR/backups/clsconfig/files"
mkdir -p "$INSTALL_DIR/backups/clsconfig/archives"
mkdir -p "$INSTALL_DIR/backups/gamedbd"
mkdir -p "$INSTALL_DIR/backups/mysql"
mkdir -p "$INSTALL_DIR/backups/uniquenamed"
mkdir -p "$INSTALL_DIR/backups/panel"
mkdir -p "$INSTALL_DIR/backups/full"
mkdir -p "$INSTALL_DIR/backups/watchdog"
mkdir -p "$INSTALL_DIR/backups/restore"
mkdir -p "$INSTALL_DIR/backups/gm-actions"
mkdir -p "$INSTALL_DIR/backups/security-logs"
mkdir -p "$INSTALL_DIR/backups/sysmsg-logs"
mkdir -p "$INSTALL_DIR/backups/maintenance"
mkdir -p "$INSTALL_DIR/backups/server-ops"
mkdir -p "$INSTALL_DIR/backups/gm-commander-v2/queue/jobs"
mkdir -p "$INSTALL_DIR/backups/gm-commander-v2/queue/attempts"
mkdir -p "$INSTALL_DIR/backups/gm-commander-v2/queue/logs"
mkdir -p "$INSTALL_DIR/backups/gm-commander-v2/schedules/items"
mkdir -p "$INSTALL_DIR/backups/gm-commander-v2/schedules/logs"
mkdir -p "$INSTALL_DIR/backups/gm-commander-v2/audit"

cp -f "$TMP_API" "$INSTALL_DIR/api_cls.php"

cat > "$INSTALL_DIR/gm-queue-worker.php" <<'EOF'
<?php

if (!isset($argv) || !is_array($argv)) {
    $argv = [__FILE__];
}

array_splice($argv, 1, 0, ['gm-queue-worker']);
$argc = count($argv);

require __DIR__ . '/api_cls.php';
EOF

cat > "$INSTALL_DIR/gm-schedule-worker.php" <<'EOF'
<?php

if (!isset($argv) || !is_array($argv)) {
    $argv = [__FILE__];
}

array_splice($argv, 1, 0, ['gm-schedule-worker']);
$argc = count($argv);

require __DIR__ . '/api_cls.php';
EOF

cat > "$INSTALL_DIR/.htaccess" <<'EOF'
Options -Indexes

<IfModule mod_authz_core.c>
  <FilesMatch "^(?:\.|backupgamedbd-api\.sh|install-apicls-centos7\.sh|README\.md|gm-queue-worker\.php|gm-schedule-worker\.php|sudoers\..*|clsconfig)$">
    Require all denied
  </FilesMatch>
</IfModule>

<IfModule !mod_authz_core.c>
  <FilesMatch "^(?:\.|backupgamedbd-api\.sh|install-apicls-centos7\.sh|README\.md|gm-queue-worker\.php|gm-schedule-worker\.php|sudoers\..*|clsconfig)$">
    Order allow,deny
    Deny from all
  </FilesMatch>
</IfModule>
EOF

cat > "$INSTALL_DIR/backups/.htaccess" <<'EOF'
Options -Indexes

<IfModule mod_authz_core.c>
  Require all denied
</IfModule>

<IfModule !mod_authz_core.c>
  Order allow,deny
  Deny from all
</IfModule>
EOF

cat > /etc/httpd/conf.d/apicls-security.conf <<EOF
<Directory "$INSTALL_DIR">
    Options -Indexes +FollowSymLinks
    AllowOverride All
</Directory>

<Directory "$INSTALL_DIR/backups">
    Require all denied
    AllowOverride None
</Directory>

<LocationMatch "^/apicls/backups(?:/|$)">
    Require all denied
</LocationMatch>

<LocationMatch "^/apicls/(?:backupgamedbd-api\.sh|install-apicls-centos7\.sh|README\.md|sudoers\.gamedbd-backup\.example|clsconfig)$">
    Require all denied
</LocationMatch>
EOF

cat > /usr/local/sbin/exportclsconfig-api.sh <<'EOF'
#!/bin/sh
export HOME=/home/gamedbd
export PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
ulimit -n 65535 2>/dev/null || true
cd /home/gamedbd || exit 10
exec ./gamedbd ./gamesys.conf exportclsconfig
EOF

cat > /usr/local/sbin/backupgamedbd-api.sh <<'EOF'
#!/bin/bash
set -euo pipefail

BACKUP_ROOT="${1:-/var/www/html/apicls/backups/gamedbd}"
REASON="${2:-manual}"
GAMEBD_DIR="/home/gamedbd"

if [ "$(id -u)" != "0" ]; then
  echo "backupgamedbd-api.sh precisa rodar como root" >&2
  exit 10
fi

if [ ! -d "$GAMEBD_DIR" ]; then
  echo "Diretorio gamedbd nao encontrado: $GAMEBD_DIR" >&2
  exit 11
fi

mkdir -p "$BACKUP_ROOT"
chmod 750 "$BACKUP_ROOT" 2>/dev/null || true
if id apache >/dev/null 2>&1; then
  chown apache:apache "$BACKUP_ROOT" 2>/dev/null || true
fi

TS="$(date -u +%Y%m%d-%H%M%S)"
RAND="$(tr -dc 'a-f0-9' </dev/urandom 2>/dev/null | head -c 8 || true)"
if [ -z "$RAND" ]; then
  RAND="$(date +%s)"
fi

OUT="$BACKUP_ROOT/gamedbd-backup-$TS-$RAND.tgz"
TMP="$BACKUP_ROOT/.gamedbd-backup-$TS-$RAND.tmp"
ERR="$BACKUP_ROOT/.gamedbd-backup-$TS-$RAND.err"

INCLUDES=()
for path in \
  "gamedbd/gamesys.conf" \
  "gamedbd/clsconfig" \
  "gamedbd/dbdata" \
  "gamedbd/dblogs" \
  "gamedbd/dbhome" \
  "gamedbd/backup"; do
  if [ -e "/home/$path" ]; then
    INCLUDES+=("$path")
  fi
done

if [ "${#INCLUDES[@]}" -eq 0 ]; then
  echo "Nenhum arquivo critico encontrado para backup em $GAMEBD_DIR" >&2
  exit 12
fi

tar -C /home \
  --warning=no-file-changed \
  --ignore-failed-read \
  -czf "$TMP" \
  "${INCLUDES[@]}" 2>"$ERR" || TAR_EXIT=$?

TAR_EXIT="${TAR_EXIT:-0}"
if [ "$TAR_EXIT" -ne 0 ] && [ "$TAR_EXIT" -ne 1 ]; then
  cat "$ERR" >&2 || true
  rm -f "$TMP"
  exit "$TAR_EXIT"
fi

mv -f "$TMP" "$OUT"
chmod 640 "$OUT" 2>/dev/null || true
if id apache >/dev/null 2>&1; then
  chown apache:apache "$OUT" 2>/dev/null || true
fi

BYTES="$(stat -c '%s' "$OUT" 2>/dev/null || wc -c < "$OUT")"
SHA1="$(sha1sum "$OUT" | awk '{print $1}')"

php -r '
$payload = [
    "type" => "gamedbd_backup",
    "file" => $argv[1],
    "name" => basename($argv[1]),
    "bytes" => (int) $argv[2],
    "sha1" => $argv[3],
    "created_at" => gmdate("c"),
    "reason" => $argv[4],
    "includes" => array_slice($argv, 5),
];
echo json_encode($payload, JSON_UNESCAPED_SLASHES) . PHP_EOL;
' "$OUT" "$BYTES" "$SHA1" "$REASON" "${INCLUDES[@]}"

rm -f "$ERR"
EOF

cat > /usr/local/sbin/backupclsconfig-api.sh <<'EOF'
#!/bin/bash
set -euo pipefail

BACKUP_ROOT="${1:-/var/www/html/apicls/backups/clsconfig/archives}"
REASON="${2:-manual}"

if [ "$(id -u)" != "0" ]; then
  echo "backupclsconfig-api.sh precisa rodar como root" >&2
  exit 10
fi

mkdir -p "$BACKUP_ROOT"
chmod 750 "$BACKUP_ROOT" 2>/dev/null || true
if id apache >/dev/null 2>&1; then
  chown apache:apache "$BACKUP_ROOT" 2>/dev/null || true
fi

TS="$(date -u +%Y%m%d-%H%M%S)"
RAND="$(tr -dc 'a-f0-9' </dev/urandom 2>/dev/null | head -c 8 || true)"
if [ -z "$RAND" ]; then
  RAND="$(date +%s)"
fi

OUT="$BACKUP_ROOT/clsconfig-backup-$TS-$RAND.tgz"
TMP="$BACKUP_ROOT/.clsconfig-backup-$TS-$RAND.tmp"
ERR="$BACKUP_ROOT/.clsconfig-backup-$TS-$RAND.err"

INCLUDES=()
for path in \
  "gamedbd/clsconfig" \
  "gamedbd/dbdata/clsconfig"; do
  if [ -e "/home/$path" ]; then
    INCLUDES+=("$path")
  fi
done

if [ "${#INCLUDES[@]}" -eq 0 ]; then
  echo "Nenhum arquivo clsconfig encontrado em /home/gamedbd" >&2
  exit 11
fi

tar -C /home \
  --warning=no-file-changed \
  --ignore-failed-read \
  -czf "$TMP" \
  "${INCLUDES[@]}" 2>"$ERR" || TAR_EXIT=$?

TAR_EXIT="${TAR_EXIT:-0}"
if [ "$TAR_EXIT" -ne 0 ] && [ "$TAR_EXIT" -ne 1 ]; then
  cat "$ERR" >&2 || true
  rm -f "$TMP"
  exit "$TAR_EXIT"
fi

mv -f "$TMP" "$OUT"
chmod 640 "$OUT" 2>/dev/null || true
if id apache >/dev/null 2>&1; then
  chown apache:apache "$OUT" 2>/dev/null || true
fi

BYTES="$(stat -c '%s' "$OUT" 2>/dev/null || wc -c < "$OUT")"
SHA1="$(sha1sum "$OUT" | awk '{print $1}')"

php -r '
$payload = [
    "type" => "clsconfig_archive",
    "file" => $argv[1],
    "name" => basename($argv[1]),
    "bytes" => (int) $argv[2],
    "sha1" => $argv[3],
    "created_at" => gmdate("c"),
    "reason" => $argv[4],
    "includes" => array_slice($argv, 5),
];
echo json_encode($payload, JSON_UNESCAPED_SLASHES) . PHP_EOL;
' "$OUT" "$BYTES" "$SHA1" "$REASON" "${INCLUDES[@]}"

rm -f "$ERR"
EOF

cat > /usr/local/sbin/backupmysql-api.sh <<'EOF'
#!/bin/bash
set -euo pipefail

BACKUP_ROOT="${1:-/var/www/html/apicls/backups/mysql}"
REASON="${2:-manual}"

if [ "$(id -u)" != "0" ]; then
  echo "backupmysql-api.sh precisa rodar como root" >&2
  exit 10
fi

MYSQLDUMP_BIN="$(command -v mysqldump 2>/dev/null || true)"
GZIP_BIN="$(command -v gzip 2>/dev/null || true)"
MYSQL_DEFAULTS_FILE="/root/.my.cnf"

[ -n "$MYSQLDUMP_BIN" ] || { echo "mysqldump nao encontrado" >&2; exit 11; }
[ -n "$GZIP_BIN" ] || { echo "gzip nao encontrado" >&2; exit 12; }

mkdir -p "$BACKUP_ROOT"
chmod 750 "$BACKUP_ROOT" 2>/dev/null || true
if id apache >/dev/null 2>&1; then
  chown apache:apache "$BACKUP_ROOT" 2>/dev/null || true
fi

TS="$(date -u +%Y%m%d-%H%M%S)"
RAND="$(tr -dc 'a-f0-9' </dev/urandom 2>/dev/null | head -c 8 || true)"
if [ -z "$RAND" ]; then
  RAND="$(date +%s)"
fi

OUT="$BACKUP_ROOT/mysql-backup-$TS-$RAND.sql.gz"
TMP="$BACKUP_ROOT/.mysql-backup-$TS-$RAND.tmp"
ERR="$BACKUP_ROOT/.mysql-backup-$TS-$RAND.err"

if [ -f "$MYSQL_DEFAULTS_FILE" ]; then
  "$MYSQLDUMP_BIN" \
    --defaults-extra-file="$MYSQL_DEFAULTS_FILE" \
    --all-databases \
    --events \
    --routines \
    --triggers \
    --single-transaction \
    --quick \
    --lock-tables=false 2>"$ERR" | "$GZIP_BIN" -c > "$TMP" || DUMP_EXIT=$?
else
  "$MYSQLDUMP_BIN" \
    --all-databases \
    --events \
    --routines \
    --triggers \
    --single-transaction \
    --quick \
    --lock-tables=false 2>"$ERR" | "$GZIP_BIN" -c > "$TMP" || DUMP_EXIT=$?
fi

DUMP_EXIT="${DUMP_EXIT:-0}"
if [ "$DUMP_EXIT" -ne 0 ]; then
  ERR_TEXT="$(cat "$ERR" 2>/dev/null || true)"
  if printf '%s' "$ERR_TEXT" | grep -qi 'access denied'; then
    cat >&2 <<'MYSQL_AUTH_HINT'
mysqldump nao autenticou. Configure um arquivo /root/.my.cnf com as credenciais do MariaDB, por exemplo:
[client]
user=root
password=SUA_SENHA
host=localhost
MYSQL_AUTH_HINT
  fi
  printf '%s\n' "$ERR_TEXT" >&2
  rm -f "$TMP"
  exit "$DUMP_EXIT"
fi

mv -f "$TMP" "$OUT"
chmod 640 "$OUT" 2>/dev/null || true
if id apache >/dev/null 2>&1; then
  chown apache:apache "$OUT" 2>/dev/null || true
fi

BYTES="$(stat -c '%s' "$OUT" 2>/dev/null || wc -c < "$OUT")"
SHA1="$(sha1sum "$OUT" | awk '{print $1}')"

php -r '
$payload = [
    "type" => "mysql_backup",
    "file" => $argv[1],
    "name" => basename($argv[1]),
    "bytes" => (int) $argv[2],
    "sha1" => $argv[3],
    "created_at" => gmdate("c"),
    "reason" => $argv[4],
    "source" => "all_databases",
];
echo json_encode($payload, JSON_UNESCAPED_SLASHES) . PHP_EOL;
' "$OUT" "$BYTES" "$SHA1" "$REASON"

rm -f "$ERR"
EOF

cat > /usr/local/sbin/restoremysql-api.sh <<'EOF'
#!/bin/bash
set -euo pipefail

BACKUP_FILE="${1:-}"
MYSQL_DEFAULTS_FILE="/root/.my.cnf"

if [ "$(id -u)" != "0" ]; then
  echo "restoremysql-api.sh precisa rodar como root" >&2
  exit 10
fi

[ -n "$BACKUP_FILE" ] || { echo "Informe o arquivo mysql-backup-*.sql.gz" >&2; exit 11; }
[ -f "$BACKUP_FILE" ] || { echo "Backup MySQL nao encontrado: $BACKUP_FILE" >&2; exit 12; }
[ -r "$BACKUP_FILE" ] || { echo "Backup MySQL sem permissao de leitura: $BACKUP_FILE" >&2; exit 13; }

MYSQL_BIN="$(command -v mysql 2>/dev/null || true)"
GZIP_BIN="$(command -v gzip 2>/dev/null || true)"
[ -n "$MYSQL_BIN" ] || { echo "mysql nao encontrado" >&2; exit 14; }
[ -n "$GZIP_BIN" ] || { echo "gzip nao encontrado" >&2; exit 15; }

"$GZIP_BIN" -t "$BACKUP_FILE" >/dev/null 2>&1 || {
  echo "Arquivo .sql.gz invalido ou corrompido: $BACKUP_FILE" >&2
  exit 16
}

ERR="$(mktemp /tmp/restoremysql-api.XXXXXX.err)"
trap 'rm -f "$ERR"' EXIT

if [ -f "$MYSQL_DEFAULTS_FILE" ]; then
  "$GZIP_BIN" -dc "$BACKUP_FILE" | "$MYSQL_BIN" --defaults-extra-file="$MYSQL_DEFAULTS_FILE" 2>"$ERR" || RESTORE_EXIT=$?
else
  "$GZIP_BIN" -dc "$BACKUP_FILE" | "$MYSQL_BIN" 2>"$ERR" || RESTORE_EXIT=$?
fi

RESTORE_EXIT="${RESTORE_EXIT:-0}"
if [ "$RESTORE_EXIT" -ne 0 ]; then
  ERR_TEXT="$(cat "$ERR" 2>/dev/null || true)"
  if printf '%s' "$ERR_TEXT" | grep -qi 'access denied'; then
    cat >&2 <<'MYSQL_AUTH_HINT'
mysql nao autenticou para o restore. Configure um arquivo /root/.my.cnf com as credenciais do MariaDB, por exemplo:
[client]
user=root
password=SUA_SENHA
host=localhost
MYSQL_AUTH_HINT
  fi
  printf '%s\n' "$ERR_TEXT" >&2
  exit "$RESTORE_EXIT"
fi

BYTES="$(stat -c '%s' "$BACKUP_FILE" 2>/dev/null || wc -c < "$BACKUP_FILE")"
SHA1="$(sha1sum "$BACKUP_FILE" | awk '{print $1}')"
USED_DEFAULTS_FILE=""
if [ -f "$MYSQL_DEFAULTS_FILE" ]; then
  USED_DEFAULTS_FILE="$MYSQL_DEFAULTS_FILE"
fi

php -r '
$payload = [
    "type" => "mysql_backup",
    "restored" => true,
    "backup_file" => $argv[1],
    "name" => basename($argv[1]),
    "bytes" => (int) $argv[2],
    "sha1" => $argv[3],
    "target" => "all_databases",
    "service" => "mysql",
    "used_defaults_file" => $argv[4],
    "applied_at" => gmdate("c"),
];
echo json_encode($payload, JSON_UNESCAPED_SLASHES) . PHP_EOL;
' "$BACKUP_FILE" "$BYTES" "$SHA1" "$USED_DEFAULTS_FILE"
EOF

cat > /usr/local/sbin/grantmallcash-api.sh <<'EOF'
#!/bin/bash
set -euo pipefail

USERID="${1:-}"
CASH_UNITS="${2:-}"
DB_NAME="${3:-pw}"
MYSQL_DEFAULTS_FILE="/root/.my.cnf"

if [ "$(id -u)" != "0" ]; then
  echo "grantmallcash-api.sh precisa rodar como root" >&2
  exit 10
fi

[[ "$USERID" =~ ^[0-9]+$ ]] || { echo "userid invalido" >&2; exit 11; }
[[ "$CASH_UNITS" =~ ^[0-9]+$ ]] || { echo "cash_units invalido" >&2; exit 12; }
[ "$USERID" -gt 0 ] || { echo "userid invalido" >&2; exit 13; }
[ "$CASH_UNITS" -gt 0 ] || { echo "cash_units invalido" >&2; exit 14; }
[ -n "$DB_NAME" ] || { echo "db_name invalido" >&2; exit 15; }

MYSQL_BIN="$(command -v mysql 2>/dev/null || true)"
[ -n "$MYSQL_BIN" ] || { echo "mysql nao encontrado" >&2; exit 16; }

ERR="$(mktemp /tmp/grantmallcash-api.XXXXXX.err)"
trap 'rm -f "$ERR"' EXIT

SQL="SET @error := NULL; CALL usecash($USERID, 1, 0, 1, 0, $CASH_UNITS, 1, @error); SELECT COALESCE(@error, 0) AS error_code;"

if [ -f "$MYSQL_DEFAULTS_FILE" ]; then
  OUTPUT="$("$MYSQL_BIN" --defaults-extra-file="$MYSQL_DEFAULTS_FILE" --database="$DB_NAME" --batch --skip-column-names -e "$SQL" 2>"$ERR")" || MYSQL_EXIT=$?
else
  OUTPUT="$("$MYSQL_BIN" --database="$DB_NAME" --batch --skip-column-names -e "$SQL" 2>"$ERR")" || MYSQL_EXIT=$?
fi

MYSQL_EXIT="${MYSQL_EXIT:-0}"
if [ "$MYSQL_EXIT" -ne 0 ]; then
  ERR_TEXT="$(cat "$ERR" 2>/dev/null || true)"
  if printf '%s' "$ERR_TEXT" | grep -qi 'access denied'; then
    cat >&2 <<'MYSQL_AUTH_HINT'
mysql nao autenticou para grantMallCash. Configure um arquivo /root/.my.cnf com as credenciais do MariaDB, por exemplo:
[client]
user=root
password=SUA_SENHA
host=localhost
MYSQL_AUTH_HINT
  fi
  printf '%s\n' "$ERR_TEXT" >&2
  exit "$MYSQL_EXIT"
fi

ERROR_CODE="$(printf '%s\n' "$OUTPUT" | awk 'NF { last=$0 } END { print last }')"
[[ "$ERROR_CODE" =~ ^-?[0-9]+$ ]] || { echo "Saida inesperada do usecash: $OUTPUT" >&2; exit 17; }

php -r '
$payload = [
    "success" => ((int) $argv[4] === 0),
    "userid" => (int) $argv[1],
    "cash_units" => (int) $argv[2],
    "db_name" => $argv[3],
    "error_code" => (int) $argv[4],
    "applied_at" => gmdate("c"),
];
echo json_encode($payload, JSON_UNESCAPED_SLASHES) . PHP_EOL;
' "$USERID" "$CASH_UNITS" "$DB_NAME" "$ERROR_CODE"
EOF

cat > /usr/local/sbin/gmpermission-api.sh <<'EOF'
#!/bin/bash
set -euo pipefail

ACTION="${1:-inspect}"
USERID="${2:-}"
ZONEID="${3:-1}"
DB_NAME="${4:-pw}"
AUTH_TABLE="${5:-auth}"
USERID_FIELD="${6:-userid}"
ZONEID_FIELD="${7:-zoneid}"
RID_FIELD="${8:-rid}"
RULE_IDS_CSV="${9:-}"
TEMPLATE_MIN_RULES="${10:-30}"
MYSQL_DEFAULTS_FILE="/root/.my.cnf"

if [ "$(id -u)" != "0" ]; then
  echo "gmpermission-api.sh precisa rodar como root" >&2
  exit 10
fi

case "$ACTION" in
  inspect|grant|revoke) ;;
  *)
    echo "Acao invalida: $ACTION" >&2
    exit 11
    ;;
esac

[[ "$USERID" =~ ^[0-9]+$ ]] || { echo "userid invalido" >&2; exit 12; }
[[ "$ZONEID" =~ ^[0-9]+$ ]] || { echo "zoneid invalido" >&2; exit 13; }
[[ "$TEMPLATE_MIN_RULES" =~ ^[0-9]+$ ]] || { echo "template_min_rules invalido" >&2; exit 14; }
[ "$USERID" -gt 0 ] || { echo "userid invalido" >&2; exit 15; }
[ "$ZONEID" -gt 0 ] || { echo "zoneid invalido" >&2; exit 16; }
[ "$TEMPLATE_MIN_RULES" -gt 0 ] || { echo "template_min_rules invalido" >&2; exit 17; }
[ -n "$DB_NAME" ] || { echo "db_name invalido" >&2; exit 18; }

for IDENT in "$AUTH_TABLE" "$USERID_FIELD" "$ZONEID_FIELD" "$RID_FIELD"; do
  [[ "$IDENT" =~ ^[A-Za-z_][A-Za-z0-9_]*$ ]] || { echo "Identificador SQL invalido: $IDENT" >&2; exit 19; }
done

MYSQL_BIN="$(command -v mysql 2>/dev/null || true)"
[ -n "$MYSQL_BIN" ] || { echo "mysql nao encontrado" >&2; exit 20; }

ERR="$(mktemp /tmp/gmpermission-api.XXXXXX.err)"
trap 'rm -f "$ERR"' EXIT

mysql_exec() {
  local sql="$1"
  local output=""
  local mysql_exit=0
  if [ -f "$MYSQL_DEFAULTS_FILE" ]; then
    output="$("$MYSQL_BIN" --defaults-extra-file="$MYSQL_DEFAULTS_FILE" --database="$DB_NAME" --batch --skip-column-names -e "$sql" 2>"$ERR")" || mysql_exit=$?
  else
    output="$("$MYSQL_BIN" --database="$DB_NAME" --batch --skip-column-names -e "$sql" 2>"$ERR")" || mysql_exit=$?
  fi

  mysql_exit="${mysql_exit:-0}"
  if [ "$mysql_exit" -ne 0 ]; then
    ERR_TEXT="$(cat "$ERR" 2>/dev/null || true)"
    if printf '%s' "$ERR_TEXT" | grep -qi 'access denied'; then
      cat >&2 <<'MYSQL_AUTH_HINT'
mysql nao autenticou para gmpermission. Configure um arquivo /root/.my.cnf com as credenciais do MariaDB, por exemplo:
[client]
user=root
password=SUA_SENHA
host=localhost
MYSQL_AUTH_HINT
    fi
    printf '%s\n' "$ERR_TEXT" >&2
    exit "$mysql_exit"
  fi

  printf '%s' "$output"
}

normalize_list() {
  local input="$1"
  if [ -z "$input" ]; then
    return 0
  fi
  printf '%s\n' "$input" | sed '/^[[:space:]]*$/d' | sort -n -u
}

list_to_csv() {
  local input="$1"
  if [ -z "$input" ]; then
    return 0
  fi
  printf '%s\n' "$input" | sed '/^[[:space:]]*$/d' | paste -sd, -
}

parse_rule_ids() {
  local input="$1"
  if [ -z "$input" ]; then
    return 0
  fi
  printf '%s' "$input" \
    | tr ',;:|' '\n' \
    | sed 's/^[[:space:]]*//;s/[[:space:]]*$//' \
    | awk 'NF && $1 ~ /^[0-9]+$/ && $1 >= 0 { print $1 }' \
    | sort -n -u
}

load_rules_for_user() {
  local target_userid="$1"
  mysql_exec "SELECT \`$RID_FIELD\` FROM \`$AUTH_TABLE\` WHERE \`$USERID_FIELD\`=$target_userid AND \`$ZONEID_FIELD\`=$ZONEID ORDER BY \`$RID_FIELD\`;" \
    | awk 'NF && $1 ~ /^[0-9]+$/ && $1 >= 0 { print $1 }' \
    | sort -n -u
}

CURRENT_RULES_LIST="$(load_rules_for_user "$USERID")"
CURRENT_RULES_CSV="$(list_to_csv "$CURRENT_RULES_LIST")"

TEMPLATE_SOURCE="configured"
TEMPLATE_USERID="0"
TEMPLATE_RULES_LIST="$(parse_rule_ids "$RULE_IDS_CSV")"

if [ -z "$TEMPLATE_RULES_LIST" ]; then
  TEMPLATE_SOURCE="none"
  CANDIDATE_USERID="$(mysql_exec "SELECT \`$USERID_FIELD\`, COUNT(*) AS cnt FROM \`$AUTH_TABLE\` WHERE \`$ZONEID_FIELD\`=$ZONEID GROUP BY \`$USERID_FIELD\` HAVING COUNT(*) >= $TEMPLATE_MIN_RULES ORDER BY cnt DESC, \`$USERID_FIELD\` ASC LIMIT 1;" | awk 'NF { print $1; exit }')"
  if [ -n "$CANDIDATE_USERID" ] && [[ "$CANDIDATE_USERID" =~ ^[0-9]+$ ]] && [ "$CANDIDATE_USERID" -gt 0 ]; then
    TEMPLATE_SOURCE="auth_table_sample"
    TEMPLATE_USERID="$CANDIDATE_USERID"
    TEMPLATE_RULES_LIST="$(load_rules_for_user "$CANDIDATE_USERID")"
  elif [ -n "$CURRENT_RULES_LIST" ]; then
    TEMPLATE_SOURCE="current_user"
    TEMPLATE_USERID="$USERID"
    TEMPLATE_RULES_LIST="$CURRENT_RULES_LIST"
  fi
fi

TEMPLATE_RULES_CSV="$(list_to_csv "$TEMPLATE_RULES_LIST")"
MISSING_RULES_LIST="$(comm -23 <(normalize_list "$TEMPLATE_RULES_LIST") <(normalize_list "$CURRENT_RULES_LIST") || true)"
MATCHING_RULES_LIST="$(comm -12 <(normalize_list "$TEMPLATE_RULES_LIST") <(normalize_list "$CURRENT_RULES_LIST") || true)"
MISSING_RULES_CSV="$(list_to_csv "$MISSING_RULES_LIST")"
MATCHING_RULES_CSV="$(list_to_csv "$MATCHING_RULES_LIST")"

INSERTED_RULES_LIST=""
DELETED_RULES_LIST=""

if [ "$ACTION" = "grant" ]; then
  [ -n "$TEMPLATE_RULES_LIST" ] || { echo "Nenhum template de permissao GM disponivel para grant" >&2; exit 21; }
  if [ -n "$MISSING_RULES_LIST" ]; then
    VALUES_SQL=""
    while IFS= read -r RID; do
      [ -n "$RID" ] || continue
      VALUES_SQL="${VALUES_SQL}($USERID,$ZONEID,$RID),"
    done <<< "$MISSING_RULES_LIST"
    VALUES_SQL="${VALUES_SQL%,}"
    [ -n "$VALUES_SQL" ] || { echo "Nenhum rid faltante para grant" >&2; exit 22; }
    mysql_exec "INSERT INTO \`$AUTH_TABLE\` (\`$USERID_FIELD\`, \`$ZONEID_FIELD\`, \`$RID_FIELD\`) VALUES $VALUES_SQL;" >/dev/null
    INSERTED_RULES_LIST="$MISSING_RULES_LIST"
  fi
elif [ "$ACTION" = "revoke" ]; then
  [ -n "$TEMPLATE_RULES_LIST" ] || { echo "Nenhum template de permissao GM disponivel para revoke" >&2; exit 23; }
  if [ -n "$MATCHING_RULES_LIST" ]; then
    RID_IN="$(list_to_csv "$MATCHING_RULES_LIST")"
    mysql_exec "DELETE FROM \`$AUTH_TABLE\` WHERE \`$USERID_FIELD\`=$USERID AND \`$ZONEID_FIELD\`=$ZONEID AND \`$RID_FIELD\` IN ($RID_IN);" >/dev/null
    DELETED_RULES_LIST="$MATCHING_RULES_LIST"
  fi
fi

AFTER_RULES_LIST="$(load_rules_for_user "$USERID")"
AFTER_RULES_CSV="$(list_to_csv "$AFTER_RULES_LIST")"
INSERTED_RULES_CSV="$(list_to_csv "$INSERTED_RULES_LIST")"
DELETED_RULES_CSV="$(list_to_csv "$DELETED_RULES_LIST")"

php -r '
function ints($csv) {
    $csv = trim((string) $csv);
    if ($csv === "") {
        return [];
    }
    $items = preg_split("/[\s,;:|]+/", $csv, -1, PREG_SPLIT_NO_EMPTY);
    $out = [];
    foreach ((array) $items as $item) {
        if (!is_numeric($item)) {
            continue;
        }
        $value = (int) $item;
        if ($value >= 0) {
            $out[] = $value;
        }
    }
    $out = array_values(array_unique($out));
    sort($out, SORT_NUMERIC);
    return $out;
}
$current = ints($argv[7]);
$template = ints($argv[8]);
$missing = ints($argv[9]);
$matching = ints($argv[10]);
$inserted = ints($argv[11]);
$deleted = ints($argv[12]);
$after = ints($argv[13]);
$payload = [
    "success" => true,
    "action" => $argv[1],
    "userid" => (int) $argv[2],
    "zoneid" => (int) $argv[3],
    "db_name" => $argv[4],
    "auth_table" => $argv[5],
    "template_source" => $argv[6],
    "template_userid" => (int) $argv[14],
    "current_rule_ids" => $current,
    "current_rule_count" => count($current),
    "template_rule_ids" => $template,
    "template_rule_count" => count($template),
    "missing_rule_ids" => $missing,
    "missing_rule_count" => count($missing),
    "matching_rule_ids" => $matching,
    "matching_rule_count" => count($matching),
    "inserted_rule_ids" => $inserted,
    "inserted_rule_count" => count($inserted),
    "deleted_rule_ids" => $deleted,
    "deleted_rule_count" => count($deleted),
    "after_rule_ids" => $after,
    "after_rule_count" => count($after),
    "applied_at" => gmdate("c"),
];
echo json_encode($payload, JSON_UNESCAPED_SLASHES) . PHP_EOL;
' "$ACTION" "$USERID" "$ZONEID" "$DB_NAME" "$AUTH_TABLE" "$TEMPLATE_SOURCE" "$CURRENT_RULES_CSV" "$TEMPLATE_RULES_CSV" "$MISSING_RULES_CSV" "$MATCHING_RULES_CSV" "$INSERTED_RULES_CSV" "$DELETED_RULES_CSV" "$AFTER_RULES_CSV" "$TEMPLATE_USERID"
EOF

cat > /usr/local/sbin/accountforbid-api.sh <<'EOF'
#!/bin/bash
set -euo pipefail

ACTION="${1:-inspect}"
USERID="${2:-}"
SECONDS="${3:-0}"
DB_NAME="${4:-pw}"
FORBID_TABLE="${5:-forbid}"
USERID_FIELD="${6:-userid}"
TYPE_FIELD="${7:-type}"
CTIME_FIELD="${8:-ctime}"
FORBID_TIME_FIELD="${9:-forbid_time}"
REASON_FIELD="${10:-reason}"
GMROLEID_FIELD="${11:-gmroleid}"
REASON_B64="${12:-}"
GMROLEID="${13:-0}"
TYPE_IDS_CSV="${14:-}"
MYSQL_DEFAULTS_FILE="/root/.my.cnf"

if [ "$(id -u)" != "0" ]; then
  echo "accountforbid-api.sh precisa rodar como root" >&2
  exit 10
fi

case "$ACTION" in
  inspect|ban|unban) ;;
  *)
    echo "Acao invalida: $ACTION" >&2
    exit 11
    ;;
esac

[[ "$USERID" =~ ^[0-9]+$ ]] || { echo "userid invalido" >&2; exit 12; }
[[ "$SECONDS" =~ ^[0-9]+$ ]] || { echo "seconds invalido" >&2; exit 13; }
[[ "$GMROLEID" =~ ^[0-9]+$ ]] || { echo "gmroleid invalido" >&2; exit 14; }
[ "$USERID" -gt 0 ] || { echo "userid invalido" >&2; exit 15; }
[ "$SECONDS" -ge 0 ] || { echo "seconds invalido" >&2; exit 16; }
[ -n "$DB_NAME" ] || { echo "db_name invalido" >&2; exit 17; }

for IDENT in "$FORBID_TABLE" "$USERID_FIELD" "$TYPE_FIELD" "$CTIME_FIELD" "$FORBID_TIME_FIELD" "$REASON_FIELD" "$GMROLEID_FIELD"; do
  [[ "$IDENT" =~ ^[A-Za-z_][A-Za-z0-9_]*$ ]] || { echo "Identificador SQL invalido: $IDENT" >&2; exit 18; }
done

MYSQL_BIN="$(command -v mysql 2>/dev/null || true)"
[ -n "$MYSQL_BIN" ] || { echo "mysql nao encontrado" >&2; exit 19; }

ERR="$(mktemp /tmp/accountforbid-api.XXXXXX.err)"
trap 'rm -f "$ERR"' EXIT

mysql_exec() {
  local sql="$1"
  local output=""
  local mysql_exit=0
  if [ -f "$MYSQL_DEFAULTS_FILE" ]; then
    output="$("$MYSQL_BIN" --defaults-extra-file="$MYSQL_DEFAULTS_FILE" --database="$DB_NAME" --batch --skip-column-names -e "$sql" 2>"$ERR")" || mysql_exit=$?
  else
    output="$("$MYSQL_BIN" --database="$DB_NAME" --batch --skip-column-names -e "$sql" 2>"$ERR")" || mysql_exit=$?
  fi

  mysql_exit="${mysql_exit:-0}"
  if [ "$mysql_exit" -ne 0 ]; then
    ERR_TEXT="$(cat "$ERR" 2>/dev/null || true)"
    if printf '%s' "$ERR_TEXT" | grep -qi 'access denied'; then
      cat >&2 <<'MYSQL_AUTH_HINT'
mysql nao autenticou para accountforbid. Configure um arquivo /root/.my.cnf com as credenciais do MariaDB, por exemplo:
[client]
user=root
password=SUA_SENHA
host=localhost
MYSQL_AUTH_HINT
    fi
    printf '%s\n' "$ERR_TEXT" >&2
    exit "$mysql_exit"
  fi

  printf '%s' "$output"
}

normalize_list() {
  local input="$1"
  if [ -z "$input" ]; then
    return 0
  fi
  printf '%s\n' "$input" | sed '/^[[:space:]]*$/d' | sort -n -u
}

list_to_csv() {
  local input="$1"
  if [ -z "$input" ]; then
    return 0
  fi
  printf '%s\n' "$input" | sed '/^[[:space:]]*$/d' | paste -sd, -
}

parse_type_ids() {
  local input="$1"
  if [ -z "$input" ]; then
    return 0
  fi
  printf '%s' "$input" \
    | tr ',;:|' '\n' \
    | sed 's/^[[:space:]]*//;s/[[:space:]]*$//' \
    | awk 'NF && $1 ~ /^[0-9]+$/ && $1 >= 0 { print $1 }' \
    | sort -n -u
}

decode_reason() {
  local input="$1"
  if [ -z "$input" ]; then
    return 0
  fi
  if command -v base64 >/dev/null 2>&1; then
    printf '%s' "$input" | base64 --decode 2>/dev/null || printf '%s' "$input" | base64 -d 2>/dev/null || true
  else
    printf '%s' "$input"
  fi
}

sql_escape() {
  printf '%s' "$1" | sed "s/\\\\/\\\\\\\\/g; s/'/''/g"
}

load_types_for_user() {
  mysql_exec "SELECT \`$TYPE_FIELD\` FROM \`$FORBID_TABLE\` WHERE \`$USERID_FIELD\`=$USERID ORDER BY \`$TYPE_FIELD\`;" \
    | awk 'NF && $1 ~ /^[0-9]+$/ && $1 >= 0 { print $1 }' \
    | sort -n -u
}

CURRENT_TYPES_LIST="$(load_types_for_user)"
CURRENT_TYPES_CSV="$(list_to_csv "$CURRENT_TYPES_LIST")"
REQUESTED_TYPES_LIST="$(parse_type_ids "$TYPE_IDS_CSV")"
REQUESTED_TYPES_CSV="$(list_to_csv "$REQUESTED_TYPES_LIST")"
NOW_TS="$(date +%s)"
MAX_FORBID_TS=2147483647

TARGET_TYPES_LIST="$REQUESTED_TYPES_LIST"
if [ "$ACTION" = "ban" ] && [ -z "$TARGET_TYPES_LIST" ]; then
  if [ -n "$CURRENT_TYPES_LIST" ]; then
    TARGET_TYPES_LIST="$CURRENT_TYPES_LIST"
  else
    TARGET_TYPES_LIST="0"
  fi
fi
if [ "$ACTION" = "unban" ] && [ -z "$TARGET_TYPES_LIST" ]; then
  TARGET_TYPES_LIST="$CURRENT_TYPES_LIST"
fi

TARGET_TYPES_CSV="$(list_to_csv "$TARGET_TYPES_LIST")"
INSERTED_TYPES_LIST=""
UPDATED_TYPES_LIST=""
DELETED_TYPES_LIST=""
REASON_TEXT="$(decode_reason "$REASON_B64")"
REASON_SQL="'$(sql_escape "$REASON_TEXT")'"
FORBID_UNTIL_TS=0

if [ "$ACTION" = "ban" ]; then
  if [ "$SECONDS" -ge "$MAX_FORBID_TS" ]; then
    FORBID_UNTIL_TS="$MAX_FORBID_TS"
  else
    FORBID_UNTIL_TS=$((NOW_TS + SECONDS))
    if [ "$FORBID_UNTIL_TS" -gt "$MAX_FORBID_TS" ]; then
      FORBID_UNTIL_TS="$MAX_FORBID_TS"
    fi
  fi
fi

if [ "$ACTION" = "ban" ] && [ -n "$TARGET_TYPES_LIST" ]; then
  while IFS= read -r TYPE_ID; do
    [ -n "$TYPE_ID" ] || continue
    if printf '%s\n' "$CURRENT_TYPES_LIST" | grep -qx "$TYPE_ID"; then
      mysql_exec "UPDATE \`$FORBID_TABLE\` SET \`$CTIME_FIELD\`=NOW(), \`$FORBID_TIME_FIELD\`=$FORBID_UNTIL_TS, \`$REASON_FIELD\`=$REASON_SQL, \`$GMROLEID_FIELD\`=$GMROLEID WHERE \`$USERID_FIELD\`=$USERID AND \`$TYPE_FIELD\`=$TYPE_ID;" >/dev/null
      UPDATED_TYPES_LIST="${UPDATED_TYPES_LIST}${TYPE_ID}"$'\n'
    else
      mysql_exec "INSERT INTO \`$FORBID_TABLE\` (\`$USERID_FIELD\`, \`$TYPE_FIELD\`, \`$CTIME_FIELD\`, \`$FORBID_TIME_FIELD\`, \`$REASON_FIELD\`, \`$GMROLEID_FIELD\`) VALUES ($USERID, $TYPE_ID, NOW(), $FORBID_UNTIL_TS, $REASON_SQL, $GMROLEID);" >/dev/null
      INSERTED_TYPES_LIST="${INSERTED_TYPES_LIST}${TYPE_ID}"$'\n'
    fi
  done <<< "$TARGET_TYPES_LIST"
elif [ "$ACTION" = "unban" ] && [ -n "$TARGET_TYPES_LIST" ]; then
  TYPE_IN="$(list_to_csv "$TARGET_TYPES_LIST")"
  mysql_exec "DELETE FROM \`$FORBID_TABLE\` WHERE \`$USERID_FIELD\`=$USERID AND \`$TYPE_FIELD\` IN ($TYPE_IN);" >/dev/null
  DELETED_TYPES_LIST="$TARGET_TYPES_LIST"
fi

AFTER_TYPES_LIST="$(load_types_for_user)"
AFTER_TYPES_CSV="$(list_to_csv "$AFTER_TYPES_LIST")"
INSERTED_TYPES_CSV="$(list_to_csv "$INSERTED_TYPES_LIST")"
UPDATED_TYPES_CSV="$(list_to_csv "$UPDATED_TYPES_LIST")"
DELETED_TYPES_CSV="$(list_to_csv "$DELETED_TYPES_LIST")"

php -r '
function ints($csv) {
    $csv = trim((string) $csv);
    if ($csv === "") {
        return [];
    }
    $items = preg_split("/[\s,;:|]+/", $csv, -1, PREG_SPLIT_NO_EMPTY);
    $out = [];
    foreach ((array) $items as $item) {
        if (!is_numeric($item)) {
            continue;
        }
        $value = (int) $item;
        if ($value >= 0) {
            $out[] = $value;
        }
    }
    $out = array_values(array_unique($out));
    sort($out, SORT_NUMERIC);
    return $out;
}
$action = $argv[1];
$current = ints($argv[8]);
$requested = ints($argv[9]);
$target = ints($argv[10]);
$inserted = ints($argv[11]);
$updated = ints($argv[12]);
$deleted = ints($argv[13]);
$after = ints($argv[14]);
$success = true;
$error = "";
if ($action === "ban") {
    $missing = array_values(array_diff($target, $after));
    if (!empty($missing)) {
        $success = false;
        $error = "Tipos de ban nao refletiram apos aplicacao: " . implode(",", $missing);
    }
} elseif ($action === "unban") {
    $remaining = array_values(array_intersect($target, $after));
    if (!empty($remaining)) {
        $success = false;
        $error = "Tipos de ban ainda presentes apos liberacao: " . implode(",", $remaining);
    }
}
$payload = [
    "success" => $success,
    "action" => $action,
    "userid" => (int) $argv[2],
    "seconds" => (int) $argv[3],
    "db_name" => $argv[4],
    "forbid_table" => $argv[5],
    "reason" => $argv[6],
    "gmroleid" => (int) $argv[7],
    "created_at_unix" => (int) $argv[15],
    "forbid_until_unix" => (int) $argv[16],
    "requested_duration_seconds" => (int) $argv[17],
    "before_type_ids" => $current,
    "before_row_count" => count($current),
    "requested_type_ids" => $requested,
    "applied_type_ids" => $target,
    "after_type_ids" => $after,
    "after_row_count" => count($after),
    "inserted_type_ids" => $inserted,
    "inserted_type_count" => count($inserted),
    "updated_type_ids" => $updated,
    "updated_type_count" => count($updated),
    "deleted_type_ids" => $deleted,
    "deleted_type_count" => count($deleted),
    "applied_at" => gmdate("c"),
];
if ($payload["created_at_unix"] > 0) {
    $payload["created_at"] = gmdate("c", $payload["created_at_unix"]);
}
if ($payload["forbid_until_unix"] > 0) {
    $payload["forbid_until"] = gmdate("c", $payload["forbid_until_unix"]);
}
if ($error !== "") {
    $payload["error"] = $error;
}
echo json_encode($payload, JSON_UNESCAPED_SLASHES) . PHP_EOL;
' "$ACTION" "$USERID" "$SECONDS" "$DB_NAME" "$FORBID_TABLE" "$REASON_TEXT" "$GMROLEID" "$CURRENT_TYPES_CSV" "$REQUESTED_TYPES_CSV" "$TARGET_TYPES_CSV" "$INSERTED_TYPES_CSV" "$UPDATED_TYPES_CSV" "$DELETED_TYPES_CSV" "$AFTER_TYPES_CSV" "$NOW_TS" "$FORBID_UNTIL_TS" "$SECONDS"
EOF

cat > /usr/local/sbin/backupuniquenamed-api.sh <<'EOF'
#!/bin/bash
set -euo pipefail

BACKUP_ROOT="${1:-/var/www/html/apicls/backups/uniquenamed}"
REASON="${2:-manual}"

if [ "$(id -u)" != "0" ]; then
  echo "backupuniquenamed-api.sh precisa rodar como root" >&2
  exit 10
fi

mkdir -p "$BACKUP_ROOT"
chmod 750 "$BACKUP_ROOT" 2>/dev/null || true
if id apache >/dev/null 2>&1; then
  chown apache:apache "$BACKUP_ROOT" 2>/dev/null || true
fi

TS="$(date -u +%Y%m%d-%H%M%S)"
RAND="$(tr -dc 'a-f0-9' </dev/urandom 2>/dev/null | head -c 8 || true)"
if [ -z "$RAND" ]; then
  RAND="$(date +%s)"
fi

OUT="$BACKUP_ROOT/uniquenamed-backup-$TS-$RAND.tgz"
TMP="$BACKUP_ROOT/.uniquenamed-backup-$TS-$RAND.tmp"
ERR="$BACKUP_ROOT/.uniquenamed-backup-$TS-$RAND.err"

INCLUDES=()
for path in \
  "uniquenamed/gamesys.conf" \
  "uniquenamed/uname" \
  "uniquenamed/dbdata" \
  "uniquenamed/dblogs" \
  "uniquenamed/backup"; do
  if [ -e "/home/$path" ]; then
    INCLUDES+=("$path")
  fi
done

if [ "${#INCLUDES[@]}" -eq 0 ]; then
  echo "Nenhum arquivo uniquenamed encontrado em /home/uniquenamed" >&2
  exit 11
fi

tar -C /home \
  --warning=no-file-changed \
  --ignore-failed-read \
  -czf "$TMP" \
  "${INCLUDES[@]}" 2>"$ERR" || TAR_EXIT=$?

TAR_EXIT="${TAR_EXIT:-0}"
if [ "$TAR_EXIT" -ne 0 ] && [ "$TAR_EXIT" -ne 1 ]; then
  cat "$ERR" >&2 || true
  rm -f "$TMP"
  exit "$TAR_EXIT"
fi

mv -f "$TMP" "$OUT"
chmod 640 "$OUT" 2>/dev/null || true
if id apache >/dev/null 2>&1; then
  chown apache:apache "$OUT" 2>/dev/null || true
fi

BYTES="$(stat -c '%s' "$OUT" 2>/dev/null || wc -c < "$OUT")"
SHA1="$(sha1sum "$OUT" | awk '{print $1}')"

php -r '
$payload = [
    "type" => "uniquenamed_backup",
    "file" => $argv[1],
    "name" => basename($argv[1]),
    "bytes" => (int) $argv[2],
    "sha1" => $argv[3],
    "created_at" => gmdate("c"),
    "reason" => $argv[4],
    "includes" => array_slice($argv, 5),
];
echo json_encode($payload, JSON_UNESCAPED_SLASHES) . PHP_EOL;
' "$OUT" "$BYTES" "$SHA1" "$REASON" "${INCLUDES[@]}"

rm -f "$ERR"
EOF

cat > /usr/local/sbin/backuppanel-api.sh <<'EOF'
#!/bin/bash
set -euo pipefail

BACKUP_ROOT="${1:-/var/www/html/apicls/backups/panel}"
REASON="${2:-manual}"
PANEL_DIR="/var/www/html/apicls"

if [ "$(id -u)" != "0" ]; then
  echo "backuppanel-api.sh precisa rodar como root" >&2
  exit 10
fi

if [ ! -d "$PANEL_DIR" ]; then
  echo "Diretorio do painel nao encontrado: $PANEL_DIR" >&2
  exit 11
fi

mkdir -p "$BACKUP_ROOT"
chmod 750 "$BACKUP_ROOT" 2>/dev/null || true
if id apache >/dev/null 2>&1; then
  chown apache:apache "$BACKUP_ROOT" 2>/dev/null || true
fi

TS="$(date -u +%Y%m%d-%H%M%S)"
RAND="$(tr -dc 'a-f0-9' </dev/urandom 2>/dev/null | head -c 8 || true)"
if [ -z "$RAND" ]; then
  RAND="$(date +%s)"
fi

OUT="$BACKUP_ROOT/panel-backup-$TS-$RAND.tgz"
TMP="$BACKUP_ROOT/.panel-backup-$TS-$RAND.tmp"
ERR="$BACKUP_ROOT/.panel-backup-$TS-$RAND.err"

tar -C /var/www/html \
  --warning=no-file-changed \
  --ignore-failed-read \
  -czf "$TMP" \
  "apicls" 2>"$ERR" || TAR_EXIT=$?

TAR_EXIT="${TAR_EXIT:-0}"
if [ "$TAR_EXIT" -ne 0 ] && [ "$TAR_EXIT" -ne 1 ]; then
  cat "$ERR" >&2 || true
  rm -f "$TMP"
  exit "$TAR_EXIT"
fi

mv -f "$TMP" "$OUT"
chmod 640 "$OUT" 2>/dev/null || true
if id apache >/dev/null 2>&1; then
  chown apache:apache "$OUT" 2>/dev/null || true
fi

BYTES="$(stat -c '%s' "$OUT" 2>/dev/null || wc -c < "$OUT")"
SHA1="$(sha1sum "$OUT" | awk '{print $1}')"

php -r '
$payload = [
    "type" => "panel_backup",
    "file" => $argv[1],
    "name" => basename($argv[1]),
    "bytes" => (int) $argv[2],
    "sha1" => $argv[3],
    "created_at" => gmdate("c"),
    "reason" => $argv[4],
    "source" => "/var/www/html/apicls",
];
echo json_encode($payload, JSON_UNESCAPED_SLASHES) . PHP_EOL;
' "$OUT" "$BYTES" "$SHA1" "$REASON"

rm -f "$ERR"
EOF

cat > /usr/local/sbin/backupfull-api.sh <<'EOF'
#!/bin/bash
set -euo pipefail

BACKUP_ROOT="${1:-/var/www/html/apicls/backups/full}"
REASON="${2:-manual}"

if [ "$(id -u)" != "0" ]; then
  echo "backupfull-api.sh precisa rodar como root" >&2
  exit 10
fi

mkdir -p "$BACKUP_ROOT"
chmod 750 "$BACKUP_ROOT" 2>/dev/null || true
if id apache >/dev/null 2>&1; then
  chown apache:apache "$BACKUP_ROOT" 2>/dev/null || true
fi

TS="$(date -u +%Y%m%d-%H%M%S)"
RAND="$(tr -dc 'a-f0-9' </dev/urandom 2>/dev/null | head -c 8 || true)"
if [ -z "$RAND" ]; then
  RAND="$(date +%s)"
fi

OUT="$BACKUP_ROOT/full-backup-$TS-$RAND.tgz"
TMP="$BACKUP_ROOT/.full-backup-$TS-$RAND.tmp"
ERR="$BACKUP_ROOT/.full-backup-$TS-$RAND.err"
WORKDIR="$BACKUP_ROOT/.full-backup-$TS-$RAND.work"
PARTS_DIR="$WORKDIR/parts"

rm -rf "$WORKDIR"
mkdir -p "$PARTS_DIR"

run_part() {
  local name="$1"
  local script="$2"
  local target="$PARTS_DIR/$name"
  local output_file="$WORKDIR/$name.json"
  mkdir -p "$target"
  local json=""
  if ! json="$("$script" "$target" "$REASON")"; then
    printf 'Falha no componente %s:\n%s\n' "$name" "$json" >&2
    rm -rf "$WORKDIR"
    exit 20
  fi
  printf '%s\n' "$json" > "$output_file"
}

run_part "gamedbd" "/usr/local/sbin/backupgamedbd-api.sh"
run_part "mysql" "/usr/local/sbin/backupmysql-api.sh"
run_part "uniquenamed" "/usr/local/sbin/backupuniquenamed-api.sh"
run_part "clsconfig" "/usr/local/sbin/backupclsconfig-api.sh"
run_part "panel" "/usr/local/sbin/backuppanel-api.sh"

php -r '
$files = array_slice($argv, 1);
$manifest = [
    "type" => "full_backup_manifest",
    "created_at" => gmdate("c"),
    "components" => [],
];
foreach ($files as $file) {
    $json = @file_get_contents($file);
    $decoded = json_decode((string) $json, true);
    if (is_array($decoded)) {
        $manifest["components"][] = $decoded;
    }
}
echo json_encode($manifest, JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT);
' "$WORKDIR/gamedbd.json" "$WORKDIR/mysql.json" "$WORKDIR/uniquenamed.json" "$WORKDIR/clsconfig.json" "$WORKDIR/panel.json" > "$WORKDIR/manifest.json"

tar -C "$WORKDIR" \
  --warning=no-file-changed \
  --ignore-failed-read \
  -czf "$TMP" \
  "manifest.json" "parts" 2>"$ERR" || TAR_EXIT=$?

TAR_EXIT="${TAR_EXIT:-0}"
if [ "$TAR_EXIT" -ne 0 ] && [ "$TAR_EXIT" -ne 1 ]; then
  cat "$ERR" >&2 || true
  rm -f "$TMP"
  rm -rf "$WORKDIR"
  exit "$TAR_EXIT"
fi

mv -f "$TMP" "$OUT"
chmod 640 "$OUT" 2>/dev/null || true
if id apache >/dev/null 2>&1; then
  chown apache:apache "$OUT" 2>/dev/null || true
fi

BYTES="$(stat -c '%s' "$OUT" 2>/dev/null || wc -c < "$OUT")"
SHA1="$(sha1sum "$OUT" | awk '{print $1}')"

php -r '
$payload = [
    "type" => "full_backup",
    "file" => $argv[1],
    "name" => basename($argv[1]),
    "bytes" => (int) $argv[2],
    "sha1" => $argv[3],
    "created_at" => gmdate("c"),
    "reason" => $argv[4],
    "components" => ["gamedbd", "mysql", "uniquenamed", "clsconfig", "panel"],
];
echo json_encode($payload, JSON_UNESCAPED_SLASHES) . PHP_EOL;
' "$OUT" "$BYTES" "$SHA1" "$REASON"

rm -f "$ERR"
rm -rf "$WORKDIR"
EOF

cat > /usr/local/sbin/pw-watchdog-runner.sh <<'EOF'
#!/bin/bash
set -euo pipefail

API_FILE="${1:-/var/www/html/apicls/api_cls.php}"

PHP_BIN="$(command -v php 2>/dev/null || true)"
[ -n "$PHP_BIN" ] || { echo "php nao encontrado" >&2; exit 10; }
[ -f "$API_FILE" ] || { echo "api_cls.php nao encontrado: $API_FILE" >&2; exit 11; }

"$PHP_BIN" "$API_FILE" watchdog-runner
EOF

cat > /usr/local/bin/pw_send_mail.php <<'PHPMAIL_EOF'
#!/usr/bin/php
<?php
declare(strict_types=1);

function emit($payload, $exitCode = 0)
{
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) . PHP_EOL;
    exit((int) $exitCode);
}

function cuint($value)
{
    $value = (int) $value;
    if ($value < 0x40) {
        return pack('C', $value);
    }
    if ($value < 0x4000) {
        return pack('n', $value | 0x8000);
    }
    if ($value < 0x20000000) {
        return pack('N', $value | 0xC0000000);
    }
    return pack('C', 0xE0) . pack('N', $value);
}

function packString($str)
{
    $utf16 = @iconv('UTF-8', 'UTF-16LE//IGNORE', (string) $str);
    if ($utf16 === false) {
        $utf16 = (string) $str;
    }
    return cuint(strlen($utf16)) . $utf16;
}

function packOctet($hexData)
{
    $hexData = preg_replace('/[^0-9a-fA-F]/', '', (string) $hexData);
    if ($hexData === '') {
        return cuint(0);
    }
    return cuint(strlen($hexData) / 2) . pack('H*', $hexData);
}

function createHeader($opcode, $data)
{
    return cuint((int) $opcode) . cuint(strlen($data)) . $data;
}

function packGRoleInventory(array $payload)
{
    $pack  = pack('N', (int) ($payload['item_id'] ?? 0));
    $pack .= pack('N', 0);
    $pack .= pack('N', (int) ($payload['count'] ?? 0));
    $pack .= pack('N', (int) ($payload['max_stack'] ?? 0));
    $pack .= packOctet((string) ($payload['data_hex'] ?? ''));
    $pack .= pack('N', (int) ($payload['proctype'] ?? 0));
    $pack .= pack('N', (int) ($payload['expire_date'] ?? 0));
    $pack .= pack('N', (int) ($payload['guid1'] ?? 0));
    $pack .= pack('N', (int) ($payload['guid2'] ?? 0));
    $pack .= pack('N', (int) ($payload['mask'] ?? 0));
    return $pack;
}

function buildSysSendMail(array $payload)
{
    $data  = pack('N', 0);
    $data .= pack('N', 0);
    $data .= pack('C', 3);
    $data .= pack('N', (int) $payload['roleid']);
    $data .= packString((string) $payload['title']);
    $data .= packString((string) $payload['message']);
    $data .= packGRoleInventory($payload);
    $data .= pack('N', (int) ($payload['money'] ?? 0));
    return createHeader(0x1076, $data);
}

function parseCuint($data, $pos)
{
    if (!isset($data[$pos])) {
        return [0, $pos];
    }

    $firstByte = ord($data[$pos]);
    if ($firstByte < 0x80) {
        return [$firstByte, $pos + 1];
    }
    if ($firstByte < 0xC0) {
        return [unpack('n', substr($data, $pos, 2))[1] - 0x8000, $pos + 2];
    }
    if ($firstByte < 0xE0) {
        return [unpack('N', substr($data, $pos, 4))[1] - 0xC0000000, $pos + 4];
    }
    return [unpack('N', substr($data, $pos + 1, 4))[1], $pos + 5];
}

function parseSendMailResponse($response)
{
    if (!is_string($response) || $response === '') {
        return [
            'success' => false,
            'error' => 'Nenhuma resposta recebida do gdeliveryd',
        ];
    }

    $pos = 0;
    [$opcode, $pos] = parseCuint($response, $pos);
    [, $pos] = parseCuint($response, $pos);

    if ($opcode !== 0x1077) {
        return [
            'success' => false,
            'error' => 'Opcode inesperado na resposta do gdeliveryd: 0x' . dechex($opcode),
            'opcode' => $opcode,
            'response_hex' => bin2hex($response),
        ];
    }

    if (strlen($response) < $pos + 2) {
        return [
            'success' => false,
            'error' => 'Resposta do gdeliveryd incompleta',
            'response_hex' => bin2hex($response),
        ];
    }

    $retcode = unpack('n', substr($response, $pos, 2))[1];
    $tid = (strlen($response) >= $pos + 6) ? unpack('N', substr($response, $pos + 2, 4))[1] : 0;

    if ($retcode !== 0) {
        return [
            'success' => false,
            'error' => 'gdeliveryd retornou retcode=' . $retcode,
            'retcode' => $retcode,
            'tid' => $tid,
            'response_hex' => bin2hex($response),
        ];
    }

    return [
        'success' => true,
        'retcode' => $retcode,
        'tid' => $tid,
        'response_hex' => bin2hex($response),
    ];
}

function readRequestPayload($argv)
{
    $input = '';
    if (isset($argv[1]) && $argv[1] !== '-' && $argv[1] !== '') {
        $path = (string) $argv[1];
        if (!is_file($path)) {
            emit(['success' => false, 'error' => 'Arquivo de request nao encontrado: ' . $path], 2);
        }
        $input = (string) @file_get_contents($path);
    } else {
        $input = (string) @file_get_contents('php://stdin');
    }

    $decoded = json_decode($input, true);
    if (!is_array($decoded)) {
        emit(['success' => false, 'error' => 'JSON invalido para envio de correio'], 2);
    }

    return $decoded;
}

$request = readRequestPayload($argv);

$kind = strtolower((string) ($request['kind'] ?? ''));
$roleid = (int) ($request['roleid'] ?? 0);
$title = trim((string) ($request['title'] ?? 'Recompensa do servidor'));
$message = trim((string) ($request['message'] ?? 'Voce recebeu uma recompensa.'));
$itemId = max(0, (int) ($request['item_id'] ?? 0));
$count = max(0, (int) ($request['count'] ?? 0));
$maxStack = max(0, (int) ($request['max_stack'] ?? 0));
$money = max(0, (int) ($request['money'] ?? 0));
$dataHex = preg_replace('/[^0-9a-fA-F]/', '', (string) ($request['data_hex'] ?? ''));
$proctype = max(0, (int) ($request['proctype'] ?? 0));
$expireDate = max(0, (int) ($request['expire_date'] ?? 0));
$guid1 = max(0, (int) ($request['guid1'] ?? 0));
$guid2 = max(0, (int) ($request['guid2'] ?? 0));
$mask = max(0, (int) ($request['mask'] ?? 0));
$host = trim((string) ($request['gdelivery_ip'] ?? '127.0.0.1'));
$port = max(1, (int) ($request['gdelivery_port'] ?? 29100));
$dryRun = !empty($request['dry_run']);

if ($roleid <= 0) {
    emit(['success' => false, 'error' => 'roleid invalido'], 3);
}

if ($kind !== 'item' && $kind !== 'gold') {
    emit(['success' => false, 'error' => 'kind invalido. Use item ou gold'], 3);
}

if ($kind === 'item' && $itemId <= 0) {
    emit(['success' => false, 'error' => 'item_id invalido'], 3);
}

if ($kind === 'item' && $count <= 0) {
    emit(['success' => false, 'error' => 'count invalido'], 3);
}

if ($kind === 'item' && $maxStack <= 0) {
    $maxStack = max($count, 1);
}

if ($kind === 'item' && $maxStack < $count) {
    $maxStack = $count;
}

if ($kind === 'gold' && $money <= 0) {
    emit(['success' => false, 'error' => 'money invalido'], 3);
}

if ($kind === 'gold') {
    $itemId = 0;
    $count = 0;
    $maxStack = 0;
    $dataHex = '';
    $proctype = 0;
    $expireDate = 0;
    $guid1 = 0;
    $guid2 = 0;
    $mask = 0;
}

$payload = [
    'kind' => $kind,
    'roleid' => $roleid,
    'title' => $title !== '' ? $title : 'Recompensa do servidor',
    'message' => $message !== '' ? $message : 'Voce recebeu uma recompensa.',
    'item_id' => $itemId,
    'count' => $count,
    'max_stack' => $maxStack,
    'data_hex' => strtolower($dataHex),
    'proctype' => $proctype,
    'expire_date' => $expireDate,
    'guid1' => $guid1,
    'guid2' => $guid2,
    'mask' => $mask,
    'money' => $money,
    'gdelivery_ip' => $host !== '' ? $host : '127.0.0.1',
    'gdelivery_port' => $port,
];

if ($dryRun) {
    emit([
        'success' => true,
        'dry_run' => true,
        'message' => 'Dry run de correio validado com sucesso',
        'request' => $payload,
    ], 0);
}

$sock = @socket_create(AF_INET, SOCK_STREAM, SOL_TCP);
if ($sock === false) {
    emit(['success' => false, 'error' => 'Falha ao criar socket para gdeliveryd'], 4);
}

@socket_set_option($sock, SOL_SOCKET, SO_RCVTIMEO, ['sec' => 5, 'usec' => 0]);
@socket_set_option($sock, SOL_SOCKET, SO_SNDTIMEO, ['sec' => 5, 'usec' => 0]);

if (!@socket_connect($sock, $payload['gdelivery_ip'], $payload['gdelivery_port'])) {
    $error = socket_strerror(socket_last_error($sock));
    @socket_close($sock);
    emit([
        'success' => false,
        'error' => 'Falha ao conectar no gdeliveryd (' . $payload['gdelivery_ip'] . ':' . $payload['gdelivery_port'] . '): ' . $error,
    ], 5);
}

$hello = '';
@socket_recv($sock, $hello, 8192, 0);

$packet = buildSysSendMail($payload);
$sent = @socket_send($sock, $packet, strlen($packet), 0);
if ($sent === false) {
    $error = socket_strerror(socket_last_error($sock));
    @socket_close($sock);
    emit(['success' => false, 'error' => 'Falha ao enviar pacote para gdeliveryd: ' . $error], 6);
}

$response = '';
$received = @socket_recv($sock, $response, 8192, 0);
@socket_close($sock);

if ($received === false) {
    emit(['success' => false, 'error' => 'Falha ao ler resposta do gdeliveryd'], 6);
}

$parsed = parseSendMailResponse($response);
if (empty($parsed['success'])) {
    emit($parsed, 6);
}

emit([
    'success' => true,
    'kind' => $kind,
    'roleid' => $roleid,
    'sent_bytes' => $sent,
    'message' => 'Correio enviado com sucesso',
    'delivery' => $parsed,
], 0);
PHPMAIL_EOF

cat > /usr/local/sbin/sendreward-api.sh <<'EOF'
#!/bin/sh
export PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
exec /usr/bin/php /usr/local/bin/pw_send_mail.php "$@"
EOF

cat > /usr/local/sbin/panel_service_control.sh <<'EOF'
#!/bin/bash
set -euo pipefail
export PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin

ACTION="${1:-}"
SERVICE="${2:-}"
KILLALL_BIN="$(command -v killall 2>/dev/null || true)"

emit_json() {
  local ok="$1"
  local action="$2"
  local service="$3"
  local message="$4"
  printf '{"success":%s,"action":"%s","service":"%s","message":"%s"}\n' "$ok" "$action" "$service" "$message"
}

ensure_logs() {
  mkdir -p /home/logs
}

start_detached() {
  local workdir="$1"
  local logfile="$2"
  shift 2
  (
    cd "$workdir"
    if command -v setsid >/dev/null 2>&1; then
      setsid "$@" >>"$logfile" 2>&1 < /dev/null &
    else
      nohup "$@" >>"$logfile" 2>&1 < /dev/null &
    fi
  )
}

kill_names() {
  local name
  local pid
  for name in "$@"; do
    [ -n "$name" ] || continue
    if [ -n "$KILLALL_BIN" ]; then
      "$KILLALL_BIN" "$name" >/dev/null 2>&1 || true
    fi
    for pid in $(pgrep -x "$name" 2>/dev/null || true); do
      [ -n "$pid" ] || continue
      kill "$pid" >/dev/null 2>&1 || true
    done
  done
}

kill_names_force() {
  local name
  local pid
  for name in "$@"; do
    [ -n "$name" ] || continue
    for pid in $(pgrep -x "$name" 2>/dev/null || true); do
      [ -n "$pid" ] || continue
      kill -9 "$pid" >/dev/null 2>&1 || true
    done
  done
}

is_service_running() {
  case "$1" in
    authd) pgrep -x authd >/dev/null 2>&1 || pgrep -x gauthd >/dev/null 2>&1 ;;
    glinkd) pgrep -x glinkd >/dev/null 2>&1 || pgrep -x glink >/dev/null 2>&1 ;;
    gamed) pgrep -x gs >/dev/null 2>&1 || pgrep -x gamed >/dev/null 2>&1 ;;
    *) pgrep -x "$1" >/dev/null 2>&1 ;;
  esac
}

start_service() {
  ensure_logs
  case "$1" in
    logservice)
      is_service_running logservice && return 0
      start_detached /home/logservice /home/logs/logservice.log ./logservice logservice.conf ;;
    uniquenamed)
      is_service_running uniquenamed && return 0
      start_detached /home/uniquenamed /home/logs/uniquenamed.log ./uniquenamed gamesys.conf ;;
    authd)
      is_service_running authd && return 0
      start_detached /home/gauthd /home/logs/authd.log ./gauthd start ;;
    gamedbd)
      is_service_running gamedbd && return 0
      start_detached /home/gamedbd /home/logs/gamedbd.log ./gamedbd gamesys.conf ;;
    gacd)
      is_service_running gacd && return 0
      start_detached /home/gacd /home/logs/gacd.log ./gacd gamesys.conf ;;
    gfactiond)
      is_service_running gfactiond && return 0
      start_detached /home/gfactiond /home/logs/gfactiond.log ./gfactiond gamesys.conf ;;
    gdeliveryd)
      is_service_running gdeliveryd && return 0
      start_detached /home/gdeliveryd /home/logs/gdeliveryd.log ./gdeliveryd gamesys.conf ;;
    glinkd)
      is_service_running glinkd && return 0
      start_detached /home/glinkd /home/logs/glink1.log ./glinkd gamesys.conf 1
      start_detached /home/glinkd /home/logs/glink2.log ./glinkd gamesys.conf 2
      start_detached /home/glinkd /home/logs/glink3.log ./glinkd gamesys.conf 3
      start_detached /home/glinkd /home/logs/glink4.log ./glinkd gamesys.conf 4 ;;
    gamed)
      is_service_running gamed && return 0
      start_detached /home/gamed /home/logs/gs01.log ./gs gs01 ;;
    *)
      echo "service invalido: $1" >&2
      exit 31 ;;
  esac
}

stop_service() {
  case "$1" in
    logservice) kill_names logservice ;;
    uniquenamed) kill_names uniquenamed ;;
    authd) kill_names authd gauthd ;;
    gamedbd) kill_names gamedbd ;;
    gacd) kill_names gacd ;;
    gfactiond) kill_names gfactiond ;;
    gdeliveryd) kill_names gdeliveryd ;;
    glinkd) kill_names glinkd glink ;;
    gamed) kill_names gs gamed loader ;;
    *)
      echo "service invalido: $1" >&2
      exit 31 ;;
  esac
  sleep 2
  case "$1" in
    logservice) kill_names_force logservice ;;
    uniquenamed) kill_names_force uniquenamed ;;
    authd) kill_names_force authd gauthd ;;
    gamedbd) kill_names_force gamedbd ;;
    gacd) kill_names_force gacd ;;
    gfactiond) kill_names_force gfactiond ;;
    gdeliveryd) kill_names_force gdeliveryd ;;
    glinkd) kill_names_force glinkd glink ;;
    gamed) kill_names_force gs gamed loader ;;
  esac
}

case "$ACTION" in
  start|stop|restart) ;;
  *)
    echo "acao invalida: $ACTION" >&2
    exit 30 ;;
esac

case "$SERVICE" in
  logservice|uniquenamed|authd|gamedbd|gacd|gfactiond|gdeliveryd|glinkd|gamed) ;;
  *)
    echo "service invalido: $SERVICE" >&2
    exit 31 ;;
esac

case "$ACTION" in
  start)
    start_service "$SERVICE"
    ;;
  stop)
    stop_service "$SERVICE"
    ;;
  restart)
    stop_service "$SERVICE"
    sleep 3
    start_service "$SERVICE"
    ;;
esac

emit_json true "$ACTION" "$SERVICE" "Operacao concluida"
EOF

cat > /usr/local/sbin/panel_start.sh <<'EOF'
#!/bin/bash
set -euo pipefail
export PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin

SERVICES=(logservice uniquenamed authd gamedbd gacd gfactiond gdeliveryd glinkd gamed)
for service in "${SERVICES[@]}"; do
  /usr/local/sbin/panel_service_control.sh start "$service"
  sleep 1
done
EOF

cat > /usr/local/sbin/panel_stop.sh <<'EOF'
#!/bin/bash
set -euo pipefail
export PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin

SERVICES=(gamed glinkd gdeliveryd gfactiond gacd gamedbd authd uniquenamed logservice)
for service in "${SERVICES[@]}"; do
  /usr/local/sbin/panel_service_control.sh stop "$service"
done
EOF

cat > /usr/local/sbin/panel_restart.sh <<'EOF'
#!/bin/bash
set -euo pipefail
export PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
/usr/local/sbin/panel_stop.sh
sleep 5
exec /usr/local/sbin/panel_start.sh
EOF

cat > /usr/local/sbin/panel_instance_start.sh <<'EOF'
#!/bin/bash
set -euo pipefail
export PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin

WORKDIR="/home/gamed"
LOGDIR="/home/logs"
GS_BIN="./gs"

json_escape() {
  printf '%s' "$1" | sed 's/\\/\\\\/g; s/"/\\"/g'
}

emit_error() {
  local message="${1:-erro}"
  local code="${2:-1}"
  printf '{"success":false,"error":"%s"}\n' "$(json_escape "$message")"
  exit "$code"
}

[ "$#" -ge 1 ] || emit_error "Informe ao menos uma instancia" 2
[ -d "$WORKDIR" ] || emit_error "Diretorio nao encontrado: $WORKDIR" 3
[ -x "$WORKDIR/gs" ] || emit_error "Binario gs nao encontrado ou sem execucao em $WORKDIR/gs" 4
mkdir -p "$LOGDIR"

results=""
count=0

for raw_code in "$@"; do
  code="$(printf '%s' "$raw_code" | tr '[:upper:]' '[:lower:]')"
  [[ "$code" =~ ^[a-z0-9_]+$ ]] || emit_error "Codigo de instancia invalido: $raw_code" 5

  stamp="$(date +%Y%m%d-%H%M%S)"
  stdout_log="$LOGDIR/gs_${code}_${stamp}_std.log"
  stderr_log="$LOGDIR/gs_${code}_${stamp}_err.log"

  pid="$(
    cd "$WORKDIR"
    if command -v setsid >/dev/null 2>&1; then
      setsid "$GS_BIN" "$code" >"$stdout_log" 2>"$stderr_log" < /dev/null &
    else
      nohup "$GS_BIN" "$code" >"$stdout_log" 2>"$stderr_log" < /dev/null &
    fi
    echo $!
  )"

  pid="$(printf '%s' "$pid" | tr -d '[:space:]')"
  [ -n "$pid" ] || emit_error "Falha ao capturar PID para $code" 6

  item="$(printf '{"code":"%s","pid":%s,"stdout_log":"%s","stderr_log":"%s","command":"./gs %s"}' \
    "$(json_escape "$code")" \
    "$pid" \
    "$(json_escape "$stdout_log")" \
    "$(json_escape "$stderr_log")" \
    "$(json_escape "$code")")"

  if [ -n "$results" ]; then
    results="$results,$item"
  else
    results="$item"
  fi
  count=$((count + 1))
done

printf '{"success":true,"action":"start","count":%s,"instances":[%s]}\n' "$count" "$results"
EOF

cat > /usr/local/sbin/panel_instance_stop.sh <<'EOF'
#!/bin/bash
set -euo pipefail
export PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin

json_escape() {
  printf '%s' "$1" | sed 's/\\/\\\\/g; s/"/\\"/g'
}

emit_error() {
  local message="${1:-erro}"
  local code="${2:-1}"
  printf '{"success":false,"error":"%s"}\n' "$(json_escape "$message")"
  exit "$code"
}

collect_pids_for_port() {
  local port="$1"
  local data=""

  if command -v lsof >/dev/null 2>&1; then
    data="$(lsof -tiTCP:"$port" -sTCP:LISTEN 2>/dev/null || true)"
  fi

  if [ -z "$data" ] && command -v fuser >/dev/null 2>&1; then
    data="$(fuser -n tcp "$port" 2>/dev/null | tr ' ' '\n' | grep '^[0-9]\+$' || true)"
  fi

  if [ -z "$data" ] && command -v ss >/dev/null 2>&1; then
    data="$(ss -ltnp 2>/dev/null | awk -v port=":$port" '$4 ~ port"$" {print $0}' | grep -o 'pid=[0-9]\+' | cut -d= -f2 || true)"
  fi

  if [ -z "$data" ] && command -v netstat >/dev/null 2>&1; then
    data="$(netstat -lntp 2>/dev/null | awk -v port=":$port" '$4 ~ port"$" {print $7}' | cut -d/ -f1 | grep '^[0-9]\+$' || true)"
  fi

  printf '%s\n' "$data" | tr ' ' '\n' | grep '^[0-9]\+$' | sort -u || true
}

json_pid_list() {
  local first=1
  local pid
  for pid in "$@"; do
    [ -n "$pid" ] || continue
    if [ "$first" -eq 1 ]; then
      printf '%s' "$pid"
      first=0
    else
      printf ',%s' "$pid"
    fi
  done
}

kill_pid_list() {
  local signal="$1"
  shift || true
  local pid
  for pid in "$@"; do
    [ -n "$pid" ] || continue
    kill "-$signal" "$pid" >/dev/null 2>&1 || true
  done
}

[ "$#" -ge 1 ] || emit_error "Informe ao menos uma instancia" 2

results=""
count=0

for spec in "$@"; do
  [[ "$spec" =~ ^([a-z0-9_]+):([0-9]+)$ ]] || emit_error "Formato invalido. Use code:porta" 3
  code="${BASH_REMATCH[1]}"
  port="${BASH_REMATCH[2]}"
  [ "$port" -gt 0 ] || emit_error "Porta invalida para $code" 4

  mapfile -t before_pids < <(collect_pids_for_port "$port")
  stopped="false"
  already_stopped="false"

  if [ "${#before_pids[@]}" -eq 0 ]; then
    already_stopped="true"
    after_pids=()
  else
    kill_pid_list TERM "${before_pids[@]}"
    sleep 2
    mapfile -t after_pids < <(collect_pids_for_port "$port")
    if [ "${#after_pids[@]}" -gt 0 ]; then
      kill_pid_list KILL "${after_pids[@]}"
      sleep 1
      mapfile -t after_pids < <(collect_pids_for_port "$port")
    fi
    [ "${#after_pids[@]}" -eq 0 ] || emit_error "Falha ao parar $code na porta $port" 5
    stopped="true"
  fi

  item="$(printf '{"code":"%s","listen_port":%s,"pids":[%s],"stopped":%s,"already_stopped":%s}' \
    "$(json_escape "$code")" \
    "$port" \
    "$(json_pid_list "${before_pids[@]}")" \
    "$stopped" \
    "$already_stopped")"

  if [ -n "$results" ]; then
    results="$results,$item"
  else
    results="$item"
  fi
  count=$((count + 1))
done

printf '{"success":true,"action":"stop","count":%s,"instances":[%s]}\n' "$count" "$results"
EOF

sed -i 's/\r$//' /usr/local/sbin/exportclsconfig-api.sh /usr/local/sbin/backupgamedbd-api.sh /usr/local/sbin/backupclsconfig-api.sh /usr/local/sbin/backupmysql-api.sh /usr/local/sbin/restoremysql-api.sh /usr/local/sbin/grantmallcash-api.sh /usr/local/sbin/gmpermission-api.sh /usr/local/sbin/accountforbid-api.sh /usr/local/sbin/backupuniquenamed-api.sh /usr/local/sbin/backuppanel-api.sh /usr/local/sbin/backupfull-api.sh /usr/local/sbin/pw-watchdog-runner.sh /usr/local/bin/pw_send_mail.php /usr/local/sbin/sendreward-api.sh /usr/local/sbin/panel_service_control.sh /usr/local/sbin/panel_start.sh /usr/local/sbin/panel_stop.sh /usr/local/sbin/panel_restart.sh /usr/local/sbin/panel_instance_start.sh /usr/local/sbin/panel_instance_stop.sh
chown root:root /usr/local/sbin/exportclsconfig-api.sh /usr/local/sbin/backupgamedbd-api.sh /usr/local/sbin/backupclsconfig-api.sh /usr/local/sbin/backupmysql-api.sh /usr/local/sbin/restoremysql-api.sh /usr/local/sbin/grantmallcash-api.sh /usr/local/sbin/gmpermission-api.sh /usr/local/sbin/accountforbid-api.sh /usr/local/sbin/backupuniquenamed-api.sh /usr/local/sbin/backuppanel-api.sh /usr/local/sbin/backupfull-api.sh /usr/local/sbin/pw-watchdog-runner.sh /usr/local/bin/pw_send_mail.php /usr/local/sbin/sendreward-api.sh /usr/local/sbin/panel_service_control.sh /usr/local/sbin/panel_start.sh /usr/local/sbin/panel_stop.sh /usr/local/sbin/panel_restart.sh /usr/local/sbin/panel_instance_start.sh /usr/local/sbin/panel_instance_stop.sh
chmod 750 /usr/local/sbin/exportclsconfig-api.sh /usr/local/sbin/backupgamedbd-api.sh /usr/local/sbin/backupclsconfig-api.sh /usr/local/sbin/backupmysql-api.sh /usr/local/sbin/restoremysql-api.sh /usr/local/sbin/grantmallcash-api.sh /usr/local/sbin/gmpermission-api.sh /usr/local/sbin/accountforbid-api.sh /usr/local/sbin/backupuniquenamed-api.sh /usr/local/sbin/backuppanel-api.sh /usr/local/sbin/backupfull-api.sh /usr/local/sbin/pw-watchdog-runner.sh /usr/local/bin/pw_send_mail.php /usr/local/sbin/sendreward-api.sh /usr/local/sbin/panel_service_control.sh /usr/local/sbin/panel_start.sh /usr/local/sbin/panel_stop.sh /usr/local/sbin/panel_restart.sh /usr/local/sbin/panel_instance_start.sh /usr/local/sbin/panel_instance_stop.sh

if [ -e "$SUDOERS_FILE" ] && [ ! -f "$SUDOERS_FILE" ]; then
  die "$SUDOERS_FILE existe, mas nao e arquivo. Remova ou renomeie esse caminho."
fi

cat > "$SUDOERS_FILE" <<EOF
$WEB_USER ALL=(root) NOPASSWD: /usr/local/sbin/exportclsconfig-api.sh
$WEB_USER ALL=(root) NOPASSWD: /usr/local/sbin/backupgamedbd-api.sh
$WEB_USER ALL=(root) NOPASSWD: /usr/local/sbin/backupclsconfig-api.sh
$WEB_USER ALL=(root) NOPASSWD: /usr/local/sbin/backupmysql-api.sh
$WEB_USER ALL=(root) NOPASSWD: /usr/local/sbin/restoremysql-api.sh
$WEB_USER ALL=(root) NOPASSWD: /usr/local/sbin/grantmallcash-api.sh
$WEB_USER ALL=(root) NOPASSWD: /usr/local/sbin/gmpermission-api.sh
$WEB_USER ALL=(root) NOPASSWD: /usr/local/sbin/accountforbid-api.sh
$WEB_USER ALL=(root) NOPASSWD: /usr/local/sbin/backupuniquenamed-api.sh
$WEB_USER ALL=(root) NOPASSWD: /usr/local/sbin/backuppanel-api.sh
$WEB_USER ALL=(root) NOPASSWD: /usr/local/sbin/backupfull-api.sh
$WEB_USER ALL=(root) NOPASSWD: /usr/local/sbin/sendreward-api.sh
$WEB_USER ALL=(root) NOPASSWD: /usr/local/sbin/panel_service_control.sh
$WEB_USER ALL=(root) NOPASSWD: /usr/local/sbin/panel_start.sh
$WEB_USER ALL=(root) NOPASSWD: /usr/local/sbin/panel_stop.sh
$WEB_USER ALL=(root) NOPASSWD: /usr/local/sbin/panel_restart.sh
$WEB_USER ALL=(root) NOPASSWD: /usr/local/sbin/panel_instance_start.sh
$WEB_USER ALL=(root) NOPASSWD: /usr/local/sbin/panel_instance_stop.sh
EOF
chmod 440 "$SUDOERS_FILE"
visudo -cf "$SUDOERS_FILE" >/dev/null || die "sudoers invalido em $SUDOERS_FILE"

cat > /etc/cron.d/apicls-watchdog <<'EOF'
* * * * * __WEB_USER__ /usr/local/sbin/pw-watchdog-runner.sh >/dev/null 2>&1
EOF
sed -i "s/__WEB_USER__/$WEB_USER/g" /etc/cron.d/apicls-watchdog
chmod 644 /etc/cron.d/apicls-watchdog

cat > /etc/cron.d/apicls-gm-v2 <<'EOF'
* * * * * __WEB_USER__ __PHP_BIN__ __INSTALL_DIR__/gm-schedule-worker.php >/dev/null 2>&1
* * * * * __WEB_USER__ __PHP_BIN__ __INSTALL_DIR__/gm-queue-worker.php >/dev/null 2>&1
EOF
sed -i "s/__WEB_USER__/$WEB_USER/g" /etc/cron.d/apicls-gm-v2
sed -i "s#__PHP_BIN__#$PHP_CLI_BIN#g" /etc/cron.d/apicls-gm-v2
sed -i "s#__INSTALL_DIR__#$INSTALL_DIR#g" /etc/cron.d/apicls-gm-v2
chmod 644 /etc/cron.d/apicls-gm-v2

chown -R "$WEB_USER:$WEB_USER" "$INSTALL_DIR"
chmod 750 "$INSTALL_DIR"
chmod 640 "$INSTALL_DIR/api_cls.php"
chmod 640 "$INSTALL_DIR/gm-queue-worker.php" "$INSTALL_DIR/gm-schedule-worker.php"
find "$INSTALL_DIR/backups" -type d -exec chmod 750 {} \;
find "$INSTALL_DIR/backups" -type f -exec chmod 640 {} \; 2>/dev/null || true
chown root:"$WEB_USER" /usr/local/sbin/pw-watchdog-runner.sh
chmod 750 /usr/local/sbin/pw-watchdog-runner.sh

"$PHP_CLI_BIN" -l "$INSTALL_DIR/api_cls.php" >/dev/null || die "api_cls.php instalado com erro de sintaxe."
"$PHP_CLI_BIN" -l "$INSTALL_DIR/gm-queue-worker.php" >/dev/null || die "gm-queue-worker.php instalado com erro de sintaxe."
"$PHP_CLI_BIN" -l "$INSTALL_DIR/gm-schedule-worker.php" >/dev/null || die "gm-schedule-worker.php instalado com erro de sintaxe."
"$PHP_CLI_BIN" -l /usr/local/bin/pw_send_mail.php >/dev/null || die "pw_send_mail.php instalado com erro de sintaxe."
log "api_cls.php instalado em $INSTALL_DIR/api_cls.php"

if [ -d /home/gamedbd ]; then
  if [ -f /home/gamedbd/gamedbd ] && [ ! -x /home/gamedbd/gamedbd ]; then
    chmod +x /home/gamedbd/gamedbd 2>/dev/null || warn "Nao consegui aplicar chmod +x em /home/gamedbd/gamedbd"
  fi
else
  warn "/home/gamedbd nao existe. A API instala, mas getClsconfig/save/backup so funcionam depois do PW instalado."
fi

if command -v getenforce >/dev/null 2>&1; then
  SELINUX_STATE="$(getenforce 2>/dev/null || true)"
  if [ "$SELINUX_STATE" = "Enforcing" ] || [ "$SELINUX_STATE" = "Permissive" ]; then
    if command -v setsebool >/dev/null 2>&1; then
      setsebool -P httpd_can_network_connect 1 >/dev/null 2>&1 || warn "Nao consegui setar httpd_can_network_connect."
    fi
    command -v restorecon >/dev/null 2>&1 && restorecon -RF "$INSTALL_DIR" >/dev/null 2>&1 || true
  fi
fi

if command -v systemctl >/dev/null 2>&1; then
  systemctl enable httpd >/dev/null 2>&1 || true
  systemctl restart httpd >/dev/null 2>&1 || systemctl start httpd >/dev/null 2>&1 || warn "Nao consegui iniciar/reiniciar httpd via systemctl."
else
  service httpd restart >/dev/null 2>&1 || service httpd start >/dev/null 2>&1 || warn "Nao consegui iniciar/reiniciar httpd."
fi

if [ "$OPEN_FIREWALL" = "1" ] && command -v firewall-cmd >/dev/null 2>&1; then
  if firewall-cmd --state >/dev/null 2>&1; then
    firewall-cmd --permanent --add-service=http >/dev/null 2>&1 || warn "Nao consegui abrir service=http no firewalld."
    firewall-cmd --reload >/dev/null 2>&1 || true
  fi
fi

BASE_URL="http://127.0.0.1/apicls/api_cls.php"
PING_OUT="$(curl -s -H "x-sync-secret: $SECRET" "$BASE_URL?action=getClasses" 2>/dev/null || true)"
if echo "$PING_OUT" | grep -q '"success":true'; then
  log "Teste getClasses OK."
else
  warn "Teste getClasses nao retornou success:true. Saida: $PING_OUT"
fi

MAIL_ROUTE_OUT="$(curl -s -X POST -H "x-sync-secret: $SECRET" -H "Content-Type: application/json" -d '{"roleid":1}' "$BASE_URL?action=sendMailGold" 2>/dev/null || true)"
if echo "$MAIL_ROUTE_OUT" | grep -q '"error":"money invalido"'; then
  log "Teste sendMailGold OK (rota encontrada)."
else
  warn "Teste sendMailGold nao confirmou a rota. Saida: $MAIL_ROUTE_OUT"
fi

KICK_ROUTE_OUT="$(curl -s -X POST -H "x-sync-secret: $SECRET" -H "Content-Type: application/json" -d '{"roleid":1,"reason":"install-test","dry_run":true}' "$BASE_URL?action=kickRole" 2>/dev/null || true)"
if echo "$KICK_ROUTE_OUT" | grep -q '"success":true'; then
  log "Teste kickRole OK (dry_run)."
else
  warn "Teste kickRole falhou. Saida: $KICK_ROUTE_OUT"
fi

GM_CATALOG_OUT="$(curl -s -H "x-sync-secret: $SECRET" "$BASE_URL?action=getGmCommandCatalog" 2>/dev/null || true)"
if echo "$GM_CATALOG_OUT" | grep -q '"commands"'; then
  log "Teste getGmCommandCatalog OK."
else
  warn "Teste getGmCommandCatalog falhou. Saida: $GM_CATALOG_OUT"
fi

if echo "$GM_CATALOG_OUT" | grep -q '"grantMallCash"' && echo "$GM_CATALOG_OUT" | grep -q '"getMallCashBalance"' && echo "$GM_CATALOG_OUT" | grep -q '"grantGmPermission"' && echo "$GM_CATALOG_OUT" | grep -q '"getGmPermissionCatalog"' && echo "$GM_CATALOG_OUT" | grep -q '"getGmPermissionState"'; then
  log "Catalogo GM inclui mall cash e permissao GM."
else
  warn "Catalogo GM ainda nao expoe grantMallCash/getMallCashBalance/grantGmPermission/getGmPermissionCatalog/getGmPermissionState como esperado. Saida: $GM_CATALOG_OUT"
fi

GM_HISTORY_OUT="$(curl -s -H "x-sync-secret: $SECRET" "$BASE_URL?action=getGmActionHistory&limit=5" 2>/dev/null || true)"
if echo "$GM_HISTORY_OUT" | grep -q '"entries"'; then
  log "Teste getGmActionHistory OK."
else
  warn "Teste getGmActionHistory falhou. Saida: $GM_HISTORY_OUT"
fi

MUTE_ROUTE_OUT="$(curl -s -X POST -H "x-sync-secret: $SECRET" -H "Content-Type: application/json" -d '{"userid":1,"reason":"install-test","duration_seconds":60,"dry_run":true}' "$BASE_URL?action=muteAccount" 2>/dev/null || true)"
if echo "$MUTE_ROUTE_OUT" | grep -q '"success":true'; then
  log "Teste muteAccount OK (dry_run)."
else
  warn "Teste muteAccount falhou. Saida: $MUTE_ROUTE_OUT"
fi

SERVICE_STATUS_OUT="$(curl -s -H "x-sync-secret: $SECRET" "$BASE_URL?action=getServiceStatus" 2>/dev/null || true)"
if echo "$SERVICE_STATUS_OUT" | grep -q '"services"'; then
  log "Teste getServiceStatus OK."
else
  warn "Teste getServiceStatus falhou. Saida: $SERVICE_STATUS_OUT"
fi

CONTROL_CENTER_OUT="$(curl -s -H "x-sync-secret: $SECRET" "$BASE_URL?action=getControlCenterSnapshot" 2>/dev/null || true)"
if echo "$CONTROL_CENTER_OUT" | grep -q '"snapshot"'; then
  log "Teste getControlCenterSnapshot OK."
else
  warn "Teste getControlCenterSnapshot falhou. Saida: $CONTROL_CENTER_OUT"
fi

MANAGEABLE_OUT="$(curl -s -H "x-sync-secret: $SECRET" "$BASE_URL?action=getManageableServices" 2>/dev/null || true)"
if echo "$MANAGEABLE_OUT" | grep -q '"supported_actions"'; then
  log "Teste getManageableServices OK."
else
  warn "Teste getManageableServices falhou. Saida: $MANAGEABLE_OUT"
fi

INSTANCE_OUT="$(curl -s -H "x-sync-secret: $SECRET" "$BASE_URL?action=getManageableInstances" 2>/dev/null || true)"
if echo "$INSTANCE_OUT" | grep -q '"instances"'; then
  log "Teste getManageableInstances OK."
else
  warn "Teste getManageableInstances falhou. Saida: $INSTANCE_OUT"
fi

SERVER_LOGS_OUT="$(curl -s -H "x-sync-secret: $SECRET" "$BASE_URL?action=getServerLogs&source=apicls&lines=5" 2>/dev/null || true)"
if echo "$SERVER_LOGS_OUT" | grep -q '"entries"'; then
  log "Teste getServerLogs OK."
else
  warn "Teste getServerLogs falhou. Saida: $SERVER_LOGS_OUT"
fi

LIST_BACKUPS_OUT="$(curl -s -H "x-sync-secret: $SECRET" "$BASE_URL?action=listBackups&limit=5" 2>/dev/null || true)"
if echo "$LIST_BACKUPS_OUT" | grep -q '"backups"'; then
  log "Teste listBackups OK."
else
  warn "Teste listBackups falhou. Saida: $LIST_BACKUPS_OUT"
fi

APICLS_ROOT_CODE="$(curl -s -o /dev/null -w '%{http_code}' "http://127.0.0.1/apicls/" 2>/dev/null || true)"
case "$APICLS_ROOT_CODE" in
  403|404)
    log "Protecao do diretorio /apicls OK (HTTP $APICLS_ROOT_CODE)."
    ;;
  *)
    warn "Diretorio /apicls ainda parece exposto (HTTP $APICLS_ROOT_CODE)."
    ;;
esac

APICLS_BACKUPS_CODE="$(curl -s -o /dev/null -w '%{http_code}' "http://127.0.0.1/apicls/backups/" 2>/dev/null || true)"
case "$APICLS_BACKUPS_CODE" in
  403|404)
    log "Protecao do diretorio /apicls/backups OK (HTTP $APICLS_BACKUPS_CODE)."
    ;;
  *)
    warn "Diretorio /apicls/backups ainda parece exposto (HTTP $APICLS_BACKUPS_CODE)."
    ;;
esac

RESTORE_PLAN_OUT="$(curl -s -H "x-sync-secret: $SECRET" "$BASE_URL?action=getRestorePlan" 2>/dev/null || true)"
if echo "$RESTORE_PLAN_OUT" | grep -q '"supported_types"'; then
  log "Teste getRestorePlan OK."
else
  warn "Teste getRestorePlan falhou. Saida: $RESTORE_PLAN_OUT"
fi

RESTORE_HISTORY_OUT="$(curl -s -H "x-sync-secret: $SECRET" "$BASE_URL?action=getRestoreHistory&limit=5" 2>/dev/null || true)"
if echo "$RESTORE_HISTORY_OUT" | grep -q '"entries"'; then
  log "Teste getRestoreHistory OK."
else
  warn "Teste getRestoreHistory falhou. Saida: $RESTORE_HISTORY_OUT"
fi

INSTANCE_AUTOSTART_OUT="$(curl -s -X POST -H "x-sync-secret: $SECRET" -H "Content-Type: application/json" -d '{"code":"gs01","enabled":true,"dry_run":true}' "$BASE_URL?action=setInstanceAutoStart" 2>/dev/null || true)"
if echo "$INSTANCE_AUTOSTART_OUT" | grep -q '"success":true'; then
  log "Teste setInstanceAutoStart OK (dry_run)."
else
  warn "Teste setInstanceAutoStart falhou. Saida: $INSTANCE_AUTOSTART_OUT"
fi

INSTANCE_START_OUT="$(curl -s -X POST -H "x-sync-secret: $SECRET" -H "Content-Type: application/json" -d '{"code":"is24","verify":true,"dry_run":true}' "$BASE_URL?action=startInstance" 2>/dev/null || true)"
if echo "$INSTANCE_START_OUT" | grep -q '"success":true'; then
  log "Teste startInstance OK (dry_run)."
else
  warn "Teste startInstance falhou. Saida: $INSTANCE_START_OUT"
fi

INSTANCE_START_BATCH_OUT="$(curl -s -X POST -H "x-sync-secret: $SECRET" -H "Content-Type: application/json" -d '{"codes":["is24","is25"],"verify":true,"dry_run":true}' "$BASE_URL?action=startInstances" 2>/dev/null || true)"
if echo "$INSTANCE_START_BATCH_OUT" | grep -q '"success":true'; then
  log "Teste startInstances OK (dry_run)."
else
  warn "Teste startInstances falhou. Saida: $INSTANCE_START_BATCH_OUT"
fi

INSTANCE_STOP_OUT="$(curl -s -X POST -H "x-sync-secret: $SECRET" -H "Content-Type: application/json" -d '{"code":"is24","verify":true,"dry_run":true}' "$BASE_URL?action=stopInstance" 2>/dev/null || true)"
if echo "$INSTANCE_STOP_OUT" | grep -q '"success":true'; then
  log "Teste stopInstance OK (dry_run)."
else
  warn "Teste stopInstance falhou. Saida: $INSTANCE_STOP_OUT"
fi

INSTANCE_STOP_BATCH_OUT="$(curl -s -X POST -H "x-sync-secret: $SECRET" -H "Content-Type: application/json" -d '{"codes":["is24","is25"],"verify":true,"dry_run":true}' "$BASE_URL?action=stopInstances" 2>/dev/null || true)"
if echo "$INSTANCE_STOP_BATCH_OUT" | grep -q '"success":true'; then
  log "Teste stopInstances OK (dry_run)."
else
  warn "Teste stopInstances falhou. Saida: $INSTANCE_STOP_BATCH_OUT"
fi

INSTANCE_RESTART_OUT="$(curl -s -X POST -H "x-sync-secret: $SECRET" -H "Content-Type: application/json" -d '{"code":"is24","verify":true,"dry_run":true}' "$BASE_URL?action=restartInstance" 2>/dev/null || true)"
if echo "$INSTANCE_RESTART_OUT" | grep -q '"success":true'; then
  log "Teste restartInstance OK (dry_run)."
else
  warn "Teste restartInstance falhou. Saida: $INSTANCE_RESTART_OUT"
fi

INSTANCE_RESTART_BATCH_OUT="$(curl -s -X POST -H "x-sync-secret: $SECRET" -H "Content-Type: application/json" -d '{"codes":["is24","is25"],"verify":true,"dry_run":true}' "$BASE_URL?action=restartInstances" 2>/dev/null || true)"
if echo "$INSTANCE_RESTART_BATCH_OUT" | grep -q '"success":true'; then
  log "Teste restartInstances OK (dry_run)."
else
  warn "Teste restartInstances falhou. Saida: $INSTANCE_RESTART_BATCH_OUT"
fi

OP_STATUS_OUT="$(curl -s -H "x-sync-secret: $SECRET" "$BASE_URL?action=getServerOperationStatus" 2>/dev/null || true)"
if echo "$OP_STATUS_OUT" | grep -q '"operation"' || echo "$OP_STATUS_OUT" | grep -q 'Operacao nao encontrada'; then
  log "Teste getServerOperationStatus OK."
else
  warn "Teste getServerOperationStatus falhou. Saida: $OP_STATUS_OUT"
fi

OP_HISTORY_OUT="$(curl -s -H "x-sync-secret: $SECRET" "$BASE_URL?action=getServerOperationsHistory&limit=5" 2>/dev/null || true)"
if echo "$OP_HISTORY_OUT" | grep -q '"operations"'; then
  log "Teste getServerOperationsHistory OK."
else
  warn "Teste getServerOperationsHistory falhou. Saida: $OP_HISTORY_OUT"
fi

SYSMSG_DRY_OUT="$(curl -s -X POST -H "x-sync-secret: $SECRET" -H "Content-Type: application/json" -d '{"message":"install-test","kind":"system","priority":"normal","dry_run":true}' "$BASE_URL?action=sendSystemMessage" 2>/dev/null || true)"
if echo "$SYSMSG_DRY_OUT" | grep -q '"success":true'; then
  log "Teste sendSystemMessage OK (dry_run)."
else
  warn "Teste sendSystemMessage falhou. Saida: $SYSMSG_DRY_OUT"
fi

MAINT_GET_OUT="$(curl -s -H "x-sync-secret: $SECRET" "$BASE_URL?action=getMaintenanceMode" 2>/dev/null || true)"
if echo "$MAINT_GET_OUT" | grep -q '"maintenance"'; then
  log "Teste getMaintenanceMode OK."
else
  warn "Teste getMaintenanceMode falhou. Saida: $MAINT_GET_OUT"
fi

MAINT_SET_OUT="$(curl -s -X POST -H "x-sync-secret: $SECRET" -H "Content-Type: application/json" -d '{"enabled":true,"reason":"install-test","eta_minutes":5,"broadcast":false,"dry_run":true}' "$BASE_URL?action=setMaintenanceMode" 2>/dev/null || true)"
if echo "$MAINT_SET_OUT" | grep -q '"success":true'; then
  log "Teste setMaintenanceMode OK (dry_run)."
else
  warn "Teste setMaintenanceMode falhou. Saida: $MAINT_SET_OUT"
fi

WATCHDOG_STATUS_OUT="$(curl -s -H "x-sync-secret: $SECRET" "$BASE_URL?action=getWatchdogStatus" 2>/dev/null || true)"
if echo "$WATCHDOG_STATUS_OUT" | grep -q '"watchdog"'; then
  log "Teste getWatchdogStatus OK."
else
  warn "Teste getWatchdogStatus falhou. Saida: $WATCHDOG_STATUS_OUT"
fi

WATCHDOG_CONFIG_OUT="$(curl -s -X POST -H "x-sync-secret: $SECRET" -H "Content-Type: application/json" -d '{"enabled":true,"critical_services":["gdeliveryd","glinkd"],"failure_threshold":2,"cooldown_seconds":60,"max_restart_attempts":2,"verify_restart":true,"pause_during_maintenance":true,"dry_run":true}' "$BASE_URL?action=saveWatchdogConfig" 2>/dev/null || true)"
if echo "$WATCHDOG_CONFIG_OUT" | grep -q '"success":true'; then
  log "Teste saveWatchdogConfig OK (dry_run)."
else
  warn "Teste saveWatchdogConfig falhou. Saida: $WATCHDOG_CONFIG_OUT"
fi

RESTART_DRY_OUT="$(curl -s -X POST -H "x-sync-secret: $SECRET" -H "Content-Type: application/json" -d '{"reason":"install-test","countdown_seconds":60,"broadcast":true,"enable_maintenance":true,"backup_before_restart":true,"verify_after_restart":true,"dry_run":true}' "$BASE_URL?action=restartServer" 2>/dev/null || true)"
if echo "$RESTART_DRY_OUT" | grep -q '"success":true'; then
  log "Teste restartServer OK (dry_run, usa autostart por padrao)."
else
  warn "Teste restartServer falhou. Saida: $RESTART_DRY_OUT"
fi

RESTART_WITH_INSTANCES_DRY_OUT="$(curl -s -X POST -H "x-sync-secret: $SECRET" -H "Content-Type: application/json" -d '{"reason":"install-test","countdown_seconds":60,"broadcast":true,"enable_maintenance":true,"backup_before_restart":true,"verify_after_restart":true,"instances":["is24","is25"],"dry_run":true}' "$BASE_URL?action=restartServer" 2>/dev/null || true)"
if echo "$RESTART_WITH_INSTANCES_DRY_OUT" | grep -q '"success":true'; then
  log "Teste restartServer com instancias OK (dry_run)."
else
  warn "Teste restartServer com instancias falhou. Saida: $RESTART_WITH_INSTANCES_DRY_OUT"
fi

START_DRY_OUT="$(curl -s -X POST -H "x-sync-secret: $SECRET" -H "Content-Type: application/json" -d '{"verify":true,"dry_run":true}' "$BASE_URL?action=startServer" 2>/dev/null || true)"
if echo "$START_DRY_OUT" | grep -q '"success":true'; then
  log "Teste startServer OK (dry_run, usa autostart por padrao)."
else
  warn "Teste startServer falhou. Saida: $START_DRY_OUT"
fi

START_WITH_INSTANCES_DRY_OUT="$(curl -s -X POST -H "x-sync-secret: $SECRET" -H "Content-Type: application/json" -d '{"verify":true,"instances":["is24","is25"],"dry_run":true}' "$BASE_URL?action=startServer" 2>/dev/null || true)"
if echo "$START_WITH_INSTANCES_DRY_OUT" | grep -q '"success":true'; then
  log "Teste startServer com instancias OK (dry_run)."
else
  warn "Teste startServer com instancias falhou. Saida: $START_WITH_INSTANCES_DRY_OUT"
fi

SERVICE_DRY_OUT="$(curl -s -X POST -H "x-sync-secret: $SECRET" -H "Content-Type: application/json" -d '{"services":["gdeliveryd","glinkd"],"verify":true,"dry_run":true}' "$BASE_URL?action=restartService" 2>/dev/null || true)"
if echo "$SERVICE_DRY_OUT" | grep -q '"success":true'; then
  log "Teste restartService OK (dry_run)."
else
  warn "Teste restartService falhou. Saida: $SERVICE_DRY_OUT"
fi

BAN_ROUTE_OUT="$(curl -s -X POST -H "x-sync-secret: $SECRET" -H "Content-Type: application/json" -d '{"userid":1,"reason":"install-test","duration_seconds":60,"dry_run":true}' "$BASE_URL?action=banAccount" 2>/dev/null || true)"
if echo "$BAN_ROUTE_OUT" | grep -q '"success":true'; then
  log "Teste banAccount OK (dry_run)."
else
  warn "Teste banAccount falhou. Saida: $BAN_ROUTE_OUT"
fi

UNBAN_ROUTE_OUT="$(curl -s -X POST -H "x-sync-secret: $SECRET" -H "Content-Type: application/json" -d '{"userid":1,"reason":"install-test","dry_run":true}' "$BASE_URL?action=unbanAccount" 2>/dev/null || true)"
if echo "$UNBAN_ROUTE_OUT" | grep -q '"success":true'; then
  log "Teste unbanAccount OK (dry_run)."
else
  warn "Teste unbanAccount falhou. Saida: $UNBAN_ROUTE_OUT"
fi

if [ -d /home/gamedbd ]; then
  BACKUP_NOW_DRY_OUT="$(curl -s -X POST -H "x-sync-secret: $SECRET" -H "Content-Type: application/json" -d '{"type":"full","reason":"install-test","dry_run":true}' "$BASE_URL?action=backupNow" 2>/dev/null || true)"
  if echo "$BACKUP_NOW_DRY_OUT" | grep -q '"success":true'; then
    log "Teste backupNow OK (dry_run)."
  else
    warn "Teste backupNow falhou. Saida: $BACKUP_NOW_DRY_OUT"
  fi

  BACKUP_OUT="$(curl -s -X POST -H "x-sync-secret: $SECRET" -H "Content-Type: application/json" -d '{"reason":"install-test","force":true}' "$BASE_URL?action=backupGamedbd" 2>/dev/null || true)"
  if echo "$BACKUP_OUT" | grep -q '"success":true'; then
    log "Teste backupGamedbd OK."
  else
    warn "Teste backupGamedbd falhou. Saida: $BACKUP_OUT"
  fi
fi

PUBLIC_IP="$(curl -fsS --max-time 3 https://api.ipify.org 2>/dev/null || hostname -I 2>/dev/null | awk '{print $1}' || true)"

cat <<EOF

============================================================
PW Admin API CLS instalada.

URL local:   $BASE_URL
URL painel:  http://${PUBLIC_IP:-SEU_IP}/apicls/api_cls.php
Secret:     $SECRET
Usuario web: $WEB_USER

Cadastre/atualize estes dados em: PW Admin -> Servidores

Observacao:
  Se backupNow type=mysql ou type=full falhar com Access denied no mysqldump,
  crie /root/.my.cnf com credenciais validas do MariaDB antes de repetir o teste.
  O cron do watchdog foi instalado em /etc/cron.d/apicls-watchdog e roda a cada minuto.
  Os workers do GM Commander V2 foram instalados em /etc/cron.d/apicls-gm-v2 e rodam a cada minuto.

Comandos de validacao:
  php -l $INSTALL_DIR/api_cls.php
  php -l $INSTALL_DIR/gm-queue-worker.php
  php -l $INSTALL_DIR/gm-schedule-worker.php
  curl -s -H "x-sync-secret: $SECRET" "$BASE_URL?action=getClasses"
  curl -s -H "x-sync-secret: $SECRET" "$BASE_URL?action=getBulkSchedules&limit=20"
  curl -s -X POST -H "x-sync-secret: $SECRET" -H "Content-Type: application/json" -d '{}' "$BASE_URL?action=runDueBulkSchedules"
  curl -s -H "x-sync-secret: $SECRET" "$BASE_URL?action=getServiceStatus"
  curl -s -H "x-sync-secret: $SECRET" "$BASE_URL?action=getControlCenterSnapshot"
  curl -s -H "x-sync-secret: $SECRET" "$BASE_URL?action=getManageableServices"
  curl -s -H "x-sync-secret: $SECRET" "$BASE_URL?action=getManageableInstances"
  curl -s -H "x-sync-secret: $SECRET" "$BASE_URL?action=getServerLogs&source=apicls&lines=20"
  curl -s -H "x-sync-secret: $SECRET" "$BASE_URL?action=getServerLogs&source=gdeliveryd&lines=20"
  curl -s -H "x-sync-secret: $SECRET" "$BASE_URL?action=getServerLogs&source=gs01&lines=20"
  curl -s -H "x-sync-secret: $SECRET" "$BASE_URL?action=getServerLogs&source=world2.formatlog&lines=20"
  curl -s -H "x-sync-secret: $SECRET" "$BASE_URL?action=listBackups&limit=20"
  curl -s -H "x-sync-secret: $SECRET" "$BASE_URL?action=getRestorePlan"
  curl -s -H "x-sync-secret: $SECRET" "$BASE_URL?action=getRestoreHistory&limit=20"
  curl -s -H "x-sync-secret: $SECRET" "$BASE_URL?action=getWatchdogStatus"
  curl -s -H "x-sync-secret: $SECRET" "$BASE_URL?action=getWatchdogHistory&limit=20"
  curl -s -H "x-sync-secret: $SECRET" "$BASE_URL?action=getGmPermissionCatalog"
  curl -s -H "x-sync-secret: $SECRET" "$BASE_URL?action=getGmPermissionState&userid=1"
  curl -s -X POST -H "x-sync-secret: $SECRET" -H "Content-Type: application/json" -d '{"enabled":true,"critical_services":["gdeliveryd","glinkd","gamed"],"failure_threshold":2,"cooldown_seconds":60,"max_restart_attempts":3,"verify_restart":true,"pause_during_maintenance":true}' "$BASE_URL?action=saveWatchdogConfig"
  curl -s -X POST -H "x-sync-secret: $SECRET" -H "Content-Type: application/json" -d '{"actor":"manual-test"}' "$BASE_URL?action=enableWatchdog"
  curl -s -X POST -H "x-sync-secret: $SECRET" -H "Content-Type: application/json" -d '{"dry_run":true,"force":true}' "$BASE_URL?action=runWatchdogCheckNow"
  curl -s -X POST -H "x-sync-secret: $SECRET" -H "Content-Type: application/json" -d '{"code":"gs01","enabled":true,"dry_run":true}' "$BASE_URL?action=setInstanceAutoStart"
  curl -s -X POST -H "x-sync-secret: $SECRET" -H "Content-Type: application/json" -d '{"code":"is24","verify":true,"dry_run":true}' "$BASE_URL?action=startInstance"
  curl -s -X POST -H "x-sync-secret: $SECRET" -H "Content-Type: application/json" -d '{"codes":["is24","is25"],"verify":true,"dry_run":true}' "$BASE_URL?action=startInstances"
  curl -s -X POST -H "x-sync-secret: $SECRET" -H "Content-Type: application/json" -d '{"code":"is24","verify":true,"dry_run":true}' "$BASE_URL?action=stopInstance"
  curl -s -X POST -H "x-sync-secret: $SECRET" -H "Content-Type: application/json" -d '{"codes":["is24","is25"],"verify":true,"dry_run":true}' "$BASE_URL?action=stopInstances"
  curl -s -X POST -H "x-sync-secret: $SECRET" -H "Content-Type: application/json" -d '{"code":"is24","verify":true,"dry_run":true}' "$BASE_URL?action=restartInstance"
  curl -s -X POST -H "x-sync-secret: $SECRET" -H "Content-Type: application/json" -d '{"codes":["is24","is25"],"verify":true,"dry_run":true}' "$BASE_URL?action=restartInstances"
  curl -s -H "x-sync-secret: $SECRET" "$BASE_URL?action=getServerOperationStatus"
  curl -s -H "x-sync-secret: $SECRET" "$BASE_URL?action=getServerOperationsHistory&limit=10"
  curl -s -X POST -H "x-sync-secret: $SECRET" -H "Content-Type: application/json" -d '{"type":"mysql","reason":"manual-test","dry_run":true}' "$BASE_URL?action=backupNow"
  curl -s -X POST -H "x-sync-secret: $SECRET" -H "Content-Type: application/json" -d '{"type":"full","reason":"manual-test","dry_run":true}' "$BASE_URL?action=backupNow"
  curl -s -X POST -H "x-sync-secret: $SECRET" -H "Content-Type: application/json" -d '{"reason":"manual-test","force":true}' "$BASE_URL?action=backupGamedbd"
  curl -s -H "x-sync-secret: $SECRET" "$BASE_URL?action=getGmCommandCatalog"
  curl -s -H "x-sync-secret: $SECRET" "$BASE_URL?action=getGmActionHistory&limit=20"
  curl -s -H "x-sync-secret: $SECRET" "$BASE_URL?action=getMallCashBalance&roleid=1024"
  curl -s -X POST -H "x-sync-secret: $SECRET" -H "Content-Type: application/json" -d '{"roleid":1024,"reason":"manual-test","dry_run":true}' "$BASE_URL?action=kickRole"
  curl -s -X POST -H "x-sync-secret: $SECRET" -H "Content-Type: application/json" -d '{"userid":1,"reason":"manual-test","duration_seconds":60,"dry_run":true}' "$BASE_URL?action=muteAccount"
  curl -s -X POST -H "x-sync-secret: $SECRET" -H "Content-Type: application/json" -d '{"roleid":1024,"reason":"manual-test","duration_seconds":60,"dry_run":true}' "$BASE_URL?action=muteRole"
  curl -s -X POST -H "x-sync-secret: $SECRET" -H "Content-Type: application/json" -d '{"roleid":1024,"money":1000,"title":"Compensacao","message":"Teste GM","dry_run":true}' "$BASE_URL?action=sendMailGold"
  curl -s -X POST -H "x-sync-secret: $SECRET" -H "Content-Type: application/json" -d '{"roleid":1024,"amount":1000,"reason":"manual-test","dry_run":true}' "$BASE_URL?action=grantMallCash"
  curl -s -X POST -H "x-sync-secret: $SECRET" -H "Content-Type: application/json" -d '{"userid":1,"reason":"manual-test","dry_run":true}' "$BASE_URL?action=grantGmPermission"
  curl -s -X POST -H "x-sync-secret: $SECRET" -H "Content-Type: application/json" -d '{"message":"manual-test","kind":"system","priority":"normal","dry_run":true}' "$BASE_URL?action=sendSystemMessage"
  curl -s -X POST -H "x-sync-secret: $SECRET" -H "Content-Type: application/json" -d '{"verify":true,"dry_run":true}' "$BASE_URL?action=startServer"
  curl -s -X POST -H "x-sync-secret: $SECRET" -H "Content-Type: application/json" -d '{"verify":true,"instances":["is24","is25"],"dry_run":true}' "$BASE_URL?action=startServer"
  curl -s -X POST -H "x-sync-secret: $SECRET" -H "Content-Type: application/json" -d '{"reason":"manual-test","countdown_seconds":60,"broadcast":true,"enable_maintenance":true,"backup_before_restart":true,"verify_after_restart":true,"dry_run":true}' "$BASE_URL?action=restartServer"
  curl -s -X POST -H "x-sync-secret: $SECRET" -H "Content-Type: application/json" -d '{"reason":"manual-test","countdown_seconds":60,"broadcast":true,"enable_maintenance":true,"backup_before_restart":true,"verify_after_restart":true,"instances":["is24","is25"],"dry_run":true}' "$BASE_URL?action=restartServer"
  curl -s -X POST -H "x-sync-secret: $SECRET" -H "Content-Type: application/json" -d '{"services":["gdeliveryd","glinkd"],"verify":true,"dry_run":true}' "$BASE_URL?action=restartService"
============================================================
EOF
