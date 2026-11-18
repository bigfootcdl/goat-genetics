import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireMember } from "@/lib/auth";
import { ListingCard, type CardListing } from "@/components/listing-card";
import { gradeLabel } from "@/lib/listing-types";
import { formatDate } from "@/lib/format";

export const metadata = { title: "Herd page" };

export default async function MemberPage({ params }: { params: Promise<{ id: string }> }) {
  const me = await requireMember();
  const { id } = await params;
  const supabase = await createClient();
  const { data: p } = await supabase.from("profiles").select("*").eq("id", id).maybeSingle();
  if (!p) notFound();
  const [{ data: listings }, { data: animals }] = await Promise.all([
    supabase.from("listing_cards").select("*").eq("seller_id", id).eq("status", "available").order("created_at", { ascending: false }),
    supabase.from("animals").select("id,name,sex,breed,breed_grade").eq("owner_id", id).order("name"),
  ]);

  return (
    <div className="space-y-8">
      <div className="card p-6">
        <h1 className="h1">{p.farm_name || p.full_name}</h1>
        <p className="muted">
          {p.full_name}
          {p.city || p.state ? ` · ${[p.city, p.state].filter(Boolean).join(", ")}` : ""} · Member since {formatDate(p.created_at)}
          {p.is_founding && <span className="badge ml-2 bg-brand-100 text-brand-700">Founding member</span>}
        </p>
        {p.bio && <p className="mt-3 max-w-3xl whitespace-pre-line text-stone-700">{p.bio}</p>}
        <div className="mt-3 flex flex-wrap gap-4 text-sm text-stone-600">
          {p.phone && <span>📞 {p.phone}</span>}
          <span>✉️ {p.email}</span>
          {p.website && (
            <a href={p.website.startsWith("http") ? p.website : `https://${p.website}`} target="_blank" rel="noreferrer" className="text-brand-700 hover:underline">
              {p.website}
            </a>
          )}
        </div>
        {me.id === id && <Link href="/account" className="btn-secondary mt-4">Edit my profile</Link>}
      </div>

      <section>
        <h2 className="h2">Available now ({listings?.length ?? 0})</h2>
        {listings?.length ? (
          <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {listings.map((l) => (
              <ListingCard key={l.id} listing={l as CardListing} href={`/listings/${l.id}`} />
            ))}
          </div>
        ) : (
          <p className="muted mt-2">Nothing listed right now.</p>
        )}
      </section>

      {animals && animals.length > 0 && (
        <section>
          <h2 className="h2">The herd</h2>
          <ul className="mt-3 flex flex-wrap gap-2">
            {animals.map((a) => (
              <li key={a.id}>
                <Link href={`/animals/${a.id}`} className="badge bg-white px-3 py-1 text-sm text-stone-700 ring-1 ring-stone-200 hover:bg-stone-50">
                  {a.name} · {a.sex} · {a.breed} {gradeLabel(a.breed_grade).toLowerCase()}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
