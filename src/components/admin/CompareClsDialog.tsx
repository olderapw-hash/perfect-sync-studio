import { useMemo, useState } from "react";
import { ArrowRightLeft } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ClsEntry } from "@/types/clsconfig";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entries: ClsEntry[];
  initialKey?: string | null;
}

interface Row {
  label: string;
  a: string | number;
  b: string | number;
  diff: boolean;
}

function buildRows(a: ClsEntry, b: ClsEntry): Row[] {
  const rows: Row[] = [];
  const push = (label: string, va: unknown, vb: unknown) => {
    const sa = String(va ?? "");
    const sb = String(vb ?? "");
    rows.push({ label, a: sa, b: sb, diff: sa !== sb });
  };

  push("roleid", a.template.roleid, b.template.roleid);
  push("classe", a.template.summary.class_name ?? a.template.summary.cls,
    b.template.summary.class_name ?? b.template.summary.cls);
  push("nome", a.template.base.name, b.template.base.name);
  push("raça", a.template.base.race, b.template.base.race);
  push("gen", a.template.base.gender, b.template.base.gender);

  // Status
  push("status.level", a.template.status.level, b.template.status.level);
  push("status.level2", a.template.status.level2, b.template.status.level2);
  push("status.exp", a.template.status.exp, b.template.status.exp);
  push("status.sp", a.template.status.sp, b.template.status.sp);
  push("status.pp", a.template.status.pp, b.template.status.pp);
  push("status.hp", a.template.status.hp, b.template.status.hp);
  push("status.mp", a.template.status.mp, b.template.status.mp);
  push("status.reputation", a.template.status.reputation, b.template.status.reputation);
  push("status.worldtag", a.template.status.worldtag, b.template.status.worldtag);
  push("status.posx", a.template.status.posx, b.template.status.posx);
  push("status.posy", a.template.status.posy, b.template.status.posy);
  push("status.posz", a.template.status.posz, b.template.status.posz);

  // Inventário
  push("inventory.capacity", a.template.inventory.capacity, b.template.inventory.capacity);
  push("inventory.money", a.template.inventory.money, b.template.inventory.money);
  push(
    "inventory.items (preenchidos)",
    a.template.inventory.items.filter((i) => i.id > 0).length,
    b.template.inventory.items.filter((i) => i.id > 0).length,
  );
  push(
    "equipment.items (preenchidos)",
    a.template.equipment.items.filter((i) => i.id > 0).length,
    b.template.equipment.items.filter((i) => i.id > 0).length,
  );
  push("storehouse.capacity", a.template.storehouse.capacity, b.template.storehouse.capacity);
  push("storehouse.money", a.template.storehouse.money, b.template.storehouse.money);
  push(
    "storehouse.items (preenchidos)",
    a.template.storehouse.items.filter((i) => i.id > 0).length,
    b.template.storehouse.items.filter((i) => i.id > 0).length,
  );

  return rows;
}

export const CompareClsDialog = ({ open, onOpenChange, entries, initialKey }: Props) => {
  const [keyA, setKeyA] = useState<string>(initialKey ?? entries[0]?.key_hex ?? "");
  const [keyB, setKeyB] = useState<string>(entries[1]?.key_hex ?? entries[0]?.key_hex ?? "");

  const a = entries.find((e) => e.key_hex === keyA);
  const b = entries.find((e) => e.key_hex === keyB);
  const rows = useMemo(() => (a && b ? buildRows(a, b) : []), [a, b]);
  const diffCount = rows.filter((r) => r.diff).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowRightLeft className="h-4 w-4 text-primary" />
            Comparar CLS — {diffCount} diferença(s)
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              CLS A
            </div>
            <Select value={keyA} onValueChange={setKeyA}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {entries.map((e) => (
                  <SelectItem key={e.key_hex} value={e.key_hex}>
                    {e.template.summary.class_name ?? `cls ${e.template.summary.cls}`} (roleid {e.template.roleid})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <div className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              CLS B
            </div>
            <Select value={keyB} onValueChange={setKeyB}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {entries.map((e) => (
                  <SelectItem key={e.key_hex} value={e.key_hex}>
                    {e.template.summary.class_name ?? `cls ${e.template.summary.cls}`} (roleid {e.template.roleid})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {a && b ? (
          <div className="max-h-[55vh] overflow-y-auto rounded-md border border-border">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-card/95 backdrop-blur">
                <tr className="border-b border-border">
                  <th className="px-3 py-2 text-left font-semibold">Campo</th>
                  <th className="px-3 py-2 text-left font-semibold">A</th>
                  <th className="px-3 py-2 text-left font-semibold">B</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr
                    key={r.label}
                    className={`border-b border-border/40 ${r.diff ? "bg-primary/5" : ""}`}
                  >
                    <td className="px-3 py-1.5 font-mono text-[10px] text-muted-foreground">
                      {r.label}
                    </td>
                    <td className={`px-3 py-1.5 font-mono ${r.diff ? "font-semibold text-foreground" : "text-muted-foreground"}`}>
                      {r.a}
                    </td>
                    <td className={`px-3 py-1.5 font-mono ${r.diff ? "font-semibold text-primary" : "text-muted-foreground"}`}>
                      {r.b}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="rounded-md border border-dashed border-border/60 p-6 text-center text-xs text-muted-foreground">
            Selecione dois CLS para comparar.
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
