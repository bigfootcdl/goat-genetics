import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Notice, one, type SP } from "@/components/notice";
import { SubmitButton } from "@/components/submit-button";
import { US_STATES } from "@/lib/listing-types";
import { TIERS, type Tier } from "@/lib/tiers";
import { SITE_NAME } from "@/lib/site";
import { joinWithInvite } from "../../auth-actions";

export const metadata = { title: "Accept your invite" };

export default async function JoinPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: SP;
}) {
  const { token } = await params;
  const sp = await searchParams;
  const supabase = await createClient();
  const { data } = await supabase.rpc("check_invite", { p_token: token });
  const invite = (data as { email: string; full_name: string; tier: Tier; is_founding: boolean }[] | null)?.[0];

  if (!invite) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <h1 className="h1">This invite can&apos;t be used</h1>
        <p className="mt-2 text-stone-600">
          It may have expired, been used already, or been withdrawn. Ask the site owner for a new one.
        </p>
        <Link href="/login" className="btn-secondary mt-6">Sign in instead</Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-12">
      <h1 className="h1">Welcome to {SITE_NAME}</h1>
      <p className="mt-2 text-stone-600">
        You&apos;ve been invited as a <strong>{invite.is_founding ? "founding member" : TIERS[invite.tier].name}</strong>.
        {invite.is_founding && " Founding members get every Top tier feature free for life, in exchange for testing the site and telling us what to fix."}
      </p>
      <div className="mt-6">
        <Notice error={one(sp.error)} />
        <form action={joinWithInvite} className="card grid gap-4 p-6 sm:grid-cols-2">
          <input type="hidden" name="token" value={token} />
          <div className="sm:col-span-2">
            <label className="label" htmlFor="email">Email</label>
            <input id="email" name="email" type="email" readOnly value={invite.email} className="input bg-stone-50" />
          </div>
          <div>
            <label className="label" htmlFor="full_name">Your name</label>
            <input id="full_name" name="full_name" required defaultValue={invite.full_name} className="input" />
          </div>
          <div>
            <label className="label" htmlFor="farm_name">Farm or herd name</label>
            <input id="farm_name" name="farm_name" className="input" />
          </div>
          <div>
            <label className="label" htmlFor="state">State</label>
            <select id="state" name="state" required className="input" defaultValue="">
              <option value="" disabled>Choose…</option>
              {US_STATES.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="password">Choose a password</label>
            <input id="password" name="password" type="password" required minLength={8} autoComplete="new-password" className="input" />
          </div>
          <label className="flex items-start gap-2 text-sm text-stone-700 sm:col-span-2">
            <input type="checkbox" name="agree" required className="mt-1" />
            <span>
              I understand the site only connects members. Buyers and sellers handle price, payment, health papers
              and shipping between themselves, and the site is not a party to any sale.
            </span>
          </label>
          <div className="sm:col-span-2">
            <SubmitButton pendingText="Creating your account…">Create my account</SubmitButton>
          </div>
        </form>
      </div>
    </div>
  );
}
