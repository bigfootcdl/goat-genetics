import Link from "next/link";
import { LISTING_TYPES, gradeLabel, type ListingType } from "@/lib/listing-types";
import { formatPrice, mediaUrl } from "@/lib/format";

export type CardListing = {
  id: string;
  type: ListingType;
  title: string;
  price: number | null;
  price_unit: string;
  status?: string;
  quantity?: number | null;
  animal_name: string;
  breed: string;
  breed_grade: string;
  percentage_detail: string;
  sire_name?: string;
  dam_name?: string;
  farm_name: string;
  state: string;
  photo_path: string | null;
  featured?: boolean;
};

export function ListingCard({
  listing,
  href,
  showPrice = true,
}: {
  listing: CardListing;
  href?: string;
  showPrice?: boolean;
}) {
  const t = LISTING_TYPES[listing.type];
  const photo = mediaUrl(listing.photo_path);
  const body = (
    <div className="card flex h-full flex-col overflow-hidden transition hover:shadow-md">
      <div className="relative aspect-[4/3] bg-brand-100">
        {photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photo} alt={listing.animal_name} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-brand-600">No photo yet</div>
        )}
        <span className="badge absolute left-2 top-2 bg-white/90 text-brand-700">{t.short}</span>
        {listing.status && listing.status !== "available" && (
          <span className="badge absolute right-2 top-2 bg-stone-800 text-white capitalize">{listing.status}</span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-3">
        <h3 className="font-medium leading-snug text-stone-900">{listing.title}</h3>
        <p className="text-sm text-stone-600">
          {listing.animal_name} · {listing.breed} {gradeLabel(listing.breed_grade).toLowerCase()}
          {listing.percentage_detail ? ` (${listing.percentage_detail})` : ""}
        </p>
        {(listing.sire_name || listing.dam_name) && (
          <p className="text-xs text-stone-500">
            {listing.sire_name ? `Sire: ${listing.sire_name}` : ""}
            {listing.sire_name && listing.dam_name ? " · " : ""}
            {listing.dam_name ? `Dam: ${listing.dam_name}` : ""}
          </p>
        )}
        <div className="mt-auto flex items-end justify-between pt-2">
          <span className="text-xs text-stone-500">
            {listing.farm_name || "Member"}
            {listing.state ? `, ${listing.state}` : ""}
          </span>
          {showPrice && (
            <span className="text-sm font-semibold text-brand-700">
              {formatPrice(listing.price, listing.price_unit)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
  return href ? (
    <Link href={href} className="block h-full">
      {body}
    </Link>
  ) : (
    body
  );
}
