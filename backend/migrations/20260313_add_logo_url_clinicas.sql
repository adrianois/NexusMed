-- Migration: Adiciona coluna logo_url na tabela clinicas
-- Data: 2026-03-13
-- Descrição: Armazena a logomarca da clínica em Base64 (PNG/JPG/SVG)
--            para exibição nos PDFs e no cadastro de clínicas.

ALTER TABLE clinicas
  ADD COLUMN IF NOT EXISTS logo_url TEXT;

COMMENT ON COLUMN clinicas.logo_url IS
  'Imagem da logomarca em formato Base64 (data:image/...). Máx ~300 KB.';
