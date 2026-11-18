-- Goat genetics marketplace: initial schema
-- Invite-only, US-only catalog that connects buyers and sellers.
-- No payments or shipping go through the site.

create extension if not exists pgcrypto with schema extensions;

-- ---------------------------------------------------------------------------
-- Types
-- ---------------------------------------------------------------------------
create type public.member_tier as enum ('member', 'seller', 'top');
create type public.member_status as enum ('active', 'suspended');
create type public.animal_sex as enum ('buck', 'doe');
create type public.listing_type as enum (
  'semen', 'embryos', 'eggs', 'live_buck', 'live_doe', 'pregnant_doe', 'recipient_doe'
);
create type public.listing_status as enum ('available', 'pending', 'sold');
create type public.media_kind as enum ('photo', 'video');

-- ---------------------------------------------------------------------------
-- Members
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  full_name text not null default '',
  farm_name text not null default '',
  city text not null default '',
  state text not null default '' check (state = '' or state ~ '^[A-Z]{2}$'),
  phone text not null default '',
  bio text not null default '',
  website text not null default '',
  tier public.member_tier not null default 'member',
  is_founding boolean not null default false,
  is_admin boolean not null default false,
  status public.member_status not null default 'active',
  paid_through date,
  created_at timestamptz not null default now()
);

create table public.invites (
  id uuid primary key default gen_random_uuid(),
  token text not null unique default encode(extensions.gen_random_bytes(18), 'hex'),
  email text not null,
  full_name text not null default '',
  tier public.member_tier not null default 'member',
  is_founding boolean not null default false,
  grants_admin boolean not null default false, -- only for the owner's own account (scripts/create-admin.mjs)
  note text not null default '',
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '30 days',
  used_by uuid references public.profiles (id) on delete set null,
  used_at timestamptz,
  revoked boolean not null default false
);

create table public.invite_requests (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(name) between 1 and 200),
  email text not null check (length(email) between 3 and 320),
  farm_name text not null default '' check (length(farm_name) <= 200),
  state text not null default '' check (length(state) <= 2),
  looking_for text not null default '' check (length(looking_for) <= 2000),
  status text not null default 'new' check (status in ('new', 'invited', 'declined')),
  created_at timestamptz not null default now()
);

create table public.site_settings (
  id int primary key default 1 check (id = 1),
  show_prices_public boolean not null default false,
  updated_at timestamptz not null default now()
);
insert into public.site_settings (id) values (1);

-- ---------------------------------------------------------------------------
-- Animals and pedigrees
-- ---------------------------------------------------------------------------
create table public.animals (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  name text not null check (length(name) between 1 and 200),
  sex public.animal_sex not null,
  breed text not null default 'Boer',
  -- fullblood, purebred, percentage, cross, other
  breed_grade text not null default 'fullblood',
  percentage_detail text not null default '', -- e.g. "50% Boer x 50% Nubian"
  registry text not null default '',          -- ABGA, USBGA, IBGA, ADGA, ...
  registration_number text not null default '',
  birth_date date,
  tattoo text not null default '',
  scrapie_tag text not null default '',
  color text not null default '',
  dna_on_file boolean not null default false,
  -- parents: linked records when they exist on the site, names otherwise
  sire_id uuid references public.animals (id) on delete set null,
  dam_id uuid references public.animals (id) on delete set null,
  sire_name text not null default '',
  sire_registration text not null default '',
  dam_name text not null default '',
  dam_registration text not null default '',
  description text not null default '',
  epds jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (sire_id is null or sire_id <> id),
  check (dam_id is null or dam_id <> id)
);
create index animals_owner_idx on public.animals (owner_id);

create table public.health_tests (
  id uuid primary key default gen_random_uuid(),
  animal_id uuid not null references public.animals (id) on delete cascade,
  test_name text not null,      -- CAE, CL, Johne's, Brucellosis, ...
  result text not null default 'negative',
  test_date date,
  lab text not null default '',
  notes text not null default '',
  created_at timestamptz not null default now()
);
create index health_tests_animal_idx on public.health_tests (animal_id);

create table public.show_records (
  id uuid primary key default gen_random_uuid(),
  animal_id uuid not null references public.animals (id) on delete cascade,
  show_name text not null,
  show_date date,
  class_name text not null default '',
  place text not null default '',
  created_at timestamptz not null default now()
);
create index show_records_animal_idx on public.show_records (animal_id);

