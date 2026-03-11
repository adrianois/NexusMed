/**
 * pdfService.js
 * Gera PDFs dos documentos médicos usando pdfkit.
 *
 * Cada tipo de documento tem seu próprio template.
 * O PDF é salvo em uploads/documentos/{ano}/{mes}/{uuid}.pdf
 * e o SHA-256 do arquivo é retornado junto com o caminho.
 *
 * Instalar dependência se ainda não instalada:
 *   npm install pdfkit
 */
import PDFDocument from 'pdfkit';
import fs          from 'fs';
import path        from 'path';
import crypto      from 'crypto';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Diretório base de uploads — ajuste conforme seu servidor
const DIR_UPLOADS = path.resolve(__dirname, '../../../uploads/documentos');

/**
 * Gera o PDF de um documento e salva em disco.
 * @param {import('../models/Documento.js').default} doc — instância Sequelize
 * @returns {{ caminho: string, hash: string }}
 */
export async function gerarPdfDocumento(doc) {
  // Cria diretório de destino AAAA/MM/
  const now     = new Date();
  const subDir  = path.join(DIR_UPLOADS, String(now.getFullYear()), String(now.getMonth() + 1).padStart(2, '0'));
  fs.mkdirSync(subDir, { recursive: true });

  const nomeArquivo = `${doc.id}.pdf`;
  const caminhoAbsoluto = path.join(subDir, nomeArquivo);
  // Caminho relativo armazenado no banco
  const caminhoRelativo = path.relative(
    path.resolve(__dirname, '../../..'),
    caminhoAbsoluto
  );

  await new Promise((resolve, reject) => {
    const pdfDoc = new PDFDocument({ margin: 60, size: 'A4' });
    const stream = fs.createWriteStream(caminhoAbsoluto);

    pdfDoc.pipe(stream);

    // ── Cabeçalho padrão ──────────────────────────────────────
    pdfDoc
      .fontSize(16).font('Helvetica-Bold')
      .text('NexusMed — Sistema de Saúde', { align: 'center' })
      .moveDown(0.3)
      .fontSize(12).font('Helvetica')
      .text(rotuloDeTipo(doc.tipo), { align: 'center' })
      .moveDown(0.5)
      .moveTo(60, pdfDoc.y).lineTo(535, pdfDoc.y).stroke()
      .moveDown(0.8);

    // ── Conteúdo específico por tipo ──────────────────────────
    renderizarCorpo(pdfDoc, doc.tipo, doc.dados);

    // ── Rodapé ────────────────────────────────────────────────
    pdfDoc
      .moveDown(2)
      .fontSize(9).font('Helvetica')
      .text(`Documento ID: ${doc.id}`, { align: 'left' })
      .text(`Gerado em: ${now.toLocaleString('pt-BR')}`, { align: 'left' })
      .text('Este documento possui validade legal somente com assinatura digital válida.', { align: 'center', color: '#555' });

    pdfDoc.end();
    stream.on('finish', resolve);
    stream.on('error',  reject);
  });

  // Calcula SHA-256 do arquivo gerado
  const conteudo = fs.readFileSync(caminhoAbsoluto);
  const hash     = crypto.createHash('sha256').update(conteudo).digest('hex');

  return { caminho: caminhoRelativo, hash };
}

// ──────────────────────────────────────────────────────────────
// Helpers internos
// ──────────────────────────────────────────────────────────────
function rotuloDeTipo(tipo) {
  const map = {
    atestado:                  'ATESTADO MÉDICO',
    relatorio:                 'RELATÓRIO MÉDICO',
    receita_simples:           'RECEITA MÉDICA SIMPLES',
    receita_antimicrobiano:    'RECEITA DE ANTIMICROBIANOS',
    receita_controle_especial: 'RECEITA DE CONTROLE ESPECIAL',
    solicitacao_exames:        'SOLICITAÇÃO DE EXAMES',
    laudo:                     'LAUDO MÉDICO',
    parecer_tecnico:           'PARECER TÉCNICO MÉDICO',
  };
  return map[tipo] || tipo.toUpperCase();
}

function linha(pdfDoc, label, value) {
  if (!value) return;
  pdfDoc.font('Helvetica-Bold').text(`${label}: `, { continued: true })
        .font('Helvetica').text(String(value));
}

