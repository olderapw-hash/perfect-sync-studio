# CLSAPI + Lovable Control Center Roadmap

## Escopo oficial

Este roadmap considera apenas:

- `api_cls.php` como backend oficial da VPS
- `install-apicls-centos7.sh` como instalador oficial
- painel `Lovable` como frontend admin oficial

Fica fora do escopo:

- `painel/` legado
- integrações diretas do frontend com `api-174`
- qualquer fluxo sensível que fale direto com `gamedbd`, `gdeliveryd` ou shell

## Regra de ouro

Tudo que altera servidor, personagem, mail, evento, backup, restore ou daemon deve passar por:

`Lovable -> clsapi -> wrappers/scripts controlados -> servidor`

## O que já está pronto na clsapi

### 1. Operação de servidor

Já implementado:

- `getServiceStatus`
- `getManageableServices`
- `getManageableInstances`
- `setInstanceAutoStart`
- `startInstance`
- `startInstances`
- `stopInstance`
- `stopInstances`
- `restartInstance`
- `restartInstances`
- `startServer`
- `stopServer`
- `restartServer`
- `startService`
- `stopService`
- `restartService`
- `getServerOperationStatus`
- `getServerOperationsHistory`
- `getServerLogs`
- `getMaintenanceMode`
- `setMaintenanceMode`
- `sendSystemMessage`

### 2. GM / suporte / compensação

Já implementado:

- `sendMailItem`
- `sendMailGold`
- `kickRole`
- `banAccount`
- `unbanAccount`
- `getItemCatalog`

### 3. CLS / personagem inicial

Já implementado:

- `getClsconfig`
- `getClsconfigDebug`
- `saveClsconfigTemplate`
- `exportClsconfig`
- `saveRoleEditable`
- `getRole`
- `getRoleEditable`
- `getRoles`
- `getRolesEditable`

### 4. Backup e restore

Já implementado:

- `backupGamedbd`
- `listBackups`
- `getBackupContent`
- `restoreBackup`

Também já existe:

- backup automático antes de operações sensíveis
- histórico/log local de operações
- logs locais de moderação

## Limpeza arquitetural recomendada antes de expandir

### 1. Congelar a clsapi como fonte oficial

Padronizar que:

- o `Lovable` não chama mais `api-174`
- o `Lovable` não executa lógica operacional própria
- o `Lovable` só consome `api_cls.php`

### 2. Separar o monolito por módulos internos

Hoje o `api_cls.php` já funciona, mas está grande. Antes de adicionar muitos blocos novos, o ideal é modularizar logicamente em:

- `Protocol`
- `ServerOps`
- `InstanceControl`
- `BackupManager`
- `RestoreManager`
- `Metrics`
- `Watchdog`
- `GmActions`
- `Clsconfig`
- `Security/Audit`

Mesmo que a entrada continue sendo um único `api_cls.php`, a lógica deve ser organizada em includes/classe utilitária.

### 3. Centralizar logs e auditoria

Toda ação sensível deve ter:

- `operation_id`
- `actor`
- `request`
- `result`
- `log_file`
- `created_at`
- `completed_at`

## Prioridades do novo painel e status real

## P1. Backup Center

### Já existe

- backup do `gamedbd`
- backup do `clsconfig`
- listagem de backups
- leitura de conteúdo de backup JSON
- restore parcial de template/clsconfig

### Ainda falta

- backup de `MySQL/MariaDB`
- backup de `UniqueNamed`
- backup de eventos
- backup do painel web
- job único de backup completo
- agendamento automático
- política de retenção
- compressão e naming padronizados por job
- logs de job de backup
- destino externo futuro

### Arquitetura recomendada

Criar novos endpoints:

- `getBackupOverview`
- `getBackupPolicies`
- `saveBackupPolicies`
- `backupNow`
- `getBackupJobStatus`
- `getBackupHistory`
- `restoreNow`

Criar novos wrappers/scripts:

- `backupmysql-api.sh`
- `backupuniquenamed-api.sh`
- `backuppanel-api.sh`
- `backupfull-api.sh`

Boa prática obrigatória:

- backups críticos com serviços sensíveis pausados quando necessário
- `GameDB` e `UniqueNamed` tratados como backup consistente, não só cópia “quente”

## P2. Watchdog Auto Restart

### Já existe

- status de serviços
- start/stop/restart de serviços
- start/stop/restart de servidor
- histórico de operações

### Ainda falta

- watchdog real em background
- regras de detecção de falha
- restart automático inteligente
- cooldown
- limite de tentativas
- marcação de falha crítica
- alerta visual persistido

### Arquitetura recomendada

O watchdog não deve depender de requisição web. Ele deve rodar como:

- `php-cli` em loop controlado, ou
- `systemd service` + `systemd timer`, ou
- `cron` com lockfile

Sugestão de componentes:

- `/usr/local/sbin/pw-watchdog.php`
- `/var/www/html/apicls/backups/watchdog/state.json`
- `/var/www/html/apicls/backups/watchdog/history.log`

