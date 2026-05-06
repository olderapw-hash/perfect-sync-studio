# PW Admin - Instalacao da API na VPS

Este pacote instala a ponte HTTP que conecta sua VPS Perfect World ao PW Admin.

A API correta e a `api_cls.php` completa, que fala com o `gamedbd` em
`127.0.0.1:29400`, lista templates CLS, edita personagens reais, cria backups,
restaura backups, consulta catalogo de itens, envia correio e executa moderacao
basica (kick/ban/unban).

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
- Instala `/usr/local/bin/pw_send_mail.php`.
- Instala `/usr/local/sbin/sendreward-api.sh`.
- Configura `/etc/sudoers.d/apicls-pwadmin`.
- Cria pastas de backup.
- Ajusta permissoes.
- Reinicia o Apache.
- Testa `getClasses`.
- Testa a rota `sendMailGold`.
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

Teste rapido do correio com validacao local:

```bash
curl -s -X POST -H "x-sync-secret: SEU_SECRET" -H "Content-Type: application/json" \
-d '{"roleid":1024,"title":"Teste","message":"Dry run","money":1,"dry_run":true}' \
"http://127.0.0.1/apicls/api_cls.php?action=sendMailGold"
```

Resultado esperado:

```json
{"success":true,"delivery":{"success":true,"dry_run":true}}
```

Teste rapido de moderacao sem aplicar:

```bash
curl -s -X POST -H "x-sync-secret: SEU_SECRET" -H "Content-Type: application/json" \
-d '{"roleid":1024,"reason":"Teste dry run","dry_run":true}' \
"http://127.0.0.1/apicls/api_cls.php?action=kickRole"
```

```bash
curl -s -X POST -H "x-sync-secret: SEU_SECRET" -H "Content-Type: application/json" \
-d '{"roleid":1024,"reason":"Teste ban temp","duration_seconds":60,"dry_run":true}' \
"http://127.0.0.1/apicls/api_cls.php?action=banAccount"
```

Para banir a conta e derrubar a sessao atual do personagem no mesmo fluxo:

```bash
curl -s -X POST -H "x-sync-secret: SEU_SECRET" -H "Content-Type: application/json" \
-d '{"userid":1024,"roleid":1024,"reason":"Teste ban com kick","duration_seconds":60,"kick_online":true,"kick_seconds":10}' \
"http://127.0.0.1/apicls/api_cls.php?action=banAccount"
```

```bash
curl -s -X POST -H "x-sync-secret: SEU_SECRET" -H "Content-Type: application/json" \
-d '{"roleid":1024,"reason":"Teste unban","dry_run":true}' \
"http://127.0.0.1/apicls/api_cls.php?action=unbanAccount"
```

Para `clearRolePk`, comece pelo dry-run:

```bash
curl -s -X POST -H "x-sync-secret: SEU_SECRET" -H "Content-Type: application/json" \
-d '{"roleid":1024,"reason":"Teste clear PK","dry_run":true}' \
"http://127.0.0.1/apicls/api_cls.php?action=clearRolePk"
```

Aplicacao real:

```bash
curl -s -X POST -H "x-sync-secret: SEU_SECRET" -H "Content-Type: application/json" \
-d '{"roleid":1024,"reason":"Teste clear PK"}' \
"http://127.0.0.1/apicls/api_cls.php?action=clearRolePk"
```

Se o personagem estiver online e voce quiser forcar o recarregamento do estado em memoria logo apos a limpeza persistida, use:

```bash
curl -s -X POST -H "x-sync-secret: SEU_SECRET" -H "Content-Type: application/json" \
-d '{"roleid":1024,"reason":"Teste clear PK","kick_online":true,"kick_seconds":10}' \
"http://127.0.0.1/apicls/api_cls.php?action=clearRolePk"
```

No legado atual, isso e o caminho mais seguro para fazer o estado limpo reaparecer no cliente quando o personagem estava online no momento da operacao.

Em servidores legados como `game_version 101`, `banAccount` e `unbanAccount` usam automaticamente a tabela MySQL `forbid`. Em versoes mais novas, a API tenta o caminho via `gamedbd`. Quando um `roleid` e informado no `unbanAccount`, a API tambem tenta limpar o `base.forbid` do personagem e notifica `gamedbd` e `gdeliveryd` para soltar o bloqueio de login em memoria.

