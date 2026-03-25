-- Create users table
create table public.users (
  id uuid references auth.users on delete cascade primary key,
  email text unique not null,
  name text,
  role text default 'user',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create projects table
create table public.projects (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  client_handle text,
  brand_config jsonb default '{}'::jsonb,
  system_prompt text,
  color text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create boards table
create table public.boards (
  id uuid default gen_random_uuid() primary key,
  project_id uuid references public.projects on delete cascade not null,
  name text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create groups table
create table public.groups (
  id uuid default gen_random_uuid() primary key,
  board_id uuid references public.boards on delete cascade not null,
  title text,
  x float not null,
  y float not null,
  w float not null,
  h float not null,
  color text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create nodes table
create table public.nodes (
  id uuid default gen_random_uuid() primary key,
  group_id uuid references public.groups on delete cascade,
  board_id uuid references public.boards on delete cascade not null,
  type text not null,
  title text,
  content text,
  metadata jsonb default '{}'::jsonb,
  position_x float not null,
  position_y float not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create connections table
create table public.connections (
  id uuid default gen_random_uuid() primary key,
  board_id uuid references public.boards on delete cascade not null,
  from_id uuid not null,
  from_type text not null,
  to_id uuid not null,
  to_type text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.users enable row level security;
alter table public.projects enable row level security;
alter table public.boards enable row level security;
alter table public.groups enable row level security;
alter table public.nodes enable row level security;
alter table public.connections enable row level security;

-- Basic Policies (Placeholder for dev)
create policy "Allow all for authenticated users on projects" on public.projects for all using (true);
create policy "Allow all for authenticated users on boards" on public.boards for all using (true);
create policy "Allow all for authenticated users on groups" on public.groups for all using (true);
create policy "Allow all for authenticated users on nodes" on public.nodes for all using (true);
create policy "Allow all for authenticated users on connections" on public.connections for all using (true);
