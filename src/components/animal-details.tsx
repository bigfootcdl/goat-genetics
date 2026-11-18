import Link from "next/link";
import type { AnimalBundle } from "@/lib/animal";
import { EPD_FIELDS, gradeLabel } from "@/lib/listing-types";
import { formatDate, mediaUrl } from "@/lib/format";
import { PedigreeChart } from "@/components/pedigree-chart";

export function MediaGallery({ media }: { media: AnimalBundle["media"] }) {
  const photos = media.filter((m) => m.kind === "photo");
  const videos = media.filter((m) => m.kind === "video");
  if (!media.length) {
    return <div className="flex aspect-[4/3] items-center justify-center rounded-lg bg-brand-100 text-brand-600">No photos yet</div>;
  }
  return (
    <div className="space-y-3">
      {photos[0] && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={mediaUrl(photos[0].path)!} alt={photos[0].caption || "Photo"} className="aspect-[4/3] w-full rounded-lg object-cover" />
      )}
      {photos.length > 1 && (
        <div className="grid grid-cols-4 gap-2">
          {photos.slice(1).map((p) => (
            <a key={p.id} href={mediaUrl(p.path)!} target="_blank" rel="noreferrer">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={mediaUrl(p.path)!} alt={p.caption || "Photo"} className="aspect-square w-full rounded object-cover" />
            </a>
          ))}
        </div>
      )}
      {videos.map((v) => (
        <video key={v.id} src={mediaUrl(v.path)!} controls preload="metadata" className="w-full rounded-lg bg-black" />
      ))}
    </div>
  );
}

export function AnimalFacts({ bundle }: { bundle: AnimalBundle }) {
  const a = bundle.animal;
  const facts: [string, string][] = [
    ["Sex", a.sex === "buck" ? "Buck" : "Doe"],
    ["Breed", `${a.breed} · ${gradeLabel(a.breed_grade)}${a.percentage_detail ? ` (${a.percentage_detail})` : ""}`],
    ["Registration", [a.registry, a.registration_number].filter(Boolean).join(" ") || "Not given"],
    ["Born", formatDate(a.birth_date) || "Not given"],
    ["Tattoo", a.tattoo],
    ["Scrapie tag", a.scrapie_tag],
    ["Color", a.color],
    ["DNA on file", a.dna_on_file ? "Yes" : "No"],
  ];
  return (
    <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
      {facts
        .filter(([, v]) => v)
        .map(([k, v]) => (
          <div key={k}>
            <dt className="text-stone-500">{k}</dt>
            <dd className="text-stone-900">{v}</dd>
          </div>
        ))}
    </dl>
  );
}

export function AnimalRecords({ bundle }: { bundle: AnimalBundle }) {
  const a = bundle.animal;
  const epds = EPD_FIELDS.filter((f) => a.epds?.[f.key] !== undefined && a.epds?.[f.key] !== "");
  return (
    <div className="space-y-6">
      <section>
        <h2 className="h2">Pedigree</h2>
        <div className="mt-3">
          <PedigreeChart root={bundle.pedigree} />
        </div>
      </section>

      {epds.length > 0 && (
        <section>
          <h2 className="h2">EPDs</h2>
          <div className="mt-2 flex flex-wrap gap-2">
            {epds.map((f) => (
              <div key={f.key} className="rounded border border-stone-200 bg-white px-3 py-2 text-sm">
                <div className="text-xs text-stone-500">{f.label}</div>
                <div className="font-medium">{String(a.epds[f.key])}</div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="h2">Health tests</h2>
        {bundle.health.length === 0 ? (
          <p className="muted mt-1">No health tests entered. Ask the seller.</p>
        ) : (
          <table className="mt-2 w-full text-sm">
            <thead className="text-left text-stone-500">
              <tr><th className="py-1 font-normal">Test</th><th className="font-normal">Result</th><th className="font-normal">Date</th><th className="font-normal">Lab</th></tr>
            </thead>
            <tbody>
              {bundle.health.map((h) => (
                <tr key={h.id} className="border-t border-stone-100">
                  <td className="py-1.5">{h.test_name}</td>
                  <td className={h.result === "negative" ? "text-green-700" : h.result === "positive" ? "text-red-700" : ""}>{h.result}</td>
                  <td>{formatDate(h.test_date)}</td>
                  <td>{h.lab}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {bundle.shows.length > 0 && (
        <section>
          <h2 className="h2">Show record</h2>
          <ul className="mt-2 space-y-1 text-sm">
            {bundle.shows.map((s) => (
              <li key={s.id}>
                <span className="font-medium">{s.place || "Shown"}</span> · {s.class_name} · {s.show_name}
                {s.show_date ? ` (${formatDate(s.show_date)})` : ""}
              </li>
            ))}
          </ul>
        </section>
      )}

      {bundle.offspring.length > 0 && (
        <section>
          <h2 className="h2">Offspring on the site</h2>
          <ul className="mt-2 flex flex-wrap gap-2 text-sm">
            {bundle.offspring.map((o) => (
              <li key={o.id}>
                <Link href={`/animals/${o.id}`} className="badge bg-brand-100 text-brand-700 hover:bg-brand-200">
                  {o.name} ({o.sex})
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
