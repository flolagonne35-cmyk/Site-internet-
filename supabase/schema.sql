-- ROLF — schéma de base pour comptes clients, avis et fidélité.
-- À coller une seule fois dans Supabase : Dashboard → SQL Editor → New query → coller → Run.
-- Les commandes ne sont pas incluses ici : elles arriveront quand le paiement sera branché,
-- une "commande" n'a de sens qu'à partir du moment où un paiement réel la confirme.

-- ============================================================
-- PROFILES — étend auth.users (géré par Supabase) avec nos champs
-- ============================================================
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Les noms affichés (ex: "Sophie M.") doivent être lisibles publiquement
-- pour afficher les avis sans obliger à être connecté.
create policy "profiles are publicly readable"
  on public.profiles for select
  using (true);

create policy "users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Crée automatiquement une ligne profiles à chaque inscription,
-- avec le display_name fourni au moment du signup (voir js/auth.js).
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'display_name', 'Client ROLF'));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- REVIEWS — avis produits réels, liés à un compte authentifié
-- ============================================================
create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  product_ref text not null,          -- correspond à products.json -> ref
  rating smallint not null check (rating between 1 and 5),
  body text not null check (char_length(body) between 10 and 2000),
  created_at timestamptz not null default now()
);

create index reviews_product_ref_idx on public.reviews (product_ref);

alter table public.reviews enable row level security;

create policy "reviews are publicly readable"
  on public.reviews for select
  using (true);

create policy "users can post their own reviews"
  on public.reviews for insert
  with check (auth.uid() = user_id);

create policy "users can edit their own reviews"
  on public.reviews for update
  using (auth.uid() = user_id);

create policy "users can delete their own reviews"
  on public.reviews for delete
  using (auth.uid() = user_id);

-- ============================================================
-- LOYALTY_TRANSACTIONS — grand livre de points (jamais un solde modifiable)
-- ============================================================
create table public.loyalty_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  points integer not null,            -- positif = gagné, négatif = utilisé
  reason text not null,               -- ex: 'bienvenue', 'parrainage'
  created_at timestamptz not null default now()
);

alter table public.loyalty_transactions enable row level security;

create policy "users can read their own loyalty history"
  on public.loyalty_transactions for select
  using (auth.uid() = user_id);

-- Volontairement AUCUNE policy insert/update/delete ici : personne ne peut
-- s'attribuer des points depuis le site. Les points ne seront accordés que
-- par une logique serveur de confiance (ex: fonction déclenchée par un
-- paiement Stripe confirmé), à écrire quand le paiement existera.

-- Solde actuel d'un utilisateur = somme de ses transactions.
create view public.loyalty_balances
with (security_invoker = true) as
  select user_id, coalesce(sum(points), 0) as balance
  from public.loyalty_transactions
  group by user_id;
