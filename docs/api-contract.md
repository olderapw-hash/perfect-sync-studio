# Contrato dos endpoints novos — `apicls/api_cls.php`

Estes 3 endpoints **ainda não existem** na VPS. Este documento define o
contrato request/response que o frontend já está preparado para consumir.
Implemente no PHP exatamente neste formato para que as features 4, 5 e 10
funcionem sem mudança no client.

Convenções gerais:

- Auth: header `x-sync-secret: <PW_API_SECRET>` (igual aos endpoints existentes).
- Content-Type: `application/json` em ambos sentidos.
- Erros: `{ "success": false, "error": "<mensagem humana>" }` com HTTP 4xx/5xx.
- Sucesso: `{ "success": true, ...payload }` com HTTP 200.
- `0` é valor válido em qualquer campo numérico — nunca usar `if ($v)`,
  sempre `isset()` / comparação explícita.

---

## 1. `GET ?action=getItemCatalog` — feature 4 (Buscar Item)

Catálogo completo de itens disponíveis no servidor (lido do `aitem.data` ou
do dump que vocês já mantêm).

**Request:** sem body.

**Query params opcionais:**

| Param  | Tipo    | Default | Descrição                                      |
|--------|---------|---------|------------------------------------------------|
| `q`    | string  | —       | Busca textual (id exato OU substring de nome). |
| `limit`| int     | 200     | Máximo de resultados (server-side).            |
| `offset`| int    | 0       | Paginação.                                     |

**Response 200:**

```json
{
  "success": true,
  "count": 1234,
  "items": [
    {
      "id": 11530,
      "name": "Token de Espírito",
      "icon_path": "img/items/token_espirito.png",
      "tier": 0,
      "stack_max": 999,
      "type": "consumable"
    }
  ]
}
```

Campos obrigatórios: `id`, `name`. Os demais são best-effort.

---

## 1.b `GET ?action=listBackups` — feature 5 (Listagem de backups)

Lista todos os backups existentes em `backups/clsconfig/...` (gerados
automaticamente por `saveClsconfigTemplate`).

**Query params opcionais:**

| Param   | Tipo | Default | Descrição                              |
|---------|------|---------|----------------------------------------|
| `roleid`| int  | —       | Filtra apenas backups deste roleid.    |

**Response 200:**

```json
{
  "success": true,
  "backups": [
    {
      "roleid": 31,
      "type": "role_json",
      "file": "/var/www/html/apicls/backups/clsconfig/roleid-31-20260422-002129-2d3bea53.json",
      "created_at": 1761091289,
      "size": 41523
    },
    {
      "roleid": 31,
      "type": "clsconfig_file",
      "file": "/var/www/html/apicls/backups/clsconfig/files/clsconfig-roleid-31-20260422-002129-34ced325",
      "created_at": 1761091289,
      "size": 2048
    }
  ]
}
```

`type` deve ser `"role_json"` ou `"clsconfig_file"`. `created_at` é epoch
em segundos. `size` em bytes (best-effort).

---

## 2. `POST ?action=restoreBackup` — feature 5 (Restaurar) ✅ implementado

Restaura um backup `role_json` previamente gerado. Apenas `type=role_json` é
restaurável no momento (`clsconfig_file` e `export_log` ficam desabilitados
no frontend).

**Request body — dry_run (validação prévia):**

```json
{
  "type": "role_json",
  "name": "roleid-31-20260422-002129-2d3bea53.json",
  "dry_run": true
}
```

**Request body — restore real (exige confirm string):**

```json
{
  "type": "role_json",
  "name": "roleid-31-20260422-002129-2d3bea53.json",
  "confirm": "RESTORE_ROLE_JSON"
}
```

**Response 200 (dry_run):**

```json
{ "success": true, "dry_run": true, "roleid": 31, "source": {}, "target": {} }
```

**Response 200 (real):**

```json
{
  "success": true,
  "roleid": 31,
  "restored": {
    "saved": {
      "verified": true,
      "backups": {
        "role_json": { "file": "/var/www/.../backups/clsconfig/roleid-31-...json" },
        "clsconfig_file": { "file": "/var/www/.../backups/clsconfig/files/clsconfig-roleid-31-..." }
      },
      "export": { "log_file": "/var/www/.../backups/clsconfig/exports/exportclsconfig-...log" }
    }
  }
}
```

**Response 4xx:** `{ "success": false, "error": "Backup inexistente" }`.

Regras (server-side):

- Antes de aplicar, gerar novo backup do estado atual (aparece em `restored.saved.backups`).
- Disparar `exportclsconfig` automaticamente após o write no `gamedbd`.
- `verified: true` apenas se a releitura do `gamedbd` bater com o conteúdo do backup.

---

## 3. `POST ?action=saveRoleEditable` — feature 10 (Personagem Existente)

**NÃO** confundir com `saveClsconfigTemplate`. Este endpoint edita o
**personagem real** já existente (registro do `gamedbd` indexado pelo
roleid REAL do char, não pelo roleid do template CLS).

Recomendação: o endpoint deve retornar erro se o personagem estiver
**online** (sessão ativa no gdeliveryd).

**Request body (todos os campos opcionais — só envia o que mudou):**

```json
{
  "roleid": 1024,
  "status": {
    "level": 105,
    "level2": 30,
    "reputation": 200000,
    "worldtag": 1,
    "posx": 1250.386,
    "posy": 219.618,
    "posz": 1145.902
  },
  "inventory": {
    "money": 1000000
  }
}
```

