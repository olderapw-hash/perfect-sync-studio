# PW Admin — Instalação na VPS do Cliente

Guia para instalar o painel PW Admin na VPS de um cliente que comprou a licença avulsa.

## Pré-requisitos

- VPS com CentOS 7/8, Ubuntu 20+, ou Debian 10+
- Acesso SSH como `root`
- Mínimo 1GB RAM, 1 vCPU
- Licença criada em `/admin/licenses` no painel principal

## Passo 1 — Criar a licença

1. Acesse seu painel como superadmin
2. Vá em **Licenças** (sidebar → Plataforma → Licenças)
3. Clique em **Nova Licença**
4. Preencha: nome do cliente, plano, validade, valor pago
5. Copie a **chave de licença** gerada

## Passo 2 — Preparar o código-fonte

No seu computador, exporte o código do projeto:

```bash
# Clone o repositório (ou baixe o zip)
git clone SEU_REPOSITÓRIO /tmp/pwadmin-build
```

## Passo 3 — Enviar para a VPS

```bash
# Enviar código-fonte
scp -r /tmp/pwadmin-build/* root@IP_DA_VPS:/var/www/pwadmin/

# Enviar o script de instalação
scp public/installer/install-pwadmin-vps.sh root@IP_DA_VPS:/root/install-pwadmin-vps.sh
```

## Passo 4 — Rodar o instalador

Na VPS:

```bash
bash /root/install-pwadmin-vps.sh --license-key CHAVE_DO_CLIENTE
```

### Opções do instalador

| Parâmetro | Descrição | Padrão |
|-----------|-----------|--------|
| `--license-key` | Chave de licença (obrigatório) | — |
| `--domain` | Domínio do painel | IP da VPS |
| `--port` | Porta do Nginx | 80 |
| `--install-dir` | Diretório de instalação | /var/www/pwadmin |

### Exemplo com domínio:

```bash
bash /root/install-pwadmin-vps.sh \
  --license-key abc123def456... \
  --domain painel.meuservidor.com
```

## Passo 5 — Configurar HTTPS (recomendado)

```bash
# Instalar Certbot
yum install -y certbot python3-certbot-nginx   # CentOS
apt install -y certbot python3-certbot-nginx    # Ubuntu/Debian

# Gerar certificado SSL
certbot --nginx -d painel.meuservidor.com
```

## Instalação manual (sem script)

Se preferir instalar manualmente:

### 1. Instalar dependências

```bash
# Nginx
yum install -y nginx   # ou apt install -y nginx

# Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs
```

### 2. Preparar o código

```bash
mkdir -p /var/www/pwadmin
cd /var/www/pwadmin
# (copie o código-fonte aqui)
```

### 3. Criar .env.production

```bash
cat > /var/www/pwadmin/.env.production << 'EOF'
VITE_SUPABASE_URL=https://ezgjmioxmyqgxgdpigeb.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV6Z2ptaW94bXlxZ3hnZHBpZ2ViIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY3MTgzNTEsImV4cCI6MjA5MjI5NDM1MX0.JMPNyLYaBhPMcal7-wuGfFfEZokHbi7sijcOf2bDHnY
VITE_SUPABASE_PROJECT_ID=ezgjmioxmyqgxgdpigeb
VITE_LICENSE_KEY=CHAVE_DA_LICENÇA_AQUI
EOF
```

### 4. Build

```bash
cd /var/www/pwadmin
npm install
npm run build
```

### 5. Configurar Nginx

```bash
cat > /etc/nginx/conf.d/pwadmin.conf << 'NGINX'
server {
    listen 80;
    server_name _;

    root /var/www/pwadmin/dist;
    index index.html;

    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml text/javascript image/svg+xml;

    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    location / {
        try_files $uri $uri/ /index.html;
    }

    location ~ /\. {
        deny all;
    }
}
NGINX

nginx -t && systemctl restart nginx
```

## Como funciona a validação

1. A chave de licença (`VITE_LICENSE_KEY`) fica embutida no build
2. Ao abrir o painel, o app chama a edge function `validate-license`
3. Se a licença for inválida, expirada ou revogada → tela de bloqueio
4. Re-valida automaticamente a cada 6 horas
5. Se houver erro de rede → permite acesso (fallback gracioso)

## Gerenciamento

- **Revogar acesso**: No painel principal, vá em Licenças e mude o status para "Revogada"
- **Suspender temporariamente**: Mude para "Suspensa"
- **Renovar validade**: Edite a data de expiração
- **Ver IP da VPS**: O campo "IP da VPS" serve como referência (não é validado)

## Atualização do painel na VPS

Para atualizar uma instalação existente:

```bash
cd /var/www/pwadmin
# Atualizar código-fonte (git pull ou scp)
npm install
npm run build
# Nginx serve automaticamente os novos arquivos
```

## Solução de problemas

| Sintoma | Causa | Solução |
|---------|-------|---------|
| Tela "Licença Inválida" | Chave errada ou expirada | Verifique em /admin/licenses |
| Tela "Verificando licença..." travada | VPS sem internet ou edge function fora | Verifique conexão da VPS |
| 404 ao acessar rotas | Nginx sem SPA fallback | Verifique `try_files` no nginx.conf |
| Build falha | Node.js antigo | Atualize para Node 18+ |
| Página em branco | Build sem .env.production | Recrie o .env.production e rebuilde |
