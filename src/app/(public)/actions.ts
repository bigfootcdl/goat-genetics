"use server";
import { createClient } from "@/lib/supabase/server";
import { backWith } from "@/lib/actions";
import { str } from "@/lib/format";
import { US_STATES } from "@/lib/listing-types";

export async function requestInvite(form: FormData) {
  if (str(form, "company")) backWith("/#request-invite", "ok", "Thanks! Your request was sent.");
  const name = str(form, "name");
  const email = str(form, "email").toLowerCase();
  const state = str(form, "state");
  if (!name || !email.includes("@")) backWith("/#request-invite", "error", "Please give your name and email.");
  if (state && !US_STATES.includes(state)) backWith("/#request-invite", "error", "Members must be in the US.");
  const supabase = await createClient();
  const { error } = await supabase.from("invite_requests").insert({
    name,
    email,
    farm_name: str(form, "farm_name"),
    state,
    looking_for: str(form, "looking_for"),
  });
  if (error) backWith("/#request-invite", "error", "Your request could not be sent. Please try again.");
  backWith("/#request-invite", "ok", "Thanks! Your request was sent. The site owner will be in touch.");
}
