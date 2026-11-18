import Link from "next/link";
import { requireMember } from "@/lib/auth";
import { Notice, one, type SP } from "@/components/notice";
import { SubmitButton } from "@/components/submit-button";
import { US_STATES } from "@/lib/listing-types";
import { TIERS, canSell, effectiveTier } from "@/lib/tiers";
import { formatDate } from "@/lib/format";
import { updateProfile } from "./actions";

export const metadata = { title: "Account" };

export default async function AccountPage({ searchParams }: { searchParams: SP }) {
  const m = await requireMember();
  const sp = await searchParams;
  const tier = TIERS[effectiveTier(m)];
  return (
    <div className="max-w-3xl space-y-6">
      {one(sp.welcome) && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-green-900">
          <h2 className="font-medium">Welcome aboard!</h2>
          <p className="mt-1 text-sm">
            Fill in your profile so buyers know who you are.{" "}
            {canSell(m) ? (
              <>Then <Link href="/animals/new" className="underline">add your first animal</Link> and list its genetics.</>
            ) : (
              <>Then <Link href="/browse" className="underline">browse the listings</Link>.</>
            )}
          </p>
        </div>
      )}
      <Notice error={one(sp.error)} ok={one(sp.ok)} />
      <div className="card p-6">
        <h1 className="h1">Your membership</h1>
        <p className="mt-2 text-stone-700">
          <strong>{tier.name}</strong>
          {m.is_founding && " · Founding member, free for life"}
          {m.is_admin && " · Site owner"}
        </p>
        {!m.is_founding && (
          <p className="muted mt-1">
            {m.paid_through ? `Paid through ${formatDate(m.paid_through)}.` : "Billing isn't switched on yet during testing."}
          </p>
        )}
        <Link href="/membership" className="mt-3 inline-block text-sm text-brand-700 hover:underline">Compare tiers</Link>
      </div>

      <form action={updateProfile} className="card grid gap-4 p-6 sm:grid-cols-2">
        <h2 className="h2 sm:col-span-2">Profile and herd page</h2>
        <div>
          <label className="label" htmlFor="full_name">Your name</label>
          <input id="full_name" name="full_name" required defaultValue={m.full_name} className="input" />
        </div>
        <div>
          <label className="label" htmlFor="farm_name">Farm or herd name</label>
          <input id="farm_name" name="farm_name" defaultValue={m.farm_name} className="input" />
        </div>
        <div>
          <label className="label" htmlFor="city">Town</label>
          <input id="city" name="city" defaultValue={m.city} className="input" />
        </div>
        <div>
          <label className="label" htmlFor="state">State</label>
          <select id="state" name="state" defaultValue={m.state} className="input">
            <option value="">Choose…</option>
            {US_STATES.map((s) => <option key={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="phone">Phone (shown to members)</label>
          <input id="phone" name="phone" defaultValue={m.phone} className="input" />
        </div>
        <div>
          <label className="label" htmlFor="website">Website</label>
          <input id="website" name="website" defaultValue={m.website} className="input" />
        </div>
        <div className="sm:col-span-2">
          <label className="label" htmlFor="bio">About your herd</label>
          <textarea id="bio" name="bio" rows={4} defaultValue={m.bio} className="input" />
        </div>
        <div className="flex items-center gap-4 sm:col-span-2">
          <SubmitButton>Save profile</SubmitButton>
          <Link href="/account/password" className="text-sm text-brand-700 hover:underline">Change password</Link>
        </div>
      </form>
    </div>
  );
}
