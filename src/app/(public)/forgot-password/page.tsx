import { Notice, one, type SP } from "@/components/notice";
import { SubmitButton } from "@/components/submit-button";
import { sendPasswordReset } from "../auth-actions";

export const metadata = { title: "Reset password" };

export default async function ForgotPasswordPage({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  return (
    <div className="mx-auto max-w-sm px-4 py-16">
      <h1 className="h1">Reset your password</h1>
      <p className="muted mt-1">We&apos;ll email you a link to choose a new one.</p>
      <div className="mt-6">
        <Notice error={one(sp.error)} ok={one(sp.ok)} />
        <form action={sendPasswordReset} className="card space-y-4 p-6">
          <div>
            <label className="label" htmlFor="email">Email</label>
            <input id="email" name="email" type="email" required className="input" />
          </div>
          <SubmitButton className="btn-primary w-full" pendingText="Sending…">Send reset link</SubmitButton>
        </form>
      </div>
    </div>
  );
}
