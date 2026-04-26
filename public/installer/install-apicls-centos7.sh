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
    SECRET="$(tr -dc 'a-zA-Z0-9' </dev/urandom | head -c 40 || true)"
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
mkdir -p "$INSTALL_DIR/backups/gamedbd"
mkdir -p "$INSTALL_DIR/backups/mail-logs"
mkdir -p "$INSTALL_DIR/backups/mail-queue"

cp -f "$TMP_API" "$INSTALL_DIR/api_cls.php"

# ===== Handler PHP do correio (pw_send_mail.php) =====
# Procura ao lado do instalador. Se nao achar, escreve um stub minimo para
# que api_cls.php nao quebre (o stub sempre devolve queued=true).
TMP_MAIL="$TMP_DIR/pw_send_mail.php"
MAIL_SRC="$SCRIPT_DIR/pw_send_mail.php"
if [ -f "$MAIL_SRC" ]; then
  cp -f "$MAIL_SRC" "$TMP_MAIL"
  sed -i 's/\r$//' "$TMP_MAIL"
  php -l "$TMP_MAIL" >/dev/null || die "pw_send_mail.php tem erro de sintaxe."
  log "Usando pw_send_mail.php encontrado em $MAIL_SRC"
else
  warn "pw_send_mail.php nao encontrado ao lado do instalador. Escrevendo stub queue-only."
  cat > "$TMP_MAIL" <<'PHPEOF'
