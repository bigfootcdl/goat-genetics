import Link from "next/link";
import { requireAdmin } from "@/lib/auth";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  const tabs = [
    { href: "/admin", label: "Invites" },
    { href: "/admin/members", label: "Members" },
    { href: "/admin/listings", label: "Listings and front page" },
    { href: "/admin/reports", label: "Reports and feedback" },
  ];
  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center gap-2 border-b border-stone-200 pb-3">
        <span className="mr-2 text-sm font-semibold uppercase tracking-wide text-stone-400">Owner admin</span>
        {tabs.map((t) => (
          <Link key={t.href} href={t.href} className="rounded-md px-3 py-1.5 text-sm text-stone-700 hover:bg-stone-100">
            {t.label}
          </Link>
        ))}
      </div>
      {children}
    </div>
  );
}
