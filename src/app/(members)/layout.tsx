import Link from "next/link";
import { requireMember } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { SITE_NAME } from "@/lib/site";
import { canSell } from "@/lib/tiers";
import { signOut } from "../(public)/auth-actions";
import { FeedbackButton } from "@/components/feedback-button";

export const dynamic = "force-dynamic";

export default async function MembersLayout({ children }: { children: React.ReactNode }) {
  const member = await requireMember();
  const supabase = await createClient();
  const { count: unread } = await supabase
    .from("messages")
    .select("id", { count: "exact", head: true })
    .is("read_at", null)
    .neq("sender_id", member.id);

  const links = [
    { href: "/browse", label: "Browse" },
    ...(canSell(member) ? [{ href: "/herd", label: "My herd" }] : []),
    { href: "/messages", label: unread ? `Messages (${unread})` : "Messages" },
    { href: "/saved", label: "Saved" },
    { href: "/guides", label: "Guides" },
    ...(member.is_admin ? [{ href: "/admin", label: "Admin" }] : []),
  ];

  return (
    <>
      <header className="sticky top-0 z-20 border-b border-stone-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-3">
          <Link href="/browse" className="text-lg font-semibold text-brand-700">
            {SITE_NAME}
          </Link>
          <nav className="flex flex-wrap items-center gap-1 text-sm">
            {links.map((l) => (
              <Link key={l.href} href={l.href} className="rounded-md px-2.5 py-1.5 text-stone-700 hover:bg-stone-100">
                {l.label}
              </Link>
            ))}
            <Link href="/account" className="rounded-md px-2.5 py-1.5 text-stone-700 hover:bg-stone-100">
              Account
            </Link>
            <form action={signOut}>
              <button className="rounded-md px-2.5 py-1.5 text-stone-500 hover:bg-stone-100">Sign out</button>
            </form>
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">{children}</main>
      <footer className="border-t border-stone-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-6 text-xs text-stone-500">
          The site connects members only. Buyers and sellers agree on price, payment, papers and shipping between
          themselves. See the <Link href="/guides" className="underline">guides</Link> for shipping and paperwork tips.
        </div>
      </footer>
      <FeedbackButton />
    </>
  );
}
