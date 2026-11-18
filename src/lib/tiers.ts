// Membership tiers. Prices are placeholders until the founding members are asked.
// Limits must match public.tier_limit() in the database migration.
export type Tier = "member" | "seller" | "top";

export const TIERS: Record<
  Tier,
  { name: string; price: string; listings: number; photos: number; videos: number; perks: string[] }
> = {
  member: {
    name: "Member",
    price: "Price to be set",
    listings: 0,
    photos: 0,
    videos: 0,
    perks: ["Browse every listing", "Message sellers", "Save listings"],
  },
  seller: {
    name: "Seller",
    price: "Price to be set",
    listings: 25,
    photos: 6,
    videos: 1,
    perks: [
      "Everything in Member",
      "List your herd's genetics and animals",
      "Herd page",
      "Up to 25 active listings",
      "6 photos and 1 video per animal",
    ],
  },
  top: {
    name: "Top tier",
    price: "Price to be set",
    listings: 100,
    photos: 20,
    videos: 5,
    perks: [
      "Everything in Seller",
      "Listings on the public front page",
      "Up to 100 active listings",
      "20 photos and 5 videos per animal",
    ],
  },
};

export function effectiveTier(p: { tier: Tier; is_founding: boolean; is_admin: boolean }): Tier {
  return p.is_founding || p.is_admin ? "top" : p.tier;
}

export function canSell(p: { tier: Tier; is_founding: boolean; is_admin: boolean }) {
  return effectiveTier(p) !== "member";
}
