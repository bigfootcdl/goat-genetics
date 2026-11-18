import { createClient } from "@/lib/supabase/server";
import { requireSeller } from "@/lib/auth";
import { AnimalForm } from "@/components/animal-form";
import { Notice, one, type SP } from "@/components/notice";
import { loadParentOptions } from "@/lib/parents";
import { createAnimal } from "../actions";

export const metadata = { title: "Add an animal" };

export default async function NewAnimalPage({ searchParams }: { searchParams: SP }) {
  await requireSeller();
  const sp = await searchParams;
  const supabase = await createClient();
  const { bucks, does } = await loadParentOptions(supabase);
  return (
    <div className="max-w-4xl">
      <h1 className="h1">Add an animal</h1>
      <p className="muted mt-1">Enter a buck or doe once. Every listing and every offspring&apos;s pedigree reuses this record.</p>
      <div className="mt-6">
        <Notice error={one(sp.error)} />
        <AnimalForm action={createAnimal} bucks={bucks} does={does} submitLabel="Add animal" />
      </div>
    </div>
  );
}
