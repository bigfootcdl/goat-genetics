"use server";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { backWith } from "@/lib/actions";
import { siteUrl, str } from "@/lib/format";
import { US_STATES } from "@/lib/listing-types";

export async function signIn(form: FormData) {
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: str(form, "email"),
    password: String(form.get("password") ?? ""),
  });
  const next = str(form, "next");
  if (error) {
    backWith(`/login${next ? `?next=${encodeURIComponent(next)}` : ""}`, "error", "That email and password don't match.");
  }
  redirect(next.startsWith("/") && !next.startsWith("//") ? next : "/browse");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}

export async function joinWithInvite(form: FormData) {
  const token = str(form, "token");
  const back = `/join/${token}`;
  const password = String(form.get("password") ?? "");
  const state = str(form, "state");
  if (password.length < 8) backWith(back, "error", "Please use a password of at least 8 characters.");
  if (!US_STATES.includes(state)) backWith(back, "error", "Please choose your state. Members must be in the US.");

  const supabase = await createClient();
  const { data } = await supabase.rpc("check_invite", { p_token: token });
  const invite = (data as { email: string }[] | null)?.[0];
  if (!invite) backWith(back, "error", "This invite can't be used any more.");

  const { error } = await supabase.auth.signUp({
    email: invite.email,
    password,
    options: {
      data: {
        invite_token: token,
        full_name: str(form, "full_name"),
        farm_name: str(form, "farm_name"),
        state,
      },
    },
  });
  if (error) {
    const msg = error.message.toLowerCase().includes("already registered")
      ? "An account with this email already exists. Try signing in."
      : "Your account could not be created. The invite may have expired.";
    backWith(back, "error", msg);
  }
  redirect("/account?welcome=1");
}

export async function sendPasswordReset(form: FormData) {
  const supabase = await createClient();
  await supabase.auth.resetPasswordForEmail(str(form, "email"), {
    redirectTo: `${siteUrl()}/auth/callback?next=/account/password`,
  });
  backWith("/forgot-password", "ok", "If that email belongs to a member, a reset link is on its way.");
}
