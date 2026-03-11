/**
 * /assinatura — Fluxo de assinatura digital GOV.BR
 *
 * Em produção: integrar com OAuth2 GOV.BR (https://acesso.gov.br)
 * Em desenvolvimento: mock que marca o documento como assinado diretamente.
 */
import { Router } from 'express'
import { supabase } from '../lib/supabase.js'
import { autenticar } from '../lib/auth.js'
import { registrarLog } from '../lib/log.js'

const router = Router()
router.use(autenticar)

const TIPOS_VALIDOS = [
  'atestado', 'relatorio', 'receita_simples',
  'receita_antimicrobiano', 'receita_controle_especial',
  'solicitacao_exames', 'laudo', 'parecer_tecnico',
]

// POST /assinatura/iniciar
// Em produção: redireciona para OAuth2 GOV.BR
// Em desenvolvimento: assina diretamente (mock)
router.post('/iniciar', async (req, res) => {
  try {
    const { tipoDocumento, documentoId } = req.body

    if (!tipoDocumento || !TIPOS_VALIDOS.includes(tipoDocumento))
      return res.status(400).json({ erro: 'Tipo de documento inválido.' })

    if (!documentoId)
      return res.status(400).json({ erro: 'documentoId é obrigatório.' })

    // Verifica se documento existe
    const { data: doc, error: e1 } = await supabase
      .from('documentos_medicos')
      .select('id, status, medico_id')
      .eq('id', documentoId)
      .maybeSingle()

    if (e1)   return res.status(500).json({ erro: e1.message })
    if (!doc) return res.status(404).json({ erro: 'Documento não encontrado.' })
    if (doc.status === 'assinado')
      return res.status(400).json({ erro: 'Documento já foi assinado.' })

    // ── MODO DESENVOLVIMENTO (mock) ──────────────────────────────────
    // Quando GOV_BR_CLIENT_ID não está configurado, assina diretamente
    if (!process.env.GOV_BR_CLIENT_ID) {
      const agora = new Date().toISOString()
      const hash  = `mock-${documentoId.slice(0, 8)}-${Date.now()}`

      const { error: e2 } = await supabase
        .from('documentos_medicos')
        .update({
          status:          'assinado',
          hash_documento:  hash,
          "updatedAt":     agora,
        })
        .eq('id', documentoId)

      if (e2) return res.status(500).json({ erro: e2.message })

      await registrarLog({
        usuario: req.usuario,
        acao: 'atualizar',
        tabela: 'documentos_medicos',
        registro_id: documentoId,
        detalhes: { acao: 'assinatura_mock', tipoDocumento },
      })

      return res.json({
        mock: true,
        assinado: true,
        dataAssinatura: agora,
        mensagem: '✅ Documento assinado (modo desenvolvimento — GOV.BR não configurado)',
      })
    }

    // ── MODO PRODUÇÃO: redireciona para GOV.BR OAuth2 ────────────────
    const state = Buffer.from(JSON.stringify({ documentoId, tipoDocumento })).toString('base64')
    const params = new URLSearchParams({
      response_type: 'code',
      client_id:     process.env.GOV_BR_CLIENT_ID,
      redirect_uri:  process.env.GOV_BR_REDIRECT_URI,
      scope:         'openid email profile govbr_empresa',
      state,
    })
    const url = `https://acesso.gov.br/authorize?${params.toString()}`
    res.json({ url, mock: false })

  } catch (e) { res.status(500).json({ erro: e.message }) }
})

// GET /assinatura/status/:tipoDocumento/:documentoId
router.get('/status/:tipoDocumento/:documentoId', async (req, res) => {
  try {
    const { documentoId } = req.params

    const { data, error } = await supabase
      .from('documentos_medicos')
      .select('id, status, "updatedAt", hash_documento')
      .eq('id', documentoId)
      .maybeSingle()

    if (error) return res.status(500).json({ erro: error.message })
    if (!data)  return res.status(404).json({ erro: 'Documento não encontrado.' })

    res.json({
      assinado:       data.status === 'assinado',
      status:         data.status,
      dataAssinatura: data['updatedAt'] || null,
      hash:           data.hash_documento || null,
    })
  } catch (e) { res.status(500).json({ erro: e.message }) }
})

export default router
