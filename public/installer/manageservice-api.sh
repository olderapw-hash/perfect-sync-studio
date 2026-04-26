#!/bin/bash
# manageservice-api.sh
# Wrapper sudo dedicado para start/stop/restart de servicos do PW Admin.
#
# Recebe payload JSON via STDIN:
#   { "action": "start|stop|restart", "service": "<key>" }
#
# Imprime JSON no STDOUT no formato:
#   { "success": bool, "service": "...", "action": "...", "method": "...", "message": "..." }
#
# Sem shell arbitrario: apenas servicos e acoes na whitelist sao aceitos.
# Tudo fora disso retorna exit != 0.

set -uo pipefail

if [ "$(id -u)" != "0" ]; then
  echo '{"success":false,"error":"manageservice-api.sh precisa rodar como root (via sudo)"}' >&2
  exit 10
fi

PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
export PATH

# ---- Whitelists (precisam casar com api_cls.php / serverOpsServiceSelectable). ----
ALLOWED_SERVICES=(gamedbd gdeliveryd gacd glink authd uniquenamed mysql httpd)
ALLOWED_ACTIONS=(start stop restart)

is_in_list() {
  local needle="$1"; shift
  local item
  for item in "$@"; do
    [ "$item" = "$needle" ] && return 0
  done
  return 1
}

emit_json() {
  # $1 = success(bool), $2 = service, $3 = action, $4 = method, $5 = message
  local sk="$1" svc="$2" act="$3" method="$4" msg="$5"
  printf '{"success":%s,"service":"%s","action":"%s","method":"%s","message":"%s"}\n' \
    "$sk" "$svc" "$act" "$method" "$(printf '%s' "$msg" | sed 's/\\/\\\\/g; s/"/\\"/g')"
}

# ---- Le STDIN (JSON). ----
RAW_INPUT="$(cat 2>/dev/null || true)"
if [ -z "${RAW_INPUT:-}" ]; then
  emit_json false "?" "?" "none" "STDIN vazio (esperado JSON)"
  exit 11
fi

# Parse JSON com python (sempre presente em CentOS/RHEL/Debian).
PARSED="$(printf '%s' "$RAW_INPUT" | python3 -c '
import sys, json
try:
    d = json.load(sys.stdin)
    a = str(d.get("action","")).strip().lower()
    s = str(d.get("service","")).strip().lower()
    print(a + "\n" + s)
except Exception as e:
    print("__ERR__:" + str(e))
' 2>/dev/null || true)"

if [[ "$PARSED" == __ERR__:* ]]; then
  emit_json false "?" "?" "none" "JSON invalido: ${PARSED#__ERR__:}"
  exit 12
fi

ACTION="$(printf '%s' "$PARSED" | sed -n '1p')"
SERVICE="$(printf '%s' "$PARSED" | sed -n '2p')"

if [ -z "$ACTION" ] || [ -z "$SERVICE" ]; then
  emit_json false "${SERVICE:-?}" "${ACTION:-?}" "none" "campos action e service obrigatorios"
  exit 13
fi

if ! is_in_list "$ACTION" "${ALLOWED_ACTIONS[@]}"; then
  emit_json false "$SERVICE" "$ACTION" "none" "Acao nao permitida"
  exit 14
fi
if ! is_in_list "$SERVICE" "${ALLOWED_SERVICES[@]}"; then
  emit_json false "$SERVICE" "$ACTION" "none" "Servico nao permitido"
  exit 15
fi

# ---- Resolucao de unidades systemd / fallback PW. ----
# Para servicos do PW (gamedbd/gdeliveryd/...), tentamos systemctl primeiro
# (se houver unit homonima), senao caimos para scripts conhecidos do PW.
SYSTEMD_UNIT=""
case "$SERVICE" in
  mysql)   SYSTEMD_UNIT_CANDIDATES=("mariadb" "mysqld" "mysql") ;;
  httpd)   SYSTEMD_UNIT_CANDIDATES=("httpd" "apache2") ;;
  *)       SYSTEMD_UNIT_CANDIDATES=("$SERVICE") ;;
esac

