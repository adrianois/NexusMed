# 🏥 NexusMed

Sistema web para gestão de clínicas médicas, integrando **CRM** (relacionamento com pacientes), **ERP** (gestão administrativa) e **Prontuário Eletrônico**.

![Stack](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)
![Stack](https://img.shields.io/badge/Node.js-Express-339933?logo=nodedotjs&logoColor=white)
![Stack](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?logo=supabase&logoColor=white)
![License](https://img.shields.io/badge/license-MIT-blue)

---

## 📋 Índice

- [Sobre o Projeto](#sobre-o-projeto)
- [Tecnologias](#tecnologias)
- [Arquitetura](#arquitetura)
- [Funcionalidades](#funcionalidades)
- [Pré-requisitos](#pré-requisitos)
- [Instalação](#instalação)
- [Configuração do Banco de Dados](#configuração-do-banco-de-dados)
- [Variáveis de Ambiente](#variáveis-de-ambiente)
- [Como Rodar](#como-rodar)
- [Rotas da API](#rotas-da-api)
- [Estrutura de Pastas](#estrutura-de-pastas)
- [GitHub Codespaces](#github-codespaces)

---

## Sobre o Projeto

O **NexusMed** é uma aplicação fullstack responsiva voltada para clínicas médicas, permitindo o gerenciamento de pacientes, consultas, prontuários e unidades clínicas. O sistema conta com autenticação segura via JWT e interface adaptada para desktop e mobile.

---

## Tecnologias

### Frontend
| Tecnologia | Versão | Uso |
|---|---|---|
| React | 19 | Interface do usuário |
| Vite | 7 | Build e dev server |
| React Router DOM | 7 | Roteamento SPA |
| Axios | 1.x | Requisições HTTP |
| CSS puro | — | Estilização responsiva |

### Backend
| Tecnologia | Versão | Uso |
|---|---|---|
| Node.js | ≥ 20 | Runtime JavaScript |
| Express | 4/5 | Framework HTTP |
| Supabase JS | 2.x | Cliente do banco |
| bcryptjs | 3.x | Hash de senhas |
| jsonwebtoken | 9.x | Autenticação JWT |
| dotenv | 16.x | Variáveis de ambiente |

### Banco de Dados
| Tecnologia | Uso |
|---|---|
| Supabase (PostgreSQL) | Banco de dados principal |
| Row Level Security (RLS) | Controle de acesso por tabela |

---

## Arquitetura

```
Cliente (Browser)
      │
      ▼
┌─────────────────┐        ┌──────────────────────┐
│   Frontend      │  HTTP  │      Backend         │
│  React + Vite   │◄──────►│  Node.js + Express   │
│   porta 5173    │  JWT   │     porta 4000        │
└─────────────────┘        └──────────┬───────────┘
                                       │ Supabase JS
                                       ▼
                           ┌──────────────────────┐
                           │   Supabase Cloud      │
                           │  PostgreSQL + RLS      │
                           └──────────────────────┘
```

---

## Funcionalidades

- **Autenticação**
  - Registro de usuário com validação de e-mail duplicado
  - Login com geração de token JWT (válido por 8h)
  - Rotas protegidas via `PrivateRoute`
  - Persistência de sessão via `localStorage`

- **Dashboard**
  - Visão geral com cards de acesso rápido aos módulos
  - Layout responsivo: sidebar no desktop, bottom nav no mobile

- **Pacientes** — listagem com nome, CPF, data de nascimento, telefone e e-mail

- **Consultas** — listagem com paciente, data, motivo e observações

- **Prontuários** — listagem com paciente, descrição e data de registro

- **Clínicas** — listagem com nome, endereço e telefone

---

## Pré-requisitos

- [Node.js](https://nodejs.org/) versão **20 ou superior**
- [npm](https://www.npmjs.com/) versão 9+
- Conta no [Supabase](https://supabase.com/) (gratuita)
- Git

---

## Instalação

### 1. Clone o repositório

```bash
git clone https://github.com/adrianois/NexusMed.git
cd NexusMed
```

### 2. Instale as dependências do backend

```bash
cd backend
npm install
```

### 3. Instale as dependências do frontend

```bash
cd ../frontend
npm install
```

---

## Configuração do Banco de Dados

Acesse o **SQL Editor** do seu projeto no [Supabase](https://supabase.com) e execute o seguinte script:

```sql
-- Tabela de usuários
CREATE TABLE IF NOT EXISTS public.usuarios (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  nome        text NOT NULL,
  email       text UNIQUE NOT NULL,
  senha_hash  text NOT NULL,
  created_at  timestamptz DEFAULT now()
);

-- Tabela de pacientes
CREATE TABLE IF NOT EXISTS public.pacientes (
  id               uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  nome             text NOT NULL,
  cpf              text,
  data_nascimento  date,
  telefone         text,
  email            text,
  endereco         text,
  created_at       timestamptz DEFAULT now()
);

-- Tabela de consultas
CREATE TABLE IF NOT EXISTS public.consultas (
  id             uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  paciente_id    uuid REFERENCES public.pacientes(id),
  data_consulta  date,
  motivo         text,
  observacoes    text,
  created_at     timestamptz DEFAULT now()
);

-- Tabela de prontuários
CREATE TABLE IF NOT EXISTS public.prontuarios (
  id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  paciente_id     uuid REFERENCES public.pacientes(id),
  descricao       text,
  data_registro   date,
  created_at      timestamptz DEFAULT now()
);

-- Tabela de clínicas
CREATE TABLE IF NOT EXISTS public.clinicas (
  id         uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  nome       text NOT NULL,
  endereco   text,
  telefone   text,
  created_at timestamptz DEFAULT now()
);

-- Habilitar RLS e criar políticas de acesso
ALTER TABLE public.usuarios  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pacientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consultas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prontuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clinicas  ENABLE ROW LEVEL SECURITY;

CREATE POLICY "allow_public_insert" ON public.usuarios FOR INSERT WITH CHECK (true);
CREATE POLICY "allow_public_select" ON public.usuarios FOR SELECT USING (true);

CREATE POLICY "allow_all_pacientes"    ON public.pacientes    FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_consultas"    ON public.consultas    FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_prontuarios"  ON public.prontuarios  FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_clinicas"     ON public.clinicas     FOR ALL USING (true) WITH CHECK (true);
```

---

## Variáveis de Ambiente

### Backend — `backend/.env`

```env
PORT=4000
SUPABASE_URL=https://SEU_PROJETO.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...  # anon/public key
JWT_SECRET=nexusmed_jwt_secreto_troque_em_producao
```

> **Como obter as chaves do Supabase:**
> Acesse seu projeto → Settings → API → copie a **URL** e a **anon public key**

### Frontend — `frontend/.env`

```env
VITE_API_URL=http://localhost:4000
```

> No GitHub Codespaces, substitua pelo endereço público da porta 4000 (veja seção [GitHub Codespaces](#github-codespaces)).

---

## Como Rodar

### Terminal 1 — Backend

```bash
cd backend
npm run dev
```

Saída esperada:
```
🚀 Servidor rodando na porta 4000
```

### Terminal 2 — Frontend

```bash
cd frontend
npm run dev
```

Saída esperada:
```
  VITE v7.x.x  ready in XXX ms
  ➜  Local:   http://localhost:5173/
```

Acesse **http://localhost:5173** no navegador.

---

## Rotas da API

### Autenticação

| Método | Rota | Descrição | Auth |
|---|---|---|---|
| `POST` | `/auth/register` | Registrar novo usuário | ❌ |
| `POST` | `/auth/login` | Login e geração de JWT | ❌ |

**Registro** — body:
```json
{ "nome": "João", "email": "joao@email.com", "senha": "123456" }
```

**Login** — body:
```json
{ "email": "joao@email.com", "senha": "123456" }
```
Retorno: `{ "token": "eyJ..." }`

---

### Módulos (requerem `Authorization: Bearer <token>`)

| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/pacientes` | Listar pacientes |
| `POST` | `/pacientes` | Criar paciente |
| `GET` | `/consultas` | Listar consultas |
| `POST` | `/consultas` | Criar consulta |
| `GET` | `/prontuarios` | Listar prontuários |
| `POST` | `/prontuarios` | Criar prontuário |
| `GET` | `/clinicas` | Listar clínicas |
| `POST` | `/clinicas` | Criar clínica |
| `GET` | `/health` | Status da API + Supabase |

---

## Estrutura de Pastas

```
NexusMed/
├── backend/
│   ├── index.js            # Servidor principal (Express + rotas)
│   ├── .env                # Variáveis de ambiente (não versionar)
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Login.jsx / Login.css
│   │   │   ├── Register.jsx / Register.css
│   │   │   ├── Dashboard.jsx / Dashboard.css
│   │   │   ├── Pacientes.jsx
│   │   │   ├── Consultas.jsx
│   │   │   ├── Prontuarios.jsx
│   │   │   ├── Clinicas.jsx
│   │   │   └── InnerPage.css
│   │   ├── components/
│   │   │   ├── PageLayout.jsx  # Layout compartilhado (sidebar + bottom nav)
│   │   │   └── PrivateRoute.jsx
│   │   ├── context/
│   │   │   └── AuthContext.jsx # Autenticação global
│   │   ├── api.js              # Axios configurado com interceptors
│   │   ├── App.jsx             # Roteamento principal
│   │   ├── main.jsx
│   │   └── index.css           # Reset global
│   ├── .env
│   └── package.json
│
└── README.md
```

---

## GitHub Codespaces

Ao rodar no Codespaces, `localhost` não é acessível pelo navegador. Siga os passos:

**1. Verifique o nome do seu Codespace** (aparece na URL):
```
https://SEU-CODESPACE-4000.app.github.dev
```

**2. Configure o frontend** em `frontend/.env`:
```env
VITE_API_URL=https://SEU-CODESPACE-4000.app.github.dev
```

**3. Torne a porta 4000 pública:**
- Abra a aba **PORTS** no VS Code
- Clique com o botão direito na porta `4000`
- Selecione **Port Visibility → Public**

**4. Reinicie o frontend** após alterar o `.env`:
```bash
cd frontend && npm run dev
```

---

## Licença

Este projeto está licenciado sob a [MIT License](LICENSE).

---

<p align="center">Desenvolvido por <strong>Adriano</strong> · NexusMed © 2025</p>
