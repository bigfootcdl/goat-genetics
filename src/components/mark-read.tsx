"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { markRead } from "@/app/(members)/messages/actions";

// Marks a conversation read once it's on screen, then refreshes the unread count in the header.
export function MarkRead({ conversationId, unread }: { conversationId: string; unread: number }) {
  const router = useRouter();
  useEffect(() => {
    if (!unread) return;
    markRead(conversationId).then(() => router.refresh());
  }, [conversationId, unread, router]);
  return null;
}
