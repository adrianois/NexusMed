-- Migração: cria a tabela documentos_medicos no Supabase
-- Executar no SQL Editor do painel Supabase.

CREATE TABLE IF NOT EXISTS documentos_medicos (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo              TEXT NOT NULL CHECK (tipo IN (
                      'atestado', 'relatorio', 'receita_simples',
                      'receita_antimicrobiano', 'receita_controle_especial',
                      'solicitacao_exames', 'laudo', 'parecer_tecnico'
                    )),
  consulta_id       UUID NOT NULL,
  medico_id         UUID NOT NULL,
  dados             JSONB NOT NULL DEFAULT '{}',
  status            TEXT NOT NULL DEFAULT 'pendente_assinatura'
                    CHECK (status IN ('pendente_assinatura', 'assinado', 'cancelado')),
  arquivo_pdf       TEXT,
  arquivo_assinado  TEXT,
  hash_documento    VARCHAR(64),
  "createdAt"       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_doc_consulta ON documentos_medicos (consulta_id);
CREATE INDEX IF NOT EXISTS idx_doc_medico   ON documentos_medicos (medico_id);
CREATE INDEX IF NOT EXISTS idx_doc_status   ON documentos_medicos (status);
