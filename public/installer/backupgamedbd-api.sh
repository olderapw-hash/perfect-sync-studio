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
