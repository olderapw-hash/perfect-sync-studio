#!/bin/bash
#
# install-pwadmin-vps.sh
# Instala o PW Admin (painel) em uma VPS com Nginx.
#
# Uso:
#   bash install-pwadmin-vps.sh --license-key CHAVE_DA_LICENÇA [--domain meupainel.com] [--port 8080]
#
# Requisitos:
#   - CentOS 7/8, Ubuntu 20+, Debian 10+
#   - Acesso SSH como root
#   - Conexão com internet
#
# O script:
#   1. Instala Nginx (se necessário)
#   2. Instala Node.js 20 (se necessário)
#   3. Clona/baixa o build do painel
#   4. Configura a chave de licença
#   5. Faz o build de produção
#   6. Configura o vhost do Nginx (SPA fallback)
#   7. Reinicia o Nginx
#
set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

log()  { echo -e "${GREEN}[✓]${NC} $*"; }
warn() { echo -e "${YELLOW}[!]${NC} $*"; }
err()  { echo -e "${RED}[✗]${NC} $*" >&2; exit 1; }

# ---------- Parâmetros ----------
LICENSE_KEY=""
DOMAIN=""
PORT=80
INSTALL_DIR="/var/www/pwadmin"

# Valores do Supabase (seu projeto Lovable Cloud)
SUPABASE_URL="https://ezgjmioxmyqgxgdpigeb.supabase.co"
SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV6Z2ptaW94bXlxZ3hnZHBpZ2ViIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY3MTgzNTEsImV4cCI6MjA5MjI5NDM1MX0.JMPNyLYaBhPMcal7-wuGfFfEZokHbi7sijcOf2bDHnY"
SUPABASE_PROJECT_ID="ezgjmioxmyqgxgdpigeb"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --license-key) LICENSE_KEY="$2"; shift 2 ;;
    --domain)      DOMAIN="$2";      shift 2 ;;
    --port)        PORT="$2";        shift 2 ;;
    --install-dir) INSTALL_DIR="$2"; shift 2 ;;
    *) err "Parâmetro desconhecido: $1" ;;
  esac
done

[[ -z "$LICENSE_KEY" ]] && err "Use: bash $0 --license-key SUA_CHAVE"

SERVER_NAME="${DOMAIN:-_}"

# ---------- Detectar OS ----------
if [ -f /etc/os-release ]; then
  . /etc/os-release
  OS_FAMILY="$ID"
else
  OS_FAMILY="unknown"
fi

log "Sistema detectado: $OS_FAMILY"

# ---------- Instalar Nginx ----------
install_nginx() {
  if command -v nginx &>/dev/null; then
    log "Nginx já instalado"
    return
  fi
  warn "Instalando Nginx..."
  case "$OS_FAMILY" in
    centos|rhel|rocky|almalinux|fedora)
      yum install -y epel-release
      yum install -y nginx
      ;;
    ubuntu|debian)
      apt-get update -qq
      apt-get install -y nginx
      ;;
    *) err "OS não suportado para instalação automática do Nginx. Instale manualmente." ;;
  esac
  log "Nginx instalado"
}

# ---------- Instalar Node.js ----------
install_node() {
  if command -v node &>/dev/null; then
    NODE_VER=$(node -v | sed 's/v//' | cut -d. -f1)
    if [[ "$NODE_VER" -ge 18 ]]; then
      log "Node.js $(node -v) já instalado"
      return
    fi
  fi
  warn "Instalando Node.js 20..."
  curl -fsSL https://rpm.nodesource.com/setup_20.x 2>/dev/null | bash - 2>/dev/null \
    || curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  case "$OS_FAMILY" in
    centos|rhel|rocky|almalinux|fedora) yum install -y nodejs ;;
    ubuntu|debian) apt-get install -y nodejs ;;
  esac
  log "Node.js $(node -v) instalado"
}

# ---------- Preparar diretório ----------
prepare_dir() {
  mkdir -p "$INSTALL_DIR"
  log "Diretório: $INSTALL_DIR"
}

