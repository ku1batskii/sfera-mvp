const Database = require('better-sqlite3');

const db = new Database('data/db.sqlite');

// Make all events visible
const updateStmt = db.prepare('UPDATE events SET visible = 1 WHERE visible = 0');
const result = updateStmt.run();
console.log(`Updated ${result.changes} events to visible`);

console.log('\nVisible events:');
const visibleEvents = db.prepare('SELECT id, title, visible FROM events WHERE visible = 1').all();
console.log(JSON.stringify(visibleEvents, null, 2));

db.close();
