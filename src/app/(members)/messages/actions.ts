"use server";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireMember } from "@/lib/auth";
import { backWith, friendlyError } from "@/lib/actions";
import { str } from "@/lib/format";
import { notifyNewMessage } from "../listings/actions";

export async function sendReply(form: FormData) {
  const member = await requireMember();
  const id = str(form, "conversation_id");
  const body = str(form, "body");
  if (!body) backWith(`/messages/${id}`, "error", "Please write a message.");
  const supabase = await createClient();
  const { data: c } = await supabase
    .from("conversations")
    .select("buyer_id,seller_id,listing:listings(title)")
    .eq("id", id)
    .single();
  if (!c) backWith("/messages", "error", "Conversation not found.");
  const { error } = await supabase.from("messages").insert({ conversation_id: id, sender_id: member.id, body });
  if (error) backWith(`/messages/${id}`, "error", friendlyError(error.message));
  const to = c.buyer_id === member.id ? c.seller_id : c.buyer_id;
  const listing = c.listing as unknown as { title: string } | null;
  await notifyNewMessage(to, member.farm_name || member.full_name, listing?.title ?? "", id);
  redirect(`/messages/${id}`);
}

export async function markRead(conversationId: string) {
  await requireMember();
  const supabase = await createClient();
  await supabase.rpc("mark_conversation_read", { p_conversation: conversationId });
}
