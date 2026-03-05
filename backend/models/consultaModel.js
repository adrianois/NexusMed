const supabase = require('../config/db')

// Buscar todas as consultas
exports.getAll = async () => {
  const { data, error } = await supabase
    .from('consultas')
    .select('*')

  if (error) throw error
  return data
}

// Criar nova consulta
exports.create = async (consulta) => {
  const { data, error } = await supabase
    .from('consultas')
    .insert([consulta])
    .select()

  if (error) throw error
  return data[0]
}

// Atualizar consulta existente
exports.update = async (id, consulta) => {
  const { data, error } = await supabase
    .from('consultas')
    .update(consulta)
    .eq('id', id)
    .select()

  if (error) throw error
  return data[0]
}

// Remover consulta
exports.remove = async (id) => {
  const { error } = await supabase
    .from('consultas')
    .delete()
    .eq('id', id)

  if (error) throw error
}
