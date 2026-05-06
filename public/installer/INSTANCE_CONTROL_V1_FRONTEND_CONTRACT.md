# Instance Control v1 Frontend Contract

## Escopo

Backend validado em producao para:

- `getManageableInstances`
- `setInstanceAutoStart`
- `startInstance`
- `startInstances`
- `stopInstance`
- `stopInstances`
- `restartInstance`
- `restartInstances`
- `getServerOperationsHistory`
- `getServerOperationStatus`

Os tipos novos de historico ja aparecem como:

- `startInstance`
- `startInstances`
- `stopInstance`
- `stopInstances`
- `restartInstance`
- `restartInstances`

## Fonte principal da tela

### Listagem

`GET /apicls/api_cls.php?action=getManageableInstances`

Campos de topo:

- `success`
- `instances`
- `count`
- `running_count`
- `auto_start_count`
- `collected_at`
- `source_files`

Campos por instancia:

- `code`
- `key`
- `name`
- `category`
- `scope`
- `configured`
- `auto_start`
- `auto_start_order`
- `running`
- `state`
- `running_source`
- `pid`
- `process_count`
- `pids`
- `command_excerpt`
- `batch_size`
- `section_types`
- `section_type`
- `player_per_instance`
- `effect_player_per_instance`
- `instance_capacity`
- `listen_addr`
- `listen_port`
- `listening`
- `supported_actions`
- `selectable`

### Uso sugerido na UI

- KPIs:
  - `count`
  - `running_count`
  - `auto_start_count`
- Badge de status:
  - `running === true` => "Em execucao"
  - `running === false` => "Parado"
- Badge de auto-start:
  - `auto_start === true`
- Colunas recomendadas:
  - `name`
  - `code`
  - `category`
  - `scope`
  - `state`
  - `auto_start`
  - `listen_port`
- Drawer/detalhe:
  - `section_type`
  - `section_types`
  - `instance_capacity`
  - `player_per_instance`
  - `effect_player_per_instance`
  - `listen_addr`
  - `running_source`
  - `command_excerpt`
  - `pids`

## Regras de habilitacao

- Pode selecionar linha apenas quando `selectable === true`
- Pode mostrar botoes conforme `supported_actions`
- Auto-start toggle so deve ser habilitado quando:
  - `configured === true`
  - `selectable === true`

## Actions

### Auto-start individual

`POST /apicls/api_cls.php?action=setInstanceAutoStart`

Payload recomendado para toggle por linha:

```json
{
  "code": "is24",
  "enabled": true
}
```

Resposta relevante:

- `success`
- `changed`
- `auto_start_codes`
- `auto_start_count`
- `auto_start_instances`
- `added`
- `removed`
- `previous_codes`

### Auto-start em lote

`POST /apicls/api_cls.php?action=setInstanceAutoStart`

Payload recomendado para salvar lista completa:

```json
{
  "codes": ["gs01", "is63", "is68", "is24"]
}
```

## Operacoes unitarias

### Start

`POST /apicls/api_cls.php?action=startInstance`

```json
{
  "code": "is24",
  "verify": true
}
```

### Stop

`POST /apicls/api_cls.php?action=stopInstance`

```json
{
  "code": "is24",
  "verify": true
}
```

### Restart

`POST /apicls/api_cls.php?action=restartInstance`

```json
{
  "code": "is24",
  "verify": true
}
```

## Integracao com Server Ops

`startServer` e `restartServer` agora usam o `autostart` por padrao quando nenhuma lista explicita de instancias e enviada.

Se o frontend quiser sobrescrever esse comportamento, pode:

- enviar `instances` para subir uma lista especifica
- enviar `use_auto_start: true` para somar a lista manual com o autostart
- enviar `use_auto_start: false` para subir so o core do servidor, sem iniciar instancias adicionais

Observacao:

- `instances: []` vazio e tratado como "sem selecao explicita", entao o backend continua usando o `autostart`
- para desabilitar de verdade o autostart nessa chamada, use `use_auto_start: false`

### Start Server com instancias selecionadas

`POST /apicls/api_cls.php?action=startServer`

```json
{
  "verify": true,
  "instances": ["is24", "is25"]
}
```

### Start Server usando autostart por padrao

`POST /apicls/api_cls.php?action=startServer`

```json
{
  "verify": true
}
```

### Restart Server com instancias selecionadas

`POST /apicls/api_cls.php?action=restartServer`

```json
{
  "reason": "manual-test",
  "countdown_seconds": 60,
  "broadcast": true,
  "enable_maintenance": true,
  "backup_before_restart": true,
  "verify_after_restart": true,
  "instances": ["is24", "is25"]
}
```

### Desabilitar autostart nesse start/restart