<?php
// Stub instalado quando pw_send_mail.php real nao foi enviado.
// Sempre devolve queued=true para o painel saber que o mail nao foi entregue.
$raw = stream_get_contents(STDIN);
$dec = json_decode((string) $raw, true) ?: [];
echo json_encode([
  'success'   => true,
  'roleid'    => (int) ($dec['roleid'] ?? 0),
  'mail_id'   => null,
  'delivered' => false,
  'queued'    => true,
  'method'    => 'stub',
  'note'      => 'pw_send_mail.php real nao instalado — mail enfileirado',
], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
PHPEOF
fi
install -m 0755 -o root -g root "$TMP_MAIL" /usr/local/bin/pw_send_mail.php
log "pw_send_mail.php instalado em /usr/local/bin/pw_send_mail.php"

# ===== Wrapper sudo do correio (sendreward-api.sh) =====
TMP_REWARD="$TMP_DIR/sendreward-api.sh"
REWARD_SRC="$SCRIPT_DIR/sendreward-api.sh"
if [ -f "$REWARD_SRC" ]; then
  cp -f "$REWARD_SRC" "$TMP_REWARD"
else
  cat > "$TMP_REWARD" <<'SHEOF'
#!/bin/bash
# Wrapper sudo gerado automaticamente. Le JSON via STDIN e delega para
# /usr/local/bin/pw_send_mail.php (executado como root).
set -euo pipefail
PHP_BIN="${PHP_BIN:-/usr/bin/php}"
HANDLER="${PW_SEND_MAIL_HANDLER:-/usr/local/bin/pw_send_mail.php}"
if [ ! -x "$PHP_BIN" ] && command -v php >/dev/null 2>&1; then
  PHP_BIN="$(command -v php)"
fi
if [ ! -f "$HANDLER" ]; then
  echo "Handler nao encontrado: $HANDLER" >&2
  exit 11
fi
if [ "$(id -u)" != "0" ]; then
  echo "sendreward-api.sh precisa rodar como root (via sudo)" >&2
  exit 12
fi
exec "$PHP_BIN" "$HANDLER"
SHEOF
fi
sed -i 's/\r$//' "$TMP_REWARD"
install -m 0750 -o root -g root "$TMP_REWARD" /usr/local/sbin/sendreward-api.sh
log "sendreward-api.sh instalado em /usr/local/sbin/sendreward-api.sh"

# ===== Handler PHP da mensagem de sistema (pw_send_system_message.php) =====
TMP_SYSMSG_PHP="$TMP_DIR/pw_send_system_message.php"
SYSMSG_PHP_SRC="$SCRIPT_DIR/pw_send_system_message.php"
if [ -f "$SYSMSG_PHP_SRC" ]; then
  cp -f "$SYSMSG_PHP_SRC" "$TMP_SYSMSG_PHP"
  sed -i 's/\r$//' "$TMP_SYSMSG_PHP"
  php -l "$TMP_SYSMSG_PHP" >/dev/null || die "pw_send_system_message.php tem erro de sintaxe."
  log "Usando pw_send_system_message.php encontrado em $SYSMSG_PHP_SRC"
else
  warn "pw_send_system_message.php nao encontrado ao lado do instalador. Escrevendo stub queue-only."
  cat > "$TMP_SYSMSG_PHP" <<'PHPEOF'
<?php
// Stub instalado quando pw_send_system_message.php real nao foi enviado.
$raw = stream_get_contents(STDIN);
$dec = json_decode((string) $raw, true) ?: [];
echo json_encode([
  'success'   => true,
  'delivered' => false,
  'queued'    => true,
  'method'    => 'stub',
  'note'      => 'pw_send_system_message.php real nao instalado — mensagem enfileirada',
], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
PHPEOF
fi
install -m 0755 -o root -g root "$TMP_SYSMSG_PHP" /usr/local/bin/pw_send_system_message.php
log "pw_send_system_message.php instalado em /usr/local/bin/pw_send_system_message.php"

# ===== Wrapper sudo da mensagem de sistema (sendsysmsg-api.sh) =====
TMP_SYSMSG_SH="$TMP_DIR/sendsysmsg-api.sh"
SYSMSG_SH_SRC="$SCRIPT_DIR/sendsysmsg-api.sh"
if [ -f "$SYSMSG_SH_SRC" ]; then
  cp -f "$SYSMSG_SH_SRC" "$TMP_SYSMSG_SH"
else
  cat > "$TMP_SYSMSG_SH" <<'SHEOF'
#!/bin/bash
# Wrapper sudo gerado automaticamente. Le JSON via STDIN e delega para
# /usr/local/bin/pw_send_system_message.php (executado como root).
set -euo pipefail
PHP_BIN="${PHP_BIN:-/usr/bin/php}"
HANDLER="${PW_SEND_SYSMSG_HANDLER:-/usr/local/bin/pw_send_system_message.php}"
if [ ! -x "$PHP_BIN" ] && command -v php >/dev/null 2>&1; then
  PHP_BIN="$(command -v php)"
fi
if [ ! -f "$HANDLER" ]; then
  echo "Handler nao encontrado: $HANDLER" >&2
  exit 11
fi
if [ "$(id -u)" != "0" ]; then
  echo "sendsysmsg-api.sh precisa rodar como root (via sudo)" >&2
  exit 12
fi
exec "$PHP_BIN" "$HANDLER"
SHEOF
fi
sed -i 's/\r$//' "$TMP_SYSMSG_SH"
install -m 0750 -o root -g root "$TMP_SYSMSG_SH" /usr/local/sbin/sendsysmsg-api.sh
log "sendsysmsg-api.sh instalado em /usr/local/sbin/sendsysmsg-api.sh"


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
RAND="$(tr -dc 'a-f0-9' </dev/urandom | head -c 8 || true)"
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

sed -i 's/\r$//' /usr/local/sbin/exportclsconfig-api.sh /usr/local/sbin/backupgamedbd-api.sh
chown root:root /usr/local/sbin/exportclsconfig-api.sh /usr/local/sbin/backupgamedbd-api.sh
chmod 750 /usr/local/sbin/exportclsconfig-api.sh /usr/local/sbin/backupgamedbd-api.sh

if [ -e "$SUDOERS_FILE" ] && [ ! -f "$SUDOERS_FILE" ]; then
  die "$SUDOERS_FILE existe, mas nao e arquivo. Remova ou renomeie esse caminho."
fi

cat > "$SUDOERS_FILE" <<EOF
$WEB_USER ALL=(root) NOPASSWD: /usr/local/sbin/exportclsconfig-api.sh
$WEB_USER ALL=(root) NOPASSWD: /usr/local/sbin/backupgamedbd-api.sh
$WEB_USER ALL=(root) NOPASSWD: /usr/local/sbin/sendreward-api.sh
$WEB_USER ALL=(root) NOPASSWD: /usr/local/sbin/sendsysmsg-api.sh
EOF
chmod 440 "$SUDOERS_FILE"
visudo -cf "$SUDOERS_FILE" >/dev/null || die "sudoers invalido em $SUDOERS_FILE"

chown -R "$WEB_USER:$WEB_USER" "$INSTALL_DIR"
chmod 750 "$INSTALL_DIR"
chmod 640 "$INSTALL_DIR/api_cls.php"
find "$INSTALL_DIR/backups" -type d -exec chmod 750 {} \;
find "$INSTALL_DIR/backups" -type f -exec chmod 640 {} \; 2>/dev/null || true

php -l "$INSTALL_DIR/api_cls.php" >/dev/null || die "api_cls.php instalado com erro de sintaxe."
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

if [ -d /home/gamedbd ]; then
  BACKUP_OUT="$(curl -s -X POST -H "x-sync-secret: $SECRET" -H "Content-Type: application/json" -d '{"reason":"install-test","force":true}' "$BASE_URL?action=backupGamedbd" 2>/dev/null || true)"
  if echo "$BACKUP_OUT" | grep -q '"success":true'; then
    log "Teste backupGamedbd OK."
  else
    warn "Teste backupGamedbd falhou. Saida: $BACKUP_OUT"
  fi
fi

# Teste do correio em modo dry_run — valida rota mas nao envia mail real.
MAIL_OUT="$(curl -s -X POST -H "x-sync-secret: $SECRET" -H "Content-Type: application/json" \
  -d '{"roleid":1,"dry_run":true,"item":{"item_id":11530,"count":1}}' \
  "$BASE_URL?action=sendMailItem" 2>/dev/null || true)"
if echo "$MAIL_OUT" | grep -q '"success":true'; then
  log "Teste sendMailItem (dry_run) OK."
else
  warn "Teste sendMailItem (dry_run) falhou. Saida: $MAIL_OUT"
fi

# Teste da mensagem de sistema em modo dry_run — valida rota mas nao envia.
SYSMSG_OUT="$(curl -s -X POST -H "x-sync-secret: $SECRET" -H "Content-Type: application/json" \
  -d '{"message":"installer dry-run","kind":"system","priority":"normal","dry_run":true}' \
  "$BASE_URL?action=sendSystemMessage" 2>/dev/null || true)"
if echo "$SYSMSG_OUT" | grep -q '"success":true'; then
  log "Teste sendSystemMessage (dry_run) OK."
else
  warn "Teste sendSystemMessage (dry_run) falhou. Saida: $SYSMSG_OUT"
fi

# Teste do modo manutencao (get + dry_run set) — sem alterar estado real.
MAINT_GET="$(curl -s -H "x-sync-secret: $SECRET" "$BASE_URL?action=getMaintenanceMode" 2>/dev/null || true)"
if echo "$MAINT_GET" | grep -q '"success":true'; then
  log "Teste getMaintenanceMode OK."
else
  warn "Teste getMaintenanceMode falhou. Saida: $MAINT_GET"
fi
MAINT_DRY="$(curl -s -X POST -H "x-sync-secret: $SECRET" -H "Content-Type: application/json" \
  -d '{"enabled":true,"reason":"installer dry-run","eta_minutes":1,"broadcast":false,"dry_run":true}' \
  "$BASE_URL?action=setMaintenanceMode" 2>/dev/null || true)"
if echo "$MAINT_DRY" | grep -q '"success":true'; then
  log "Teste setMaintenanceMode (dry_run) OK."
else
  warn "Teste setMaintenanceMode (dry_run) falhou. Saida: $MAINT_DRY"
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

Comandos de validacao:
  php -l $INSTALL_DIR/api_cls.php
  curl -s -H "x-sync-secret: $SECRET" "$BASE_URL?action=getClasses"
  curl -s -X POST -H "x-sync-secret: $SECRET" -H "Content-Type: application/json" -d '{"reason":"manual-test","force":true}' "$BASE_URL?action=backupGamedbd"
  curl -s -X POST -H "x-sync-secret: $SECRET" -H "Content-Type: application/json" -d '{"roleid":1,"dry_run":true,"item":{"item_id":11530,"count":1}}' "$BASE_URL?action=sendMailItem"
  curl -s -X POST -H "x-sync-secret: $SECRET" -H "Content-Type: application/json" -d '{"message":"teste manual","kind":"system","dry_run":true}' "$BASE_URL?action=sendSystemMessage"
  curl -s -H "x-sync-secret: $SECRET" "$BASE_URL?action=getMaintenanceMode"
  curl -s -X POST -H "x-sync-secret: $SECRET" -H "Content-Type: application/json" -d '{"enabled":true,"reason":"teste","eta_minutes":1,"broadcast":false,"dry_run":true}' "$BASE_URL?action=setMaintenanceMode"

Correio (sendMailItem / sendMailGold):
  Handler: /usr/local/bin/pw_send_mail.php
  Wrapper: /usr/local/sbin/sendreward-api.sh (sudo NOPASSWD)
  Logs:    $INSTALL_DIR/backups/mail-logs/
  Queue:   $INSTALL_DIR/backups/mail-queue/
  Para entrega imediata edite /etc/pw_send_mail.conf apontando seu
  send_mail.lua / deliveryd_console.

Mensagem de sistema (sendSystemMessage):
  Handler: /usr/local/bin/pw_send_system_message.php
  Wrapper: /usr/local/sbin/sendsysmsg-api.sh (sudo NOPASSWD)
  Logs:    $INSTALL_DIR/backups/sysmsg-logs/
  Queue:   $INSTALL_DIR/backups/sysmsg-queue/
  Para entrega imediata edite /etc/pw_send_system_message.conf apontando
  seu send_system_message.lua / deliveryd_console.

Modo manutencao (setMaintenanceMode / getMaintenanceMode):
  Estado:  $INSTALL_DIR/backups/maintenance/state.json
  Log:     $INSTALL_DIR/backups/maintenance/history.log
  Sem wrapper sudo dedicado: o estado e gravado pelo proprio usuario web.
  Quando enabled=true e broadcast=true, dispara automaticamente
  sendSystemMessage (alta prioridade) com motivo + ETA.
============================================================
EOF
