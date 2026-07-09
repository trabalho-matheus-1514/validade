-- ===================================================================
-- Prazo Certo — schema do Supabase
-- Cole este arquivo inteiro no SQL Editor do seu projeto Supabase
-- (Supabase Dashboard → SQL Editor → New query → Run).
-- ===================================================================

-- Extensão usada para gerar UUIDs (gen_random_uuid) — normalmente já vem habilitada.
create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------
-- Tabela de produtos
-- ---------------------------------------------------------------
create table if not exists products (
  id uuid primary key default gen_random_uuid(),
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

create index if not exists products_expiry_date_idx on products (expiry_date);
create index if not exists products_barcode_idx on products (barcode);

-- ---------------------------------------------------------------
-- Tabela de movimentações de estoque
-- ---------------------------------------------------------------
create table if not exists movements (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references products (id) on delete cascade,
  product_name text not null,
  type text not null check (type in ('entrada', 'saida', 'ajuste')),
  quantity numeric not null default 0,
  previous_stock numeric not null default 0,
  new_stock numeric not null default 0,
  note text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists movements_product_id_idx on movements (product_id);
create index if not exists movements_created_at_idx on movements (created_at desc);

-- ---------------------------------------------------------------
-- Row Level Security
--
-- Primeira versão: acesso público, sem autenticação de usuário —
-- qualquer pessoa com a URL do projeto e a chave "anon" consegue
-- ler e gravar. Isso é aceitável porque a chave anônima nunca dá
-- acesso administrativo ao banco, mas os DADOS ficam abertos.
-- Adequado para uso interno de um único minimercado nesta fase.
--
-- Para restringir depois (ex.: exigir login), troque "using (true)"
-- por regras baseadas em auth.uid() e habilite o Supabase Auth.
-- ---------------------------------------------------------------
alter table products enable row level security;
alter table movements enable row level security;

drop policy if exists "Public read products" on products;
drop policy if exists "Public insert products" on products;
drop policy if exists "Public update products" on products;
drop policy if exists "Public delete products" on products;
create policy "Public read products" on products for select using (true);
create policy "Public insert products" on products for insert with check (true);
create policy "Public update products" on products for update using (true) with check (true);
create policy "Public delete products" on products for delete using (true);

drop policy if exists "Public read movements" on movements;
drop policy if exists "Public insert movements" on movements;
drop policy if exists "Public delete movements" on movements;
create policy "Public read movements" on movements for select using (true);
create policy "Public insert movements" on movements for insert with check (true);
create policy "Public delete movements" on movements for delete using (true);

-- ---------------------------------------------------------------
-- Realtime: faz o Supabase emitir eventos de INSERT/UPDATE/DELETE
-- para essas tabelas, para todos os dispositivos conectados.
--
-- Depois de rodar este script, confirme também em:
-- Supabase Dashboard → Database → Replication → clique na tabela
-- "supabase_realtime" e verifique se "products" e "movements"
-- aparecem marcados. Em alguns projetos novos isso já vem ativado
-- pelo comando abaixo; em outros é preciso marcar manualmente ali.
-- ---------------------------------------------------------------
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'products'
  ) then
    alter publication supabase_realtime add table products;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'movements'
  ) then
    alter publication supabase_realtime add table movements;
  end if;
end $$;
