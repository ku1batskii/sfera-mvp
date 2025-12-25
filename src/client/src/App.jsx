import React from 'react'
import MapView from './components/MapView'
import TelegramLogin from './components/TelegramLogin'
import ActivityList from './components/ActivityList'
import Filters from './components/Filters'
import AdminPanel from './components/AdminPanel'
import './styles.css'

export default function App(){
  return (
    <div className="app-root">
      <header className="app-header">
        <div className="brand">Sfera — Alicante</div>
        <div className="header-actions"><TelegramLogin /></div>
        <div className="header-admin"><AdminPanel /></div>
      </header>

      <div className="app-body">
        <aside className="app-sidebar">
          <Filters />
          <ActivityList />
        </aside>

        <section className="app-map">
          <MapView />
        </section>
      </div>
    </div>
  )
}