No legado validado, o menor refresh que realmente soltou o login apos o unban foi `authd + gdeliveryd`. Exemplo:

```bash
curl -s -X POST -H "x-sync-secret: SEU_SECRET" -H "Content-Type: application/json" \
-d '{"userid":1024,"roleid":1024,"reason":"cleanup","refresh_services":["authd","gdeliveryd"]}' \
"http://127.0.0.1/apicls/api_cls.php?action=unbanAccount"
```

`refresh_login_cache=true` continua disponivel, mas ele reinicia apenas o `authd` e pode nao bastar no legado. `glinkd` deve ficar so como escalada de emergencia, porque tem impacto maior sobre jogadores online.

Para `reviveRole`, faca primeiro o dry-run para inspecionar `hp`, `mp`, `dead_flag` e `resurrect_state` persistidos:

```bash
curl -s -X POST -H "x-sync-secret: SEU_SECRET" -H "Content-Type: application/json" \
-d '{"roleid":1024,"reason":"Teste revive","dry_run":true}' \
"http://127.0.0.1/apicls/api_cls.php?action=reviveRole"
```

Aplicacao real:

```bash
curl -s -X POST -H "x-sync-secret: SEU_SECRET" -H "Content-Type: application/json" \
-d '{"roleid":1024,"reason":"Teste revive"}' \
"http://127.0.0.1/apicls/api_cls.php?action=reviveRole"
```

No retorno, confira `gm_action.revive.before`, `gm_action.revive.after`, `gm_action.revive.revived` e `gm_action.revive.changed`. Se o personagem ja estiver vivo, a API deve retornar `revived=true` e `changed=false`.

## GM Commander V2 - Fase A

O backend agora tambem entrega a fundacao real da Fase A do `GM Commander V2`:

- `searchPlayerDirectory`
- `getPlayerTargetProfile`
- `resolveBulkTargets`
- `previewBulkTargets`
- `queueBulkCommand`
- `getBulkCommandJob`
- `getBulkCommandJobs`
- `gm-queue-worker.php`

Na pratica, esta Fase A e a base real para **premiacao em massa** no servidor:

- preview de audiencia
- resolucao de alvos
- fila de execucao
- worker backend
- auditoria local

Ou seja: o painel ja consegue preparar e disparar recompensas em lote com backend real, sem depender de acao manual personagem por personagem.

Essa fundacao usa armazenamento file-based em:

```text
/var/www/html/apicls/backups/gm-commander-v2/
```

Teste rapido de busca:

```bash
curl -s -H "x-sync-secret: SEU_SECRET" \
"http://127.0.0.1/apicls/api_cls.php?action=searchPlayerDirectory&online_only=1&limit=20"
```

Preview de bulk para item:

```bash
curl -s -X POST -H "x-sync-secret: SEU_SECRET" -H "Content-Type: application/json" \
-d '{"command_key":"sendMailItem","selection":{"names":["Criador"]},"item_id":12980,"count":1,"title":"Evento","message":"Premio"}' \
"http://127.0.0.1/apicls/api_cls.php?action=previewBulkTargets"
```

Preview de bulk por guild:

```bash
curl -s -X POST -H "x-sync-secret: SEU_SECRET" -H "Content-Type: application/json" \
-d '{"command_key":"sendMailGold","selection":{"guild_ids":[1234]},"money":1000,"title":"Guild Reward","message":"Entrega por guild"}' \
"http://127.0.0.1/apicls/api_cls.php?action=previewBulkTargets"
```

Preview de bulk por classe:

```bash
curl -s -X POST -H "x-sync-secret: SEU_SECRET" -H "Content-Type: application/json" \
-d '{"command_key":"sendMailGold","selection":{"class_ids":[4],"online_only":true},"money":1000,"title":"Class Reward","message":"Entrega por classe"}' \
"http://127.0.0.1/apicls/api_cls.php?action=previewBulkTargets"
```

Preview de bulk por faixa de level:

