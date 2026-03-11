/**
 * documentoModel.js
 * Acesso à tabela documentos_medicos via Supabase (padrão do projeto).
 * Substitui o model Sequelize que dependia de database.js inexistente.
 */
import sql from '../../config/db.js'
import { v4 as uuidv4 } from 'uuid'

const TIPOS_VALIDOS = [
  'atestado',
  'relatorio',
  'receita_simples',
  'receita_antimicrobiano',
  'receita_controle_especial',
  'solicitacao_exames',
  'laudo',
  'parecer_tecnico',
]

/**
 * Cria um novo documento médico.
 * @param {{ tipo, consulta_id, medico_id, dados }} payload
 * @returns {object} documento criado
 */
export async function createDocumento({ tipo, consulta_id, medico_id, dados }) {
  const id = uuidv4()
  const [doc] = await sql`
    INSERT INTO documentos_medicos
      (id, tipo, consulta_id, medico_id, dados, status, "createdAt", "updatedAt")
    VALUES
      (${id}, ${tipo}, ${consulta_id}, ${medico_id}, ${sql.json(dados)},
       'pendente_assinatura', NOW(), NOW())
    RETURNING *
  `
  return doc
}

/**
 * Atualiza campos de um documento (arquivo_pdf, hash_documento, status, etc).
 * @param {string} id
 * @param {object} fields - campos a atualizar
 */
export async function updateDocumento(id, fields) {
  // Monta SET dinâmico somente com os campos enviados
  const allowed = ['arquivo_pdf', 'arquivo_assinado', 'hash_documento', 'status']
  const sets = Object.entries(fields)
    .filter(([k]) => allowed.includes(k))

  if (sets.length === 0) return

  // Usa tagged template para cada campo
  await sql`
    UPDATE documentos_medicos
    SET ${ sql(Object.fromEntries(sets)) }, "updatedAt" = NOW()
    WHERE id = ${id}
  `
}

/**
 * Busca um documento pelo ID.
 */
export async function findDocumentoById(id) {
  const [doc] = await sql`
    SELECT * FROM documentos_medicos WHERE id = ${id} LIMIT 1
  `
  return doc || null
}

/**
 * Lista documentos de uma consulta.
 */
export async function findDocumentosByConsulta(consultaId) {
  return await sql`
    SELECT id, tipo, status, arquivo_pdf, "createdAt"
    FROM documentos_medicos
    WHERE consulta_id = ${consultaId}
    ORDER BY "createdAt" DESC
  `
}

export { TIPOS_VALIDOS }
