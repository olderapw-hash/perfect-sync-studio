// Mapa central de actions da API → permissão exigida.
// Usado tanto no front (esconder/disable) quanto na edge function
// (clsconfig-proxy) para enforcement.
//
// Mantém alinhado com server_members.permissions:
//   view, save_templates, save_real_roles, restore_backup,
//   compare_backup, clear_sections, bulk_apply, manage_servers,
//   view_audit, manage_members.

import type { ServerPermissionKey } from "@/hooks/useServerPermissions";

/** Action HTTP do api_cls.php → permissão exigida no painel. */
export const ACTION_PERMISSION: Record<string, ServerPermissionKey> = {
  // leitura
  getClsconfig: "view",
  getItemCatalog: "view",
  listBackups: "view",
  getRoleEditable: "view",

  // escrita "template"
  saveClsconfigTemplate: "save_templates",

  // escrita em personagem real
  saveRoleEditable: "save_real_roles",
  saveStatus: "save_real_roles",
  saveInventory: "save_real_roles",

  // backups
  restoreBackup: "restore_backup",

  // operação do servidor (v1: leitura + export)
  getServiceStatus: "view",
  getServerLogs: "view_audit",
  exportClsconfig: "save_templates",
};

/** Operações UI que mapeiam pra mais de uma action. */
export const UI_PERMISSION = {
  bulkApply: "bulk_apply",
  clearSections: "clear_sections",
  compareBackup: "compare_backup",
} as const;
