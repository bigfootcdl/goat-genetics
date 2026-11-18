import type { SupabaseClient } from "@supabase/supabase-js";

export type PedigreeNode = {
  id: string | null;
  name: string;
  registration: string;
  sire: PedigreeNode | null;
  dam: PedigreeNode | null;
};

type Row = {
  id: string;
  name: string;
  registration_number: string;
  registry: string;
  sire_id: string | null;
  dam_id: string | null;
  sire_name: string;
  sire_registration: string;
  dam_name: string;
  dam_registration: string;
};

const COLS = "id,name,registration_number,registry,sire_id,dam_id,sire_name,sire_registration,dam_name,dam_registration";

// Builds the pedigree from linked animal records, falling back to the names
// typed on the animal when a parent isn't on the site. One query per generation.
export async function loadPedigree(
  supabase: SupabaseClient,
  animal: Row,
  generations = 3,
): Promise<PedigreeNode> {
  const rows = new Map<string, Row>([[animal.id, animal]]);
  let frontier = [animal];
  for (let g = 0; g < generations; g++) {
    const ids = frontier.flatMap((r) => [r.sire_id, r.dam_id]).filter((x): x is string => !!x && !rows.has(x));
    if (!ids.length) break;
    const { data } = await supabase.from("animals").select(COLS).in("id", ids);
    frontier = (data ?? []) as Row[];
    frontier.forEach((r) => rows.set(r.id, r));
  }

  function build(row: Row, depth: number): PedigreeNode {
    const reg = [row.registry, row.registration_number].filter(Boolean).join(" ");
    const node: PedigreeNode = { id: row.id, name: row.name, registration: reg, sire: null, dam: null };
    if (depth >= generations) return node;
    node.sire = parent(row.sire_id, row.sire_name, row.sire_registration, depth);
    node.dam = parent(row.dam_id, row.dam_name, row.dam_registration, depth);
    return node;
  }

  function parent(id: string | null, name: string, reg: string, depth: number): PedigreeNode | null {
    if (id && rows.has(id)) return build(rows.get(id)!, depth + 1);
    if (name) return { id: null, name, registration: reg, sire: null, dam: null };
    return null;
  }

  return build(animal, 0);
}
