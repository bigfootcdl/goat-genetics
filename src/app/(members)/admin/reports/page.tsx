import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";
import { Notice, one, type SP } from "@/components/notice";
import { formatDateTime } from "@/lib/format";
import { resolveItem } from "../actions";

export const metadata = { title: "Reports and feedback" };

export default async function AdminReportsPage({ searchParams }: { searchParams: SP }) {
  await requireAdmin();
  const sp = await searchParams;
  const supabase = await createClient();
  const [{ data: reports }, { data: feedback }] = await Promise.all([
    supabase
      .from("reports")
      .select("*, reporter:profiles!reports_reporter_id_fkey(full_name,farm_name), listing:listings(id,title)")
      .order("created_at", { ascending: false }),
    supabase
      .from("feedback")
      .select("*, member:profiles(full_name,farm_name)")
      .order("created_at", { ascending: false }),
  ]);
  type Who = { full_name: string; farm_name: string } | null;

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <div className="lg:col-span-2"><Notice error={one(sp.error)} ok={one(sp.ok)} /></div>
      <section>
        <h2 className="h2">Problem reports</h2>
        <ul className="mt-3 space-y-3">
          {(reports ?? []).map((r) => {
            const who = r.reporter as Who;
            const listing = r.listing as { id: string; title: string } | null;
            return (
              <li key={r.id} className={`card p-4 text-sm ${r.status === "resolved" ? "opacity-60" : ""}`}>
                <div className="text-xs text-stone-500">
                  {who?.farm_name || who?.full_name} · {formatDateTime(r.created_at)}
                </div>
                {listing && <Link href={`/listings/${listing.id}`} className="font-medium text-brand-700 hover:underline">{listing.title}</Link>}
                <p className="mt-1 whitespace-pre-line">{r.reason}</p>
                {r.status === "open" && <DoneButton table="reports" id={r.id} />}
              </li>
            );
          })}
          {!reports?.length && <li className="muted">No reports.</li>}
        </ul>
      </section>
      <section>
        <h2 className="h2">Tester feedback</h2>
        <ul className="mt-3 space-y-3">
          {(feedback ?? []).map((f) => {
            const who = f.member as Who;
            return (
              <li key={f.id} className={`card p-4 text-sm ${f.status === "done" ? "opacity-60" : ""}`}>
                <div className="text-xs text-stone-500">
                  {who?.farm_name || who?.full_name} · {formatDateTime(f.created_at)} · on {f.page || "?"}
                </div>
                <p className="mt-1 whitespace-pre-line">{f.body}</p>
                {f.status === "new" && <DoneButton table="feedback" id={f.id} />}
              </li>
            );
          })}
          {!feedback?.length && <li className="muted">No feedback yet.</li>}
        </ul>
      </section>
    </div>
  );
}

function DoneButton({ table, id }: { table: string; id: string }) {
  return (
    <form action={resolveItem} className="mt-2">
      <input type="hidden" name="table" value={table} />
      <input type="hidden" name="id" value={id} />
      <button className="text-xs text-brand-700 hover:underline">Mark done</button>
    </form>
  );
}
