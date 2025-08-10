BEGIN;

-- Garante que a coluna existe (não falha se já existir)
ALTER TABLE collaborators
ADD COLUMN IF NOT EXISTS balance_hours DECIMAL(10, 2) DEFAULT 0.00;

-- Garante o DEFAULT mesmo se a coluna já existia sem default
ALTER TABLE collaborators
ALTER COLUMN balance_hours SET DEFAULT 0.00;

-- Normaliza registros antigos com NULL
UPDATE collaborators
SET balance_hours = 0.00
WHERE balance_hours IS NULL;

-- (Re)cria a função de totais - idempotente
CREATE OR REPLACE FUNCTION get_total_positive_negative_hours()
RETURNS TABLE(total_positive_hours DECIMAL(10, 2), total_negative_hours DECIMAL(10, 2)) AS $$
BEGIN
    RETURN QUERY
    SELECT
        COALESCE(SUM(CASE WHEN balance_hours > 0 THEN balance_hours ELSE 0 END), 0)::DECIMAL(10, 2) AS total_positive_hours,
        COALESCE(SUM(CASE WHEN balance_hours < 0 THEN balance_hours ELSE 0 END), 0)::DECIMAL(10, 2) AS total_negative_hours
    FROM collaborators;
END;
$$ LANGUAGE plpgsql;

COMMIT;
