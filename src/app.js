const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const db = require('./db');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());
// Serve static files (pages, assets, client build) from project root
// Serve built client if available, otherwise serve repo static files (pages/ etc.)
const clientDist = path.join(__dirname, '..', 'src', 'client', 'dist')
if (require('fs').existsSync(clientDist)) {
  app.use(express.static(clientDist))
  // serve index.html for SPA
  app.get('/', (req, res) => res.sendFile(path.join(clientDist, 'index.html')))
}
// Always serve static files from project root (for pages/, assets/, etc.)
app.use(express.static(path.join(__dirname, '..')));
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
// simple in-memory cache for aggregation responses
const _cache = Object.create(null);
const CACHE_TTL_MS = 30 * 1000; // 30s
const turf = require('@turf/turf');

// Health
app.get('/api/health', (req, res) => res.json({ ok: true }));

// Get events (simple) - supports optional city query
app.get('/api/events', (req, res) => {
  const city = req.query.city || null;
  const events = db.getEvents(city);
  res.json(events);
});

// Server-side hex aggregation endpoint
// Query params:
//  - city (optional)
//  - bbox=west,south,east,north (optional) if omitted we compute bbox from events
//  - cellSide (km, optional) default 0.5
app.get('/api/hex-aggregate', (req, res) => {
  try{
    const city = req.query.city || null;
    const cellSide = Math.max(0.1, Math.min(5, Number(req.query.cellSide) || 0.5));
    const bboxParam = req.query.bbox || '';
    const cacheKey = `${city||'all'}|${bboxParam}|${cellSide}`;
    const cached = _cache[cacheKey];
    if(cached && (Date.now() - cached.ts) < CACHE_TTL_MS){
      return res.json(cached.data);
    }
    const raw = db.getEvents(city);
    const items = raw.map(it=>({ lon: Number(it.lon), lat: Number(it.lat) })).filter(p=>!Number.isNaN(p.lat) && !Number.isNaN(p.lon));
    if(items.length === 0) return res.json({ type: 'FeatureCollection', features: [] });

    let bbox = null;
    if(req.query.bbox){
      const parts = req.query.bbox.split(',').map(Number);
      if(parts.length === 4 && parts.every(p=>!Number.isNaN(p))) bbox = parts;
    }
    if(!bbox){
      const lons = items.map(p=>p.lon); const lats = items.map(p=>p.lat);
      bbox = [Math.min(...lons), Math.min(...lats), Math.max(...lons), Math.max(...lats)];
    }

    const pts = turf.featureCollection(items.map(p=>turf.point([p.lon, p.lat])));
    const hexgrid = turf.hexGrid(bbox, cellSide, { units: 'kilometers' });
    // initialize counts
    hexgrid.features.forEach(f => f.properties = { count: 0 });
    pts.features.forEach(p=>{
      for(let i=0;i<hexgrid.features.length;i++){
        if(turf.booleanPointInPolygon(p, hexgrid.features[i])){ hexgrid.features[i].properties.count += 1; break }
      }
    });

    // simple color ramp
    function colorForCount(c){ if(!c || c<=0) return 'rgba(0,0,0,0)'; if(c<3) return '#ffd7a6'; if(c<6) return '#ffb36b'; if(c<12) return '#ff7a45'; return '#d63e2a' }
    hexgrid.features.forEach(h=> h.properties.color = colorForCount(h.properties.count));
    // cache result
    _cache[cacheKey] = { ts: Date.now(), data: hexgrid };
    res.json(hexgrid);
  }catch(err){ console.error('hex-aggregate error', err); res.status(500).json({ error: 'server error' }) }
});

