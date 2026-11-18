# Goat Genetics Exchange (test version)

A private, invite-only, US-only marketplace where goat breeders list and find genetics and breeding stock:
semen, embryos, eggs, live bucks and does, pregnant does and recipient does. Boer-focused, open to all goat
breeds and percentage crosses. The site only connects buyers and sellers; it handles no payments or shipping.

Built with Next.js 16 (App Router, TypeScript, Tailwind) and Supabase (Postgres, Auth, Storage).

## What's in this version

- **Public front page** with the owner's featured listings plus Top tier listings that ask for placement.
  Prices are hidden from visitors unless the owner turns them on. A "Request an invite" form goes to the owner.
- **Owner-only invites.** Sign-up is impossible without a valid invite token; the database enforces it.
  The owner picks the tier and can mark founding members (free for life, Top tier features).
- **Members and tiers:** Member (buy), Seller (list), Top tier (front page, more photos, videos and listings).
  Prices are placeholders; limits live in `src/lib/tiers.ts` and `public.tier_limit()` in the migration.
- **Animals and pedigrees:** each buck or doe is entered once with breed, percentage or cross, registry and
  number, tattoo, scrapie tag, DNA, EPDs, health tests, show records, photos and videos. Parents link to other
  animals on the site so pedigrees build themselves (three generations shown).
- **Listings** for all seven types, each with its own fields (motility, embryo grade, due date, recipient
  readiness and so on), statuses (available, pending, sold), and shipping and paperwork checklists.
- **Browse and search** by type, breed, fullblood/percentage, state, price and free text (names, bloodlines,
  registration numbers). Saved listings. Herd pages for every member.
- **Messages** between members with email alerts, unread counts, and "report a problem".
- **Owner admin:** invites and invite requests, members (tier, founding, paid-through date, pause), listings
  (feature on the front page, pause), problem reports, tester feedback, and the front-page price setting.
- **Feedback button** on every member page for founding testers.

Not yet: yearly billing (Stripe), saved-search alerts, reviews, and a video service (videos are stored in
Supabase Storage for now).

## Run it locally

Needs Node 20+ and Docker.

```bash
npm install
npm run db:start          # starts a local Supabase and applies the migrations
cp .env.example .env.local # then paste the keys `db:start` printed
npm run seed              # demo members, animals and listings (password: testpass123)
npm run dev               # http://localhost:3000
```

Demo accounts: `owner@example.com` (site owner), `founder@example.com` (founding member),
`seller@example.com` (Seller), `buyer@example.com` (Member). All use `testpass123`.

End-to-end tests (Playwright) walk through invites, sign-up, listing, search, messages and admin:

```bash
npm run test:e2e
```

## Put it online

1. Create a Supabase project. Run `npx supabase link` and `npx supabase db push` to apply the migrations.
   In Authentication settings, turn off "Confirm email" (the invite link already proves the email) and set
   the Site URL to your domain.
2. Deploy to Vercel with the variables from `.env.example`. `RESEND_API_KEY` is optional; without it,
   invite links are shown in the admin page for you to copy and send by text or email.
3. Create the owner's account once:
   `npm run create-admin -- owner@farm.com "a-strong-password" "Owner Name"` (uses `.env.local`, which must
   point at the live project with its service role key).

## Layout

- `supabase/migrations/` database tables, row level security, triggers (invite check, tier limits)
- `src/app/(public)/` front page, sign in, invite sign-up
- `src/app/(members)/` everything behind sign-in, including `admin/`
- `src/lib/` Supabase clients, tiers, listing types, pedigree builder
- `scripts/` seed data and owner account creation
- `e2e/` Playwright tests
