import { Notice, one, type SP } from "@/components/notice";
import { SubmitButton } from "@/components/submit-button";
import { changePassword } from "../actions";

export const metadata = { title: "Change password" };

export default async function PasswordPage({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  return (
    <div className="max-w-sm">
      <h1 className="h1">Choose a new password</h1>
      <div className="mt-6">
        <Notice error={one(sp.error)} />
        <form action={changePassword} className="card space-y-4 p-6">
          <div>
            <label className="label" htmlFor="password">New password</label>
            <input id="password" name="password" type="password" minLength={8} required autoComplete="new-password" className="input" />
          </div>
          <div>
            <label className="label" htmlFor="confirm">Type it again</label>
            <input id="confirm" name="confirm" type="password" minLength={8} required autoComplete="new-password" className="input" />
          </div>
          <SubmitButton>Save password</SubmitButton>
        </form>
      </div>
    </div>
  );
}
