import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const UPLOAD_DIR = process.env.ASSINATURA_UPLOAD_DIR || './uploads/assinaturas';

// Configuração de fontes e estilos padrão
const FONTES = {
  titulo: 16,
  subtitulo: 12,
  corpo: 10,
  rodape: 8,
};

const CORES = {
  titulo: '#1a4d70',
  texto: '#000000',
  cinza: '#666666',
};

/**
 * Função auxiliar para adicionar cabeçalho padrão em todos os documentos
 */
function adicionarCabecalho(doc, titulo, medico, paciente, data) {
  doc.fontSize(FONTES.titulo).fillColor(CORES.titulo).text(titulo, { align: 'center' }).moveDown(0.5);
  doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
  doc.moveDown(0.5);

  doc.fontSize(FONTES.corpo).fillColor(CORES.cinza);
  doc.text(`Médico: ${medico.nome} | CRM: ${medico.crm}`, { width: 400 });
  doc.text(`Paciente: ${paciente.nome}`, { width: 400 });
  doc.text(`Data: ${new Date(data).toLocaleDateString('pt-BR')}`, { width: 400 });
  doc.moveDown(0.5);
}

/**
 * Função auxiliar para adicionar rodapé com assinatura digital e QR code (placeholder)
 */
function adicionarRodape(doc) {
  doc.fontSize(FONTES.rodape).fillColor(CORES.cinza);
  doc.moveTo(50, doc.page.height - 100).lineTo(550, doc.page.height - 100).stroke();
  doc.text('Este documento será assinado digitalmente com certificado avançado GOV.BR', 50, doc.page.height - 90, { align: 'center', width: 500 });
  doc.text('Validar assinatura em: https://validar.iti.gov.br', 50, doc.page.height - 70, { align: 'center', width: 500 });
}

/**
 * Gera Atestado Médico
 */
export async function gerarAtestado(dados) {
  const { medico, paciente, diagnostico, periodoInicio, periodoFim, justificativa, restricoes } = dados;

  return new Promise((resolve, reject) => {
    const nomeArquivo = `atestado_${paciente.id}_${Date.now()}.pdf`;
    const caminhoArquivo = path.join(UPLOAD_DIR, nomeArquivo);
    const doc = new PDFDocument({ margin: 50 });
    const stream = fs.createWriteStream(caminhoArquivo);

    doc.pipe(stream);

    adicionarCabecalho(doc, 'ATESTADO MÉDICO', medico, paciente, new Date());

    doc.fontSize(FONTES.corpo).fillColor(CORES.texto);
    doc.text(`Diagnostico: ${diagnostico}`, { align: 'left' }).moveDown(0.3);
    doc.text(`Período: ${new Date(periodoInicio).toLocaleDateString('pt-BR')} a ${new Date(periodoFim).toLocaleDateString('pt-BR')}`, { align: 'left' }).moveDown(0.5);

    if (justificativa) {
      doc.text(`Justificativa: ${justificativa}`, { align: 'left' }).moveDown(0.5);
    }

    if (restricoes) {
      doc.text(`Restrições: ${restricoes}`, { align: 'left' }).moveDown(0.5);
    }

    doc.moveDown(1);
    doc.fontSize(FONTES.corpo).text(`${medico.nome}`);
    doc.text(`CRM: ${medico.crm}`);
    doc.text(`Assinado digitalmente em: ${new Date().toLocaleString('pt-BR')}`);

    adicionarRodape(doc);

    doc.end();

    stream.on('finish', () => resolve(fs.readFileSync(caminhoArquivo)));
    stream.on('error', reject);
  });
}

/**
 * Gera Relatório Médico
 */
export async function gerarRelatorioMedico(dados) {
  const { medico, paciente, historico, examesRealizados, diagnostico, observacoes } = dados;

  return new Promise((resolve, reject) => {
    const nomeArquivo = `relatorio_${paciente.id}_${Date.now()}.pdf`;
    const caminhoArquivo = path.join(UPLOAD_DIR, nomeArquivo);
    const doc = new PDFDocument({ margin: 50 });
    const stream = fs.createWriteStream(caminhoArquivo);

    doc.pipe(stream);

    adicionarCabecalho(doc, 'RELATÓRIO MÉDICO', medico, paciente, new Date());

    doc.fontSize(FONTES.corpo).fillColor(CORES.texto);
    doc.text('HISTÓRICO CLÍNICO:', { underline: true }).moveDown(0.3);
    doc.text(historico).moveDown(0.5);

    doc.text('EXAMES REALIZADOS:', { underline: true }).moveDown(0.3);
    doc.text(examesRealizados || 'Nenhum exame adicional realizado').moveDown(0.5);

    doc.text('DIAGNÓSTICO:', { underline: true }).moveDown(0.3);
    doc.text(diagnostico).moveDown(0.5);

    if (observacoes) {
      doc.text('OBSERVAÇÕES:', { underline: true }).moveDown(0.3);
      doc.text(observacoes).moveDown(0.5);
    }

    doc.moveDown(1);
    doc.fontSize(FONTES.corpo).text(`${medico.nome}`);
    doc.text(`CRM: ${medico.crm}`);
    doc.text(`Assinado digitalmente em: ${new Date().toLocaleString('pt-BR')}`);

    adicionarRodape(doc);

    doc.end();

    stream.on('finish', () => resolve(fs.readFileSync(caminhoArquivo)));
    stream.on('error', reject);
  });
}

