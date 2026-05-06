# GM Commander v2 Backend Contract

## Objetivo

Evoluir o `GM Commander` do Perfect World Sync Panel / Orphea Core para um nivel profissional, com backend real, auditavel e pronto para producao no ecossistema `PW 1.5.5` legado validado pela `clsapi`.

Este contrato e backend-first.

Nao e um pedido de frontend isolado.

Toda nova capacidade do `GM Commander` deve respeitar:

- `Lovable/Orphea Core -> api_cls.php -> gamedbd/gdeliveryd/gacd/scripts controlados`
- nenhuma acao sensivel direto do frontend para banco do jogo, shell ou daemon
- preview antes de executar
- log obrigatorio
- politica de permissao por operador
- operacao em massa com fila e controle de impacto

## Revisao do estado atual

### Comandos reais ja implementados e validados

#### Compensacao

- `sendMailItem`
- `sendMailGold`
- `grantMallCash`

#### Moderacao

- `kickRole`
- `banAccount`
- `unbanAccount`
- `muteAccount`
- `muteRole`

#### Permissoes GM

- `getGmPermissionCatalog`
- `getGmPermissionState`
- `grantGmPermission`
- `revokeGmPermission`

#### Broadcast / comunicacao

- `sendSystemMessage`

#### Estado avancado do personagem

- `clearRolePk` com ressalva operacional

Observacao:

- o backend ja limpa `pk_count`, `invader_state`, `invader_time`, `pariah_time`
- tambem limpa o residual `type 100` criado pelo refresh de sessao
- porem o legado ainda pode manter um timer vermelho no cliente por storage secundario nao homologado
- portanto `clearRolePk` nao deve ser vendido como limpeza total do PK visual ate nova prova tecnica

### Comandos com backend parcial / validacao pendente

- `clearRolePk`
- `reviveRole`

Motivo:

- `clearRolePk` limpa o persistido conhecido, mas ainda nao homologou o fim completo do timer vermelho no cliente
- `reviveRole` tem backend real implementado, mas ainda precisa homologacao final em alvo morto com refresh de sessao

### Helper endpoints reais ja disponiveis

- `getGmCommandCatalog`
- `getGmActionHistory`
- `getItemCatalog`
- `getMallCashBalance`
- `getGmPermissionCatalog`
- `getGmPermissionState`

### Comandos ainda nao devem ser vendidos como prontos

- `teleportRole`
- `summonRole`
- `prisonRole`
- `resetRoleQuest`

Motivo:

- dependem de validacao tecnica especifica da `game_version`
- no legado atual, `teleportRole` continua `version_gated`
- `prisonRole` depende de teleport validado + coordenadas oficiais

## Regras operacionais ja descobertas no legado

### 1. Acoes de conta vs personagem

- `banAccount`, `unbanAccount`, `muteAccount` operam no escopo de conta
- `kickRole`, `muteRole`, `clearRolePk` operam no escopo de personagem

Fluxo obrigatorio:

- acoes de conta devem usar `userid`
- `roleid` e complementar quando houver acao sobre sessao/role

### 2. Ban de conta

No legado validado:

- o ban real usa `forbid_table`
- o bloqueio de login e diferente do kick de sessao
- para efeito imediato, o fluxo correto e `banAccount + kick_online`

### 3. Unban de conta

No legado validado:

- limpar apenas `forbid` nao basta
- limpar apenas `role forbid` nao basta
- para liberar login preso, a menor combinacao funcional foi:

```json
{
  "refresh_services": ["authd", "gdeliveryd"]
}
```

`glinkd` nao entra no fluxo padrao.

### 4. Preview e execucao real

Todo comando destrutivo ou com efeito live deve separar:

- preview / `dry_run`
- execucao real

O frontend nao pode tratar `dry_run` como execucao final.

## Escopo obrigatorio da v2

## 1. Sistema de comandos em massa

### Objetivo

Permitir executar comandos GM contra multiplos alvos sem improviso manual.

### Casos obrigatorios

- enviar item para multiplos jogadores
- envio por lista de players
- envio por guild
- envio por classe
- envio por faixa de level
- envio para todos online
- envio para TOP ranking

### Regras de backend

Nao implementar bulk acoplando SQL direto no frontend.

Criar no backend:

- `resolveBulkTargets`
- `previewBulkTargets`
- `queueBulkCommand`
- `executeBulkCommandNow`

### Formas de selecao previstas

- `roleids`
- `userids`
- `names`
- `guild`
- `class_ids`
- `level_min`
- `level_max`
- `online_only`
- `ranking_key`
- `ranking_limit`

### Primeiros comandos autorizados para bulk

- `sendMailItem`
- `sendMailGold`
- `grantMallCash`
- `sendSystemMessage`

Expansao posterior:

- `muteRole`
- `muteAccount`
- `banAccount`

Punicoes em massa so devem ser liberadas com confirmacao forte e perfil de acesso superior.

## 2. Sistema de fila

### Objetivo

Evitar sobrecarga e transformar operacoes em massa em jobs controlados.

### Backend obrigatorio

