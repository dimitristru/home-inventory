-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Households (groups of users)
create table households (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  invite_code text unique default substr(md5(random()::text), 1, 8),
  created_at timestamptz default now()
);

-- Users profile (extends Supabase auth.users)
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  household_id uuid references households(id),
  display_name text,
  avatar_url text,
  created_at timestamptz default now()
);

-- Categories
create table categories (
  id uuid primary key default uuid_generate_v4(),
  household_id uuid references households(id) on delete cascade,
  name text not null,
  icon text,
  color text default '#6366f1',
  budget_monthly numeric(10,2),
  created_at timestamptz default now()
);

-- Locations (σπίτι, αποθήκη, κλπ)
create table locations (
  id uuid primary key default uuid_generate_v4(),
  household_id uuid references households(id) on delete cascade,
  name text not null,
  icon text default '🏠',
  created_at timestamptz default now()
);

-- Products master list
create table products (
  id uuid primary key default uuid_generate_v4(),
  household_id uuid references households(id) on delete cascade,
  name text not null,
  brand text,
  barcode text,
  category_id uuid references categories(id),
  unit text default 'τεμ',  -- τεμάχια, κιλά, λίτρα κλπ
  min_quantity numeric(10,2) default 1,  -- κατώτατο όριο για αγορά
  image_url text,
  notes text,
  created_at timestamptz default now()
);

-- Inventory (αποθεματικό ανά τοποθεσία)
create table inventory (
  id uuid primary key default uuid_generate_v4(),
  product_id uuid references products(id) on delete cascade,
  location_id uuid references locations(id) on delete cascade,
  quantity numeric(10,2) default 0,
  updated_at timestamptz default now(),
  updated_by uuid references profiles(id),
  unique(product_id, location_id)
);

-- Shopping lists
create table shopping_lists (
  id uuid primary key default uuid_generate_v4(),
  household_id uuid references households(id) on delete cascade,
  name text not null default 'Λίστα αγορών',
  is_active boolean default true,
  created_at timestamptz default now(),
  created_by uuid references profiles(id)
);

-- Shopping list items
create table shopping_items (
  id uuid primary key default uuid_generate_v4(),
  list_id uuid references shopping_lists(id) on delete cascade,
  product_id uuid references products(id),
  custom_name text,  -- αν δεν υπάρχει στα products
  quantity numeric(10,2) default 1,
  unit text,
  is_checked boolean default false,
  checked_by uuid references profiles(id),
  checked_at timestamptz,
  notes text,
  created_at timestamptz default now(),
  created_by uuid references profiles(id)
);

-- Purchase history (αγορές/αποδείξεις)
create table purchases (
  id uuid primary key default uuid_generate_v4(),
  household_id uuid references households(id) on delete cascade,
  store_name text,
  total_amount numeric(10,2),
  purchased_at timestamptz default now(),
  receipt_image_url text,
  notes text,
  created_by uuid references profiles(id)
);

-- Purchase items
create table purchase_items (
  id uuid primary key default uuid_generate_v4(),
  purchase_id uuid references purchases(id) on delete cascade,
  product_id uuid references products(id),
  custom_name text,
  quantity numeric(10,2),
  unit text,
  price_per_unit numeric(10,2),
  total_price numeric(10,2),
  category_id uuid references categories(id)
);

-- RLS Policies
alter table households enable row level security;
alter table profiles enable row level security;
alter table categories enable row level security;
alter table locations enable row level security;
alter table products enable row level security;
alter table inventory enable row level security;
alter table shopping_lists enable row level security;
alter table shopping_items enable row level security;
alter table purchases enable row level security;
alter table purchase_items enable row level security;

-- Profiles: users see their own profile
create policy "Users can view own profile" on profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on profiles for update using (auth.uid() = id);
create policy "Users can insert own profile" on profiles for insert with check (auth.uid() = id);

-- Helper function: get user's household_id
create or replace function get_my_household_id()
returns uuid language sql security definer
as $$ select household_id from profiles where id = auth.uid() $$;

-- Household members can see/edit their household data
create policy "Household members" on households for all
  using (id = get_my_household_id());

create policy "Household members" on categories for all
  using (household_id = get_my_household_id());

create policy "Household members" on locations for all
  using (household_id = get_my_household_id());

create policy "Household members" on products for all
  using (household_id = get_my_household_id());

create policy "Household members" on inventory for all
  using (exists (
    select 1 from products p where p.id = product_id and p.household_id = get_my_household_id()
  ));

create policy "Household members" on shopping_lists for all
  using (household_id = get_my_household_id());

create policy "Household members" on shopping_items for all
  using (exists (
    select 1 from shopping_lists sl where sl.id = list_id and sl.household_id = get_my_household_id()
  ));

create policy "Household members" on purchases for all
  using (household_id = get_my_household_id());

create policy "Household members" on purchase_items for all
  using (exists (
    select 1 from purchases p where p.id = purchase_id and p.household_id = get_my_household_id()
  ));

-- Default categories (inserted after household creation via trigger or manually)
-- Trigger: auto-create profile on signup
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();
