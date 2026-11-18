import { createClient } from "@/lib/supabase/server";
import { ListingCard, type CardListing } from "@/components/listing-card";
import { Notice, one, type SP } from "@/components/notice";
import { SubmitButton } from "@/components/submit-button";
import { SITE_NAME } from "@/lib/site";
import { US_STATES } from "@/lib/listing-types";
import { requestInvite } from "./actions";

export const dynamic = "force-dynamic";

export default async function FrontPage({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const supabase = await createClient();
  const { data } = await supabase.rpc("front_page_listings");
  const listings = (data ?? []) as CardListing[];
  const showPrices = listings.some((l) => l.price !== null);

  return (
    <div>
      <section className="bg-gradient-to-b from-brand-100 to-brand-50">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:py-20">
          <h1 className="max-w-3xl text-3xl font-semibold tracking-tight text-brand-900 sm:text-5xl">
            Boer goat genetics and breeding stock, from breeders you can trust.
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-stone-700">
            {SITE_NAME} is a private, invite-only catalog of semen, embryos, eggs, bucks, does, pregnant does and
            recipient does. Every listing ties to a real animal with its pedigree and papers. Boer-focused, open to
            all goat breeds and percentage crosses.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <a href="#request-invite" className="btn-primary">
              Request an invite
            </a>
            <a href="#featured" className="btn-secondary">
              See featured genetics
            </a>
          </div>
        </div>
      </section>

      <section id="featured" className="mx-auto max-w-6xl px-4 py-12">
        <h2 className="h1">Featured genetics</h2>
        <p className="muted mt-1">
          A sample of what members are offering.{" "}
          {showPrices ? "" : "Prices and seller contacts are for members."}
        </p>
        {listings.length === 0 ? (
          <p className="mt-6 rounded-lg border border-dashed border-stone-300 p-8 text-center text-stone-500">
            Featured listings will appear here soon.
          </p>
        ) : (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {listings.map((l) => (
              <ListingCard key={l.id} listing={l} showPrice={l.price !== null} />
            ))}
          </div>
        )}
      </section>

      <section className="border-y border-stone-200 bg-white">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:grid-cols-3">
          <div>
            <h3 className="h2">Invite only</h3>
            <p className="mt-2 text-sm text-stone-600">
              Every member is personally invited by the breeder who runs the site. No anonymous buyers or sellers.
            </p>
          </div>
          <div>
            <h3 className="h2">Real pedigrees</h3>
            <p className="mt-2 text-sm text-stone-600">
              Registration numbers, pedigrees, health tests, EPDs and show records live on each animal&apos;s
              profile.
            </p>
          </div>
          <div>
            <h3 className="h2">Deal directly</h3>
            <p className="mt-2 text-sm text-stone-600">
              Message the seller on the site, then agree on price, payment and shipping between yourselves.
            </p>
          </div>
        </div>
      </section>

      <section id="request-invite" className="mx-auto max-w-2xl px-4 py-12">
        <h2 className="h1">Request an invite</h2>
        <p className="muted mt-1">Tell us a little about your herd. The site owner reviews every request.</p>
        <div className="mt-6">
          <Notice error={one(sp.error)} ok={one(sp.ok)} />
          <form action={requestInvite} className="card grid gap-4 p-6 sm:grid-cols-2">
            <div className="sm:col-span-1">
              <label className="label" htmlFor="name">Your name</label>
              <input id="name" name="name" required maxLength={200} className="input" />
            </div>
            <div className="sm:col-span-1">
              <label className="label" htmlFor="email">Email</label>
              <input id="email" name="email" type="email" required className="input" />
            </div>
            <div>
              <label className="label" htmlFor="farm_name">Farm or herd name</label>
              <input id="farm_name" name="farm_name" maxLength={200} className="input" />
            </div>
            <div>
              <label className="label" htmlFor="state">State</label>
              <select id="state" name="state" className="input" defaultValue="">
                <option value="">Choose…</option>
                {US_STATES.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="label" htmlFor="looking_for">What are you looking for or hoping to sell?</label>
              <textarea id="looking_for" name="looking_for" rows={3} maxLength={2000} className="input" />
            </div>
            {/* Spam trap: people leave this empty */}
            <input name="company" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
            <div className="sm:col-span-2">
              <SubmitButton pendingText="Sending…">Send request</SubmitButton>
            </div>
          </form>
        </div>
      </section>
    </div>
  );
}
