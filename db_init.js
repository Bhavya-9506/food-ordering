// server.js
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

const db = new sqlite3.Database('./db/database.db', (err) => {
  if (err) return console.error(err.message);
  console.log('Connected to database.db');
});

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS menu (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    price REAL
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS cart (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    item_id INTEGER,
    quantity INTEGER,
    FOREIGN KEY(item_id) REFERENCES menu(id)
  )`);

  db.run(`DELETE FROM menu`);
  const items = [
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
  items.forEach(([name, price]) => {
    db.run(`INSERT INTO menu (name, price) VALUES (?, ?)`, [name, price]);
  });
});

// API routes
app.get('/menu', (req, res) => {
  db.all('SELECT * FROM menu', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/cart', (req, res) => {
  const { item_id, quantity } = req.body;
  db.run('INSERT INTO cart (item_id, quantity) VALUES (?, ?)', [item_id, quantity], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Added to cart', cart_id: this.lastID });
  });
});

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

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
