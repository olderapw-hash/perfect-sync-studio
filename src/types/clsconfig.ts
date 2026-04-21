// Full TypeScript types for the clsconfig payload returned by api_cls.php

export interface ClsItem {
  id: number;
  pos: number;
  count: number;
  max_count: number;
  data: string;
  proctype: number;
  expire_date: number;
  guid1: number;
  guid2: number;
  mask: number;
}

export interface ClsSummary {
  name: string;
  cls: number;
  race: number;
  gender: number;
  level: number;
  level2: number;
  cultivation: number;
  reputation: number;
  inventory_money: number;
  inventory_items: number;
  equipment_items: number;
  storehouse_items: number;
  /** Nome legível da classe vindo da API (ex: "Guerreiro"). */
  class_name?: string;
  /** Caminho relativo do ícone da classe (ex: "img/guerreiro.png"). */
  class_icon_path?: string;
}

/** Item de response.classes — catálogo completo de classes disponíveis. */
export interface ApiClass {
  id: number;
  name: string;
  icon_path: string;
  /** Nome legível da raça (ex: "Humano", "Alada"). */
  race: string;
  /** Gênero (0=M, 1=F). Pode não vir na response — opcional. */
  gender?: number;
}

export interface ClsBase {
  id: number;
  name: string;
  race: number;
  cls: number;
  gender: number;
  custom_data: string;
  config_data: string;
  custom_stamp: number;
  status: number;
  delete_time: number;
  create_time: number;
  lastlogin_time: number;
  spouse: number;
  userid: number;
  cross_data: string;
}

export interface ClsStatusDecoded {
  property?: unknown;
  var_data?: unknown;
  force_data?: unknown;
  faction_contrib?: unknown;
  title_data?: unknown;
}

export interface ClsStatus {
  level: number;
  level2: number;
  cultivation: number;
  exp: number;
  sp: number;
  pp: number;
  hp: number;
  mp: number;
  worldtag: number;
  reputation: number;
  posx: number;
  posy: number;
  posz: number;
  storesize: number;
  custom_status: string;
  filter_data: string;
  charactermode: number;
  instancekeylist: string;
  dbltime_expire: number;
  dbltime_mode: number;
  dbltime_begin: number;
  dbltime_used: number;
  dbltime_max: number;
  time_used: number;
  petcorral: string;
  property: string;
  var_data: string;
  skills: string;
  storehousepasswd: string;
  waypointlist: string;
  coolingtime: string;
  npc_relation: string;
  multi_exp_ctrl: string;
  storage_task: string;
  faction_contrib: string;
  force_data: string;
  online_award: string;
  profit_time_data: string;
  country_data: string;
  king_data: string;
  meridian_data: string;
  extraprop: string;
  title_data: string;
  reincarnation_data: string;
  realm_data: string;
  decoded?: ClsStatusDecoded;
}

export interface ClsInventory {
  capacity: number;
  timestamp: number;
  money: number;
  items: ClsItem[];
}

export interface ClsEquipment {
  items: ClsItem[];
}

export interface ClsStorehouse {
  capacity: number;
  money: number;
  items: ClsItem[];
  dress: ClsItem[];
  material: ClsItem[];
  generalcard: ClsItem[];
}

export interface ClsTemplate {
  roleid: number;
  summary: ClsSummary;
  base: ClsBase;
  status: ClsStatus;
  inventory: ClsInventory;
  equipment: ClsEquipment;
  storehouse: ClsStorehouse;
}

export interface ClsEntry {
  source: string;
  key_hex: string;
  version: number;
  template: ClsTemplate;
}

export interface ClsconfigResponse {
  success: boolean;
  count: number;
  entries: ClsEntry[];
  /** Catálogo completo de classes (todas que existem no servidor). */
  classes: ApiClass[];
  /** IDs das classes que realmente possuem entries no payload. */
  used_classes: number[];
}
