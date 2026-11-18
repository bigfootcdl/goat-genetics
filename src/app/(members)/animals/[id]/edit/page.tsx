import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireSeller } from "@/lib/auth";
import { AnimalForm } from "@/components/animal-form";
import { Notice, one, type SP } from "@/components/notice";
import { SubmitButton } from "@/components/submit-button";
import { loadParentOptions } from "@/lib/parents";
import type { Animal } from "@/lib/animal";
import { deleteAnimal, updateAnimal } from "../../actions";

export const metadata = { title: "Edit animal" };

export default async function EditAnimalPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: SP }) {
  const member = await requireSeller();
  const { id } = await params;
  const sp = await searchParams;
  const supabase = await createClient();
  const { data: animal } = await supabase.from("animals").select("*").eq("id", id).maybeSingle();
  if (!animal) notFound();
  if (animal.owner_id !== member.id && !member.is_admin) redirect(`/animals/${id}`);
  const { bucks, does } = await loadParentOptions(supabase, id);
  return (
    <div className="max-w-4xl">
      <h1 className="h1">Edit {animal.name}</h1>
      <div className="mt-6">
        <Notice error={one(sp.error)} />
        <AnimalForm action={updateAnimal} animal={animal as Animal} bucks={bucks} does={does} submitLabel="Save changes" />
        <form action={deleteAnimal} className="mt-8">
          <input type="hidden" name="id" value={id} />
          <SubmitButton className="btn-danger" confirm="Delete this animal, its photos and all its listings?">Delete animal</SubmitButton>
        </form>
      </div>
    </div>
  );
}
