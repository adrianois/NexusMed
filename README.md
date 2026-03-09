# 🏥 NexusMed

Sistema web completo de gestão de clínicas médicas com controle de pacientes, médicos, consultas, agenda semanal e prontuários.

![Node.js](https://img.shields.io/badge/Node.js-18+-339933?logo=node.js&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?logo=supabase&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-5-646CFF?logo=vite&logoColor=white)

---

## 🛠️ Stack Tecnológica

| Camada | Tecnologia |
|--------|-----------|
| Frontend | React 18 + Vite + CSS puro |
| Backend | Node.js + Express 4 |
| Banco de Dados | Supabase (PostgreSQL) |
| Autenticação | JWT (jsonwebtoken) + bcryptjs |
| HTTP Client | Axios |
| Dev Server | Nodemon |

---

## 📁 Estrutura do Projeto

```
NexusMed/
├── backend/                    # API REST (Node.js + Express)
│   ├── index.js                # Entrada — registra rotas e inicia servidor
│   ├── lib/
│   │   ├── supabase.js         # Cliente Supabase (instância única)
│   │   ├── auth.js             # Middlewares JWT + gerarToken()
│   │   └── utils.js            # normalizarData() e utilitários gerais
│   ├── routes/
│   │   ├── auth.js             # POST /auth/register  /auth/login
│   │   ├── admin.js            # /admin/clinicas  /admin/usuarios
│   │   ├── gestor.js           # /gestor/minha-clinica  /gestor/usuarios
│   │   ├── medicos.js          # CRUD /medicos
│   │   ├── pacientes.js        # CRUD /pacientes
│   │   ├── consultas.js        # CRUD /consultas
│   │   ├── prontuarios.js      # CRUD /prontuarios
│   │   └── clinicas.js         # GET /clinicas  GET /clinicas/publicas
│   ├── .env.example
│   └── package.json
└── frontend/                   # SPA (React + Vite)
    ├── src/
    │   ├── components/         # Componentes reutilizáveis (PageLayout, Sidebar...)
    │   ├── context/            # AuthContext (login/logout/token)
    │   ├── hooks/              # Custom hooks
    │   ├── pages/              # Páginas da aplicação
    │   │   ├── Dashboard.jsx   # Agenda do dia com seletor de data
    │   │   ├── Pacientes.jsx   # Cadastro + editar + excluir
    │   │   ├── Medicos.jsx     # Cadastro + agenda semanal + editar + excluir
    │   │   ├── Consultas.jsx   # Agendamento com horários disponíveis
    │   │   ├── Prontuarios.jsx # Prontuários por paciente
    │   │   ├── Login.jsx
    │   │   ├── Register.jsx
    │   │   └── Admin/          # Painel admin (clínicas, usuários)
    │   ├── api.js              # Axios com baseURL e interceptor de token
    │   └── main.jsx            # Entrada do frontend
    ├── index.html
    └── package.json
```

---

## 🚀 Instalação e Execução

### Pré-requisitos
- Node.js 18+
- Conta gratuita no [Supabase](https://supabase.com)

### 1. Clone o repositório

```bash
git clone https://github.com/adrianois/NexusMed.git
cd NexusMed
```

### 2. Backend

```bash
cd backend
cp .env.example .env
# Edite o .env com suas credenciais
npm install
npm run dev
# API disponível em http://localhost:4000
```

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
# App disponível em http://localhost:5173
```

---

## ⚙️ Variáveis de Ambiente

### `backend/.env`

```env
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_KEY=sua-anon-ou-service-role-key
JWT_SECRET=string-longa-e-aleatoria
PORT=4000
```

---

## 🗄️ Banco de Dados (Supabase)

Execute os SQLs abaixo no **SQL Editor** do Supabase para criar/ajustar as tabelas:

```sql
-- Clínicas
CREATE TABLE IF NOT EXISTS clinicas (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome       TEXT NOT NULL,
  cnpj       VARCHAR(20),
  telefone   VARCHAR(20),
  email      TEXT,
  cep        VARCHAR(10),
  logradouro VARCHAR(200),
  numero     VARCHAR(20),
  complemento VARCHAR(100),
  bairro     VARCHAR(100),
  cidade     VARCHAR(100),
  estado     VARCHAR(2),
  ativo      BOOLEAN DEFAULT true,
  criado_em  TIMESTAMPTZ DEFAULT now()
);

-- Usuários
CREATE TABLE IF NOT EXISTS usuarios (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome       TEXT NOT NULL,
  email      TEXT UNIQUE NOT NULL,
  senha_hash TEXT NOT NULL,
  perfil     TEXT DEFAULT 'normal',   -- admin | gestor | normal
  status     TEXT DEFAULT 'pendente', -- ativo | pendente | inativo
  clinica_id UUID REFERENCES clinicas(id),
  criado_em  TIMESTAMPTZ DEFAULT now()
);

-- Médicos
CREATE TABLE IF NOT EXISTS medicos (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome         TEXT NOT NULL,
  crm          VARCHAR(30) NOT NULL,
  especialidade TEXT,
  telefone     VARCHAR(20),
  email        TEXT,
  ativo        BOOLEAN DEFAULT true,
  agenda       JSONB DEFAULT '{}',    -- { "seg": ["08:00","09:00"], ... }
  clinica_id   UUID REFERENCES clinicas(id),
  criado_em    TIMESTAMPTZ DEFAULT now()
);

-- Pacientes
CREATE TABLE IF NOT EXISTS pacientes (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome             TEXT NOT NULL,
  cpf              VARCHAR(20) NOT NULL,
  data_nascimento  DATE,
  telefone         VARCHAR(20),
  email            TEXT,
  cep              VARCHAR(10),
  logradouro       VARCHAR(200),
  numero           VARCHAR(20),
  complemento      VARCHAR(100),
  bairro           VARCHAR(100),
  cidade           VARCHAR(100),
  estado           VARCHAR(2),
  clinica_id       UUID REFERENCES clinicas(id),
  criado_em        TIMESTAMPTZ DEFAULT now()
);

-- Consultas
CREATE TABLE IF NOT EXISTS consultas (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  paciente_id    UUID NOT NULL REFERENCES pacientes(id),
  medico_id      UUID REFERENCES medicos(id),
  data_consulta  DATE NOT NULL,
  horario        TEXT,
  motivo         TEXT NOT NULL,
  observacoes    TEXT,
  clinica_id     UUID REFERENCES clinicas(id),
  criado_em      TIMESTAMPTZ DEFAULT now()
);

-- Prontuários
CREATE TABLE IF NOT EXISTS prontuarios (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  paciente_id    UUID NOT NULL REFERENCES pacientes(id),
  consulta_id    UUID REFERENCES consultas(id),
  descricao      TEXT NOT NULL,
  data_registro  DATE,
  clinica_id     UUID REFERENCES clinicas(id),
  criado_em      TIMESTAMPTZ DEFAULT now()
);
```

> Se as tabelas já existem, ajuste os campos com:
> ```sql
> ALTER TABLE clinicas ALTER COLUMN cnpj TYPE VARCHAR(20);
> ALTER TABLE medicos  ADD COLUMN IF NOT EXISTS agenda JSONB DEFAULT '{}';
> ALTER TABLE consultas ADD COLUMN IF NOT EXISTS medico_id UUID REFERENCES medicos(id);
> ALTER TABLE consultas ADD COLUMN IF NOT EXISTS horario TEXT;
> ```

---

## 🔐 Perfis de Acesso

| Perfil | Descrição |
|--------|-----------|
| `admin` | Acesso total — gerencia clínicas e todos os usuários |
| `gestor` | Gerencia sua clínica e aprova usuários pendentes |
| `normal` | Acesso operacional — consultas, pacientes, prontuários |

> O **primeiro usuário** cadastrado automaticamente recebe perfil `admin` e status `ativo`.

---

## 📱 Funcionalidades

### 🏠 Dashboard
- Agenda do dia por médico com grade de horários
- Seletor de data (◄ dia anterior · input · dia seguinte ► · botão Hoje)
- Exibe consultas mesmo sem agenda configurada no médico
- Destaca horários ocupados com nome do paciente

### 👥 Pacientes
- Cadastro completo com busca automática de CEP (ViaCEP)
- Editar dados
- Excluir com proteção: bloqueia se tiver consultas ou prontuários vinculados

### 👨‍⚕️ Médicos
- Cadastro com especialidade e contato
- **Agenda semanal**: selecione horários disponíveis para cada dia da semana
- Copiar horários de um dia para todos os dias úteis
- Ativar / Desativar médico
- Excluir com proteção de vínculos

### 📅 Consultas
- Ao selecionar médico + data, exibe **apenas os horários disponíveis** na agenda
- Bloqueia automaticamente horários já ocupados por outras consultas
- Editar agendamentos
- Excluir com proteção se houver prontuário vinculado

### 📋 Prontuários
- Registro de prontuários por paciente
- Vinculação opcional com consulta

### ⚙️ Admin
- Gerenciar clínicas (cadastrar, ativar/desativar)
- Gerenciar usuários (alterar perfil, status e clínica)

---

## 📡 Endpoints da API

| Método | Rota | Acesso | Descrição |
|--------|------|--------|-----------|
| POST | `/auth/register` | Público | Registrar usuário |
| POST | `/auth/login` | Público | Login |
| GET | `/clinicas/publicas` | Público | Listar clínicas ativas |
| GET/POST | `/medicos` | Autenticado | Listar/criar médicos |
| PATCH/DELETE | `/medicos/:id` | Autenticado | Editar/excluir médico |
| GET/POST | `/pacientes` | Autenticado | Listar/criar pacientes |
| PUT/DELETE | `/pacientes/:id` | Autenticado | Editar/excluir paciente |
| GET/POST | `/consultas` | Autenticado | Listar/criar consultas |
| PUT/DELETE | `/consultas/:id` | Autenticado | Editar/excluir consulta |
| GET/POST | `/prontuarios` | Autenticado | Prontuários |
| GET/POST/PATCH | `/admin/*` | Admin | Gestão de clínicas e usuários |
| GET/PATCH | `/gestor/*` | Gestor+ | Aprovação de usuários |
