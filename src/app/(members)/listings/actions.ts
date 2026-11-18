"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireMember, requireSeller } from "@/lib/auth";
import { backWith, friendlyError } from "@/lib/actions";
import { siteUrl, str } from "@/lib/format";
import { sendEmail } from "@/lib/email";
import { LISTING_TYPES, type ListingType } from "@/lib/listing-types";
import { SITE_NAME } from "@/lib/site";

export async function toggleSaved(form: FormData) {
  const member = await requireMember();
  const id = str(form, "listing_id");
  const supabase = await createClient();
  if (str(form, "saved")) {
    await supabase.from("saved_listings").delete().eq("member_id", member.id).eq("listing_id", id);
  } else {
    await supabase.from("saved_listings").insert({ member_id: member.id, listing_id: id });
  }
  revalidatePath(`/listings/${id}`);
  backWith(`/listings/${id}`, "ok", str(form, "saved") ? "Removed from saved." : "Saved.");
}

export async function contactSeller(form: FormData) {
  const member = await requireMember();
  const listingId = str(form, "listing_id");
  const body = str(form, "body");
  if (!body) backWith(`/listings/${listingId}`, "error", "Please write a message.");
  const supabase = await createClient();
  const { data: listing } = await supabase.from("listings").select("id,title,seller_id").eq("id", listingId).single();
  if (!listing) backWith("/browse", "error", "That listing is gone.");
  if (listing.seller_id === member.id) backWith(`/listings/${listingId}`, "error", "This is your own listing.");

  let { data: convo } = await supabase
    .from("conversations")
    .select("id")
    .eq("listing_id", listingId)
    .eq("buyer_id", member.id)
    .maybeSingle();
  if (!convo) {
    const res = await supabase
      .from("conversations")
      .insert({ listing_id: listingId, buyer_id: member.id, seller_id: listing.seller_id })
      .select("id")
      .single();
    if (res.error) backWith(`/listings/${listingId}`, "error", friendlyError(res.error.message));
    convo = res.data;
  }
  const { error } = await supabase.from("messages").insert({ conversation_id: convo.id, sender_id: member.id, body });
  if (error) backWith(`/listings/${listingId}`, "error", friendlyError(error.message));
  await notifyNewMessage(listing.seller_id, member.farm_name || member.full_name, listing.title, convo.id);
  redirect(`/messages/${convo.id}`);
}

export async function notifyNewMessage(recipientId: string, fromName: string, about: string, convoId: string) {
  const supabase = await createClient();
  const { data: recipient } = await supabase.from("profiles").select("email").eq("id", recipientId).single();
  if (!recipient) return;
  await sendEmail(
    recipient.email,
    `New message from ${fromName}`,
    `${fromName} sent you a message${about ? ` about "${about}"` : ""} on ${SITE_NAME}.\n\nRead and reply: ${siteUrl()}/messages/${convoId}`,
  );
}

export async function reportListing(form: FormData) {
  const member = await requireMember();
  const listingId = str(form, "listing_id");
  const supabase = await createClient();
  const { error } = await supabase
    .from("reports")
    .insert({ reporter_id: member.id, listing_id: listingId, reason: str(form, "reason") });
  if (error) backWith(`/listings/${listingId}`, "error", friendlyError(error.message));
  backWith(`/listings/${listingId}`, "ok", "Thanks. The site owner will look into it.");
}

export async function setListingStatus(form: FormData) {
  await requireSeller();
  const id = str(form, "id");
  const status = str(form, "status");
  if (!["available", "pending", "sold"].includes(status)) backWith(`/listings/${id}`, "error", "Unknown status");
  const supabase = await createClient();
  const { error } = await supabase.from("listings").update({ status }).eq("id", id);
  if (error) backWith(`/listings/${id}`, "error", friendlyError(error.message));
  backWith(`/listings/${id}`, "ok", `Marked as ${status}.`);
}

function listingFields(form: FormData) {
  const type = str(form, "type") as ListingType;
  if (!(type in LISTING_TYPES)) throw new Error("Unknown listing type");
  const details: Record<string, string> = {};
  for (const f of LISTING_TYPES[type].fields) {
    const v = str(form, `d_${f.key}`);
    if (v) details[f.key] = v;
  }
  const price = str(form, "price");
  const quantity = str(form, "quantity");
  return {
    type,
    animal_id: str(form, "animal_id"),
    title: str(form, "title"),
    description: str(form, "description"),
    price: price === "" ? null : Number(price),
    price_unit: str(form, "price_unit"),
    quantity: quantity === "" ? null : Math.max(0, Math.floor(Number(quantity))),
    details,
    wants_front_page: form.get("wants_front_page") === "on",
  };
}

export async function createListing(form: FormData) {
  const member = await requireSeller();
  const fields = listingFields(form);
  const back = `/listings/new?animal=${fields.animal_id}&type=${fields.type}`;
  if (!fields.title) backWith(back, "error", "Please give the listing a title.");
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("listings")
    .insert({ ...fields, seller_id: member.id })
    .select("id")
    .single();
  if (error) backWith(back, "error", friendlyError(error.message));
  redirect(`/listings/${data.id}?ok=${encodeURIComponent("Your listing is live.")}`);
}

export async function updateListing(form: FormData) {
  await requireSeller();
  const id = str(form, "id");
  const fields = listingFields(form);
  if (!fields.title) backWith(`/listings/${id}/edit`, "error", "Please give the listing a title.");
  const supabase = await createClient();
  const { error } = await supabase.from("listings").update(fields).eq("id", id);
  if (error) backWith(`/listings/${id}/edit`, "error", friendlyError(error.message));
  redirect(`/listings/${id}?ok=${encodeURIComponent("Listing updated.")}`);
}

export async function deleteListing(form: FormData) {
  await requireSeller();
  const id = str(form, "id");
  const supabase = await createClient();
  const { error } = await supabase.from("listings").delete().eq("id", id);
  if (error) backWith(`/listings/${id}/edit`, "error", friendlyError(error.message));
  backWith("/herd", "ok", "Listing deleted.");
}
