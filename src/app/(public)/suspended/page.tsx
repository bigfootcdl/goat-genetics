export const metadata = { title: "Membership paused" };

export default function SuspendedPage() {
  return (
    <div className="mx-auto max-w-md px-4 py-16 text-center">
      <h1 className="h1">Your membership is paused</h1>
      <p className="mt-2 text-stone-600">Please contact the site owner if you think this is a mistake.</p>
    </div>
  );
}
