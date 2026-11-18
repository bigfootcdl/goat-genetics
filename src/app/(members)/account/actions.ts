"use server";
import { createClient } from "@/lib/supabase/server";
import { requireMember } from "@/lib/auth";
import { backWith, friendlyError } from "@/lib/actions";
import { str } from "@/lib/format";
import { US_STATES } from "@/lib/listing-types";

export async function updateProfile(form: FormData) {
  const m = await requireMember();
  const state = str(form, "state");
  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: str(form, "full_name"),
      farm_name: str(form, "farm_name"),
      city: str(form, "city"),
      state: US_STATES.includes(state) ? state : "",
      phone: str(form, "phone"),
      website: str(form, "website"),
      bio: str(form, "bio"),
    })
    .eq("id", m.id);
  if (error) backWith("/account", "error", friendlyError(error.message));
  backWith("/account", "ok", "Profile saved.");
}

export async function changePassword(form: FormData) {
  await requireMember();
  const password = String(form.get("password") ?? "");
  if (password.length < 8) backWith("/account/password", "error", "Use at least 8 characters.");
  if (password !== String(form.get("confirm") ?? "")) backWith("/account/password", "error", "The two passwords don't match.");
  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) backWith("/account/password", "error", friendlyError(error.message));
  backWith("/account", "ok", "Password changed.");
}
