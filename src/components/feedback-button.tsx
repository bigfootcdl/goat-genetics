"use client";
import { useState, useTransition } from "react";
import { usePathname } from "next/navigation";
import { sendFeedback } from "@/app/(members)/feedback-action";

export function FeedbackButton() {
  const [open, setOpen] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const [pending, start] = useTransition();
  const pathname = usePathname();

  return (
    <div className="fixed bottom-4 right-4 z-30">
      {open ? (
        <form
          className="card w-80 space-y-3 p-4 shadow-lg"
          action={(form) =>
            start(async () => {
              form.set("page", pathname);
              const res = await sendFeedback(form);
              if (res.ok) {
                setDone(true);
                setError("");
              } else setError(res.error ?? "Could not send");
            })
          }
        >
          <div className="flex items-center justify-between">
            <h2 className="font-medium">Send feedback</h2>
            <button type="button" onClick={() => { setOpen(false); setDone(false); }} className="text-stone-400 hover:text-stone-700" aria-label="Close">
              ✕
            </button>
          </div>
          {done ? (
            <p className="text-sm text-green-700">Thank you! The site owner will see this.</p>
          ) : (
            <>
              <p className="text-xs text-stone-500">Found a bug, or have an idea? Tell us. We&apos;ll note which page you were on.</p>
              <textarea name="body" required rows={4} className="input" placeholder="What happened, or what would help?" />
              {error && <p className="text-sm text-red-700">{error}</p>}
              <button className="btn-primary w-full" disabled={pending}>
                {pending ? "Sending…" : "Send"}
              </button>
            </>
          )}
        </form>
      ) : (
        <button onClick={() => setOpen(true)} className="btn-primary rounded-full shadow-lg">
          Feedback
        </button>
      )}
    </div>
  );
}
