import type { Animal } from "@/lib/animal";
import { BREEDS, BREED_GRADES, EPD_FIELDS, REGISTRIES } from "@/lib/listing-types";
import { SubmitButton } from "@/components/submit-button";

type ParentOption = { id: string; name: string; registration_number: string; farm_name: string };

export function AnimalForm({
  action,
  animal,
  bucks,
  does,
  submitLabel,
}: {
  action: (form: FormData) => void | Promise<void>;
  animal?: Animal;
  bucks: ParentOption[];
  does: ParentOption[];
  submitLabel: string;
}) {
  const a = animal;
  return (
    <form action={action} className="space-y-6">
      {a && <input type="hidden" name="id" value={a.id} />}
      <fieldset className="card grid gap-4 p-6 sm:grid-cols-3">
        <legend className="px-1 text-sm font-semibold">The animal</legend>
        <div className="sm:col-span-2">
          <label className="label" htmlFor="name">Registered name</label>
          <input id="name" name="name" required defaultValue={a?.name} className="input" />
        </div>
        <div>
          <label className="label" htmlFor="sex">Sex</label>
          <select id="sex" name="sex" defaultValue={a?.sex ?? "buck"} className="input">
            <option value="buck">Buck</option>
            <option value="doe">Doe</option>
          </select>
        </div>
        <div>
          <label className="label" htmlFor="breed">Breed</label>
          <select id="breed" name="breed" defaultValue={a?.breed ?? "Boer"} className="input">
            {BREEDS.map((b) => <option key={b}>{b}</option>)}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="breed_grade">Fullblood / percentage</label>
          <select id="breed_grade" name="breed_grade" defaultValue={a?.breed_grade ?? "fullblood"} className="input">
            {BREED_GRADES.map((g) => <option key={g.value} value={g.value}>{g.label}</option>)}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="percentage_detail">Percentage or cross</label>
          <input id="percentage_detail" name="percentage_detail" defaultValue={a?.percentage_detail} placeholder="e.g. 75% Boer, or 50% Boer x Nubian" className="input" />
        </div>
        <div>
          <label className="label" htmlFor="registry">Registry</label>
          <select id="registry" name="registry" defaultValue={a?.registry ?? "ABGA"} className="input">
            {REGISTRIES.map((r) => <option key={r}>{r}</option>)}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="registration_number">Registration number</label>
          <input id="registration_number" name="registration_number" defaultValue={a?.registration_number} className="input" />
        </div>
        <div>
          <label className="label" htmlFor="birth_date">Birth date</label>
          <input id="birth_date" name="birth_date" type="date" defaultValue={a?.birth_date ?? ""} className="input" />
        </div>
        <div>
          <label className="label" htmlFor="tattoo">Tattoo</label>
          <input id="tattoo" name="tattoo" defaultValue={a?.tattoo} className="input" />
        </div>
        <div>
          <label className="label" htmlFor="scrapie_tag">Scrapie tag</label>
          <input id="scrapie_tag" name="scrapie_tag" defaultValue={a?.scrapie_tag} className="input" />
        </div>
        <div>
          <label className="label" htmlFor="color">Color</label>
          <input id="color" name="color" defaultValue={a?.color} placeholder="e.g. Traditional, Red, Paint" className="input" />
        </div>
        <label className="flex items-center gap-2 text-sm sm:col-span-3">
          <input type="checkbox" name="dna_on_file" defaultChecked={a?.dna_on_file} /> DNA on file with the registry
        </label>
        <div className="sm:col-span-3">
          <label className="label" htmlFor="description">About this animal</label>
          <textarea id="description" name="description" rows={3} defaultValue={a?.description} className="input" />
        </div>
      </fieldset>

      <fieldset className="card grid gap-4 p-6 sm:grid-cols-2">
        <legend className="px-1 text-sm font-semibold">Pedigree</legend>
        <p className="muted sm:col-span-2">
          Pick the sire and dam if they&apos;re already on the site, and their pedigrees link up automatically. Otherwise type their names.
        </p>
        <ParentPicker role="sire" options={bucks} selectedId={a?.sire_id} name={a?.sire_name} reg={a?.sire_registration} />
        <ParentPicker role="dam" options={does} selectedId={a?.dam_id} name={a?.dam_name} reg={a?.dam_registration} />
      </fieldset>

      <fieldset className="card grid gap-4 p-6 sm:grid-cols-5">
        <legend className="px-1 text-sm font-semibold">EPDs (if you have them)</legend>
        {EPD_FIELDS.map((f) => (
          <div key={f.key}>
            <label className="label" htmlFor={`epd_${f.key}`}>{f.label}</label>
            <input id={`epd_${f.key}`} name={`epd_${f.key}`} defaultValue={a?.epds?.[f.key] as string | undefined} className="input" />
          </div>
        ))}
      </fieldset>

      <SubmitButton>{submitLabel}</SubmitButton>
    </form>
  );
}

function ParentPicker({
  role,
  options,
  selectedId,
  name,
  reg,
}: {
  role: "sire" | "dam";
  options: ParentOption[];
  selectedId?: string | null;
  name?: string;
  reg?: string;
}) {
  const label = role === "sire" ? "Sire" : "Dam";
  return (
    <div className="space-y-2">
      <label className="label" htmlFor={`${role}_id`}>{label} on the site</label>
      <select id={`${role}_id`} name={`${role}_id`} defaultValue={selectedId ?? ""} className="input">
        <option value="">Not on the site</option>
        {options.map((o) => (
          <option key={o.id} value={o.id}>
            {o.name}
            {o.registration_number ? ` (${o.registration_number})` : ""}
            {o.farm_name ? ` · ${o.farm_name}` : ""}
          </option>
        ))}
      </select>
      <div className="grid grid-cols-2 gap-2">
        <input name={`${role}_name`} defaultValue={name} placeholder={`${label} name`} aria-label={`${label} name`} className="input" />
        <input name={`${role}_registration`} defaultValue={reg} placeholder="Registration #" aria-label={`${label} registration number`} className="input" />
      </div>
    </div>
  );
}
