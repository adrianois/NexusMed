const supabase = require('../config/db')

// Buscar todos os pacientes
exports.getAll = async () => {
  const { data, error } = await supabase
    .from('pacientes')
    .select('*')

  if (error) throw error
  return data
}

// Criar novo paciente
exports.create = async (paciente) => {
  const { data, error } = await supabase
    .from('pacientes')
    .insert([paciente])
    .select()

  if (error) throw error
  return data[0]
}

// Atualizar paciente existente
exports.update = async (id, paciente) => {
  const { data, error } = await supabase
    .from('pacientes')
    .update(paciente)
    .eq('id', id)
    .select()

  if (error) throw error
  return data[0]
}

// Remover paciente
exports.remove = async (id) => {
  const { error } = await supabase
    .from('pacientes')
    .delete()
    .eq('id', id)

  if (error) throw error
}
