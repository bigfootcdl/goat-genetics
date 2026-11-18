import { redirect } from "next/navigation";

// Redirect back to a page with a message the page shows in a banner.
export function backWith(path: string, kind: "error" | "ok", message: string): never {
  const [base, hash] = path.split("#");
  const sep = base.includes("?") ? "&" : "?";
  redirect(`${base}${sep}${kind}=${encodeURIComponent(message)}${hash ? `#${hash}` : ""}`);
}

// Turns database errors into something a member can read.
export function friendlyError(message: string | undefined) {
  if (!message) return "Something went wrong. Please try again.";
  if (message.includes("row-level security")) return "You don't have permission to do that.";
  if (message.includes("duplicate key")) return "That already exists.";
  return message;
}
