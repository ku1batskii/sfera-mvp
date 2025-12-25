const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');

const dbPath = path.resolve(__dirname, '..', 'data', 'db.sqlite');
const dir = path.dirname(dbPath);
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

const db = new Database(dbPath);

function init() {
  // create table if not exists
  db.prepare(`CREATE TABLE IF NOT EXISTS events (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    city TEXT,
    lat REAL,
    lon REAL,
    category TEXT,
    title TEXT,
    description TEXT,
    timestamp TEXT,
    created_at TEXT,
    visible INTEGER DEFAULT 0,
    flags INTEGER DEFAULT 0,
    ticket_price REAL DEFAULT 0,
    available_tickets INTEGER DEFAULT 0,
    sold_tickets INTEGER DEFAULT 0,
    interests TEXT
  )`).run();
  // sessions for Telegram auth
  db.prepare(`CREATE TABLE IF NOT EXISTS sessions (
    token TEXT PRIMARY KEY,
    telegram_id TEXT,
    first_name TEXT,
    auth_date TEXT,
    created_at TEXT
  )`).run();
  // contacts table for Telegram contacts database
  db.prepare(`CREATE TABLE IF NOT EXISTS contacts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    telegram_id TEXT NOT NULL UNIQUE,
    first_name TEXT,
    last_name TEXT,
    username TEXT,
    phone TEXT,
    interests TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`).run();
}

function getEvents(city=null) {
  if (city) return db.prepare('SELECT * FROM events WHERE city = ? AND visible = 1 ORDER BY created_at DESC').all(city);
  return db.prepare('SELECT * FROM events WHERE visible = 1 ORDER BY created_at DESC').all();
}

function insertEvent(ev) {
  const stmt = db.prepare('INSERT INTO events (id,user_id,city,lat,lon,category,title,description,timestamp,created_at,visible,flags,ticket_price,available_tickets,sold_tickets) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)');
  stmt.run(ev.id, ev.user_id, ev.city, ev.lat, ev.lon, ev.category, ev.title, ev.description, ev.timestamp, ev.created_at, ev.visible?1:0, ev.flags||0, ev.ticket_price||0, ev.available_tickets||0, ev.sold_tickets||0);
}

function getPendingEvents(){
  return db.prepare('SELECT * FROM events WHERE visible = 0 ORDER BY created_at ASC').all();
}

function approveEvent(id){
  return db.prepare('UPDATE events SET visible = 1 WHERE id = ?').run(id);
}

function flagEvent(id){
  return db.prepare('UPDATE events SET flags = flags + 1 WHERE id = ?').run(id);
}

function createSession(token, telegram_id, first_name, auth_date){
  const stmt = db.prepare('INSERT INTO sessions (token, telegram_id, first_name, auth_date, created_at) VALUES (?,?,?,?,?)');
  stmt.run(token, String(telegram_id), first_name || '', String(auth_date || ''), new Date().toISOString());
}

function getSessionByToken(token){
  return db.prepare('SELECT * FROM sessions WHERE token = ?').get(token);
}

function getLatestEventByUser(telegram_id){
  return db.prepare('SELECT * FROM events WHERE user_id = ? ORDER BY created_at DESC LIMIT 1').get(String(telegram_id));
}

function purchaseTickets(id, quantity){
  const event = db.prepare('SELECT * FROM events WHERE id = ?').get(id);
  if(!event) return { error: 'event not found' };
  if(event.available_tickets - event.sold_tickets < quantity) return { error: 'not enough tickets available' };

  const stmt = db.prepare('UPDATE events SET sold_tickets = sold_tickets + ? WHERE id = ?');
  stmt.run(quantity, id);
  return { success: true, remaining: event.available_tickets - event.sold_tickets - quantity };
}

// Contact management functions
function getContacts() {
  return db.prepare('SELECT * FROM contacts ORDER BY created_at DESC').all();
}

function getContactByTelegramId(telegram_id) {
  return db.prepare('SELECT * FROM contacts WHERE telegram_id = ?').get(String(telegram_id));
}

function insertContact(contact) {
  const stmt = db.prepare('INSERT OR REPLACE INTO contacts (telegram_id, first_name, last_name, username, phone, interests, updated_at) VALUES (?,?,?,?,?,?,?)');
  stmt.run(contact.telegram_id, contact.first_name || null, contact.last_name || null, contact.username || null, contact.phone || null, contact.interests || null, new Date().toISOString());
}

function updateContactInterests(telegram_id, interests) {
  const stmt = db.prepare('UPDATE contacts SET interests = ?, updated_at = ? WHERE telegram_id = ?');
  stmt.run(interests, new Date().toISOString(), String(telegram_id));
}

function deleteContact(telegram_id) {
  return db.prepare('DELETE FROM contacts WHERE telegram_id = ?').run(String(telegram_id));
}

init();

module.exports = { getEvents, insertEvent, createSession, getSessionByToken, getLatestEventByUser, purchaseTickets, getContacts, getContactByTelegramId, insertContact, updateContactInterests, deleteContact };

