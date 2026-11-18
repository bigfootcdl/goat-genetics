"use server";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireSeller } from "@/lib/auth";
import { backWith, friendlyError } from "@/lib/actions";
import { str } from "@/lib/format";
import { EPD_FIELDS } from "@/lib/listing-types";

function animalFields(form: FormData) {
  const epds: Record<string, string> = {};
  for (const f of EPD_FIELDS) {
    const v = str(form, `epd_${f.key}`);
    if (v) epds[f.key] = v;
  }
  return {
    name: str(form, "name"),
    sex: str(form, "sex") === "doe" ? "doe" : "buck",
    breed: str(form, "breed") || "Boer",
    breed_grade: str(form, "breed_grade") || "fullblood",
    percentage_detail: str(form, "percentage_detail"),
    registry: str(form, "registry"),
    registration_number: str(form, "registration_number"),
    birth_date: str(form, "birth_date") || null,
    tattoo: str(form, "tattoo"),
    scrapie_tag: str(form, "scrapie_tag"),
    color: str(form, "color"),
    dna_on_file: form.get("dna_on_file") === "on",
    sire_id: str(form, "sire_id") || null,
    dam_id: str(form, "dam_id") || null,
    sire_name: str(form, "sire_name"),
    sire_registration: str(form, "sire_registration"),
    dam_name: str(form, "dam_name"),
    dam_registration: str(form, "dam_registration"),
    description: str(form, "description"),
    epds,
  };
}

export async function createAnimal(form: FormData) {
  const member = await requireSeller();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("animals")
    .insert({ ...animalFields(form), owner_id: member.id })
    .select("id")
    .single();
  if (error) backWith("/animals/new", "error", friendlyError(error.message));
  redirect(`/animals/${data.id}?ok=${encodeURIComponent("Animal added. Now add photos and health tests.")}`);
}

export async function updateAnimal(form: FormData) {
  await requireSeller();
  const id = str(form, "id");
  const fields = animalFields(form);
  if (fields.sire_id === id || fields.dam_id === id) backWith(`/animals/${id}/edit`, "error", "An animal can't be its own parent.");
  const supabase = await createClient();
  const { error } = await supabase.from("animals").update(fields).eq("id", id);
  if (error) backWith(`/animals/${id}/edit`, "error", friendlyError(error.message));
  redirect(`/animals/${id}?ok=${encodeURIComponent("Saved.")}`);
}

export async function deleteAnimal(form: FormData) {
  await requireSeller();
  const id = str(form, "id");
  const supabase = await createClient();
  const { data: media } = await supabase.from("animal_media").select("path").eq("animal_id", id);
  const { error } = await supabase.from("animals").delete().eq("id", id);
  if (error) backWith(`/animals/${id}/edit`, "error", friendlyError(error.message));
  if (media?.length) await supabase.storage.from("media").remove(media.map((m) => m.path));
  backWith("/herd", "ok", "Animal and its listings deleted.");
}

export async function addHealthTest(form: FormData) {
  await requireSeller();
  const animalId = str(form, "animal_id");
  const supabase = await createClient();
  const { error } = await supabase.from("health_tests").insert({
    animal_id: animalId,
    test_name: str(form, "test_name"),
    result: str(form, "result") || "negative",
    test_date: str(form, "test_date") || null,
    lab: str(form, "lab"),
  });
  if (error) backWith(`/animals/${animalId}`, "error", friendlyError(error.message));
  backWith(`/animals/${animalId}`, "ok", "Health test added.");
}

export async function addShowRecord(form: FormData) {
  await requireSeller();
  const animalId = str(form, "animal_id");
  const supabase = await createClient();
  const { error } = await supabase.from("show_records").insert({
    animal_id: animalId,
    show_name: str(form, "show_name"),
    show_date: str(form, "show_date") || null,
    class_name: str(form, "class_name"),
    place: str(form, "place"),
  });
  if (error) backWith(`/animals/${animalId}`, "error", friendlyError(error.message));
  backWith(`/animals/${animalId}`, "ok", "Show record added.");
}

export async function deleteRecord(form: FormData) {
  await requireSeller();
  const animalId = str(form, "animal_id");
  const table = str(form, "table");
  if (!["health_tests", "show_records"].includes(table)) backWith(`/animals/${animalId}`, "error", "Unknown record");
  const supabase = await createClient();
  const { error } = await supabase.from(table).delete().eq("id", str(form, "id")).eq("animal_id", animalId);
  if (error) backWith(`/animals/${animalId}`, "error", friendlyError(error.message));
  backWith(`/animals/${animalId}`, "ok", "Removed.");
}

// Called after the browser uploads a file straight to storage.
export async function recordMedia(animalId: string, path: string, kind: "photo" | "video") {
  const member = await requireSeller();
  if (!path.startsWith(`${member.id}/`)) return { ok: false, error: "Upload path is not yours" };
  const supabase = await createClient();
  const { error } = await supabase
    .from("animal_media")
    .insert({ animal_id: animalId, owner_id: member.id, kind, path });
  if (error) {
    await supabase.storage.from("media").remove([path]);
    return { ok: false, error: friendlyError(error.message) };
  }
  return { ok: true };
}

export async function deleteMedia(form: FormData) {
  await requireSeller();
  const animalId = str(form, "animal_id");
  const supabase = await createClient();
  const { data } = await supabase.from("animal_media").select("path").eq("id", str(form, "id")).single();
  const { error } = await supabase.from("animal_media").delete().eq("id", str(form, "id"));
  if (error) backWith(`/animals/${animalId}`, "error", friendlyError(error.message));
  if (data) await supabase.storage.from("media").remove([data.path]);
  backWith(`/animals/${animalId}`, "ok", "Removed.");
}

export async function makeCoverPhoto(form: FormData) {
  await requireSeller();
  const animalId = str(form, "animal_id");
  const supabase = await createClient();
  const { data: all } = await supabase.from("animal_media").select("id").eq("animal_id", animalId).eq("kind", "photo");
  const chosen = str(form, "id");
  for (const m of all ?? []) {
    await supabase.from("animal_media").update({ sort_order: m.id === chosen ? 0 : 1 }).eq("id", m.id);
  }
  backWith(`/animals/${animalId}`, "ok", "Cover photo set.");
}
