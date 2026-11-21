-- ═══════════════════════════════════════════════════════════════════
-- EDUVAULT — Complete Supabase Schema
-- Run this entire file in Supabase → SQL Editor → New Query → Run
--
-- Safe to re-run: every statement is idempotent.
--
-- AUTH MODEL
-- Users sign in with Firebase. The frontend sends the Firebase ID token
-- to Supabase (Third-Party Auth). Inside Postgres the Firebase UID is
-- available as auth.jwt()->>'sub' — exposed below as requesting_user_id().
-- Do NOT use auth.uid() anywhere: it casts to uuid, and Firebase UIDs
-- are not uuids, so it would throw.
-- ═══════════════════════════════════════════════════════════════════

create extension if not exists "uuid-ossp";


-- ═══════════════════════════════════════════════════════════════════
-- 0. AUTH HELPERS
-- ═══════════════════════════════════════════════════════════════════

-- Firebase UID of the caller, or null for anonymous visitors.
create or replace function public.requesting_user_id()
returns text language sql stable as $$
  select nullif(auth.jwt() ->> 'sub', '')
$$;

-- True when the requests come from the browser (PostgREST roles),
-- false when run from the SQL editor or with the service_role key.
create or replace function public.is_client_request()
returns boolean language sql stable as $$
  select current_user in ('anon', 'authenticated')
$$;


-- ═══════════════════════════════════════════════════════════════════
-- 1. USERS
-- Mirrors Firebase Auth users. Created/updated by sync_profile() on login.
-- ═══════════════════════════════════════════════════════════════════
create table if not exists public.users (
  id            text primary key,        -- Firebase UID (e.g. "abc123xyz")
  email         text unique not null,
  name          text not null,
  avatar_url    text,
  role          text not null default 'student' check (role in ('student', 'admin')),
  status        text not null default 'active'  check (status in ('active', 'suspended')),
  created_at    timestamptz default now() not null,
  updated_at    timestamptz default now() not null
);

comment on table public.users is 'App user profiles, linked to Firebase Auth by id (Firebase UID)';

-- Needs the users table, so it is defined after it.
-- security definer: reads users without recursing into its own RLS policy.
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.users
    where id = public.requesting_user_id() and role = 'admin' and status = 'active'
  )
$$;


-- ═══════════════════════════════════════════════════════════════════
-- 2. CATEGORIES
-- ═══════════════════════════════════════════════════════════════════
create table if not exists public.categories (
  id          uuid primary key default uuid_generate_v4(),
  name        text unique not null,       -- e.g. "Development"
  emoji       text,                       -- e.g. "💻"
  slug        text unique not null,       -- e.g. "development"
  sort_order  integer default 0,
  created_at  timestamptz default now() not null
);

comment on table public.categories is 'Course and ebook categories shown in filters and browse pages';

insert into public.categories (name, emoji, slug, sort_order) values
  ('Development',  '💻', 'development',   1),
  ('Design',       '🎨', 'design',        2),
  ('Business',     '💼', 'business',      3),
  ('Data Science', '📊', 'data-science',  4),
  ('Marketing',    '📱', 'marketing',     5),
  ('Productivity', '⚡', 'productivity',  6)
on conflict (slug) do nothing;


-- ═══════════════════════════════════════════════════════════════════
-- 3. PRODUCTS (courses + ebooks in one table)
-- ═══════════════════════════════════════════════════════════════════
create table if not exists public.products (
  id                uuid primary key default uuid_generate_v4(),
  type              text not null check (type in ('course', 'ebook')),
  title             text not null,
  slug              text unique not null,           -- URL-safe, e.g. "complete-react-developer"
  description       text,                           -- Short description (used in cards)
  long_description  text,                           -- Full detail page description
  author            text not null,
  price             numeric(10,2) not null check (price >= 0),
  original_price    numeric(10,2) check (original_price >= 0),
  category_id       uuid references public.categories(id) on delete set null,
  image_url         text,                           -- Main thumbnail (Supabase Storage or external URL)
  color             text default '#1565C0',         -- Fallback card background color (hex)
  emoji             text,                           -- Fallback icon if no image
  rating            numeric(3,2) default 0 check (rating >= 0 and rating <= 5),
  review_count      integer default 0,
  student_count     integer default 0,
  is_bestseller     boolean default false,
  is_featured       boolean default false,
  is_published      boolean default false,          -- false = draft, not shown to students
  tags              text[] default '{}',

  -- Course-specific fields (null for ebooks)
  level             text,
  duration_hours    numeric(6,1),
  lesson_count      integer,

  -- eBook-specific fields (null for courses)
  page_count        integer,
  file_format       text,                           -- e.g. 'PDF + ePub + Kindle'
  file_url          text,

  created_at        timestamptz default now() not null,
  updated_at        timestamptz default now() not null,
  last_updated_label text                           -- Human label, e.g. "December 2024"
);

