-- Extensões (apenas garantias; não causam erro se já existirem)
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- Adiciona a coluna hours_worked na tabela time_entries
alter table if exists time_entries
  add column if not exists hours_worked numeric(7,2) default 0.00;

-- Garante valores não nulos em colunas usadas pelo app
alter table if exists time_entries
  add column if not exists overtime_hours numeric(7,2) default 0.00;

alter table if exists time_entries
  add column if not exists balance_hours numeric(7,2) default 0.00;

-- Normaliza registros existentes para evitar null no front
update time_entries
set
  hours_worked   = coalesce(hours_worked, 0.00),
  overtime_hours = coalesce(overtime_hours, 0.00),
  balance_hours  = coalesce(balance_hours, 0.00)
where hours_worked is null
   or overtime_hours is null
   or balance_hours is null;

-- Opcional: índice útil (só cria se faltar)
create index if not exists idx_time_entries_collaborator_id_date
  on time_entries(collaborator_id, date);

-- Força o PostgREST a recarregar o cache de schema imediatamente (Supabase)
-- Se seu projeto permitir, este NOTIFY faz efeito instantâneo.
do $$
begin
  perform pg_notify('pgrst', 'reload schema');
exception when others then
  -- ignora caso a permissão não permita o notify
  null;
end $$;
