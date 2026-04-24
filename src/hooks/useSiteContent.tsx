// Hook que carrega o conteúdo editável da landing page (/) a partir
// da tabela `site_content` (singleton, id=1). Visitantes anônimos podem ler;
// apenas superadmin pode editar.
//
// Defaults vivem aqui — assim, mesmo que a tabela esteja vazia, a landing
// renderiza exatamente como antes da feature de edição existir.
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface SiteListItem {
  title: string;
  desc: string;
}

export interface SiteStep {
  title: string;
  desc: string;
}

export interface SiteFaqItem {
  q: string;
  a: string;
}

export interface SiteContent {
  hero: {
    badge: string;
    /** Título completo. Use **texto** para marcar a parte com destaque dourado. */
    title: string;
    /** @deprecated mantido para retrocompatibilidade com conteúdos salvos antes. */
    title_prefix?: string;
    /** @deprecated */
    title_highlight?: string;
    /** @deprecated */
    title_suffix?: string;
    subtitle: string;
    primary_cta: string;
    secondary_cta: string;
    fineprint: string;
  };
  problems: {
    eyebrow: string;
    title: string;
    items: SiteListItem[];
  };
  features: {
    eyebrow: string;
    title: string;
    subtitle: string;
    items: SiteListItem[];
  };
  steps: {
    eyebrow: string;
    title: string;
    items: SiteStep[];
  };
  pricing: {
    eyebrow: string;
    title: string;
    plan_label: string;
    price: string;
    price_suffix: string;
    plan_desc: string;
    features: string[];
    cta: string;
    fineprint: string;
  };
  faq: {
    eyebrow: string;
    title: string;
    items: SiteFaqItem[];
  };
  final_cta: {
    title: string;
    subtitle: string;
    cta: string;
  };
}

export const SITE_CONTENT_DEFAULTS: SiteContent = {
  hero: {
    badge: "Pra donos de servidor privado de PW",
    title: "Administre seu servidor de **Perfect World** sem tocar no banco",
    subtitle:
      "Edite personagens, itens, equipamentos, status e inventário direto pelo navegador. Backup automático, histórico de alterações e zero risco de quebrar dados com SQL manual.",
    primary_cta: "Começar por R$ 47/mês",
    secondary_cta: "Ver como funciona",
    fineprint: "Sem fidelidade • Cancele quando quiser • Funciona com qualquer servidor PW",
  },
  problems: {
    eyebrow: "O problema",
    title: "Cansado de abrir o phpMyAdmin toda hora?",
    items: [
      {
        title: "Editar pelo phpMyAdmin é arriscado",
        desc: "Um UPDATE errado num campo binário e o personagem trava. Sem rollback, sem histórico de quem mexeu.",
      },
      {
        title: "Restaurar item perdido vira novela",
        desc: "Player perdeu equipamento? Procurar o ID, montar o INSERT, validar bytes do octet... 30 minutos por player.",
      },
      {
        title: "Sem controle de quem fez o quê",
        desc: "Time de moderação direto no banco = zero auditoria. Quem deu aquele item raro pro alt do amigo?",
      },
      {
        title: "Templates iniciais difíceis de balancear",
        desc: "Mudar atributos de personagem novo (cls 16) exige edição manual em todas as classes. Trabalhoso e propenso a erro.",
      },
    ],
  },
  features: {
    eyebrow: "Recursos",
    title: "Tudo que um GM precisa, num só lugar",
    subtitle:
      "Construído por gente que vive o servidor — cada recurso resolve uma dor real do dia-a-dia.",
    items: [
      {
        title: "Editor visual de personagens",
        desc: "Status, equipamento, inventário e storehouse com interface idêntica ao cliente do jogo. Sem decorar IDs.",
      },
      {
        title: "Templates iniciais (clsconfig)",
        desc: "Edite os atributos de cada classe nova de personagem direto pelo painel — HP, MP, itens iniciais, tudo visual.",
      },
      {
        title: "Fotos personalizadas das classes",
        desc: "Suba retratos custom por classe ou por personagem específico. Identidade visual do seu servidor.",
      },
      {
        title: "Backups automáticos + histórico",
        desc: "Cada alteração gera um backup. Reverteu errado? Restaurar é 1 clique. Auditoria completa de quem mudou o quê.",
      },
      {
        title: "Múltiplos admins, sem conflito",
        desc: "Convide moderadores com permissões granulares. Você decide quem pode editar status, dar item, ou só visualizar.",
      },
      {
        title: "Funciona com sua VPS",
        desc: "Os dados continuam na sua VPS. O painel só conecta via API segura — você troca de servidor sem perder configuração.",
      },
    ],
  },
  steps: {
    eyebrow: "Setup em 3 passos",
    title: "Pronto em menos de 5 minutos",
    items: [
      {
        title: "Crie sua conta",
        desc: "Cadastro rápido com email e senha. Sem cartão de crédito no teste.",
      },
      {
        title: "Conecte sua VPS",
        desc: "Cole o IP/domínio do seu servidor PW e o secret da API. Pronto, o painel começa a sincronizar.",
      },
      {
        title: "Comece a editar",
        desc: "Busque personagem, edite o que precisar, salve. Tudo com backup automático e histórico.",
      },
    ],
  },
  pricing: {
    eyebrow: "Preço",
    title: "Simples. Sem letras miúdas.",
    plan_label: "Plano único",
    price: "R$ 47",
    price_suffix: "/mês",
    plan_desc: "Por servidor. Acesso completo, sem limite de personagens editados.",
    features: [
      "Editor completo de personagens (status, equip, inventário, storehouse)",
      "Templates iniciais por classe (clsconfig)",
      "Backups automáticos + restauração 1-clique",
      "Histórico completo de alterações",
      "Múltiplos administradores",
      "Fotos personalizadas das classes",
      "Branding do seu servidor (logo, nome, cor)",
      "Suporte por Discord",
      "Atualizações constantes",
    ],
    cta: "Criar minha conta agora",
    fineprint: "Cancele quando quiser • 7 dias de teste grátis",
  },
  faq: {
    eyebrow: "FAQ",
    title: "Dúvidas comuns",
    items: [
      {
        q: "Preciso instalar algo na minha VPS?",
        a: "Sim, um único arquivo PHP (api_cls.php) que serve como ponte segura entre o painel e seu banco. Enviamos o arquivo e instruções de instalação após o cadastro — é literalmente colocar um arquivo numa pasta e pronto.",
      },
      {
        q: "Funciona com qual versão do Perfect World?",
        a: "Compatível com a maioria das versões/revisões usadas em servidores privados (1.3.6, 1.4.x, 1.5.x). Se tiver dúvida sobre a sua revisão específica, fala com a gente antes de assinar.",
      },
      {
        q: "Meus dados ficam seguros?",
        a: "Os dados nunca saem da sua VPS — o painel só lê e escreve via API com header secret criptografado. Conexões via HTTPS. Cada admin tem login próprio e auditoria completa de ações.",
      },
      {
        q: "Posso cancelar quando quiser?",
        a: "Sim. Sem fidelidade, sem multa. Cancela e a cobrança para no próximo ciclo. Seu painel fica acessível em modo somente-leitura por mais 30 dias pra você exportar o que precisar.",
      },
      {
        q: "Como funciona o teste grátis?",
        a: "7 dias de acesso completo, sem pedir cartão. No fim do teste, você decide se quer assinar. Se não fizer nada, a conta simplesmente expira.",
      },
      {
        q: "Vocês oferecem versão self-hosted (instalo na minha VPS)?",
        a: "Em breve, como tier Enterprise. Por enquanto, o painel é hospedado por nós e conecta na sua VPS via API.",
      },
    ],
  },
  final_cta: {
    title: "Pronto pra deixar de quebrar a cabeça com SQL?",
    subtitle:
      "Junte-se aos GMs que já administram seus servidores com a tranquilidade de um painel pensado pra Perfect World.",
    cta: "Começar agora — R$ 47/mês",
  },
};