```bash
curl -s -X POST -H "x-sync-secret: SEU_SECRET" -H "Content-Type: application/json" \
-d '{"command_key":"sendMailGold","selection":{"level_min":100,"level_max":105,"online_only":true},"money":1000,"title":"Level Reward","message":"Entrega por level"}' \
"http://127.0.0.1/apicls/api_cls.php?action=previewBulkTargets"
```

Enfileirar job:

```bash
curl -s -X POST -H "x-sync-secret: SEU_SECRET" -H "Content-Type: application/json" \
-d '{"command_key":"sendMailGold","selection":{"all_online":true},"money":1000,"title":"Evento","message":"Entrega em lote"}' \
"http://127.0.0.1/apicls/api_cls.php?action=queueBulkCommand"
```

Listar jobs:

```bash
curl -s -H "x-sync-secret: SEU_SECRET" \
"http://127.0.0.1/apicls/api_cls.php?action=getBulkCommandJobs&limit=20"
```

Executar o worker manualmente:

```bash
php /var/www/html/apicls/gm-queue-worker.php
```

Limitacoes atuais desta fase:

- busca por `userid` sem `roleid` ainda fica limitada a alvo de conta
- selecao de guild confiavel nesta fase usa `guild_id` ou `guild_ids`
- `ranking_key` ainda depende de integrar uma fonte de ranking real nesta VPS
- `sendSystemMessage` continua global e nao respeita filtros de alvo

Seletores ja homologados nesta fase:

- `roleids`
- `names` exatos
- `online_only`
- `all_online`
- `guild_id` / `guild_ids`
- `class_ids`
- `level_min` / `level_max`

## Agendamento semanal de bulk rewards

O backend agora tambem traz a base real para **agendamento semanal** de recompensas em massa.

Endpoints disponiveis:

- `scheduleBulkCommand`
- `getBulkSchedules`
- `getBulkSchedule`
- `updateBulkSchedule`
- `deleteBulkSchedule`
- `runDueBulkSchedules`
- `gm-schedule-worker.php`

Arquitetura:

- o frontend cria/edita o schedule
- a API persiste a regra
- o scheduler cria um job normal da fila no horario devido
- o `gm-queue-worker.php` continua sendo o executor real dos alvos

Escopo atual:

- selecionar `weekdays`
- selecionar `time_of_day`
- definir `timezone`
- ativar/pausar com `enabled`
- permitir `sendMailItem`, `sendMailGold` e `grantMallCash`
- suportar os seletores da Fase A ja homologados
- registrar criacao, alteracao, disparo e falha no log de auditoria

Observacao importante:

- `name` nesse endpoint e o nome do agendamento
- para selecionar jogador por nome, use `selection.names`

Exemplo de criacao de schedule semanal:

```bash
curl -s -X POST -H "x-sync-secret: SEU_SECRET" -H "Content-Type: application/json" \
-d '{"name":"Gold semanal da guild","command_key":"sendMailGold","selection":{"guild_ids":[1]},"money":1000,"title":"Guild Reward","message":"Entrega semanal","weekdays":[1],"time_of_day":"21:00","timezone":"America/Sao_Paulo","enabled":true}' \
"http://127.0.0.1/apicls/api_cls.php?action=scheduleBulkCommand"
```

Listar schedules:

```bash
curl -s -H "x-sync-secret: SEU_SECRET" \
"http://127.0.0.1/apicls/api_cls.php?action=getBulkSchedules&limit=20"
```

Executar schedules vencidos manualmente:

```bash
curl -s -X POST -H "x-sync-secret: SEU_SECRET" -H "Content-Type: application/json" \
-d '{}' \
"http://127.0.0.1/apicls/api_cls.php?action=runDueBulkSchedules"
```

Rodar o worker CLI:

```bash
php /var/www/html/apicls/gm-schedule-worker.php
```

Exemplo de cron para execucao automatica a cada minuto:

```cron
* * * * * root /usr/bin/php /var/www/html/apicls/gm-schedule-worker.php >/dev/null 2>&1
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

As acoes de moderacao tambem geram log local em:

```text
/var/www/html/apicls/backups/security-logs/security-AAAA-MM-DD.jsonl
```

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
apache ALL=(root) NOPASSWD: /usr/local/sbin/sendreward-api.sh
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
