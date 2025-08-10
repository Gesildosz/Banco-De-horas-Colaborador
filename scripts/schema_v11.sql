BEGIN;

-- Cria a tabela de notificações caso ainda não exista
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  -- 'admin' ou 'collaborator'
  user_type TEXT,
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Garante colunas usadas pelos endpoints
ALTER TABLE notifications
  ADD COLUMN IF NOT EXISTS user_type TEXT;

ALTER TABLE notifications
  ADD COLUMN IF NOT EXISTS is_read BOOLEAN;

ALTER TABLE notifications
  ALTER COLUMN is_read SET DEFAULT FALSE;

ALTER TABLE notifications
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ;

ALTER TABLE notifications
  ALTER COLUMN created_at SET DEFAULT now();

-- Normaliza registros antigos
UPDATE notifications
SET is_read = COALESCE(is_read, FALSE)
WHERE is_read IS NULL;

UPDATE notifications
SET created_at = COALESCE(created_at, now())
WHERE created_at IS NULL;

-- Se quiser manter apenas dois tipos válidos, você pode depois adicionar um CHECK:
-- ALTER TABLE notifications
--   ADD CONSTRAINT notifications_user_type_check
--   CHECK (user_type IN ('admin','collaborator'));

-- Índices para melhorar as consultas dos endpoints
CREATE INDEX IF NOT EXISTS idx_notifications_user
  ON notifications (user_id);

CREATE INDEX IF NOT EXISTS idx_notifications_user_type
  ON notifications (user_type);

CREATE INDEX IF NOT EXISTS idx_notifications_is_read
  ON notifications (is_read);

CREATE INDEX IF NOT EXISTS idx_notifications_created_at
  ON notifications (created_at DESC);

COMMIT;
