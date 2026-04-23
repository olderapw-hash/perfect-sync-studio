# PW Admin - Instalacao da API na VPS

Este pacote instala a ponte HTTP que conecta sua VPS Perfect World ao PW Admin.

A API correta e a `api_cls.php` completa, que fala com o `gamedbd` em
`127.0.0.1:29400`, lista templates CLS, edita personagens reais, cria backups,
restaura backups e consulta catalogo de itens.

> Nao use a versao antiga baseada em `/home/gamedbd/clsconfig.data`. Ela retorna
> `count:0` / `classes:[]` e nao e compativel com o painel atual.

## Requisitos

- CentOS 7 ou equivalente.
- Acesso SSH como `root`.
- Perfect World instalado em `/home/gamedbd`.
- Apache/httpd com PHP 7+ ou PHP 8.x. O instalador tenta instalar PHP 8.2 via Remi se o PHP estiver ausente ou antigo.
- Secret gerado no painel em `Servidores`.

## Instalacao automatica

Suba estes dois arquivos para a VPS:

- `api_cls.php`
- `install-apicls-centos7.sh`

No seu computador:

```powershell
scp "api_cls.php" root@IP_DA_VPS:/root/api_cls.php
scp "install-apicls-centos7.sh" root@IP_DA_VPS:/root/install-apicls-centos7.sh
```

Na VPS:

```bash
bash /root/install-apicls-centos7.sh --secret SEU_SECRET --api-src /root/api_cls.php
```

O instalador faz automaticamente:

- Instala/ativa Apache e PHP quando necessario.
- Cria `/var/www/html/apicls`.
- Instala o `api_cls.php` com seu secret.
- Instala `/usr/local/sbin/exportclsconfig-api.sh`.
- Instala `/usr/local/sbin/backupgamedbd-api.sh`.
- Configura `/etc/sudoers.d/apicls-pwadmin`.
- Cria pastas de backup.
- Ajusta permissoes.
- Reinicia o Apache.
- Testa `getClasses`.
- Testa `backupGamedbd`.

Ao finalizar, ele imprime:

- URL local.
- URL para cadastrar no painel.
- Secret usado.
- Usuario web detectado.

## Comando recomendado

```bash
bash /root/install-apicls-centos7.sh --secret SEU_SECRET --api-src /root/api_cls.php
```

Se quiser que o instalador gere um secret novo:

```bash
bash /root/install-apicls-centos7.sh --api-src /root/api_cls.php
```

Depois cadastre o secret gerado em `PW Admin -> Servidores`.

## Testes manuais

Na VPS:

```bash
php -l /var/www/html/apicls/api_cls.php
```

```bash
curl -s -H "x-sync-secret: SEU_SECRET" \
"http://127.0.0.1/apicls/api_cls.php?action=getClasses"
```

```bash
curl -s -H "x-sync-secret: SEU_SECRET" \
"http://127.0.0.1/apicls/api_cls.php?action=getClsconfigDebug" \
| head -c 3000
```

```bash
curl -s -X POST -H "x-sync-secret: SEU_SECRET" -H "Content-Type: application/json" \
-d '{"reason":"manual-test","force":true}' \
"http://127.0.0.1/apicls/api_cls.php?action=backupGamedbd"
```

Resultado esperado do backup:

```json
{"success":true,"backup":{"type":"gamedbd_backup","file":"...gamedbd-backup-....tgz"}}
```

## Cadastro no painel

No PW Admin:

1. Abra `Servidores`.
2. Adicione ou edite a VPS.
3. URL da API:

```text
http://IP_DA_VPS/apicls/api_cls.php
```

4. Secret: o mesmo usado no instalador.
5. Clique em `Testar conexao`.
6. Ative esse servidor.

As chamadas do painel devem usar o servidor ativo em `Servidores`, nao a conexao
legada da tela de Configuracoes.

## Backups automaticos

A API cria backup completo antes das operacoes sensiveis:

- `saveRoleEditable`
- `saveClsconfigTemplate`
- `restoreBackup`
- `exportClsconfig`

O backup fica em:

```text
/var/www/html/apicls/backups/gamedbd/
```

Ele inclui, quando existirem:

- `/home/gamedbd/gamesys.conf`
- `/home/gamedbd/clsconfig`
- `/home/gamedbd/dbdata`
- `/home/gamedbd/dblogs`
- `/home/gamedbd/dbhome`
- `/home/gamedbd/backup`

Durante aplicacoes em massa, a API reutiliza backup recente por alguns minutos
para nao lotar o disco.

## Sudoers instalado

O instalador cria `/etc/sudoers.d/apicls-pwadmin` com:

```text
apache ALL=(root) NOPASSWD: /usr/local/sbin/exportclsconfig-api.sh
apache ALL=(root) NOPASSWD: /usr/local/sbin/backupgamedbd-api.sh
```

Se sua VPS usa outro usuario web (`nginx` ou `www-data`), rode:

```bash
bash /root/install-apicls-centos7.sh --secret SEU_SECRET --api-src /root/api_cls.php --web-user nginx
```

## Solucao de problemas

| Sintoma | Causa provavel | Como resolver |
|---|---|---|
| `Unauthorized` | Secret errado no painel ou no PHP | Compare o secret em `/var/www/html/apicls/api_cls.php` com `Servidores` |
| `classes: []` | API antiga ou secret/servidor errado | Garanta que `api_cls.php` contem `backupGamedbd` e `CLASS_INFO` |
| `count:0` com classes preenchidas | `gamedbd` nao respondeu ou `clsconfig` vazio | Rode `getClsconfigDebug` |
| `Connection refused 127.0.0.1:29400` | `gamedbd` desligado | Inicie o `gamedbd` e teste `ss -lntp | grep 29400` |
| `Backup gamedbd falhou` | sudoers/permissao faltando | Rode `visudo -cf /etc/sudoers.d/apicls-pwadmin` |
| Tela usa VPS errada | Painel lendo configuracao legada | Usar `Servidores` e servidor ativo |

## Atualizacao futura

Para atualizar a API:

```powershell
scp "api_cls.php" root@IP_DA_VPS:/root/api_cls.php
scp "install-apicls-centos7.sh" root@IP_DA_VPS:/root/install-apicls-centos7.sh
```

Na VPS:

```bash
bash /root/install-apicls-centos7.sh --secret SEU_SECRET --api-src /root/api_cls.php
```

O instalador cria backup da instalacao anterior em `/root/apicls-before-install-*.tgz`.