# ---------- Build do painel ----------
build_panel() {
  if [[ ! -f "$INSTALL_DIR/package.json" ]]; then
    err "Código-fonte do painel não encontrado em $INSTALL_DIR/package.json
    
Copie o código-fonte do projeto para $INSTALL_DIR antes de rodar este script:
  scp -r ./projeto/* root@VPS:$INSTALL_DIR/

Ou clone do repositório Git:
  git clone SEU_REPO $INSTALL_DIR"
  fi

  cd "$INSTALL_DIR"

  # Criar .env.production com a licença
  cat > .env.production <<EOF
VITE_SUPABASE_URL=$SUPABASE_URL
VITE_SUPABASE_PUBLISHABLE_KEY=$SUPABASE_ANON_KEY
VITE_SUPABASE_PROJECT_ID=$SUPABASE_PROJECT_ID
VITE_LICENSE_KEY=$LICENSE_KEY
EOF

  log "Arquivo .env.production criado com chave de licença"

  # Instalar dependências e buildar
  warn "Instalando dependências (pode levar alguns minutos)..."
  npm install --production=false 2>/dev/null || npm install

  warn "Gerando build de produção..."
  npm run build

  if [[ ! -d "$INSTALL_DIR/dist" ]]; then
    err "Build falhou — pasta dist/ não foi criada"
  fi

  log "Build concluído: $INSTALL_DIR/dist/"
}

# ---------- Configurar Nginx ----------
configure_nginx() {
  local CONF_PATH
  if [[ -d /etc/nginx/sites-available ]]; then
    CONF_PATH="/etc/nginx/sites-available/pwadmin"
    local ENABLED="/etc/nginx/sites-enabled/pwadmin"
  else
    CONF_PATH="/etc/nginx/conf.d/pwadmin.conf"
    local ENABLED=""
  fi

  cat > "$CONF_PATH" <<NGINX
server {
    listen $PORT;
    server_name $SERVER_NAME;

    root $INSTALL_DIR/dist;
    index index.html;

    # Gzip
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml text/javascript image/svg+xml;
    gzip_min_length 1000;

    # Cache de assets estáticos
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # SPA fallback — todas as rotas vão para index.html
    location / {
        try_files \$uri \$uri/ /index.html;
    }

    # Bloquear acesso a arquivos sensíveis
    location ~ /\. {
        deny all;
    }
}
NGINX

  # Symlink para sites-enabled (Debian/Ubuntu)
  if [[ -n "${ENABLED:-}" ]]; then
    ln -sf "$CONF_PATH" "$ENABLED"
    # Remover default se existir
    rm -f /etc/nginx/sites-enabled/default 2>/dev/null || true
  fi

  nginx -t || err "Configuração do Nginx inválida"
  systemctl enable nginx
  systemctl restart nginx

  log "Nginx configurado e reiniciado"
}

# ---------- Validar licença ----------
validate_license() {
  warn "Validando licença..."
  local RESULT
  RESULT=$(curl -sf -X POST \
    -H "Content-Type: application/json" \
    -d "{\"license_key\": \"$LICENSE_KEY\"}" \
    "$SUPABASE_URL/functions/v1/validate-license" 2>/dev/null || echo '{"valid":false,"reason":"network_error"}')

  local VALID=$(echo "$RESULT" | grep -o '"valid":[a-z]*' | cut -d: -f2)

  if [[ "$VALID" == "true" ]]; then
    log "Licença válida ✓"
  else
    local REASON=$(echo "$RESULT" | grep -o '"reason":"[^"]*"' | cut -d'"' -f4)
    err "Licença inválida: $REASON
    
Verifique a chave no painel em /admin/licenses"
  fi
}

# ---------- Execução ----------
echo ""
echo -e "${CYAN}╔══════════════════════════════════════╗${NC}"
echo -e "${CYAN}║     PW Admin — Instalador VPS        ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════╝${NC}"
echo ""

validate_license
install_nginx
install_node
prepare_dir
build_panel
configure_nginx

echo ""
echo -e "${GREEN}═══════════════════════════════════════${NC}"
echo -e "${GREEN}  Instalação concluída com sucesso!    ${NC}"
echo -e "${GREEN}═══════════════════════════════════════${NC}"
echo ""

if [[ -n "$DOMAIN" ]]; then
  echo -e "  URL: ${CYAN}http://$DOMAIN${NC}"
else
  IP=$(hostname -I 2>/dev/null | awk '{print $1}')
  echo -e "  URL: ${CYAN}http://${IP:-SUA_IP}:${PORT}${NC}"
fi

echo -e "  Licença: ${CYAN}${LICENSE_KEY:0:8}...${NC}"
echo -e "  Arquivos: ${CYAN}$INSTALL_DIR/dist/${NC}"
echo -e "  Nginx: ${CYAN}systemctl status nginx${NC}"
echo ""
echo -e "  ${YELLOW}Para HTTPS, configure o Certbot:${NC}"
echo -e "  ${CYAN}certbot --nginx -d $SERVER_NAME${NC}"
echo ""
