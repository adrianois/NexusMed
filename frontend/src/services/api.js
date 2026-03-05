// api.js - centraliza chamadas ao backend

// Função genérica para GET
export async function fetchData(endpoint) {
  try {
    const response = await fetch(endpoint)
    if (!response.ok) throw new Error(`Erro ao carregar ${endpoint}`)
    // garante que sempre retorna objeto, mesmo se vazio
    return await response.json().catch(() => ({}))
  } catch (err) {
    console.error(err)
    return {}
  }
}

// Função genérica para POST
export async function postData(endpoint, body) {
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })
    if (!response.ok) throw new Error(`Erro ao enviar para ${endpoint}`)
    // garante que sempre retorna objeto, mesmo se vazio
    return await response.json().catch(() => ({}))
  } catch (err) {
    console.error(err)
    return {}
  }
}

// ---------------------- PACIENTES ----------------------
export async function getPacientes() {
  return await fetchData('/pacientes')
}

export async function addPaciente(paciente) {
  return await postData('/pacientes', paciente)
}

// ---------------------- CONSULTAS ----------------------
export async function getConsultas() {
  return await fetchData('/consultas')
}

export async function addConsulta(consulta) {
  return await postData('/consultas', consulta)
}

// ---------------------- PRONTUÁRIOS ----------------------
export async function getProntuarios() {
  return await fetchData('/prontuarios')
}

export async function addProntuario(prontuario) {
  return await postData('/prontuarios', prontuario)
}

// ---------------------- CLÍNICAS ----------------------
export async function getClinicas() {
  return await fetchData('/clinicas')
}

export async function addClinica(clinica) {
  return await postData('/clinicas', clinica)
}