/** Faz merge profundo simples, mantendo arrays integrais (sem concatenar). */
function merge<T>(base: T, override: unknown): T {
  if (
    override === null ||
    override === undefined ||
    typeof override !== "object" ||
    Array.isArray(override) ||
    Array.isArray(base) ||
    typeof base !== "object"
  ) {
    return (override === undefined || override === null ? base : (override as T));
  }
  const out = { ...(base as Record<string, unknown>) };
  for (const k of Object.keys(override as Record<string, unknown>)) {
    out[k] = merge(
      (base as Record<string, unknown>)[k],
      (override as Record<string, unknown>)[k],
    );
  }
  return out as T;
}

export const useSiteContent = () => {
  const [content, setContent] = useState<SiteContent>(SITE_CONTENT_DEFAULTS);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("site_content")
      .select("content")
      .eq("id", 1)
      .maybeSingle();
    if (data?.content && typeof data.content === "object") {
      const merged = merge(SITE_CONTENT_DEFAULTS, data.content);
      // Migração: se houver título antigo em 3 partes e nenhum `title` novo
      // explícito, reconstrói com **destaque** para o usuário.
      const raw = (data.content as { hero?: Record<string, unknown> })?.hero ?? {};
      const hasNewTitle = typeof raw.title === "string" && raw.title.trim().length > 0;
      if (!hasNewTitle && (raw.title_prefix || raw.title_highlight || raw.title_suffix)) {
        const p = String(raw.title_prefix ?? "").trim();
        const h = String(raw.title_highlight ?? "").trim();
        const s = String(raw.title_suffix ?? "").trim();
        merged.hero.title = [p, h ? `**${h}**` : "", s].filter(Boolean).join(" ");
      }
      setContent(merged);
    } else {
      setContent(SITE_CONTENT_DEFAULTS);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { content, loading, reload: load };
};
