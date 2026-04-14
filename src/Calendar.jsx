import React, { useMemo, useState, useEffect } from 'react'

// Componente calendario reutilizable
// Props:
// - value: fecha seleccionada en formato ISO (yyyy-mm-dd) o ''
// - onChange: función(valueISO) cuando el usuario selecciona una fecha
export default function Calendar({ value = '', onChange = () => {} }) {
  // Helper: parsear ISO (yyyy-mm-dd) como fecha local (evita desfases por UTC)
  function parseISOToLocalDate(iso) {
    if (!iso) return null
    const [y, m, d] = iso.split('-').map(n => parseInt(n, 10))
    if (!y || !m || !d) return null
    return new Date(y, m - 1, d)
  }

  // Helper: formatear Date a ISO local (yyyy-mm-dd)
  function formatDateToISOLocal(d) {
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const dd = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${dd}`
  }

  // valor seleccionado como Date o null (parseado como local)
  const selectedDate = useMemo(() => (value ? parseISOToLocalDate(value) : null), [value])
  // mes mostrado
  const [viewDate, setViewDate] = useState(selectedDate ? new Date(selectedDate) : new Date())

  // si cambia la prop value queremos mostrar el mes de la fecha seleccionada
  useEffect(() => {
    if (selectedDate) setViewDate(new Date(selectedDate))
  }, [selectedDate])

  // helpers
  function startOfMonth(d) { return new Date(d.getFullYear(), d.getMonth(), 1) }
  function endOfMonth(d) { return new Date(d.getFullYear(), d.getMonth() + 1, 0) }

  const monthTitle = useMemo(() => {
    return new Intl.DateTimeFormat('es-ES', { month: 'long', year: 'numeric' }).format(viewDate)
  }, [viewDate])

  // genera matriz de 6 semanas x 7 días
  const weeks = useMemo(() => {
    const start = startOfMonth(viewDate)
    const end = endOfMonth(viewDate)
    // día de la semana del primer día (0=domingo ... 6=saturday) -> queremos empezar Lunes (1) visual
    // Convertiremos para que la semana empiece en L (lunes)
    const firstWeekday = (start.getDay() + 6) % 7 // 0 = lunes

    const totalDays = end.getDate()
    const cells = []
    // fechas previas
    for (let i = 0; i < firstWeekday; i++) {
      const d = new Date(start)
      d.setDate(start.getDate() - (firstWeekday - i))
      cells.push(d)
    }
    // días del mes
    for (let d = 1; d <= totalDays; d++) cells.push(new Date(start.getFullYear(), start.getMonth(), d))
    // completar hasta 42
    while (cells.length % 7 !== 0) {
      const last = cells[cells.length - 1]
      const d = new Date(last)
      d.setDate(last.getDate() + 1)
      cells.push(d)
    }
    // chunk en semanas
    const w = []
    for (let i = 0; i < cells.length; i += 7) w.push(cells.slice(i, i + 7))
    return w
  }, [viewDate])

  function isSameDay(a, b) {
    if (!a || !b) return false
    return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
  }

  function selectDate(d) {
    // formateamos la fecha seleccionada a ISO local y devolvemos esa cadena
    const isoLocal = formatDateToISOLocal(d)
    onChange(isoLocal)
  }

  function prevMonth() {
    setViewDate(d => new Date(d.getFullYear(), d.getMonth() - 1, 1))
  }
  function nextMonth() {
    setViewDate(d => new Date(d.getFullYear(), d.getMonth() + 1, 1))
  }

  const weekdayNames = ['L', 'M', 'X', 'J', 'V', 'S', 'D']

  return (
    <div className="calendar card">
      <div className="calendar-header">
        <button type="button" className="cal-nav" onClick={prevMonth} aria-label="Mes anterior">‹</button>
        <div className="calendar-title">{monthTitle}</div>
        <button type="button" className="cal-nav" onClick={nextMonth} aria-label="Mes siguiente">›</button>
      </div>

      <div className="calendar-grid">
        <div className="calendar-weeknames">
          {weekdayNames.map(w => (<div key={w} className="cal-weekname">{w}</div>))}
        </div>

        <div className="calendar-days">
          {weeks.map((week, i) => (
            <div key={i} className="cal-week">
              {week.map(d => {
                const isCurrentMonth = d.getMonth() === viewDate.getMonth()
                const isSelected = selectedDate ? isSameDay(d, selectedDate) : false
                const isToday = isSameDay(d, new Date())
                return (
                  <button
                    key={d.toISOString()}
                    type="button"
                    className={`cal-day ${isCurrentMonth ? '' : 'muted'} ${isSelected ? 'selected' : ''} ${isToday ? 'today' : ''}`}
                    onClick={() => selectDate(d)}
                    aria-pressed={isSelected}
                    title={d.toLocaleDateString('es-ES')}
                  >
                    {d.getDate()}
                  </button>
                )
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
