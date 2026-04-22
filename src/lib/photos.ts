// Helpers para fotos de classe (cls) e personagem (roleid).
// Salvas no bucket público `pw-assets` em `photos/class/{cls}.<ext>` e
// `photos/character/{roleid}.<ext>`. Metadados em `class_photos` / `character_photos`.
import { supabase } from "@/integrations/supabase/client";

const BUCKET = "pw-assets";

function extFromFile(file: File): string {
  const name = file.name.toLowerCase();
  const m = name.match(/\.(png|jpe?g|webp|gif)$/);
  return m ? m[1].replace("jpeg", "jpg") : "png";
}

async function uploadAndGetUrl(path: string, file: File) {
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    upsert: true,
    cacheControl: "3600",
    contentType: file.type || undefined,
  });
  if (error) throw error;
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  // Cache-bust para refletir trocas
  return `${data.publicUrl}?v=${Date.now()}`;
}

export async function uploadClassPhoto(cls: number, file: File): Promise<string> {
  const ext = extFromFile(file);
  const path = `photos/class/${cls}.${ext}`;
  const publicUrl = await uploadAndGetUrl(path, file);
  const { data: userData } = await supabase.auth.getUser();
  const { error } = await supabase.from("class_photos").upsert({
    cls,
    storage_path: path,
    public_url: publicUrl,
    updated_by: userData.user?.id ?? null,
    updated_at: new Date().toISOString(),
  });
  if (error) throw error;
  return publicUrl;
}

export async function uploadCharacterPhoto(roleid: number, file: File): Promise<string> {
  const ext = extFromFile(file);
  const path = `photos/character/${roleid}.${ext}`;
  const publicUrl = await uploadAndGetUrl(path, file);
  const { data: userData } = await supabase.auth.getUser();
  const { error } = await supabase.from("character_photos").upsert({
    roleid,
    storage_path: path,
    public_url: publicUrl,
    updated_by: userData.user?.id ?? null,
    updated_at: new Date().toISOString(),
  });
  if (error) throw error;
  return publicUrl;
}

export async function removeClassPhoto(cls: number): Promise<void> {
  const { data: row } = await supabase
    .from("class_photos")
    .select("storage_path")
    .eq("cls", cls)
    .maybeSingle();
  if (row?.storage_path) {
    await supabase.storage.from(BUCKET).remove([row.storage_path]);
  }
  await supabase.from("class_photos").delete().eq("cls", cls);
}

export async function removeCharacterPhoto(roleid: number): Promise<void> {
  const { data: row } = await supabase
    .from("character_photos")
    .select("storage_path")
    .eq("roleid", roleid)
    .maybeSingle();
  if (row?.storage_path) {
    await supabase.storage.from(BUCKET).remove([row.storage_path]);
  }
  await supabase.from("character_photos").delete().eq("roleid", roleid);
}

export async function fetchClassPhotos(): Promise<Map<number, string>> {
  const { data, error } = await supabase.from("class_photos").select("cls, public_url");
  if (error) throw error;
  const m = new Map<number, string>();
  (data ?? []).forEach((r) => m.set(r.cls, r.public_url));
  return m;
}

export async function fetchCharacterPhoto(roleid: number): Promise<string | null> {
  const { data } = await supabase
    .from("character_photos")
    .select("public_url")
    .eq("roleid", roleid)
    .maybeSingle();
  return data?.public_url ?? null;
}
