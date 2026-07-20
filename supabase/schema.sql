-- ===================================================================
-- Prazo Certo — schema do Supabase (v2: multi-estabelecimento)
-- Cole este arquivo inteiro no SQL Editor do seu projeto Supabase
-- (Supabase Dashboard → SQL Editor → New query → Run).
--
-- IMPORTANTE — pré-requisito manual antes de rodar este script:
-- Supabase Dashboard → Authentication → Sign In / Providers → Anonymous
-- → habilite "Allow anonymous sign-ins". Sem isso, o app não consegue
-- autenticar os dispositivos e as políticas abaixo bloqueiam tudo.
-- ===================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------
-- Tabela de estabelecimentos ("Meus Estabelecimentos")
-- Cada linha pertence a um usuário (auth.uid()) — é a raiz de todo
-- o isolamento de dados do sistema.
-- ---------------------------------------------------------------
create table if not exists stores (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null,
  icon text not null default '🏪',
  color text not null default '#2f6f5e',
  created_at timestamptz not null default now()
);

create index if not exists stores_user_id_idx on stores (user_id);

-- ---------------------------------------------------------------
-- Produtos — agora pertencem a um estabelecimento (store_id)
-- ---------------------------------------------------------------
create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references stores (id) on delete cascade,
  barcode text not null default '',
  name text not null,
  category text not null default 'Outros',
  brand text not null default '',
  unit text not null default 'un',
  stock numeric not null default 0,
  min_stock numeric not null default 0,
  manufacture_date date,
  expiry_date date not null,
  supplier text not null default '',
  notes text not null default '',
  image text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists products_store_id_idx on products (store_id);
create index if not exists products_expiry_date_idx on products (expiry_date);
create index if not exists products_barcode_idx on products (barcode);

-- ---------------------------------------------------------------
-- Movimentações — também pertencem a um estabelecimento (store_id),
-- além de referenciar o produto.
-- ---------------------------------------------------------------
create table if not exists movements (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references stores (id) on delete cascade,
  product_id uuid references products (id) on delete cascade,
  product_name text not null,
  type text not null check (type in ('entrada', 'saida', 'ajuste')),
  quantity numeric not null default 0,
  previous_stock numeric not null default 0,
  new_stock numeric not null default 0,
  note text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists movements_store_id_idx on movements (store_id);
create index if not exists movements_product_id_idx on movements (product_id);
create index if not exists movements_created_at_idx on movements (created_at desc);

-- ---------------------------------------------------------------
-- Se você já tinha produtos/movimentos de ANTES desta mudança
-- (schema v1, sem estabelecimentos), rode o bloco abaixo depois de
-- fazer login no app pelo menos uma vez. Ele cria um estabelecimento
-- padrão e "adota" os dados antigos para o seu usuário.
-- Comente/remova se não tiver dados antigos para migrar.
-- ---------------------------------------------------------------
-- do $$
-- declare
--   v_user_id uuid := 'COLE_AQUI_SEU_USER_ID'; -- veja como pegar no README
--   v_store_id uuid;
-- begin
--   insert into stores (user_id, name, icon, color)
--   values (v_user_id, 'Meu Estabelecimento', '🏪', '#2f6f5e')
--   returning id into v_store_id;
--
--   update products set store_id = v_store_id where store_id is null;
--   update movements set store_id = v_store_id where store_id is null;
-- end $$;

-- ---------------------------------------------------------------
-- Row Level Security — isolamento real por usuário/estabelecimento.
-- A partir daqui, mesmo alterando requisições manualmente, ninguém
-- lê ou grava dados de um estabelecimento que não é seu, porque o
-- Postgres aplica isso no próprio banco, não no código do app.
-- ---------------------------------------------------------------
alter table stores enable row level security;
alter table products enable row level security;
alter table movements enable row level security;

drop policy if exists "Users manage own stores" on stores;
create policy "Users manage own stores" on stores
  for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "Users manage products of own stores" on products;
create policy "Users manage products of own stores" on products
  for all
  using (store_id in (select id from stores where user_id = auth.uid()))
  with check (store_id in (select id from stores where user_id = auth.uid()));

drop policy if exists "Users manage movements of own stores" on movements;
create policy "Users manage movements of own stores" on movements
  for all
  using (store_id in (select id from stores where user_id = auth.uid()))
  with check (store_id in (select id from stores where user_id = auth.uid()));

-- ---------------------------------------------------------------
-- Realtime: eventos de INSERT/UPDATE/DELETE para as 3 tabelas.
-- O app se inscreve com um filtro "store_id=eq.<id ativo>", então
-- cada dispositivo só recebe eventos do estabelecimento que está
-- olhando no momento — nunca de outro.
-- Confirme também em Database → Replication que products, movements
-- e stores aparecem marcados na publicação supabase_realtime.
-- ---------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'stores') then
    alter publication supabase_realtime add table stores;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'products') then
    alter publication supabase_realtime add table products;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'movements') then
    alter publication supabase_realtime add table movements;
  end if;
end $$;

-- Necessário para que eventos DELETE tragam todas as colunas da linha
-- antiga (inclusive store_id) — sem isso, o filtro por estabelecimento
-- em exclusões pode não funcionar corretamente.
alter table stores replica identity full;
alter table products replica identity full;
alter table movements replica identity full;
