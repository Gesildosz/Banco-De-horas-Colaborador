-- Garantir extensões (uma vez)
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- Colunas exigidas pelo app

-- Tabela collaborators
alter table if exists collaborators
  add column if not exists direct_leader varchar(255);

alter table if exists collaborators
  add column if not exists is_active boolean default true;

alter table if exists collaborators
  add column if not exists balance_hours numeric(7,2) default 0.00;

-- Tabela time_entries
alter table if exists time_entries
  add column if not exists overtime_hours numeric(7,2) default 0.00;

alter table if exists time_entries
  add column if not exists balance_hours numeric(7,2) default 0.00;

-- Index útil (já existe no schema base; cria se faltar)
create index if not exists idx_time_entries_collaborator_id_date
  on time_entries(collaborator_id, date);

-- Backfill: normalizar valores nulos (evita erros no front e inserts futuros)
update collaborators
set balance_hours = 0.00
where balance_hours is null;

update time_entries
set overtime_hours = coalesce(overtime_hours, 0.00),
    balance_hours  = coalesce(balance_hours, 0.00)
where overtime_hours is null
   or balance_hours is null;

-- Verificações rápidas (opcionais)
-- select column_name
-- from information_schema.columns
-- where table_name in ('collaborators', 'time_entries')
--   and column_name in ('direct_leader','is_active','balance_hours','overtime_hours')
-- order by table_name, column_name;
