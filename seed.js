const Database = require('better-sqlite3');
const { v4: uuidv4 } = require('uuid');

// Connect to database
const db = new Database('data/db.sqlite');

// Sample events data
const sampleEvents = [
  {
    id: uuidv4(),
    user_id: '123456789',
    city: 'Alicante',
    lat: 38.3452,
    lon: -0.481,
    category: 'music',
    title: 'Ночной концерт',
    description: 'Живая музыка, местные группы и уютная атмосфера.',
    timestamp: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours from now
    ticket_price: 15,
    available_tickets: 100,
    sold_tickets: 0,
    interests: 'music,live'
  },
  {
    id: uuidv4(),
    user_id: '123456789',
    city: 'Alicante',
    lat: 38.348,
    lon: -0.49,
    category: 'art',
    title: 'Мастер-класс по рисованию',
    description: 'Научитесь новым техникам и возьмите домой собственную работу.',
    timestamp: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // tomorrow
    ticket_price: 25,
    available_tickets: 20,
    sold_tickets: 0,
    interests: 'art,education'
  },
  {
    id: uuidv4(),
    user_id: '123456789',
    city: 'Alicante',
    lat: 38.341,
    lon: -0.475,
    category: 'exhibition',
    title: 'Арт-выставка города',
    description: 'Современное искусство от местных авторов.',
    timestamp: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(), // 3 hours from now
    ticket_price: 0,
    available_tickets: 0,
    sold_tickets: 0,
    interests: 'art,culture'
  },
  {
    id: uuidv4(),
    user_id: '123456789',
    city: 'Alicante',
    lat: 38.35,
    lon: -0.485,
    category: 'sports',
    title: 'Футбольный матч',
    description: 'Местная команда против гостей.',
    timestamp: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(), // 2 days from now
    ticket_price: 20,
    available_tickets: 500,
    sold_tickets: 0,
    interests: 'sports,football'
  },
  {
    id: uuidv4(),
    user_id: '123456789',
    city: 'Alicante',
    lat: 38.34,
    lon: -0.478,
    category: 'food',
    title: 'Фестиваль еды',
    description: 'Попробуйте блюда из разных стран мира.',
    timestamp: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString(), // 3 days from now
    ticket_price: 10,
    available_tickets: 200,
    sold_tickets: 0,
    interests: 'food,culture'
  }
];

// Insert sample events
const insertEvent = db.prepare(`
  INSERT INTO events (id, user_id, city, lat, lon, category, title, description, timestamp, created_at, ticket_price, available_tickets, sold_tickets, interests)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

sampleEvents.forEach(event => {
  insertEvent.run(
    event.id,
    event.user_id,
    event.city,
    event.lat,
    event.lon,
    event.category,
    event.title,
    event.description,
    event.timestamp,
    new Date().toISOString(),
    event.ticket_price,
    event.available_tickets,
    event.sold_tickets,
    event.interests
  );
});

console.log(`Inserted ${sampleEvents.length} sample events`);
db.close();