create table public.animal_media (
  id uuid primary key default gen_random_uuid(),
  animal_id uuid not null references public.animals (id) on delete cascade,
  owner_id uuid not null references public.profiles (id) on delete cascade,
  kind public.media_kind not null,
  path text not null,
  caption text not null default '',
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
create index animal_media_animal_idx on public.animal_media (animal_id);

-- ---------------------------------------------------------------------------
-- Listings
-- ---------------------------------------------------------------------------
create table public.listings (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references public.profiles (id) on delete cascade,
  animal_id uuid not null references public.animals (id) on delete cascade,
  type public.listing_type not null,
  title text not null check (length(title) between 1 and 200),
  description text not null default '',
  price numeric(10, 2) check (price is null or price >= 0),
  price_unit text not null default '',   -- per straw, per embryo, each, ...
  quantity int check (quantity is null or quantity >= 0),
  status public.listing_status not null default 'available',
  -- type-specific fields (collection center, motility, grade, due date, ...)
  details jsonb not null default '{}'::jsonb,
  wants_front_page boolean not null default false, -- seller's request (Top tier)
  featured boolean not null default false,         -- owner's front page pick
  paused_by_admin boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index listings_seller_idx on public.listings (seller_id);
create index listings_animal_idx on public.listings (animal_id);
create index listings_type_status_idx on public.listings (type, status);

create table public.saved_listings (
  member_id uuid not null references public.profiles (id) on delete cascade,
  listing_id uuid not null references public.listings (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (member_id, listing_id)
);

-- ---------------------------------------------------------------------------
-- Messages
-- ---------------------------------------------------------------------------
create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid references public.listings (id) on delete set null,
  buyer_id uuid not null references public.profiles (id) on delete cascade,
  seller_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  last_message_at timestamptz not null default now(),
  check (buyer_id <> seller_id)
);
create unique index conversations_unique_idx
  on public.conversations (buyer_id, seller_id, coalesce(listing_id, '00000000-0000-0000-0000-000000000000'::uuid));

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  sender_id uuid not null references public.profiles (id) on delete cascade,
  body text not null check (length(body) between 1 and 5000),
  created_at timestamptz not null default now(),
  read_at timestamptz
);
create index messages_conversation_idx on public.messages (conversation_id, created_at);

-- ---------------------------------------------------------------------------
-- Reports and tester feedback
-- ---------------------------------------------------------------------------
create table public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles (id) on delete cascade,
  listing_id uuid references public.listings (id) on delete set null,
  member_id uuid references public.profiles (id) on delete set null,
  reason text not null check (length(reason) between 1 and 5000),
  status text not null default 'open' check (status in ('open', 'resolved')),
  created_at timestamptz not null default now()
);

create table public.feedback (
  id uuid primary key default gen_random_uuid(),
  member_id uuid references public.profiles (id) on delete set null,
  page text not null default '',
  body text not null check (length(body) between 1 and 5000),
  status text not null default 'new' check (status in ('new', 'done')),
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Helper functions
-- ---------------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles where id = auth.uid() and is_admin and status = 'active');
$$;

create or replace function public.is_active_member()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles where id = auth.uid() and status = 'active');
$$;

-- Founding members get Top tier features for free.
create or replace function public.effective_tier(p_member uuid)
returns public.member_tier language sql stable security definer set search_path = public as $$
  select case when is_founding or is_admin then 'top'::member_tier else tier end
  from profiles where id = p_member;
$$;

create or replace function public.can_sell()
returns boolean language sql stable security definer set search_path = public as $$
  select public.is_active_member() and public.effective_tier(auth.uid()) in ('seller', 'top');
$$;

-- Tier limits. Placeholder numbers until the founding members weigh in;
-- keep in step with src/lib/tiers.ts.
create or replace function public.tier_limit(p_tier public.member_tier, p_what text)
returns int language sql immutable as $$
  select case p_what
    when 'listings' then case p_tier when 'member' then 0 when 'seller' then 25 else 100 end
    when 'photos'   then case p_tier when 'member' then 0 when 'seller' then 6  else 20 end
    when 'videos'   then case p_tier when 'member' then 0 when 'seller' then 1  else 5 end
  end;
$$;