-- Columns added later. ALTER so existing databases are upgraded too.
alter table public.products
  add column if not exists curriculum        jsonb    default '[]',
  add column if not exists welcome_message   text,
  add column if not exists congrats_message  text,
  add column if not exists promo_video_url   text,
  add column if not exists language          text     default 'English',
  add column if not exists ebook_file_url    text,    -- path in the private ebook-files bucket
  add column if not exists ebook_file_size   bigint,
  add column if not exists created_by        text references public.users(id) on delete set null;

-- The course creator offers "All Levels", which the original constraint rejected.
alter table public.products drop constraint if exists products_level_check;
alter table public.products add constraint products_level_check
  check (level in ('Beginner', 'Intermediate', 'Advanced', 'Beginner to Advanced', 'All Levels'));

comment on table public.products is 'All sellable items — both courses and ebooks';

create index if not exists idx_products_type        on public.products(type);
create index if not exists idx_products_category    on public.products(category_id);
create index if not exists idx_products_published   on public.products(is_published);
create index if not exists idx_products_featured    on public.products(is_featured);
create index if not exists idx_products_created_by  on public.products(created_by);


-- ═══════════════════════════════════════════════════════════════════
-- 4. ORDERS
-- Created by the place_order() function at checkout.
-- ═══════════════════════════════════════════════════════════════════
create table if not exists public.orders (
  id              uuid primary key default uuid_generate_v4(),
  order_number    text unique not null,             -- Human-readable, e.g. "ORD-00042"
  user_id         text not null references public.users(id) on delete restrict,
  status          text not null default 'pending'
                    check (status in ('pending', 'completed', 'refunded', 'failed')),
  subtotal        numeric(10,2) not null,
  discount        numeric(10,2) default 0,
  total           numeric(10,2) not null,
  coupon_code     text,
  payment_method  text,                             -- e.g. 'stripe'
  stripe_payment_intent_id text,
  created_at      timestamptz default now() not null,
  updated_at      timestamptz default now() not null
);

comment on table public.orders is 'Purchase orders. One order can contain multiple products (see order_items)';

create index if not exists idx_orders_user_id   on public.orders(user_id);
create index if not exists idx_orders_status    on public.orders(status);
create index if not exists idx_orders_created   on public.orders(created_at desc);

create sequence if not exists order_number_seq start 1;

create or replace function generate_order_number()
returns trigger language plpgsql as $$
begin
  new.order_number := 'ORD-' || lpad(nextval('order_number_seq')::text, 5, '0');
  return new;
end;
$$;

drop trigger if exists set_order_number on public.orders;
create trigger set_order_number
  before insert on public.orders
  for each row execute function generate_order_number();


-- ═══════════════════════════════════════════════════════════════════
-- 5. ORDER ITEMS (price snapshot at purchase time)
-- ═══════════════════════════════════════════════════════════════════
create table if not exists public.order_items (
  id          uuid primary key default uuid_generate_v4(),
  order_id    uuid not null references public.orders(id) on delete cascade,
  product_id  uuid not null references public.products(id) on delete restrict,
  title       text not null,
  type        text not null,
  price       numeric(10,2) not null,
  created_at  timestamptz default now() not null
);

create index if not exists idx_order_items_order   on public.order_items(order_id);
create index if not exists idx_order_items_product on public.order_items(product_id);


-- ═══════════════════════════════════════════════════════════════════
-- 6. ENROLLMENTS — gates access to course/ebook content
-- ═══════════════════════════════════════════════════════════════════
create table if not exists public.enrollments (
  id           uuid primary key default uuid_generate_v4(),
  user_id      text not null references public.users(id) on delete cascade,
  product_id   uuid not null references public.products(id) on delete cascade,
  order_id     uuid references public.orders(id) on delete set null,
  progress     integer default 0 check (progress >= 0 and progress <= 100),
  completed_at timestamptz,
  enrolled_at  timestamptz default now() not null,
  unique(user_id, product_id)
);

