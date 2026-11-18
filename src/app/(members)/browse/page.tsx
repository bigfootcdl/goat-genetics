import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireMember } from "@/lib/auth";
import { ListingCard, type CardListing } from "@/components/listing-card";
import { one, type SP } from "@/components/notice";
import { BREEDS, BREED_GRADES, LISTING_TYPES, LISTING_TYPE_KEYS, US_STATES } from "@/lib/listing-types";

export const metadata = { title: "Browse" };

export default async function BrowsePage({ searchParams }: { searchParams: SP }) {
  await requireMember();
  const sp = await searchParams;
  const q = one(sp.q)?.trim() ?? "";
  const type = one(sp.type) ?? "";
  const breed = one(sp.breed) ?? "";
  const grade = one(sp.grade) ?? "";
  const state = one(sp.state) ?? "";
  const maxPrice = one(sp.max_price) ?? "";
  const show = one(sp.show) ?? "available";
  const sort = one(sp.sort) ?? "newest";

  const supabase = await createClient();
  let query = supabase.from("listing_cards").select("*").eq("paused_by_admin", false).limit(120);
  if (show === "available") query = query.eq("status", "available");
  else if (show === "sold") query = query.eq("status", "sold");
  else query = query.neq("status", "sold");
  if (type && type in LISTING_TYPES) query = query.eq("type", type);
  if (breed) query = query.eq("breed", breed);
  if (grade) query = query.eq("breed_grade", grade);
  if (state) query = query.eq("state", state);
  if (maxPrice && !Number.isNaN(Number(maxPrice))) query = query.lte("price", Number(maxPrice));
  for (const word of q.toLowerCase().split(/\s+/).filter(Boolean).slice(0, 6)) {
    query = query.ilike("search_text", `%${word.replace(/[%_\\]/g, "")}%`);
  }
  if (sort === "price_low") query = query.order("price", { ascending: true, nullsFirst: false });
  else if (sort === "price_high") query = query.order("price", { ascending: false, nullsFirst: false });
  else query = query.order("created_at", { ascending: false });

  const { data, error } = await query;
  const listings = (data ?? []) as CardListing[];
  const filtersOn = Boolean(q || type || breed || grade || state || maxPrice || show !== "available");

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="h1">Browse listings</h1>
          <p className="muted">Genetics and breeding stock from member herds.</p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <TypeChip label="All" active={!type} href={hrefWith(sp, { type: "" })} />
        {LISTING_TYPE_KEYS.map((k) => (
          <TypeChip key={k} label={LISTING_TYPES[k].label} active={type === k} href={hrefWith(sp, { type: k })} />
        ))}
      </div>

      <form className="card mt-4 grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-6" action="/browse">
        {type && <input type="hidden" name="type" value={type} />}
        <div className="sm:col-span-2">
          <label className="label" htmlFor="q">Search</label>
          <input id="q" name="q" defaultValue={q} placeholder="Name, bloodline, registration #…" className="input" />
        </div>
        <div>
          <label className="label" htmlFor="breed">Breed</label>
          <select id="breed" name="breed" defaultValue={breed} className="input">
            <option value="">Any</option>
            {BREEDS.map((b) => <option key={b}>{b}</option>)}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="grade">Fullblood / percentage</label>
          <select id="grade" name="grade" defaultValue={grade} className="input">
            <option value="">Any</option>
            {BREED_GRADES.map((g) => <option key={g.value} value={g.value}>{g.label}</option>)}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="state">Seller&apos;s state</label>
          <select id="state" name="state" defaultValue={state} className="input">
            <option value="">Any</option>
            {US_STATES.map((s) => <option key={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="max_price">Max price ($)</label>
          <input id="max_price" name="max_price" type="number" min={0} defaultValue={maxPrice} className="input" />
        </div>
        <div>
          <label className="label" htmlFor="show">Show</label>
          <select id="show" name="show" defaultValue={show} className="input">
            <option value="available">Available</option>
            <option value="all">Available and pending</option>
            <option value="sold">Sold</option>
          </select>
        </div>
        <div>
          <label className="label" htmlFor="sort">Sort by</label>
          <select id="sort" name="sort" defaultValue={sort} className="input">
            <option value="newest">Newest</option>
            <option value="price_low">Price, low to high</option>
            <option value="price_high">Price, high to low</option>
          </select>
        </div>
        <div className="flex items-end gap-2 sm:col-span-2 lg:col-span-4">
          <button className="btn-primary">Search</button>
          {filtersOn && <Link href="/browse" className="btn-secondary">Clear</Link>}
        </div>
      </form>

      {error && <p className="mt-4 text-sm text-red-700">Could not load listings: {error.message}</p>}
      <p className="muted mt-6">{listings.length} {listings.length === 1 ? "listing" : "listings"}</p>
      {listings.length === 0 ? (
        <p className="mt-4 rounded-lg border border-dashed border-stone-300 p-10 text-center text-stone-500">
          Nothing matches yet. Try fewer filters.
        </p>
      ) : (
        <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {listings.map((l) => (
            <ListingCard key={l.id} listing={l} href={`/listings/${l.id}`} />
          ))}
        </div>
      )}
    </div>
  );
}

function TypeChip({ label, active, href }: { label: string; active: boolean; href: string }) {
  return (
    <Link
      href={href}
      className={`rounded-full border px-3 py-1 text-sm ${
        active ? "border-brand-600 bg-brand-600 text-white" : "border-stone-300 bg-white text-stone-700 hover:bg-stone-50"
      }`}
    >
      {label}
    </Link>
  );
}

function hrefWith(sp: Record<string, string | string[] | undefined>, change: Record<string, string>) {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(sp)) {
    const val = one(v);
    if (val) params.set(k, val);
  }
  for (const [k, v] of Object.entries(change)) {
    if (v) params.set(k, v);
    else params.delete(k);
  }
  const s = params.toString();
  return s ? `/browse?${s}` : "/browse";
}

