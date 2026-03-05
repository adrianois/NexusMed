const supabase = require('../config/db')

// Buscar todos os prontuários
exports.getAll = async () => {
  const { data, error } = await supabase
    .from('prontuarios')
    .select('*')

  if (error) throw error
  return data
}

// Criar novo prontuário
exports.create = async (prontuario) => {
  const { data, error } = await supabase
    .from('prontuarios')
    .insert([prontuario])
    .select()

  if (error) throw error
  return data[0]
}

// Atualizar prontuário existente
exports.update = async (id, prontuario) => {
  const { data, error } = await supabase
    .from('prontuarios')
    .update(prontuario)
    .eq('id', id)
    .select()

  if (error) throw error
  return data[0]
}

// Remover prontuário
exports.remove = async (id) => {
  const { error } = await supabase
    .from('prontuarios')
    .delete()
    .eq('id', id)

  if (error) throw error
}
