# Instalador do PW Admin

Conecta sua VPS Perfect World ao painel via uma única ponte HTTP.

## Pré-requisitos

- VPS rodando o gamedbd do Perfect World
- Apache/Nginx + PHP 7.4+ instalados
- Acesso SSH como root (ou sudo)

## 1. Subir o `api_cls.php`

```bash
sudo mkdir -p /var/www/html/apicls
sudo cp api_cls.php /var/www/html/apicls/
sudo chown www-data:www-data /var/www/html/apicls/api_cls.php
sudo chmod 640 /var/www/html/apicls/api_cls.php
```

## 2. Configurar o secret

Abra o arquivo na VPS e cole o secret gerado em "Meus Servidores":

```bash
sudo nano /var/www/html/apicls/api_cls.php
# Procure por $SECRET e substitua o valor
```

## 3. (Opcional) Script de export

```bash
sudo cp exportclsconfig-api.sh /usr/local/bin/
sudo chmod +x /usr/local/bin/exportclsconfig-api.sh
```

## 4. (Opcional) Sudoers

```bash
sudo cp sudoers.example /etc/sudoers.d/apicls
sudo chmod 440 /etc/sudoers.d/apicls
sudo visudo -c   # valida a sintaxe
```

## 5. Pasta de backups

```bash
sudo mkdir -p /var/backups/clsconfig
sudo chown www-data:www-data /var/backups/clsconfig
```

## 6. Testar

No painel, vá em **Meus Servidores → Adicionar VPS**, preencha:
- URL: `https://SEU_DOMINIO/apicls/api_cls.php`
- Secret: o mesmo que você colou no PHP

Clique em **Testar conexão**. Deve retornar `Conexão OK`.

## Solução de problemas

- **Unauthorized** → secret diferente entre painel e PHP.
- **Resposta não-JSON** → outro app está respondendo na URL (verifique a rota).
- **Connection refused** → firewall bloqueando a porta 80/443.
- **404** → o arquivo não está no caminho esperado.
