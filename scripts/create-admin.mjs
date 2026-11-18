// Creates the site owner's account (the only account that doesn't need an invite).
// Usage: node --env-file=.env.local scripts/create-admin.mjs owner@example.com "a-strong-password" "Owner Name"
import { createClient } from "@supabase/supabase-js";

const [email, password, fullName = ""] = process.argv.slice(2);
if (!email || !password) {
  console.error('Usage: node --env-file=.env.local scripts/create-admin.mjs <email> <password> ["Full name"]');
  process.exit(1);
}
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});
// Sign-ups need an invite, so make a one-off owner invite and use it straight away.
const { data: invite, error: inviteError } = await supabase
  .from("invites")
  .insert({ email, full_name: fullName, tier: "top", grants_admin: true, note: "Owner account" })
  .select("token")
  .single();
if (inviteError) {
  console.error("Could not create the owner invite:", inviteError.message);
  process.exit(1);
}
const { data, error } = await supabase.auth.admin.createUser({
  email,
  password,
  email_confirm: true,
  user_metadata: { full_name: fullName, invite_token: invite.token },
});
if (error) {
  console.error("Could not create the owner account:", error.message);
  process.exit(1);
}
console.log(`Owner account created for ${data.user.email}. Sign in at /login, then send invites from /admin.`);
