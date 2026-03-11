/**
 * assinaturaController.js
 * Atualizado para usar documentoModel (Supabase) em vez de Documento (Sequelize).
 */
import fs from 'fs'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'
import {
  gerarUrlAutorizacao,
  obterAccessToken,
  assinarDocumento,
  decodificarState,
} from '../services/assinaturaGovBr.js'
import { gerarDocumento } from '../services/gerarPdfDocumentos.js'
import Assinatura from '../models/Assinatura.js'
import {
  findDocumentoById,
  updateDocumento,
} from '../models/documentoModel.js'          // ← Supabase
import Usuario from '../models/Usuario.js'
import Paciente from '../models/pacienteModel.js'

const UPLOAD_DIR = process.env.ASSINATURA_UPLOAD_DIR || './uploads/assinaturas'

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true })
}

// ─────────────────────────────────────────────────────────────
export async function iniciarAssinatura(req, res) {
  try {
    const { tipoDocumento, documentoId } = req.body

    if (!tipoDocumento || !documentoId) {
      return res.status(400).json({ erro: 'tipoDocumento e documentoId são obrigatórios.' })
    }

    const tiposValidos = [
      'atestado', 'relatorio', 'receita_simples',
      'receita_antimicrobiano', 'receita_controle_especial',
      'solicitacao_exames', 'laudo', 'parecer_tecnico',
    ]

    if (!tiposValidos.includes(tipoDocumento)) {
      return res.status(400).json({ erro: `Tipo inválido: ${tiposValidos.join(', ')}` })
    }

    const medicoId = req.usuario?.id
    const url = gerarUrlAutorizacao(tipoDocumento, documentoId, medicoId)
    return res.json({ url })
  } catch (error) {
    console.error('Erro ao iniciar assinatura:', error)
    return res.status(500).json({ erro: 'Erro interno ao iniciar assinatura.' })
  }
}

// ─────────────────────────────────────────────────────────────
export async function callbackAssinatura(req, res) {
  try {
    const { code, state, error: oauthError } = req.query

    if (oauthError) {
      return res.redirect(`${process.env.FRONTEND_URL}/assinatura/erro?motivo=${oauthError}`)
    }
    if (!code || !state) {
      return res.status(400).json({ erro: 'Parâmetros code e state são obrigatórios.' })
    }

    const { tipoDocumento, documentoId, medicoId } = decodificarState(state)

    const assinatura = await Assinatura.create({
      id: uuidv4(),
      tipoDocumento,
      documentoId,
      medicoId,
      status: 'pendente',
    })

    const accessToken = await obterAccessToken(code)
    const medico = await Usuario.findByPk(medicoId)
    if (!medico) throw new Error('Médico não encontrado')

    // Busca documento pelo Supabase
    const documento = await findDocumentoById(documentoId)
    if (!documento) throw new Error('Documento não encontrado')

    let paciente = null
    try {
      paciente = await Paciente.findOne({ where: { id: documento.consulta_id } })
    } catch (_) {}

    const dadosPdf = { ...documento.dados, medico, paciente }
    const pdfBuffer = await gerarDocumento(tipoDocumento, dadosPdf)
    const { pacoteP7s, hashBase64 } = await assinarDocumento(pdfBuffer, accessToken)

    const nomeArquivo = `${tipoDocumento}_${documentoId}_${Date.now()}.p7s`
    const caminhoArquivo = path.join(UPLOAD_DIR, nomeArquivo)
    fs.writeFileSync(caminhoArquivo, pacoteP7s)

    await assinatura.update({
      status: 'assinado',
      arquivoP7s: caminhoArquivo,
      hashDocumento: hashBase64,
      dataAssinatura: new Date(),
    })

    // Atualiza documento no Supabase
    await updateDocumento(documentoId, {
      status: 'assinado',
      arquivo_assinado: caminhoArquivo,
    })

    return res.redirect(
      `${process.env.FRONTEND_URL}/assinatura/sucesso?documentoId=${documentoId}&tipo=${tipoDocumento}`
    )
  } catch (error) {
    console.error('Erro no callback de assinatura:', error)
    return res.redirect(`${process.env.FRONTEND_URL}/assinatura/erro?motivo=erro_interno`)
  }
}

// ─────────────────────────────────────────────────────────────
export async function statusAssinatura(req, res) {
  try {
    const { tipo, id } = req.params

    const assinatura = await Assinatura.findOne({
      where: { tipoDocumento: tipo, documentoId: id },
      order: [['createdAt', 'DESC']],
    })

    if (!assinatura) return res.json({ assinado: false })

    return res.json({
      assinado:       assinatura.status === 'assinado',
      status:         assinatura.status,
      dataAssinatura: assinatura.dataAssinatura,
      arquivoP7s:     assinatura.arquivoP7s,
      hashDocumento:  assinatura.hashDocumento,
    })
  } catch (error) {
    console.error('Erro ao verificar status:', error)
    return res.status(500).json({ erro: 'Erro ao verificar status da assinatura.' })
  }
}
