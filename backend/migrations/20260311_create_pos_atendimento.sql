-- Migration: pós-atendimento
-- Data: 2026-03-11
-- Registra o checklist de saída do paciente após ser liberado pelo médico

CREATE TABLE IF NOT EXISTS pos_atendimento (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consulta_id         UUID NOT NULL UNIQUE REFERENCES consultas(id) ON DELETE CASCADE,
  paciente_id         UUID NOT NULL REFERENCES pacientes(id) ON DELETE CASCADE,
  clinica_id          UUID REFERENCES clinicas(id) ON DELETE CASCADE,

  -- Checklist de entrega de documentos
  doc_receita         BOOLEAN NOT NULL DEFAULT FALSE,
  doc_atestado        BOOLEAN NOT NULL DEFAULT FALSE,
  doc_solicitacao_ex  BOOLEAN NOT NULL DEFAULT FALSE,
  doc_outros          BOOLEAN NOT NULL DEFAULT FALSE,

  -- Cobrança / pagamento
  cobranca_status     TEXT NOT NULL DEFAULT 'pendente'
                      CHECK (cobranca_status IN ('pendente','realizado','isento','convenio')),
  cobranca_obs        TEXT,

  -- Retorno agendado
  retorno_agendado    BOOLEAN NOT NULL DEFAULT FALSE,
  retorno_consulta_id UUID REFERENCES consultas(id) ON DELETE SET NULL,

  -- Observações gerais de saída
  observacoes_saida   TEXT,

  -- Controle
  finalizado          BOOLEAN NOT NULL DEFAULT FALSE,
  usuario_id          UUID REFERENCES usuarios(id) ON DELETE SET NULL,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pos_atend_consulta  ON pos_atendimento (consulta_id);
CREATE INDEX IF NOT EXISTS idx_pos_atend_paciente  ON pos_atendimento (paciente_id);
CREATE INDEX IF NOT EXISTS idx_pos_atend_clinica   ON pos_atendimento (clinica_id);
CREATE INDEX IF NOT EXISTS idx_pos_atend_finalizado ON pos_atendimento (finalizado);

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_pos_atend_updated_at ON pos_atendimento;
CREATE TRIGGER trg_pos_atend_updated_at
  BEFORE UPDATE ON pos_atendimento
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
