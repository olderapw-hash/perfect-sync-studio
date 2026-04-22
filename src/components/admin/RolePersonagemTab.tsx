import { useState } from "react";
import { AlertTriangle, Save, Loader2, UserCog, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { pwApi, EndpointMissingError, type SaveRoleEditableResponse } from "@/lib/pwApiActions";
import { toast } from "sonner";
import { saveHistory } from "@/lib/saveHistory";

/**
 * Aba "Personagem Existente".
 *
 * IMPORTANTE: usa action=saveRoleEditable (NÃO confundir com saveClsconfigTemplate).
 * - saveClsconfigTemplate → edita o template inicial de criação (CLS)
 * - saveRoleEditable      → edita o personagem REAL já existente no gamedbd
 *
 * O personagem deve estar OFFLINE. A VPS deve recusar (HTTP 409) se estiver online.
 */
export const RolePersonagemTab = () => {
  const [roleidStr, setRoleidStr] = useState("");
  const [level, setLevel] = useState("");
  const [level2, setLevel2] = useState("");
  const [reputation, setReputation] = useState("");
  const [worldtag, setWorldtag] = useState("");
  const [posx, setPosx] = useState("");
  const [posy, setPosy] = useState("");
  const [posz, setPosz] = useState("");
  const [money, setMoney] = useState("");
  const [saving, setSaving] = useState(false);
  const [lastResponse, setLastResponse] = useState<SaveRoleEditableResponse | null>(null);

  const reset = () => {
    setLevel(""); setLevel2(""); setReputation("");
    setWorldtag(""); setPosx(""); setPosy(""); setPosz("");
    setMoney("");
    setLastResponse(null);
  };

  const toNum = (v: string): number | null => {
    if (v.trim() === "") return null;
    const n = Number(v.replace(",", "."));
    return Number.isFinite(n) ? n : null;
  };

  const handleSave = async () => {
    const roleid = Number(roleidStr);
    if (!Number.isFinite(roleid) || roleid <= 0) {
      toast.error("Informe um roleid válido (> 0)");
      return;
    }

    // Confirmação dupla — operação destrutiva no personagem real.
    const ok = window.confirm(
      `ATENÇÃO: você vai alterar o personagem REAL (roleid ${roleid}).\n\n` +
        `Isso NÃO é o template CLS. O personagem deve estar OFFLINE.\n\n` +
        `Continuar?`,
    );
    if (!ok) return;

    const status: Record<string, number> = {};
    const inventory: Record<string, number> = {};

    const fields: Array<[string, string]> = [
      ["level", level],
      ["level2", level2],
      ["reputation", reputation],
      ["worldtag", worldtag],
      ["posx", posx],
      ["posy", posy],
      ["posz", posz],
    ];
    for (const [k, v] of fields) {
      const n = toNum(v);
      if (n !== null) status[k] = n;
    }
    const moneyNum = toNum(money);
    if (moneyNum !== null) inventory.money = moneyNum;

    if (Object.keys(status).length === 0 && Object.keys(inventory).length === 0) {
      toast.error("Preencha pelo menos um campo para enviar");
      return;
    }

    const payload: Parameters<typeof pwApi.saveRoleEditable>[0] = { roleid };
    if (Object.keys(status).length > 0) payload.status = status;
    if (Object.keys(inventory).length > 0) payload.inventory = inventory;

    setSaving(true);
    try {
      const res = await pwApi.saveRoleEditable(payload);
      setLastResponse(res);

      if (res?.online) {
        toast.error("Personagem está ONLINE — kick antes de editar");
        return;
      }
      if (!res?.success) {
        toast.error(res?.error ?? "Falha ao salvar personagem");
        return;
      }

      toast.success(
        `Personagem ${roleid} atualizado${
          res.applied?.length ? ` (${res.applied.length} campo(s))` : ""
        }`,
      );

      // Histórico — registra cada campo aplicado.
      for (const [k, v] of Object.entries({ ...status })) {
        saveHistory.pushDiff({
          roleid,
          className: `(role real ${roleid})`,
          field: `roleEditable.status.${k}`,
          oldValue: "(antes)",
          newValue: v,
          status: "ok",
        });
      }
      if (inventory.money != null) {
        saveHistory.pushDiff({
          roleid,
          className: `(role real ${roleid})`,
          field: "roleEditable.inventory.money",
          oldValue: "(antes)",
          newValue: inventory.money,
          status: "ok",
        });
      }
    } catch (e) {
      if (e instanceof EndpointMissingError) {
        toast.error("Endpoint saveRoleEditable ainda não implementado na VPS", {
          description: "Ver docs/api-contract.md",
          duration: 7000,
        });
      } else {
        const msg = e instanceof Error ? e.message : String(e);
        toast.error(msg);
        saveHistory.pushDiff({
          roleid,
          className: `(role real ${roleid})`,
          field: "roleEditable",
          oldValue: "(tentativa)",
          newValue: "(falhou)",
          status: "error",
          error: msg,
        });
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Aviso forte */}
      <div className="rounded-xl border-2 border-destructive/60 bg-destructive/10 p-5">
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 h-6 w-6 shrink-0 text-destructive" />
          <div className="space-y-2 text-sm">
            <p className="font-bold uppercase tracking-wider text-destructive">
              Edição de personagem existente
            </p>
            <p className="text-foreground">
              Esta aba <strong>não</strong> edita o template inicial CLS. Ela altera o
              registro real de um personagem já criado no <code className="font-mono">gamedbd</code>.
            </p>
            <ul className="ml-4 list-disc space-y-1 text-xs text-muted-foreground">
              <li>O personagem <strong>deve estar offline</strong>. A VPS recusa edição online (HTTP 409).</li>
              <li>Usa <code className="font-mono">action=saveRoleEditable</code>, não <code className="font-mono">saveClsconfigTemplate</code>.</li>
              <li>Backup automático do <code className="font-mono">role_json</code> é gerado pela VPS antes de aplicar.</li>
              <li>0 é valor válido. Campos vazios não são enviados.</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Identidade */}
      <section className="rounded-xl border border-border bg-card/40 p-5">
        <header className="mb-3 flex items-center gap-2">
          <UserCog className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-bold uppercase tracking-wider">Personagem alvo</h3>
        </header>
        <div className="grid gap-2">
          <Label htmlFor="roleid-real">Roleid real do personagem</Label>
          <Input
            id="roleid-real"
            type="number"
            min={1}
            value={roleidStr}
            onChange={(e) => setRoleidStr(e.target.value)}
            placeholder="ex.: 1024"
            className="max-w-xs font-mono"
          />
          <p className="text-[11px] text-muted-foreground">
            ID inteiro positivo do registro no <code className="font-mono">gamedbd</code>.
          </p>
        </div>
      </section>

      {/* Campos editáveis */}
      <section className="rounded-xl border border-border bg-card/40 p-5">
        <header className="mb-3">
          <h3 className="text-sm font-bold uppercase tracking-wider">Campos a aplicar</h3>
          <p className="mt-1 text-[11px] text-muted-foreground">
            Deixe em branco o que você não quer enviar. Apenas campos preenchidos serão aplicados.
          </p>
        </header>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Level" value={level} onChange={setLevel} type="number" />
          <Field label="Cultivo (level2)" value={level2} onChange={setLevel2} type="number" />
          <Field label="Reputação" value={reputation} onChange={setReputation} type="number" />
          <Field label="Money (inventário)" value={money} onChange={setMoney} type="number" />
          <Field label="World Tag" value={worldtag} onChange={setWorldtag} type="number" />
          <div />
          <Field label="Pos X" value={posx} onChange={setPosx} placeholder="ex.: 1250.386" />
          <Field label="Pos Y" value={posy} onChange={setPosy} placeholder="ex.: 219.618" />
          <Field label="Pos Z" value={posz} onChange={setPosz} placeholder="ex.: 1145.902" />
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-end gap-2">
          <Button variant="outline" onClick={reset} disabled={saving}>Limpar</Button>
          <Button onClick={handleSave} disabled={saving || !roleidStr}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {saving ? "Salvando..." : "Aplicar no personagem real"}
          </Button>
        </div>
      </section>

      {/* Resposta */}
      {lastResponse && (
        <section className="rounded-xl border border-border bg-card/40 p-5">
          <header className="mb-2 flex items-center gap-2">
            <Info className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-bold uppercase tracking-wider">Última resposta</h3>
          </header>
          <pre className="max-h-64 overflow-auto rounded-md bg-background/60 p-3 font-mono text-[11px]">
            {JSON.stringify(lastResponse, null, 2)}
          </pre>
        </section>
      )}
    </div>
  );
};

const Field = ({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
}) => (
  <div className="grid gap-1.5">
    <Label className="text-xs">{label}</Label>
    <Input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="font-mono"
    />
  </div>
);