```json
{
  "verify": true,
  "use_auto_start": false
}
```

Campos extras esperados nessas operacoes quando houver selecao:

- `instances`
- `instance_selection`
- `already_running_instances`
- `pending_instances`
- `instance_start_result`
- `instance_verification`
- `would_start_instances`
- `would_skip_running_instances`
- `would_start_instances_after_restart`

## Operacoes em lote

### Start

`POST /apicls/api_cls.php?action=startInstances`

```json
{
  "codes": ["is24", "is25"],
  "verify": true
}
```

### Stop

`POST /apicls/api_cls.php?action=stopInstances`

```json
{
  "codes": ["is24", "is25"],
  "verify": true
}
```

### Restart

`POST /apicls/api_cls.php?action=restartInstances`

```json
{
  "codes": ["is24", "is25"],
  "verify": true
}
```

## Contrato comum de retorno das operacoes

Campos principais:

- `success`
- `dry_run` quando aplicavel
- `operation`

Campos principais de `operation`:

- `id`
- `type`
- `success`
- `stage`
- `action`
- `instances`
- `dry_run`
- `verify`
- `created_at`
- `completed_at`
- `changed`
- `log_file`
- `error`
- `verification`

Campos extras por acao:

- start:
  - `already_running`
  - `pending_instances`
  - `would_start_instances`
  - `would_skip_running`
- stop:
  - `already_stopped`
  - `pending_instances`
  - `would_stop_instances`
  - `would_skip_stopped`
- restart:
  - `already_running`
  - `already_stopped`
  - `stop_instances`
  - `start_instances`
  - `stop_result`
  - `stop_verification`
  - `start_result`

## Historico

### Listagem

`GET /apicls/api_cls.php?action=getServerOperationsHistory`

Filtros recomendados:

- `type`
- `success_state`
- `limit`

Tipos de instancia suportados:

- `startInstance`
- `startInstances`
- `stopInstance`
- `stopInstances`
- `restartInstance`
- `restartInstances`

### Detalhe

`GET /apicls/api_cls.php?action=getServerOperationStatus&operation_id=...`

Uso recomendado:

- clique na linha abre drawer
- drawer exibe `stage`, `instances`, `verification`, `error`
- quando existir:
  - `result.parsed.instances`
  - `stop_result.parsed.instances`
  - `start_result.parsed.instances`

## Mapeamento de UX

### Acoes por linha

- Se `running === false`:
  - botao principal: `Start`
- Se `running === true`:
  - botoes: `Stop`, `Restart`

### Acoes em lote

- Toolbar aparece quando existir selecao
- Botoes:
  - `Start selected`
  - `Stop selected`
  - `Restart selected`
  - `Enable auto-start`
  - `Disable auto-start`

### Atualizacao apos mutacao

Fluxo recomendado:

1. executar action
2. guardar `operation.id`
3. abrir drawer de progresso/historico
4. revalidar `getManageableInstances`
5. revalidar `getServerOperationsHistory`

### Dry-run

Usar em:

- smoke test
- confirm modal opcional
- QA

Nao necessario para UX final do usuario comum.

## Tipos sugeridos para o frontend

```ts
export type InstanceActionType =
  | "startInstance"
  | "startInstances"
  | "stopInstance"
  | "stopInstances"
  | "restartInstance"
  | "restartInstances";

export interface ManageableInstance {
  code: string;
  key: string;
  name: string;
  category: string;
  scope: string;
  configured: boolean;
  auto_start: boolean;
  auto_start_order: number | null;
  running: boolean;
  state: "running" | "stopped" | string;
  running_source: "process" | "listen_port" | "none" | string;
  pid: number | null;
  process_count: number;
  pids: number[];
  command_excerpt: string;
  batch_size: number;
  section_types: string[];
  section_type: string;
  player_per_instance: number | null;
  effect_player_per_instance: number | null;
  instance_capacity: number | null;
  listen_addr: string;
  listen_port: number;
  listening: boolean;
  supported_actions: string[];
  selectable: boolean;
}

export interface InstanceOperationSummary {
  id: string;
  type: InstanceActionType;
  stage: string;
  success: boolean;
  success_state: "running" | "success" | "error";
  created_at: string;
  completed_at: string | null;
  action: string;
  instances: string[];
  dry_run: boolean;
  error: string | null;
}
```

## Observacoes praticas

- `restartInstance` nao exige que a instancia esteja rodando; se ela ja estiver parada, ele apenas faz o start.
- `startInstances` e `restartInstances` ja fazem skip inteligente do que nao precisa repetir.
- `stopInstance` usa a porta da instancia como fonte de parada, alinhado com a deteccao de status atual.
- Historico e drawer podem reaproveitar a mesma base visual de `Server Ops`.