// Post new event
app.post('/api/events', (req, res) => {
  try {
    const { city, lat, lon, category, title, description, timestamp, ticket_price, available_tickets, interests } = req.body;

    // token from Authorization header or body
    const authHeader = req.headers['authorization'] || '';
    let token = null;
    if (authHeader.startsWith('Bearer ')) token = authHeader.slice(7).trim();
    if (!token && req.body.token) token = req.body.token;
    if (!token) return res.status(401).json({ error: 'missing token' });

    // verify JWT
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) return res.status(500).json({ error: 'server missing JWT_SECRET' });
    let decoded;
    try { decoded = jwt.verify(token, jwtSecret); } catch(e){ return res.status(401).json({ error: 'invalid token' }); }
    const user_id = decoded && decoded.telegram_id;

    if (!user_id || !city || !lat || !lon) return res.status(400).json({ error: 'missing required' });

    // rate-limit: 1 event per 5 minutes per user
    const last = db.getLatestEventByUser(user_id);
    if (last){
      const lastTs = new Date(last.created_at).getTime();
      const now = Date.now();
      const diff = now - lastTs;
      const MIN_MS = 5 * 60 * 1000;
      if (diff < MIN_MS) return res.status(429).json({ error: 'rate_limited', retry_after: Math.ceil((MIN_MS - diff)/1000) });
    }

    const event = {
      id: uuidv4(),
      user_id,
      city,
      lat: Number(lat),
      lon: Number(lon),
      category: category || null,
      title: title || null,
      description: description || null,
      timestamp: timestamp || new Date().toISOString(),
      created_at: new Date().toISOString(),
      ticket_price: ticket_price || 0,
      available_tickets: available_tickets || 0,
      sold_tickets: 0,
      interests: interests || null
    };

    db.insertEvent(event);

    // broadcast via websocket if available
    const wss = app.locals.wss;
    const payload = JSON.stringify({ type: 'new_event', data: event });
    if (wss && wss.clients) {
      wss.clients.forEach(c => {
        if (c.readyState === 1) c.send(payload);
      });
    }

    res.status(201).json(event);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'server error' });
  }
});

// Flag an event (any user)
app.post('/api/events/:id/flag', (req, res) => {
  try{
    const id = req.params.id;
    db.flagEvent(id);
    res.json({ ok: true });
  }catch(e){ res.status(500).json({ error: 'server error' }) }
});

// Purchase tickets for an event
app.post('/api/events/:id/purchase', (req, res) => {
  try {
    const id = req.params.id;
    const { quantity } = req.body;

    // token from Authorization header or body
    const authHeader = req.headers['authorization'] || '';
    let token = null;
    if (authHeader.startsWith('Bearer ')) token = authHeader.slice(7).trim();
    if (!token && req.body.token) token = req.body.token;
    if (!token) return res.status(401).json({ error: 'missing token' });

    // verify JWT
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) return res.status(500).json({ error: 'server missing JWT_SECRET' });
    let decoded;
    try { decoded = jwt.verify(token, jwtSecret); } catch(e){ return res.status(401).json({ error: 'invalid token' }); }

    if (!quantity || quantity < 1) return res.status(400).json({ error: 'invalid quantity' });

    const result = db.purchaseTickets(id, quantity);
    if (result.error) return res.status(400).json({ error: result.error });

    res.json({ success: true, remaining_tickets: result.remaining });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'server error' });
  }
});

// Admin: list pending events (requires ADMIN_TOKEN header)
app.get('/api/admin/pending', (req,res)=>{
  const adminToken = req.headers['x-admin-token'] || req.query.admin_token;
  if (!process.env.ADMIN_TOKEN || adminToken !== process.env.ADMIN_TOKEN) return res.status(401).json({ error: 'unauthorized' });
  const list = db.getPendingEvents();
  res.json(list);
});

// Admin: approve event
app.post('/api/admin/events/:id/approve', (req,res)=>{
  const adminToken = req.headers['x-admin-token'] || req.body.admin_token;
  if (!process.env.ADMIN_TOKEN || adminToken !== process.env.ADMIN_TOKEN) return res.status(401).json({ error: 'unauthorized' });
  const id = req.params.id;
  db.approveEvent(id);
  res.json({ ok: true });
});

