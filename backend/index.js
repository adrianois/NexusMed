import dotenv from 'dotenv'
dotenv.config({ path: './.env' })
import express from 'express'
import cors from 'cors'
import bodyParser from 'body-parser'
import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

const app  = express()
const port = process.env.PORT || 4000
app.use(cors({ origin:'*', methods:['GET','POST','PUT','DELETE','PATCH','OPTIONS'], allowedHeaders:['Content-Type','Authorization'] }))
app.use(bodyParser.json())

const supabase  = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY)
const jwtSecret = process.env.JWT_SECRET || 'segredo_super_seguro'

function autenticar(req,res,next){
  const token = req.headers['authorization']?.split(' ')[1]
  if (!token) return res.sendStatus(401)
  jwt.verify(token, jwtSecret, (err,payload)=>{ if(err) return res.sendStatus(403); req.usuario=payload; next() })
}
function apenasAdmin(req,res,next){ if(req.usuario?.perfil!=='admin') return res.status(403).json({error:'Acesso restrito.'}); next() }
function apenasGestor(req,res,next){ if(!['admin','gestor'].includes(req.usuario?.perfil)) return res.status(403).json({error:'Acesso restrito.'}); next() }

app.get('/', (req,res)=>res.send('🚀 API NexusMed rodando!'))
app.get('/health', async (req,res)=>{
  try{ const {error}=await supabase.from('pacientes').select('id').limit(1); if(error) return res.status(500).json({status:'error'}); res.json({status:'ok'}) }catch{ res.status(500).json({status:'error'}) }
})

// Clínicas públicas
app.get('/clinicas/publicas', async (req,res)=>{
  try{ const {data,error}=await supabase.from('clinicas').select('id,nome').eq('ativo',true).order('nome'); if(error) return res.status(500).json({error:error.message}); res.json(data||[]) }catch{ res.status(500).json({error:'Erro interno.'}) }
})

// AUTH
app.post('/auth/register', async (req,res)=>{
  const {nome,email,senha,perfil:pSol,clinica_id}=req.body
  if (!nome||!email||!senha) return res.status(400).json({error:'Campos obrigatórios ausentes.'})
  try{
    const {data:ex}=await supabase.from('usuarios').select('id').eq('email',email).limit(1)
    if (ex?.length>0) return res.status(409).json({error:'E-mail já cadastrado.'})
    const senha_hash=await bcrypt.hash(senha,10)
    const {data:todos}=await supabase.from('usuarios').select('id').limit(1)
    let perfil,status
    if (!todos||todos.length===0){perfil='admin';status='ativo'}
    else{perfil=['normal','gestor'].includes(pSol)?pSol:'normal';status='pendente'}
    const ins={nome,email,senha_hash,perfil,status}
    if (clinica_id) ins.clinica_id=clinica_id
    const {data,error}=await supabase.from('usuarios').insert([ins]).select()
    if (error) return res.status(400).json({error:error.message})
    res.status(201).json({message:'Usuário criado!',usuario:data[0]})
  }catch{res.status(500).json({error:'Erro interno.'})}
})
app.post('/auth/login', async (req,res)=>{
  const {email,senha}=req.body
  try{
    const {data:u}=await supabase.from('usuarios').select('*').eq('email',email).limit(1)
    if (!u?.length) return res.status(401).json({error:'Usuário não encontrado.'})
    const usr=u[0]
    if (usr.status==='pendente') return res.status(403).json({error:'Conta aguardando aprovação.'})
    if (usr.status==='inativo')  return res.status(403).json({error:'Conta desativada.'})
    if (!await bcrypt.compare(senha,usr.senha_hash)) return res.status(401).json({error:'Senha inválida.'})
    const token=jwt.sign({usuario_id:usr.id,nome:usr.nome,email:usr.email,perfil:usr.perfil,clinica_id:usr.clinica_id,status:usr.status},jwtSecret,{expiresIn:'8h'})
    res.json({token,perfil:usr.perfil,nome:usr.nome,clinica_id:usr.clinica_id})
  }catch{res.status(500).json({error:'Erro interno.'})}
})

