const supabase = require('../config/db')

// Buscar todas as clínicas
exports.getAll = async () => {
  const { data, error } = await supabase
    .from('clinicas')
    .select('*')

  if (error) throw error
  return data
}

// Criar nova clínica
exports.create = async (clinica) => {
  const { data, error } = await supabase
    .from('clinicas')
    .insert([clinica])
    .select()

  if (error) throw error
  return data[0]
}

// Atualizar clínica existente
exports.update = async (id, clinica) => {
  const { data, error } = await supabase
    .from('clinicas')
    .update(clinica)
    .eq('id', id)
    .select()

  if (error) throw error
  return data[0]
}

// Remover clínica
exports.remove = async (id) => {
  const { error } = await supabase
    .from('clinicas')
    .delete()
    .eq('id', id)

  if (error) throw error
}
