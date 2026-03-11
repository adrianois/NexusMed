/**
 * AssinaturaCallback — Página exibida após o retorno do GOV.BR.
 * Recebe ?status=sucesso&documentoId=xxx&tipo=atestado
 * ou    ?status=erro&motivo=xxx
 */
import { useEffect, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'

export default function AssinaturaCallback() {
  const [params]   = useSearchParams()
  const navigate   = useNavigate()
  const [segundos, setSegundos] = useState(5)

  const sucesso      = window.location.pathname.includes('/sucesso')
  const documentoId  = params.get('documentoId')
  const tipo         = params.get('tipo')
  const motivo       = params.get('motivo')

  const ROTULOS = {
    atestado:                  'Atestado Médico',
    relatorio:                 'Relatório Médico',
    receita_simples:           'Receita Simples',
    receita_antimicrobiano:    'Receita de Antimicrobianos',
    receita_controle_especial: 'Receita de Controle Especial',
    solicitacao_exames:        'Solicitação de Exames',
    laudo:                     'Laudo',
    parecer_tecnico:           'Parecer Técnico',
  }

  const MOTIVOS = {
    erro_interno:    'Ocorreu um erro interno ao processar a assinatura.',
    access_denied:   'Autorização negada pelo GOV.BR.',
    invalid_request: 'Requisição inválida. Tente novamente.',
  }

  // Contagem regressiva e redirect automático
  useEffect(() => {
    const intervalo = setInterval(() => {
      setSegundos(s => {
        if (s <= 1) {
          clearInterval(intervalo)
          navigate('/')
        }
        return s - 1
      })
    }, 1000)
    return () => clearInterval(intervalo)
  }, [navigate])

  return (
    <div style={estilos.container}>
      <div style={estilos.card}>
        {sucesso ? (
          <>
            <span style={estilos.icone}>✅</span>
            <h2 style={{ ...estilos.titulo, color: '#4ade80' }}>Documento assinado!</h2>
            <p style={estilos.descricao}>
              {tipo ? `O documento <strong>${ROTULOS[tipo] || tipo}</strong> foi assinado com sucesso com certificado GOV.BR.` : 'Documento assinado com sucesso.'}
            </p>
            <div style={estilos.badgeInfo}>
              <span style={{ color: '#94a3b8', fontSize: '0.82rem' }}>ID do documento:</span>
              <code style={estilos.codigo}>{documentoId}</code>
            </div>
            <a
              href="https://validar.iti.gov.br"
              target="_blank"
              rel="noopener noreferrer"
              style={estilos.linkValidar}
            >
              🔍 Validar assinatura em validar.iti.gov.br
            </a>
          </>
        ) : (
          <>
            <span style={estilos.icone}>❌</span>
            <h2 style={{ ...estilos.titulo, color: '#f87171' }}>Falha na assinatura</h2>
            <p style={estilos.descricao}>
              {MOTIVOS[motivo] || 'Não foi possível concluir a assinatura. Tente novamente.'}
            </p>
          </>
        )}

        <div style={estilos.rodape}>
          <p style={estilos.redirectTexto}>Redirecionando em {segundos}s...</p>
          <button style={estilos.btnVoltar} onClick={() => navigate('/')}>
            Ir para o início agora
          </button>
        </div>
      </div>
    </div>
  )
}

const estilos = {
  container: {
    minHeight:      '100vh',
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'center',
    background:     '#020817',
    padding:        '1rem',
  },
  card: {
    background:   '#0f172a',
    border:       '1px solid rgba(255,255,255,0.08)',
    borderRadius: '16px',
    padding:      '40px 36px',
    maxWidth:     '440px',
    width:        '100%',
    textAlign:    'center',
    boxShadow:    '0 24px 48px rgba(0,0,0,0.5)',
  },
  icone: {
    fontSize:    '3rem',
    display:     'block',
    marginBottom: '16px',
  },
  titulo: {
    fontSize:   '1.3rem',
    fontWeight: '700',
    margin:     '0 0 10px',
  },
  descricao: {
    color:      '#94a3b8',
    fontSize:   '0.9rem',
    lineHeight: '1.6',
    margin:     '0 0 20px',
  },
  badgeInfo: {
    background:    'rgba(255,255,255,0.04)',
    border:        '1px solid rgba(255,255,255,0.08)',
    borderRadius:  '8px',
    padding:       '10px 14px',
    marginBottom:  '16px',
    display:       'flex',
    flexDirection: 'column',
    gap:           '4px',
  },
  codigo: {
    color:       '#60a5fa',
    fontSize:    '0.78rem',
    fontFamily:  'monospace',
    wordBreak:   'break-all',
  },
  linkValidar: {
    display:        'inline-block',
    color:          '#60a5fa',
    fontSize:       '0.85rem',
    textDecoration: 'underline',
    marginBottom:   '24px',
  },
  rodape: {
    borderTop:  '1px solid rgba(255,255,255,0.06)',
    paddingTop: '20px',
    marginTop:  '4px',
  },
  redirectTexto: {
    color:     '#475569',
    fontSize:  '0.82rem',
    margin:    '0 0 12px',
  },
  btnVoltar: {
    padding:      '9px 22px',
    background:   'linear-gradient(135deg, #1351B4, #0d3d8f)',
    color:        '#fff',
    border:       'none',
    borderRadius: '8px',
    fontSize:     '0.88rem',
    fontWeight:   '600',
    cursor:       'pointer',
  },
}
