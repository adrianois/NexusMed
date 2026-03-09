import { createClient } from '@supabase/supabase-js'

const url = process.env.SUPABASE_URL
const key = process.env.SUPABASE_KEY

if (!url || !key) {
  console.error('\u274c SUPABASE_URL e SUPABASE_KEY não encontrados no .env')
  process.exit(1)
}

export const supabase = createClient(url, key)
