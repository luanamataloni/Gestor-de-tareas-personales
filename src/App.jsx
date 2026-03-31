import React, { useEffect, useState } from 'react'

function formatDate(d) {
  return d.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
}

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}

export default function App() {
  const [name, setName] = useState('Luana')
  const [tasks, setTasks] = useState([])
  const [text, setText] = useState('')
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    const raw = localStorage.getItem('tasks-v1')
    if (raw) setTasks(JSON.parse(raw))
  }, [])

  useEffect(() => {
    localStorage.setItem('tasks-v1', JSON.stringify(tasks))
  }, [tasks])

  const pending = tasks.filter(t => !t.completed).length
  const completed = tasks.filter(t => t.completed).length

  function addTask(e) {
    e && e.preventDefault()
    const v = text.trim()
    if (!v) return
    setTasks([{ id: uid(), text: v, completed: false, createdAt: Date.now() }, ...tasks])
    setText('')
  }

  function toggle(id) {
    setTasks(tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t))
  }

  function removeTask(id) {
    setTasks(tasks.filter(t => t.id !== id))
  }

  function startEdit(id) {
    const t = tasks.find(x => x.id === id)
    const res = prompt('Editar tarea', t.text)
    if (res === null) return
    const value = res.trim()
    if (!value) return
    setTasks(tasks.map(x => x.id === id ? { ...x, text: value } : x))
  }

  const shown = tasks.filter(t => {
    if (filter === 'all') return true
    if (filter === 'pending') return !t.completed
    return t.completed
  })

  return (
    <div className="app">
      <header className="hero">
        <div className="hero-inner">
          <div className="greeting">
            <h1>¡Hola, {name}!</h1>
            <p className="date">{formatDate(new Date())}</p>
          </div>
          <div className="counters">
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
        <section className="add">
          <form onSubmit={addTask} className="add-form">
            <input
              placeholder="Escribe una tarea y pulsa Enter o +"
              value={text}
              onChange={e => setText(e.target.value)}
            />
            <button type="submit" className="btn-add">+</button>
          </form>

          <div className="filters">
            <button className={filter==='all'? 'active':''} onClick={() => setFilter('all')}>Todas</button>
            <button className={filter==='pending'? 'active':''} onClick={() => setFilter('pending')}>Pendientes</button>
            <button className={filter==='completed'? 'active':''} onClick={() => setFilter('completed')}>Completadas</button>
          </div>
        </section>

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

      <footer className="footer">Gestor de tareas • Demo local</footer>
    </div>
  )
}

