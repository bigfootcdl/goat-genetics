import { createClient } from "@/lib/supabase/server";
import { requireMember } from "@/lib/auth";
import { ListingCard, type CardListing } from "@/components/listing-card";

export const metadata = { title: "Saved listings" };

export default async function SavedPage() {
  const member = await requireMember();
  const supabase = await createClient();
  const { data: saved } = await supabase
    .from("saved_listings")
    .select("listing_id, created_at")
    .eq("member_id", member.id)
    .order("created_at", { ascending: false });
  const ids = (saved ?? []).map((s) => s.listing_id);
  const { data } = ids.length
    ? await supabase.from("listing_cards").select("*").in("id", ids)
    : { data: [] };
  const byId = new Map((data ?? []).map((l) => [l.id, l as CardListing]));
  const listings = ids.map((id) => byId.get(id)).filter(Boolean) as CardListing[];

  return (
    <div>
      <h1 className="h1">Saved listings</h1>
      <p className="muted">Listings you&apos;ve saved to come back to.</p>
      {listings.length === 0 ? (
        <p className="mt-6 rounded-lg border border-dashed border-stone-300 p-10 text-center text-stone-500">
          Nothing saved yet. Use “Save” on any listing.
        </p>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {listings.map((l) => (
            <ListingCard key={l.id} listing={l} href={`/listings/${l.id}`} />
          ))}
        </div>
      )}
    </div>
  );
}
