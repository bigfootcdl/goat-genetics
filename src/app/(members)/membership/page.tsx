import { requireMember } from "@/lib/auth";
import { one, type SP } from "@/components/notice";
import { TIERS, effectiveTier, type Tier } from "@/lib/tiers";

export const metadata = { title: "Membership" };

export default async function MembershipPage({ searchParams }: { searchParams: SP }) {
  const m = await requireMember();
  const sp = await searchParams;
  const current = effectiveTier(m);
  return (
    <div>
      <h1 className="h1">Membership tiers</h1>
      <p className="muted mt-1">
        One yearly membership covers buying and selling. Prices are being set with the founding members. To change
        tier, contact the site owner.
      </p>
      {one(sp.need) === "seller" && (
        <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Listing animals and genetics needs the Seller or Top tier.
        </div>
      )}
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {(Object.keys(TIERS) as Tier[]).map((k) => {
          const t = TIERS[k];
          return (
            <div key={k} className={`card p-6 ${k === current ? "ring-2 ring-brand-500" : ""}`}>
              <div className="flex items-center justify-between">
                <h2 className="h2">{t.name}</h2>
                {k === current && <span className="badge bg-brand-100 text-brand-700">Your tier</span>}
              </div>
              <p className="mt-1 text-sm font-medium text-stone-500">{t.price} / year</p>
              <ul className="mt-4 space-y-1.5 text-sm text-stone-700">
                {t.perks.map((p) => (
                  <li key={p}>✓ {p}</li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
      <p className="muted mt-4">Founding members get every Top tier feature, free for life.</p>
    </div>
  );
}
