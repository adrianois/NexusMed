/**
 * ModalBase — Modal reutilizável para todos os documentos médicos.
 * Gerencia o overlay, cabeçalho, spinner de envio e botão de fechar.
 */
import { useEffect } from 'react'

export default function ModalBase({ titulo, icone = '📄', cor = '#60a5fa', children, onFechar, salvando }) {
  // Fecha com ESC
  useEffect(() => {
    const fn = (e) => { if (e.key === 'Escape') onFechar() }
    window.addEventListener('keydown', fn)
    return () => window.removeEventListener('keydown', fn)
  }, [onFechar])

  return (
    <div style={overlay} onClick={e => { if (e.target === e.currentTarget) onFechar() }}>
      <div style={{ ...modal, borderTopColor: cor }}>
        {/* Cabeçalho */}
        <div style={cabecalho}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '1.3rem' }}>{icone}</span>
            <h3 style={{ color: cor, margin: 0, fontSize: '1rem', fontWeight: 700 }}>{titulo}</h3>
          </div>
          <button style={btnFechar} onClick={onFechar} disabled={salvando}>✕</button>
        </div>

        {/* Conteúdo passado via children */}
        <div style={{ overflowY: 'auto', maxHeight: 'calc(90vh - 130px)', paddingRight: '4px' }}>
          {children}
        </div>
      </div>
    </div>
  )
}

const overlay = {
  position: 'fixed', inset: 0,
  background: 'rgba(0,0,0,0.78)',
  backdropFilter: 'blur(6px)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  zIndex: 900, padding: '1rem',
}
const modal = {
  background: '#0f172a',
  border: '1px solid rgba(255,255,255,0.09)',
  borderTop: '3px solid',
  borderRadius: '16px',
  padding: '28px 30px',
  width: '100%', maxWidth: '620px',
  boxShadow: '0 24px 48px rgba(0,0,0,0.6)',
  animation: 'fadeInUp 0.18s ease',
}
const cabecalho = {
  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
  marginBottom: '22px', paddingBottom: '14px',
  borderBottom: '1px solid rgba(255,255,255,0.07)',
}
const btnFechar = {
  background: 'transparent', border: 'none',
  color: '#475569', fontSize: '1rem',
  cursor: 'pointer', padding: '4px 8px',
  borderRadius: '6px',
}
