import { expect, test } from "@playwright/test";
import path from "node:path";
import { PASSWORD, anonClient, serviceClient, signIn, signOut } from "./helpers";

// Runs against the demo data from `npm run seed`.
const run = Date.now().toString(36);
const newEmail = `tester-${run}@example.com`;
const listingTitle = `Test buck semen ${run}`;

test.describe.configure({ mode: "serial" });

test("public front page shows featured genetics without prices", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Featured genetics" })).toBeVisible();
  await expect(page.getByText("OBR Iron Horse semen")).toBeVisible();
  await expect(page.getByText("$75")).toHaveCount(0);
  await expect(page.getByText("Prices and seller contacts are for members.")).toBeVisible();
});

test("visitors can request an invite", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Your name").fill(`Visitor ${run}`);
  await page.getByLabel("Email").fill(`visitor-${run}@example.com`);
  await page.getByLabel("State").selectOption("MO");
  await page.getByLabel(/What are you looking for/).fill("Fullblood doe kids");
  await page.getByRole("button", { name: "Send request" }).click();
  await expect(page.getByText("Thanks! Your request was sent.")).toBeVisible();
});

test("member pages need a sign-in", async ({ page }) => {
  await page.goto("/browse");
  await expect(page).toHaveURL(/\/login\?next=%2Fbrowse/);
});

test("the database blocks people without an invite", async () => {
  const anon = anonClient();
  const { data: listings } = await anon.from("listings").select("id");
  expect(listings ?? []).toHaveLength(0);
  const { data: profiles } = await anon.from("profiles").select("id");
  expect(profiles ?? []).toHaveLength(0);
  const { error } = await anon.auth.signUp({ email: `sneaky-${run}@example.com`, password: PASSWORD });
  expect(error).not.toBeNull();
  const { error: badToken } = await anon.auth.signUp({
    email: `sneaky2-${run}@example.com`,
    password: PASSWORD,
    options: { data: { invite_token: "not-a-real-token" } },
  });
  expect(badToken).not.toBeNull();
});

test("owner invites a founding member, who joins and lists semen", async ({ page }) => {
  await signIn(page, "owner@example.com");
  await page.getByRole("link", { name: "Admin" }).click();
  await expect(page.getByText(`Visitor ${run}`)).toBeVisible();

  await page.locator("#invite-form").getByLabel("Email", { exact: true }).fill(newEmail);
  await page.locator("#invite-form").getByLabel("Name", { exact: true }).fill("Terry Tester");
  await page.getByLabel(/Founding member/).check();
  await page.getByLabel("Email the invite link now").uncheck();
  await page.getByRole("button", { name: "Create invite" }).click();
  await expect(page.getByText(`Invite created for ${newEmail}`)).toBeVisible();
  const link = await page.getByLabel(`Invite link for ${newEmail}`).inputValue();
  await signOut(page);

  // The new member accepts the invite
  await page.goto(new URL(link).pathname);
  await expect(page.getByText("founding member")).toBeVisible();
  await page.getByLabel("Farm or herd name").fill("Tester Acres");
  await page.getByLabel("State").selectOption("TX");
  await page.getByLabel("Choose a password").fill(PASSWORD);
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Create my account" }).click();
  await expect(page.getByText("Welcome aboard!")).toBeVisible();
  await expect(page.getByText("Founding member, free for life")).toBeVisible();

  // The same invite can't be used twice
  const reuse = await page.request.get(new URL(link).pathname);
  expect(await reuse.text()).toContain("can&#x27;t be used");

  // Add a buck whose sire is already on the site
  await page.goto("/animals/new");
  await page.getByLabel("Registered name").fill(`TA Iron Son ${run}`);
  await page.getByLabel("Registration number", { exact: true }).fill(`FB9${run}`);
  await page.getByLabel("Sire on the site").selectOption({ label: "OBR Iron Horse (FB2020101) · Owner's Boer Ranch" });
  await page.getByLabel("Dam name").fill("TA Outside Doe");
  await page.getByLabel("Weaning weight", { exact: true }).fill("2.5");
  await page.getByRole("button", { name: "Add animal" }).click();
  await expect(page.getByText("Animal added.")).toBeVisible();

  // Pedigree pulls in the sire's parents automatically
  await expect(page.getByRole("link", { name: "OBR Iron Horse" })).toBeVisible();
  await expect(page.getByRole("link", { name: "CRB Big Iron" })).toBeVisible();
  await expect(page.getByText("TA Outside Doe")).toBeVisible();

  // Upload a photo straight to storage
  await page.getByTestId("media-input").setInputFiles(path.join(__dirname, "goat.jpg"));
  await expect(page.getByText("1/20 photos")).toBeVisible({ timeout: 20_000 });

  // Health test
  await page.getByLabel("Test", { exact: true }).selectOption("CAE");
  await page.getByRole("button", { name: "Add test" }).click();
  await expect(page.getByText("Health test added.")).toBeVisible();

  // List semen from this buck
  await page.getByRole("link", { name: "List genetics or this animal" }).click();
  await page.getByLabel("What are you listing?").selectOption("semen");
  await page.getByLabel("Title").fill(listingTitle);
  await page.getByLabel("Asking price ($)").fill("60");
  await page.getByLabel("Number available").fill("25");
  await page.getByLabel("Post-thaw motility (%)").fill("70");
  await page.getByLabel(/public front page/).check();
  await page.getByRole("button", { name: "Publish listing" }).click();
  await expect(page.getByText("Your listing is live.")).toBeVisible();
  await expect(page.getByRole("heading", { name: listingTitle })).toBeVisible();
  await expect(page.getByText("$60 per straw")).toBeVisible();
  await expect(page.getByText("70", { exact: true })).toBeVisible();
});