-- ---------------------------------------------------------------------------
-- Triggers
-- ---------------------------------------------------------------------------
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;
create trigger animals_touch before update on public.animals
  for each row execute function public.touch_updated_at();
create trigger listings_touch before update on public.listings
  for each row execute function public.touch_updated_at();

-- New sign-ups must carry a valid invite token. The invite sets the tier.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_invite invites%rowtype;
  v_token text := new.raw_user_meta_data ->> 'invite_token';
begin
  select * into v_invite from invites
  where token = v_token and not revoked and used_at is null and expires_at > now()
  for update;

  if not found then
    raise exception 'A valid invite is required to join';
  end if;
  if lower(v_invite.email) <> lower(new.email) then
    raise exception 'This invite was sent to a different email address';
  end if;

  insert into profiles (id, email, full_name, farm_name, state, tier, is_founding, is_admin)
  values (
    new.id,
    new.email,
    coalesce(nullif(new.raw_user_meta_data ->> 'full_name', ''), v_invite.full_name),
    coalesce(new.raw_user_meta_data ->> 'farm_name', ''),
    upper(coalesce(new.raw_user_meta_data ->> 'state', '')),
    case when v_invite.grants_admin then 'top'::member_tier else v_invite.tier end,
    v_invite.is_founding or v_invite.grants_admin,
    v_invite.grants_admin
  );
  update invites set used_by = new.id, used_at = now() where id = v_invite.id;
  update invite_requests set status = 'invited'
    where lower(email) = lower(new.email) and status = 'new';
  return new;
end;
$$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- Members may edit their own profile but not their tier, role or status.
create or replace function public.guard_profile_update()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if public.is_admin() or auth.uid() is null then
    return new;
  end if;
  if new.tier is distinct from old.tier
     or new.is_admin is distinct from old.is_admin
     or new.is_founding is distinct from old.is_founding
     or new.status is distinct from old.status
     or new.paid_through is distinct from old.paid_through
     or new.email is distinct from old.email then
    raise exception 'Only the site owner can change membership details';
  end if;
  return new;
end;
$$;
create trigger profiles_guard before update on public.profiles
  for each row execute function public.guard_profile_update();

-- Listing limits per tier, and the listing must be for the seller's own animal.
create or replace function public.guard_listing()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_count int;
  v_limit int;
begin
  if not exists (select 1 from animals where id = new.animal_id and owner_id = new.seller_id) then
    raise exception 'You can only list your own animals';
  end if;
  if tg_op = 'INSERT' then
    select count(*) into v_count from listings where seller_id = new.seller_id and status <> 'sold';
    v_limit := public.tier_limit(public.effective_tier(new.seller_id), 'listings');
    if v_count >= v_limit then
      raise exception 'Your membership tier allows % active listings', v_limit;
    end if;
  end if;
  -- only Top tier listings can ask for the public front page
  if new.wants_front_page and public.effective_tier(new.seller_id) <> 'top' then
    new.wants_front_page := false;
  end if;
  -- only the site owner sets featured / paused
  if not public.is_admin() and auth.uid() is not null then
    if tg_op = 'INSERT' then
      new.featured := false;
      new.paused_by_admin := false;
    else
      new.featured := old.featured;
      new.paused_by_admin := old.paused_by_admin;
    end if;
  end if;
  return new;
end;
$$;
create trigger listings_guard before insert or update on public.listings
  for each row execute function public.guard_listing();

-- Photo and video limits per animal, by tier.
create or replace function public.guard_media()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_count int;
  v_limit int;
begin
  if not exists (select 1 from animals where id = new.animal_id and owner_id = new.owner_id) then
    raise exception 'You can only add media to your own animals';
  end if;
  select count(*) into v_count from animal_media where animal_id = new.animal_id and kind = new.kind;
  v_limit := public.tier_limit(public.effective_tier(new.owner_id),
                               case new.kind when 'photo' then 'photos' else 'videos' end);
  if v_count >= v_limit then
    raise exception 'Your membership tier allows % %s per animal', v_limit, new.kind;
  end if;
  return new;
end;
$$;
create trigger animal_media_guard before insert on public.animal_media
  for each row execute function public.guard_media();

-- Parents linked on an animal must be the right sex.
create or replace function public.guard_animal_parents()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.sire_id is not null and not exists (select 1 from animals where id = new.sire_id and sex = 'buck') then
    raise exception 'The sire must be a buck';
  end if;
  if new.dam_id is not null and not exists (select 1 from animals where id = new.dam_id and sex = 'doe') then
    raise exception 'The dam must be a doe';
  end if;
  return new;