/**
 * Gera Receita Simples
 */
export async function gerarReceitaSimples(dados) {
  const { medico, paciente, medicamentos } = dados;

  return new Promise((resolve, reject) => {
    const nomeArquivo = `receita_simples_${paciente.id}_${Date.now()}.pdf`;
    const caminhoArquivo = path.join(UPLOAD_DIR, nomeArquivo);
    const doc = new PDFDocument({ margin: 50 });
    const stream = fs.createWriteStream(caminhoArquivo);

    doc.pipe(stream);

    adicionarCabecalho(doc, 'RECEITA SIMPLES', medico, paciente, new Date());

    doc.fontSize(FONTES.corpo).fillColor(CORES.texto);
    doc.text('MEDICAMENTOS PRESCRITOS:', { underline: true }).moveDown(0.3);

    if (Array.isArray(medicamentos)) {
      medicamentos.forEach((med, idx) => {
        doc.text(`${idx + 1}. ${med.nome}`);
        doc.text(`   Dosagem: ${med.dosagem}`);
        doc.text(`   Frequência: ${med.frequencia}`);
        doc.text(`   Duração: ${med.duracao}`);
        if (med.observacoes) doc.text(`   Observações: ${med.observacoes}`);
        doc.moveDown(0.3);
      });
    }

    doc.moveDown(1);
    doc.fontSize(FONTES.corpo).text(`${medico.nome}`);
    doc.text(`CRM: ${medico.crm}`);
    doc.text(`Assinado digitalmente em: ${new Date().toLocaleString('pt-BR')}`);

    adicionarRodape(doc);

    doc.end();

    stream.on('finish', () => resolve(fs.readFileSync(caminhoArquivo)));
    stream.on('error', reject);
  });
}

/**
 * Gera Receita de Antimicrobianos (exigência CFM - pode usar GOV.BR ou VIDAAS)
 */
