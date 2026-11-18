import type { SupabaseClient } from "@supabase/supabase-js";
import { loadPedigree, type PedigreeNode } from "@/lib/pedigree";

export type Animal = {
  id: string;
  owner_id: string;
  name: string;
  sex: "buck" | "doe";
  breed: string;
  breed_grade: string;
  percentage_detail: string;
  registry: string;
  registration_number: string;
  birth_date: string | null;
  tattoo: string;
  scrapie_tag: string;
  color: string;
  dna_on_file: boolean;
  sire_id: string | null;
  dam_id: string | null;
  sire_name: string;
  sire_registration: string;
  dam_name: string;
  dam_registration: string;
  description: string;
  epds: Record<string, string | number>;
  created_at: string;
};

export type HealthTest = { id: string; test_name: string; result: string; test_date: string | null; lab: string; notes: string };
export type ShowRecord = { id: string; show_name: string; show_date: string | null; class_name: string; place: string };
export type Media = { id: string; kind: "photo" | "video"; path: string; caption: string; sort_order: number };

export type AnimalBundle = {
  animal: Animal;
  health: HealthTest[];
  shows: ShowRecord[];
  media: Media[];
  pedigree: PedigreeNode;
  offspring: { id: string; name: string; sex: string }[];
};

export async function loadAnimal(supabase: SupabaseClient, id: string): Promise<AnimalBundle | null> {
  const { data: animal } = await supabase.from("animals").select("*").eq("id", id).maybeSingle();
  if (!animal) return null;
  const [health, shows, media, offspring, pedigree] = await Promise.all([
    supabase.from("health_tests").select("*").eq("animal_id", id).order("test_date", { ascending: false }),
    supabase.from("show_records").select("*").eq("animal_id", id).order("show_date", { ascending: false }),
    supabase.from("animal_media").select("*").eq("animal_id", id).order("sort_order").order("created_at"),
    supabase
      .from("animals")
      .select("id,name,sex")
      .or(`sire_id.eq.${id},dam_id.eq.${id}`)
      .order("birth_date", { ascending: false })
      .limit(50),
    loadPedigree(supabase, animal),
  ]);
  return {
    animal: animal as Animal,
    health: (health.data ?? []) as HealthTest[],
    shows: (shows.data ?? []) as ShowRecord[],
    media: (media.data ?? []) as Media[],
    offspring: offspring.data ?? [],
    pedigree,
  };
}
