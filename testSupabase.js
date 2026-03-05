import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_PUBLISHABLE_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function testarConexao() {
  const { data, error } = await supabase.from('pacientes').select('*').limit(1)

  if (error) {
    console.error('Erro na conexão:', error)
  } else {
    console.log('Conexão bem-sucedida! Dados:', data)
  }
}

testarConexao()
