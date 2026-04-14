import React, { useEffect, useRef, useState } from 'react'
import Calendar from './Calendar'

// Componente modal para crear tarea
// Props:
// - isOpen: boolean
// - onClose: () => void
// - onSave: ({ title, priority, dueDate }) => void
export default function CrearTarea({ isOpen, onClose, onSave }) {
  const [title, setTitle] = useState('')
  const [priority, setPriority] = useState('media')
  const [prioOpen, setPrioOpen] = useState(false)
  const [dueDate, setDueDate] = useState('')
  const [calOpen, setCalOpen] = useState(false)
  const [calVisible, setCalVisible] = useState(false)

  const titleRef = useRef(null)
  const rootRef = useRef(null)

  useEffect(() => {
    if (isOpen) {
      setTitle('')
      setPriority('media')
      setDueDate('')
      setPrioOpen(false)
      setCalOpen(false)
      setCalVisible(false)
      // give focus after render
      setTimeout(() => titleRef.current && titleRef.current.focus(), 0)
    }
  }, [isOpen])

  useEffect(() => {
    function onKey(e) {
      if (!isOpen) return
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isOpen, onClose])

  useEffect(() => {
    function onDocMouse(e) {
      if (!rootRef.current) return
      if (calVisible) {
        const cal = rootRef.current.querySelector('.calendar-popover')
        if (cal && !cal.contains(e.target) && !e.target.closest('.date-input-field')) {
          // animado: cerrar con delay
          closeCalendar()
        }
      }
      if (prioOpen) {
        const pr = rootRef.current.querySelector('.priority-options')
        if (pr && !pr.contains(e.target) && !e.target.closest('.selected')) setPrioOpen(false)
      }
    }
    if (isOpen && (calOpen || prioOpen || calVisible)) document.addEventListener('mousedown', onDocMouse)
    return () => document.removeEventListener('mousedown', onDocMouse)
  }, [isOpen, calOpen, prioOpen, calVisible])

  // helper para abrir/cerrar el calendario con animación
  function openCalendar() {
    if (calVisible) {
      setCalOpen(true)
      return
    }
    setCalVisible(true)
    // after mount, trigger opening state so transition runs
    setTimeout(() => setCalOpen(true), 20)
  }
  function closeCalendar() {
    if (!calVisible) return
    setCalOpen(false)
    // wait for transition to finish then unmount
    setTimeout(() => setCalVisible(false), 220)
  }

  function handleSave(e) {
    e && e.preventDefault()
    const t = title.trim()
    if (!t) return
    onSave({ title: t, priority, dueDate: dueDate || null })
    // reset handled by parent via isOpen change; also close
    onClose()
  }

  // metadata para prioridades (color y texto mostrado)
  const priorityMeta = {
    baja: { label: 'Baja', color: 'var(--hero-start, #6ec1ff)' },
    media: { label: 'Media', color: '#fbc02d' },
    alta: { label: 'Alta', color: '#ef5350' }
  }

  if (!isOpen) return null

  // CSS embebido para este modal (todo en un solo archivo como pediste)
  const localStyles = `
    .crear-tarea-modal .modal { padding: 20px 18px; }
    .crear-tarea-modal .modal-form { display:flex; flex-direction:column; gap:12px; }
    .crear-tarea-modal .modal-form label { display:flex; flex-direction:column; font-size:14px; color: var(--muted); font-weight:500; }
    /* evitar que el label cambie de color al enfocar el input */
    .crear-tarea-modal .modal-form label:focus-within { color: var(--muted) !important; }
    /* cuando el input está enfocado, evitar que el label se vuelva negro o cambie color */
    .crear-tarea-modal .modal-form label:focus-within, .crear-tarea-modal .modal-form label:focus { color: var(--muted) !important; }

    /* input del título con mismo diseño que el select */
    .crear-tarea-modal .selected-input { margin-top:8px; padding:10px 12px; border-radius:8px; border:1px solid var(--input-border); background:var(--card-bg); font-size:14px; color:var(--muted); font-weight:500; }
    .crear-tarea-modal .selected-input::placeholder { color: var(--muted-2); }
    .crear-tarea-modal .selected-input:focus { outline: none; box-shadow: 0 6px 16px rgba(20,40,70,0.06); color: var(--muted); }

    /* prioriy selected look */
    .crear-tarea-modal .custom-select { position:relative; width:100%; margin-top:8px; }
    .crear-tarea-modal .custom-select .selected { display:flex; align-items:center; gap:8px; padding:10px 12px; border-radius:8px; border:1px solid var(--input-border); background:var(--card-bg); color:var(--muted); font-weight:500; }
    .crear-tarea-modal .priority-indicator { width:10px; height:10px; border-radius:50%; display:inline-block; box-shadow:0 1px 2px rgba(0,0,0,0.08); }
    .crear-tarea-modal .priority-label { font-weight:600; color:var(--muted); }

    /* date field */
    .crear-tarea-modal .date-input { position:relative; width:100%; margin-top:8px; }
    .crear-tarea-modal .date-input-field { position:relative; padding:10px 36px 10px 12px; border-radius:8px; border:1px solid var(--input-border); background:#fff; cursor:pointer; font-size:14px; color:var(--muted); font-weight:500; }
    .crear-tarea-modal .date-input-field::after { content: '📅'; position:absolute; right:10px; top:50%; transform:translateY(-50%); font-size:16px; }

    /* popover animations */
    .crear-tarea-modal .calendar-popover { opacity: 0; transform: translateY(-8px) scale(0.985); transition: opacity .18s ease, transform .18s ease; pointer-events: none; }
    .crear-tarea-modal .calendar-popover.open { opacity: 1; transform: translateY(0) scale(1); pointer-events: auto; }
    .crear-tarea-modal .calendar-popover.closing { opacity: 0; transform: translateY(-8px) scale(0.985); pointer-events: none; }

    /* opciones de prioridad */
    .crear-tarea-modal .priority-options { position:absolute; left:0; right:0; top:calc(100% + 8px); background:var(--card-bg); border:1px solid var(--input-border); border-radius:8px; box-shadow:var(--shadow); list-style:none; padding:6px; margin:0; display:none; }
    .crear-tarea-modal .priority-options.open { display:block; }
    .crear-tarea-modal .priority-option { padding:10px 12px; border-radius:6px; cursor:pointer; position:relative; overflow:hidden; margin-bottom:6px; display:flex; align-items:center; gap:8px; }
    .crear-tarea-modal .priority-option:last-child { margin-bottom:0; }
    .crear-tarea-modal .priority-option::before { content:''; position:absolute; left:0; right:0; bottom:0; height:4px; transform:scaleX(0); transform-origin:left; transition:transform .3s ease; }
    .crear-tarea-modal .priority-option:hover::before { transform:scaleX(1); }
    .crear-tarea-modal .priority-option[data-priority="baja"]::before { background: var(--hero-start); }
    .crear-tarea-modal .priority-option[data-priority="media"]::before { background: #fbc02d; }
    .crear-tarea-modal .priority-option[data-priority="alta"]::before { background: #ef5350; }

    /* modal actions buttons spacing */
    .crear-tarea-modal .modal-actions { display:flex; gap:10px; justify-content:flex-end; margin-top:6px; }
    .crear-tarea-modal .btn-primary { background:var(--primary); color:white; border:none; padding:10px 16px; border-radius:8px; cursor:pointer; font-weight:600; }
    .crear-tarea-modal .btn-secondary { background:transparent; color:var(--text); border:1px solid var(--input-border); padding:9px 14px; border-radius:8px; cursor:pointer; }
  `

  return (
    <div className="modal-overlay" onMouseDown={onClose}>
      {/* inyectamos estilos locales dentro del componente para tener todo en un solo archivo */}
      <style>{localStyles}</style>
      <div className="crear-tarea-modal">
        <div className="modal" onMouseDown={e => e.stopPropagation()} role="dialog" aria-modal="true" ref={rootRef}>
        <h3>Nueva Tarea</h3>
        <button className="modal-close" onClick={onClose}>×</button>
        <form onSubmit={handleSave} className="modal-form">
          <label>
            Título de la tarea
            <input className="selected-input" placeholder="Ej: Entregar ensayo" ref={titleRef} value={title} onChange={e => setTitle(e.target.value)} />
          </label>

          <label>
            Prioridad
            <div className="custom-select" tabIndex={0}>
              <div className="selected" onClick={() => setPrioOpen(p => !p)}>
                <span className="priority-indicator" style={{ background: priorityMeta[priority]?.color }} aria-hidden="true" />
                <span className="priority-label">{priorityMeta[priority]?.label}</span>
              </div>
               <ul className={`priority-options ${prioOpen ? 'open' : ''}`}>
                 <li className="priority-option" data-priority="baja" onMouseDown={(e) => { e.preventDefault(); setPriority('baja'); setPrioOpen(false) }}>
                   <span className="priority-indicator" style={{ background: priorityMeta['baja'].color }} aria-hidden="true" />Baja
                 </li>
                 <li className="priority-option" data-priority="media" onMouseDown={(e) => { e.preventDefault(); setPriority('media'); setPrioOpen(false) }}>
                   <span className="priority-indicator" style={{ background: priorityMeta['media'].color }} aria-hidden="true" />Media
                 </li>
                 <li className="priority-option" data-priority="alta" onMouseDown={(e) => { e.preventDefault(); setPriority('alta'); setPrioOpen(false) }}>
                   <span className="priority-indicator" style={{ background: priorityMeta['alta'].color }} aria-hidden="true" />Alta
                 </li>
               </ul>
             </div>
           </label>

          <label>
            Fecha de entrega
            <div className="date-input">
              <div className="date-input-field" onClick={() => (calVisible && calOpen) ? closeCalendar() : openCalendar()}>{dueDate ? (() => { const [y, m, d] = dueDate.split('-'); return `${d}/${m}/${y}` })() : 'dd/mm/aaaa'}</div>
              {calVisible && (
                <div className={`calendar-popover ${calOpen ? 'open' : 'closing'}`}>
                  <Calendar value={dueDate || ''} onChange={v => { setDueDate(v); closeCalendar() }} />
                </div>
              )}
            </div>
          </label>

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn-primary">Agregar Tarea</button>
          </div>
        </form>
        </div>
      </div>
    </div>
  )
}