function renderizarCorpo(pdfDoc, tipo, dados) {
  switch (tipo) {
    case 'atestado':
      linha(pdfDoc, 'Diagnóstico',  dados.diagnostico);
      linha(pdfDoc, 'Data início',  dados.data_inicio);
      linha(pdfDoc, 'Período',      dados.periodo_dias ? `${dados.periodo_dias} dia(s)` : undefined);
      linha(pdfDoc, 'Justificativa', dados.justificativa);
      linha(pdfDoc, 'Restrições',   dados.restricoes);
      break;

    case 'relatorio':
      linha(pdfDoc, 'Destinatário',     dados.destinatario);
      linha(pdfDoc, 'Diagnóstico',      dados.diagnostico);
      linha(pdfDoc, 'Histórico',        dados.historico_clinico);
      linha(pdfDoc, 'Exames',           dados.exames_realizados);
      linha(pdfDoc, 'Evolução/Conduta', dados.evolucao);
      linha(pdfDoc, 'Observações',      dados.observacoes);
      break;

    case 'receita_simples':
    case 'receita_antimicrobiano':
    case 'receita_controle_especial': {
      if (dados.indicacao)     linha(pdfDoc, 'Indicação',     dados.indicacao);
      if (dados.justificativa) linha(pdfDoc, 'Justificativa', dados.justificativa);
      pdfDoc.moveDown(0.5);
      (dados.medicamentos || []).forEach((m, i) => {
        pdfDoc.font('Helvetica-Bold').text(`${i + 1}. ${m.nome || ''} ${m.concentracao || ''}`.trim());
        pdfDoc.font('Helvetica');
        if (m.forma)      pdfDoc.text(`   Forma: ${m.forma}`);
        if (m.posologia)  pdfDoc.text(`   Posologia: ${m.posologia}`);
        if (m.quantidade) pdfDoc.text(`   Quantidade: ${m.quantidade}`);
        if (m.duracao)    pdfDoc.text(`   Duração: ${m.duracao}`);
        if (m.classificacao) pdfDoc.text(`   Classe: ${m.classificacao}`);
        pdfDoc.moveDown(0.4);
      });
      if (dados.observacoes) linha(pdfDoc, 'Obs', dados.observacoes);
      break;
    }

    case 'solicitacao_exames':
      linha(pdfDoc, 'Hipótese diagnóstica', dados.hipotese_diagnostica);
      if (dados.urgente) pdfDoc.fillColor('red').text('⚠ URGENTE').fillColor('black');
      pdfDoc.moveDown(0.5);
      (dados.exames || []).forEach((e, i) => {
        pdfDoc.font('Helvetica-Bold').text(`${i + 1}. ${e.nome}`);
        pdfDoc.font('Helvetica');
        if (e.tipo)      pdfDoc.text(`   Tipo: ${e.tipo}`);
        if (e.prazo)     pdfDoc.text(`   Prazo/Orientação: ${e.prazo}`);
        if (e.descricao) pdfDoc.text(`   Justificativa: ${e.descricao}`);
        pdfDoc.moveDown(0.4);
      });
      break;

    case 'laudo':
      linha(pdfDoc, 'Procedimento',  dados.procedimento);
      linha(pdfDoc, 'Data',          dados.data_procedimento);
      linha(pdfDoc, 'Indicação',     dados.indicacao);
      linha(pdfDoc, 'Técnica',       dados.descricao_tecnica);
      linha(pdfDoc, 'Achados',       dados.resultados);
      linha(pdfDoc, 'Conclusão',     dados.conclusao);
      linha(pdfDoc, 'Recomendações', dados.recomendacoes);
      break;

    case 'parecer_tecnico':
      linha(pdfDoc, 'Para',                   dados.destinatario);
      linha(pdfDoc, 'Especialidade',           dados.especialidade_solicitante);
      linha(pdfDoc, 'Data avaliação',          dados.data_avaliacao);
      linha(pdfDoc, 'Questionamento',          dados.questionamento);
      linha(pdfDoc, 'Parecer',                 dados.parecer);
      linha(pdfDoc, 'Fundamentação',           dados.fundamentacao);
      linha(pdfDoc, 'Recomendações',           dados.recomendacoes);
      break;

    default:
      pdfDoc.text(JSON.stringify(dados, null, 2));
  }
}
