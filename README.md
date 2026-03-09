# 🏥 NexusMed

Sistema web de gestão de clínicas médicas com controle de pacientes, médicos, consultas, agenda e prontuários.

## 📁 Estrutura do Projeto

```
NexusMed/
├── backend/                  # API REST (Node.js + Express)
│   ├── index.js              # Entrada do servidor
│   ├── lib/
│   │   ├── supabase.js       # Cliente Supabase
│   │   ├── auth.js           # Middlewares JWT
│   │   └── utils.js          # Utilitários (normalização de data etc.)
│   ├── routes/
│   │   ├── auth.js           # /auth/register, /auth/login
│   │   ├── admin.js          # /admin/* (clínicas, usuários)
│   │   ├── gestor.js         # /gestor/* (aprovações)
│   │   ├── medicos.js        # /medicos
│   │   ├── pacientes.js      # /pacientes
│   │   ├── consultas.js      # /consultas
│   │   ├── prontuarios.js    # /prontuarios
│   │   └── clinicas.js       # /clinicas
│   ├── .env.example
│   └── package.json
└── frontend/                 # SPA (React + Vite)
    ├── src/
    │   ├── components/       # Componentes reutilizáveis
    │   ├── context/          # AuthContext
    │   ├── hooks/            # Custom hooks
    │   ├── pages/            # Páginas da aplicação
    │   ├── api.js            # Axios configurado
    │   └── main.jsx          # Entrada do frontend
    ├── index.html
    └── package.json
```

## 🚀 Instalacao e Execucao

### Pré-requisitos
- Node.js 18+
- Conta no [Supabase](https://supabase.com)

### Backend

```bash
cd backend
cp .env.example .env
# Preencha SUPABASE_URL, SUPABASE_KEY e JWT_SECRET no .env
npm install
npm run dev
```

### Frontend

```bash
cd frontend
cp .env.example .env
# Configure VITE_API_URL=http://localhost:4000
npm install
npm run dev
```

## 🗄️ Banco de Dados (Supabase)

Tabelas necessárias: `clinicas`, `usuarios`, `medicos`, `pacientes`, `consultas`, `prontuarios`

```sql
-- Adicionar campo agenda nos médicos (se ainda não existir)
ALTER TABLE medicos ADD COLUMN IF NOT EXISTS agenda JSONB DEFAULT '{}';

-- Adicionar campo medico_id nas consultas (se ainda não existir)
ALTER TABLE consultas ADD COLUMN IF NOT EXISTS medico_id UUID REFERENCES medicos(id);
ALTER TABLE consultas ADD COLUMN IF NOT EXISTS horario TEXT;
```

## 🔐 Perfis de Acesso

| Perfil | Descrição |
|--------|------------|
| `admin` | Acesso total ao sistema |
| `gestor` | Gerencia sua clínica e aprova usuários |
| `normal` | Acesso operacional (consultas, pacientes) |

## 📱 Funcionalidades

- ✅ Cadastro e gestão de **Pacientes**
- ✅ Cadastro de **Médicos** com agenda semanal de horários
- ✅ Agendamento de **Consultas** com horários disponíveis
- ✅ **Dashboard** com agenda do dia por médico e seletor de data
- ✅ **Prontuários** por paciente
- ✅ Gestão de usuários e clínicas (admin)
- ✅ Editar e excluir com proteção de vínculo
