import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireMember } from "@/lib/auth";
import { formatDateTime } from "@/lib/format";

export const metadata = { title: "Messages" };

export default async function MessagesPage() {
  const member = await requireMember();
  const supabase = await createClient();
  const { data: convos } = await supabase
    .from("conversations")
    .select(
      "id,last_message_at,buyer_id,seller_id,listing:listings(id,title),buyer:profiles!conversations_buyer_id_fkey(full_name,farm_name),seller:profiles!conversations_seller_id_fkey(full_name,farm_name),messages(body,sender_id,read_at,created_at)",
    )
    .order("last_message_at", { ascending: false })
    .order("created_at", { referencedTable: "messages", ascending: false })
    .limit(1, { referencedTable: "messages" });
  const { data: unreadRows } = await supabase
    .from("messages")
    .select("conversation_id")
    .is("read_at", null)
    .neq("sender_id", member.id);
  const unread = new Set((unreadRows ?? []).map((r) => r.conversation_id));

  type Who = { full_name: string; farm_name: string } | null;
  return (
    <div className="max-w-3xl">
      <h1 className="h1">Messages</h1>
      {!convos?.length ? (
        <p className="mt-6 rounded-lg border border-dashed border-stone-300 p-10 text-center text-stone-500">
          No conversations yet. Message a seller from any listing.
        </p>
      ) : (
        <ul className="card mt-6 divide-y divide-stone-100">
          {convos.map((c) => {
            const other = (c.buyer_id === member.id ? c.seller : c.buyer) as unknown as Who;
            const last = (c.messages as { body: string; sender_id: string }[])[0];
            const listing = c.listing as unknown as { title: string } | null;
            return (
              <li key={c.id}>
                <Link href={`/messages/${c.id}`} className="flex items-start justify-between gap-4 p-4 hover:bg-stone-50">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      {unread.has(c.id) && <span className="h-2 w-2 rounded-full bg-brand-600" aria-label="Unread" />}
                      <span className="font-medium">{other?.farm_name || other?.full_name || "Member"}</span>
                      <span className="text-xs text-stone-500">{c.buyer_id === member.id ? "Seller" : "Buyer"}</span>
                    </div>
                    {listing && <div className="text-sm text-stone-600">Re: {listing.title}</div>}
                    {last && (
                      <div className="truncate text-sm text-stone-500">
                        {last.sender_id === member.id ? "You: " : ""}
                        {last.body}
                      </div>
                    )}
                  </div>
                  <span className="shrink-0 text-xs text-stone-400">{formatDateTime(c.last_message_at)}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
