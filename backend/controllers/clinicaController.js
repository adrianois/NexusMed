const supabase = require('../config/db')

// Listar todas as clínicas
exports.listarClinicas = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('clinicas')
      .select('*')

    if (error) throw error
    res.json({ clinicas: data })
  } catch (err) {
    console.error('Erro ao listar clínicas:', err.message)
    res.status(500).json({ error: 'Erro ao listar clínicas' })
  }
}

// Criar nova clínica
exports.criarClinica = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('clinicas')
      .insert([req.body])
      .select()

    if (error) throw error
    res.json({ clinica: data[0] })
  } catch (err) {
    console.error('Erro ao criar clínica:', err.message)
    res.status(500).json({ error: 'Erro ao criar clínica' })
  }
}

// Atualizar clínica existente
exports.atualizarClinica = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('clinicas')
      .update(req.body)
      .eq('id', req.params.id)
      .select()

    if (error) throw error
    res.json({ clinica: data[0] })
  } catch (err) {
    console.error('Erro ao atualizar clínica:', err.message)
    res.status(500).json({ error: 'Erro ao atualizar clínica' })
  }
}

// Excluir clínica
exports.excluirClinica = async (req, res) => {
  try {
    const { error } = await supabase
      .from('clinicas')
      .delete()
      .eq('id', req.params.id)

    if (error) throw error
    res.json({ message: 'Clínica excluída com sucesso' })
  } catch (err) {
    console.error('Erro ao excluir clínica:', err.message)
    res.status(500).json({ error: 'Erro ao excluir clínica' })
  }
}
