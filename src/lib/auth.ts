import { redirect } from "next/navigation";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { canSell, effectiveTier, type Tier } from "@/lib/tiers";

export type Member = {
  id: string;
  email: string;
  full_name: string;
  farm_name: string;
  city: string;
  state: string;
  phone: string;
  bio: string;
  website: string;
  tier: Tier;
  is_founding: boolean;
  is_admin: boolean;
  status: "active" | "suspended";
  paid_through: string | null;
  created_at: string;
};

// The signed-in member, or null. Cached per request.
export const getMember = cache(async (): Promise<Member | null> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  return (data as Member) ?? null;
});

export async function requireMember() {
  const member = await getMember();
  if (!member) redirect("/login");
  if (member.status !== "active") redirect("/suspended");
  return member;
}

export async function requireSeller() {
  const member = await requireMember();
  if (!canSell(member)) redirect("/membership?need=seller");
  return member;
}

export async function requireAdmin() {
  const member = await requireMember();
  if (!member.is_admin) redirect("/browse");
  return member;
}

export function memberTier(m: Member) {
  return effectiveTier(m);
}
