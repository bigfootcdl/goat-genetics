import Link from "next/link";
import { Notice, one, type SP } from "@/components/notice";
import { SubmitButton } from "@/components/submit-button";
import { signIn } from "../auth-actions";

export const metadata = { title: "Sign in" };

export default async function LoginPage({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  return (
    <div className="mx-auto max-w-sm px-4 py-16">
      <h1 className="h1">Sign in</h1>
      <p className="muted mt-1">Members only. New here? You need an invite from the site owner.</p>
      <div className="mt-6">
        <Notice error={one(sp.error)} ok={one(sp.ok)} />
        <form action={signIn} className="card space-y-4 p-6">
          <input type="hidden" name="next" value={one(sp.next) ?? ""} />
          <div>
            <label className="label" htmlFor="email">Email</label>
            <input id="email" name="email" type="email" required autoComplete="email" className="input" />
          </div>
          <div>
            <label className="label" htmlFor="password">Password</label>
            <input id="password" name="password" type="password" required autoComplete="current-password" className="input" />
          </div>
          <SubmitButton className="btn-primary w-full" pendingText="Signing in…">Sign in</SubmitButton>
          <p className="text-center text-sm">
            <Link href="/forgot-password" className="text-brand-700 hover:underline">Forgot your password?</Link>
          </p>
        </form>
        <p className="muted mt-4 text-center">
          No invite yet? <Link href="/#request-invite" className="text-brand-700 hover:underline">Request one</Link>.
        </p>
      </div>
    </div>
  );
}
