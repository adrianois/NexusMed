const supabase = require('../config/db')

// Listar todos os prontuários
exports.listarProntuarios = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('prontuarios')
      .select('*')

    if (error) throw error
    res.json({ prontuarios: data })
  } catch (err) {
    console.error('Erro ao listar prontuários:', err.message)
    res.status(500).json({ error: 'Erro ao listar prontuários' })
  }
}

// Criar novo prontuário
exports.criarProntuario = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('prontuarios')
      .insert([req.body])
      .select()

    if (error) throw error
    res.json({ prontuario: data[0] })
  } catch (err) {
    console.error('Erro ao criar prontuário:', err.message)
    res.status(500).json({ error: 'Erro ao criar prontuário' })
  }
}

// Atualizar prontuário existente
exports.atualizarProntuario = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('prontuarios')
      .update(req.body)
      .eq('id', req.params.id)
      .select()

    if (error) throw error
    res.json({ prontuario: data[0] })
  } catch (err) {
    console.error('Erro ao atualizar prontuário:', err.message)
    res.status(500).json({ error: 'Erro ao atualizar prontuário' })
  }
}

// Excluir prontuário
exports.excluirProntuario = async (req, res) => {
  try {
    const { error } = await supabase
      .from('prontuarios')
      .delete()
      .eq('id', req.params.id)

    if (error) throw error
    res.json({ message: 'Prontuário excluído com sucesso' })
  } catch (err) {
    console.error('Erro ao excluir prontuário:', err.message)
    res.status(500).json({ error: 'Erro ao excluir prontuário' })
  }
}