Endpoints da clsapi:

- `getWatchdogStatus`
- `getWatchdogHistory`
- `saveWatchdogConfig`
- `enableWatchdog`
- `disableWatchdog`
- `runWatchdogCheckNow`

## P3. Monitor em tempo real

### Já existe

- `getServiceStatus`
- `getManageableServices`
- `getManageableInstances`
- `getServerLogs`

### Ainda falta

- CPU
- RAM
- disco
- load average
- uptime
- ping
- status HTTP
- status MySQL detalhado
- agregação em um snapshot único

### Arquitetura recomendada

Criar um endpoint agregador:

- `getControlCenterSnapshot`

Ele deve reunir:

- serviços
- instâncias
- mysql/httpd
- cpu
- memória
- disco
- uptime
- loadavg
- alertas watchdog
- operação em andamento

Também vale expandir logs para:

- `gdeliveryd`
- `gs01`
- `world2.log`
- `world2.formatlog`
- `uniquenamed`
- `authd`
- `mysql`

## P4. Restore Center

### Já existe

- restore de backup de template/clsconfig
- confirmação de segurança
- dry-run
- backup de segurança antes do restore

### Ainda falta

- restore total do `gamedbd`
- restore de `mysql`
- restore de `uniquenamed`
- restore do painel
- restore por pacote completo
- rollback rápido por job

### Arquitetura recomendada

Separar restore por tipo:

- `restoreRoleJsonBackup`
- `restoreClsconfigFileBackup`
- `restoreGamedbdBackup`
- `restoreMysqlBackup`
- `restoreUniqueNamedBackup`
- `restorePanelBackup`
- `restoreFullBackup`

Endpoints:

- `restoreNow`
- `getRestorePlan`
- `getRestoreHistory`

## P5. GM Command Center

### Já existe

- `kickRole`
- `banAccount`
- `unbanAccount`
- `sendMailItem`
- `sendMailGold`
- `sendSystemMessage`

### Provável reaproveitamento da camada antiga

A base antiga (`api-174`) já indica suporte técnico para:

- `muteAcc`
- `muteRole`
- `playerTeleport`
- `PlayerKickout`
- `systemBroadcast`

### Ainda falta confirmar e encapsular na clsapi

- `muteAccount`
- `muteRole`
- `teleportRole`
- `summonRole`
- `prisonRole`
- `clearRolePk`
- `reviveRole`
- `resetRoleQuest`

### Observação importante

Nem todo comando deve ser prometido antes de validar o efeito real no servidor 1.5.5.

Ordem segura:

1. encapsular o que já tem prova técnica (`mute`, `teleport`, `kick`)
2. transformar `prison` em caso especial de `teleport`
3. validar com teste real `revive`, `clear PK` e `reset quest`

## Ordem recomendada de implementação

### Fase 1. Consolidar a base operacional

1. congelar `clsapi` como backend oficial
2. padronizar responses/logs/auditoria
3. expandir `getServerLogs`
4. criar `getControlCenterSnapshot`

### Fase 2. Backup/restore profissional

1. `backupNow` por tipo
2. `backupFull`
3. histórico e políticas
4. restore total/parcial
5. retenção

### Fase 3. Watchdog real

1. daemon/timer watchdog
2. config por serviço
3. alertas
4. restart automático inteligente

### Fase 4. GM Command Center premium

1. `mute`
2. `teleport`
3. `prison`
4. comandos avançados validados em produção

## O que o Lovable deve consumir no curto prazo

Para começar a central profissional sem esperar todos os módulos novos, o Lovable já pode usar:

- `getServiceStatus`
- `getManageableServices`
- `getManageableInstances`
- `startServer`
- `stopServer`
- `restartServer`
- `startService`
- `stopService`
- `restartService`
- `startInstance`
- `startInstances`
- `stopInstance`
- `stopInstances`
- `restartInstance`
- `restartInstances`
- `getServerOperationStatus`
- `getServerOperationsHistory`
- `getServerLogs`
- `sendSystemMessage`
- `getMaintenanceMode`
- `setMaintenanceMode`
- `backupGamedbd`
- `listBackups`
- `restoreBackup`
- `sendMailItem`
- `sendMailGold`
- `kickRole`
- `banAccount`
- `unbanAccount`
- `getClsconfig`
- `saveClsconfigTemplate`
- `exportClsconfig`

## Próximo bloco recomendado

Se a meta agora é transformar a `clsapi` numa central completa para o `Lovable`, o próximo bloco mais valioso é:

1. `getControlCenterSnapshot`
2. expansão de `getServerLogs`
3. `backupNow` modular (`gamedbd/mysql/uniquenamed/panel/full`)
4. `getWatchdogStatus` + daemon watchdog
5. `muteAccount` / `muteRole` / `teleportRole`

Esse bloco já entrega:

- menos dependência de SSH
- mais visibilidade operacional
- automação real
- GM tools úteis de verdade
- base sólida para o dashboard premium
