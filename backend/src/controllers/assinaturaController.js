import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import {
  gerarUrlAutorizacao,
  obterAccessToken,
  assinarDocumento,
  decodificarState,
} from '../services/assinaturaGovBr.js';
import Assinatura from '../models/Assinatura.js';

const UPLOAD_DIR = process.env.ASSINATURA_UPLOAD_DIR || './uploads/assinaturas';

// Garante que o diretório de upload existe
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
 * Callback OAuth. Recebe o code e state do GOV.BR, assina o documento e salva o .p7s.
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

    // Registrar assinatura como pendente
    const assinatura = await Assinatura.create({
      id: uuidv4(),
      tipoDocumento,
      documentoId,
      medicoId,
      status: 'pendente',
    });

    // Obter access token
    const accessToken = await obterAccessToken(code);

    // TODO: Buscar/gerar o PDF real do documento pelo tipo e ID
    // Por ora, usando um buffer de exemplo. Substituir pelo serviço de geração de PDF de cada tipo.
    const pdfBuffer = Buffer.from(`Documento: ${tipoDocumento} | ID: ${documentoId}`);

    // Assinar documento
    const { pacoteP7s, hashBase64 } = await assinarDocumento(pdfBuffer, accessToken);

    // Salvar arquivo .p7s
    const nomeArquivo = `${tipoDocumento}_${documentoId}_${Date.now()}.p7s`;
    const caminhoArquivo = path.join(UPLOAD_DIR, nomeArquivo);
    fs.writeFileSync(caminhoArquivo, pacoteP7s);

    // Atualizar registro no banco
    await assinatura.update({
      status: 'assinado',
      arquivoP7s: caminhoArquivo,
      hashDocumento: hashBase64,
      dataAssinatura: new Date(),
    });

    return res.redirect(`${process.env.FRONTEND_URL}/assinatura/sucesso?documentoId=${documentoId}&tipo=${tipoDocumento}`);
  } catch (error) {
    console.error('Erro no callback de assinatura:', error);
    return res.redirect(`${process.env.FRONTEND_URL}/assinatura/erro?motivo=erro_interno`);
  }
}

/**
 * GET /assinatura/status/:tipo/:id
 * Retorna o status de assinatura de um documento.
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
      assinado: assinatura.status === 'assinado',
      status: assinatura.status,
      dataAssinatura: assinatura.dataAssinatura,
      arquivoP7s: assinatura.arquivoP7s,
      hashDocumento: assinatura.hashDocumento,
    });
  } catch (error) {
    console.error('Erro ao verificar status:', error);
    return res.status(500).json({ erro: 'Erro ao verificar status da assinatura.' });
  }
}
