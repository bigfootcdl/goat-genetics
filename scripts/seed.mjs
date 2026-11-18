// Fills a local database with demo members, animals and listings for testing.
// Usage: npm run seed   (after `npx supabase start` and `npx supabase db reset`)
// Every demo account uses the password "testpass123".
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
if (!url?.includes("127.0.0.1") && !url?.includes("localhost") && process.env.SEED_ANYWAY !== "1") {
  console.error("Refusing to seed a non-local database. Set SEED_ANYWAY=1 if you really mean it.");
  process.exit(1);
}
const db = createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const PASSWORD = "testpass123";

async function must(p) {
  const { data, error } = await p;
  if (error) throw new Error(error.message);
  return data;
}

async function makeUser(email, fullName, extra) {
  const existing = await must(db.from("profiles").select("id").eq("email", email).maybeSingle());
  if (existing) return existing.id;
  const invite = await must(
    db
      .from("invites")
      .insert({ email, full_name: fullName, tier: extra.tier ?? "top", is_founding: !!extra.founding, grants_admin: !!extra.admin })
      .select("token")
      .single(),
  );
  const { user } = await must(
    db.auth.admin.createUser({
      email,
      password: PASSWORD,
      email_confirm: true,
      user_metadata: { invite_token: invite.token, full_name: fullName, farm_name: extra.farm, state: extra.state },
    }),
  );
  await must(db.from("profiles").update({ farm_name: extra.farm, state: extra.state, city: extra.city ?? "", bio: extra.bio ?? "", phone: extra.phone ?? "" }).eq("id", user.id));
  return user.id;
}

const owner = await makeUser("owner@example.com", "Site Owner", { admin: true, farm: "Owner's Boer Ranch", state: "TX", city: "Stephenville", bio: "Runs the site. Fullblood Boers since 2005." });
const founder = await makeUser("founder@example.com", "Dana Founder", { tier: "seller", founding: true, farm: "Red Creek Boers", state: "OK", city: "Ada", bio: "Fullblood and percentage Boers. Show and meat genetics.", phone: "(555) 010-2000" });
const seller = await makeUser("seller@example.com", "Sam Seller", { tier: "seller", farm: "Hillside Goat Co.", state: "TN", city: "Lewisburg", bio: "Boer x Nubian crosses and recipient does." });
await makeUser("buyer@example.com", "Bea Buyer", { tier: "member", farm: "Little Acre 4-H", state: "KS", city: "Salina" });

const existingAnimals = await must(db.from("animals").select("id").limit(1));
if (existingAnimals.length) {
  console.log("Demo animals already exist; skipping.");
  process.exit(0);
}

async function animal(owner_id, a) {
  return (await must(db.from("animals").insert({ owner_id, ...a }).select("id").single())).id;
}

// A small pedigree: grandsire/granddam -> sire/dam -> herd sire
const gs = await animal(owner, { name: "CRB Big Iron", sex: "buck", breed: "Boer", breed_grade: "fullblood", registry: "ABGA", registration_number: "FB1010001", sire_name: "TNT Dynamite", dam_name: "Lazy J Ruby", dna_on_file: true });
const gd = await animal(owner, { name: "CRB Miss Kitty", sex: "doe", breed: "Boer", breed_grade: "fullblood", registry: "ABGA", registration_number: "FB1010002", sire_name: "Cool Hand Luke", dam_name: "Dixie Belle" });
const sire = await animal(owner, {
  name: "OBR Iron Horse", sex: "buck", breed: "Boer", breed_grade: "fullblood", registry: "ABGA", registration_number: "FB2020101",
  birth_date: "2021-02-14", tattoo: "OBR 21-04", scrapie_tag: "TX1234 0101", color: "Traditional", dna_on_file: true,
  sire_id: gs, dam_id: gd, description: "Deep-bodied, heavy-muscled herd sire. Kids weigh up fast.",
  epds: { bw: "0.4", ww: "3.1", pwg: "2.2", nlw: "0.08" },
});
const dam = await animal(founder, {
  name: "RCB Sweet Tea", sex: "doe", breed: "Boer", breed_grade: "fullblood", registry: "ABGA", registration_number: "FB2020555",
  birth_date: "2020-03-02", color: "Red", sire_name: "RCB Thunder", dam_name: "RCB Honey", description: "Proven donor doe. Easy kidder, heavy milker.",
});
const youngDoe = await animal(founder, {
  name: "RCB Iron Tea", sex: "doe", breed: "Boer", breed_grade: "fullblood", registry: "ABGA", registration_number: "FB2240012",
  birth_date: "2024-01-20", color: "Traditional", sire_id: sire, dam_id: dam,
});
const crossDoe = await animal(seller, {
  name: "Hillside Nutmeg", sex: "doe", breed: "Boer cross", breed_grade: "cross", percentage_detail: "50% Boer x 50% Nubian",
  registry: "None", birth_date: "2022-04-11", color: "Red paint", description: "Calm, roomy doe. Raised twins twice.",
});
const pctBuck = await animal(seller, {
  name: "Hillside Copper", sex: "buck", breed: "Boer", breed_grade: "percentage", percentage_detail: "88% Boer",
  registry: "ABGA", registration_number: "P1234567", birth_date: "2023-03-05", sire_name: "Hillside Penny Ante", dam_name: "Hillside Lulu",
});

