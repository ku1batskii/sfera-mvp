import React, { useEffect, useState } from 'react'

export default function Filters(){
  const [city, setCity] = useState(() => localStorage.getItem('sfera_city') || 'alicante')
  const [category, setCategory] = useState(() => localStorage.getItem('sfera_category') || 'all')

  useEffect(()=>{
    // notify other components
    const ev = new CustomEvent('sfera:filters', { detail: { city, category } })
    window.dispatchEvent(ev)
    localStorage.setItem('sfera_city', city)
    localStorage.setItem('sfera_category', category)
  }, [city, category])

  return (
    <div className="filters">
      <label>Город</label>
      <select className="filter-select" value={city} onChange={e=>setCity(e.target.value)}>
        <option value="alicante">Alicante</option>
        <option value="moscow">Москва</option>
        <option value="spb">Санкт‑Петербург</option>
      </select>

      <label>Категория</label>
      <select className="filter-select" value={category} onChange={e=>setCategory(e.target.value)}>
        <option value="all">Все</option>
        <option value="music">Музыка</option>
        <option value="art">Арт</option>
        <option value="user">Пульс</option>
      </select>
    </div>
  )
}
