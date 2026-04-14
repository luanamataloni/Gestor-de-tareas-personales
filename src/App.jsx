import React, { useEffect, useState, useRef } from 'react'
import Calendar from './Calendar'
import CrearTarea from './Crear_Tarea'

// -----------------------------
// Helpers / utilidades
// -----------------------------
function formatDate(d) {
  return d.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
}

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}

// -----------------------------
// Componente principal
// -----------------------------
export default function App() {
  // ---------------------------
  // Estado (useState)
  // ---------------------------
  const [name, setName] = useState('Luana')
  const [tasks, setTasks] = useState([])
  const [text, setText] = useState('')
  const [filter, setFilter] = useState('all')

  // Nuevo estado para edición en modal
  const [editingTask, setEditingTask] = useState(null) // objeto completo o null
  const [editTitle, setEditTitle] = useState('')
  const [editPriority, setEditPriority] = useState('media')
  const [editDueDate, setEditDueDate] = useState('')

  // Estados/refs para creación (modal que abre con el +)
  const [showCreate, setShowCreate] = useState(false)
  const [editPrioOpen, setEditPrioOpen] = useState(false) // select del modal de edición
  const [editCalOpen, setEditCalOpen] = useState(false)
  const [editCalVisible, setEditCalVisible] = useState(false) // control de montaje para animación

  // refs para autofocus en el modal
  const editTitleRef = useRef(null)
  const editDateRef = useRef(null)

  // ---------------------------
  // Efectos (useEffect) - carga y persistencia
  // ---------------------------
  useEffect(() => {
    const raw = localStorage.getItem('tasks-v1')
    if (raw) setTasks(JSON.parse(raw))
    const savedName = localStorage.getItem('name-v1')
    if (savedName) setName(savedName)
  }, [])

  // cuando se abre el modal, foco en el input y listener para 'Escape' que cierra
  useEffect(() => {
    if (!editingTask) return
    // foco
    if (editTitleRef.current) editTitleRef.current.focus()

    function onKey(e) {
      if (e.key === 'Escape') closeEdit()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [editingTask])

  // foco cuando se abre modal de creación
  useEffect(() => {
    if (!showCreate) return
    function onKey(e) {
      if (e.key === 'Escape') setShowCreate(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [showCreate])

  useEffect(() => {
    localStorage.setItem('tasks-v1', JSON.stringify(tasks))
  }, [tasks])

  useEffect(() => {
    localStorage.setItem('name-v1', name)
  }, [name])

  // ---------------------------
  // Valores derivados
  // ---------------------------
  const pending = tasks.filter(t => !t.completed).length
  const completed = tasks.filter(t => t.completed).length

  // ---------------------------
  // Handlers / acciones
  // ---------------------------
  function addTask(e) {
    // Mantengo esta función para añadir rápido con Enter en el input
    e && e.preventDefault()
    const v = text.trim()
    if (!v) return
    setTasks([{ id: uid(), text: v, completed: false, createdAt: Date.now(), priority: 'media', dueDate: null }, ...tasks])
    setText('')
  }

  function toggle(id) {
    setTasks(tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t))
  }

  function removeTask(id) {
    setTasks(tasks.filter(t => t.id !== id))
  }

  // Abre el modal de edición y carga los campos
  function startEdit(id) {
    const t = tasks.find(x => x.id === id)
    if (!t) return
    setEditingTask(t)
    setEditTitle(t.text || '')
    setEditPriority(t.priority || 'media')
    // dueDate guardado como ISO (yyyy-mm-dd) o null
    setEditDueDate(t.dueDate || '')
    // cerrar popover si estaba abierto
    setEditCalOpen(false)
    setEditCalVisible(false)
  }

  function closeEdit() {
    setEditingTask(null)
    setEditTitle('')
    setEditPriority('media')
    setEditDueDate('')
    setEditCalOpen(false)
    setEditCalVisible(false)
  }

  function saveEdit(e) {
    e && e.preventDefault()
    if (!editingTask) return
    const title = editTitle.trim()
    const prio = editPriority
    const due = editDueDate || null
    if (!title) return
    setTasks(tasks.map(t => t.id === editingTask.id ? { ...t, text: title, priority: prio, dueDate: due } : t))
    closeEdit()
  }

  // Crear nueva tarea (desde modal)
  function openCreate() {
    setShowCreate(true)
    setEditPrioOpen(false)
    setEditCalOpen(false)
    setEditCalVisible(false)
  }
  function closeCreate() {
    setShowCreate(false)
  }
  function handleCreateSave({ title, priority, dueDate }) {
    setTasks(prev => [{ id: uid(), text: title, completed: false, createdAt: Date.now(), priority, dueDate: dueDate || null }, ...prev])
    setShowCreate(false)
  }

  function changeName() {
    const res = prompt('¿Cuál es tu nombre?', name)
    if (res === null) return
    const value = res.trim()
    if (!value) return
    setName(value)
  }

  // helper para mostrar ISO como dd/mm/yyyy
  function isoToDisplay(iso) {
    if (!iso) return ''
    const [y, m, d] = iso.split('-')
    return `${d}/${m}/${y}`
  }

  // cerrar popovers al click fuera (mousedown para mayor robustez)
  // Ahora usamos `editCalVisible` para controlar el montaje y `editCalOpen` para la clase abierta.
  useEffect(() => {
    function onDocMouse(e) {
      if (editCalVisible) {
        if (editDateRef.current && !editDateRef.current.contains(e.target)) closeEditCalendar()
      }
    }
    if (editCalVisible) {
      document.addEventListener('mousedown', onDocMouse)
      return () => document.removeEventListener('mousedown', onDocMouse)
    }
  }, [editCalVisible])

  // funciones helper para abrir/cerrar con animación (matching behavior a Crear_Tarea.jsx)
  function openEditCalendar() {
    if (editCalVisible) {
      setEditCalOpen(true)
      return
    }
    setEditCalVisible(true)
    // after mount, trigger opening state so transition runs
    setTimeout(() => setEditCalOpen(true), 20)
  }
  function closeEditCalendar() {
    if (!editCalVisible) return
    setEditCalOpen(false)
    // wait for transition to finish then unmount
    setTimeout(() => setEditCalVisible(false), 220)
  }

  // ---------------------------
  // Filtrado de tareas a mostrar
  // ---------------------------
  const shown = tasks.filter(t => {
    if (filter === 'all') return true
    if (filter === 'pending') return !t.completed
    return t.completed
  })

  // ---------------------------
  // Render (JSX)
  // ---------------------------
  return (
    <div className="app">
      {/* Header / Hero */}
      <header className="hero">
        <div className="hero-inner">
          <div className="greeting">
            {/* Nombre: clic para editar */}
            <h1 onClick={changeName} title="Haz clic para cambiar tu nombre">¡Hola, {name}!</h1>
            <p className="date">{formatDate(new Date())}</p>
          </div>

          {/* Contadores: pendientes / completadas dentro de una tarjeta blanca */}
          <div className="counters card counters-card">
            <div className="counter">
              <div className="label">Tareas pendientes</div>
              <div className="value">{pending}</div>
            </div>
            <div className="counter">
              <div className="label">Completadas</div>
              <div className="value green">{completed}</div>
            </div>
          </div>
        </div>
      </header>

      <main className="container">
        {/* Sección: añadir tarea (input rápido + botón para abrir modal) */}
        <section className="add">
          <form onSubmit={addTask} className="add-form">
            <input
              placeholder="Escribe una tarea y pulsa Enter o +"
              value={text}
              onChange={e => setText(e.target.value)}
            />
            {/* ahora el botón + abre el modal de creación */}
            <button type="button" className="btn-add" onClick={openCreate}>+</button>
          </form>

          {/* Filtros */}
          <div className="filters">
            <button className={filter==='all'? 'active':''} onClick={() => setFilter('all')}>Todas</button>
            <button className={filter==='pending'? 'active':''} onClick={() => setFilter('pending')}>Pendientes</button>
            <button className={filter==='completed'? 'active':''} onClick={() => setFilter('completed')}>Completadas</button>
          </div>
        </section>

        {/* Sección: lista de tareas / estado vacío */}
        <section className="tasks">
          {shown.length === 0 ? (
            <div className="empty">
              <div className="empty-ico">📅</div>
              <div>No tienes tareas pendientes</div>
              <small>¡Buen trabajo!</small>
            </div>
          ) : (
            <ul>
              {shown.map(t => (
                <li key={t.id} className={t.completed? 'done':''}>
                  <label>
                    <input type="checkbox" checked={t.completed} onChange={() => toggle(t.id)} />
                    <span className="text">{t.text}</span>
                   {t.dueDate && <div className="task-due">Entrega: {isoToDisplay(t.dueDate)}</div>}
                  </label>
                  <div className="actions">
                    <button onClick={() => startEdit(t.id)}>✏️</button>
                    <button onClick={() => removeTask(t.id)}>🗑️</button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>

      {/* Footer */}
      <footer className="footer">• Gestor de tareas •</footer>

      {/* Modal de edición */}
      {editingTask && (
        <div className="modal-overlay" onMouseDown={closeEdit}>
          <div className="modal" onMouseDown={e => e.stopPropagation()} role="dialog" aria-modal="true">
            <h3>Editar Tarea</h3>
            <button className="modal-close" onClick={closeEdit}>×</button>
            <form onSubmit={saveEdit} className="modal-form">
              <label>
                Título de la tarea
                <input ref={editTitleRef} value={editTitle} onChange={e => setEditTitle(e.target.value)} placeholder="Ej: Entregar ensayo" />
              </label>

              <label>
                Prioridad
                <div className="custom-select" tabIndex={0} onBlur={() => setEditPrioOpen(false)}>
                  <div className="selected" onClick={() => setEditPrioOpen(p => !p)}>{editPriority}</div>
                  <ul className={`priority-options ${editPrioOpen ? 'open' : ''}`}>
                    <li className="priority-option" data-priority="baja" onMouseDown={(e)=>{e.preventDefault(); setEditPriority('baja'); setEditPrioOpen(false);}}>Baja</li>
                    <li className="priority-option" data-priority="media" onMouseDown={(e)=>{e.preventDefault(); setEditPriority('media'); setEditPrioOpen(false);}}>Media</li>
                    <li className="priority-option" data-priority="alta" onMouseDown={(e)=>{e.preventDefault(); setEditPriority('alta'); setEditPrioOpen(false);}}>Alta</li>
                  </ul>
                </div>
              </label>

              <label>
                Fecha de entrega
                <div className="date-input" ref={editDateRef}>
                  <div className="date-input-field" onClick={() => (editCalVisible && editCalOpen) ? closeEditCalendar() : openEditCalendar()}>
                    {editDueDate ? isoToDisplay(editDueDate) : 'dd/mm/aaaa'}
                  </div>
                  {editCalVisible && (
                    <div className={`calendar-popover ${editCalOpen ? 'open' : 'closing'}`}>
                      <Calendar value={editDueDate || ''} onChange={v => { setEditDueDate(v); closeEditCalendar(); }} />
                    </div>
                  )}
                </div>
              </label>

              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={closeEdit}>Cancelar</button>
                <button type="submit" className="btn-primary">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de creación (se delega a CrearTarea.jsx) */}
      <CrearTarea isOpen={showCreate} onClose={closeCreate} onSave={handleCreateSave} />

    </div>
  )
}