for (const [animal_id, test_name, result, test_date, lab] of [
  [sire, "CAE", "negative", "2026-06-01", "WADDL"],
  [sire, "CL", "negative", "2026-06-01", "WADDL"],
  [sire, "Johne's", "negative", "2026-06-01", "WADDL"],
  [dam, "CAE", "negative", "2026-05-15", "Texas A&M TVMDL"],
  [dam, "Brucellosis", "negative", "2026-05-15", "Texas A&M TVMDL"],
]) await must(db.from("health_tests").insert({ animal_id, test_name, result, test_date, lab }));

await must(db.from("show_records").insert([
  { animal_id: sire, show_name: "ABGA National Show", show_date: "2023-06-20", class_name: "Fullblood Senior Buck", place: "Grand Champion" },
  { animal_id: dam, show_name: "Oklahoma State Fair", show_date: "2022-09-15", class_name: "Fullblood Yearling Doe", place: "1st" },
]));

const listings = [
  { seller_id: owner, animal_id: sire, type: "semen", title: "OBR Iron Horse semen", description: "Collected at a certified center. Sire has DNA on file; transfer certificates provided.", price: 75, price_unit: "per straw", quantity: 40, details: { collection_date: "2025-11-02", collection_center: "Elite Genetics Center, TX", post_thaw_motility: "65" }, featured: true },
  { seller_id: founder, animal_id: dam, type: "embryos", title: "Iron Horse x Sweet Tea embryos", description: "Frozen embryos from a proven donor doe.", price: 450, price_unit: "per embryo", quantity: 8, details: { sire: "OBR Iron Horse", embryo_grade: "1", collection_date: "2026-03-10", collection_center: "Red Creek on-farm, vet flushed", freezing_method: "Direct transfer" }, featured: true },
  { seller_id: founder, animal_id: youngDoe, type: "pregnant_doe", title: "RCB Iron Tea, bred AI", description: "Bred AI to a national champion buck. Ultrasound confirmed twins.", price: 2200, price_unit: "each", quantity: 1, details: { sire: "CRB Big Iron", method: "AI", bred_date: "2026-08-01", due_date: "2026-12-29", confirmed_by: "Ultrasound" } },
  { seller_id: seller, animal_id: crossDoe, type: "recipient_doe", title: "Proven recipient doe, Boer x Nubian", description: "Great mother, good size for ET.", price: 450, price_unit: "each", quantity: 1, details: { kidding_history: "Twins 2024, twins 2025", health_status: "Herd tested negative CAE/CL 2026", ready: "Can be synced" } },
  { seller_id: seller, animal_id: pctBuck, type: "live_buck", title: "88% Boer buck, ready to work", description: "Correct, stout percentage buck.", price: 650, price_unit: "each", quantity: 1, details: { weight: "185", proven: "Yes" } },
  { seller_id: founder, animal_id: dam, type: "eggs", title: "Sweet Tea oocytes", description: "Limited eggs for IVF programs.", price: null, price_unit: "per egg", quantity: 6, details: { collection_date: "2026-04-02" } },
];
for (const l of listings) await must(db.from("listings").insert(l));

console.log(`Seeded. Sign in with any of these (password ${PASSWORD}):
  owner@example.com    site owner (admin)
  founder@example.com  founding member (Top tier features, free)
  seller@example.com   Seller tier
  buyer@example.com    Member tier (buy only)`);
