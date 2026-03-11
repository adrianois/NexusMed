-- Migration: criação da tabela retornos
-- Data: 2026-03-11
-- Descrição: armazena os retornos solicitados pelos atendimentos médicos

CREATE TABLE IF NOT EXISTS retornos (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinica_id  UUID REFERENCES clinicas(id) ON DELETE CASCADE,
  consulta_id UUID REFERENCES consultas(id) ON DELETE SET NULL,
  paciente_id UUID NOT NULL REFERENCES pacientes(id) ON DELETE CASCADE,
  medico_id   UUID REFERENCES usuarios(id) ON DELETE SET NULL,
  data_retorno DATE NOT NULL,
  motivo      TEXT NOT NULL,
  status      TEXT NOT NULL DEFAULT 'pendente'
              CHECK (status IN ('pendente','agendado','realizado','cancelado')),
  observacoes TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices para acelerar filtros comuns
CREATE INDEX IF NOT EXISTS idx_retornos_clinica    ON retornos (clinica_id);
CREATE INDEX IF NOT EXISTS idx_retornos_paciente   ON retornos (paciente_id);
CREATE INDEX IF NOT EXISTS idx_retornos_status     ON retornos (status);
CREATE INDEX IF NOT EXISTS idx_retornos_data       ON retornos (data_retorno);

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_retornos_updated_at ON retornos;
CREATE TRIGGER trg_retornos_updated_at
  BEFORE UPDATE ON retornos
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
