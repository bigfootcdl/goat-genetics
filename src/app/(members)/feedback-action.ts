"use server";
import { createClient } from "@/lib/supabase/server";
import { getMember } from "@/lib/auth";
import { str } from "@/lib/format";

export async function sendFeedback(form: FormData) {
  const member = await getMember();
  if (!member) return { ok: false, error: "Please sign in again." };
  const body = str(form, "body");
  if (!body) return { ok: false, error: "Please write something first." };
  const supabase = await createClient();
  const { error } = await supabase
    .from("feedback")
    .insert({ member_id: member.id, page: str(form, "page").slice(0, 300), body: body.slice(0, 5000) });
  return error ? { ok: false, error: "Could not send. Please try again." } : { ok: true };
}
