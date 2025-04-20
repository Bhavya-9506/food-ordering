// server.js

const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const PORT = 3000;

// Middleware
app.use(bodyParser.json());
app.use(express.static('public'));

// Database setup
const dbPath = path.join(__dirname, 'db', 'database.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) return console.error("DB Connection Error:", err.message);
  console.log("Connected to SQLite database at db/database.db");
});

// Create tables and seed data
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS menu (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      price REAL NOT NULL
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS cart (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      item_id INTEGER,
      quantity INTEGER,
      FOREIGN KEY (item_id) REFERENCES menu(id)
    )
  `);

  const menuItems = [
    ['Pizza', 10.99],
    ['Burger', 7.49],
    ['Pasta', 8.99],
    ['Fries', 3.99],
    ['Sushi', 12.99],
    ['Tacos', 6.99],
    ['Sandwich', 5.49],
    ['Salad', 4.99],
    ['Noodles', 7.99],
    ['Chicken Wings', 9.49]
  ];

  // Clear old and insert new menu items
  db.run('DELETE FROM menu', () => {
    const insertStmt = db.prepare('INSERT INTO menu (name, price) VALUES (?, ?)');
    menuItems.forEach(([name, price]) => insertStmt.run(name, price));
    insertStmt.finalize();
  });
});

// API to get menu items
app.get('/menu', (req, res) => {
  db.all('SELECT * FROM menu', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// API to add to cart
app.post('/cart', (req, res) => {
  const { item_id, quantity } = req.body;
  if (!item_id || !quantity) {
    return res.status(400).json({ error: 'Missing item_id or quantity' });
  }
  const stmt = `INSERT INTO cart (item_id, quantity) VALUES (?, ?)`;
  db.run(stmt, [item_id, quantity], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Item added to cart', cart_id: this.lastID });
  });
});

// API to get cart details with item info
app.get('/cart', (req, res) => {
  const query = `
    SELECT cart.id, menu.name, menu.price, cart.quantity
    FROM cart
    JOIN menu ON cart.item_id = menu.id
  `;
  db.all(query, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
