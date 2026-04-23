// Mapeia erros de teste de conexão (edge function test-server-connection)
// pra mensagens amigáveis em pt-BR + dica de como resolver.
//
// Recebe o resultado bruto e devolve { title, hint } pra mostrar em toast/UI.

import type { TestConnectionResult } from "./serverConnection";

export interface FriendlyError {
  title: string;
  hint: string;
}

const RAW_HINTS: Array<{
  match: RegExp;
  title: string;
  hint: string;
}> = [
  {
    match: /unauthorized|invalid.?secret|x-sync-secret|secret.+(inv|errad)/i,
    title: "Secret incorreto",
    hint: "O secret cadastrado aqui não bate com o do api_cls.php na VPS. Edite o servidor e cole o mesmo valor da variável $SECRET do PHP.",
  },
  {
    match: /timeout|timed?.?out|aborted/i,
    title: "VPS não respondeu (timeout)",
    hint: "A VPS não respondeu em 15s. Verifique se o Apache está rodando, se o firewall libera a porta 80/443 e se o IP está correto.",
  },
  {
    match: /econnrefused|connection refused/i,
    title: "Conexão recusada",
    hint: "A VPS recusou a conexão. O Apache provavelmente está parado — rode `systemctl start httpd` (CentOS) ou `systemctl start apache2`.",
  },
  {
    match: /enotfound|getaddrinfo|dns/i,
    title: "Domínio não encontrado",
    hint: "Não conseguimos resolver o domínio/IP da VPS. Confira se digitou certo na URL.",
  },
  {
    match: /certificate|ssl|tls/i,
    title: "Erro de certificado SSL",
    hint: "O certificado HTTPS da VPS está inválido ou expirado. Use http:// (sem o s) se ainda não configurou SSL.",
  },
  {
    match: /resposta n[ãa]o.?json/i,
    title: "Resposta não é JSON",
    hint: "A URL respondeu mas não é o api_cls.php — provavelmente é a página padrão do Apache ou uma página 404. Confirme o caminho completo até o .php.",
  },
  {
    match: /404/,
    title: "api_cls.php não encontrado (404)",
    hint: "O caminho não existe. Verifique se subiu o arquivo pra /var/www/html/apicls/api_cls.php (ou ajuste a URL aqui).",
  },
  {
    match: /403/,
    title: "Acesso negado pelo servidor (403)",
    hint: "O Apache bloqueou o acesso. Cheque permissões da pasta apicls (chown apache:apache + chmod 755).",
  },
  {
    match: /500|internal server error/i,
    title: "Erro interno na VPS (500)",
    hint: "O api_cls.php travou. Veja /var/log/httpd/error_log na VPS pra ver o erro PHP exato.",
  },
  {
    match: /pw_api_base_url inv[áa]lida|deve ser o dom[íi]nio/i,
    title: "URL no formato errado",
    hint: "A URL deve apontar pro arquivo api_cls.php (ex.: http://meuip/apicls/api_cls.php) ou só pro domínio base (será completado automaticamente).",
  },
];

export function friendlyConnectionError(r: TestConnectionResult): FriendlyError {
  const raw = (r.error ?? "").toString();
  const status = r.http_status;

  // HTTP status tem prioridade quando vem
  if (status === 401 || status === 403) {
    if (status === 401)
      return {
        title: "Secret incorreto (HTTP 401)",
        hint: "O secret enviado não bate com o do api_cls.php. Edite o servidor e use o mesmo valor da variável $SECRET do PHP.",
      };
    if (status === 403)
      return {
        title: "Acesso negado (HTTP 403)",
        hint: "Apache bloqueou. Verifique permissões da pasta apicls e do arquivo api_cls.php (apache:apache + 755/644).",
      };
  }
  if (status === 404)
    return {
      title: "api_cls.php não encontrado (404)",
      hint: "Confira se o caminho está correto. Padrão: /var/www/html/apicls/api_cls.php → URL http://IP/apicls/api_cls.php",
    };
  if (status && status >= 500)
    return {
      title: `Erro na VPS (HTTP ${status})`,
      hint: "Veja /var/log/httpd/error_log (CentOS) ou /var/log/apache2/error.log (Debian) pra ver o erro PHP.",
    };

  for (const m of RAW_HINTS) {
    if (m.match.test(raw)) return { title: m.title, hint: m.hint };
  }

  return {
    title: "Falha na conexão",
    hint:
      raw ||
      "Não foi possível chegar na sua VPS. Verifique se o api_cls.php está instalado, se a URL está correta e se a VPS está online.",
  };
}

/** Valida e normaliza uma URL de api_cls.php digitada pelo usuário. */
export interface UrlValidation {
  ok: boolean;
  normalized: string;
  endpoint: string; // o que será chamado de fato (com /apicls/api_cls.php se faltar)
  error?: string;
}

export function validateApiUrl(raw: string): UrlValidation {
  const trimmed = raw.trim();
  if (!trimmed) {
    return { ok: false, normalized: "", endpoint: "", error: "URL vazia" };
  }
  let withProto = trimmed;
  if (!/^https?:\/\//i.test(withProto)) {
    withProto = `http://${withProto}`;
  }
  let parsed: URL;
  try {
    parsed = new URL(withProto);
  } catch {
    return {
      ok: false,
      normalized: trimmed,
      endpoint: "",
      error: "Formato inválido — exemplo: http://192.168.1.10 ou http://meudominio.com",
    };
  }
  if (!parsed.hostname || parsed.hostname === "localhost") {
    if (parsed.hostname !== "localhost") {
      return {
        ok: false,
        normalized: withProto,
        endpoint: "",
        error: "Host inválido",
      };
    }
  }
  const normalized = `${parsed.protocol}//${parsed.host}${parsed.pathname.replace(/\/+$/, "")}`;
  const endpoint = /api_cls\.php$/i.test(normalized)
    ? normalized
    : `${normalized}/apicls/api_cls.php`;
  return { ok: true, normalized, endpoint };
}
