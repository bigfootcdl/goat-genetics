import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";
import { Notice, one, type SP } from "@/components/notice";
import { SubmitButton } from "@/components/submit-button";
import { CopyButton } from "@/components/copy-button";
import { formatDate, siteUrl } from "@/lib/format";
import { TIERS, type Tier } from "@/lib/tiers";
import { createInvite, resendInvite, revokeInvite, setRequestStatus } from "./actions";

export const metadata = { title: "Invites" };

const FOUNDING_SEATS = 10;

export default async function AdminInvitesPage({ searchParams }: { searchParams: SP }) {
  await requireAdmin();
  const sp = await searchParams;
  const supabase = await createClient();
  const [{ data: invites }, { data: requests }, { count: foundingCount }, { count: memberCount }] = await Promise.all([
    supabase.from("invites").select("*").order("created_at", { ascending: false }).limit(200),
    supabase.from("invite_requests").select("*").eq("status", "new").order("created_at", { ascending: false }),
    supabase.from("profiles").select("id", { count: "exact", head: true }).eq("is_founding", true).eq("is_admin", false),
    supabase.from("profiles").select("id", { count: "exact", head: true }),
  ]);
  const fromRequest = requests?.find((r) => r.id === one(sp.request));

  function inviteState(i: { used_at: string | null; revoked: boolean; expires_at: string }) {
    if (i.used_at) return ["Joined", "bg-green-100 text-green-800"];
    if (i.revoked) return ["Withdrawn", "bg-stone-200 text-stone-600"];
    if (isExpired(i.expires_at)) return ["Expired", "bg-stone-200 text-stone-600"];
    return ["Waiting", "bg-amber-100 text-amber-800"];
  }

  return (
    <div className="space-y-8">
      <Notice error={one(sp.error)} ok={one(sp.ok)} />
      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Members" value={memberCount ?? 0} />
        <Stat label="Founding members" value={`${foundingCount ?? 0} of ${FOUNDING_SEATS}`} />
        <Stat label="Invite requests waiting" value={requests?.length ?? 0} />
      </div>

      <section className="grid gap-6 lg:grid-cols-2">
        <form action={createInvite} className="card grid gap-3 p-6 sm:grid-cols-2" id="invite-form">
          <h2 className="h2 sm:col-span-2">Send an invite</h2>
          {fromRequest && <input type="hidden" name="request_id" value={fromRequest.id} />}
          <div className="sm:col-span-2">
            <label className="label" htmlFor="email">Email</label>
            <input id="email" name="email" type="email" required defaultValue={fromRequest?.email} className="input" />
          </div>
          <div>
            <label className="label" htmlFor="full_name">Name</label>
            <input id="full_name" name="full_name" defaultValue={fromRequest?.name} className="input" />
          </div>
          <div>
            <label className="label" htmlFor="tier">Tier</label>
            <select id="tier" name="tier" defaultValue="seller" className="input">
              {(Object.keys(TIERS) as Tier[]).map((t) => (
                <option key={t} value={t}>{TIERS[t].name}</option>
              ))}
            </select>
          </div>
          <label className="flex items-center gap-2 text-sm sm:col-span-2">
            <input type="checkbox" name="is_founding" defaultChecked={(foundingCount ?? 0) < FOUNDING_SEATS} />
            Founding member (free for life, gets Top tier features)
          </label>
          <label className="flex items-center gap-2 text-sm sm:col-span-2">
            <input type="checkbox" name="send_email" defaultChecked /> Email the invite link now
          </label>
          <div className="sm:col-span-2">
            <label className="label" htmlFor="note">Private note</label>
            <input id="note" name="note" className="input" placeholder="Only you see this" />
          </div>
          <div className="sm:col-span-2">
            <SubmitButton pendingText="Creating…">Create invite</SubmitButton>
          </div>
        </form>

        <div className="card p-6">
          <h2 className="h2">Invite requests from the front page</h2>
          {!requests?.length ? (
            <p className="muted mt-2">No new requests.</p>
          ) : (
            <ul className="mt-3 divide-y divide-stone-100">
              {requests.map((r) => (
                <li key={r.id} className="py-3 text-sm">
                  <div className="font-medium">
                    {r.name} <span className="font-normal text-stone-500">· {r.email}</span>
                  </div>
                  <div className="text-stone-600">
                    {[r.farm_name, r.state].filter(Boolean).join(", ")} · {formatDate(r.created_at)}
                  </div>
                  {r.looking_for && <p className="mt-1 text-stone-700">“{r.looking_for}”</p>}
                  <div className="mt-2 flex gap-3">
                    <Link href={`/admin?request=${r.id}#invite-form`} className="text-brand-700 hover:underline">Invite</Link>
                    <form action={setRequestStatus}>
                      <input type="hidden" name="id" value={r.id} />
                      <input type="hidden" name="status" value="declined" />
                      <button className="text-stone-500 hover:underline">Decline</button>
                    </form>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section>
        <h2 className="h2">Invites</h2>
        <div className="card mt-3 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-stone-200 text-left text-stone-500">
              <tr>
                <th className="p-3 font-normal">Who</th>
                <th className="p-3 font-normal">Tier</th>
                <th className="p-3 font-normal">Sent</th>
                <th className="p-3 font-normal">Status</th>
                <th className="p-3 font-normal"></th>
              </tr>
            </thead>
            <tbody>
              {(invites ?? []).map((i) => {
                const [label, cls] = inviteState(i);
                const open = label === "Waiting";
                const link = `${siteUrl()}/join/${i.token}`;
                return (
                  <tr key={i.id} className="border-b border-stone-100 last:border-0">
                    <td className="p-3">
                      <div className="font-medium">{i.full_name || i.email}</div>
                      <div className="text-xs text-stone-500">{i.email}{i.note ? ` · ${i.note}` : ""}</div>
                    </td>
                    <td className="p-3">{i.is_founding ? "Founding" : TIERS[i.tier as Tier].name}</td>
                    <td className="p-3">{formatDate(i.created_at)}</td>
                    <td className="p-3"><span className={`badge ${cls}`}>{label}</span></td>
                    <td className="p-3">
                      {open && (
                        <div className="flex flex-wrap items-center gap-3">
                          <input readOnly value={link} aria-label={`Invite link for ${i.email}`} className="input w-56 py-1 text-xs" />
                          <CopyButton text={link} />
                          <form action={resendInvite}>
                            <input type="hidden" name="id" value={i.id} />
                            <button className="text-xs text-brand-700 hover:underline">Email again</button>
                          </form>
                          <form action={revokeInvite}>
                            <input type="hidden" name="id" value={i.id} />
                            <button className="text-xs text-red-700 hover:underline">Withdraw</button>
                          </form>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
              {!invites?.length && (
                <tr><td colSpan={5} className="p-6 text-center text-stone-500">No invites yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="card p-4">
      <div className="text-sm text-stone-500">{label}</div>
      <div className="mt-1 text-2xl font-semibold">{value}</div>
    </div>
  );
}

function isExpired(expiresAt: string) {
  return new Date(expiresAt).getTime() < Date.now();
}
