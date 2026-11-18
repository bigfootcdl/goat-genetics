import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireMember } from "@/lib/auth";
import { loadAnimal } from "@/lib/animal";
import { LISTING_TYPES, type ListingType } from "@/lib/listing-types";
import { formatDate, formatPrice } from "@/lib/format";
import { AnimalFacts, AnimalRecords, MediaGallery } from "@/components/animal-details";
import { Notice, one, type SP } from "@/components/notice";
import { SubmitButton } from "@/components/submit-button";
import { contactSeller, reportListing, setListingStatus, toggleSaved } from "../actions";

export default async function ListingPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: SP }) {
  const member = await requireMember();
  const { id } = await params;
  const sp = await searchParams;
  const supabase = await createClient();
  const { data: listing } = await supabase.from("listings").select("*").eq("id", id).maybeSingle();
  if (!listing) notFound();
  const [bundle, sellerRes, savedRes, convoRes] = await Promise.all([
    loadAnimal(supabase, listing.animal_id),
    supabase.from("profiles").select("id,full_name,farm_name,city,state,phone,email,website").eq("id", listing.seller_id).single(),
    supabase.from("saved_listings").select("listing_id").eq("member_id", member.id).eq("listing_id", id).maybeSingle(),
    supabase.from("conversations").select("id").eq("listing_id", id).eq("buyer_id", member.id).maybeSingle(),
  ]);
  if (!bundle) notFound();
  const seller = sellerRes.data!;
  const t = LISTING_TYPES[listing.type as ListingType];
  const isOwner = listing.seller_id === member.id;
  const details = (listing.details ?? {}) as Record<string, string>;
  const detailRows = t.fields
    .map((f) => [f.label, f.input === "date" ? formatDate(details[f.key]) : details[f.key]] as const)
    .filter(([, v]) => v);

  return (
    <div>
      <Notice error={one(sp.error)} ok={one(sp.ok)} />
      <div className="mb-4 text-sm">
        <Link href="/browse" className="text-brand-700 hover:underline">← Back to listings</Link>
      </div>
      {listing.paused_by_admin && (
        <div className="mb-4 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          The site owner has paused this listing. Other members can&apos;t see it.
        </div>
      )}
      <div className="grid gap-8 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <MediaGallery media={bundle.media} />
        </div>
        <div className="space-y-5 lg:col-span-2">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="badge bg-brand-100 text-brand-700">{t.label}</span>
              <span className={`badge capitalize ${listing.status === "available" ? "bg-green-100 text-green-800" : "bg-stone-200 text-stone-700"}`}>
                {listing.status}
              </span>
            </div>
            <h1 className="h1 mt-2">{listing.title}</h1>
            <p className="mt-1 text-xl font-semibold text-brand-700">{formatPrice(listing.price, listing.price_unit)}</p>
            {listing.quantity !== null && <p className="muted">{listing.quantity} available</p>}
          </div>

          {listing.description && <p className="whitespace-pre-line text-stone-700">{listing.description}</p>}

          {detailRows.length > 0 && (
            <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              {detailRows.map(([k, v]) => (
                <div key={k}>
                  <dt className="text-stone-500">{k}</dt>
                  <dd>{v}</dd>
                </div>
              ))}
            </dl>
          )}

          <div className="card p-4">
            <h2 className="text-sm font-medium text-stone-500">{bundle.animal.sex === "buck" ? "The buck" : "The doe"}</h2>
            <p className="mt-1 font-medium">
              <Link href={`/animals/${bundle.animal.id}`} className="hover:underline">{bundle.animal.name}</Link>
            </p>
            <div className="mt-3">
              <AnimalFacts bundle={bundle} />
            </div>
          </div>

          <div className="card p-4">
            <h2 className="text-sm font-medium text-stone-500">Seller</h2>
            <p className="mt-1 font-medium">
              <Link href={`/members/${seller.id}`} className="hover:underline">{seller.farm_name || seller.full_name}</Link>
            </p>
            <p className="text-sm text-stone-600">
              {seller.full_name}
              {seller.city || seller.state ? ` · ${[seller.city, seller.state].filter(Boolean).join(", ")}` : ""}
            </p>
            {seller.phone && <p className="text-sm text-stone-600">{seller.phone}</p>}
          </div>

          {isOwner ? (
            <div className="card space-y-3 p-4">
              <h2 className="font-medium">Your listing</h2>
              <div className="flex flex-wrap gap-2">
                <Link href={`/listings/${id}/edit`} className="btn-secondary">Edit listing</Link>
                {(["available", "pending", "sold"] as const)
                  .filter((s) => s !== listing.status)
                  .map((s) => (
                    <form key={s} action={setListingStatus}>
                      <input type="hidden" name="id" value={id} />
                      <input type="hidden" name="status" value={s} />
                      <SubmitButton className="btn-secondary">{s === "sold" ? "Mark as sold" : s === "pending" ? "Mark pending" : "Mark available"}</SubmitButton>
                    </form>
                  ))}
              </div>
            </div>
          ) : (
            <div className="card space-y-3 p-4">
              {convoRes.data ? (
                <Link href={`/messages/${convoRes.data.id}`} className="btn-primary w-full">Open your conversation</Link>
              ) : (
                <form action={contactSeller} className="space-y-2">
                  <input type="hidden" name="listing_id" value={id} />
                  <label className="label" htmlFor="body">Message the seller</label>
                  <textarea id="body" name="body" required rows={3} className="input" defaultValue={`Hi, is ${listing.title} still available?`} />
                  <SubmitButton className="btn-primary w-full" pendingText="Sending…">Send message</SubmitButton>
                </form>
              )}
              <form action={toggleSaved}>
                <input type="hidden" name="listing_id" value={id} />
                <input type="hidden" name="saved" value={savedRes.data ? "1" : ""} />
                <SubmitButton className="btn-secondary w-full">{savedRes.data ? "Saved ✓ (remove)" : "Save listing"}</SubmitButton>
              </form>
              <details className="text-sm">
                <summary className="cursor-pointer text-stone-500">Report a problem with this listing</summary>
                <form action={reportListing} className="mt-2 space-y-2">
                  <input type="hidden" name="listing_id" value={id} />
                  <textarea name="reason" required rows={2} className="input" placeholder="What's wrong? Only the site owner sees this." />
                  <SubmitButton className="btn-danger">Send report</SubmitButton>
                </form>
              </details>
            </div>
          )}

          <Checklist live={t.live} />
        </div>
      </div>

      <div className="mt-10 max-w-4xl">
        <AnimalRecords bundle={bundle} />
      </div>
    </div>
  );
}

function Checklist({ live }: { live: boolean }) {
  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
      <h2 className="font-medium">{live ? "Before a live animal travels" : "Before genetics ship"}</h2>
      <ul className="mt-2 list-disc space-y-1 pl-5">
        {live ? (
          <>
            <li>Official scrapie ID tag on the animal</li>
            <li>Certificate of Veterinary Inspection (health certificate) for travel across state lines</li>
            <li>Check the destination state&apos;s extra test rules</li>
            <li>Registration papers and transfer signed by the seller</li>
          </>
        ) : (
          <>
            <li>Ship in a charged dry shipper (no free liquid nitrogen)</li>
            <li>Ask for donor health tests; some states require them</li>
            <li>Get the semen or embryo transfer form for registering kids</li>
            <li>Check whether the sire has DNA on file with the registry</li>
          </>
        )}
      </ul>
      <Link href="/guides" className="mt-2 inline-block underline">Read the guides</Link>
    </div>
  );
}