end;
$$;
create trigger animals_parents_guard before insert or update on public.animals
  for each row execute function public.guard_animal_parents();

create or replace function public.bump_conversation()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  update conversations set last_message_at = new.created_at where id = new.conversation_id;
  return new;
end;
$$;
create trigger messages_bump after insert on public.messages
  for each row execute function public.bump_conversation();

-- ---------------------------------------------------------------------------
-- Public (no sign-in) functions
-- ---------------------------------------------------------------------------
-- Check an invite before sign-up, without exposing the invites table.
create or replace function public.check_invite(p_token text)
returns table (email text, full_name text, tier public.member_tier, is_founding boolean)
language sql stable security definer set search_path = public as $$
  select email, full_name, tier, is_founding from invites
  where token = p_token and not revoked and used_at is null and expires_at > now();
$$;

-- Listings shown on the free front page: the owner's picks, plus Top tier
-- listings whose seller asked for front page placement. No contact details,
-- and prices only when the owner turns them on.
create or replace function public.front_page_listings()
returns table (
  id uuid, type public.listing_type, title text, description text,
  price numeric, price_unit text,
  animal_name text, breed text, breed_grade text, percentage_detail text,
  sire_name text, dam_name text,
  farm_name text, state text, photo_path text, featured boolean
)
language sql stable security definer set search_path = public as $$
  select l.id, l.type, l.title, left(l.description, 300),
    case when s.show_prices_public then l.price end,
    case when s.show_prices_public then l.price_unit else '' end,
    a.name, a.breed, a.breed_grade, a.percentage_detail,
    coalesce(sire.name, nullif(a.sire_name, ''), ''),
    coalesce(dam.name, nullif(a.dam_name, ''), ''),
    p.farm_name, p.state,
    (select m.path from animal_media m where m.animal_id = a.id and m.kind = 'photo'
       order by m.sort_order, m.created_at limit 1),
    l.featured
  from listings l
  join animals a on a.id = l.animal_id
  join profiles p on p.id = l.seller_id
  left join animals sire on sire.id = a.sire_id
  left join animals dam on dam.id = a.dam_id
  cross join site_settings s
  where l.status = 'available' and not l.paused_by_admin and p.status = 'active'
    and (l.featured or (l.wants_front_page and public.effective_tier(p.id) = 'top'))
  order by l.featured desc, l.created_at desc
  limit 24;
$$;

grant execute on function public.check_invite(text) to anon, authenticated;
grant execute on function public.front_page_listings() to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Row level security
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.invites enable row level security;
alter table public.invite_requests enable row level security;
alter table public.site_settings enable row level security;
alter table public.animals enable row level security;
alter table public.health_tests enable row level security;
alter table public.show_records enable row level security;
alter table public.animal_media enable row level security;
alter table public.listings enable row level security;
alter table public.saved_listings enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.reports enable row level security;
alter table public.feedback enable row level security;

-- profiles
create policy "members see members" on public.profiles for select
  using (public.is_active_member() or id = auth.uid());
create policy "members edit own profile" on public.profiles for update
  using (id = auth.uid() or public.is_admin()) with check (id = auth.uid() or public.is_admin());

-- invites: owner only
create policy "admin manages invites" on public.invites for all
  using (public.is_admin()) with check (public.is_admin());

-- invite requests: anyone can ask, only the owner reads
create policy "anyone can request an invite" on public.invite_requests for insert
  to anon, authenticated with check (status = 'new');
create policy "admin reads invite requests" on public.invite_requests for select using (public.is_admin());
create policy "admin updates invite requests" on public.invite_requests for update using (public.is_admin());
create policy "admin deletes invite requests" on public.invite_requests for delete using (public.is_admin());

-- settings
create policy "members read settings" on public.site_settings for select using (public.is_active_member());
create policy "admin edits settings" on public.site_settings for update using (public.is_admin());

-- animals and their records
create policy "members see animals" on public.animals for select using (public.is_active_member());
create policy "sellers add animals" on public.animals for insert
  with check (owner_id = auth.uid() and public.can_sell());
create policy "owners edit animals" on public.animals for update
  using (owner_id = auth.uid() or public.is_admin())
  with check (owner_id = auth.uid() or public.is_admin());
