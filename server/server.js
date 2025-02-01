const express = require("express");
const { Pool } = require("pg");

const app = express();

const dotenv = require("dotenv");
dotenv.config();
const { DATABASE_URL } = process.env;

const pool = new Pool({
  connectionString: DATABASE_URL
});

pool.connect()
    .then(() => console.log('Connected to PostgreSQL'))
    .catch(err => console.error('Connection error:', err));

app.get("/", (req, res) => {
  console.log("Hello there!");
  res.send("General Kenobi...");
});

app.get('/test-db', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM users');
    res.json(result.rows);
  } catch (err) {
    console.error('error in testing db', err);
    res.status(500).send('error in testing db');
  }
});

app.listen(3000, () => {
  console.log('server running on port 3000');
});
