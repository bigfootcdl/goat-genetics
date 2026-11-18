import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireSeller } from "@/lib/auth";
import { ListingForm } from "@/components/listing-form";
import { Notice, one, type SP } from "@/components/notice";
import { SubmitButton } from "@/components/submit-button";
import { effectiveTier } from "@/lib/tiers";
import { deleteListing, updateListing } from "../../actions";

export const metadata = { title: "Edit listing" };

export default async function EditListingPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: SP }) {
  const member = await requireSeller();
  const { id } = await params;
  const sp = await searchParams;
  const supabase = await createClient();
  const { data: listing } = await supabase.from("listings").select("*").eq("id", id).maybeSingle();
  if (!listing) notFound();
  if (listing.seller_id !== member.id) redirect(`/listings/${id}`);
  const { data: animals } = await supabase.from("animals").select("id,name,sex").eq("owner_id", member.id).order("name");
  return (
    <div className="max-w-3xl">
      <h1 className="h1">Edit listing</h1>
      <div className="mt-6">
        <Notice error={one(sp.error)} />
        <ListingForm
          action={updateListing}
          animals={animals ?? []}
          initial={listing}
          canFrontPage={effectiveTier(member) === "top"}
          submitLabel="Save changes"
        />
        <form action={deleteListing} className="mt-6">
          <input type="hidden" name="id" value={id} />
          <SubmitButton className="btn-danger" confirm="Delete this listing for good?">Delete listing</SubmitButton>
        </form>
      </div>
    </div>
  );
}
