export function Notice({ error, ok }: { error?: string; ok?: string }) {
  if (!error && !ok) return null;
  return (
    <div
      role={error ? "alert" : "status"}
      className={`mb-4 rounded-md border px-4 py-3 text-sm ${
        error ? "border-red-200 bg-red-50 text-red-800" : "border-green-200 bg-green-50 text-green-800"
      }`}
    >
      {error || ok}
    </div>
  );
}

export type SP = Promise<Record<string, string | string[] | undefined>>;

export function one(v: string | string[] | undefined) {
  return Array.isArray(v) ? v[0] : v;
}
