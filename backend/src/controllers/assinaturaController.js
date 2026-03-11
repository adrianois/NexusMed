/**
 * assinaturaController.js
 *
 * Correção aplicada:
 *  - callbackAssinatura agora busca Documento.findByPk(documentoId)
 *    em vez de Consulta.findByPk(documentoId), usando os dados
 *    preenchidos pelo médico no modal (doc.dados) para gerar o PDF.
 *  - Removido import de Consulta como Sequelize model (era CommonJS/Supabase).
 */
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import {
  gerarUrlAutorizacao,
  obterAccessToken,
  assinarDocumento,
  decodificarState,
} from '../services/assinaturaGovBr.js';
import { gerarDocumento } from '../services/gerarPdfDocumentos.js';
import Assinatura from '../models/Assinatura.js';
import Documento  from '../models/Documento.js';   // ← substituído Consulta por Documento
import Usuario    from '../models/Usuario.js';
import Paciente   from '../models/pacienteModel.js';

const UPLOAD_DIR = process.env.ASSINATURA_UPLOAD_DIR || './uploads/assinaturas';

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

/**
 * POST /assinatura/iniciar
 * Inicia o fluxo OAuth. Retorna a URL de autorização do GOV.BR.
 */
export async function iniciarAssinatura(req, res) {
  try {
    const { tipoDocumento, documentoId } = req.body;

    if (!tipoDocumento || !documentoId) {
      return res.status(400).json({ erro: 'tipoDocumento e documentoId são obrigatórios.' });
    }

    const tiposValidos = [
      'atestado', 'relatorio', 'receita_simples',
      'receita_antimicrobiano', 'receita_controle_especial',
      'solicitacao_exames', 'laudo', 'parecer_tecnico',
    ];

    if (!tiposValidos.includes(tipoDocumento)) {
      return res.status(400).json({ erro: `Tipo de documento inválido. Use um dos seguintes: ${tiposValidos.join(', ')}` });
    }

    const medicoId = req.usuario?.id;
    const url = gerarUrlAutorizacao(tipoDocumento, documentoId, medicoId);

    return res.json({ url });
  } catch (error) {
    console.error('Erro ao iniciar assinatura:', error);
    return res.status(500).json({ erro: 'Erro interno ao iniciar assinatura.' });
  }
}

/**
 * GET /assinatura/callback
 * Callback OAuth do GOV.BR.
 *
 * Fluxo corrigido:
 *  1. Decodifica state → { tipoDocumento, documentoId, medicoId }
 *  2. Busca Documento (tabela documentos_medicos) pelo documentoId
 *  3. Usa doc.dados (já preenchido pelo médico) para gerar o PDF
 *  4. Assina o PDF e salva o .p7s
 */
export async function callbackAssinatura(req, res) {
  try {
    const { code, state, error: oauthError } = req.query;

    if (oauthError) {
      return res.redirect(`${process.env.FRONTEND_URL}/assinatura/erro?motivo=${oauthError}`);
    }

    if (!code || !state) {
      return res.status(400).json({ erro: 'Parâmetros code e state são obrigatórios.' });
    }

    const { tipoDocumento, documentoId, medicoId } = decodificarState(state);

    // Registra assinatura como pendente
    const assinatura = await Assinatura.create({
      id: uuidv4(),
      tipoDocumento,
      documentoId,
      medicoId,
      status: 'pendente',
    });

    // Obtém access token GOV.BR
    const accessToken = await obterAccessToken(code);

    // Busca o médico
    const medico = await Usuario.findByPk(medicoId);
    if (!medico) throw new Error('Médico não encontrado');

    // ✅ CORREÇÃO: busca o Documento (documentos_medicos), não a Consulta
    const documento = await Documento.findByPk(documentoId);
    if (!documento) throw new Error('Documento não encontrado');

    // Busca o paciente via consultaId do documento
    let paciente = null;
    try {
      paciente = await Paciente.findOne({ where: { id: documento.consultaId } });
    } catch (_) {
      // Paciente opcional para geração do PDF
    }

    // ✅ Usa doc.dados (preenchidos pelo médico no modal) + médico + paciente
    const dadosPdf = {
      ...documento.dados,
      medico,
      paciente,
    };

    // Gera o PDF real com os dados do documento
    const pdfBuffer = await gerarDocumento(tipoDocumento, dadosPdf);

    // Assina o PDF
    const { pacoteP7s, hashBase64 } = await assinarDocumento(pdfBuffer, accessToken);

    // Salva arquivo .p7s
    const nomeArquivo = `${tipoDocumento}_${documentoId}_${Date.now()}.p7s`;
    const caminhoArquivo = path.join(UPLOAD_DIR, nomeArquivo);
    fs.writeFileSync(caminhoArquivo, pacoteP7s);

    // Atualiza registro de assinatura
    await assinatura.update({
      status: 'assinado',
      arquivoP7s: caminhoArquivo,
      hashDocumento: hashBase64,
      dataAssinatura: new Date(),
    });

    // Atualiza status do documento
    await documento.update({ status: 'assinado', arquivoAssinado: caminhoArquivo });

    return res.redirect(
      `${process.env.FRONTEND_URL}/assinatura/sucesso?documentoId=${documentoId}&tipo=${tipoDocumento}`
    );
  } catch (error) {
    console.error('Erro no callback de assinatura:', error);
    return res.redirect(`${process.env.FRONTEND_URL}/assinatura/erro?motivo=erro_interno`);
  }
}

/**
 * GET /assinatura/status/:tipo/:id
 */
export async function statusAssinatura(req, res) {
  try {
    const { tipo, id } = req.params;

    const assinatura = await Assinatura.findOne({
      where: { tipoDocumento: tipo, documentoId: id },
      order: [['createdAt', 'DESC']],
    });

    if (!assinatura) {
      return res.json({ assinado: false });
    }

    return res.json({
      assinado:       assinatura.status === 'assinado',
      status:         assinatura.status,
      dataAssinatura: assinatura.dataAssinatura,
      arquivoP7s:     assinatura.arquivoP7s,
      hashDocumento:  assinatura.hashDocumento,
    });
  } catch (error) {
    console.error('Erro ao verificar status:', error);
    return res.status(500).json({ erro: 'Erro ao verificar status da assinatura.' });
  }
}