export async function gerarReceitaAntimicrobiano(dados) {
  const { medico, paciente, medicamentos, indicacao, justificativa } = dados;

  return new Promise((resolve, reject) => {
    const nomeArquivo = `receita_antimicrobiano_${paciente.id}_${Date.now()}.pdf`;
    const caminhoArquivo = path.join(UPLOAD_DIR, nomeArquivo);
    const doc = new PDFDocument({ margin: 50 });
    const stream = fs.createWriteStream(caminhoArquivo);

    doc.pipe(stream);

    adicionarCabecalho(doc, 'RECEITA DE ANTIMICROBIANOS', medico, paciente, new Date());

    doc.fontSize(8).fillColor('#CC0000).text('⚠️ ATENÇÃO: Esta receita deve ser assinada com certificado avançado (GOV.BR nível Prata/Ouro ou VIDAAS CFM)', { align: 'center' }).moveDown(0.5);

    doc.fontSize(FONTES.corpo).fillColor(CORES.texto);
    doc.text(`Indicação: ${indicacao}`).moveDown(0.3);
    if (justificativa) doc.text(`Justificativa: ${justificativa}`).moveDown(0.3);
    doc.text('ANTIMICROBIANOS PRESCRITOS:', { underline: true }).moveDown(0.3);

    if (Array.isArray(medicamentos)) {
      medicamentos.forEach((med, idx) => {
        doc.text(`${idx + 1}. ${med.nome}`);
        doc.text(`   Dosagem: ${med.dosagem}`);
        doc.text(`   Frequência: ${med.frequencia}`);
        doc.text(`   Duração: ${med.duracao}`);
        if (med.observacoes) doc.text(`   Observações: ${med.observacoes}`);
        doc.moveDown(0.3);
      });
    }

    doc.moveDown(1);
    doc.fontSize(FONTES.corpo).text(`${medico.nome}`);
    doc.text(`CRM: ${medico.crm}`);
    doc.text(`Assinado digitalmente em: ${new Date().toLocaleString('pt-BR')}`);

    adicionarRodape(doc);

    doc.end();

    stream.on('finish', () => resolve(fs.readFileSync(caminhoArquivo)));
    stream.on('error', reject);
  });
}

/**
 * Gera Receita de Controle Especial (exigência CFM - VIDAAS obrigatório)
 */
export async function gerarReceitaControleEspecial(dados) {
  const { medico, paciente, medicamentos, indicacao, justificativa } = dados;

  return new Promise((resolve, reject) => {
    const nomeArquivo = `receita_controle_especial_${paciente.id}_${Date.now()}.pdf`;
    const caminhoArquivo = path.join(UPLOAD_DIR, nomeArquivo);
    const doc = new PDFDocument({ margin: 50 });
    const stream = fs.createWriteStream(caminhoArquivo);

    doc.pipe(stream);

    adicionarCabecalho(doc, 'RECEITA DE CONTROLE ESPECIAL', medico, paciente, new Date());

    doc.fontSize(8).fillColor('#CC0000').text('⚠️ OBRIGATÓRIO: Esta receita DEVE ser assinada com VIDAAS (certificado digital do CRM)', { align: 'center' }).moveDown(0.5);
    doc.fontSize(8).fillColor('#FF6600').text('Não use GOV.BR para este tipo de receita', { align: 'center' }).moveDown(0.5);

    doc.fontSize(FONTES.corpo).fillColor(CORES.texto);
    doc.text(`Indicação: ${indicacao}`).moveDown(0.3);
    if (justificativa) doc.text(`Justificativa: ${justificativa}`).moveDown(0.3);
    doc.text('MEDICAMENTOS DE CONTROLE ESPECIAL:', { underline: true }).moveDown(0.3);

    if (Array.isArray(medicamentos)) {
      medicamentos.forEach((med, idx) => {
        doc.text(`${idx + 1}. ${med.nome} (${med.controlada})`);
        doc.text(`   Dosagem: ${med.dosagem}`);
        doc.text(`   Frequência: ${med.frequencia}`);
        doc.text(`   Duração: ${med.duracao}`);
        doc.moveDown(0.3);
      });
    }

    doc.moveDown(1);
    doc.fontSize(FONTES.corpo).text(`${medico.nome}`);
    doc.text(`CRM: ${medico.crm}`);
    doc.text(`Assinado digitalmente em: ${new Date().toLocaleString('pt-BR')}`);

    adicionarRodape(doc);

    doc.end();

    stream.on('finish', () => resolve(fs.readFileSync(caminhoArquivo)));
    stream.on('error', reject);
  });
}

/**
 * Gera Solicitação de Exames
 */
export async function gerarSolicitacaoExames(dados) {
  const { medico, paciente, exames, observacoes } = dados;

  return new Promise((resolve, reject) => {
    const nomeArquivo = `solicitacao_exames_${paciente.id}_${Date.now()}.pdf`;
    const caminhoArquivo = path.join(UPLOAD_DIR, nomeArquivo);
    const doc = new PDFDocument({ margin: 50 });
    const stream = fs.createWriteStream(caminhoArquivo);

    doc.pipe(stream);

    adicionarCabecalho(doc, 'SOLICITAÇÃO DE EXAMES', medico, paciente, new Date());

    doc.fontSize(FONTES.corpo).fillColor(CORES.texto);
    doc.text('EXAMES SOLICITADOS:', { underline: true }).moveDown(0.3);

    if (Array.isArray(exames)) {
      exames.forEach((exame, idx) => {
        doc.text(`${idx + 1}. ${exame.nome}`);
        if (exame.descricao) doc.text(`   ${exame.descricao}`, { indent: 20 });
        if (exame.prazo) doc.text(`   Prazo: ${exame.prazo}`, { indent: 20 });
        doc.moveDown(0.2);
      });
    }

    if (observacoes) {
      doc.moveDown(0.5);
      doc.text('OBSERVAÇÕES:', { underline: true }).moveDown(0.3);
      doc.text(observacoes);
    }

    doc.moveDown(1);
    doc.fontSize(FONTES.corpo).text(`${medico.nome}`);
    doc.text(`CRM: ${medico.crm}`);
    doc.text(`Assinado digitalmente em: ${new Date().toLocaleString('pt-BR')}`);

    adicionarRodape(doc);

    doc.end();

    stream.on('finish', () => resolve(fs.readFileSync(caminhoArquivo)));
    stream.on('error', reject);
  });
}

/**
 * Gera Laudo
 */
export async function gerarLaudo(dados) {
  const { medico, paciente, procedimento, dataRealizado, resultados, conclusoes, recomendacoes } = dados;

  return new Promise((resolve, reject) => {
    const nomeArquivo = `laudo_${paciente.id}_${Date.now()}.pdf`;
    const caminhoArquivo = path.join(UPLOAD_DIR, nomeArquivo);
    const doc = new PDFDocument({ margin: 50 });
    const stream = fs.createWriteStream(caminhoArquivo);

    doc.pipe(stream);

    adicionarCabecalho(doc, 'LAUDO', medico, paciente, new Date());

    doc.fontSize(8).fillColor('#CC0000').text('⚠️ RECOMENDADO: Para laudos com valor legal (biópsia, imagem, etc), usar VIDAAS (certificado CFM) é recomendado', { align: 'center' }).moveDown(0.5);

    doc.fontSize(FONTES.corpo).fillColor(CORES.texto);
    doc.text(`Procedimento: ${procedimento}`);
    doc.text(`Data de realização: ${new Date(dataRealizado).toLocaleDateString('pt-BR')}`);
    doc.moveDown(0.5);

    doc.text('RESULTADOS:', { underline: true }).moveDown(0.3);
    doc.text(resultados).moveDown(0.5);

    doc.text('CONCLUSÕES:', { underline: true }).moveDown(0.3);
    doc.text(conclusoes).moveDown(0.5);

    if (recomendacoes) {
      doc.text('RECOMENDAÇÕES:', { underline: true }).moveDown(0.3);
      doc.text(recomendacoes).moveDown(0.5);
    }

    doc.moveDown(1);
    doc.fontSize(FONTES.corpo).text(`${medico.nome}`);
    doc.text(`CRM: ${medico.crm}`);
    doc.text(`Assinado digitalmente em: ${new Date().toLocaleString('pt-BR')}`);

    adicionarRodape(doc);

    doc.end();

    stream.on('finish', () => resolve(fs.readFileSync(caminhoArquivo)));
    stream.on('error', reject);
  });
}

/**
 * Gera Parecer Técnico
 */
export async function gerarParecesTecnico(dados) {
  const { medico, paciente, questionamento, parecer, fundamentacao, recomendacoes } = dados;

  return new Promise((resolve, reject) => {
    const nomeArquivo = `parecer_tecnico_${paciente.id}_${Date.now()}.pdf`;
    const caminhoArquivo = path.join(UPLOAD_DIR, nomeArquivo);
    const doc = new PDFDocument({ margin: 50 });
    const stream = fs.createWriteStream(caminhoArquivo);

    doc.pipe(stream);

    adicionarCabecalho(doc, 'PARECER TÉCNICO', medico, paciente, new Date());

    doc.fontSize(FONTES.corpo).fillColor(CORES.texto);
    doc.text(`Questionamento: ${questionamento}`).moveDown(0.5);

    doc.text('PARECER:', { underline: true }).moveDown(0.3);
    doc.text(parecer).moveDown(0.5);

    doc.text('FUNDAMENTAÇÃO:', { underline: true }).moveDown(0.3);
    doc.text(fundamentacao).moveDown(0.5);

    if (recomendacoes) {
      doc.text('RECOMENDAÇÕES:', { underline: true }).moveDown(0.3);
      doc.text(recomendacoes).moveDown(0.5);
    }

    doc.moveDown(1);
    doc.fontSize(FONTES.corpo).text(`${medico.nome}`);
    doc.text(`CRM: ${medico.crm}`);
    doc.text(`Assinado digitalmente em: ${new Date().toLocaleString('pt-BR')}`);

    adicionarRodape(doc);

    doc.end();

    stream.on('finish', () => resolve(fs.readFileSync(caminhoArquivo)));
    stream.on('error', reject);
  });
}

/**
 * Factory: gera o documento correto baseado no tipo
 */
export async function gerarDocumento(tipoDocumento, dados) {
  switch (tipoDocumento) {
    case 'atestado':
      return gerarAtestado(dados);
    case 'relatorio':
      return gerarRelatorioMedico(dados);
    case 'receita_simples':
      return gerarReceitaSimples(dados);
    case 'receita_antimicrobiano':
      return gerarReceitaAntimicrobiano(dados);
    case 'receita_controle_especial':
      return gerarReceitaControleEspecial(dados);
    case 'solicitacao_exames':
      return gerarSolicitacaoExames(dados);
    case 'laudo':
      return gerarLaudo(dados);
    case 'parecer_tecnico':
      return gerarParecesTecnico(dados);
    default:
      throw new Error(`Tipo de documento inválido: ${tipoDocumento}`);
  }
}
