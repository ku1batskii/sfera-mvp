import React, { useEffect, useState } from 'react'
import Calendar from './Calendar'

function ActivityCard({ev, onFocus}){
  return (
    <div className="activity-card" onClick={()=>onFocus(ev)}>
      <div className="activity-media" />
      <div className="activity-body">
        <h4 className="activity-title">{ev.title || 'Без названия'}</h4>
        <div className="activity-meta">{ev.city} • {new Date(ev.created_at).toLocaleString()}</div>
        <p className="activity-desc">{ev.description || ''}</p>
      </div>
    </div>
  )
}

export default function ActivityList(){
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedDay, setSelectedDay] = useState(null)

  useEffect(()=>{
    const city = localStorage.getItem('sfera_city') || null
    const category = localStorage.getItem('sfera_category') || null
    const qs = new URLSearchParams()
    if(city) qs.set('city', city)
    if(category && category !== 'all') qs.set('category', category)
    fetch('/api/events' + (qs.toString() ? ('?' + qs.toString()) : ''))
      .then(r=>r.json())
      .then(list=>{ setItems(list); setLoading(false) })
      .catch(()=> setLoading(false))
  }, [])

  useEffect(()=>{
    function onFilters(e){
      setLoading(true)
      const { city, category } = e.detail || {}
      const qs = new URLSearchParams()
      if(city) qs.set('city', city)
      if(category && category !== 'all') qs.set('category', category)
      fetch('/api/events' + (qs.toString() ? ('?' + qs.toString()) : ''))
        .then(r=>r.json()).then(list=>{ setItems(list); setLoading(false) }).catch(()=> setLoading(false))
    }
    window.addEventListener('sfera:filters', onFilters)
    return ()=> window.removeEventListener('sfera:filters', onFilters)
  }, [])

  function onFocus(ev){
    const detail = { id: ev.id, lat: Number(ev.lat), lon: Number(ev.lon), title: ev.title, description: ev.description }
    const event = new CustomEvent('sfera:focus', { detail })
    window.dispatchEvent(event)
  }

  return (
    <div className="activity-list">
      <Calendar events={items} onSelectDay={setSelectedDay} />
      <h3>События</h3>
      {selectedDay && <div className="muted">Показываются события на {new Date(selectedDay).toLocaleDateString()}</div>}
      {loading && <div className="muted">Загрузка...</div>}
      {!loading && items.length === 0 && <div className="muted">Событий не найдено</div>}
      {items.filter(it=>{ if(!selectedDay) return true; return (new Date(it.created_at)).toISOString().slice(0,10) === selectedDay }).map(it=> <ActivityCard key={it.id} ev={it} onFocus={onFocus} />)}
    </div>
  )
}
