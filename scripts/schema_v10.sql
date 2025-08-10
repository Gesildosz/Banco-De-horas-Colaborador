BEGIN;

-- Adiciona coluna de líder direto, caso não exista
ALTER TABLE collaborators
ADD COLUMN IF NOT EXISTS direct_leader VARCHAR(255);

-- Garante a coluna 'is_active' usada no login de colaborador
ALTER TABLE collaborators
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

-- Ajusta default explicitamente (se a coluna já existia sem default)
ALTER TABLE collaborators
ALTER COLUMN is_active SET DEFAULT TRUE;

-- Normaliza valores nulos antigos
UPDATE collaborators
SET is_active = TRUE
WHERE is_active IS NULL;

COMMIT;
