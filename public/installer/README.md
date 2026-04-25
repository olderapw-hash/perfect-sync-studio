# PW Admin - Instalacao da API na VPS

Este pacote instala a ponte HTTP que conecta sua VPS Perfect World ao PW Admin.

A API correta e a `api_cls.php` completa, que fala com o `gamedbd` em
`127.0.0.1:29400`, lista templates CLS, edita personagens reais, cria backups,
restaura backups, consulta catalogo de itens **e entrega correio (item/gold)
via gdeliveryd**.

> A versao antiga baseada apenas em `clsconfig` ja nao e mais suportada — esta
> aqui inclui `getRoleEditable`, `saveRoleEditable`, `restoreBackup`,
> `backupGamedbd`, `sendMailItem` e `sendMailGold`.

## Requisitos

- CentOS 7 ou equivalente.
- Acesso SSH como `root`.
- Perfect World instalado em `/home/gamedbd` (e `/home/gdeliveryd` para correio real).
- Apache/httpd com PHP 7+ ou PHP 8.x. O instalador tenta instalar PHP 8.2 via Remi se o PHP estiver ausente ou antigo.
- Secret gerado no painel em **Servidores**.

## Instalacao automatica

Suba estes tres arquivos para a VPS:

- `api_cls.php`
- `install-apicls-centos7.sh`
- `pw_send_mail.php` (opcional mas recomendado — sem ele o correio fica em modo *queue-only*)
- `sendreward-api.sh` (opcional — o instalador embute um padrao se ausente)

No seu computador:

```powershell
scp api_cls.php root@IP_DA_VPS:/root/api_cls.php
scp install-apicls-centos7.sh root@IP_DA_VPS:/root/install-apicls-centos7.sh
scp pw_send_mail.php root@IP_DA_VPS:/root/pw_send_mail.php
scp sendreward-api.sh root@IP_DA_VPS:/root/sendreward-api.sh
```

Na VPS:

```bash
bash /root/install-apicls-centos7.sh --secret SEU_SECRET --api-src /root/api_cls.php
```

O instalador faz automaticamente:

- Instala/ativa Apache e PHP quando necessario.
- Cria `/var/www/html/apicls`.
- Instala o `api_cls.php` com seu secret embutido.
- Instala `/usr/local/bin/pw_send_mail.php` (handler do correio).
- Instala `/usr/local/sbin/sendreward-api.sh` (wrapper sudo do correio).
- Instala `/usr/local/sbin/exportclsconfig-api.sh`.
- Instala `/usr/local/sbin/backupgamedbd-api.sh`.
- Configura `/etc/sudoers.d/apicls-pwadmin` com os 3 comandos.
- Cria pastas de backup, mail-logs e mail-queue.
- Ajusta permissoes.
- Reinicia o Apache.
- Testa `getClasses`, `backupGamedbd` e `sendMailItem` (em `dry_run`).

Ao finalizar, ele imprime:

- URL local.
- URL para cadastrar no painel.
- Secret usado.
- Usuario web detectado.
- Caminhos do correio (handler, wrapper, logs, queue).

## Comando recomendado

```bash
bash /root/install-apicls-centos7.sh --secret SEU_SECRET --api-src /root/api_cls.php
```

Se quiser que o instalador gere um secret novo:

```bash
bash /root/install-apicls-centos7.sh --api-src /root/api_cls.php
```

Depois cadastre o secret gerado em **PW Admin → Servidores**.

## Origem da conexao

O painel **sempre** usa o servidor ativo cadastrado em **Servidores** —
URL e secret vem de la, nao da tela antiga de Configuracoes. Para trocar
de VPS, basta selecionar outro servidor na sidebar; nao precisa rodar o
instalador de novo.

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

### Correio — modo dry_run (nao envia nada de verdade)

Use `dry_run: true` para validar payload e roteamento sem chamar o `gdeliveryd`:

```bash
curl -s -X POST -H "x-sync-secret: SEU_SECRET" -H "Content-Type: application/json" \
-d '{"roleid":1024,"dry_run":true,"item":{"item_id":11530,"count":1}}' \
"http://127.0.0.1/apicls/api_cls.php?action=sendMailItem"
```

```bash
curl -s -X POST -H "x-sync-secret: SEU_SECRET" -H "Content-Type: application/json" \
-d '{"roleid":1024,"dry_run":true,"amount":1000000}' \
"http://127.0.0.1/apicls/api_cls.php?action=sendMailGold"
```

Resposta esperada do `dry_run`:

```json
{"success":true,"dry_run":true,"roleid":1024,"kind":"item","validated":true,"payload":{...}}
```

### Correio — envio real

Sem `dry_run`, o `api_cls.php` chama o wrapper `sendreward-api.sh` que executa
`pw_send_mail.php`. Esse handler tenta entregar via `send_mail.lua` no console
do `gdeliveryd`. Se nao houver mecanismo configurado, o mail e **enfileirado**
em `/var/www/html/apicls/backups/mail-queue/` e a resposta volta com
`delivered: false, queued: true` para o painel registrar o status correto.