// ADMIN - Clínicas
app.get('/admin/clinicas', autenticar,apenasAdmin, async (req,res)=>{
  const {data,error}=await supabase.from('clinicas').select('*').order('nome')
  if(error) return res.status(500).json({error:error.message}); res.json(data)
})
app.post('/admin/clinicas', autenticar,apenasAdmin, async (req,res)=>{
  const {nome,cnpj,endereco,telefone,email,cep,logradouro,numero,complemento,bairro,cidade,estado}=req.body
  if(!nome||!cnpj) return res.status(400).json({error:'Nome e CNPJ obrigatórios.'})
  const {data,error}=await supabase.from('clinicas').insert([{nome,cnpj,endereco,telefone,email,cep,logradouro,numero,complemento,bairro,cidade,estado,ativo:true}]).select()
  if(error) return res.status(400).json({error:error.message}); res.status(201).json(data[0])
})
app.patch('/admin/clinicas/:id/status', autenticar,apenasAdmin, async (req,res)=>{
  const {data,error}=await supabase.from('clinicas').update({ativo:req.body.ativo}).eq('id',req.params.id).select()
  if(error) return res.status(400).json({error:error.message}); res.json(data[0])
})

// ADMIN - Usuários
app.get('/admin/usuarios', autenticar,apenasAdmin, async (req,res)=>{
  const {data,error}=await supabase.from('usuarios').select('id,nome,email,perfil,status,clinica_id').order('nome')
  if(error) return res.status(500).json({error:error.message}); res.json(data)
})
app.patch('/admin/usuarios/:id', autenticar,apenasAdmin, async (req,res)=>{
  const body=req.body; const u={}
  if('perfil'     in body) u.perfil    =body.perfil
  if('status'     in body) u.status    =body.status
  if('clinica_id' in body) u.clinica_id=body.clinica_id||null
  if(!Object.keys(u).length) return res.status(400).json({error:'Nada para atualizar.'})
  const {data,error}=await supabase.from('usuarios').update(u).eq('id',req.params.id).select()
  if(error) return res.status(400).json({error:error.message})
  if(!data?.length) return res.status(404).json({error:'Usuário não encontrado.'})
  res.json(data[0])
})

// GESTOR
app.get('/gestor/minha-clinica', autenticar,apenasGestor, async (req,res)=>{
  if(!req.usuario.clinica_id) return res.json(null)
  const {data,error}=await supabase.from('clinicas').select('id,nome,endereco,telefone').eq('id',req.usuario.clinica_id).limit(1)
  if(error) return res.status(500).json({error:error.message}); res.json(data?.[0]||null)
})
app.get('/gestor/usuarios/pendentes', autenticar,apenasGestor, async (req,res)=>{
  if(!req.usuario.clinica_id) return res.status(400).json({error:'Gestor sem clínica.'})
  const {data,error}=await supabase.from('usuarios').select('id,nome,email,perfil,status').eq('clinica_id',req.usuario.clinica_id).eq('status','pendente')
  if(error) return res.status(500).json({error:error.message}); res.json(data)
})
app.patch('/gestor/usuarios/:id/aprovar', autenticar,apenasGestor, async (req,res)=>{
  const {data,error}=await supabase.from('usuarios').update({status:req.body.aprovado?'ativo':'inativo'}).eq('id',req.params.id).select()
  if(error) return res.status(400).json({error:error.message}); res.json(data[0])
})

// MÉDICOS
app.get('/medicos', autenticar, async (req,res)=>{
  let q=supabase.from('medicos').select('*').order('nome')
  if(req.usuario.perfil!=='admin'&&req.usuario.clinica_id) q=q.eq('clinica_id',req.usuario.clinica_id)
  const {data,error}=await q
  if(error) return res.status(500).json({error:error.message}); res.json(data||[])
})
app.post('/medicos', autenticar, async (req,res)=>{
  const {nome,crm,especialidade,telefone,email,agenda}=req.body
  if(!nome||!crm) return res.status(400).json({error:'Nome e CRM obrigatórios.'})
  const {data,error}=await supabase.from('medicos').insert([{nome,crm,especialidade,telefone,email,clinica_id:req.usuario.clinica_id,ativo:true,agenda:agenda||{}}]).select()
  if(error) return res.status(400).json({error:error.message}); res.status(201).json(data[0])
})
app.patch('/medicos/:id', autenticar, async (req,res)=>{
  const u={}; ['nome','crm','especialidade','telefone','email','ativo','agenda'].forEach(k=>{if(k in req.body) u[k]=req.body[k]})
  const {data,error}=await supabase.from('medicos').update(u).eq('id',req.params.id).select()
  if(error) return res.status(400).json({error:error.message}); res.json(data[0])
})
app.delete('/medicos/:id', autenticar, async (req,res)=>{
  // Verifica vínculos com consultas
  const {data:vinculos}=await supabase.from('consultas').select('id').eq('medico_id',req.params.id).limit(1)
  if(vinculos?.length>0) return res.status(400).json({error:'Não é possível excluir: este médico possui consultas vinculadas. Desative-o ou remova as consultas primeiro.'})
  const {error}=await supabase.from('medicos').delete().eq('id',req.params.id)
  if(error) return res.status(400).json({error:error.message}); res.json({message:'Médico excluído.'})
})