test("Top tier listing that asked for the front page shows there", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText(listingTitle)).toBeVisible();
});

test("a buyer finds the listing, saves it and messages the seller", async ({ page }) => {
  await signIn(page, "buyer@example.com");
  await page.getByLabel("Search").fill(`Iron Son ${run}`);
  await page.getByRole("button", { name: "Search" }).click();
  await expect(page.getByText("1 listing")).toBeVisible();
  await page.getByText(listingTitle).click();
  await expect(page.getByText("Tester Acres")).toBeVisible();
  await expect(page.getByText("Before genetics ship")).toBeVisible();

  await page.getByRole("button", { name: "Save listing" }).click();
  await expect(page.getByText("Saved.")).toBeVisible();
  await page.goto("/saved");
  await expect(page.getByText(listingTitle)).toBeVisible();

  await page.goBack();
  await page.getByLabel("Message the seller").fill("Do you ship to Kansas?");
  await page.getByRole("button", { name: "Send message" }).click();
  await expect(page).toHaveURL(/\/messages\//);
  await expect(page.getByText("Do you ship to Kansas?")).toBeVisible();

  // Buy-only members can't list
  await page.goto("/animals/new");
  await expect(page).toHaveURL(/\/membership\?need=seller/);
  await signOut(page);

  // The seller sees the unread message and replies
  await signIn(page, newEmail);
  await expect(page.getByRole("link", { name: "Messages (1)" })).toBeVisible();
  await page.getByRole("link", { name: "Messages (1)" }).click();
  await page.getByText("Do you ship to Kansas?").click();
  await page.getByLabel("Reply").fill("Yes, in a dry shipper.");
  await page.getByRole("button", { name: "Send" }).click();
  await expect(page.getByText("Yes, in a dry shipper.")).toBeVisible();
  await expect(page.getByRole("link", { name: "Messages", exact: true })).toBeVisible();
});

test("members can't change their own tier, even through the API", async () => {
  const db = serviceClient();
  const { data: buyer } = await db.from("profiles").select("id,tier").eq("email", "buyer@example.com").single();
  const client = anonClient();
  await client.auth.signInWithPassword({ email: "buyer@example.com", password: PASSWORD });
  const { error } = await client.from("profiles").update({ tier: "top" }).eq("id", buyer!.id);
  expect(error?.message).toContain("Only the site owner");
  const { error: listErr } = await client
    .from("animals")
    .insert({ owner_id: buyer!.id, name: "Sneaky", sex: "buck" });
  expect(listErr).not.toBeNull();
  const { data: invites } = await client.from("invites").select("token");
  expect(invites ?? []).toHaveLength(0);
});

test("owner pauses a listing and marks it featured; seller marks it sold", async ({ page }) => {
  await signIn(page, "owner@example.com");
  await page.goto("/admin/listings");
  const row = page.getByRole("row", { name: new RegExp(listingTitle) });
  await row.getByRole("button", { name: "Pause" }).click();
  await expect(page.getByText("Listing updated.")).toBeVisible();
  await signOut(page);

  await signIn(page, "buyer@example.com");
  await page.goto(`/browse?q=${encodeURIComponent(`Iron Son ${run}`)}`);
  await expect(page.getByText("0 listings")).toBeVisible();
  await signOut(page);

  await signIn(page, "owner@example.com");
  await page.goto("/admin/listings");
  await page.getByRole("row", { name: new RegExp(listingTitle) }).getByRole("button", { name: "Paused (unpause)" }).click();
  await expect(page.getByText("Listing updated.")).toBeVisible();
  await signOut(page);

  await signIn(page, newEmail);
  await page.goto("/herd");
  await page.getByRole("link", { name: listingTitle }).click();
  await page.getByRole("button", { name: "Mark as sold" }).click();
  await expect(page.getByText("Marked as sold.")).toBeVisible();
});

test("feedback button reaches the owner", async ({ page }) => {
  await signIn(page, "founder@example.com");
  await page.getByRole("button", { name: "Feedback" }).click();
  await page.getByPlaceholder("What happened, or what would help?").fill(`Search should filter by EPDs ${run}`);
  await page.getByRole("button", { name: "Send", exact: true }).click();
  await expect(page.getByText("Thank you!")).toBeVisible();
  await signOut(page);
  await signIn(page, "owner@example.com");
  await page.goto("/admin/reports");
  await expect(page.getByText(`Search should filter by EPDs ${run}`)).toBeVisible();
});
