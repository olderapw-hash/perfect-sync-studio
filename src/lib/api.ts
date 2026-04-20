// Perfect World Sync — API client
// Aponte para o diretório onde estão seus scripts PHP no servidor.
// Ex.: "https://meupainel.com/api"  →  GET /api/get_chars.php  |  POST /api/update_chars.php
// Em desenvolvimento, se a variável não estiver setada, usamos dados MOCK locais.

export const API_BASE_URL: string =
  (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/+$/, "") || "";

export const USE_MOCK = API_BASE_URL === "";

export interface StarterChar {
  class: string;
  hp: number;
  mp: number;
  items: number[];
}

const MOCK_DATA: StarterChar[] = [
  { class: "Warrior",  hp: 120, mp: 60,  items: [101, 102] },
  { class: "Mage",     hp: 80,  mp: 150, items: [201, 202, 203] },
  { class: "Archer",   hp: 95,  mp: 80,  items: [301, 302] },
  { class: "Priest",   hp: 90,  mp: 140, items: [401, 402, 403] },
  { class: "Assassin", hp: 100, mp: 70,  items: [501, 502] },
];

// Keep a session copy so "salvar" reflete na próxima leitura quando em mock.
let mockStore: StarterChar[] = structuredClone(MOCK_DATA);

export async function getChars(): Promise<StarterChar[]> {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 400));
    return structuredClone(mockStore);
  }
  const res = await fetch(`${API_BASE_URL}/get_chars.php`, {
    method: "GET",
    headers: { Accept: "application/json" },
  });
  if (!res.ok) throw new Error(`GET get_chars.php falhou: ${res.status}`);
  const data = (await res.json()) as StarterChar[];
  if (!Array.isArray(data)) throw new Error("Formato inesperado da API");
  return data;
}

export async function updateChars(payload: StarterChar[]): Promise<void> {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 500));
    mockStore = structuredClone(payload);
    return;
  }
  const res = await fetch(`${API_BASE_URL}/update_chars.php`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`POST update_chars.php falhou: ${res.status}`);
}
