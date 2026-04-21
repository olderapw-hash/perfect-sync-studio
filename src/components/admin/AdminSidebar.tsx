import { useState } from "react";
import { ChevronDown, Users } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  useSidebar,
} from "@/components/ui/sidebar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ClsconfigList } from "@/components/admin/ClsconfigList";
import type { ApiClass, ClsEntry } from "@/types/clsconfig";
import { cn } from "@/lib/utils";

interface Props {
  entries: ClsEntry[];
  classes: ApiClass[];
  usedClasses: number[];
  selectedKey: string | null;
  onSelect: (key: string) => void;
  loading?: boolean;
}

/**
 * Sidebar do painel Admin com grupos colapsáveis.
 * Atualmente expõe a seção "Personagens iniciais".
 * Para adicionar novas seções no futuro, crie outro <SectionGroup /> abaixo.
 */
export const AdminSidebar = ({
  entries,
  classes,
  usedClasses,
  selectedKey,
  onSelect,
  loading,
}: Props) => {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";

  return (
    <Sidebar collapsible="icon" className="border-r border-border">
      <SidebarContent className="bg-card/40 backdrop-blur-md">
        <SectionGroup
          label="Personagens iniciais"
          icon={<Users className="h-4 w-4 text-primary" />}
          defaultOpen
          collapsed={collapsed}
        >
          <ClsconfigList
            entries={entries}
            classes={classes}
            usedClasses={usedClasses}
            selectedKey={selectedKey}
            onSelect={onSelect}
            loading={loading}
          />
        </SectionGroup>

        {/*
          Para adicionar novas seções (Itens, Equipamentos, Storehouse...):
          <SectionGroup label="Itens" icon={<Boxes className="h-4 w-4 text-primary" />} collapsed={collapsed}>
            <SuaListaAqui />
          </SectionGroup>
        */}
      </SidebarContent>
    </Sidebar>
  );
};

interface SectionGroupProps {
  label: string;
  icon: React.ReactNode;
  defaultOpen?: boolean;
  collapsed?: boolean;
  children: React.ReactNode;
}

const SectionGroup = ({ label, icon, defaultOpen = false, collapsed, children }: SectionGroupProps) => {
  const [open, setOpen] = useState(defaultOpen);

  // No estado colapsado mostramos só o ícone como um botão.
  if (collapsed) {
    return (
      <SidebarGroup className="p-1">
        <div
          title={label}
          className="flex h-9 items-center justify-center rounded-md text-sidebar-foreground"
        >
          {icon}
        </div>
      </SidebarGroup>
    );
  }

  return (
    <SidebarGroup className="p-0">
      <Collapsible open={open} onOpenChange={setOpen}>
        <CollapsibleTrigger asChild>
          <SidebarGroupLabel
            className={cn(
              "flex h-10 cursor-pointer items-center gap-2 rounded-none border-b border-border px-3 text-xs font-extrabold uppercase tracking-wider text-foreground hover:bg-sidebar-accent/50",
            )}
          >
            {icon}
            <span className="flex-1">{label}</span>
            <ChevronDown
              className={cn(
                "h-3.5 w-3.5 text-muted-foreground transition-transform",
                open ? "rotate-0" : "-rotate-90",
              )}
            />
          </SidebarGroupLabel>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <SidebarGroupContent className="p-0">{children}</SidebarGroupContent>
        </CollapsibleContent>
      </Collapsible>
    </SidebarGroup>
  );
};
