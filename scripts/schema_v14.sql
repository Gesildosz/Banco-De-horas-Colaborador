-- Garantias de extensões
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- Garante colunas necessárias em time_entries
alter table if exists time_entries
  add column if not exists hours_worked numeric(7,2) default 0.00;

alter table if exists time_entries
  add column if not exists overtime_hours numeric(7,2) default 0.00;

alter table if exists time_entries
  add column if not exists balance_hours numeric(7,2) default 0.00;

-- Garante a coluna hours_change e um default seguro
alter table if exists time_entries
  add column if not exists hours_change numeric(7,2);

-- Define default e normaliza valores nulos
do $$
begin
  begin
    alter table time_entries alter column hours_change set default 0.00;
  exception when undefined_column then
    null;
  end;

  -- Normaliza registros existentes
  update time_entries
    set hours_change = 0.00
    where hours_change is null;

  -- Garante NOT NULL (só após normalizar e ter default)
  begin
    alter table time_entries alter column hours_change set not null;
  exception when others then
    -- se não der para forçar NOT NULL, ignore (mantém funcional)
    null;
  end;
end $$;

-- Índice útil
create index if not exists idx_time_entries_collab_date
  on time_entries(collaborator_id, date);

-- Força recarregar cache de schema (Supabase/PostgREST)
do $$
begin
  perform pg_notify('pgrst', 'reload schema');
exception when others then
  null;
end $$;
