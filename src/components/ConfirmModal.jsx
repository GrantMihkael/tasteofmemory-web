import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

const ConfirmContext = createContext(null)

export function ConfirmProvider({ children }) {
  const [dialog, setDialog] = useState(null)
  const modalRef = useRef(null)
  const triggerRef = useRef(null)

  const confirm = useCallback((options) => new Promise((resolve) => {
    triggerRef.current = document.activeElement
    setDialog({ ...options, resolve })
  }), [])

  const close = useCallback((accepted) => {
    setDialog((current) => {
      current?.resolve(accepted)
      return null
    })
    window.requestAnimationFrame(() => triggerRef.current?.focus?.())
  }, [])

  useEffect(() => {
    if (!dialog) return undefined
    const modal = modalRef.current
    const focusable = () => [...modal.querySelectorAll('button:not(:disabled), [href], input:not(:disabled), [tabindex]:not([tabindex="-1"])')]
    focusable()[0]?.focus()
    const handleKey = (event) => {
      if (event.key === 'Escape') { event.preventDefault(); close(false); return }
      if (event.key !== 'Tab') return
      const items = focusable()
      if (!items.length) return
      const first = items[0]
      const last = items.at(-1)
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
    }
    document.addEventListener('keydown', handleKey)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.removeEventListener('keydown', handleKey); document.body.style.overflow = previousOverflow }
  }, [dialog, close])

  return <ConfirmContext.Provider value={confirm}>{children}{dialog && createPortal(
    <div className="confirm-overlay" onMouseDown={(event) => event.target === event.currentTarget && close(false)}>
      <section className="confirm-modal" ref={modalRef} role="alertdialog" aria-modal="true" aria-labelledby="confirm-title" aria-describedby="confirm-description">
        <span className="eyebrow">Please confirm</span>
        <h2 id="confirm-title">{dialog.title}</h2>
        <p id="confirm-description">{dialog.message}</p>
        <div className="confirm-actions"><button className="button button-quiet" type="button" onClick={() => close(false)}>Cancel</button><button className="button button-danger" type="button" onClick={() => close(true)}>{dialog.confirmLabel || 'Delete'}</button></div>
      </section>
    </div>, document.body
  )}</ConfirmContext.Provider>
}

export function useConfirm() {
  const confirm = useContext(ConfirmContext)
  if (!confirm) throw new Error('useConfirm must be used inside ConfirmProvider')
  return confirm
}
