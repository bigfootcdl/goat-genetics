import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireMember } from "@/lib/auth";
import { loadAnimal } from "@/lib/animal";
import { AnimalFacts, AnimalRecords, MediaGallery } from "@/components/animal-details";
import { ListingCard, type CardListing } from "@/components/listing-card";
import { MediaUploader } from "@/components/media-uploader";
import { Notice, one, type SP } from "@/components/notice";
import { SubmitButton } from "@/components/submit-button";
import { HEALTH_TESTS } from "@/lib/listing-types";
import { formatDate, mediaUrl } from "@/lib/format";
import { TIERS, effectiveTier } from "@/lib/tiers";
import { addHealthTest, addShowRecord, deleteMedia, deleteRecord, makeCoverPhoto } from "../actions";

export default async function AnimalPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: SP }) {
  const member = await requireMember();
  const { id } = await params;
  const sp = await searchParams;
  const supabase = await createClient();
  const bundle = await loadAnimal(supabase, id);
  if (!bundle) notFound();
  const a = bundle.animal;
  const isOwner = a.owner_id === member.id;
  const [{ data: owner }, { data: listings }] = await Promise.all([
    supabase.from("profiles").select("id,farm_name,full_name,state").eq("id", a.owner_id).single(),
    supabase.from("listing_cards").select("*").eq("animal_id", id).neq("status", "sold").order("created_at", { ascending: false }),
  ]);
  const tier = TIERS[effectiveTier(member)];
  const photos = bundle.media.filter((m) => m.kind === "photo").length;
  const videos = bundle.media.filter((m) => m.kind === "video").length;

  return (
    <div>
      <Notice error={one(sp.error)} ok={one(sp.ok)} />
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="h1">{a.name}</h1>
          <p className="muted">
            Owned by{" "}
            <Link href={`/members/${owner?.id}`} className="text-brand-700 hover:underline">{owner?.farm_name || owner?.full_name}</Link>
            {owner?.state ? `, ${owner.state}` : ""}
          </p>
        </div>
        {isOwner && (
          <div className="flex flex-wrap gap-2">
            <Link href={`/listings/new?animal=${id}`} className="btn-primary">List genetics or this animal</Link>
            <Link href={`/animals/${id}/edit`} className="btn-secondary">Edit details</Link>
          </div>
        )}
      </div>

      <div className="mt-6 grid gap-8 lg:grid-cols-5">
        <div className="space-y-4 lg:col-span-3">
          <MediaGallery media={bundle.media} />
          {isOwner && (
            <div className="card space-y-3 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="font-medium">Photos and videos</h2>
                <span className="muted">
                  {photos}/{tier.photos} photos · {videos}/{tier.videos} videos on your plan
                </span>
              </div>
              <MediaUploader animalId={id} ownerId={member.id} />
              {bundle.media.length > 0 && (
                <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                  {bundle.media.map((m) => (
                    <li key={m.id} className="space-y-1 text-xs">
                      {m.kind === "photo" ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={mediaUrl(m.path)!} alt="" className="aspect-square w-full rounded object-cover" />
                      ) : (
                        <div className="flex aspect-square items-center justify-center rounded bg-stone-800 text-white">Video</div>
                      )}
                      <div className="flex gap-2">
                        {m.kind === "photo" && (
                          <form action={makeCoverPhoto}>
                            <input type="hidden" name="animal_id" value={id} />
                            <input type="hidden" name="id" value={m.id} />
                            <button className="text-brand-700 hover:underline">Cover</button>
                          </form>
                        )}
                        <form action={deleteMedia}>
                          <input type="hidden" name="animal_id" value={id} />
                          <input type="hidden" name="id" value={m.id} />
                          <button className="text-red-700 hover:underline">Remove</button>
                        </form>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
        <div className="space-y-4 lg:col-span-2">
          <div className="card p-4">
            <AnimalFacts bundle={bundle} />
            {a.description && <p className="mt-4 whitespace-pre-line text-sm text-stone-700">{a.description}</p>}
          </div>
          {listings && listings.length > 0 && (
            <div>
              <h2 className="h2">Current listings</h2>
              <div className="mt-2 grid gap-3">
                {listings.map((l) => (
                  <ListingCard key={l.id} listing={l as CardListing} href={`/listings/${l.id}`} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="mt-10 max-w-4xl">
        <AnimalRecords bundle={bundle} />
      </div>

      {isOwner && (
        <div className="mt-10 grid max-w-4xl gap-6 md:grid-cols-2">
          <div className="card p-4">
            <h2 className="font-medium">Add a health test</h2>
            <form action={addHealthTest} className="mt-3 grid grid-cols-2 gap-3">
              <input type="hidden" name="animal_id" value={id} />
              <select name="test_name" className="input" aria-label="Test">
                {HEALTH_TESTS.map((t) => <option key={t}>{t}</option>)}
              </select>
              <select name="result" className="input" aria-label="Result">
                <option value="negative">Negative</option>
                <option value="positive">Positive</option>
                <option value="pending">Pending</option>
              </select>
              <input name="test_date" type="date" className="input" aria-label="Test date" />
              <input name="lab" placeholder="Lab" className="input" />
              <div className="col-span-2"><SubmitButton className="btn-secondary">Add test</SubmitButton></div>
            </form>
            <RecordList
              animalId={id}
              table="health_tests"
              items={bundle.health.map((h) => ({ id: h.id, label: `${h.test_name}: ${h.result}${h.test_date ? ` (${formatDate(h.test_date)})` : ""}` }))}
            />
          </div>
          <div className="card p-4">
            <h2 className="font-medium">Add a show result</h2>
            <form action={addShowRecord} className="mt-3 grid grid-cols-2 gap-3">
              <input type="hidden" name="animal_id" value={id} />
              <input name="show_name" required placeholder="Show" className="input col-span-2" />
              <input name="class_name" placeholder="Class" className="input" />
              <input name="place" placeholder="Placing (e.g. 1st, Grand Champion)" className="input" />
              <input name="show_date" type="date" className="input" aria-label="Show date" />
              <div className="col-span-2"><SubmitButton className="btn-secondary">Add result</SubmitButton></div>
            </form>
            <RecordList
              animalId={id}
              table="show_records"
              items={bundle.shows.map((s) => ({ id: s.id, label: `${s.place} ${s.class_name}, ${s.show_name}` }))}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function RecordList({ animalId, table, items }: { animalId: string; table: string; items: { id: string; label: string }[] }) {
  if (!items.length) return null;
  return (
    <ul className="mt-4 divide-y divide-stone-100 text-sm">
      {items.map((i) => (
        <li key={i.id} className="flex items-center justify-between py-1.5">
          <span>{i.label}</span>
          <form action={deleteRecord}>
            <input type="hidden" name="animal_id" value={animalId} />
            <input type="hidden" name="table" value={table} />
            <input type="hidden" name="id" value={i.id} />
            <button className="text-xs text-red-700 hover:underline">Remove</button>
          </form>
        </li>
      ))}
    </ul>
  );
}
