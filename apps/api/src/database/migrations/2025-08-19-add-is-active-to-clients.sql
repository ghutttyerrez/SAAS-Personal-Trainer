-- Adiciona campo is_active à tabela clients
ALTER TABLE clients ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT true;