-- Lecture ids the student has marked complete (progress is derived from it)
alter table public.enrollments
  add column if not exists completed_lectures jsonb not null default '[]';

create index if not exists idx_enrollments_user    on public.enrollments(user_id);
create index if not exists idx_enrollments_product on public.enrollments(product_id);


-- ═══════════════════════════════════════════════════════════════════
-- 7. COUPONS — only admins can list them; shoppers use validate_coupon()
-- ═══════════════════════════════════════════════════════════════════
create table if not exists public.coupons (
  id            uuid primary key default uuid_generate_v4(),
  code          text unique not null,               -- Always stored UPPERCASE
  discount_type text not null check (discount_type in ('percent', 'fixed')),
  discount_value numeric(10,2) not null check (discount_value > 0),
  max_uses      integer,                            -- null = unlimited
  uses          integer default 0 not null,
  expires_at    timestamptz,                        -- null = never expires
  is_active     boolean default true,
  created_at    timestamptz default now() not null
);

create or replace function uppercase_coupon_code()
returns trigger language plpgsql as $$
begin
  new.code := upper(new.code);
  return new;
end;
$$;

drop trigger if exists ensure_uppercase_coupon on public.coupons;
create trigger ensure_uppercase_coupon
  before insert or update on public.coupons
  for each row execute function uppercase_coupon_code();

insert into public.coupons (code, discount_type, discount_value, max_uses, expires_at) values
  ('LAUNCH50', 'percent', 50, 500, now() + interval '6 months'),
  ('SAVE20',   'percent', 20, 200, now() + interval '3 months'),
  ('FLAT10',   'fixed',   10, 100, now() + interval '1 month')
on conflict (code) do nothing;


-- ═══════════════════════════════════════════════════════════════════
-- 8. REVIEWS
-- ═══════════════════════════════════════════════════════════════════
create table if not exists public.reviews (
  id          uuid primary key default uuid_generate_v4(),
  product_id  uuid not null references public.products(id) on delete cascade,
  user_id     text not null references public.users(id) on delete cascade,
  rating      integer not null check (rating >= 1 and rating <= 5),
  comment     text,
  is_approved boolean default false,
  created_at  timestamptz default now() not null,
  unique(user_id, product_id)
);

create index if not exists idx_reviews_product on public.reviews(product_id);
create index if not exists idx_reviews_user    on public.reviews(user_id);


-- ═══════════════════════════════════════════════════════════════════
-- 9. TRIGGERS — timestamps and protected columns
-- ═══════════════════════════════════════════════════════════════════
create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists set_updated_at on public.users;
create trigger set_updated_at before update on public.users
  for each row execute function update_updated_at();

drop trigger if exists set_updated_at on public.products;
create trigger set_updated_at before update on public.products
  for each row execute function update_updated_at();

drop trigger if exists set_updated_at on public.orders;
create trigger set_updated_at before update on public.orders
  for each row execute function update_updated_at();

-- Non-admins can never change their own role or status.
create or replace function protect_user_fields()
returns trigger language plpgsql as $$
begin
  if public.is_client_request() and not public.is_admin() then
    if tg_op = 'INSERT' then
      new.role   := 'student';
      new.status := 'active';
    else
      new.id     := old.id;
      new.role   := old.role;
      new.status := old.status;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists protect_user_fields on public.users;
create trigger protect_user_fields before insert or update on public.users
  for each row execute function protect_user_fields();

-- Students may update their progress, but not move an enrollment to another product.
create or replace function protect_enrollment_fields()
returns trigger language plpgsql as $$
begin
  if public.is_client_request() and not public.is_admin() then
    new.user_id     := old.user_id;
    new.product_id  := old.product_id;
    new.order_id    := old.order_id;
    new.enrolled_at := old.enrolled_at;
  end if;
  return new;
end;
$$;

drop trigger if exists protect_enrollment_fields on public.enrollments;
create trigger protect_enrollment_fields before update on public.enrollments
  for each row execute function protect_enrollment_fields();

-- Students cannot approve their own reviews.
create or replace function protect_review_fields()
returns trigger language plpgsql as $$
begin
  if public.is_client_request() and not public.is_admin() then
    new.is_approved := case when tg_op = 'INSERT' then false else old.is_approved end;
  end if;
  return new;