create policy "owners delete animals" on public.animals for delete
  using (owner_id = auth.uid() or public.is_admin());

create policy "members see health tests" on public.health_tests for select using (public.is_active_member());
create policy "owners manage health tests" on public.health_tests for all
  using (exists (select 1 from public.animals a where a.id = animal_id and (a.owner_id = auth.uid() or public.is_admin())))
  with check (exists (select 1 from public.animals a where a.id = animal_id and a.owner_id = auth.uid()) and public.can_sell());

create policy "members see show records" on public.show_records for select using (public.is_active_member());
create policy "owners manage show records" on public.show_records for all
  using (exists (select 1 from public.animals a where a.id = animal_id and (a.owner_id = auth.uid() or public.is_admin())))
  with check (exists (select 1 from public.animals a where a.id = animal_id and a.owner_id = auth.uid()) and public.can_sell());

create policy "members see media" on public.animal_media for select using (public.is_active_member());
create policy "owners add media" on public.animal_media for insert
  with check (owner_id = auth.uid() and public.can_sell());
create policy "owners delete media" on public.animal_media for delete
  using (owner_id = auth.uid() or public.is_admin());
create policy "owners edit media" on public.animal_media for update
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());

-- listings: members see listings that aren't paused, plus their own
create policy "members see listings" on public.listings for select
  using (public.is_active_member() and (not paused_by_admin or seller_id = auth.uid() or public.is_admin()));
create policy "sellers add listings" on public.listings for insert
  with check (seller_id = auth.uid() and public.can_sell());
create policy "sellers edit listings" on public.listings for update
  using (seller_id = auth.uid() or public.is_admin())
  with check (seller_id = auth.uid() or public.is_admin());
create policy "sellers delete listings" on public.listings for delete
  using (seller_id = auth.uid() or public.is_admin());

-- saved listings
create policy "members manage saved" on public.saved_listings for all
  using (member_id = auth.uid()) with check (member_id = auth.uid() and public.is_active_member());

-- conversations and messages: only the two people in them
create policy "participants see conversations" on public.conversations for select
  using (buyer_id = auth.uid() or seller_id = auth.uid());
create policy "members start conversations" on public.conversations for insert
  with check (buyer_id = auth.uid() and public.is_active_member());

create policy "participants see messages" on public.messages for select
  using (exists (select 1 from public.conversations c where c.id = conversation_id
                 and (c.buyer_id = auth.uid() or c.seller_id = auth.uid())));
create policy "participants send messages" on public.messages for insert
  with check (sender_id = auth.uid() and public.is_active_member() and exists (
    select 1 from public.conversations c where c.id = conversation_id
    and (c.buyer_id = auth.uid() or c.seller_id = auth.uid())));
create or replace function public.mark_conversation_read(p_conversation uuid)
returns void language sql security definer set search_path = public as $$
  update messages m set read_at = now()
  from conversations c
  where m.conversation_id = p_conversation and c.id = m.conversation_id
    and m.read_at is null and m.sender_id <> auth.uid()
    and (c.buyer_id = auth.uid() or c.seller_id = auth.uid());
$$;
grant execute on function public.mark_conversation_read(uuid) to authenticated;

-- reports and feedback
create policy "members file reports" on public.reports for insert
  with check (reporter_id = auth.uid() and public.is_active_member());
create policy "admin reads reports" on public.reports for select using (public.is_admin());
create policy "admin updates reports" on public.reports for update using (public.is_admin());

create policy "members send feedback" on public.feedback for insert
  with check (member_id = auth.uid());
create policy "admin reads feedback" on public.feedback for select using (public.is_admin());
create policy "admin updates feedback" on public.feedback for update using (public.is_admin());

-- ---------------------------------------------------------------------------
-- Storage: photos and videos. The bucket is public-read so front page photos
-- load without sign-in; file names are random. Members upload into a folder
-- named after their own id.
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit)
values ('media', 'media', true, 52428800)
on conflict (id) do nothing;

create policy "sellers upload media" on storage.objects for insert to authenticated
  with check (bucket_id = 'media' and (storage.foldername(name))[1] = auth.uid()::text and public.can_sell());
create policy "owners delete media files" on storage.objects for delete to authenticated
  using (bucket_id = 'media' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin()));
