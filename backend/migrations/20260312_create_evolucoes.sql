-- ============================================================
-- Migration: criar tabela evolucoes
-- NexusMed - 2026-03-12
-- ============================================================

CREATE TABLE IF NOT EXISTS public.evolucoes (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinica_id    UUID REFERENCES public.clinicas(id) ON DELETE SET NULL,
  paciente_id   UUID NOT NULL REFERENCES public.pacientes(id) ON DELETE CASCADE,
  medico_id     UUID REFERENCES public.usuarios(id) ON DELETE SET NULL,
  consulta_id   UUID REFERENCES public.consultas(id) ON DELETE SET NULL,

  tipo          TEXT NOT NULL DEFAULT 'evolucao'
                  CHECK (tipo IN ('evolucao','retorno','procedimento','exame','intercorrencia')),

  descricao     TEXT NOT NULL,
  observacoes   TEXT,

  -- Sinais vitais (opcionais)
  peso          NUMERIC(6,2),
  altura        NUMERIC(5,1),
  pressao       TEXT,           -- ex: "120/80"
  temperatura   NUMERIC(4,1),
  saturacao     NUMERIC(5,2),
  glicemia      NUMERIC(6,1),

  data_registro TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_evolucoes_paciente_id   ON public.evolucoes(paciente_id);
CREATE INDEX IF NOT EXISTS idx_evolucoes_clinica_id    ON public.evolucoes(clinica_id);
CREATE INDEX IF NOT EXISTS idx_evolucoes_medico_id     ON public.evolucoes(medico_id);
CREATE INDEX IF NOT EXISTS idx_evolucoes_data_registro ON public.evolucoes(data_registro DESC);

-- Row Level Security
ALTER TABLE public.evolucoes ENABLE ROW LEVEL SECURITY;

-- Política: service_role tem acesso total (backend usa service_role key)
CREATE POLICY "service_role full access" ON public.evolucoes
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