// Telegram auth verification endpoint
// Expects full Telegram widget payload in POST body (id, first_name, auth_date, hash, etc.)
app.post('/api/auth/telegram', (req, res) => {
  try {
    const payload = req.body || {};
    const hash = payload.hash;
    if (!hash) return res.status(400).json({ error: 'missing hash' });

    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!botToken) return res.status(500).json({ error: 'server missing TELEGRAM_BOT_TOKEN' });

    // Build data_check_string from all fields except hash, sorted by key
    const checkParts = Object.keys(payload)
      .filter(k => k !== 'hash')
      .sort()
      .map(k => `${k}=${payload[k]}`);
    const dataCheckString = checkParts.join('\n');

    const secret = crypto.createHash('sha256').update(botToken).digest();
    const hmac = crypto.createHmac('sha256', secret).update(dataCheckString).digest('hex');

    if (hmac !== hash) return res.status(401).json({ error: 'invalid auth' });

    // Passed verification — create JWT
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) return res.status(500).json({ error: 'server missing JWT_SECRET' });

    const token = jwt.sign({ telegram_id: String(payload.id), first_name: payload.first_name || '' }, jwtSecret, { expiresIn: '7d' });
    // store session record (optional)
    db.createSession(token, String(payload.id), payload.first_name || '', String(payload.auth_date || ''));

    res.json({ token, telegram_id: payload.id, first_name: payload.first_name });
  } catch (err) {
    console.error('auth error', err);
    res.status(500).json({ error: 'server error' });
  }
});

module.exports = app;

if (typeof document !== 'undefined') {
  // Simple client-side sorting and filtering for the events timeline
  (function(){
    function qs(sel, ctx=document){return ctx.querySelector(sel)}
    function qsa(sel, ctx=document){return Array.from(ctx.querySelectorAll(sel))}

    document.addEventListener('DOMContentLoaded', ()=>{
      const timeline = qs('#timeline');
      if(!timeline) return;

      const sortSelect = qs('#sort-order');
      const cityTop = qs('#city-filter-top');
      const toggleGroup = qs('#toggle-group');

      function getItems(){ return qsa('.timeline-item'); }

      function sortItems(order='asc'){
        const items = getItems();
        items.sort((a,b)=>{
          const ta = new Date(a.dataset.time).getTime();
          const tb = new Date(b.dataset.time).getTime();
          return order === 'asc' ? ta - tb : tb - ta;
        });
        items.forEach(it => timeline.appendChild(it));
      }

      function filterByCity(city){
        const items = getItems();
        items.forEach(it => {
          if(!city || it.dataset.city === city) it.style.display = '';
          else it.style.display = 'none';
        });
      }

      // Initial sort ascending
      sortItems(sortSelect ? sortSelect.value : 'asc');

      if(sortSelect){
        sortSelect.addEventListener('change', ()=> sortItems(sortSelect.value));
      }

      if(cityTop){
        cityTop.addEventListener('change', ()=> filterByCity(cityTop.value));
      }

      if(toggleGroup){
        let grouped = false;
        toggleGroup.addEventListener('click', ()=>{
          grouped = !grouped;
          if(grouped) groupByDate();
          else ungroup();
          toggleGroup.textContent = grouped ? 'Сгруппировано' : 'Группировать по дате';
        });
      }

      function groupByDate(){
        // extract items, group by YYYY-MM-DD
        const items = getItems().filter(i=>i.style.display !== 'none');
        const groups = {};
        items.forEach(it=>{
          const d = new Date(it.dataset.time);
          const key = d.toISOString().slice(0,10);
          if(!groups[key]) groups[key]=[];
          groups[key].push(it);
        });
        // clear timeline
        timeline.innerHTML = '';
        Object.keys(groups).sort().forEach(key=>{
          const hdr = document.createElement('div'); hdr.className='timeline-date'; hdr.textContent = (new Date(key)).toLocaleDateString();
          timeline.appendChild(hdr);
          groups[key].forEach(it=> timeline.appendChild(it));
        });
      }

      function ungroup(){
        // simply re-sort and append items
        sortItems(sortSelect ? sortSelect.value : 'asc');
      }
    });
  })();
}
