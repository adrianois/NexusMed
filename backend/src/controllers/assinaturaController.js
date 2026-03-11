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
import Consulta from '../models/consultaModel.js';
import Usuario from '../models/Usuario.js';
import Paciente from '../models/pacienteModel.js';

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
 * Callback OAuth. Recebe o code e state do GOV.BR, gera o PDF real, assina e salva o .p7s.
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

    // Buscar dados do médico, paciente e consulta/documento
    const medico = await Usuario.findByPk(medicoId);
    if (!medico) {
      throw new Error('Médico não encontrado');
    }

    // Buscar consulta/documento original para obter dados
    const consulta = await Consulta.findByPk(documentoId);
    if (!consulta) {
      throw new Error('Consulta/documento não encontrado');
    }

    const paciente = await Paciente.findByPk(consulta.pacienteId);
    if (!paciente) {
      throw new Error('Paciente não encontrado');
    }

    // Preparar dados para geração do PDF conforme o tipo
    const dadosPdf = prepararDadosPorTipo(tipoDocumento, medico, paciente, consulta);

    // Gerar o PDF real
    const pdfBuffer = await gerarDocumento(tipoDocumento, dadosPdf);

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
 * Prepara dados específicos para cada tipo de documento
 * TODO: Integrar com endpoints reais de API para buscar dados completos
 */
function prepararDadosPorTipo(tipoDocumento, medico, paciente, consulta) {
  const dadosBase = { medico, paciente };

  switch (tipoDocumento) {
    case 'atestado':
      return {
        ...dadosBase,
        diagnostico: consulta.diagnostico || 'Não especificado',
        periodoInicio: consulta.dataConsulta,
        periodoFim: new Date(consulta.dataConsulta.getTime() + 3 * 24 * 60 * 60 * 1000),
        justificativa: 'Repouso recomendado pelo médico',
        restricoes: 'Sem atividades físicas intensas',
      };
    case 'relatorio':
      return {
        ...dadosBase,
        historico: consulta.historico || 'Consulta realizada',
        examesRealizados: 'Não informados',
        diagnostico: consulta.diagnostico || 'Aguardando confirmação',
        observacoes: 'Documento gerado automaticamente',
      };
    case 'receita_simples':
      return {
        ...dadosBase,
        medicamentos: [
          {
            nome: 'Dipirona 500mg',
            dosagem: '500mg',
            frequencia: '6 em 6 horas',
            duracao: '7 dias',
            observacoes: 'Conforme necessário',
          },
        ],
      };
    case 'receita_antimicrobiano':
      return {
        ...dadosBase,
        indicacao: consulta.diagnostico || 'Infecção',
        justificativa: 'Identificação de agente patôgeno',
        medicamentos: [
          {
            nome: 'Amoxicilina 500mg',
            dosagem: '500mg',
            frequencia: '8 em 8 horas',
            duracao: '10 dias',
          },
        ],
      };
    case 'receita_controle_especial':
      return {
        ...dadosBase,
        indicacao: 'Dor crônica',
        justificativa: 'Falha com outras terapias',
        medicamentos: [
          {
            nome: 'Tramadol 50mg',
            controlada: 'Opioides',
            dosagem: '50mg',
            frequencia: '12 em 12 horas',
            duracao: '30 dias',
          },
        ],
      };
    case 'solicitacao_exames':
      return {
        ...dadosBase,
        exames: [
          { nome: 'Hemograma Completo', descricao: 'Contagem de células', prazo: '24h' },
          { nome: 'Glicemia de Jejum', descricao: 'Verificar nífvel de glicose', prazo: '24h' },
        ],
        observacoes: 'Resultado em jejum obrigatório',
      };
    case 'laudo':
      return {
        ...dadosBase,
        procedimento: 'Ecografia',
        dataRealizado: consulta.dataConsulta,
        resultados: 'Não foram encontradas alterações significativas',
        conclusoes: 'Exame sem particularidades',
        recomendacoes: 'Retorno conforme protocolo de rotina',
      };
    case 'parecer_tecnico':
      return {
        ...dadosBase,
        questionamento: 'Avaliação de compatibilidade com atividades laborais',
        parecer: 'Paciente apto para retomar atividades',
        fundamentacao: 'Baseado em avaliação clín ica e exames complementares',
        recomendacoes: 'Acompanhamento médico continuado',
      };
    default:
      return dadosBase;
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
