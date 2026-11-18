import type { SupabaseClient } from "@supabase/supabase-js";

// Bucks and does on the site that can be picked as a sire or dam.
export async function loadParentOptions(supabase: SupabaseClient, excludeId?: string) {
  const { data } = await supabase
    .from("animals")
    .select("id,name,sex,registration_number,owner:profiles!animals_owner_id_fkey(farm_name)")
    .order("name")
    .limit(1000);
  const rows = (data ?? [])
    .filter((a) => a.id !== excludeId)
    .map((a) => ({
      id: a.id as string,
      name: a.name as string,
      sex: a.sex as string,
      registration_number: a.registration_number as string,
      farm_name: ((a.owner as unknown as { farm_name: string } | null)?.farm_name ?? "") as string,
    }));
  return { bucks: rows.filter((r) => r.sex === "buck"), does: rows.filter((r) => r.sex === "doe") };
}
