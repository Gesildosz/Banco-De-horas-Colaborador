-- Extensões necessárias (idempotente)
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- Garante colunas necessárias na tabela time_entries
alter table if exists time_entries
  add column if not exists hours_worked numeric(7,2) default 0.00;

alter table if exists time_entries
  add column if not exists overtime_hours numeric(7,2) default 0.00;

alter table if exists time_entries
  add column if not exists balance_hours numeric(7,2) default 0.00;

-- Coluna 'hours_change' (alguns scripts usam esse nome); deixar com default e NOT NULL
alter table if exists time_entries
  add column if not exists hours_change numeric(7,2);

do $$
begin
  -- default seguro
  begin
    alter table time_entries alter column hours_change set default 0.00;
  exception when undefined_column then
    null;
  end;

  -- normaliza registros existentes
  update time_entries
    set hours_change = 0.00
  where hours_change is null;

  -- força NOT NULL (se possível)
  begin
    alter table time_entries alter column hours_change set not null;
  exception when others then
    null;
  end;
end $$;

-- Garante coluna 'new_balance' usada pelo app; define default e NOT NULL
alter table if exists time_entries
  add column if not exists new_balance numeric(10,2);

do $$
begin
  -- define default
  begin
    alter table time_entries alter column new_balance set default 0.00;
  exception when undefined_column then
    null;
  end;

  -- normaliza registros existentes
  update time_entries
    set new_balance = 0.00
  where new_balance is null;

  -- força NOT NULL (se possível)
  begin
    alter table time_entries alter column new_balance set not null;
  exception when others then
    null;
  end;
end $$;

-- Índice útil para histórico/consultas
create index if not exists idx_time_entries_collab_date on time_entries (collaborator_id, date);

-- Pede para o PostgREST recarregar o schema (acelera o cache)
do $$
begin
  perform pg_notify('pgrst', 'reload schema');
exception when others then
  null;
end $$;
