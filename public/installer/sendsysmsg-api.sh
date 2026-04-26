#!/bin/bash
# sendsysmsg-api.sh — wrapper sudo chamado por api_cls.php (Apache/PHP).
#
# Lê JSON do STDIN, delega para /usr/local/bin/pw_send_system_message.php
# executando como root (necessário para console do gdeliveryd / sockets
# locais), e devolve a resposta no STDOUT.
#
# Instalado pelo install-apicls-centos7.sh em /usr/local/sbin/.
# Sudoers (NOPASSWD) configurado para o usuário web (apache/nginx/www-data).

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
