-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Profiles (Users)
create table public.profiles (
  id uuid references auth.users not null primary key,
  name text,
  style_preferences jsonb,
  created_at timestamptz default now()
);

-- Wardrobe Items
create table public.wardrobe_items (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) not null,
  image_url text not null,
  category text,
  tags text[],
  created_at timestamptz default now()
);

-- Outfits
create table public.outfits (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) not null,
  item_ids uuid[], -- Array of wardrobe_item IDs
  notes text,
  created_at timestamptz default now()
);

-- Chat History
create table public.chat_history (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) not null,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  created_at timestamptz default now()
);

-- RLS Policies (Simple for MVP)
alter table public.profiles enable row level security;
create policy "Public profiles are viewable by everyone." on public.profiles for select using (true);
create policy "Users can insert their own profile." on public.profiles for insert with check (auth.uid() = id);
create policy "Users can update own profile." on public.profiles for update using (auth.uid() = id);

alter table public.wardrobe_items enable row level security;
create policy "Users can view own wardrobe." on public.wardrobe_items for select using (auth.uid() = user_id);
create policy "Users can insert own wardrobe." on public.wardrobe_items for insert with check (auth.uid() = user_id);

alter table public.outfits enable row level security;
create policy "Users can view own outfits." on public.outfits for select using (auth.uid() = user_id);
create policy "Users can insert own outfits." on public.outfits for insert with check (auth.uid() = user_id);

alter table public.chat_history enable row level security;
create policy "Users can view own chat." on public.chat_history for select using (auth.uid() = user_id);
create policy "Users can insert own chat." on public.chat_history for insert with check (auth.uid() = user_id);
