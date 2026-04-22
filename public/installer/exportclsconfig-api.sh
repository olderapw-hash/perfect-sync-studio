#!/bin/sh
# exportclsconfig-api.sh
# Wrapper executado pelo api_cls.php (via sudo NOPASSWD) para regenerar
# o clsconfig consolidado a partir do gamedbd.
#
# Instalar em: /usr/local/sbin/exportclsconfig-api.sh
# Permissões:  chown root:root && chmod 750
# Sudoers:     ver sudoers.example

export HOME=/home/gamedbd
export PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
ulimit -n 65535 2>/dev/null || true

cd /home/gamedbd || exit 10

exec ./gamedbd ./gamesys.conf exportclsconfig