Aceitar os mesmos sub-payloads de `saveClsconfigTemplate` (`status`,
`inventory`, `equipment`, `storehouse`), com a mesma regra de não enviar
`status.cultivation` / `status.decoded` / `summary` / `class_info`.

**Response 200:**

```json
{
  "success": true,
  "roleid": 1024,
  "online": false,
  "applied": ["status.level", "status.reputation", "inventory.money"],
  "verified": true,
  "backups": {
    "role_json": { "file": "/var/www/html/apicls/backups/role/1024-...json" }
  }
}
```

**Response 409 (char online):**

```json
{ "success": false, "error": "Personagem online — kick antes de editar", "online": true }
```

---

## 4. `POST ?action=sendMailItem` — Correio: enviar item

Envia um correio com um item anexado para o personagem alvo.

**Request body:**

```json
{
  "roleid": 1024,
  "subject": "Recompensa do evento",
  "body": "Obrigado por participar!",
  "item": {
    "item_id": 11530,
    "count": 5,
    "max_count": 999,
    "proctype": 0,
    "expire_date": 0,
    "mask": 0,
    "guid1": 0,
    "guid2": 0,
    "data": ""
  }
}
```

`subject` e `body` são opcionais (default no PHP). `item.count` é
obrigatório e > 0. Os demais campos do item são opcionais (defaults).

**Response 200:**

```json
{
  "success": true,
  "roleid": 1024,
  "mail_id": 998877,
  "delivered": true
}
```

`delivered` é `true` se a mailbox aceitou o item imediatamente; `false`
indica enfileiramento (personagem offline / mailbox cheia / etc).

**Response 4xx:** `{ "success": false, "error": "..." }`.

---

## 5. `POST ?action=sendMailGold` — Correio: enviar moedas/gold

Envia um correio com moedas anexadas. PW armazena dinheiro em "moedas
de cobre" (1 gold = 10000 silver). O PHP recebe o valor cru.

**Request body:**

```json
{
  "roleid": 1024,
  "subject": "Reembolso",
  "body": "Compensação pelo downtime.",
  "amount": 1000000
}
```

`amount` é obrigatório, inteiro > 0.

**Response 200:** mesmo shape de `sendMailItem` (`success`, `roleid`,
`mail_id`, `delivered`).

---

## 6. `GET ?action=listMailHistory` — Correio: histórico server-side (opcional)

Quando a VPS mantiver um log próprio dos envios feitos via API, este
endpoint pode espelhar para o painel. Enquanto não existir, o painel
usa apenas a tabela `mail_send_log` no Supabase.

**Query params opcionais:** `roleid`, `since` (epoch), `limit`, `offset`.

**Response 200:**

```json
{
  "success": true,
  "count": 42,
  "entries": [
    {
      "mail_id": 998877,
      "roleid": 1024,
      "kind": "item",
      "subject": "Recompensa do evento",
      "sent_at": 1761091289,
      "delivered": true,
      "payload": { "item_id": 11530, "count": 5 }
    }
  ]
}
```

---

## Resumo de prioridade de implementação

1. `getItemCatalog` — destrava o "Buscar Item" no frontend (item 4).
2. `saveRoleEditable` — destrava a aba "Personagem Existente" (item 10).
3. `restoreBackup` — destrava o botão "Restaurar" da tela de Backups (item 5).
4. `sendMailItem` / `sendMailGold` — destravam o módulo Correio
   (Fase 2 do painel admin). Enquanto ausentes, cada envio é registrado
   em `mail_send_log` com status `endpoint_missing`.
5. `listMailHistory` — espelho opcional do log da VPS (não bloqueante).

Enquanto não estiverem prontos, o frontend mostra o estado vazio /
botão desabilitado com a mensagem **"endpoint ainda não implementado"**.

---

## 4. `POST ?action=registerIngameParticipation` — Eventos Ingame (Fase 1)

Endpoint chamado pelo **NPC/script do servidor PW** para registrar a
participação de um player em um evento ingame configurado no painel.

A VPS valida o `x-sync-secret` do tenant e repassa para o Supabase via
RPC `register_ingame_participation` usando o `SERVICE_ROLE` key.

**Request:**

```json
{
  "event_id": "uuid-do-evento",
  "tenant_id": "uuid-do-servidor",
  "roleid": 12345,
  "role_name": "PlayerName",
  "userid": 67890
}
```

Campos obrigatórios: `event_id`, `tenant_id`, `roleid`.
Campos opcionais: `role_name`, `userid`.

**Response 200 (sucesso):**

```json
{ "success": true, "id": "uuid-da-participacao", "duplicate": false }
```

**Response 200 (duplicidade — silenciosa, não é erro):**

```json
{ "success": true, "id": "uuid-existente", "duplicate": true }
```

**Response 4xx (erro):**

```json
{ "success": false, "error": "Event is not active (status=draft)" }
```

Erros possíveis:
- Event not found for tenant
- Event is not active
- Event has not started yet
- Event already ended

**Implementação no api_cls.php (pseudocódigo):**

```php
// recebe JSON, valida x-sync-secret do tenant (igual aos outros endpoints)
// chama: POST {SUPABASE_URL}/rest/v1/rpc/register_ingame_participation
// headers: apikey + Authorization: Bearer {SERVICE_ROLE_KEY}
// body: { _event_id, _tenant_id, _roleid, _role_name, _userid, _metadata }
```

**Nota:** A função RPC já existe no Supabase. Só falta o endpoint
PHP fazer a ponte. Enquanto não existir, o painel mostra o evento
mas nenhuma participação chega ingame.