end;
$$;

drop trigger if exists protect_review_fields on public.reviews;
create trigger protect_review_fields before insert or update on public.reviews
  for each row execute function protect_review_fields();


-- ═══════════════════════════════════════════════════════════════════
-- 10. ROW LEVEL SECURITY
-- Policies apply to every role (no "to authenticated") so they work
-- whether or not the Firebase token carries a role claim.
-- ═══════════════════════════════════════════════════════════════════
alter table public.users        enable row level security;
alter table public.categories   enable row level security;
alter table public.products     enable row level security;
alter table public.orders       enable row level security;
alter table public.order_items  enable row level security;
alter table public.enrollments  enable row level security;
alter table public.coupons      enable row level security;
alter table public.reviews      enable row level security;

-- Remove every existing policy on these tables (including the ones from
-- the previous version of this file) so re-running gives a clean state.
do $$
declare p record;
begin
  for p in
    select policyname, tablename from pg_policies
    where schemaname = 'public'
      and tablename in ('users','categories','products','orders','order_items','enrollments','coupons','reviews')
  loop
    execute format('drop policy if exists %I on public.%I', p.policyname, p.tablename);
  end loop;
end $$;

-- ── users ─────────────────────────────────────────
create policy "users: read own or admin" on public.users for select
  using (id = public.requesting_user_id() or public.is_admin());
create policy "users: insert own" on public.users for insert
  with check (id = public.requesting_user_id() or public.is_admin());
create policy "users: update own or admin" on public.users for update
  using (id = public.requesting_user_id() or public.is_admin());
create policy "users: admin delete" on public.users for delete
  using (public.is_admin());

-- ── categories ────────────────────────────────────
create policy "categories: public read" on public.categories for select
  using (true);
create policy "categories: admin write" on public.categories for all
  using (public.is_admin()) with check (public.is_admin());

-- ── products ──────────────────────────────────────
-- Published products are public; creators see their own drafts; admins see all.
create policy "products: read" on public.products for select
  using (is_published or created_by = public.requesting_user_id() or public.is_admin());
-- Any signed-in user can submit a draft for review. Only admins publish.
create policy "products: insert" on public.products for insert
  with check (
    public.is_admin() or (
      created_by = public.requesting_user_id()
      and not is_published and not coalesce(is_featured, false) and not coalesce(is_bestseller, false)
    )
  );
create policy "products: update" on public.products for update
  using (public.is_admin() or (created_by = public.requesting_user_id() and not is_published))
  with check (public.is_admin() or (created_by = public.requesting_user_id() and not is_published));
create policy "products: delete" on public.products for delete
  using (public.is_admin() or (created_by = public.requesting_user_id() and not is_published));

-- ── orders / order_items (writes go through place_order()) ──
create policy "orders: read own or admin" on public.orders for select
  using (user_id = public.requesting_user_id() or public.is_admin());
create policy "orders: admin write" on public.orders for all
  using (public.is_admin()) with check (public.is_admin());

create policy "order_items: read own or admin" on public.order_items for select
  using (
    public.is_admin() or exists (
      select 1 from public.orders o
      where o.id = order_items.order_id and o.user_id = public.requesting_user_id()
    )
  );
create policy "order_items: admin write" on public.order_items for all
  using (public.is_admin()) with check (public.is_admin());

-- ── enrollments ───────────────────────────────────
create policy "enrollments: read own or admin" on public.enrollments for select
  using (user_id = public.requesting_user_id() or public.is_admin());
create policy "enrollments: update own progress" on public.enrollments for update
  using (user_id = public.requesting_user_id() or public.is_admin());
create policy "enrollments: admin insert/delete" on public.enrollments for insert
  with check (public.is_admin());
create policy "enrollments: admin delete" on public.enrollments for delete
  using (public.is_admin());

-- ── coupons ───────────────────────────────────────
create policy "coupons: admin only" on public.coupons for all
  using (public.is_admin()) with check (public.is_admin());

-- ── reviews ───────────────────────────────────────
create policy "reviews: read approved, own, or admin" on public.reviews for select
  using (is_approved or user_id = public.requesting_user_id() or public.is_admin());
