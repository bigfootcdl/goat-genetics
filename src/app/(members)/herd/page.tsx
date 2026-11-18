import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireSeller } from "@/lib/auth";
import { Notice, one, type SP } from "@/components/notice";
import { LISTING_TYPES, gradeLabel, type ListingType } from "@/lib/listing-types";
import { formatPrice, mediaUrl } from "@/lib/format";
import { TIERS, effectiveTier } from "@/lib/tiers";

export const metadata = { title: "My herd" };

export default async function HerdPage({ searchParams }: { searchParams: SP }) {
  const member = await requireSeller();
  const sp = await searchParams;
  const supabase = await createClient();
  const [{ data: animals }, { data: listings }] = await Promise.all([
    supabase
      .from("animals")
      .select("id,name,sex,breed,breed_grade,registration_number,animal_media(path,kind,sort_order)")
      .eq("owner_id", member.id)
      .order("name"),
    supabase.from("listing_cards").select("*").eq("seller_id", member.id).order("created_at", { ascending: false }),
  ]);
  const tier = TIERS[effectiveTier(member)];
  const active = (listings ?? []).filter((l) => l.status !== "sold").length;

  return (
    <div className="space-y-10">
      <Notice error={one(sp.error)} ok={one(sp.ok)} />
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="h1">My herd</h1>
          <p className="muted">
            {tier.name}
            {member.is_founding ? " (founding member)" : ""} · {active} of {tier.listings} active listings used ·{" "}
            <Link href={`/members/${member.id}`} className="text-brand-700 hover:underline">See your herd page</Link>
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/animals/new" className="btn-secondary">Add an animal</Link>
          <Link href="/listings/new" className="btn-primary">New listing</Link>
        </div>
      </div>

      <section>
        <h2 className="h2">Animals ({animals?.length ?? 0})</h2>
        {!animals?.length ? (
          <p className="mt-3 rounded-lg border border-dashed border-stone-300 p-8 text-center text-stone-500">
            Start by adding a buck or doe. Listings for semen, embryos or the animal itself hang off it.
          </p>
        ) : (
          <ul className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {animals.map((a) => {
              const photo = (a.animal_media as { path: string; kind: string; sort_order: number }[])
                .filter((m) => m.kind === "photo")
                .sort((x, y) => x.sort_order - y.sort_order)[0];
              return (
                <li key={a.id}>
                  <Link href={`/animals/${a.id}`} className="card flex items-center gap-3 p-3 hover:shadow-md">
                    {photo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={mediaUrl(photo.path)!} alt="" className="h-14 w-14 rounded object-cover" />
                    ) : (
                      <div className="h-14 w-14 rounded bg-brand-100" />
                    )}
                    <div>
                      <div className="font-medium">{a.name}</div>
                      <div className="text-xs text-stone-500">
                        {a.sex === "buck" ? "Buck" : "Doe"} · {a.breed} {gradeLabel(a.breed_grade).toLowerCase()}
                        {a.registration_number ? ` · ${a.registration_number}` : ""}
                      </div>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section>
        <h2 className="h2">Listings ({listings?.length ?? 0})</h2>
        {!listings?.length ? (
          <p className="muted mt-2">No listings yet.</p>
        ) : (
          <div className="card mt-3 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-stone-200 text-left text-stone-500">
                <tr>
                  <th className="p-3 font-normal">Listing</th>
                  <th className="p-3 font-normal">Type</th>
                  <th className="p-3 font-normal">Price</th>
                  <th className="p-3 font-normal">Status</th>
                  <th className="p-3 font-normal"></th>
                </tr>
              </thead>
              <tbody>
                {listings.map((l) => (
                  <tr key={l.id} className="border-b border-stone-100 last:border-0">
                    <td className="p-3">
                      <Link href={`/listings/${l.id}`} className="font-medium hover:underline">{l.title}</Link>
                      <div className="text-xs text-stone-500">{l.animal_name}</div>
                    </td>
                    <td className="p-3">{LISTING_TYPES[l.type as ListingType].short}</td>
                    <td className="p-3">{formatPrice(l.price, l.price_unit)}</td>
                    <td className="p-3 capitalize">
                      {l.status}
                      {l.paused_by_admin && <span className="badge ml-1 bg-amber-100 text-amber-800">paused by owner</span>}
                      {l.featured && <span className="badge ml-1 bg-green-100 text-green-800">on front page</span>}
                    </td>
                    <td className="p-3 text-right">
                      <Link href={`/listings/${l.id}/edit`} className="text-brand-700 hover:underline">Edit</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
