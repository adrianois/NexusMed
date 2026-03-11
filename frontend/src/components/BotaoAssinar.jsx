/**
 * BotaoAssinar — Inicia o fluxo de assinatura digital GOV.BR para um documento médico.
 */
import { useState, useEffect, useCallback } from 'react'
import api from '../api.js'

const ROTULOS = {
  atestado:                  'Atestado Médico',
  relatorio:                 'Relatório Médico',
  receita_simples:           'Receita Simples',
  receita_antimicrobiano:    'Receita Antimicrobianos',
  receita_controle_especial: 'Receita Controle Especial',
  solicitacao_exames:        'Solicitação de Exames',
  laudo:                     'Laudo',
  parecer_tecnico:           'Parecer Técnico',
}

const TIPOS_ATENCAO = ['receita_antimicrobiano', 'receita_controle_especial', 'laudo']

export default function BotaoAssinar({ tipoDocumento, documentoId, assinado: assinadoInicial = false, dataAssinatura: dataInicial = null, onAssinado }) {
  const [estado, setEstado]       = useState('idle')  // idle | carregando | erro
  const [assinado, setAssinado]   = useState(assinadoInicial)
  const [dataAssinatura, setData] = useState(dataInicial)
  const [erro, setErro]           = useState(null)
  const [mostrarAviso, setAviso]  = useState(false)

  useEffect(() => {
    if (assinadoInicial) return
    let cancelado = false
    async function verificarStatus() {
      try {
        const { data } = await api.get(`/assinatura/status/${tipoDocumento}/${documentoId}`)
        if (!cancelado && data.assinado) {
          setAssinado(true)
          setData(data.dataAssinatura)
          onAssinado?.(data)
        }
      } catch (_) { /* silencioso */ }
    }
    verificarStatus()
    return () => { cancelado = true }
  }, [tipoDocumento, documentoId, assinadoInicial, onAssinado])

  const iniciarAssinatura = useCallback(async () => {
    if (TIPOS_ATENCAO.includes(tipoDocumento) && !mostrarAviso) {
      setAviso(true)
      return
    }
    setAviso(false)
    setEstado('carregando')
    setErro(null)

    try {
      const { data } = await api.post('/assinatura/iniciar', { tipoDocumento, documentoId })

      // ── Resposta MOCK (desenvolvimento sem GOV_BR_CLIENT_ID) ────────────
      if (data.mock) {
        setAssinado(true)
        setData(data.dataAssinatura)
        setEstado('idle')
        onAssinado?.(data)
        return
      }

      // ── Resposta PRODUÇÃO: redireciona para GOV.BR ──────────────────
      if (data.url) {
        setEstado('redirecionando')
        setTimeout(() => { window.location.href = data.url }, 500)
        return
      }

      // Fallback: resposta inesperada
      setErro('Resposta inesperada do servidor.')
      setEstado('erro')

    } catch (e) {
      const mensagem = e.response?.data?.erro || 'Erro ao iniciar assinatura. Tente novamente.'
      setErro(mensagem)
      setEstado('erro')
    }
  }, [tipoDocumento, documentoId, mostrarAviso, onAssinado])

  // ── JÁ ASSINADO ───────────────────────────────────────────────
  if (assinado) {
    return (
      <div style={estilos.badgeAssinado}>
        <span style={{ fontSize: '1rem' }}>✅</span>
        <div>
          <span style={estilos.badgeTexto}>Assinado digitalmente com GOV.BR</span>
          {dataAssinatura && (
            <span style={estilos.badgeData}>
              {new Date(dataAssinatura).toLocaleString('pt-BR')}
            </span>
          )}
        </div>
        <a href='https://validar.iti.gov.br' target='_blank' rel='noopener noreferrer' style={estilos.linkValidar}>
          Validar
        </a>
      </div>
    )
  }

  // ── AVISO TIPOS CRÍTICOS ─────────────────────────────────────────
  if (mostrarAviso) {
    const ehControleEspecial = tipoDocumento === 'receita_controle_especial'
    return (
      <div style={estilos.avisoContainer}>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', marginBottom: '14px' }}>
          <span style={{ fontSize: '1.3rem' }}>⚠️</span>
          <div>
            <p style={estilos.avisoTitulo}>
              {ehControleEspecial ? 'Atenção: VIDAAS obrigatório' : 'Certificado avançado recomendado'}
            </p>
            <p style={estilos.avisoTexto}>
              {ehControleEspecial
                ? 'Receitas de Controle Especial exigem assinatura com VIDAAS (certificado CFM).'
                : 'Este documento recomenda assinatura com VIDAAS ou GOV.BR nível Prata/Ouro.'}
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
          <button style={estilos.btnCancelar} onClick={() => setAviso(false)}>Cancelar</button>
          <button style={estilos.btnProsseguir} onClick={iniciarAssinatura}>Prosseguir com GOV.BR</button>
        </div>
      </div>
    )
  }

  // ── BOTÃO PRINCIPAL ─────────────────────────────────────────────
  const ocupado = estado === 'carregando' || estado === 'redirecionando'

  return (
    <div style={{ display: 'inline-flex', flexDirection: 'column', gap: '6px' }}>
      <button
        style={{ ...estilos.btnAssinar, ...(ocupado ? estilos.btnOcupado : {}) }}
        onClick={iniciarAssinatura}
        disabled={ocupado}
        title={`Assinar ${ROTULOS[tipoDocumento] || tipoDocumento} com GOV.BR`}
      >
        {!ocupado && (
          <svg width='20' height='20' viewBox='0 0 48 48' fill='none' aria-hidden='true'>
            <rect width='48' height='48' rx='8' fill='#1351B4'/>
            <text x='50%' y='58%' dominantBaseline='middle' textAnchor='middle'
              fill='white' fontSize='22' fontWeight='bold' fontFamily='Arial'>g</text>
          </svg>
        )}
        {ocupado && <Spinner />}
        <span style={estilos.btnTexto}>
          {estado === 'carregando'     ? 'Preparando...' :
           estado === 'redirecionando' ? 'Redirecionando para GOV.BR...' :
           'Assinar com GOV.BR'}
        </span>
      </button>

      {estado === 'erro' && (
        <span style={estilos.erroTexto}>⚠ {erro}</span>
      )}
    </div>
  )
}

