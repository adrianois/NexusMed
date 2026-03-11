/**
 * ConfirmModal — substitui window.confirm() com visual do sistema NexusMed.
 *
 * Uso:
 *   const { confirmar, ConfirmModalUI } = useConfirm()
 *   ...
 *   const ok = await confirmar({ titulo, mensagem, labelOk, tipo })
 *   ...
 *   return <> ... <ConfirmModalUI /> </>
 *
 * tipo: 'danger' | 'warning' | 'info'  (default: 'danger')
 */
import { useState, useCallback } from 'react'

const TIPO_CFG = {
  danger:  { color: '#f87171', bg: 'rgba(239,68,68,0.08)',   border: 'rgba(239,68,68,0.25)',   icon: '⚠️', btnClass: 'btn-danger'   },
  warning: { color: '#fbbf24', bg: 'rgba(251,191,36,0.08)',  border: 'rgba(251,191,36,0.25)',  icon: '⚠️', btnClass: 'btn-warning'  },
  info:    { color: '#60a5fa', bg: 'rgba(96,165,250,0.08)',   border: 'rgba(96,165,250,0.25)',  icon: 'ℹ️', btnClass: 'btn-primary'  },
  success: { color: '#4ade80', bg: 'rgba(34,197,94,0.08)',    border: 'rgba(34,197,94,0.25)',   icon: '✅', btnClass: 'btn-success'  },
}

export function useConfirm() {
  const [state, setState] = useState(null) // { titulo, mensagem, labelOk, labelCancel, tipo, resolve }

  const confirmar = useCallback((opts) => {
    return new Promise((resolve) => {
      setState({
        titulo:       opts.titulo       || 'Confirmar',
        mensagem:     opts.mensagem     || 'Deseja continuar?',
        labelOk:      opts.labelOk      || 'Confirmar',
        labelCancel:  opts.labelCancel  || 'Cancelar',
        tipo:         opts.tipo         || 'danger',
        resolve,
      })
    })
  }, [])

  const responder = (valor) => {
    if (state?.resolve) state.resolve(valor)
    setState(null)
  }

  function ConfirmModalUI() {
    if (!state) return null
    const cfg = TIPO_CFG[state.tipo] || TIPO_CFG.danger
    return (
      <div style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.75)',
        backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 999, padding: '1rem',
      }}>
        <div style={{
          background: '#0f172a',
          border: `1px solid ${cfg.border}`,
          borderTop: `3px solid ${cfg.color}`,
          borderRadius: '16px',
          padding: '28px 32px',
          width: '100%', maxWidth: '420px',
          boxShadow: '0 24px 48px rgba(0,0,0,0.6)',
          animation: 'fadeInUp 0.18s ease',
        }}>
          {/* Ícone + título */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
            <span style={{ fontSize: '1.5rem', lineHeight: 1 }}>{cfg.icon}</span>
            <h3 style={{
              color: cfg.color, margin: 0,
              fontSize: '1rem', fontWeight: 700,
            }}>{state.titulo}</h3>
          </div>

          {/* Mensagem */}
          <p style={{
            color: '#94a3b8', fontSize: '0.9rem',
            lineHeight: 1.6, margin: '0 0 24px',
          }}>{state.mensagem}</p>

          {/* Botões */}
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <button
              className='btn btn-secondary'
              style={{ padding: '9px 20px', fontSize: '0.88rem' }}
              onClick={() => responder(false)}
              autoFocus
            >
              {state.labelCancel}
            </button>
            <button
              className={`btn ${cfg.btnClass}`}
              style={{ padding: '9px 20px', fontSize: '0.88rem', fontWeight: 700 }}
              onClick={() => responder(true)}
            >
              {state.labelOk}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return { confirmar, ConfirmModalUI }
}