create policy "reviews: enrolled users create" on public.reviews for insert
  with check (
    user_id = public.requesting_user_id() and exists (
      select 1 from public.enrollments e
      where e.user_id = public.requesting_user_id() and e.product_id = reviews.product_id
    )
  );
create policy "reviews: update own or admin" on public.reviews for update
  using (user_id = public.requesting_user_id() or public.is_admin());
create policy "reviews: delete own or admin" on public.reviews for delete
  using (user_id = public.requesting_user_id() or public.is_admin());


-- ═══════════════════════════════════════════════════════════════════
-- 11. VIEWS
-- security_invoker = true makes views respect the RLS of the tables
-- underneath. Without it, views bypass RLS and would expose drafts
-- and revenue to anyone holding the anon key.
-- ═══════════════════════════════════════════════════════════════════
drop view if exists public.revenue_stats;
create view public.revenue_stats with (security_invoker = true) as
select
  count(*) filter (where status = 'completed') as completed_orders,
  count(*) filter (where status = 'pending')   as pending_orders,
  count(*) filter (where status = 'refunded')  as refunded_orders,
  coalesce(sum(total) filter (where status = 'completed'), 0) as total_revenue,
  coalesce(sum(total) filter (where status = 'completed' and created_at >= date_trunc('month', now())), 0) as revenue_this_month
from public.orders;

drop view if exists public.products_with_category;
create view public.products_with_category with (security_invoker = true) as
select
  p.*,
  c.name  as category_name,
  c.emoji as category_emoji,
  c.slug  as category_slug
from public.products p
left join public.categories c on c.id = p.category_id;


-- ═══════════════════════════════════════════════════════════════════
-- 12. RPC FUNCTIONS (called from the frontend with supabase.rpc)
-- ═══════════════════════════════════════════════════════════════════

-- Creates or refreshes the caller's profile from their Firebase token
-- and returns it (including role). Called on every sign-in.
create or replace function public.sync_profile(p_name text default null, p_avatar_url text default null)
returns public.users
language plpgsql security definer set search_path = public as $$
declare
  v_uid   text := public.requesting_user_id();
  v_email text := auth.jwt() ->> 'email';
  v_row   public.users;
begin
  if v_uid is null then
    raise exception 'Not signed in' using errcode = '28000';
  end if;
  if v_email is null then
    raise exception 'Your account has no email address';
  end if;

  insert into public.users (id, email, name, avatar_url)
  values (v_uid, v_email, coalesce(nullif(p_name, ''), split_part(v_email, '@', 1)), p_avatar_url)
  on conflict (id) do update set
    email      = excluded.email,
    name       = coalesce(nullif(p_name, ''), public.users.name),
    avatar_url = coalesce(p_avatar_url, public.users.avatar_url)
  returning * into v_row;

  return v_row;
end;
$$;

-- Checks a coupon code without exposing the coupon list.
create or replace function public.validate_coupon(p_code text)
returns table (code text, discount_type text, discount_value numeric)
language plpgsql stable security definer set search_path = public as $$
declare c public.coupons;
begin
  select * into c from public.coupons where coupons.code = upper(trim(p_code)) and is_active;
  if not found then
    raise exception 'Invalid or expired coupon code.';
  end if;
  if c.expires_at is not null and c.expires_at < now() then
    raise exception 'This coupon has expired.';
  end if;
  if c.max_uses is not null and c.uses >= c.max_uses then
    raise exception 'This coupon has reached its usage limit.';
  end if;
  return query select c.code, c.discount_type, c.discount_value;
end;
$$;

-- Checkout. Prices and discounts are computed here from the database,
-- never trusted from the browser.
--
-- ⚠️ DEMO MODE: there is no payment provider yet, so orders are created
-- as 'completed' and access is granted immediately. When Stripe is added,
-- create the order as 'pending' here and grant enrollments from a
-- Stripe webhook (server-side, service_role key) instead.
create or replace function public.place_order(p_product_ids uuid[], p_coupon_code text default null)
returns json
language plpgsql security definer set search_path = public as $$
declare
  v_uid       text := public.requesting_user_id();
  v_user      public.users;
  v_subtotal  numeric(10,2);
  v_discount  numeric(10,2) := 0;
  v_coupon    public.coupons;
  v_order     public.orders;
