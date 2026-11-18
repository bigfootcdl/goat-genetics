import Link from "next/link";
import { SITE_NAME } from "@/lib/site";
import { getMember } from "@/lib/auth";

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const member = await getMember();
  return (
    <>
      <header className="border-b border-stone-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <Link href="/" className="text-lg font-semibold text-brand-700">
            {SITE_NAME}
          </Link>
          <nav className="flex items-center gap-2 text-sm">
            {member ? (
              <Link href="/browse" className="btn-primary">
                Go to listings
              </Link>
            ) : (
              <>
                <Link href="/#request-invite" className="hidden px-2 text-stone-700 hover:text-stone-900 sm:inline">
                  Request an invite
                </Link>
                <Link href="/login" className="btn-secondary">
                  Sign in
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="border-t border-stone-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-6 text-xs text-stone-500">
          {SITE_NAME} connects breeders. Buyers and sellers agree on price, payment and shipping between
          themselves. US members only.
        </div>
      </footer>
    </>
  );
}
