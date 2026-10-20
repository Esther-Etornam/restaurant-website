create table if not exists public.menu_items (
    id uuid primary key default gen_random_uuid(),
    name text not null unique check (char_length(name) between 1 and 100),
    description text not null check (char_length(description) between 1 and 500),
    price integer not null check (price between 1 and 10000),
    category text not null check (category in ('rice', 'local', 'grill')),
    image_url text not null,
    display_order integer not null default 0,
    available boolean not null default true,
    created_at timestamptz not null default now()
);

create table if not exists public.orders (
    id uuid primary key default gen_random_uuid(),
    customer_name text not null check (char_length(customer_name) between 1 and 80),
    phone text not null check (char_length(phone) between 5 and 30),
    fulfillment text not null check (fulfillment in ('Collection', 'Delivery')),
    customer_notes text not null default '' check (char_length(customer_notes) <= 300),
    items jsonb not null check (jsonb_typeof(items) = 'array' and jsonb_array_length(items) between 1 and 20),
    total integer not null check (total between 1 and 200000),
    status text not null default 'new' check (status in ('new', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled')),
    created_at timestamptz not null default now()
);

create table if not exists public.reservation_requests (
    id uuid primary key default gen_random_uuid(),
    customer_name text not null check (char_length(customer_name) between 1 and 80),
    phone text not null check (char_length(phone) between 5 and 30),
    reservation_date date not null,
    reservation_time text not null check (char_length(reservation_time) between 1 and 20),
    guests text not null check (guests in ('1 guest', '2 guests', '3 guests', '4 guests', '5 guests', '6 guests', '7+ guests')),
    status text not null default 'new' check (status in ('new', 'confirmed', 'declined')),
    created_at timestamptz not null default now()
);

alter table public.menu_items enable row level security;
alter table public.orders enable row level security;
alter table public.reservation_requests enable row level security;

grant usage on schema public to anon, authenticated;
revoke all on public.menu_items, public.orders, public.reservation_requests from anon, authenticated;
grant select on public.menu_items to anon, authenticated;
grant insert (
    customer_name, phone, fulfillment, customer_notes, items, total
) on public.orders to anon, authenticated;
grant insert (
    customer_name, phone, reservation_date, reservation_time, guests
) on public.reservation_requests to anon, authenticated;

drop policy if exists "Anyone can read available menu items" on public.menu_items;
create policy "Anyone can read available menu items"
    on public.menu_items for select
    to anon, authenticated
    using (available = true);

drop policy if exists "Visitors can submit new orders" on public.orders;
create policy "Visitors can submit new orders"
    on public.orders for insert
    to anon, authenticated
    with check (
        status = 'new'
        and jsonb_typeof(items) = 'array'
        and jsonb_array_length(items) between 1 and 20
    );

drop policy if exists "Visitors can submit reservation requests" on public.reservation_requests;
create policy "Visitors can submit reservation requests"
    on public.reservation_requests for insert
    to anon, authenticated
    with check (status = 'new' and reservation_date between current_date and current_date + 365);

insert into public.menu_items (name, description, price, category, image_url, display_order)
values
    ('Ghanaian Jollof Rice', 'Smoky, savoury rice cooked in a rich tomato and pepper sauce.', 35, 'rice', 'foodimg/jollof.jpg', 1),
    ('Banku', 'A comforting Ghanaian staple, prepared fresh and ready for your favourite pairing.', 30, 'local', 'foodimg/banku.jpg', 2),
    ('Fried Rice', 'Fragrant fried rice with crisp vegetables and a medley of tasty sides.', 40, 'rice', 'foodimg/fried-rice.jpg', 3),
    ('Grilled Fish', 'Flame-grilled fish, beautifully seasoned for a tender, flavourful bite.', 45, 'grill', 'foodimg/grilled fish.jpg', 4)
on conflict (name) do nothing;