begin
  if v_uid is null then
    raise exception 'Please sign in to check out.';
  end if;

  select * into v_user from public.users where id = v_uid;
  if not found then
    raise exception 'Your profile is not set up yet. Please sign out and back in.';
  end if;
  if v_user.status <> 'active' then
    raise exception 'This account is suspended.';
  end if;

  -- Published products in the cart that the user does not already own
  create temporary table _cart on commit drop as
    select p.id, p.title, p.type, p.price
    from public.products p
    where p.id = any(p_product_ids)
      and p.is_published
      and not exists (
        select 1 from public.enrollments e where e.user_id = v_uid and e.product_id = p.id
      );

  if not exists (select 1 from _cart) then
    raise exception 'Nothing to purchase — these items are unavailable or already in My Courses.';
  end if;

  select coalesce(sum(price), 0) into v_subtotal from _cart;

  if nullif(trim(p_coupon_code), '') is not null then
    select * into v_coupon from public.coupons
    where code = upper(trim(p_coupon_code)) and is_active
      and (expires_at is null or expires_at > now())
      and (max_uses is null or uses < max_uses)
    for update;
    if not found then
      raise exception 'Invalid or expired coupon code.';
    end if;
    v_discount := case v_coupon.discount_type
      when 'percent' then round(v_subtotal * v_coupon.discount_value / 100, 2)
      else least(v_coupon.discount_value, v_subtotal)
    end;
    update public.coupons set uses = uses + 1 where id = v_coupon.id;
  end if;

  insert into public.orders (order_number, user_id, status, subtotal, discount, total, coupon_code, payment_method)
  values ('', v_uid, 'completed', v_subtotal, v_discount, greatest(v_subtotal - v_discount, 0), v_coupon.code, 'demo')
  returning * into v_order;

  insert into public.order_items (order_id, product_id, title, type, price)
  select v_order.id, id, title, type, price from _cart;

  insert into public.enrollments (user_id, product_id, order_id)
  select v_uid, id, v_order.id from _cart
  on conflict (user_id, product_id) do nothing;

  update public.products set student_count = coalesce(student_count, 0) + 1
  where id in (select id from _cart);

  return json_build_object(
    'id', v_order.id,
    'order_number', v_order.order_number,
    'subtotal', v_order.subtotal,
    'discount', v_order.discount,
    'total', v_order.total
  );
end;
$$;

grant execute on function public.sync_profile(text, text)       to anon, authenticated;
grant execute on function public.validate_coupon(text)          to anon, authenticated;
grant execute on function public.place_order(uuid[], text)      to anon, authenticated;


-- ═══════════════════════════════════════════════════════════════════
-- 13. STORAGE BUCKETS + POLICIES
-- ═══════════════════════════════════════════════════════════════════
insert into storage.buckets (id, name, public) values
  ('product-images', 'product-images', true),   -- thumbnails, public
  ('course-videos',  'course-videos',  false),  -- lecture videos, enrolled users only
  ('ebook-files',    'ebook-files',    false)   -- ebook downloads, enrolled users only
on conflict (id) do nothing;

drop policy if exists "eduvault: public read product images" on storage.objects;
drop policy if exists "eduvault: signed-in users upload"     on storage.objects;
drop policy if exists "eduvault: admin manage files"         on storage.objects;
drop policy if exists "eduvault: read private files"         on storage.objects;

create policy "eduvault: public read product images" on storage.objects for select
  using (bucket_id = 'product-images');

create policy "eduvault: signed-in users upload" on storage.objects for insert
  with check (
    bucket_id in ('product-images', 'course-videos', 'ebook-files')
    and public.requesting_user_id() is not null
  );

create policy "eduvault: admin manage files" on storage.objects for all
  using (bucket_id in ('product-images', 'course-videos', 'ebook-files') and public.is_admin())
  with check (bucket_id in ('product-images', 'course-videos', 'ebook-files') and public.is_admin());

-- Private files: the uploader, or anyone enrolled in a product that references the file.
create policy "eduvault: read private files" on storage.objects for select
  using (
    bucket_id in ('course-videos', 'ebook-files') and (
      owner_id = public.requesting_user_id()
      or exists (
        select 1
        from public.enrollments e
        join public.products p on p.id = e.product_id
        where e.user_id = public.requesting_user_id()
          and (p.ebook_file_url = storage.objects.name
               or p.curriculum::text like '%' || storage.objects.name || '%')
      )
    )
  );
