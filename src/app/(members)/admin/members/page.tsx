import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";
import { Notice, one, type SP } from "@/components/notice";
import { formatDate } from "@/lib/format";
import { TIERS, type Tier } from "@/lib/tiers";
import { updateMember } from "../actions";

export const metadata = { title: "Members" };

export default async function AdminMembersPage({ searchParams }: { searchParams: SP }) {
  await requireAdmin();
  const sp = await searchParams;
  const supabase = await createClient();
  const { data: members } = await supabase.from("profiles").select("*").order("created_at");
  const { data: counts } = await supabase.from("listings").select("seller_id").neq("status", "sold");
  const listingCount = new Map<string, number>();
  (counts ?? []).forEach((c) => listingCount.set(c.seller_id, (listingCount.get(c.seller_id) ?? 0) + 1));

  return (
    <div>
      <Notice error={one(sp.error)} ok={one(sp.ok)} />
      <h1 className="h1">Members ({members?.length ?? 0})</h1>
      <p className="muted mt-1">Change a member&apos;s tier, mark founding members, record paid-through dates, or pause an account.</p>
      <div className="card mt-4 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-stone-200 text-left text-stone-500">
            <tr>
              <th className="p-3 font-normal">Member</th>
              <th className="p-3 font-normal">Joined</th>
              <th className="p-3 font-normal">Listings</th>
              <th className="p-3 font-normal">Tier</th>
              <th className="p-3 font-normal">Founding</th>
              <th className="p-3 font-normal">Paid through</th>
              <th className="p-3 font-normal">Status</th>
              <th className="p-3 font-normal"></th>
            </tr>
          </thead>
          <tbody>
            {(members ?? []).map((m) => {
              const formId = `m-${m.id}`;
              return (
                <tr key={m.id} className="border-b border-stone-100 last:border-0">
                  <td className="p-3">
                    <Link href={`/members/${m.id}`} className="font-medium hover:underline">{m.farm_name || m.full_name}</Link>
                    <div className="text-xs text-stone-500">
                      {m.full_name} · {m.email}
                      {m.state ? ` · ${m.state}` : ""}
                      {m.is_admin ? " · site owner" : ""}
                    </div>
                  </td>
                  <td className="p-3">{formatDate(m.created_at)}</td>
                  <td className="p-3">{listingCount.get(m.id) ?? 0}</td>
                  <td className="p-3">
                    <form id={formId} action={updateMember}>
                      <input type="hidden" name="id" value={m.id} />
                    </form>
                    <select form={formId} name="tier" defaultValue={m.tier} className="input py-1" aria-label="Tier">
                      {(Object.keys(TIERS) as Tier[]).map((t) => (
                        <option key={t} value={t}>{TIERS[t].name}</option>
                      ))}
                    </select>
                  </td>
                  <td className="p-3">
                    <input form={formId} type="checkbox" name="is_founding" defaultChecked={m.is_founding} aria-label="Founding member" />
                  </td>
                  <td className="p-3">
                    <input form={formId} type="date" name="paid_through" defaultValue={m.paid_through ?? ""} className="input py-1" aria-label="Paid through" />
                  </td>
                  <td className="p-3">
                    <select form={formId} name="status" defaultValue={m.status} className="input py-1" aria-label="Status">
                      <option value="active">Active</option>
                      <option value="suspended">Paused</option>
                    </select>
                  </td>
                  <td className="p-3">
                    <button form={formId} className="btn-secondary px-3 py-1">Save</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
