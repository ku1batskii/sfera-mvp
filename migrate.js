const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

// Create data directory if it doesn't exist
if (!fs.existsSync('data')) {
  fs.mkdirSync('data');
}

// Connect to database
const db = new Database('data/db.sqlite');

// Read and execute migration files
const migrations = [
  'migrations/001_create_events.sql',
  'migrations/002_add_ticket_fields.sql',
  'migrations/003_add_contacts_and_interests.sql'
];

migrations.forEach(migration => {
  if (fs.existsSync(migration)) {
    console.log(`Running migration: ${migration}`);
    const sql = fs.readFileSync(migration, 'utf8');
    db.exec(sql);
  } else {
    console.log(`Migration file not found: ${migration}`);
  }
});

console.log('Migrations completed successfully');
db.close();
