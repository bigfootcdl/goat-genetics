"use server";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";
import { backWith, friendlyError } from "@/lib/actions";
import { siteUrl, str } from "@/lib/format";
import { sendEmail } from "@/lib/email";
import { SITE_NAME } from "@/lib/site";
import { TIERS, type Tier } from "@/lib/tiers";

function tierOf(v: string): Tier {
  return v === "seller" || v === "top" ? v : "member";
}

function inviteText(name: string, link: string, founding: boolean, tier: Tier) {
  return `Hi ${name || "there"},

You're invited to join ${SITE_NAME}, a private marketplace for goat genetics and breeding stock${
    founding ? " as a founding member, free for life, to help us test it" : ` as a ${TIERS[tier].name}`
  }.

Accept your invite and set your password here:
${link}

This link is just for you and expires in 30 days.`;
}

export async function createInvite(form: FormData) {
  const admin = await requireAdmin();
  const email = str(form, "email").toLowerCase();
  if (!email.includes("@")) backWith("/admin", "error", "Please enter an email address.");
  const supabase = await createClient();
  const { data: existing } = await supabase.from("profiles").select("id").ilike("email", email).maybeSingle();
  if (existing) backWith("/admin", "error", "That email already belongs to a member.");
  const tier = tierOf(str(form, "tier"));
  const founding = form.get("is_founding") === "on";
  const { data, error } = await supabase
    .from("invites")
    .insert({ email, full_name: str(form, "full_name"), tier, is_founding: founding, note: str(form, "note"), created_by: admin.id })
    .select("token,full_name")
    .single();
  if (error) backWith("/admin", "error", friendlyError(error.message));
  const requestId = str(form, "request_id");
  if (requestId) await supabase.from("invite_requests").update({ status: "invited" }).eq("id", requestId);
  const link = `${siteUrl()}/join/${data.token}`;
  let sent = false;
  if (form.get("send_email") === "on") {
    sent = (await sendEmail(email, `Your invite to ${SITE_NAME}`, inviteText(data.full_name, link, founding, tier))).sent;
  }
  backWith("/admin", "ok", sent ? `Invite emailed to ${email}.` : `Invite created for ${email}. Copy the link below to send it by text or email.`);
}

export async function resendInvite(form: FormData) {
  await requireAdmin();
  const supabase = await createClient();
  const { data: inv } = await supabase.from("invites").select("*").eq("id", str(form, "id")).single();
  if (!inv) backWith("/admin", "error", "Invite not found.");
  const { sent } = await sendEmail(
    inv.email,
    `Your invite to ${SITE_NAME}`,
    inviteText(inv.full_name, `${siteUrl()}/join/${inv.token}`, inv.is_founding, inv.tier),
  );
  backWith("/admin", sent ? "ok" : "error", sent ? `Invite re-sent to ${inv.email}.` : "Email isn't set up yet (RESEND_API_KEY). Copy the link instead.");
}

export async function revokeInvite(form: FormData) {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase.from("invites").update({ revoked: true }).eq("id", str(form, "id"));
  if (error) backWith("/admin", "error", friendlyError(error.message));
  backWith("/admin", "ok", "Invite withdrawn.");
}

export async function setRequestStatus(form: FormData) {
  await requireAdmin();
  const supabase = await createClient();
  await supabase.from("invite_requests").update({ status: str(form, "status") }).eq("id", str(form, "id"));
  backWith("/admin", "ok", "Request updated.");
}

export async function updateMember(form: FormData) {
  const admin = await requireAdmin();
  const id = str(form, "id");
  const supabase = await createClient();
  const status = str(form, "status") === "suspended" ? "suspended" : "active";
  if (id === admin.id && status === "suspended") backWith("/admin/members", "error", "You can't pause your own account.");
  const { error } = await supabase
    .from("profiles")
    .update({
      tier: tierOf(str(form, "tier")),
      is_founding: form.get("is_founding") === "on",
      status,
      paid_through: str(form, "paid_through") || null,
    })
    .eq("id", id);
  if (error) backWith("/admin/members", "error", friendlyError(error.message));
  backWith("/admin/members", "ok", "Member updated.");
}

export async function updateListingAdmin(form: FormData) {
  await requireAdmin();
  const supabase = await createClient();
  const field = str(form, "field");
  if (!["featured", "paused_by_admin"].includes(field)) backWith("/admin/listings", "error", "Unknown change");
  const { error } = await supabase
    .from("listings")
    .update({ [field]: str(form, "value") === "true" })
    .eq("id", str(form, "id"));
  if (error) backWith("/admin/listings", "error", friendlyError(error.message));
  backWith("/admin/listings", "ok", "Listing updated.");
}

export async function updateSettings(form: FormData) {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase
    .from("site_settings")
    .update({ show_prices_public: form.get("show_prices_public") === "on", updated_at: new Date().toISOString() })
    .eq("id", 1);
  if (error) backWith("/admin/listings", "error", friendlyError(error.message));
  backWith("/admin/listings", "ok", "Front page settings saved.");
}

export async function resolveItem(form: FormData) {
  await requireAdmin();
  const supabase = await createClient();
  const table = str(form, "table");
  if (table === "reports") await supabase.from("reports").update({ status: "resolved" }).eq("id", str(form, "id"));
  else if (table === "feedback") await supabase.from("feedback").update({ status: "done" }).eq("id", str(form, "id"));
  backWith("/admin/reports", "ok", "Marked as done.");
}
