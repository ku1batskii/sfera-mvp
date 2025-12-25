const Database = require('better-sqlite3');

const db = new Database('data/db.sqlite');

console.log('All events:');
const events = db.prepare('SELECT * FROM events').all();
console.log(JSON.stringify(events, null, 2));

console.log('\nVisible events:');
const visibleEvents = db.prepare('SELECT * FROM events WHERE visible = 1').all();
console.log(JSON.stringify(visibleEvents, null, 2));

db.close();
