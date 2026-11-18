import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireSeller } from "@/lib/auth";
import { ListingForm } from "@/components/listing-form";
import { Notice, one, type SP } from "@/components/notice";
import { effectiveTier } from "@/lib/tiers";
import type { ListingType } from "@/lib/listing-types";
import { createListing } from "../actions";

export const metadata = { title: "New listing" };

export default async function NewListingPage({ searchParams }: { searchParams: SP }) {
  const member = await requireSeller();
  const sp = await searchParams;
  const supabase = await createClient();
  const { data: animals } = await supabase.from("animals").select("id,name,sex").eq("owner_id", member.id).order("name");
  return (
    <div className="max-w-3xl">
      <h1 className="h1">New listing</h1>
      <p className="muted mt-1">Each listing hangs off an animal in your herd, so its pedigree and records show automatically.</p>
      <div className="mt-6">
        <Notice error={one(sp.error)} />
        {!animals?.length ? (
          <div className="card p-6">
            <p>You need an animal in your herd first.</p>
            <Link href="/animals/new" className="btn-primary mt-3">Add an animal</Link>
          </div>
        ) : (
          <ListingForm
            action={createListing}
            animals={animals}
            initial={{ animal_id: one(sp.animal), type: (one(sp.type) as ListingType) || undefined }}
            canFrontPage={effectiveTier(member) === "top"}
            submitLabel="Publish listing"
          />
        )}
      </div>
    </div>
  );
}