Criar uma fila real no backend, com worker separado da requisicao HTTP.

Componentes obrigatorios:

- `gm_queue_jobs`
- `gm_queue_items`
- `gm_queue_attempts`
- `gm_queue_logs`

### Motor de execucao

Implementar worker dedicado:

- `gm-queue-worker.php`

Execucao recomendada:

- `php-cli` via `cron`
- ou `systemd timer/service`

### Regras da fila

- processamento em lote
- tamanho de lote configuravel
- retry automatico
- backoff progressivo
- limite de tentativas
- pausa/cancelamento de job
- status por item
- logs por item e por job

### Resultado minimo de um job

- `job_id`
- `command_key`
- `actor`
- `total_targets`
- `processed_targets`
- `success_count`
- `error_count`
- `queued_at`
- `started_at`
- `completed_at`
- `status`

## 3. Templates de comandos

### Objetivo

Permitir reaproveitar operacoes padronizadas com seguranca.

### Capacidades obrigatorias

- salvar template
- editar template
- remover template
- executar template
- categorias:
  - `evento`
  - `punicao`
  - `recompensa`
  - `broadcast`

### Regras

Template nao executa shell nem SQL cru.

Template salva:

- `template_key`
- `label`
- `category`
- `command_key`
- `default_payload`
- `requires_preview`
- `requires_confirmation`
- `created_by`
- `updated_by`

## 4. Sistema de permissoes administrativas

### Objetivo

Separar permissao ingame de permissao do painel.

Nao confundir:

- permissao GM no jogo
- permissao do operador do painel

### Perfis minimos

- `gm_operator`
- `gm_supervisor`
- `gm_admin`
- `super_admin`

### Controles obrigatorios

- quem pode ver
- quem pode executar
- quem pode executar em massa
- quem pode executar punicao
- quem pode usar refresh de servicos
- quem pode usar templates globais

### Log de autoria

Toda execucao precisa registrar:

- `actor_user_id`
- `actor_email` ou login
- `actor_role`
- `actor_ip`

## 5. Logs avancados

### Objetivo

Criar trilha de auditoria profissional.

### Cada execucao deve registrar

- `operation_id`
- `job_id` quando houver fila
- `command_key`
- `target_type`
- `target_identifiers`
- `payload_resumido`
- `preview_result`
- `execution_result`
- `status`
- `created_at`
- `completed_at`
- `actor`
- `actor_ip`

### Alvos minimos nos logs

- player alvo
- conta alvo
- comando executado
- horario
- admin responsavel
- IP do operador

## 6. Sistema de confirmacao / preview

### Objetivo

Toda acao live sensivel deve ter resumo operacional antes da execucao.

### O preview deve mostrar no minimo

- alvo
- item
- quantidade
- moeda/cash quando aplicavel
- impacto de conta vs personagem
- quantidade total de alvos no bulk

### Regras

- preview nao pode ser apenas cosmetico
- backend deve devolver preview real
- frontend deve ter `Confirmar` e `Cancelar`
- operacoes em massa devem mostrar amostra + total agregado

## 7. Busca avancada de player

### Objetivo

Padronizar a resolucao de alvos no backend.

### Filtros obrigatorios

- por nome
- por ID
- por conta
- por guild
- por classe
- online/offline

### Endpoints previstos

- `searchPlayerDirectory`
- `getPlayerTargetProfile`

### Resposta minima

- `roleid`
- `userid`
- `name`
- `cls`
- `level`
- `guild`
- `online`

## 8. Execucao por condicao

### Objetivo

Criar audiencias dinamicas sem montar listas manuais toda vez.

### Condicoes obrigatorias

- todos online
- level maior que X
- VIP
- participantes de evento

### Regras

Condicao nao executa direto.

Primeiro:

- resolver audiencia
- mostrar preview
- enfileirar ou executar

## 9. Integracao com eventos

### Objetivo

Permitir que o sistema de eventos use o GM Commander como motor de premiacao e acao live.

### Casos obrigatorios

- reward automatico para TOP dano boss
- reward de participacao
- broadcast de encerramento
- entrega programada por colocacao

### Contrato tecnico

Eventos nao devem escrever direto em `mail`, `cash` ou `auth`.

Eles devem chamar:

- `queueBulkCommand`
- ou `executeBulkCommandNow`

com contexto de auditoria:

- `event_id`
- `event_type`
- `trigger_source`

## 10. Broadcast avancado

### Objetivo

Evoluir o broadcast de mensagem simples para campanha operacional.

### Capacidades desejadas

- mensagens com cor
- repeticao
- delay
- envio programado

### Regra tecnica

As capacidades de cor e formato dependem do protocolo realmente validado do servidor.

Entao a implementacao deve nascer em dois niveis:

1. `sendSystemMessage` simples, ja existente
2. `queueBroadcastMessage` com repeticao/agendamento

Campos previstos:

- `message`
- `channel`
- `style`
- `repeat_count`
- `repeat_interval_seconds`
- `schedule_at`

## 11. Sistema de punicoes rapidas

### Objetivo

Agrupar acoes comuns de moderacao sem esconder o impacto real.

