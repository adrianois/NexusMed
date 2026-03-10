import { supabase } from './supabase.js'

/**
 * Registra uma acao no log de auditoria.
 * @param {object} opts
 * @param {object} opts.usuario   - req.usuario (jwt payload)
 * @param {string} opts.acao      - 'criar' | 'editar' | 'excluir' | 'login' | 'status'
 * @param {string} opts.tabela    - nome da entidade afetada
 * @param {string} [opts.registro_id] - id do registro afetado
 * @param {object} [opts.detalhes]    - dados extras (payload, status anterior/novo etc)
 */
export async function registrarLog({ usuario, acao, tabela, registro_id = null, detalhes = null }) {
  try {
    await supabase.from('logs').insert([{
      usuario_id:   usuario?.usuario_id || null,
      usuario_nome: usuario?.nome       || 'Sistema',
      usuario_perfil: usuario?.perfil   || null,
      clinica_id:   usuario?.clinica_id || null,
      acao,
      tabela,
      registro_id:  registro_id ? String(registro_id) : null,
      detalhes:     detalhes ? JSON.stringify(detalhes) : null,
      criado_em:    new Date().toISOString()
    }])
  } catch (e) {
    // Log nunca deve derrubar a requisicao principal
    console.error('[LOG ERROR]', e.message)
  }
}