// PACIENTES
app.get('/pacientes', autenticar, async (req,res)=>{
  const q=supabase.from('pacientes').select('*')
  if(req.usuario.perfil!=='admin') q.eq('clinica_id',req.usuario.clinica_id)
  const {data,error}=await q
  if(error) return res.status(500).json({error:error.message}); res.json(data)
})
app.post('/pacientes', autenticar, async (req,res)=>{
  try{
    const {data,error}=await supabase.from('pacientes').insert([{...req.body,clinica_id:req.usuario.clinica_id}]).select()
    if(error) return res.status(400).json({error:error.message}); res.status(201).json(data[0])
  }catch(err){res.status(500).json({error:err.message})}
})
app.put('/pacientes/:id', autenticar, async (req,res)=>{
  const {data,error}=await supabase.from('pacientes').update(req.body).eq('id',req.params.id).select()
  if(error) return res.status(400).json({error:error.message}); res.json(data[0])
})
app.delete('/pacientes/:id', autenticar, async (req,res)=>{
  // Verifica vínculos
  const [{data:c},{data:p}]=await Promise.all([
    supabase.from('consultas').select('id').eq('paciente_id',req.params.id).limit(1),
    supabase.from('prontuarios').select('id').eq('paciente_id',req.params.id).limit(1)
  ])
  if(c?.length>0) return res.status(400).json({error:'Não é possível excluir: paciente possui consultas vinculadas.'})
  if(p?.length>0) return res.status(400).json({error:'Não é possível excluir: paciente possui prontuários vinculados.'})
  const {error}=await supabase.from('pacientes').delete().eq('id',req.params.id)
  if(error) return res.status(400).json({error:error.message}); res.json({message:'Paciente removido.'})
})

// CONSULTAS
app.get('/consultas', autenticar, async (req,res)=>{
  const q=supabase.from('consultas').select('*')
  if(req.usuario.perfil!=='admin') q.eq('clinica_id',req.usuario.clinica_id)
  const {data,error}=await q
  if(error) return res.status(500).json({error:error.message}); res.json(data)
})
app.post('/consultas', autenticar, async (req,res)=>{
  const {paciente_id,medico_id,data_consulta,horario,motivo,observacoes}=req.body
  const {data,error}=await supabase.from('consultas').insert([{paciente_id,medico_id:medico_id||null,data_consulta,horario,motivo,observacoes,clinica_id:req.usuario.clinica_id}]).select()
  if(error) return res.status(400).json({error:error.message}); res.status(201).json(data[0])
})
app.put('/consultas/:id', autenticar, async (req,res)=>{
  const {paciente_id,medico_id,data_consulta,horario,motivo,observacoes}=req.body
  const {data,error}=await supabase.from('consultas').update({paciente_id,medico_id:medico_id||null,data_consulta,horario,motivo,observacoes}).eq('id',req.params.id).select()
  if(error) return res.status(400).json({error:error.message}); res.json(data[0])
})
app.delete('/consultas/:id', autenticar, async (req,res)=>{
  // Verifica prontuários gerados pela consulta
  const {data:p}=await supabase.from('prontuarios').select('id').eq('consulta_id',req.params.id).limit(1)
  if(p?.length>0) return res.status(400).json({error:'Não é possível excluir: esta consulta possui prontuários vinculados.'})
  const {error}=await supabase.from('consultas').delete().eq('id',req.params.id)
  if(error) return res.status(400).json({error:error.message}); res.json({message:'Consulta removida.'})
})

// PRONTUÁRIOS
app.get('/prontuarios', autenticar, async (req,res)=>{
  const q=supabase.from('prontuarios').select('*')
  if(req.usuario.perfil!=='admin') q.eq('clinica_id',req.usuario.clinica_id)
  const {data,error}=await q
  if(error) return res.status(500).json({error:error.message}); res.json(data)
})
app.post('/prontuarios', autenticar, async (req,res)=>{
  const {paciente_id,descricao,data_registro}=req.body
  const {data,error}=await supabase.from('prontuarios').insert([{paciente_id,descricao,data_registro,clinica_id:req.usuario.clinica_id}]).select()
  if(error) return res.status(400).json({error:error.message}); res.status(201).json(data[0])
})

// CLÍNICAS (geral)
app.get('/clinicas', autenticar, async (req,res)=>{
  const {data,error}=await supabase.from('clinicas').select('*')
  if(error) return res.status(500).json({error:error.message}); res.json(data)
})

app.listen(port,()=>console.log(`🚀 Servidor na porta ${port}`))
