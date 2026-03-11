/**
 * Toast — substitui alert() com notificação visual no canto inferior direito.
 *
 * Uso:
 *   const { toast, ToastUI } = useToast()
 *   toast('Salvo com sucesso!', 'success')
 *   toast('Erro ao salvar.', 'error')
 *   return <> ... <ToastUI /> </>
 *
 * tipo: 'success' | 'error' | 'warning' | 'info'
 */
import { useState, useCallback } from 'react'

const TIPO_CFG = {
  success: { color: '#4ade80', bg: 'rgba(34,197,94,0.12)',   border: 'rgba(34,197,94,0.25)',   icon: '✅' },
  error:   { color: '#f87171', bg: 'rgba(239,68,68,0.12)',   border: 'rgba(239,68,68,0.25)',   icon: '❌' },
  warning: { color: '#fbbf24', bg: 'rgba(251,191,36,0.12)',  border: 'rgba(251,191,36,0.25)',  icon: '⚠️' },
  info:    { color: '#60a5fa', bg: 'rgba(96,165,250,0.12)',  border: 'rgba(96,165,250,0.25)',  icon: 'ℹ️' },
}

export function useToast() {
  const [toasts, setToasts] = useState([])

  const toast = useCallback((mensagem, tipo = 'info', duracao = 3500) => {
    const id = Date.now()
    setToasts(prev => [...prev, { id, mensagem, tipo }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), duracao)
  }, [])

  function ToastUI() {
    if (toasts.length === 0) return null
    return (
      <div style={{
        position: 'fixed', bottom: '24px', right: '24px',
        display: 'flex', flexDirection: 'column', gap: '10px',
        zIndex: 1000, pointerEvents: 'none',
      }}>
        {toasts.map(t => {
          const cfg = TIPO_CFG[t.tipo] || TIPO_CFG.info
          return (
            <div key={t.id} style={{
              background: '#0f172a',
              border: `1px solid ${cfg.border}`,
              borderLeft: `4px solid ${cfg.color}`,
              borderRadius: '10px',
              padding: '12px 18px',
              display: 'flex', alignItems: 'center', gap: '10px',
              boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
              maxWidth: '340px',
              animation: 'fadeInUp 0.2s ease',
              pointerEvents: 'auto',
            }}>
              <span style={{ fontSize: '1.1rem' }}>{cfg.icon}</span>
              <span style={{ color: '#e2e8f0', fontSize: '0.88rem', lineHeight: 1.5 }}>{t.mensagem}</span>
            </div>
          )
        })}
      </div>
    )
  }

  return { toast, ToastUI }
}
