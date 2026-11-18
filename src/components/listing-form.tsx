"use client";
import { useState } from "react";
import { LISTING_TYPES, LISTING_TYPE_KEYS, type ListingType } from "@/lib/listing-types";
import { SubmitButton } from "@/components/submit-button";

type AnimalOption = { id: string; name: string; sex: "buck" | "doe" };
type Initial = {
  id?: string;
  type?: ListingType;
  animal_id?: string;
  title?: string;
  description?: string;
  price?: number | null;
  price_unit?: string;
  quantity?: number | null;
  details?: Record<string, string>;
  wants_front_page?: boolean;
};

export function ListingForm({
  action,
  animals,
  initial = {},
  canFrontPage,
  submitLabel,
}: {
  action: (form: FormData) => void | Promise<void>;
  animals: AnimalOption[];
  initial?: Initial;
  canFrontPage: boolean;
  submitLabel: string;
}) {
  const [type, setType] = useState<ListingType>(initial.type ?? "semen");
  const info = LISTING_TYPES[type];
  const choices = animals.filter((a) => info.sex === "any" || a.sex === info.sex);
  const [animalId, setAnimalId] = useState(initial.animal_id ?? "");
  const selected = choices.find((a) => a.id === animalId) ? animalId : choices[0]?.id ?? "";

  return (
    <form action={action} className="card grid gap-4 p-6 sm:grid-cols-2">
      {initial.id && <input type="hidden" name="id" value={initial.id} />}
      <div>
        <label className="label" htmlFor="type">What are you listing?</label>
        <select id="type" name="type" value={type} onChange={(e) => setType(e.target.value as ListingType)} className="input">
          {LISTING_TYPE_KEYS.map((k) => (
            <option key={k} value={k}>{LISTING_TYPES[k].label}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="label" htmlFor="animal_id">{info.sex === "buck" ? "Which buck?" : "Which doe?"}</label>
        {choices.length ? (
          <select id="animal_id" name="animal_id" value={selected} onChange={(e) => setAnimalId(e.target.value)} className="input">
            {choices.map((a) => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
        ) : (
          <p className="text-sm text-red-700">Add a {info.sex} to your herd first.</p>
        )}
      </div>
      <div className="sm:col-span-2">
        <label className="label" htmlFor="title">Title</label>
        <input id="title" name="title" required maxLength={200} defaultValue={initial.title} className="input" placeholder={`e.g. ${info.label} from a proven ${info.sex}`} />
      </div>
      <div className="sm:col-span-2">
        <label className="label" htmlFor="description">Description</label>
        <textarea id="description" name="description" rows={4} defaultValue={initial.description} className="input" />
      </div>
      <div>
        <label className="label" htmlFor="price">Asking price ($)</label>
        <input id="price" name="price" type="number" min={0} step="0.01" defaultValue={initial.price ?? ""} className="input" placeholder="Leave empty for “ask the seller”" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label" htmlFor="price_unit">Price is</label>
          <input id="price_unit" name="price_unit" key={type} defaultValue={initial.type === type ? initial.price_unit : info.defaultUnit} className="input" />
        </div>
        <div>
          <label className="label" htmlFor="quantity">Number available</label>
          <input id="quantity" name="quantity" type="number" min={0} defaultValue={initial.quantity ?? (info.live ? 1 : "")} className="input" />
        </div>
      </div>
      {info.fields.map((f) => (
        <div key={`${type}-${f.key}`}>
          <label className="label" htmlFor={`d_${f.key}`}>{f.label}</label>
          {f.input === "select" ? (
            <select id={`d_${f.key}`} name={`d_${f.key}`} defaultValue={initial.details?.[f.key] ?? ""} className="input">
              {f.options!.map((o) => (
                <option key={o} value={o}>{o || "Choose…"}</option>
              ))}
            </select>
          ) : (
            <input id={`d_${f.key}`} name={`d_${f.key}`} type={f.input ?? "text"} defaultValue={initial.details?.[f.key] ?? ""} className="input" />
          )}
        </div>
      ))}
      {canFrontPage && (
        <label className="flex items-center gap-2 text-sm sm:col-span-2">
          <input type="checkbox" name="wants_front_page" defaultChecked={initial.wants_front_page} />
          Show this listing on the public front page (Top tier)
        </label>
      )}
      <div className="sm:col-span-2">
        <SubmitButton>{submitLabel}</SubmitButton>
      </div>
    </form>
  );
}