```bash
curl -s -X POST -H "x-sync-secret: SEU_SECRET" -H "Content-Type: application/json" \
-d '{"roleid":1024,"subject":"Recompensa","body":"Obrigado!","item":{"item_id":11530,"count":5}}' \
"http://127.0.0.1/apicls/api_cls.php?action=sendMailItem"
```

Para entrega imediata, configure `/etc/pw_send_mail.conf`:

```ini
gdeliveryd_dir    = /home/gdeliveryd
send_mail_lua     = /home/gdeliveryd/script/send_mail.lua
deliveryd_console = /home/gdeliveryd/gdeliveryd
```

### Eventos ingame — registerIngameParticipation

O NPC/script ingame chama o `api_cls.php`, que repassa para o Supabase
via RPC `register_ingame_participation`. **Antes de testar**, edite o
`/var/www/html/apicls/api_cls.php` e preencha:

```php
'ingame_enabled'             => true,
'supabase_url'               => 'https://SEU_PROJ.supabase.co',
'supabase_service_role_key'  => 'eyJhbGciOi...', // service role, NUNCA expor publicamente
'ingame_default_tenant_id'   => 'uuid-do-servidor', // opcional
```

Teste manual:

```bash
curl -s -X POST -H "x-sync-secret: SEU_SECRET" -H "Content-Type: application/json" \
  -d '{"event_id":"UUID-DO-EVENTO","roleid":1024,"role_name":"Foo","npc_id":4001}' \
  "http://127.0.0.1/apicls/api_cls.php?action=registerIngameParticipation"
```

Resposta esperada (sucesso):

```json
{"success":true,"status":"registered","message":"Participacao registrada com sucesso","id":"uuid","duplicate":false}
```

Logs em `/var/www/html/apicls/backups/ingame-logs/YYYY-MM-DD.log`.

## Cadastro no painel

No PW Admin:

1. Abra **Servidores**.
2. Adicione ou edite a VPS.
3. URL da API:

```text
http://IP_DA_VPS/apicls/api_cls.php
```

4. Secret: o mesmo usado no instalador.
5. Clique em **Testar conexao**.
6. Ative esse servidor.

As chamadas do painel devem usar o servidor ativo em **Servidores**, nao a
conexao legada da tela de Configuracoes.

## Backups automaticos

A API cria backup completo antes das operacoes sensiveis:

- `saveRoleEditable`
- `saveClsconfigTemplate`
- `restoreBackup`
- `exportClsconfig`

Os endpoints de correio (`sendMailItem` / `sendMailGold`) **nao** disparam
`backupGamedbd` automatico — eles apenas registram em
`/var/www/html/apicls/backups/mail-logs/`. Se quiser backup manual antes de
um envio em massa, chame `backupGamedbd` explicitamente.

O backup do `gamedbd` fica em:

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
apache ALL=(root) NOPASSWD: /usr/local/sbin/sendreward-api.sh
```

Se sua VPS usa outro usuario web (`nginx` ou `www-data`), rode:

```bash
bash /root/install-apicls-centos7.sh --secret SEU_SECRET --api-src /root/api_cls.php --web-user nginx
```

## Solucao de problemas

| Sintoma | Causa provavel | Como resolver |
|---|---|---|
| `Unauthorized` | Secret errado no painel ou no PHP | Compare o secret em `/var/www/html/apicls/api_cls.php` com **Servidores** |
| `classes: []` | API antiga ou secret/servidor errado | Garanta que `api_cls.php` contem `backupGamedbd` e `CLASS_INFO` |
| `count:0` com classes preenchidas | `gamedbd` nao respondeu ou `clsconfig` vazio | Rode `getClsconfigDebug` |
| `Connection refused 127.0.0.1:29400` | `gamedbd` desligado | Inicie o `gamedbd` e teste `ss -lntp \| grep 29400` |
| `Backup gamedbd falhou` | sudoers/permissao faltando | Rode `visudo -cf /etc/sudoers.d/apicls-pwadmin` |
| `sendMailItem` volta `queued:true` | Sem `send_mail.lua` configurado | Edite `/etc/pw_send_mail.conf` apontando seu lua/console |
| `sendMailItem` volta 400 "Acao invalida" | `api_cls.php` antigo | Reinstale com a versao nova |
| Tela usa VPS errada | Painel lendo configuracao legada | Use **Servidores** e mantenha um servidor ativo |

## Atualizacao futura

Para atualizar a API:

```powershell
scp api_cls.php root@IP_DA_VPS:/root/api_cls.php
scp install-apicls-centos7.sh root@IP_DA_VPS:/root/install-apicls-centos7.sh
scp pw_send_mail.php root@IP_DA_VPS:/root/pw_send_mail.php
scp sendreward-api.sh root@IP_DA_VPS:/root/sendreward-api.sh
```

Na VPS:

```bash
bash /root/install-apicls-centos7.sh --secret SEU_SECRET --api-src /root/api_cls.php
```

O instalador cria backup da instalacao anterior em `/root/apicls-before-install-*.tgz`.
