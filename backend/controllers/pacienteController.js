const supabase = require('../config/db')

// Listar todos os pacientes
exports.listarPacientes = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('pacientes')
      .select('*')

    if (error) throw error
    res.json({ pacientes: data })
  } catch (err) {
    console.error('Erro ao listar pacientes:', err.message)
    res.status(500).json({ error: 'Erro ao listar pacientes' })
  }
}

// Criar novo paciente
exports.criarPaciente = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('pacientes')
      .insert([req.body])
      .select()

    if (error) throw error
    res.json({ paciente: data[0] })
  } catch (err) {
    console.error('Erro ao criar paciente:', err.message)
    res.status(500).json({ error: 'Erro ao criar paciente' })
  }
}

// Atualizar paciente existente
exports.atualizarPaciente = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('pacientes')
      .update(req.body)
      .eq('id', req.params.id)
      .select()

    if (error) throw error
    res.json({ paciente: data[0] })
  } catch (err) {
    console.error('Erro ao atualizar paciente:', err.message)
    res.status(500).json({ error: 'Erro ao atualizar paciente' })
  }
}

// Excluir paciente
exports.excluirPaciente = async (req, res) => {
  try {
    const { error } = await supabase
      .from('pacientes')
      .delete()
      .eq('id', req.params.id)

    if (error) throw error
    res.json({ message: 'Paciente excluído com sucesso' })
  } catch (err) {
    console.error('Erro ao excluir paciente:', err.message)
    res.status(500).json({ error: 'Erro ao excluir paciente' })
  }
}
