-- Migração: cria a tabela documentos_medicos
-- Executar manualmente se o banco não for gerenciado pelo Sequelize sync.

CREATE TYPE tipo_documento_enum AS ENUM (
  'atestado',
  'relatorio',
  'receita_simples',
  'receita_antimicrobiano',
  'receita_controle_especial',
  'solicitacao_exames',
  'laudo',
  'parecer_tecnico'
);

CREATE TYPE status_documento_enum AS ENUM (
  'pendente_assinatura',
  'assinado',
  'cancelado'
);

CREATE TABLE IF NOT EXISTS documentos_medicos (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo              tipo_documento_enum          NOT NULL,
  consulta_id       UUID                         NOT NULL,
  medico_id         UUID                         NOT NULL,
  dados             JSONB                        NOT NULL DEFAULT '{}',
  status            status_documento_enum        NOT NULL DEFAULT 'pendente_assinatura',
  arquivo_pdf       TEXT,
  arquivo_assinado  TEXT,
  hash_documento    VARCHAR(64),
  "createdAt"       TIMESTAMPTZ                 NOT NULL DEFAULT NOW(),
  "updatedAt"       TIMESTAMPTZ                 NOT NULL DEFAULT NOW()
);

-- Índices úteis
CREATE INDEX IF NOT EXISTS idx_doc_consulta  ON documentos_medicos (consulta_id);
CREATE INDEX IF NOT EXISTS idx_doc_medico    ON documentos_medicos (medico_id);
CREATE INDEX IF NOT EXISTS idx_doc_status    ON documentos_medicos (status);
