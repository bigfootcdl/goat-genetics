import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";
import { Notice, one, type SP } from "@/components/notice";
import { SubmitButton } from "@/components/submit-button";
import { LISTING_TYPES, type ListingType } from "@/lib/listing-types";
import { formatPrice } from "@/lib/format";
import { updateListingAdmin, updateSettings } from "../actions";

export const metadata = { title: "Listings" };

export default async function AdminListingsPage({ searchParams }: { searchParams: SP }) {
  await requireAdmin();
  const sp = await searchParams;
  const supabase = await createClient();
  const [{ data: listings }, { data: settings }] = await Promise.all([
    supabase.from("listing_cards").select("*").order("created_at", { ascending: false }).limit(300),
    supabase.from("site_settings").select("*").eq("id", 1).single(),
  ]);

  return (
    <div className="space-y-6">
      <Notice error={one(sp.error)} ok={one(sp.ok)} />
      <form action={updateSettings} className="card flex flex-wrap items-center gap-4 p-4">
        <h2 className="font-medium">Public front page</h2>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="show_prices_public" defaultChecked={settings?.show_prices_public} />
          Show prices to visitors who aren&apos;t signed in
        </label>
        <SubmitButton className="btn-secondary">Save</SubmitButton>
        <Link href="/" className="text-sm text-brand-700 hover:underline">View front page</Link>
      </form>
      <p className="muted">
        The front page shows listings you feature, plus Top tier listings whose seller asked for it. Pausing a listing
        hides it from everyone but its seller.
      </p>
      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-stone-200 text-left text-stone-500">
            <tr>
              <th className="p-3 font-normal">Listing</th>
              <th className="p-3 font-normal">Seller</th>
              <th className="p-3 font-normal">Price</th>
              <th className="p-3 font-normal">Status</th>
              <th className="p-3 font-normal">Front page</th>
              <th className="p-3 font-normal">Visibility</th>
            </tr>
          </thead>
          <tbody>
            {(listings ?? []).map((l) => (
              <tr key={l.id} className="border-b border-stone-100 last:border-0">
                <td className="p-3">
                  <Link href={`/listings/${l.id}`} className="font-medium hover:underline">{l.title}</Link>
                  <div className="text-xs text-stone-500">{LISTING_TYPES[l.type as ListingType].label} · {l.animal_name}</div>
                </td>
                <td className="p-3">{l.farm_name || l.seller_name}</td>
                <td className="p-3">{formatPrice(l.price, l.price_unit)}</td>
                <td className="p-3 capitalize">{l.status}</td>
                <td className="p-3">
                  <Toggle id={l.id} field="featured" on={l.featured} onLabel="Featured ✓" offLabel="Feature" />
                  {l.wants_front_page && !l.featured && <div className="mt-1 text-xs text-stone-500">Seller asked (Top tier)</div>}
                </td>
                <td className="p-3">
                  <Toggle id={l.id} field="paused_by_admin" on={l.paused_by_admin} onLabel="Paused (unpause)" offLabel="Pause" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Toggle({ id, field, on, onLabel, offLabel }: { id: string; field: string; on: boolean; onLabel: string; offLabel: string }) {
  return (
    <form action={updateListingAdmin}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="field" value={field} />
      <input type="hidden" name="value" value={on ? "false" : "true"} />
      <button className={`rounded px-2 py-1 text-xs ${on ? "bg-brand-600 text-white" : "border border-stone-300 bg-white text-stone-700"}`}>
        {on ? onLabel : offLabel}
      </button>
    </form>
  );
}
