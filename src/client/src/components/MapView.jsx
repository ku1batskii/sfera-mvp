import React, {useEffect, useRef, useState} from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import 'leaflet.heat'
import 'leaflet.markercluster'
import * as turf from '@turf/turf'

export default function MapView(){
  const mapRef = useRef(null)
  const [timeWindow, setTimeWindow] = useState('24h')

  useEffect(()=>{
    if (mapRef.current) return; // prevent multiple initializations
    const map = L.map('sfera-map').setView([38.3452, -0.4810], 13)
    mapRef.current = map
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{ attribution: '&copy; OpenStreetMap contributors' }).addTo(map)

    const heatPoints = []
    const heat = L.heatLayer(heatPoints, { radius: 25, blur: 18, maxZoom: 17 }).addTo(map)
    const clusterGroup = L.markerClusterGroup()
    clusterGroup.addTo(map)
    const markersById = new Map()
    const hexLayer = L.geoJSON(null, { style: f=>({ fillColor: f.properties && f.properties.color ? f.properties.color : 'transparent', fillOpacity: 0.45, weight:0 }), onEachFeature: (f,layer)=>{ if(f.properties && f.properties.count) layer.bindPopup(`${f.properties.count} activity(s)`) } }).addTo(map)

    let cache = []
    async function load(){
      try{
        const city = localStorage.getItem('sfera_city') || null
        const category = localStorage.getItem('sfera_category') || null
        const qs = new URLSearchParams()
        if(city) qs.set('city', city)
        if(category && category !== 'all') qs.set('category', category)
        const url = '/api/events' + (qs.toString() ? ('?' + qs.toString()) : '')
        const res = await fetch(url)
        const list = await res.json()
        cache = list.map(it=>({ lat: Number(it.lat), lon: Number(it.lon), ts: new Date(it.created_at).getTime(), raw: it }))
        heatPoints.length = 0
        list.forEach(it=> heatPoints.push([it.lat, it.lon, 0.6]))
        heat.setLatLngs(heatPoints)
        // prefer server-side hex aggregation for consistency
        try{
          const hexRes = await fetch('/api/hex-aggregate' + (qs.toString() ? ('?' + qs.toString()) : ''))
          if(hexRes.ok){ const hexJson = await hexRes.json(); hexLayer.clearLayers(); hexLayer.addData(hexJson) }
        }catch(err){ console.warn('hex fetch failed', err) }
        renderMarkers()
      }catch(e){ console.error('load events', e) }
    }
    load()

    function filterByTime(items){
      const now = Date.now(); let cutoff = 0
      if(timeWindow === '1h') cutoff = now - 3600*1000
      else if(timeWindow === '6h') cutoff = now - 6*3600*1000
      else if(timeWindow === '24h') cutoff = now - 24*3600*1000
      else if(timeWindow === '7d') cutoff = now - 7*24*3600*1000
      return items.filter(i=>i.ts >= cutoff)
    }

    function colorForCount(c){ if(!c || c<=0) return 'rgba(0,0,0,0)'; if(c<3) return '#ffd7a6'; if(c<6) return '#ffb36b'; if(c<12) return '#ff7a45'; return '#d63e2a' }

    function renderHexes(){
      const items = filterByTime(cache)
      if(items.length === 0){ hexLayer.clearLayers(); return }
      const pts = turf.featureCollection(items.map(i=>turf.point([i.lon, i.lat])))
      const b = map.getBounds(); const bbox = [b.getWest(), b.getSouth(), b.getEast(), b.getNorth()]
      const cellSide = Math.max(0.2, Math.min(1, 20 / Math.max(map.getZoom(), 1)))
      const hexgrid = turf.hexGrid(bbox, cellSide, {units:'kilometers'})
      hexgrid.features.forEach(h=> h.properties.count = 0)
      pts.features.forEach(p=>{
        for(let i=0;i<hexgrid.features.length;i++){
          if(turf.booleanPointInPolygon(p, hexgrid.features[i])){ hexgrid.features[i].properties.count += 1; break }
        }
      })

      function onFilters(e){ load() }
      window.addEventListener('sfera:filters', onFilters)
      hexgrid.features.forEach(h=> h.properties.color = colorForCount(h.properties.count))
      hexLayer.clearLayers(); hexLayer.addData(hexgrid)
    }

    function renderMarkers(){
      clusterGroup.clearLayers()
      markersById.clear()
      const items = filterByTime(cache)
      items.forEach(it=>{
        const m = L.circleMarker([it.lat, it.lon], { radius:6, color:'#2b8cbe', fillOpacity:0.9 })
        const bot = (window && window.SFERA_BOT_USERNAME) ? window.SFERA_BOT_USERNAME : 'sfera_bot'
        const popupHtml = `<strong>${it.raw.title||'Событие'}</strong><div>${it.raw.description||''}</div><div><small>${new Date(it.ts).toLocaleString()}</small></div><div style="margin-top:6px"><a href="https://t.me/${bot}" target="_blank" rel="noreferrer" style="color:#007bff">Открыть в Telegram</a></div>`
        m.bindPopup(popupHtml)
        // store id for fast lookup
        try{ if(it.raw && it.raw.id) markersById.set(String(it.raw.id), m) }catch(e){}
        clusterGroup.addLayer(m)
      })
    }

    function focusOnEvent(detail){
      if(!detail) return
      const { id, lat, lon } = detail || {}
      let marker = null
      if(id) marker = markersById.get(String(id))
      if(!marker && lat && lon){
        // fallback: find nearest marker by coordinates (small tolerance)
        const layers = clusterGroup.getLayers()
        for(let i=0;i<layers.length;i++){
          const ll = layers[i].getLatLng()
          if(Math.abs(ll.lat - lat) < 0.0005 && Math.abs(ll.lng - lon) < 0.0005){ marker = layers[i]; break }
        }
      }
      if(marker){
        clusterGroup.zoomToShowLayer(marker, ()=>{
          try{ marker.openPopup() }catch(e){}
          // pulse highlight: temporary expanding circle
          try{
            const latlng = marker.getLatLng()
            const pulse = L.circle(latlng, { radius: 10, color: '#ff5b5b', weight:2, fillOpacity:0 }).addTo(map)
            let r = 10
            const step = 25
            const id = setInterval(()=>{
              r += step; try{ pulse.setRadius(r); pulse.setStyle({ opacity: Math.max(0, 1 - (r-10)/250) }) }catch(e){}
            }, 50)
            setTimeout(()=>{ clearInterval(id); try{ map.removeLayer(pulse) }catch(e){} }, 700)
          }catch(e){ console.warn('pulse failed', e) }
        })
      } else if(lat && lon){
        map.setView([lat, lon], Math.max(map.getZoom(),15), { animate:true })
      }
    }

    const protocol = location.protocol === 'https:' ? 'wss' : 'ws'
    // prefer same origin (host:port) so it works when served from Express
    const wsUrl = protocol + '://' + location.host
    const ws = new WebSocket(wsUrl)
    ws.addEventListener('message', (ev)=>{
      try{
        const msg = JSON.parse(ev.data)
        if(msg.type === 'new_event' && msg.data && msg.data.lat){
          const lat = Number(msg.data.lat), lon = Number(msg.data.lon)
          cache.push({ lat, lon, ts: new Date(msg.data.created_at).getTime(), raw: msg.data })
          heatPoints.push([lat, lon, 0.6]); heat.setLatLngs(heatPoints)
          renderHexes(); renderMarkers()
        }
      }catch(e){console.error(e)}
    })

    function reportAtCenter(){
      const token = localStorage.getItem('sfera_token');
      if(!token){ alert('Please login with Telegram first'); return }
      const center = map.getCenter();
      const title = prompt('Короткое название события', 'Пульс здесь'); if(!title) return;
      const ticketPrice = prompt('Цена билета (€)', '0') || '0';
      const availableTickets = prompt('Количество доступных билетов', '0') || '0';
      fetch('/api/events', { method:'POST', headers:{ 'Content-Type':'application/json', 'Authorization':'Bearer '+token }, body: JSON.stringify({ city:'alicante', lat:center.lat, lon:center.lng, title, category:'user', description:'', ticket_price: parseFloat(ticketPrice), available_tickets: parseInt(availableTickets) }) })
        .then(r=>{ if(r.status===201){ alert('Событие отправлено') } else r.json().then(j=>alert('Ошибка: '+(j.error||'unknown'))) }).catch(()=>alert('network error'))
    }
    const reportBtn = L.control({position:'topright'});
    reportBtn.onAdd = ()=>{
      const el = L.DomUtil.create('button','report-btn');
      el.innerHTML='Отметить пульс';
      el.style.padding='8px 10px';
      el.style.background='#007bff';
      el.style.color='#fff';
      el.style.border='none';
      el.style.borderRadius='8px';
      el.style.cursor='pointer';
      el.onclick = ()=>{
        const token = localStorage.getItem('sfera_token');
        if(!token){ alert('Please login with Telegram first'); return }
        const center = map.getCenter();
        const title = prompt('Короткое название события', 'Пульс здесь');
        if(!title) return;
        const interests = prompt('Интересы (через запятую)', 'networking,events');
        const ticketPrice = prompt('Цена билета (€)', '0') || '0';
        const availableTickets = prompt('Количество доступных билетов', '0') || '0';
        fetch('/api/events', {
          method:'POST',
          headers:{ 'Content-Type':'application/json', 'Authorization':'Bearer '+token },
          body: JSON.stringify({
            city:'alicante',
            lat:center.lat,
            lon:center.lng,
            title,
            category:'user',
            description:'',
            interests: interests ? interests.split(',').map(i=>i.trim()) : null,
            ticket_price: parseFloat(ticketPrice),
            available_tickets: parseInt(availableTickets)
          })
        })
        .then(r=>{ if(r.status===201){ alert('Событие отправлено') } else r.json().then(j=>alert('Ошибка: '+(j.error||'unknown'))) }).catch(()=>alert('network error'))
      };
      return el;
    }
    reportBtn.addTo(map)

    // geolocation quick button
    const geoBtn = L.control({position:'topright'});
    geoBtn.onAdd = ()=>{
      const el = L.DomUtil.create('button','geo-btn'); el.innerHTML='Моё местоположение';
      el.style.padding='6px 8px'; el.style.marginTop='6px'; el.style.background='#28a745'; el.style.color='#fff'; el.style.border='none'; el.style.borderRadius='6px'; el.style.cursor='pointer';
      el.onclick = ()=>{
        if(navigator.geolocation){ navigator.geolocation.getCurrentPosition(pos=>{ map.setView([pos.coords.latitude, pos.coords.longitude], 15, { animate:true }) }, ()=>alert('Не удалось получить геолокацию')) }
        else alert('Geolocation not supported')
      };
      return el;
    }
    geoBtn.addTo(map)

    // legend control + layer toggles
    const legend = L.control({position:'bottomright'});
    legend.onAdd = ()=>{
      const div = L.DomUtil.create('div','map-legend');
      div.style.background='#fff'; div.style.padding='8px'; div.style.borderRadius='6px'; div.style.boxShadow='0 1px 6px rgba(0,0,0,0.12)';
      const grades = [0,1,3,6,12];
      const labels = [];
      labels.push('<strong>Активность</strong>');
      for(let i=0;i<grades.length;i++){
        const from = grades[i];
        const to = grades[i+1]-1 || '+';
        const color = colorForCount(from+1);
        labels.push(`<div style="display:flex;align-items:center;margin:4px 0"><span style="width:16px;height:12px;background:${color};display:inline-block;margin-right:8px;border-radius:2px"></span><span style="font-size:12px">${from}${to==='+'?'+': ' - '+to}</span></div>`)
      }
      labels.push('<hr style="margin:8px 0;border:none;border-top:1px solid #eee"/>')
      labels.push('<div style="font-size:12px;margin-bottom:6px"><label><input type="checkbox" id="toggle-hex" checked/> Хекс</label></div>')
      labels.push('<div style="font-size:12px;margin-bottom:6px"><label><input type="checkbox" id="toggle-heat" checked/> Тепло</label></div>')
      labels.push('<div style="font-size:12px"><label><input type="checkbox" id="toggle-cluster" checked/> Кластеры</label></div>')
      div.innerHTML = labels.join('')
      setTimeout(()=>{
        const hexCb = div.querySelector('#toggle-hex');
        const heatCb = div.querySelector('#toggle-heat');
        const clusterCb = div.querySelector('#toggle-cluster');
        if(hexCb) hexCb.addEventListener('change', (e)=>{ if(e.target.checked) hexLayer.addTo(map); else hexLayer.remove() })
        if(heatCb) heatCb.addEventListener('change', (e)=>{ if(e.target.checked) heat.addTo(map); else heat.remove() })
        if(clusterCb) clusterCb.addEventListener('change', (e)=>{ if(e.target.checked) map.addLayer(clusterGroup); else map.removeLayer(clusterGroup) })
      }, 20)
      return div;
    }
    legend.addTo(map)

    // first-run hint (dismissible)
    if(!localStorage.getItem('sfera_seen_hint')){
      const hint = L.control({ position: 'topleft' })
      hint.onAdd = ()=>{
        const d = L.DomUtil.create('div','sfera-hint')
        d.style.background = '#fff'; d.style.padding='8px'; d.style.borderRadius='6px'; d.style.boxShadow='0 1px 6px rgba(0,0,0,0.12)'; d.style.maxWidth='220px';
        d.innerHTML = `<div style="font-size:13px">Кликните карточку в списке, чтобы увидеть событие на карте.<div style="margin-top:6px;text-align:right"><button id="sfera-hint-ok" style="background:#007bff;color:#fff;border:none;padding:6px 8px;border-radius:6px;cursor:pointer">Понял</button></div></div>`
        setTimeout(()=>{ const btn = d.querySelector('#sfera-hint-ok'); if(btn) btn.addEventListener('click', ()=>{ try{ hint.remove() }catch(e){}; localStorage.setItem('sfera_seen_hint','1') }) }, 30)
        return d
      }
      hint.addTo(map)
    }

    const control = L.control({position:'topright'})
    control.onAdd = ()=>{
      const wrap = L.DomUtil.create('div','time-controls'); wrap.style.background='#fff'; wrap.style.padding='6px'; wrap.style.borderRadius='8px'
      ['1h','6h','24h','7d'].forEach(tw=>{ const b = L.DomUtil.create('button','time-btn',wrap); b.innerHTML=tw; b.style.margin='2px'; b.style.padding='6px'; b.onclick = ()=>{ setTimeWindow(tw); renderHexes(); renderMarkers(); } })
      return wrap
    }
    control.addTo(map)

    function onFocus(e){ focusOnEvent(e.detail) }
    window.addEventListener('sfera:focus', onFocus)

    return ()=>{ window.removeEventListener('sfera:focus', onFocus); ws.close(); map.remove() }
  }, [timeWindow])

  return <div style={{height:'100%', width:'100%'}} id="sfera-map" />
}
