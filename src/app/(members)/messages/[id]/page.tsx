import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireMember } from "@/lib/auth";
import { formatDateTime } from "@/lib/format";
import { Notice, one, type SP } from "@/components/notice";
import { SubmitButton } from "@/components/submit-button";
import { MarkRead } from "@/components/mark-read";
import { sendReply } from "../actions";

export const metadata = { title: "Conversation" };

export default async function ConversationPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: SP }) {
  const member = await requireMember();
  const { id } = await params;
  const sp = await searchParams;
  const supabase = await createClient();
  const { data: c } = await supabase
    .from("conversations")
    .select("id,buyer_id,seller_id,listing:listings(id,title,status),buyer:profiles!conversations_buyer_id_fkey(id,full_name,farm_name),seller:profiles!conversations_seller_id_fkey(id,full_name,farm_name)")
    .eq("id", id)
    .maybeSingle();
  if (!c) notFound();
  const { data: messages } = await supabase
    .from("messages")
    .select("id,body,sender_id,created_at,read_at")
    .eq("conversation_id", id)
    .order("created_at");

  type Who = { id: string; full_name: string; farm_name: string };
  const other = (c.buyer_id === member.id ? c.seller : c.buyer) as unknown as Who;
  const listing = c.listing as unknown as { id: string; title: string; status: string } | null;

  const unread = (messages ?? []).filter((m) => m.sender_id !== member.id && !m.read_at).length;

  return (
    <div className="max-w-3xl">
      <MarkRead conversationId={id} unread={unread} />
      <Notice error={one(sp.error)} />
      <Link href="/messages" className="text-sm text-brand-700 hover:underline">← All messages</Link>
      <h1 className="h1 mt-2">
        <Link href={`/members/${other.id}`} className="hover:underline">{other.farm_name || other.full_name}</Link>
      </h1>
      {listing && (
        <p className="muted">
          About <Link href={`/listings/${listing.id}`} className="text-brand-700 hover:underline">{listing.title}</Link>
          {listing.status !== "available" && ` (${listing.status})`}
        </p>
      )}
      <ol className="mt-6 space-y-3">
        {(messages ?? []).map((m) => {
          const mine = m.sender_id === member.id;
          return (
            <li key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[80%] rounded-lg px-4 py-2 text-sm ${mine ? "bg-brand-600 text-white" : "border border-stone-200 bg-white"}`}>
                <p className="whitespace-pre-line">{m.body}</p>
                <p className={`mt-1 text-[11px] ${mine ? "text-brand-100" : "text-stone-400"}`}>{formatDateTime(m.created_at)}</p>
              </div>
            </li>
          );
        })}
      </ol>
      <form action={sendReply} className="mt-6 space-y-2">
        <input type="hidden" name="conversation_id" value={id} />
        <label htmlFor="body" className="sr-only">Reply</label>
        <textarea id="body" name="body" required rows={3} className="input" placeholder="Write a reply…" />
        <SubmitButton pendingText="Sending…">Send</SubmitButton>
      </form>
      <p className="muted mt-4">
        Agree on price, payment, papers and shipping here, so there&apos;s a record. The site doesn&apos;t handle payments.
      </p>
    </div>
  );
}