function Spinner() {
  return (
    <svg width='16' height='16' viewBox='0 0 24 24' fill='none'
      stroke='currentColor' strokeWidth='2.5'
      style={{ animation: 'nexus-spin 0.8s linear infinite', flexShrink: 0 }}
      aria-hidden='true'>
      <path d='M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83' />
    </svg>
  )
}

const estilos = {
  btnAssinar: {
    display: 'inline-flex', alignItems: 'center', gap: '8px',
    padding: '10px 18px',
    background: 'linear-gradient(135deg, #1351B4 0%, #0d3d8f 100%)',
    color: '#ffffff', border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: '8px', fontSize: '0.88rem', fontWeight: '600',
    cursor: 'pointer', transition: 'all 0.18s ease',
    boxShadow: '0 2px 8px rgba(19,81,180,0.35)', whiteSpace: 'nowrap',
  },
  btnOcupado: { opacity: 0.7, cursor: 'not-allowed', background: 'linear-gradient(135deg, #2a5dbf 0%, #1a4aad 100%)' },
  btnTexto:   { letterSpacing: '0.01em' },
  badgeAssinado: {
    display: 'inline-flex', alignItems: 'center', gap: '10px',
    padding: '8px 14px',
    background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.25)',
    borderRadius: '8px', fontSize: '0.85rem',
  },
  badgeTexto:  { color: '#4ade80', fontWeight: '600', display: 'block', fontSize: '0.85rem' },
  badgeData:   { color: '#64748b', fontSize: '0.75rem', display: 'block', marginTop: '2px' },
  linkValidar: { color: '#60a5fa', fontSize: '0.78rem', textDecoration: 'underline', whiteSpace: 'nowrap', marginLeft: '4px' },
  avisoContainer: {
    background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.3)',
    borderLeft: '3px solid #fbbf24', borderRadius: '8px', padding: '14px 16px', maxWidth: '420px',
  },
  avisoTitulo: { color: '#fbbf24', fontWeight: '700', fontSize: '0.9rem', margin: '0 0 4px' },
  avisoTexto:  { color: '#94a3b8', fontSize: '0.83rem', lineHeight: '1.5', margin: 0 },
  btnCancelar: {
    padding: '7px 16px', background: 'transparent', color: '#94a3b8',
    border: '1px solid rgba(148,163,184,0.25)', borderRadius: '6px', fontSize: '0.83rem', cursor: 'pointer',
  },
  btnProsseguir: {
    padding: '7px 16px', background: 'linear-gradient(135deg, #1351B4, #0d3d8f)',
    color: '#fff', border: 'none', borderRadius: '6px', fontSize: '0.83rem', fontWeight: '600', cursor: 'pointer',
  },
  erroTexto: { color: '#f87171', fontSize: '0.8rem' },
}
