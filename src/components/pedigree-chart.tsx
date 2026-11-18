import Link from "next/link";
import type { PedigreeNode } from "@/lib/pedigree";

// A left-to-right pedigree: parents, grandparents, great-grandparents.
export function PedigreeChart({ root }: { root: PedigreeNode }) {
  const gens: (PedigreeNode | null)[][] = [];
  let level: (PedigreeNode | null)[] = [root.sire, root.dam];
  for (let i = 0; i < 3; i++) {
    // stop at the first generation where nothing is known
    if (!level.some(Boolean)) break;
    gens.push(level);
    level = level.flatMap((n) => [n?.sire ?? null, n?.dam ?? null]);
  }
  if (!root.sire && !root.dam) {
    return <p className="muted">No pedigree entered yet.</p>;
  }
  return (
    <div className="overflow-x-auto">
      <div className={`grid gap-2 ${gens.length === 3 ? "min-w-[640px] grid-cols-3" : gens.length === 2 ? "min-w-[420px] grid-cols-2" : "max-w-xs grid-cols-1"}`}>
        {gens.map((g, gi) => (
          <div key={gi} className="flex flex-col justify-around gap-1">
            {g.map((n, i) => (
              <Cell key={i} node={n} role={i % 2 === 0 ? "Sire" : "Dam"} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function Cell({ node, role }: { node: PedigreeNode | null; role: string }) {
  return (
    <div
      className={`rounded border px-2 py-1.5 text-xs ${
        role === "Sire" ? "border-sky-200 bg-sky-50" : "border-rose-200 bg-rose-50"
      }`}
    >
      <div className="text-[10px] uppercase tracking-wide text-stone-400">{role}</div>
      {node ? (
        <>
          <div className="font-medium text-stone-800">
            {node.id ? (
              <Link href={`/animals/${node.id}`} className="hover:underline">{node.name}</Link>
            ) : (
              node.name
            )}
          </div>
          {node.registration && <div className="text-stone-500">{node.registration}</div>}
        </>
      ) : (
        <div className="text-stone-400">Unknown</div>
      )}
    </div>
  );
}
