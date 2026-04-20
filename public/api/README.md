# PW Sync — Scripts PHP do servidor

Coloque estes dois arquivos no seu servidor web (com PHP 7.4+), no mesmo diretório, por exemplo:

```
/var/www/html/api/
  ├── get_chars.php
  ├── update_chars.php
  └── chars.json   (criado automaticamente na primeira requisição)
```

## Endpoints

- `GET  /api/get_chars.php`     → retorna array JSON de personagens
- `POST /api/update_chars.php`  → recebe array JSON e grava

## Formato

```json
[
  { "class": "Warrior", "hp": 120, "mp": 60, "items": [101, 102] }
]
```

## Conectando o painel

Crie um arquivo `.env` na raiz do painel com:

```
VITE_API_BASE_URL=https://seudominio.com/api
```

E rebuild o painel. Sem essa variável, o painel roda em modo **mock** (dados de demonstração locais).

## CORS

Os dois scripts já respondem com `Access-Control-Allow-Origin: *`. Restrinja para o seu domínio em produção editando o cabeçalho.

## Integração com banco real

Cada arquivo tem um bloco `TODO: integrar com seu banco` com um exemplo PDO. Substitua a leitura/escrita em `chars.json` pela query apropriada à sua tabela de `starter_chars` (clsconfig id 16).