### Pacote minimo

- mute temporario
- ban temporario
- ban permanente
- kick

### Sobre jail

`jail` nao deve ser marcado como pronto enquanto:

- `teleportRole` nao estiver validado no legado atual
- coordenadas oficiais da prisao nao estiverem homologadas

Entao nesta fase:

- `jail` fica `contract_only`

## 12. Estrutura tecnica obrigatoria

### Requisitos

- PHP puro
- modular
- seguro
- escalavel
- preparado para integracao com `apicls`

### Organizacao interna obrigatoria

Mesmo que a entrada continue em `api_cls.php`, a logica nova deve ser separada por modulo:

- `GmCommandCatalog`
- `GmTargetResolver`
- `GmBulkResolver`
- `GmPreviewBuilder`
- `GmQueueEngine`
- `GmQueueWorker`
- `GmTemplateRepository`
- `GmAccessPolicy`
- `GmAuditLogger`
- `GmEventBridge`
- `GmBroadcastScheduler`

### Persistencia recomendada

Os dados operacionais do GM Commander v2 nao devem ficar espalhados em JSON solto sem estrategia.

Persistencia recomendada:

- tabelas dedicadas de operacao/auditoria
- ou schema proprio do Orphea Core

Nao usar tabelas criticas do jogo para:

- fila
- templates
- auditoria do painel
- estados de workflow

## Ordem de entrega recomendada

### Fase A - Fundacao backend

1. `searchPlayerDirectory`
2. `resolveBulkTargets`
3. `previewBulkTargets`
4. `queueBulkCommand`
5. `gm-queue-worker.php`
6. `GmAuditLogger`
7. `GmAccessPolicy`

Status atual do backend:

- `searchPlayerDirectory`: entregue
- `getPlayerTargetProfile`: entregue
- `resolveBulkTargets`: entregue
- `previewBulkTargets`: entregue
- `queueBulkCommand`: entregue
- `getBulkCommandJob`: entregue
- `getBulkCommandJobs`: entregue
- `gm-queue-worker.php`: entregue
- auditoria file-based da Fase A: entregue

Audience selectors validados nesta fase:

- `roleids`
- `names` exatos
- `online_only`
- `all_online`
- `guild_id` / `guild_ids`
- `class_ids`
- `level_min` / `level_max`

Leitura funcional desta fase:

- esta e a fundacao real para **premiacao em massa**
- a audiencia ja pode ser resolvida, validada por preview, enfileirada e executada por worker
- o frontend nao deve tratar isso como “envio simples”, e sim como motor de bulk operacional

Limitacoes atuais aceitas nesta fase:

- busca global offline por conta ainda e limitada neste legado
- `userid` sem `roleid` vira alvo de conta, nao role detalhado
- bulk por guild deve preferir `guild_id` ou `guild_ids` como seletor canonico
- `ranking_key` ainda depende de fonte de ranking configurada
- `sendSystemMessage` continua global e ignora filtros de alvo nesta fase

### Fase B - Bulk operacional

1. bulk de `sendMailItem`
2. bulk de `sendMailGold`
3. bulk de `grantMallCash`
4. bulk de `sendSystemMessage`
5. templates
6. agendamento semanal de recompensas em massa

#### Requisito adicional aprovado

O `Lovable` deve implementar fluxo de **agendamento automatico semanal** para recompensas em massa.

Esse avanco nao pode ser somente frontend. Ele precisa existir como backend funcional do `GM Commander`, reutilizando a fila da Fase A.

Escopo obrigatorio do agendamento:

- selecionar dia da semana
- selecionar horario
- permitir ativar/pausar
- manter timezone definida
- suportar pelo menos:
  - `sendMailItem`
  - `sendMailGold`
  - `grantMallCash`
- suportar seletores ja homologados da Fase A
- criar jobs normais da fila no horario devido
- registrar logs de criacao, alteracao, execucao, falha e ultimo disparo

Endpoints/backend esperados para essa etapa:

- `scheduleBulkCommand`
- `getBulkSchedules`
- `getBulkSchedule`
- `updateBulkSchedule`
- `deleteBulkSchedule`
- `runDueBulkSchedules`
ou
- `gm-schedule-worker.php`

Regra arquitetural:

- o frontend agenda
- o backend persiste
- o scheduler cria um job comum
- o `gm-queue-worker.php` continua sendo o executor real dos alvos

Nao aprovar essa etapa se existir apenas:

- calendario visual
- formulario de dia da semana
- botao de salvar sem worker
- mock de “agendado com sucesso”

### Fase C - Moderacao profissional

1. punicoes rapidas
2. preview forte
3. logs avancados
4. execucao por condicao

### Fase D - Eventos e automacao

1. integracao com eventos
2. ranking audience
3. broadcast agendado

## Regra final

Nao aprovar nenhum avanco do `GM Commander` como concluido se ele for apenas:

- tela bonita
- modal
- tabela
- botao

Sem backend real, ele nao esta entregue.

O contrato exige:

- endpoint real
- execucao real
- preview real
- permissao real
- auditoria real
- comportamento seguro em producao
