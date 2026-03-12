import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import api from '../api'

export default function ConfirmarConsulta() {
  const [params]  = useSearchParams()
  const [status,  setStatus]  = useState('carregando') // carregando | sucesso | jaConfirmado | erro
  const [mensagem, setMensagem] = useState('')

  useEffect(() => {
    const token = params.get('token')
    if (!token) { setStatus('erro'); setMensagem('Link inválido.'); return }

    api.get(`/api/confirmacao/${token}`)
      .then(({ data }) => {
        if (data.jaConfirmado) { setStatus('jaConfirmado') }
        else                   { setStatus('sucesso') }
      })
      .catch(err => {
        const msg = err.response?.data?.error || 'Erro ao confirmar consulta.'
        setStatus('erro')
        setMensagem(msg)
      })
  }, [params])

  const cfg = {
    carregando:  { icon: '⏳', titulo: 'Confirmando sua consulta...', cor: '#6366f1', texto: 'Aguarde um momento.' },
    sucesso:     { icon: '✅', titulo: 'Consulta Confirmada!',         cor: '#22c55e', texto: 'Sua presença foi confirmada com sucesso. Até breve!' },
    jaConfirmado:{ icon: '🔔', titulo: 'Já Confirmada',               cor: '#f59e0b', texto: 'Esta consulta já havia sido confirmada anteriormente.' },
    erro:        { icon: '❌', titulo: 'Link Inválido ou Expirado',   cor: '#ef4444', texto: mensagem || 'Este link não é mais válido. Solicite um novo e-mail de confirmação.' },
  }[status]

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(135deg,#0f172a,#1e1b4b)', fontFamily: 'Arial, sans-serif', padding: '24px',
    }}>
      <div style={{
        background: '#1e293b', borderRadius: '16px', padding: '48px 40px', maxWidth: '440px',
        width: '100%', textAlign: 'center', boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
        border: `1px solid ${cfg.cor}33`,
      }}>
        <div style={{ fontSize: '64px', marginBottom: '16px' }}>{cfg.icon}</div>
        <h1 style={{ margin: '0 0 12px', color: cfg.cor, fontSize: '22px' }}>{cfg.titulo}</h1>
        <p style={{ margin: '0 0 32px', color: '#94a3b8', fontSize: '15px', lineHeight: '1.6' }}>{cfg.texto}</p>

        {status === 'sucesso' && (
          <div style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: '10px', padding: '16px' }}>
            <p style={{ margin: 0, color: '#4ade80', fontSize: '14px' }}>
              📅 Anote sua data e horário e compareça com 10 minutos de antecedência.
            </p>
          </div>
        )}

        <p style={{ marginTop: '32px', color: '#475569', fontSize: '12px' }}>
          NexusMed — Sistema de Gestão de Clínicas
        </p>
      </div>
    </div>
  )
}
