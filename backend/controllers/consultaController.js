const supabase = require('../config/db')

// Listar todas as consultas
exports.listarConsultas = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('consultas')
      .select('*')

    if (error) throw error
    res.json({ consultas: data })
  } catch (err) {
    console.error('Erro ao listar consultas:', err.message)
    res.status(500).json({ error: 'Erro ao listar consultas' })
  }
}

// Criar nova consulta
exports.criarConsulta = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('consultas')
      .insert([req.body])
      .select()

    if (error) throw error
    res.json({ consulta: data[0] })
  } catch (err) {
    console.error('Erro ao criar consulta:', err.message)
    res.status(500).json({ error: 'Erro ao criar consulta' })
  }
}

// Atualizar consulta existente
exports.atualizarConsulta = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('consultas')
      .update(req.body)
      .eq('id', req.params.id)
      .select()

    if (error) throw error
    res.json({ consulta: data[0] })
  } catch (err) {
    console.error('Erro ao atualizar consulta:', err.message)
    res.status(500).json({ error: 'Erro ao atualizar consulta' })
  }
}

// Excluir consulta
exports.excluirConsulta = async (req, res) => {
  try {
    const { error } = await supabase
      .from('consultas')
      .delete()
      .eq('id', req.params.id)

    if (error) throw error
    res.json({ message: 'Consulta excluída com sucesso' })
  } catch (err) {
    console.error('Erro ao excluir consulta:', err.message)
    res.status(500).json({ error: 'Erro ao excluir consulta' })
  }
}
