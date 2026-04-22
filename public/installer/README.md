# PW Admin — Instalação na VPS

Conecta sua VPS Perfect World ao painel via uma única ponte HTTP (`api_cls.php`).
Toda comunicação é autenticada por um **secret** que você gera no painel.

> ⚠️ **Cada VPS deve ter o seu próprio secret.** Nunca reuse o secret de outro
> servidor — se um for comprometido, todos ficam expostos.

---

## Pré-requisitos

- VPS rodando o **gamedbd** do Perfect World em `/home/gamedbd/`
- Apache (ou Nginx) + PHP 7.4+
- Acesso SSH como `root` (ou `sudo`)
- Secret copiado de **PW Admin → Meus Servidores → (seu servidor) → Secret**

---

## 1. Criar a pasta do bridge

```bash
sudo mkdir -p /var/www/html/apicls
```

## 2. Subir o `api_cls.php`

Copie o `api_cls.php` para `/var/www/html/apicls/` (via `scp`, `rsync`, painel
da hospedagem, etc).

```bash
sudo chown apache:apache /var/www/html/apicls/api_cls.php   # ou www-data
sudo chmod 640 /var/www/html/apicls/api_cls.php
```

## 3. Colar o secret

Edite o arquivo na VPS e troque o placeholder pelo secret real:

```bash
sudo nano /var/www/html/apicls/api_cls.php
# Procure a linha:
#   $SECRET = '__PW_API_SECRET__';
# E substitua __PW_API_SECRET__ pelo secret gerado no painel.
```

Verifique que a sintaxe ficou ok:

```bash
php -l /var/www/html/apicls/api_cls.php
# Deve imprimir: No syntax errors detected
```

## 4. Pasta de backups

```bash
sudo mkdir -p /var/backups/clsconfig
sudo chown apache:apache /var/backups/clsconfig    # ou www-data
sudo chmod 750 /var/backups/clsconfig
```

## 5. Script de export

```bash
sudo cp exportclsconfig-api.sh /usr/local/sbin/exportclsconfig-api.sh
sudo chown root:root /usr/local/sbin/exportclsconfig-api.sh
sudo chmod 750 /usr/local/sbin/exportclsconfig-api.sh
```

## 6. Sudoers

```bash
sudo cp sudoers.example /etc/sudoers.d/apicls
sudo chmod 440 /etc/sudoers.d/apicls
sudo visudo -c           # valida — NÃO pule
```

> Se o usuário do seu PHP for `www-data` (Debian/Ubuntu) em vez de `apache`
> (CentOS/RHEL), edite `/etc/sudoers.d/apicls` antes de validar.

---

## 7. Teste local na VPS

```bash
# Substitua SEU_SECRET pelo valor real e SEU_IP pelo IP/host público.
curl -s -H "X-Sync-Secret: SEU_SECRET" \
  "http://SEU_IP/apicls/api_cls.php?action=ping"
```

Deve retornar algo como:

```json
{ "success": true, "pong": true, "php": "8.x.x", "clsconfig": true, "backup_dir": true }
```

Outros testes úteis:

```bash
# Lista de classes (lê o clsconfig.data)
curl -s -H "X-Sync-Secret: SEU_SECRET" \
  "http://SEU_IP/apicls/api_cls.php?action=getClasses"

# Dispara export do gamedbd (precisa do sudoers ok)
curl -s -H "X-Sync-Secret: SEU_SECRET" \
  "http://SEU_IP/apicls/api_cls.php?action=exportClsconfig"
```

---

## 8. Cadastrar no painel

1. Volte ao **PW Admin → Meus Servidores**
2. Clique em **Adicionar VPS** (ou edite o servidor existente)
3. Preencha:
   - **URL da API:** `http://SEU_IP/apicls/api_cls.php`
   - **Secret:** o mesmo que você colou no PHP
4. Clique em **Testar conexão**. Deve retornar **Conexão OK**.
5. Clique em **Adicionar servidor**.

---

## Solução de problemas

| Erro                  | Causa provável                                                  |
|-----------------------|-----------------------------------------------------------------|
| `Unauthorized`        | Secret diferente entre painel e PHP                             |
| `Server not configured` | Você esqueceu de trocar `__PW_API_SECRET__` no `api_cls.php`  |
| Resposta não-JSON     | Outro app está respondendo na URL ou erro de PHP em `display_errors` |
| `Connection refused`  | Firewall bloqueando porta 80/443                                |
| `404`                 | Caminho errado — confira `/var/www/html/apicls/api_cls.php`     |
| `Export script failed`| `sudoers.d/apicls` ausente ou usuário do PHP errado             |

---

## Atualização futura

Para atualizar o `api_cls.php`, baixe a nova versão no painel, suba para
`/var/www/html/apicls/` e cole novamente o seu secret. As pastas de backups e
o script de export não precisam ser refeitos.
