-- One flat row per listing for browse, search and cards.
-- security_invoker keeps the listings/animals/profiles row level security in force.
create view public.listing_cards with (security_invoker = true) as
select
  l.id, l.seller_id, l.animal_id, l.type, l.title, l.description, l.price, l.price_unit,
  l.quantity, l.status, l.featured, l.wants_front_page, l.paused_by_admin, l.created_at, l.updated_at,
  a.name as animal_name, a.sex, a.breed, a.breed_grade, a.percentage_detail, a.registry,
  a.registration_number, a.birth_date, a.dna_on_file, a.epds,
  coalesce(sire.name, nullif(a.sire_name, ''), '') as sire_name,
  coalesce(dam.name, nullif(a.dam_name, ''), '') as dam_name,
  p.farm_name, p.full_name as seller_name, p.state, p.city,
  (select m.path from public.animal_media m where m.animal_id = a.id and m.kind = 'photo'
     order by m.sort_order, m.created_at limit 1) as photo_path,
  lower(concat_ws(' ', l.title, l.description, a.name, a.breed, a.percentage_detail, a.registration_number,
    sire.name, a.sire_name, dam.name, a.dam_name, p.farm_name, l.details::text)) as search_text
from public.listings l
join public.animals a on a.id = l.animal_id
join public.profiles p on p.id = l.seller_id
left join public.animals sire on sire.id = a.sire_id
left join public.animals dam on dam.id = a.dam_id;

grant select on public.listing_cards to authenticated;