if command -v systemctl >/dev/null 2>&1; then
  for unit in "${SYSTEMD_UNIT_CANDIDATES[@]}"; do
    if systemctl list-unit-files "${unit}.service" 2>/dev/null | grep -q "^${unit}.service"; then
      SYSTEMD_UNIT="$unit"
      break
    fi
  done
fi

run_systemctl() {
  local unit="$1" verb="$2"
  local out exit_code
  out="$(systemctl "$verb" "$unit" 2>&1)"; exit_code=$?
  if [ $exit_code -eq 0 ]; then
    emit_json true "$SERVICE" "$ACTION" "systemctl:$unit" "ok"
    return 0
  fi
  emit_json false "$SERVICE" "$ACTION" "systemctl:$unit" "$(printf '%s' "$out" | tr '\n' ' ' | head -c 240)"
  return $exit_code
}

# ---- 1) systemd quando disponivel. ----
if [ -n "$SYSTEMD_UNIT" ]; then
  case "$ACTION" in
    start)   run_systemctl "$SYSTEMD_UNIT" start;   exit $? ;;
    stop)    run_systemctl "$SYSTEMD_UNIT" stop;    exit $? ;;
    restart) run_systemctl "$SYSTEMD_UNIT" restart; exit $? ;;
  esac
fi

# ---- 2) Fallback para daemons do PW (script local /home/<svc>/start). ----
PW_HOME="/home/${SERVICE}"
PW_BIN="${PW_HOME}/${SERVICE}"
PW_START="${PW_HOME}/start"
PW_STOP="${PW_HOME}/stop"

pw_pids() {
  pgrep -f "$1" 2>/dev/null || true
}

pw_kill() {
  local svc="$1"
  local pids
  pids="$(pw_pids "$svc")"
  if [ -z "$pids" ]; then
    return 0
  fi
  # SIGTERM educado, depois SIGKILL.
  echo "$pids" | xargs -r kill -TERM 2>/dev/null || true
  for i in 1 2 3 4 5; do
    pids="$(pw_pids "$svc")"
    [ -z "$pids" ] && return 0
    sleep 1
  done
  pids="$(pw_pids "$svc")"
  [ -n "$pids" ] && echo "$pids" | xargs -r kill -KILL 2>/dev/null || true
  return 0
}

pw_start() {
  local svc="$1"
  if [ ! -d "$PW_HOME" ]; then
    emit_json false "$svc" "$ACTION" "pw:script" "Diretorio nao encontrado: $PW_HOME"
    return 16
  fi
  if [ -x "$PW_START" ]; then
    ( cd "$PW_HOME" && "$PW_START" >/dev/null 2>&1 )
    emit_json true "$svc" "$ACTION" "pw:start" "ok"
    return 0
  fi
  if [ -x "$PW_BIN" ]; then
    # Best-effort generico: roda o binario do daemon em background.
    ( cd "$PW_HOME" && nohup "$PW_BIN" >/dev/null 2>&1 & )
    emit_json true "$svc" "$ACTION" "pw:bin" "started in background"
    return 0
  fi
  emit_json false "$svc" "$ACTION" "pw:none" "Sem script start nem binario em $PW_HOME"
  return 17
}

pw_stop() {
  local svc="$1"
  if [ -x "$PW_STOP" ]; then
    ( cd "$PW_HOME" && "$PW_STOP" >/dev/null 2>&1 ) || true
    emit_json true "$svc" "$ACTION" "pw:stop" "ok"
    return 0
  fi
  pw_kill "$svc"
  emit_json true "$svc" "$ACTION" "pw:signal" "SIGTERM/SIGKILL enviados"
  return 0
}

case "$ACTION" in
  start)   pw_start "$SERVICE"; exit $? ;;
  stop)    pw_stop  "$SERVICE"; exit $? ;;
  restart)
           pw_stop  "$SERVICE" >/dev/null 2>&1 || true
           sleep 1
           pw_start "$SERVICE"; exit $?
           ;;
esac

emit_json false "$SERVICE" "$ACTION" "none" "Sem caminho de execucao"
exit 99
